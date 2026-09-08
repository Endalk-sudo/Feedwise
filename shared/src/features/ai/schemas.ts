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

// UI-message text part as sent by @ai-sdk/react's DefaultChatTransport.
// Unknown keys are stripped by the validator; only role + text parts
// reach convertToModelMessages (system prompts stay server-side).
const uiTextPartSchema = z.object({
  type: z.literal('text'),
  text: z.string().min(1).max(4000),
});

const uiMessageSchema = z.object({
  id: z.string().min(1).max(100),
  role: z.enum(['user', 'assistant']),
  parts: z.array(uiTextPartSchema).min(1).max(20),
});

export const chatStreamSchema = z.object({
  body: z.object({
    messages: z.array(uiMessageSchema).min(1).max(50),
  }),
  params: z.object({
    slug: z.string().min(1),
  }),
});

export type ChatStreamInput = z.infer<typeof chatStreamSchema>;