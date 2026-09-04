import { z } from 'zod';

export const submitFeedbackSchema = z.object({
  body: z.object({
    text: z.string().min(15, 'Feedback must be at least 15 characters').max(5000),
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

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type GetFeedbacksInput = z.infer<typeof getFeedbacksSchema>;