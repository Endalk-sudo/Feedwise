import { createHash, createHmac, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma.js';
import logger from '@/utils/logger.js';

export class WebhookError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'WebhookError';
  }
}

/**
 * SSRF guard for webhook destinations (Slice 6 #4). Members must not be able
 * to make the server POST signed JSON to infrastructure targets: cloud
 * metadata endpoints, localhost, or private-link addresses. A webhook whose
 * host resolves into these ranges is rejected at create time; pushWebhookEvent
 * re-checks at push time so a DNS rebinding or stale row can't slip through.
 */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
]);

function isPrivateIpv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if ([a, b, Number(m[3]), Number(m[4])].some((n) => n > 255)) return true; // malformed
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local incl. AWS metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateIpv6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, '').toLowerCase();
  // loopback (::1), unspecified (::), link-local fe80::/10, unique-local fc00::/7
  return h === '::1' || h === '::' || h.startsWith('fe8') || h.startsWith('fe9') ||
    h.startsWith('fea') || h.startsWith('feb') || h.startsWith('fc') || h.startsWith('fd');
}

/** Throws WebhookError(400) when the URL targets a private/metadata resource. */
export function assertPublicWebhookUrl(rawUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new WebhookError(400, 'Invalid webhook URL');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new WebhookError(400, 'Webhook URL must use http or https');
  }
  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.localhost') || host.endsWith('.internal')) {
    throw new WebhookError(400, 'Webhook URL must not target internal or metadata addresses');
  }
  if (isPrivateIpv4(host) || isPrivateIpv6(host)) {
    throw new WebhookError(400, 'Webhook URL must not target private network addresses');
  }
}

/** SHA-256 hash for stored API tokens (plaintext is shown once at issuance). */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newToken(prefix = 'fw'): { token: string; tokenHash: string } {
  const token = `${prefix}_${randomBytes(24).toString('hex')}`;
  return { token, tokenHash: hashToken(token) };
}

export function signPayload(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

/** Issue a scoped token (owner/admin only). Returns plaintext once. */
export async function issueApiToken(
  organizationId: string,
  data: { name?: string; scopes?: string[]; expiresInDays?: number },
): Promise<{ id: string; token: string; prefix: string; scopes: string[]; expiresAt: Date | null }> {
  const { token, tokenHash } = newToken();
  const created = await prisma.apiToken.create({
    data: {
      organizationId,
      name: data.name?.slice(0, 80) || 'integration',
      tokenHash,
      tokenPrefix: token.slice(0, 12),
      scopes: data.scopes?.slice(0, 10) ?? ['feedback:read', 'analytics:read'],
      expiresAt: data.expiresInDays ? new Date(Date.now() + data.expiresInDays * 86400000) : null,
    },
  });
  return {
    id: created.id,
    token,
    prefix: created.tokenPrefix,
    scopes: created.scopes,
    expiresAt: created.expiresAt,
  };
}

export async function listApiTokens(organizationId: string) {
  return prisma.apiToken.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, tokenPrefix: true, scopes: true, expiresAt: true, lastUsedAt: true, createdAt: true },
  });
}

export async function revokeApiToken(organizationId: string, id: string): Promise<void> {
  await prisma.apiToken.deleteMany({ where: { id, organizationId } });
}

/** Validate a bearer token for an org + scope. Null when invalid/expired. */
export async function validateApiToken(
  organizationSlug: string,
  bearer: string | undefined,
  scope: string,
): Promise<{ organizationId: string } | null> {
  if (!bearer || !bearer.startsWith('fw_')) return null;
  const org = await prisma.organization.findUnique({ where: { slug: organizationSlug } });
  if (!org) return null;
  const row = await prisma.apiToken.findUnique({ where: { tokenHash: hashToken(bearer) } });
  if (!row || row.organizationId !== org.id) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;
  if (!row.scopes.includes(scope) && !row.scopes.includes('*')) return null;
  await prisma.apiToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return { organizationId: org.id };
}

/** Owner/admin-gated webhook CRUD. */
export async function listWebhooks(organizationId: string) {
  return prisma.webhook.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, url: true, events: true, active: true, createdAt: true },
  });
}

async function requireManager(organizationId: string, userId: string): Promise<void> {
  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    throw new WebhookError(403, 'Forbidden - owner/admin only');
  }
}

export async function createWebhook(
  organizationId: string,
  userId: string,
  data: { url: string; events: string[]; secret?: string },
) {
  await requireManager(organizationId, userId);
  assertPublicWebhookUrl(data.url);
  // Always generate the signing secret server-side (Slice 6 #1): a member
  // choosing a weak secret would make signatures forgeable. Client-supplied
  // secrets are ignored.
  return prisma.webhook.create({
    data: {
      organizationId,
      url: data.url,
      events: data.events,
      secret: randomBytes(24).toString('hex'),
    },
    select: { id: true, url: true, events: true, active: true, createdAt: true },
  });
}

export async function deleteWebhook(organizationId: string, id: string): Promise<void> {
  await prisma.webhook.deleteMany({ where: { id, organizationId } });
}

/** Signed push to subscribed webhooks; logs every attempt. */
export async function pushWebhookEvent(
  organizationId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<{ delivered: number; targets: number }> {
  const targets = await prisma.webhook.findMany({
    where: { organizationId, active: true, events: { has: event } },
  });
  if (targets.length === 0) return { delivered: 0, targets: 0 };
  const body = JSON.stringify({ event, organizationId, at: new Date().toISOString(), data: payload });
  let delivered = 0;
  for (const hook of targets) {
    // Re-check at push time: a webhook created before the guard existed, or a
    // public-looking hostname that has since been pointed at internal space
    // (DNS rebinding), must not be pushed to.
    try {
      assertPublicWebhookUrl(hook.url);
    } catch {
      logger.warn(`Skipping webhook ${hook.id} — URL now fails SSRF guard: ${hook.url}`);
      await prisma.webhookLog
        .create({ data: { organizationId, webhookId: hook.id, event, status: -1, attempts: 1 } })
        .catch(() => {});
      continue;
    }
    const signature = signPayload(hook.secret, body);
    try {
      const res = await fetch(hook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Feedwise-Signature': signature, 'X-Feedwise-Event': event },
        body,
        signal: AbortSignal.timeout(8000),
      });
      await prisma.webhookLog.create({
        data: { organizationId, webhookId: hook.id, event, status: res.status, attempts: 1 },
      });
      if (res.ok) delivered += 1;
    } catch (error) {
      logger.warn(`Webhook push failed (${hook.url}): ${(error as Error).message}`);
      await prisma.webhookLog
        .create({ data: { organizationId, webhookId: hook.id, event, status: 0, attempts: 1 } })
        .catch(() => {});
    }
  }
  return { delivered, targets: targets.length };
}

export async function listWebhookLogs(organizationId: string, limit = 20) {
  return prisma.webhookLog.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 50),
  });
}
