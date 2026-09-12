import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    organization: { findUnique: vi.fn() },
    organizationMember: { findUnique: vi.fn() },
    apiToken: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    webhook: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
    webhookLog: { create: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock('@/utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { prisma } from '@/lib/prisma.js';
import { hashToken, signPayload, validateApiToken, createWebhook } from './service.js';

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
      id: 't1', organizationId: 'org-1', scopes: ['analytics:read'],
      expiresAt: new Date(Date.now() - 1000),
    } as never);
    await expect(validateApiToken('demo', 'fw_expired', 'analytics:read')).resolves.toBeNull();
  });

  it('gates webhook creation to owner/admin members', async () => {
    vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({ role: 'member' } as never);
    await expect(
      createWebhook('org-1', 'user-1', { url: 'https://x.example/hook', events: ['feedback.high_urgency'] }),
    ).rejects.toThrow('Forbidden');
  });
});
