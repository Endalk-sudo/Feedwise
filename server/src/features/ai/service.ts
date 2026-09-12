import {
  generateText,
  streamText,
  Output,
  convertToModelMessages,
  toUIMessageStream,
  smoothStream,
  type UIMessage,
  type UIMessageChunk,
} from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import logger from '@/utils/logger.js';
import { env } from '@/lib/env.js';
import { analyticsService } from '@/features/analytics/service.js';

// Vercel AI SDK + Google provider. GEMINI_API_KEY is mapped explicitly
// because the provider defaults to GOOGLE_GENERATIVE_AI_API_KEY.
const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
const modelName = env.AI_MODEL;

const feedbackAnalysisSchema = z.object({
  category: z.string().describe('Category of the feedback'),
  sentiment: z.enum(['Positive', 'Negative', 'Neutral', 'Mixed']),
  urgency: z.enum(['Low', 'Medium', 'High']),
  rating: z.number().min(1).max(5),
  // Structured satisfaction (arXiv 2606.19698): satisfaction 1-5 is the
  // customer's inferred outcome, distinct from sentiment tone. fixableProblem
  // flags concrete, actionable issues ("tolerated friction" included).
  satisfactionEstimate: z.number().int().min(1).max(5).describe(
    'Inferred customer satisfaction 1-5, distinct from sentiment tone',
  ),
  fixableProblem: z.boolean().describe('Whether a concrete fixable problem exists'),
  concreteIssue: z.string().describe('One-sentence fixable problem, or "None"'),
  retentionRisk: z.enum(['Low', 'Medium', 'High']).describe('Churn/revenue-at-risk signal'),
  keyPoints: z.array(z.string()).describe('Main points the customer is making'),
  keywords: z.array(z.string()),
  themes: z.array(z.string()).describe('Short theme labels, e.g. Wait time, Staff attitude'),
  rootCause: z.string().describe('Likely underlying cause in one short sentence'),
  suggestedAction: z.string().describe('One concrete action the business owner should take'),
  confidence: z.number().min(0).max(1),
});

export interface FeedbackAnalysis {
  category: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral' | 'Mixed';
  urgency: 'Low' | 'Medium' | 'High';
  rating: number;
  satisfactionEstimate: number;
  fixableProblem: boolean;
  concreteIssue: string;
  retentionRisk: 'Low' | 'Medium' | 'High';
  keyPoints: string[];
  keywords: string[];
  themes: string[];
  rootCause: string;
  suggestedAction: string;
  confidence: number;
}

export interface ReplyDraftInput {
  text: string;
  category: string;
  sentiment?: string | null;
  urgency?: string | null;
  concreteIssue?: string | null;
  suggestedAction?: string | null;
  businessName?: string;
}

/**
 * Phase 4 (D1/F6): Gemini owner-reply draft for one feedback row.
 * Falls back to a template built from suggestedAction so the UI
 * Accept/Resolve flow never blocks on model failure.
 */
export async function draftOwnerReply(input: ReplyDraftInput): Promise<string> {
  const business = input.businessName?.trim() || 'our team';
  const fallback =
    `Thanks for sharing this with ${business} — ` +
    (input.suggestedAction?.trim() ||
      `we're looking into the ${input.category} issue you raised`) +
    `. We'll follow up once it's resolved.`;
  const prompt = `You are writing a short public reply from a small business owner to a customer's feedback review.

Business: "${business}"
Category: ${input.category}
Sentiment: ${input.sentiment ?? 'Unknown'} | Urgency: ${input.urgency ?? 'Unknown'}
Customer said: "${input.text.slice(0, 800)}"
Concrete issue: ${input.concreteIssue ?? 'None'}
Suggested internal action: ${input.suggestedAction ?? 'Review with the team'}

Rules:
- 2-4 sentences, warm and specific (reference their words, not generic PR).
- Acknowledge the issue, state one concrete next step, invite them back.
- No placeholders like [name]; no promises you can't keep; no discounts unless asked.`;

  try {
    const { text } = await generateText({
      model: google(modelName),
      prompt,
      temperature: 0.5,
      maxRetries: 2,
    });
    const trimmed = text.trim();
    return trimmed.length > 0 ? trimmed.slice(0, 1000) : fallback;
  } catch (error) {
    logger.error(`Reply draft failed: ${(error as Error).message}`);
    return fallback;
  }
}

const insightSchema = z.object({
  title: z.string(),
  reason: z.string(),
  action: z.string(),
  priority: z.number().min(1).max(10),
});

export async function analyzeFeedback(
  text: string,
  categories: string[],
  contextTags: string[] = [],
): Promise<FeedbackAnalysis> {
  const fallbackCategory = categories[0] ?? 'General';
  const categoriesList = categories.join(', ');
  const contextLine =
    contextTags.length > 0
      ? `\nCustomer context tags: ${contextTags.join(', ')}`
      : '';
  const prompt = `You are an advisor for a small business owner. Analyze this customer feedback and return structured JSON that helps them ACT, not just measure.

Feedback: "${text}"${contextLine}

Available categories: ${categoriesList}

Rules:
- category: must match one of the available categories
- sentiment: Positive, Negative, Neutral, or Mixed (tone of the words)
- urgency: High only for safety, refunds, repeated severe complaints, or clear churn risk; otherwise Medium/Low
- rating: 1-5 inferred overall rating
- satisfactionEstimate: 1-5 inferred outcome satisfaction, DISTINCT from sentiment tone.
  Polite/positive wording with an unresolved problem is still low satisfaction (2-3).
  Harsh wording about a trivially fixed issue can still be satisfaction 4.
- fixableProblem: true when a concrete, actionable issue exists (including
  "tolerated friction": satisfied overall but reporting something to fix)
- concreteIssue: one short sentence naming the fixable problem, or "None"
- retentionRisk: High when urgency is High or satisfactionEstimate <= 2;
  Medium when sentiment is Negative/Mixed or satisfactionEstimate == 3; else Low
- keyPoints: 2-5 short factual points
- keywords: important terms
- themes: 1-4 short labels (e.g. "Wait time", "Food quality")
- rootCause: one short sentence on the likely underlying cause (or "Unknown" if unclear)
- suggestedAction: one concrete next step the owner can take this week (start with a verb)
- confidence: 0.0-1.0 how sure you are of the analysis`;

  try {
    const { output } = await generateText({
      model: google(modelName),
      output: Output.object({ schema: feedbackAnalysisSchema }),
      prompt,
      temperature: 0.3,
      maxRetries: 3,
    });

    const analysis: FeedbackAnalysis = output;

    if (!categories.includes(analysis.category)) {
      analysis.category = fallbackCategory;
    }
    if (!analysis.themes) analysis.themes = [];
    if (!analysis.rootCause) analysis.rootCause = 'Unknown';
    if (!analysis.suggestedAction) analysis.suggestedAction = 'Review this feedback with your team';
    // Backfill for models/caches predating structured satisfaction fields.
    if (
      typeof analysis.satisfactionEstimate !== 'number' ||
      analysis.satisfactionEstimate < 1 ||
      analysis.satisfactionEstimate > 5
    ) {
      analysis.satisfactionEstimate = Math.min(5, Math.max(1, Math.round(analysis.rating ?? 3)));
    }
    if (typeof analysis.fixableProblem !== 'boolean') analysis.fixableProblem = false;
    if (!analysis.concreteIssue) analysis.concreteIssue = 'None';
    if (!['Low', 'Medium', 'High'].includes(analysis.retentionRisk as string)) {
      analysis.retentionRisk =
        analysis.urgency === 'High' || analysis.satisfactionEstimate <= 2
          ? 'High'
          : analysis.sentiment === 'Negative' ||
              analysis.sentiment === 'Mixed' ||
              analysis.satisfactionEstimate === 3
            ? 'Medium'
            : 'Low';
    }

    return analysis;
  } catch (error) {
    logger.error(`AI analysis failed: ${(error as Error).message}`);
    return {
      category: fallbackCategory,
      sentiment: 'Neutral' as const,
      urgency: 'Low' as const,
      rating: 3,
      satisfactionEstimate: 3,
      fixableProblem: false,
      concreteIssue: 'Unknown',
      retentionRisk: 'Low' as const,
      keyPoints: ['Analysis failed'],
      keywords: [],
      themes: [],
      rootCause: 'Unknown',
      suggestedAction: 'Review this feedback manually',
      confidence: 0.1,
    };
  }
}

export async function generateCategoriesForBusiness(
  businessType: string,
  description: string,
): Promise<string[]> {
  const prompt = `Generate 5-14 relevant feedback categories for a ${businessType} business.

Business description: "${description}"

Return an array of category strings that customers would use to classify their feedback. Categories should be specific to this business type.`;

  try {
    const { output } = await generateText({
      model: google(modelName),
      output: Output.object({
        schema: z.object({ categories: z.array(z.string()) }),
      }),
      prompt,
      temperature: 0.5,
      maxRetries: 3,
    });

    return output.categories;
  } catch (error) {
    logger.error(`Category generation failed: ${(error as Error).message}`);
    return [
      'Product Quality',
      'Customer Service',
      'Pricing',
      'User Experience',
      'Features',
      'Bugs/Issues',
      'General Feedback',
    ];
  }
}

export interface FeedbackContextItem {
  category: string;
  text: string;
  sentiment?: string | null;
  urgency?: string | null;
  satisfactionEstimate?: number | null;
  fixableProblem?: boolean | null;
  retentionRisk?: string | null;
}

function formatContextLine(f: FeedbackContextItem, maxLen: number): string {
  const extras = [
    f.satisfactionEstimate != null ? `Satisfaction: ${f.satisfactionEstimate}/5` : null,
    f.fixableProblem != null ? `Fixable: ${f.fixableProblem ? 'yes' : 'no'}` : null,
    f.retentionRisk ? `Risk: ${f.retentionRisk}` : null,
  ]
    .filter(Boolean)
    .join(', ');
  return (
    `Category: ${f.category}, Sentiment: ${f.sentiment}, Urgency: ${f.urgency}` +
    (extras ? `, ${extras}` : '') +
    `, Text: ${f.text.substring(0, maxLen)}`
  );
}

export async function generateInsights(
  feedbacks: FeedbackContextItem[],
): Promise<Array<{ title: string; reason: string; action: string; priority: number }>> {
  if (feedbacks.length === 0) return [];

  const feedbackText = feedbacks
    .slice(0, 50)
    .map((f) => formatContextLine(f, 200))
    .join('\n---\n');

  const prompt = `Analyze this customer feedback data and provide 3-5 actionable growth recommendations.

Feedback samples:
${feedbackText}

Return JSON array of recommendations with: title, reason, action, priority (1-10).`;

  try {
    const { output } = await generateText({
      model: google(modelName),
      output: Output.object({
        schema: z.object({ insights: z.array(insightSchema) }),
      }),
      prompt,
      temperature: 0.4,
      maxRetries: 3,
    });

    return output.insights;
  } catch (error) {
    logger.error(`Insights generation failed: ${(error as Error).message}`);
    return [];
  }
}

/**
 * Phase 7 (E1): natural-language analytics query over the org's feedback.
 * Keyword intent router (no new AI package): aggregate questions hit the
 * existing analytics service; everything else falls back to Gemini chat
 * with the same feedback context. Returns structured cards the client
 * renders above the streamed text reply.
 */
export interface NlqCard {
  kind: 'sentiment' | 'categories' | 'heatmap' | 'issues' | 'alerts' | 'retention';
  title: string;
  rows: Array<Record<string, unknown>>;
}

export async function answerAnalyticsQuery(
  message: string,
  organizationId: string,
  feedbackContext: FeedbackContextItem[],
): Promise<{ cards: NlqCard[]; summary: string }> {
  const q = message.toLowerCase();
  const cards: NlqCard[] = [];
  const wants = (...words: string[]) => words.some((w) => q.includes(w));

  if (wants('churn', 'retention', 'at risk', 'at-risk', 'leave', 'leaving')) {
    const risk = await analyticsService.getRetentionRisk(organizationId, 30);
    cards.push({
      kind: 'retention',
      title: `Retention risk — ${risk.counts.High} high / ${risk.counts.Medium} medium / ${risk.counts.Low} low (30d)`,
      rows: (risk.highRiskOpen as unknown as Array<Record<string, unknown>>).slice(0, 5),
    });
  }
  if (wants('trend', 'over time', 'last month', 'this week', 'sentiment')) {
    const trends = await analyticsService.getSentimentTrends(organizationId, 30);
    cards.push({ kind: 'sentiment', title: 'Sentiment trend (30 days)', rows: trends.slice(-14) as unknown as Array<Record<string, unknown>> });
  }
  if (wants('categor', 'breakdown', 'which area', 'pricing', 'service', 'staff')) {
    const cats = await analyticsService.getCategoryBreakdown(organizationId);
    cards.push({ kind: 'categories', title: 'Feedback by category', rows: cats.slice(0, 8) as unknown as Array<Record<string, unknown>> });
  }
  if (wants('heatmap', 'by category', 'compare')) {
    const heat = await analyticsService.getHeatmap(organizationId);
    cards.push({ kind: 'heatmap', title: 'Sentiment by category', rows: (heat as unknown as Array<Record<string, unknown>>).slice(0, 12) });
  }
  if (wants('issue', 'problem', 'top', 'recurring', 'complaint')) {
    const issues = await analyticsService.getTopIssues(organizationId, 5);
    cards.push({ kind: 'issues', title: 'Top recurring issues', rows: issues as unknown as Array<Record<string, unknown>> });
  }
  if (wants('alert', 'urgent', 'priority', 'critical', 'attention')) {
    const alerts = await analyticsService.getAlerts(organizationId, 15);
    cards.push({ kind: 'alerts', title: 'Priority alerts', rows: (alerts as unknown as Array<Record<string, unknown>>).slice(0, 5) });
  }
  if (cards.length === 0) {
    const issues = await analyticsService.getTopIssues(organizationId, 5);
    cards.push({ kind: 'issues', title: 'Top recurring issues', rows: issues as unknown as Array<Record<string, unknown>> });
  }

  const summary = await chatWithAI(
    `Using these analytics cards, answer in 3-6 sentences with specific numbers and one concrete next step:\n` +
      cards.map((c) => `${c.title}: ${JSON.stringify(c.rows).slice(0, 1200)}`).join('\n') +
      `\nUser question: ${message}`,
    feedbackContext,
  );
  return { cards, summary };
}

export async function chatWithAI(
  message: string,
  feedbackContext: FeedbackContextItem[],
): Promise<string> {
  const prompt = buildChatPrompt(message, feedbackContext);

  try {
    const { text } = await generateText({
      model: google(modelName),
      prompt,
      temperature: 0.5,
      maxRetries: 3,
    });

    return text;
  } catch (error) {
    logger.error(`AI chat failed: ${(error as Error).message}`);
    return 'Sorry, I encountered an error analyzing your feedback. Please try again.';
  }
}

export function buildChatPrompt(message: string, feedbackContext: FeedbackContextItem[]): string {
  const context = feedbackContext.slice(0, 15).map((f) => formatContextLine(f, 300)).join('\n');

  return `You are an AI assistant helping a business owner understand their customer feedback.

Feedback context:
${context}

User question: ${message}

Provide a helpful, data-driven response based on the feedback context. Be specific and actionable.`;
}

/**
 * Streaming chat: yields text chunks for SSE-style responses.
 * On failure yields the same fallback message as chatWithAI.
 */
export async function* streamChat(
  message: string,
  feedbackContext: FeedbackContextItem[],
): AsyncGenerator<string> {
  let yielded = false;
  try {
    const { textStream } = streamText({
      model: google(modelName),
      prompt: buildChatPrompt(message, feedbackContext),
      temperature: 0.5,
      maxRetries: 3,
    });

    for await (const chunk of textStream) {
      yielded = true;
      yield chunk;
    }
  } catch (error) {
    logger.error(`AI chat stream failed: ${(error as Error).message}`);
  }

  if (!yielded) {
    yield 'Sorry, I encountered an error analyzing your feedback. Please try again.';
  }
}

/**
 * System prompt for history-aware chat. Feedback context is injected
 * server-side; the client only ever sends conversation messages.
 */
export function buildChatSystemPrompt(feedbackContext: FeedbackContextItem[]): string {
  const context = feedbackContext.slice(0, 15).map((f) => formatContextLine(f, 300)).join('\n');

  return `You are an AI assistant helping a business owner understand their customer feedback.

Feedback context:
${context}

Provide helpful, data-driven responses based on the feedback context. Be specific and actionable.`;
}

/**
 * History-aware chat stream in AI SDK UI-message protocol.
 * Consumed by pipeUIMessageStreamToResponse in the route handler.
 * Word-chunk smoothing gives the client a typewriter effect.
 */
export async function createChatMessageStream(
  messages: UIMessage[],
  feedbackContext: FeedbackContextItem[],
): Promise<ReadableStream<UIMessageChunk>> {
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: google(modelName),
    system: buildChatSystemPrompt(feedbackContext),
    messages: modelMessages,
    temperature: 0.5,
    maxRetries: 3,
    experimental_transform: smoothStream({ chunking: 'word' }),
  });

  return toUIMessageStream({ stream: result.stream });
}
