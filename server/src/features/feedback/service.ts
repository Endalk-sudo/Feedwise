import { prisma } from '@/lib/prisma.js';
import { analyzeFeedback } from '@/features/ai/service.js';

export const feedbackService = {
  async submit(slug: string, text: string, ipAddress?: string) {
    const org = await prisma.organization.findUnique({ where: { slug } });
    if (!org) throw new Error('Organization not found');

    const analysis = await analyzeFeedback(text, org.categories as string[]);

    return prisma.feedback.create({
      data: {
        organizationId: org.id,
        text,
        category: analysis.category,
        rating: analysis.rating,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        keyPoints: analysis.keyPoints,
        keywords: analysis.keywords,
        confidence: analysis.confidence,
        rawAnalysis: analysis as any,
        ipAddress,
      },
    });
  },

  async getFeedbacks(organizationId: string, params: {
    page: number;
    limit: number;
    sentiment?: string;
    category?: string;
    urgency?: string;
  }) {
    const where: any = { organizationId };
    if (params.sentiment) where.sentiment = params.sentiment;
    if (params.category) where.category = params.category;
    if (params.urgency) where.urgency = params.urgency;

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

  async getStats(organizationId: string) {
    const [total, bySentiment, byCategory, byUrgency, recentCount] = await Promise.all([
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
      prisma.feedback.count({
        where: {
          organizationId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      total,
      bySentiment: bySentiment.map((s) => ({ sentiment: s.sentiment, count: s._count })),
      byCategory: byCategory.map((c) => ({ category: c.category, count: c._count })),
      byUrgency: byUrgency.map((u) => ({ urgency: u.urgency, count: u._count })),
      recentCount,
    };
  },
};