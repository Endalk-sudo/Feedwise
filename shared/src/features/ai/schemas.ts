import { z } from 'zod';
import {
  retentionRiskSchema,
  satisfactionEstimateSchema,
} from '../feedback/schemas.js';

export const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000),
  }),
  params: z.object({
    slug: z.string().min(1),
  }),
});

export type ChatInput = z.infer<typeof chatSchema>;

// Phase 0/1: structured satisfaction annotations (arXiv 2606.19698).
// Satisfaction (1-5) is distinct from sentiment tone; fixableProblem flags
// concrete, actionable issues ("tolerated friction"); retentionRisk rolls
// urgency + satisfaction into a churn signal for analytics (F1/D2).
// Enums live canonically in feedback/schemas to avoid export collisions.
export { retentionRiskSchema, satisfactionEstimateSchema };

export const aiFeedbackAnalysisSchema = z.object({
  category: z.string(),
  sentiment: z.enum(['Positive', 'Negative', 'Neutral', 'Mixed']),
  urgency: z.enum(['Low', 'Medium', 'High']),
  rating: z.number().min(1).max(5),
  satisfactionEstimate: satisfactionEstimateSchema,
  fixableProblem: z.boolean(),
  concreteIssue: z.string(),
  retentionRisk: retentionRiskSchema,
  keyPoints: z.array(z.string()),
  keywords: z.array(z.string()),
  themes: z.array(z.string()),
  rootCause: z.string(),
  suggestedAction: z.string(),
  confidence: z.number().min(0).max(1),
  // Present (and true) when the Gemini call failed and every value above is
  // the degraded neutral fallback (confidence 0.1), not a real reading.
  analysisFailed: z.boolean().optional(),
});

export type AiFeedbackAnalysis = z.infer<typeof aiFeedbackAnalysisSchema>;

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