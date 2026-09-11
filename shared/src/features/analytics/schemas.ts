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