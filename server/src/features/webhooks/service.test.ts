import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    organization: { findUnique: vi.fn() },
    organizationMember: { findUnique: vi.fn() },
    apiToken: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    webhook: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
    webhookLog: { create: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock('@/utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { prisma } from '@/lib/prisma.js';
import {
  hashToken,
  signPayload,
  validateApiToken,
  createWebhook,
  assertPublicWebhookUrl,
} from './service.js';
import { WebhookError } from './service.js';

describe('SSRF guard for webhook URLs', () => {
  it('accepts public https URLs', () => {
    expect(() => assertPublicWebhookUrl('https://hooks.example.com/x')).not.toThrow();
  });

  it('rejects localhost, metadata, and internal hostnames', () => {
    expect(() => assertPublicWebhookUrl('http://localhost:8080/hook')).toThrow(WebhookError);
    expect(() =>
      assertPublicWebhookUrl('http://metadata.google.internal/computeMetadata/v1/'),
    ).toThrow(WebhookError);
    expect(() => assertPublicWebhookUrl('https://my.service.internal/hook')).toThrow(WebhookError);
  });

  it('rejects private/metadata IPv4 ranges', () => {
    expect(() => assertPublicWebhookUrl('http://169.254.169.254/latest/meta-data')).toThrow(
      WebhookError,
    );
    expect(() => assertPublicWebhookUrl('http://10.0.0.5/hook')).toThrow(WebhookError);
    expect(() => assertPublicWebhookUrl('http://192.168.1.1/hook')).toThrow(WebhookError);
    expect(() => assertPublicWebhookUrl('http://172.16.0.9/hook')).toThrow(WebhookError);
    expect(() => assertPublicWebhookUrl('http://127.0.0.1/hook')).toThrow(WebhookError);
  });

  it('rejects loopback/unique-local IPv6 and non-http protocols', () => {
    expect(() => assertPublicWebhookUrl('http://[::1]/hook')).toThrow(WebhookError);
    expect(() => assertPublicWebhookUrl('http://[fd00::1]/hook')).toThrow(WebhookError);
    expect(() => assertPublicWebhookUrl('file:///etc/passwd')).toThrow(WebhookError);
    expect(() => assertPublicWebhookUrl('not a url')).toThrow(WebhookError);
  });
});

describe('webhooks service (Phase 6 D4 + V3/F7)', () => {
  it('hashes tokens deterministically and signs payloads with HMAC', () => {
    expect(hashToken('fw_abc')).toBe(hashToken('fw_abc'));
    expect(hashToken('fw_abc')).not.toBe(hashToken('fw_abd'));
    expect(signPayload('secret', '{"a":1}')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rejects bearer tokens with the wrong prefix or org', async () => {
    vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
    await expect(validateApiToken('demo', 'bad-token', 'analytics:read')).resolves.toBeNull();
    await expect(validateApiToken('demo', undefined, 'analytics:read')).resolves.toBeNull();
  });

  it('rejects expired tokens', async () => {
    vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 'org-1' } as never);
    vi.mocked(prisma.apiToken.findUnique).mockResolvedValue({
      id: 't1',
      organizationId: 'org-1',
      scopes: ['analytics:read'],
      expiresAt: new Date(Date.now() - 1000),
    } as never);
    await expect(validateApiToken('demo', 'fw_expired', 'analytics:read')).resolves.toBeNull();
  });

  it('gates webhook creation to owner/admin members', async () => {
    vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({ role: 'member' } as never);
    await expect(
      createWebhook('org-1', 'user-1', {
        url: 'https://x.example/hook',
        events: ['feedback.high_urgency'],
      }),
    ).rejects.toThrow('Forbidden');
  });

  it('always generates the signing secret server-side, ignoring client secrets', async () => {
    vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({ role: 'owner' } as never);
    vi.mocked(prisma.webhook.create).mockResolvedValue({
      id: 'wh-1',
      url: 'https://x.example/hook',
      events: ['feedback.high_urgency'],
      active: true,
      createdAt: new Date(),
    } as never);
    await createWebhook('org-1', 'user-1', {
      url: 'https://x.example/hook',
      events: ['feedback.high_urgency'],
      secret: '12345678', // weak client-supplied secret must be ignored
    });
    const arg = vi.mocked(prisma.webhook.create).mock.calls[0][0];
    expect(arg.data.secret).toBeDefined();
    expect(arg.data.secret).not.toBe('12345678');
    expect(String(arg.data.secret)).toMatch(/^[0-9a-f]{48}$/);
  });

  it('rejects webhook URLs that fail the SSRF guard at creation', async () => {
    vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({ role: 'owner' } as never);
    vi.mocked(prisma.webhook.create).mockClear();
    await expect(
      createWebhook('org-1', 'user-1', {
        url: 'http://169.254.169.254/latest/meta-data',
        events: ['feedback.high_urgency'],
      }),
    ).rejects.toThrow('private network');
    expect(prisma.webhook.create).not.toHaveBeenCalled();
  });
});
