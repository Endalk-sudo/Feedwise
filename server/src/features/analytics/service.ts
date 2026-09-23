import { prisma } from '@/lib/prisma.js';
import { generateInsights, draftOwnerReply, DEGRADED_CONFIDENCE_THRESHOLD } from '../ai/service.js';

/** Recommendations cache TTL — stale caches (missed 2AM regen) are regenerated. */
export const RECOMMENDATIONS_CACHE_TTL_MS = 30 * 60 * 60 * 1000;

export const analyticsService = {
  async getSentimentTrends(organizationId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const feedbacks = await prisma.feedback.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
        sentiment: { not: null },
        // Exclude degraded (fallback) analyses — they look plausible but are junk
        confidence: { gte: DEGRADED_CONFIDENCE_THRESHOLD },
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
      where: {
        organizationId,
        confidence: { gte: DEGRADED_CONFIDENCE_THRESHOLD },
      },
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
        confidence: { gte: DEGRADED_CONFIDENCE_THRESHOLD },
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
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    if (feedbacks.length === 0) return [];

    // Phase 4 (I3): enrich every recommendation with action links — anchor
    // feedback rows (top open High/fixable in the same window), a draft
    // owner reply for the top row, and a suggested assignee (first team
    // member; null when solo). Keeps the Pro recommendations card clickable.
    const enrich = async (
      items: Array<{ title: string; reason: string; action: string; priority: number }>,
    ) => {
      const actionable = feedbacks
        .filter(
          (f) =>
            (f.urgency === 'High' || f.fixableProblem === true || f.retentionRisk === 'High') &&
            (f.status === 'open' || f.status === 'in_progress'),
        )
        .slice(0, 5);
      let assigneeId: string | null = null;
      try {
        const firstMember = await prisma.organizationMember.findFirst({
          where: { organizationId },
          orderBy: { createdAt: 'asc' },
          select: { userId: true },
        });
        assigneeId = firstMember?.userId ?? null;
      } catch {
        assigneeId = null;
      }
      let draftReply: string | null = null;
      const top = actionable[0];
      if (top) {
        try {
          draftReply = await draftOwnerReply({
            text: top.text,
            category: top.category,
            sentiment: top.sentiment,
            urgency: top.urgency,
            concreteIssue: top.concreteIssue,
            suggestedAction: top.suggestedAction,
            businessName: org?.name,
          });
        } catch {
          draftReply = null;
        }
      }
      const feedbackIds = actionable.map((f) => f.id);
      return items.map((i) => ({ ...i, feedbackIds, assigneeId, draftReply }));
    };

    // Check for cached insights (Phase 10 freshness: never show week-old data
    // while new feedback arrived — treat a stale cache as empty and regenerate;
    // Pro orgs get their cache refreshed nightly by the 2AM worker so a 30h TTL
    // keeps it fresh between runs without blocking the request every time).
    const cached = await prisma.insight.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        title: true,
        reason: true,
        action: true,
        priority: true,
        createdAt: true,
      },
    });
    const cacheFresh =
      cached.length > 0 &&
      Date.now() - (cached[0].createdAt?.getTime() ?? 0) < RECOMMENDATIONS_CACHE_TTL_MS;

    if (cacheFresh) {
      return enrich(
        cached.map((c: { title: string; reason: string; action: string; priority: number }) => ({
          title: c.title,
          reason: c.reason,
          action: c.action,
          priority: c.priority,
        })),
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

    return enrich(insights);
  },

  /**
   * Phase 5 (F1): retention-risk aggregate — counts by risk band plus the
   * top High-risk open rows so the Pro widget can link straight to action.
   */
  async getRetentionRisk(organizationId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [byRisk, highRiskRows, satisfactionAgg, fixableCount] = await Promise.all([
      prisma.feedback.groupBy({
        by: ['retentionRisk'],
        where: {
          organizationId,
          createdAt: { gte: startDate },
          confidence: { gte: DEGRADED_CONFIDENCE_THRESHOLD },
        },
        _count: true,
      }),
      prisma.feedback.findMany({
        where: { organizationId, retentionRisk: 'High', status: { in: ['open', 'in_progress'] } },
        orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
        take: 10,
        select: {
          id: true,
          text: true,
          category: true,
          urgency: true,
          sentiment: true,
          satisfactionEstimate: true,
          fixableProblem: true,
          concreteIssue: true,
          retentionRisk: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.feedback.aggregate({
        where: {
          organizationId,
          createdAt: { gte: startDate },
          satisfactionEstimate: { not: null },
          confidence: { gte: DEGRADED_CONFIDENCE_THRESHOLD },
        },
        _avg: { satisfactionEstimate: true },
        _count: true,
      }),
      prisma.feedback.count({
        where: {
          organizationId,
          createdAt: { gte: startDate },
          fixableProblem: true,
          confidence: { gte: DEGRADED_CONFIDENCE_THRESHOLD },
        },
      }),
    ]);
    const counts: Record<string, number> = { Low: 0, Medium: 0, High: 0 };
    for (const row of byRisk) {
      if (row.retentionRisk && row.retentionRisk in counts) counts[row.retentionRisk] = row._count;
    }
    return {
      counts,
      highRiskOpen: highRiskRows,
      avgSatisfaction: satisfactionAgg._avg.satisfactionEstimate,
      total: satisfactionAgg._count,
      fixableCount,
    };
  },

  /**
   * Phase 5 (D2): rolling 7-day satisfaction trend + High-urgency frequency.
   * The cron compares the last two windows; a drop > 0.3 pts/week with
   * rising High urgency becomes a predictive churn Insight in /alerts.
   */
  async getSatisfactionForecast(organizationId: string) {
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    const windows = [0, 1, 2, 3].map((w) => ({
      start: new Date(now - (w + 1) * week),
      end: new Date(now - w * week),
    }));
    const stats = await Promise.all(
      windows.map(async (w, idx) => {
        const [agg, highUrgency] = await Promise.all([
          prisma.feedback.aggregate({
            where: {
              organizationId,
              createdAt: { gte: w.start, lt: w.end },
              satisfactionEstimate: { not: null },
              confidence: { gte: DEGRADED_CONFIDENCE_THRESHOLD },
            },
            _avg: { satisfactionEstimate: true },
            _count: true,
          }),
          prisma.feedback.count({
            where: { organizationId, createdAt: { gte: w.start, lt: w.end }, urgency: 'High' },
          }),
        ]);
        return {
          weeksAgo: idx,
          avgSatisfaction: agg._avg.satisfactionEstimate,
          count: agg._count,
          highUrgency,
        };
      }),
    );
    const current = stats[0];
    const previous = stats[1];
    const satisfactionDelta =
      current?.avgSatisfaction != null && previous?.avgSatisfaction != null
        ? current.avgSatisfaction - previous.avgSatisfaction
        : 0;
    const urgencyRising = (current?.highUrgency ?? 0) > (previous?.highUrgency ?? 0);
    const trend: 'rising' | 'stable' | 'falling' =
      satisfactionDelta <= -0.3 || urgencyRising
        ? 'falling'
        : satisfactionDelta >= 0.3
          ? 'rising'
          : 'stable';
    return { windows: stats, satisfactionDelta, urgencyRising, trend };
  },

  /** Phase 6 (V3): CSV export source — bounded, newest-first. */
  async getExportRows(organizationId: string, days: number = 90, limit = 2000) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.feedback.findMany({
      where: { organizationId, createdAt: { gte: startDate } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 5000),
      select: {
        id: true,
        text: true,
        category: true,
        rating: true,
        sentiment: true,
        urgency: true,
        satisfactionEstimate: true,
        fixableProblem: true,
        concreteIssue: true,
        retentionRisk: true,
        verified: true,
        status: true,
        ownerReply: true,
        createdAt: true,
      },
    });
  },

  /**
   * Phase 7 (F4): staff performance from existing audit fields —
   * org-wide resolved/open counts, avg resolution hours, avg satisfaction,
   * plus the member roster. No new tables.
   */
  async getStaffPerformance(organizationId: string) {
    const [members, resolved, open, avgSatisfaction] = await Promise.all([
      prisma.organizationMember.findMany({
        where: { organizationId },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.feedback.count({ where: { organizationId, status: 'resolved' } }),
      prisma.feedback.count({ where: { organizationId, status: { in: ['open', 'in_progress'] } } }),
      prisma.feedback.aggregate({
        where: { organizationId, satisfactionEstimate: { not: null } },
        _avg: { satisfactionEstimate: true },
      }),
    ]);
    const withTiming = await prisma.feedback.findMany({
      where: { organizationId, status: 'resolved', resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
      take: 200,
    });
    const avgResolutionHours =
      withTiming.length > 0
        ? withTiming.reduce(
            (sum, f) => sum + ((f.resolvedAt as Date).getTime() - f.createdAt.getTime()) / 3600000,
            0,
          ) / withTiming.length
        : null;
    return {
      members: members.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
      orgTotals: {
        resolved,
        open,
        avgSatisfaction: avgSatisfaction._avg.satisfactionEstimate,
        avgResolutionHours,
      },
    };
  },
};
