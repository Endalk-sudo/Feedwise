import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn() },
}));

vi.mock('@/utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import nodemailer from 'nodemailer';
import { env } from '@/lib/env.js';
import {
  isMailConfigured,
  sendMail,
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
});
