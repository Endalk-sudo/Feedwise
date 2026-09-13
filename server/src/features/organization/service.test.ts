import { describe, it, expect, vi, beforeEach } from 'vitest';
import { organizationService } from './service.js';
import { prisma } from '@/lib/prisma.js';

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organizationMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Avoid pulling the AI SDK chain (service.ts imports generateCategoriesForBusiness).
vi.mock('../ai/service.js', () => ({
  generateCategoriesForBusiness: vi.fn(),
}));

const findUnique = prisma.organization.findUnique as unknown as ReturnType<typeof vi.fn>;
const update = prisma.organization.update as unknown as ReturnType<typeof vi.fn>;

describe('organizationService.regenerateQrCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when the organization does not exist', async () => {
    findUnique.mockResolvedValue(null);
    await expect(organizationService.regenerateQrCode('ghost')).rejects.toThrow(
      'Organization not found',
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('re-encodes the feedback URL and persists a PNG data URL', async () => {
    findUnique.mockResolvedValue({ id: 'org-1', slug: 'demo-coffee' });
    update.mockImplementation(async (args: unknown) => args);

    const result = (await organizationService.regenerateQrCode('demo-coffee')) as unknown as {
      data: { qrDataUrl: string };
    };

    expect(findUnique).toHaveBeenCalledWith({ where: { slug: 'demo-coffee' } });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'org-1' },
      data: { qrDataUrl: expect.stringMatching(/^data:image\/png;base64,/) },
    });
    expect(result.data.qrDataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
