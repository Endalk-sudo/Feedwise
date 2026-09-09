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

// Vercel AI SDK + Google provider. GEMINI_API_KEY is mapped explicitly
// because the provider defaults to GOOGLE_GENERATIVE_AI_API_KEY.
const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
const modelName = env.AI_MODEL;

const feedbackAnalysisSchema = z.object({
  category: z.string().describe('Category of the feedback'),
  sentiment: z.enum(['Positive', 'Negative', 'Neutral', 'Mixed']),
  urgency: z.enum(['Low', 'Medium', 'High']),
  rating: z.number().min(1).max(5),
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
  keyPoints: string[];
  keywords: string[];
  themes: string[];
  rootCause: string;
  suggestedAction: string;
  confidence: number;
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
- sentiment: Positive, Negative, Neutral, or Mixed
- urgency: High only for safety, refunds, repeated severe complaints, or clear churn risk; otherwise Medium/Low
- rating: 1-5 inferred overall rating
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

    return analysis;
  } catch (error) {
    logger.error(`AI analysis failed: ${(error as Error).message}`);
    return {
      category: fallbackCategory,
      sentiment: 'Neutral' as const,
      urgency: 'Low' as const,
      rating: 3,
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
}

export async function generateInsights(
  feedbacks: FeedbackContextItem[],
): Promise<Array<{ title: string; reason: string; action: string; priority: number }>> {
  if (feedbacks.length === 0) return [];

  const feedbackText = feedbacks
    .slice(0, 50)
    .map((f) => `${f.category}: ${f.text.substring(0, 200)}`)
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
  const context = feedbackContext
    .slice(0, 15)
    .map(
      (f) =>
        `Category: ${f.category}, Sentiment: ${f.sentiment}, Urgency: ${f.urgency}, Text: ${f.text.substring(0, 300)}`,
    )
    .join('\n');

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
  const context = feedbackContext
    .slice(0, 15)
    .map(
      (f) =>
        `Category: ${f.category}, Sentiment: ${f.sentiment}, Urgency: ${f.urgency}, Text: ${f.text.substring(0, 300)}`,
    )
    .join('\n');

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
