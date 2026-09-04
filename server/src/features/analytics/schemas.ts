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
