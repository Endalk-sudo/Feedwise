import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn() },
}));

vi.mock('@/utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    organization: { findUnique: vi.fn() },
    organizationMember: { findMany: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma.js';
import nodemailer from 'nodemailer';
import { env } from '@/lib/env.js';
import {
  isMailConfigured,
  sendMail,
  sendActionRoutedEmail,
  sendReferralRequestEmail,
  __setTransporterForTests,
} from './mail.js';

const mockedCreateTransport = vi.mocked(nodemailer.createTransport);

describe('mail', () => {
  const originalSmtpHost = env.SMTP_HOST;

  beforeEach(() => {
    vi.resetAllMocks();
    __setTransporterForTests(null);
  });

  afterEach(() => {
    env.SMTP_HOST = originalSmtpHost;
    __setTransporterForTests(null);
  });

  it('reports unconfigured when SMTP_HOST is empty', () => {
    env.SMTP_HOST = undefined;
    expect(isMailConfigured()).toBe(false);
  });

  it('skips sending without SMTP and never touches nodemailer', async () => {
    env.SMTP_HOST = undefined;
    const result = await sendMail({ to: 'a@x.com', subject: 'hi', html: '<p>hi</p>' });

    expect(result).toEqual({ sent: false, skipped: 'smtp-not-configured' });
    expect(mockedCreateTransport).not.toHaveBeenCalled();
  });

  it('sends via the transporter when SMTP is configured', async () => {
    env.SMTP_HOST = 'smtp.test';
    const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'm1' });
    __setTransporterForTests({ sendMail: sendMailMock } as never);

    const result = await sendMail({ to: ['a@x.com'], subject: 'Alert', html: '<p>x</p>' });

    expect(result).toEqual({ sent: true, messageId: 'm1' });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['a@x.com'], subject: 'Alert' }),
    );
  });

  it('returns send-failed instead of throwing when the transporter errors', async () => {
    env.SMTP_HOST = 'smtp.test';
    __setTransporterForTests({
      sendMail: vi.fn().mockRejectedValue(new Error('relay down')),
    } as never);

    const result = await sendMail({ to: 'a@x.com', subject: 'Alert', html: '<p>x</p>' });

    expect(result).toEqual({ sent: false, skipped: 'send-failed' });
  });

  it('routes Phase 4 action emails with the draft reply included', async () => {
    env.SMTP_HOST = 'smtp.test';
    const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'm2' });
    __setTransporterForTests({ sendMail: sendMailMock } as never);
    vi.mocked(prisma.organization.findUnique).mockResolvedValue({
      name: 'Demo',
      slug: 'demo',
      settings: {},
    } as never);
    vi.mocked(prisma.organizationMember.findMany).mockResolvedValue([
      { user: { email: 'owner@x.com' } },
    ] as never);

    const result = await sendActionRoutedEmail(
      'org-1',
      {
        id: 'f1', text: 'cold food', category: 'Food', urgency: 'High',
        concreteIssue: 'No heat lamps', draftReply: 'Sorry — fixing it.',
        createdAt: new Date(),
      },
      'http://x/dashboard',
    );

    expect(result).toEqual({ sent: true, messageId: 'm2' });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: ['owner@x.com'] }),
    );
  });

  it('skips Phase 7 referral emails when there are no recipients', async () => {
    env.SMTP_HOST = 'smtp.test';
    vi.mocked(prisma.organization.findUnique).mockResolvedValue(null as never);

    const result = await sendReferralRequestEmail(
      'org-1',
      [{ id: 'f1', text: 'great!', category: 'Service', createdAt: new Date() }],
      'http://x/dashboard',
    );

    expect(result).toEqual({ sent: false, skipped: 'no-recipients' });
  });
});
