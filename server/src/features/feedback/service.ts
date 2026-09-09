import { prisma } from '@/lib/prisma.js';
import { analyzeFeedback } from '@/features/ai/service.js';

export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'ignored';

export const feedbackService = {
  async submit(
    slug: string,
    text: string,
    options: {
      ipAddress?: string;
      rating?: number;
      contextTags?: string[];
    } = {},
  ) {
    const org = await prisma.organization.findUnique({ where: { slug } });
    if (!org) throw new Error('Organization not found');

    const contextTags = options.contextTags ?? [];
    const analysis = await analyzeFeedback(text, org.categories as string[], contextTags);

    return prisma.feedback.create({
      data: {
        organizationId: org.id,
        text,
        category: analysis.category,
        rating: options.rating ?? analysis.rating,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        keyPoints: analysis.keyPoints,
        keywords: analysis.keywords,
        themes: analysis.themes ?? [],
        rootCause: analysis.rootCause,
        suggestedAction: analysis.suggestedAction,
        confidence: analysis.confidence,
        contextTags,
        rawAnalysis: analysis as object,
        ipAddress: options.ipAddress,
        status: 'open',
      },
    });
  },

  async getFeedbacks(
    organizationId: string,
    params: {
      page: number;
      limit: number;
      sentiment?: string;
      category?: string;
      urgency?: string;
      status?: string;
    },
  ) {
    const where: Record<string, unknown> = { organizationId };
    if (params.sentiment) where.sentiment = params.sentiment;
    if (params.category) where.category = params.category;
    if (params.urgency) where.urgency = params.urgency;
    if (params.status) where.status = params.status;

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.feedback.count({ where }),
    ]);

    return {
      feedbacks,
      total,
      totalPages: Math.ceil(total / params.limit),
      page: params.page,
      limit: params.limit,
    };
  },

  async getFeedbackById(id: string, organizationId: string) {
    return prisma.feedback.findFirst({
      where: { id, organizationId },
    });
  },

  /**
   * Close-the-loop: update status, optional public reply, internal note.
   */
  async updateStatus(
    id: string,
    organizationId: string,
    data: {
      status?: FeedbackStatus;
      ownerReply?: string | null;
      internalNote?: string | null;
    },
  ) {
    const existing = await prisma.feedback.findFirst({ where: { id, organizationId } });
    if (!existing) return null;

    const status = data.status ?? (existing.status as FeedbackStatus);
    const resolvedAt =
      status === 'resolved' || status === 'ignored'
        ? existing.resolvedAt ?? new Date()
        : status === 'open' || status === 'in_progress'
          ? null
          : existing.resolvedAt;

    return prisma.feedback.update({
      where: { id },
      data: {
        status,
        ownerReply: data.ownerReply !== undefined ? data.ownerReply : existing.ownerReply,
        internalNote: data.internalNote !== undefined ? data.internalNote : existing.internalNote,
        resolvedAt,
      },
    });
  },

  /**
   * Human-in-the-loop: correct AI fields after review.
   */
  async correctAnalysis(
    id: string,
    organizationId: string,
    data: {
      category?: string;
      sentiment?: string;
      urgency?: string;
      suggestedAction?: string;
      rootCause?: string;
    },
  ) {
    const existing = await prisma.feedback.findFirst({ where: { id, organizationId } });
    if (!existing) return null;

    return prisma.feedback.update({
      where: { id },
      data: {
        ...data,
        correctedByHuman: true,
      },
    });
  },

  async getStats(organizationId: string) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [
      total,
      bySentiment,
      byCategory,
      byUrgency,
      byStatus,
      recentCount,
      resolvedCount,
      highUrgencyOpen,
      topActions,
    ] = await Promise.all([
      prisma.feedback.count({ where: { organizationId } }),
      prisma.feedback.groupBy({
        by: ['sentiment'],
        where: { organizationId, sentiment: { not: null } },
        _count: true,
      }),
      prisma.feedback.groupBy({
        by: ['category'],
        where: { organizationId },
        _count: true,
        orderBy: { _count: { category: 'desc' } },
        take: 10,
      }),
      prisma.feedback.groupBy({
        by: ['urgency'],
        where: { organizationId, urgency: { not: null } },
        _count: true,
      }),
      prisma.feedback.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: true,
      }),
      prisma.feedback.count({
        where: { organizationId, createdAt: { gte: weekAgo } },
      }),
      prisma.feedback.count({
        where: { organizationId, status: { in: ['resolved', 'ignored'] } },
      }),
      prisma.feedback.count({
        where: { organizationId, urgency: 'High', status: 'open' },
      }),
      // Top actionable open items this week (high urgency or negative)
      prisma.feedback.findMany({
        where: {
          organizationId,
          status: { in: ['open', 'in_progress'] },
          createdAt: { gte: weekAgo },
          OR: [{ urgency: 'High' }, { sentiment: 'Negative' }],
        },
        orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
        take: 5,
        select: {
          id: true,
          text: true,
          category: true,
          sentiment: true,
          urgency: true,
          suggestedAction: true,
          rootCause: true,
          status: true,
          confidence: true,
          createdAt: true,
        },
      }),
    ]);

    const actedOnRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

    return {
      total,
      bySentiment: bySentiment.map((s) => ({ sentiment: s.sentiment, count: s._count })),
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count })),
      byUrgency: byUrgency.map((u) => ({ urgency: u.urgency, count: u._count })),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      recentCount,
      resolvedCount,
      highUrgencyOpen,
      actedOnRate,
      topActions,
    };
  },
};
