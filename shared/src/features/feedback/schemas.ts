import { z } from 'zod';

export const submitFeedbackSchema = z.object({
  body: z.object({
    text: z.string().min(5, 'Please share a bit more detail').max(5000),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    contextTags: z.array(z.string().max(40)).max(8).optional(),
  }),
  params: z.object({
    slug: z.string().min(1),
  }),
});

export const getFeedbacksSchema = z.object({
  query: z.object({
    page: z.coerce.number().positive().default(1),
    limit: z.coerce.number().positive().max(100).default(20),
    sentiment: z.enum(['Positive', 'Negative', 'Neutral', 'Mixed']).optional(),
    category: z.string().optional(),
    urgency: z.enum(['Low', 'Medium', 'High']).optional(),
    status: z.enum(['open', 'in_progress', 'resolved', 'ignored']).optional(),
  }),
  params: z.object({
    slug: z.string().min(1),
  }),
});

export const feedbackParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid().optional(),
    slug: z.string().min(1),
  }),
});

export const updateFeedbackStatusSchema = z.object({
  body: z.object({
    status: z.enum(['open', 'in_progress', 'resolved', 'ignored']).optional(),
    ownerReply: z.string().max(2000).nullable().optional(),
    internalNote: z.string().max(2000).nullable().optional(),
  }),
  params: z.object({
    slug: z.string().min(1),
    id: z.string().cuid(),
  }),
});

export const correctFeedbackSchema = z.object({
  body: z.object({
    category: z.string().min(1).max(80).optional(),
    sentiment: z.enum(['Positive', 'Negative', 'Neutral', 'Mixed']).optional(),
    urgency: z.enum(['Low', 'Medium', 'High']).optional(),
    suggestedAction: z.string().max(500).optional(),
    rootCause: z.string().max(500).optional(),
  }),
  params: z.object({
    slug: z.string().min(1),
    id: z.string().cuid(),
  }),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type GetFeedbacksInput = z.infer<typeof getFeedbacksSchema>;
export type UpdateFeedbackStatusInput = z.infer<typeof updateFeedbackStatusSchema>;
export type CorrectFeedbackInput = z.infer<typeof correctFeedbackSchema>;

// Client form schema
export const submitFeedbackFormSchema = z.object({
  text: z.string().min(5, 'Please share a bit more detail').max(5000),
  rating: z.number().int().min(1).max(5).optional(),
  contextTags: z.array(z.string()).optional(),
});
export type SubmitFeedbackForm = z.infer<typeof submitFeedbackFormSchema>;
