import { z } from 'zod';

export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000),
  }),
  params: z.object({
    slug: z.string().min(1),
  }),
});

export type ChatInput = z.infer<typeof chatSchema>;
