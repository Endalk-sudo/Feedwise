import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    feedback: { findMany: vi.fn() },
    organizationMember: { findFirst: vi.fn() },
    organization: { findUnique: vi.fn() },
    insight: { findMany: vi.fn(), createMany: vi.fn() },
  },
}));

vi.mock('../ai/service.js', () => ({
  generateInsights: vi.fn(),
  draftOwnerReply: vi.fn(),
  DEGRADED_CONFIDENCE_THRESHOLD: 0.5,
}));

import { prisma } from '@/lib/prisma.js';
import { generateInsights, draftOwnerReply } from '../ai/service.js';
import { analyticsService } from './service.js';

const CACHED = {
  title: 'Cached title',
  reason: 'Cached reason',
  action: 'Cached action',
  priority: 7,
};

// getRecommendations returns [] early when there are no feedback rows, so the
// feedback query must resolve to at least one row to reach the cache path.
const FEEDBACK_ROW = {
  id: 'f1',
  text: 'slow service',
  category: 'Service',
  sentiment: 'Negative',
  urgency: 'High',
  satisfactionEstimate: 2,
  fixableProblem: true,
  concreteIssue: 'understaffed',
  retentionRisk: 'High',
  status: 'open',
  createdAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.feedback.findMany).mockResolvedValue([FEEDBACK_ROW] as never);
  vi.mocked(prisma.organizationMember.findFirst).mockResolvedValue(null as never);
  vi.mocked(prisma.organization.findUnique).mockResolvedValue({ name: 'Demo' } as never);
});

describe('getRecommendations freshness', () => {
  it('serves a fresh cache without calling the AI generator', async () => {
    vi.mocked(prisma.insight.findMany).mockResolvedValue([
      { ...CACHED, createdAt: new Date() },
    ] as never);
    vi.mocked(generateInsights).mockImplementation(async () => []);

    const result = await analyticsService.getRecommendations('org-1');

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Cached title');
    expect(generateInsights).not.toHaveBeenCalled();
  });

  it('regenerates when the cache is stale (older than the 30h TTL)', async () => {
    const stale = new Date(Date.now() - 40 * 60 * 60 * 1000);
    vi.mocked(prisma.insight.findMany).mockResolvedValue([
      { ...CACHED, createdAt: stale },
    ] as never);
    vi.mocked(generateInsights).mockResolvedValue([
      { title: 'Fresh title', reason: 'r', action: 'a', priority: 8 },
    ] as never);
    vi.mocked(draftOwnerReply).mockResolvedValue('draft');

    const result = await analyticsService.getRecommendations('org-1');

    expect(generateInsights).toHaveBeenCalledTimes(1);
    expect(result[0].title).toBe('Fresh title');
  });
});