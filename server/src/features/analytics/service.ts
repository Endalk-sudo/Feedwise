import { prisma } from '@/lib/prisma.js';
import { generateInsights } from '../ai/service.js';

export const analyticsService = {
  async getSentimentTrends(organizationId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const feedbacks = await prisma.feedback.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
        sentiment: { not: null },
      },
      select: {
        sentiment: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date and sentiment
    const trends: Record<string, Record<string, number>> = {};

    feedbacks.forEach((f: { sentiment: string | null; createdAt: Date }) => {
      const date = f.createdAt.toISOString().split('T')[0] ?? 'unknown-date';
      const sentiment = f.sentiment ?? 'Unknown';
      const entry = trends[date] ?? {};
      entry[sentiment] = (entry[sentiment] ?? 0) + 1;
      trends[date] = entry;
    });

    return Object.entries(trends)
      .map(([date, sentiments]) => ({
        date,
        Positive: sentiments['Positive'] ?? 0,
        Negative: sentiments['Negative'] ?? 0,
        Neutral: sentiments['Neutral'] ?? 0,
        Mixed: sentiments['Mixed'] ?? 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async getCategoryBreakdown(organizationId: string) {
    const categories = await prisma.feedback.groupBy({
      by: ['category'],
      where: { organizationId },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    return categories.map((c: { category: string; _count: { category: number } }) => ({
      name: c.category,
      count: c._count.category,
    }));
  },

  async getHeatmap(organizationId: string) {
    const data = await prisma.feedback.groupBy({
      by: ['category', 'sentiment'],
      where: {
        organizationId,
        sentiment: { not: null },
      },
      _count: true,
    });

    return data.map((d) => ({
      category: d.category ?? 'Unknown',
      sentiment: d.sentiment ?? 'Unknown',
      count: d._count,
    }));
  },

  async getTopIssues(organizationId: string, limit: number = 10) {
    const feedbacks = await prisma.feedback.findMany({
      where: {
        organizationId,
        sentiment: { in: ['Negative', 'Mixed'] },
        urgency: { in: ['High', 'Medium'] },
      },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
      take: limit * 3, // Get more to group
    });

    // Group similar feedback
    const grouped: Record<
      string,
      { text: string; category: string; urgency: string; sentiment: string; count: number }
    > = {};

    feedbacks.forEach(
      (f: { category: string; text: string; urgency: string | null; sentiment: string | null }) => {
        const key = f.category + '|' + f.text.substring(0, 50);
        const entry = grouped[key] ?? {
          text: f.text,
          category: f.category,
          urgency: f.urgency ?? 'Low',
          sentiment: f.sentiment ?? 'Neutral',
          count: 0,
        };
        entry.count++;
        grouped[key] = entry;
      },
    );

    return Object.values(grouped)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  async getAlerts(organizationId: string, days: number = 15) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const alerts = await prisma.feedback.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
        urgency: { in: ['High', 'Medium'] },
      },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
      take: 20,
      select: {
        id: true,
        text: true,
        category: true,
        urgency: true,
        sentiment: true,
        createdAt: true,
      },
    });

    return alerts;
  },

  async getRecommendations(organizationId: string) {
    // Get recent feedback for AI analysis
    const feedbacks = await prisma.feedback.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (feedbacks.length === 0) return [];

    // Check for cached insights
    const cached = await prisma.insight.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (cached.length > 0) {
      return cached.map(
        (c: { title: string; reason: string; action: string; priority: number }) => ({
          title: c.title,
          reason: c.reason,
          action: c.action,
          priority: c.priority,
        }),
      );
    }

    // Generate new insights using AI
    const insights = await generateInsights(feedbacks);

    // Cache insights
    if (insights.length > 0) {
      await prisma.insight.createMany({
        data: insights.map(
          (i: { title: string; reason: string; action: string; priority: number }) => ({
            organizationId,
            title: i.title,
            reason: i.reason,
            action: i.action,
            priority: i.priority,
            periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            periodEnd: new Date(),
          }),
        ),
        skipDuplicates: true,
      });
    }

    return insights;
  },
};
