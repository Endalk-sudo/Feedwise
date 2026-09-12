import nodemailer, { type Transporter } from 'nodemailer';
import { prisma } from '@/lib/prisma.js';
import { env } from '@/lib/env.js';
import logger from '@/utils/logger.js';

export interface MailResult {
  sent: boolean;
  messageId?: string;
  skipped?: string;
}

let transporter: Transporter | null = null;

/** SMTP configured? When false, all sends are logged + skipped (dev/test safe). */
export function isMailConfigured(): boolean {
  return Boolean(env.SMTP_HOST);
}

function getTransporter(): Transporter | null {
  if (!isMailConfigured()) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? '' } : undefined,
  });
  return transporter;
}

/** Test seam: inject a fake transporter. */
export function __setTransporterForTests(t: Transporter | null): void {
  transporter = t;
}

export async function sendMail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<MailResult> {
  const tx = getTransporter();
  if (!tx) {
    logger.warn(`Mail skipped (SMTP not configured): ${options.subject}`);
    return { sent: false, skipped: 'smtp-not-configured' };
  }
  try {
    const info = await tx.sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Mail send failed: ${(error as Error).message}`);
    return { sent: false, skipped: 'send-failed' };
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Recipient emails for an org (all members with a user email).
 * Digest honors the org settings opt-out: settings.emailDigest === false.
 */
export async function getOrgRecipientEmails(
  organizationId: string,
  opts: { respectDigestOptOut?: boolean } = {},
): Promise<{ emails: string[]; orgName: string }> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, slug: true, settings: true },
  });
  if (!org) return { emails: [], orgName: 'your business' };
  if (opts.respectDigestOptOut) {
    const settings = (org.settings ?? {}) as Record<string, unknown>;
    if (settings.emailDigest === false) return { emails: [], orgName: org.name };
  }
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: { user: { select: { email: true } } },
  });
  return { emails: members.map((m) => m.user.email), orgName: org.name };
}

export interface UrgencyAlertFeedback {
  id: string;
  text: string;
  category: string;
  sentiment: string | null;
  urgency: string | null;
  satisfactionEstimate: number | null;
  fixableProblem: boolean | null;
  concreteIssue: string | null;
  retentionRisk: string | null;
  createdAt: Date;
}

/** Immediate alert for High urgency or satisfaction collapse (Phase 1 fields). */
export async function sendHighUrgencyAlert(
  organizationId: string,
  feedback: UrgencyAlertFeedback,
  dashboardUrl: string,
): Promise<MailResult> {
  const { emails, orgName } = await getOrgRecipientEmails(organizationId);
  if (emails.length === 0) return { sent: false, skipped: 'no-recipients' };

  const subject = `🚨 Urgent feedback for ${orgName}: ${feedback.category}`;
  const snippet = escapeHtml(feedback.text.slice(0, 500));
  const satisfaction =
    feedback.satisfactionEstimate != null ? `${feedback.satisfactionEstimate}/5` : 'n/a';
  const html = `
    <h2>Urgent customer feedback — ${escapeHtml(orgName)}</h2>
    <p><strong>Category:</strong> ${escapeHtml(feedback.category)}
    <strong>Urgency:</strong> ${escapeHtml(feedback.urgency ?? 'n/a')}
    <strong>Satisfaction:</strong> ${escapeHtml(satisfaction)}
    <strong>Retention risk:</strong> ${escapeHtml(feedback.retentionRisk ?? 'n/a')}</p>
    ${
      feedback.fixableProblem && feedback.concreteIssue
        ? `<p><strong>Fixable issue:</strong> ${escapeHtml(feedback.concreteIssue)}</p>`
        : ''
    }
    <blockquote>${snippet}</blockquote>
    <p><a href="${escapeHtml(dashboardUrl)}">Open in dashboard →</a></p>
  `;
  return sendMail({ to: emails, subject, html });
}

export interface DigestItem {
  id: string;
  text: string;
  category: string;
  urgency: string | null;
  satisfactionEstimate: number | null;
  retentionRisk: string | null;
  status: string;
  createdAt: Date;
}

/** Daily digest: yesterday's highs + open fixables + satisfaction snapshot. */
export async function sendDigestEmail(
  organizationId: string,
  items: DigestItem[],
  stats: { total24h: number; highUrgencyOpen: number; avgSatisfaction: number | null },
  dashboardUrl: string,
): Promise<MailResult> {
  const { emails, orgName } = await getOrgRecipientEmails(organizationId, {
    respectDigestOptOut: true,
  });
  if (emails.length === 0) return { sent: false, skipped: 'no-recipients' };

  const subject = `📊 Daily feedback digest — ${orgName} (${stats.total24h} new)`;
  const rows = items
    .slice(0, 10)
    .map(
      (i) =>
        `<li><strong>[${escapeHtml(i.urgency ?? 'n/a')}]</strong> ${escapeHtml(i.category)} — ${escapeHtml(i.text.slice(0, 160))}</li>`,
    )
    .join('');
  const html = `
    <h2>Daily digest — ${escapeHtml(orgName)}</h2>
    <p>${stats.total24h} new in 24h · ${stats.highUrgencyOpen} high-urgency open ·
    avg satisfaction ${stats.avgSatisfaction != null ? stats.avgSatisfaction.toFixed(1) + '/5' : 'n/a'}</p>
    ${rows ? `<ul>${rows}</ul>` : '<p>No notable items in the last 24h.</p>'}
    <p><a href="${escapeHtml(dashboardUrl)}">Open dashboard →</a></p>
  `;
  return sendMail({ to: emails, subject, html });
}

export interface ActionRoutedItem {
  id: string;
  text: string;
  category: string;
  urgency: string | null;
  concreteIssue: string | null;
  draftReply: string;
  createdAt: Date;
}

/** Phase 4 (D1): team routing email with the AI draft reply for one-tap action. */
export async function sendActionRoutedEmail(
  organizationId: string,
  item: ActionRoutedItem,
  dashboardUrl: string,
): Promise<MailResult> {
  const { emails, orgName } = await getOrgRecipientEmails(organizationId);
  if (emails.length === 0) return { sent: false, skipped: 'no-recipients' };

  const subject = `⚡ Action needed: ${item.category} feedback for ${orgName}`;
  const html = `
    <h2>Feedback routed for action — ${escapeHtml(orgName)}</h2>
    <p><strong>Category:</strong> ${escapeHtml(item.category)}
    <strong>Urgency:</strong> ${escapeHtml(item.urgency ?? 'n/a')}</p>
    ${item.concreteIssue ? `<p><strong>Fixable issue:</strong> ${escapeHtml(item.concreteIssue)}</p>` : ''}
    <blockquote>${escapeHtml(item.text.slice(0, 500))}</blockquote>
    <p><strong>Suggested reply (edit before sending):</strong></p>
    <blockquote>${escapeHtml(item.draftReply)}</blockquote>
    <p><a href="${escapeHtml(dashboardUrl)}">Accept / Resolve / Escalate →</a></p>
  `;
  return sendMail({ to: emails, subject, html });
}

export interface ReferralCandidate {
  id: string;
  text: string;
  category: string;
  createdAt: Date;
}

/** Phase 7 (F3): promoter follow-up — turn Positive + high-satisfaction rows into referrals. */
export async function sendReferralRequestEmail(
  organizationId: string,
  items: ReferralCandidate[],
  dashboardUrl: string,
): Promise<MailResult> {
  const { emails, orgName } = await getOrgRecipientEmails(organizationId, {
    respectDigestOptOut: true,
  });
  if (emails.length === 0 || items.length === 0) {
    return { sent: false, skipped: 'no-recipients' };
  }
  const rows = items
    .slice(0, 5)
    .map((i) => `<li>${escapeHtml(i.category)} — ${escapeHtml(i.text.slice(0, 160))}</li>`)
    .join('');
  const subject = `⭐ ${items.length} happy customer${items.length === 1 ? '' : 's'} — ask for a referral`;
  const html = `
    <h2>Promoters this week — ${escapeHtml(orgName)}</h2>
    <p>These customers left positive, high-satisfaction feedback. A short thank-you + review/referral ask converts them into revenue.</p>
    <ul>${rows}</ul>
    <p><a href="${escapeHtml(dashboardUrl)}">Open dashboard →</a></p>
  `;
  return sendMail({ to: emails, subject, html });
}

export function dashboardUrlFor(): string {
  return `${env.CLIENT_URL}/dashboard/feedback`;
}
