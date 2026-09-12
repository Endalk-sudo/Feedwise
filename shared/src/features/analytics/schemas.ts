import { z } from 'zod';

export const analyticsParamsSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
  query: z.object({
    days: z.coerce.number().positive().max(365).optional(),
  }),
});

export type AnalyticsParams = z.infer<typeof analyticsParamsSchema>;

// Phase 0: params for retention-risk aggregate (F1) and CSV export (V3/F7).
// Kept separate from analyticsParamsSchema so existing routes stay untouched.
export const retentionRiskParamsSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
  query: z.object({
    days: z.coerce.number().positive().max(365).optional(),
  }),
});

export type RetentionRiskParams = z.infer<typeof retentionRiskParamsSchema>;

export const analyticsExportParamsSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
  query: z.object({
    format: z.enum(['csv']).default('csv'),
    days: z.coerce.number().positive().max(365).optional(),
  }),
});

export type AnalyticsExportParams = z.infer<typeof analyticsExportParamsSchema>;

// Phase 4 (D1/F6+I3): enriched recommendation links insight -> action.
// feedbackIds anchor cards to real feedback rows; assigneeId prefills routing;
// draftReply previews the Gemini owner-reply draft for Accept/Resolve.
export const recommendationSchema = z.object({
  title: z.string(),
  reason: z.string(),
  action: z.string(),
  priority: z.number().min(1).max(10),
  feedbackIds: z.array(z.string()).default([]),
  assigneeId: z.string().nullable().default(null),
  draftReply: z.string().nullable().default(null),
});

export type Recommendation = z.infer<typeof recommendationSchema>;

// Phase 5 (F1/D2): predictive churn forecast emitted by the insight cron.
export const retentionForecastSchema = z.object({
  title: z.string(),
  reason: z.string(),
  action: z.string(),
  priority: z.number().min(1).max(10),
  trend: z.enum(['rising', 'stable', 'falling']),
  satisfactionDelta: z.number(),
});

export type RetentionForecast = z.infer<typeof retentionForecastSchema>;