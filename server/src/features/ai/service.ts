import { generateText, Output } from 'ai';
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
  keyPoints: z.array(z.string()),
  keywords: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export interface FeedbackAnalysis {
  category: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral' | 'Mixed';
  urgency: 'Low' | 'Medium' | 'High';
  rating: number;
  keyPoints: string[];
  keywords: string[];
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
): Promise<FeedbackAnalysis> {
  const fallbackCategory = categories[0] ?? 'General';
  const categoriesList = categories.join(', ');
  const prompt = `Analyze this customer feedback and return structured JSON.

Feedback: "${text}"

Available categories: ${categoriesList}

Return JSON with:
- category: must match one of the available categories
- sentiment: Positive, Negative, Neutral, or Mixed
- urgency: Low, Medium, or High
- rating: 1-5 inferred rating
- keyPoints: array of main insights
- keywords: array of important keywords
- confidence: 0.0-1.0 confidence score`;

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
  const context = feedbackContext
    .slice(0, 15)
    .map(
      (f) =>
        `Category: ${f.category}, Sentiment: ${f.sentiment}, Urgency: ${f.urgency}, Text: ${f.text.substring(0, 300)}`,
    )
    .join('\n');

  const prompt = `You are an AI assistant helping a business owner understand their customer feedback.

Feedback context:
${context}

User question: ${message}

Provide a helpful, data-driven response based on the feedback context. Be specific and actionable.`;

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
