import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
  Output: { object: vi.fn((arg: unknown) => arg), array: vi.fn((arg: unknown) => arg) },
  convertToModelMessages: vi.fn(),
  toUIMessageStream: vi.fn(),
  smoothStream: vi.fn((arg: unknown) => arg),
}));

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn()),
}));

vi.mock('@/utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/features/analytics/service.js', () => ({
  analyticsService: {
    getRetentionRisk: vi.fn(),
    getSentimentTrends: vi.fn(),
    getCategoryBreakdown: vi.fn(),
    getHeatmap: vi.fn(),
    getTopIssues: vi.fn(),
    getAlerts: vi.fn(),
  },
}));

import { generateText, streamText, convertToModelMessages, toUIMessageStream } from 'ai';
import { analyticsService } from '@/features/analytics/service.js';
import {
  analyzeFeedback,
  generateCategoriesForBusiness,
  generateInsights,
  streamChat,
  buildChatPrompt,
  buildChatSystemPrompt,
  createChatMessageStream,
  draftOwnerReply,
  answerAnalyticsQuery,
} from './service.js';

const mockedGenerateText = vi.mocked(generateText);
const mockedStreamText = vi.mocked(streamText);
const mockedConvertToModelMessages = vi.mocked(convertToModelMessages);
const mockedToUIMessageStream = vi.mocked(toUIMessageStream);

beforeEach(() => {
  vi.resetAllMocks();
});

describe('analyzeFeedback', () => {
  it('returns parsed analysis and guards unknown categories', async () => {
    mockedGenerateText.mockResolvedValue({
      output: {
        category: 'Unknown-Category',
        sentiment: 'Negative',
        urgency: 'High',
        rating: 2,
        satisfactionEstimate: 2,
        fixableProblem: true,
        concreteIssue: 'Slow service at peak hours',
        retentionRisk: 'High',
        keyPoints: ['slow'],
        keywords: ['slow'],
        themes: ['Speed'],
        rootCause: 'Understaffed',
        suggestedAction: 'Add staff at peak hours',
        confidence: 0.8,
      },
    } as never);

    const result = await analyzeFeedback('too slow', ['Support', 'Pricing']);

    expect(result.category).toBe('Support');
    expect(result.sentiment).toBe('Negative');
    expect(result.satisfactionEstimate).toBe(2);
    expect(result.fixableProblem).toBe(true);
    expect(result.retentionRisk).toBe('High');
  });

  it('backfills structured fields when the model omits them', async () => {
    mockedGenerateText.mockResolvedValue({
      output: {
        category: 'Support',
        sentiment: 'Negative',
        urgency: 'Medium',
        rating: 2,
        keyPoints: ['slow'],
        keywords: ['slow'],
        themes: ['Speed'],
        rootCause: 'Understaffed',
        suggestedAction: 'Add staff at peak hours',
        confidence: 0.8,
      },
    } as never);

    const result = await analyzeFeedback('too slow', ['Support']);

    expect(result.satisfactionEstimate).toBe(2);
    expect(result.fixableProblem).toBe(false);
    expect(result.concreteIssue).toBe('None');
    // satisfaction 2 (from rating 2) => High risk even at Medium urgency.
    expect(result.retentionRisk).toBe('High');
  });

  it('preserves tolerated friction: positive tone with a fixable problem', async () => {
    mockedGenerateText.mockResolvedValue({
      output: {
        category: 'Service',
        sentiment: 'Positive',
        urgency: 'Low',
        rating: 4,
        satisfactionEstimate: 4,
        fixableProblem: true,
        concreteIssue: 'Napkins missing on tables',
        retentionRisk: 'Low',
        keyPoints: ['loved coffee', 'no napkins'],
        keywords: ['coffee', 'napkins'],
        themes: ['Hospitality'],
        rootCause: 'Restocking gap',
        suggestedAction: 'Add napkin checks to closing duties',
        confidence: 0.9,
      },
    } as never);

    const result = await analyzeFeedback('Love this place but no napkins!', ['Service']);

    // Satisfaction/fixable must not be collapsed into sentiment.
    expect(result.sentiment).toBe('Positive');
    expect(result.fixableProblem).toBe(true);
    expect(result.concreteIssue).toContain('Napkins');
  });

  it('returns the safe fallback when the model call fails', async () => {
    mockedGenerateText.mockRejectedValue(new Error('boom'));

    const result = await analyzeFeedback('anything', ['General']);

    expect(result).toEqual({
      category: 'General',
      sentiment: 'Neutral',
      urgency: 'Low',
      rating: 3,
      satisfactionEstimate: 3,
      fixableProblem: false,
      concreteIssue: 'Unknown',
      retentionRisk: 'Low',
      keyPoints: ['Analysis failed'],
      keywords: [],
      themes: [],
      rootCause: 'Unknown',
      suggestedAction: 'Review this feedback manually',
      confidence: 0.1,
      analysisFailed: true,
    });
  });

  it('preserves a clearly negative fixture: High urgency + High retention risk', async () => {
    mockedGenerateText.mockResolvedValue({
      output: {
        category: 'Service',
        sentiment: 'Negative',
        urgency: 'High',
        rating: 1,
        satisfactionEstimate: 1,
        fixableProblem: true,
        concreteIssue: 'Cold food after 45 minute wait',
        retentionRisk: 'High',
        keyPoints: ['rude staff', 'cold food'],
        keywords: ['rude', 'cold', 'wait'],
        themes: ['Wait time', 'Staff attitude'],
        rootCause: 'Understaffed',
        suggestedAction: 'Apologize and retrain at peak hours',
        confidence: 0.9,
      },
    } as never);

    const result = await analyzeFeedback('rude staff, 45 min wait, cold food, rating 1', [
      'Service',
    ]);

    // Regression guard for the degraded-fallback bug: a strongly negative
    // input must never be collapsed to Neutral/Low by the failure path.
    expect(result.urgency).toBe('High');
    expect(result.retentionRisk).toBe('High');
    expect(result.sentiment).toBe('Negative');
    expect(result.satisfactionEstimate).toBe(1);
    expect(result.analysisFailed).not.toBe(true);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('bounds each model call with a fresh 12s abort signal', async () => {
    mockedGenerateText.mockRejectedValue(new Error('This operation was aborted'));

    const first = await analyzeFeedback('anything', ['General']);
    const second = await analyzeFeedback('anything else', ['General']);

    expect(first.confidence).toBe(0.1);
    expect(second.confidence).toBe(0.1);
    expect(mockedGenerateText).toHaveBeenCalledTimes(2);

    const sig1 = (mockedGenerateText.mock.calls[0]?.[0] as { abortSignal?: AbortSignal })
      .abortSignal;
    const sig2 = (mockedGenerateText.mock.calls[1]?.[0] as { abortSignal?: AbortSignal })
      .abortSignal;

    expect(sig1).toBeInstanceOf(AbortSignal);
    expect(sig2).toBeInstanceOf(AbortSignal);
    // Regression: a module-level AbortSignal.timeout fires once ~12s after
    // server start, then aborts every later call instantly. Each call must get
    // its own un-aborted signal.
    expect(sig1).not.toBe(sig2);
    expect(sig1?.aborted).toBe(false);
    expect(sig2?.aborted).toBe(false);
  });
});

describe('generateCategoriesForBusiness', () => {
  it('returns model categories on success', async () => {
    mockedGenerateText.mockResolvedValue({ output: { categories: ['A', 'B'] } } as never);

    await expect(generateCategoriesForBusiness('Cafe', 'coffee shop')).resolves.toEqual(['A', 'B']);
  });

  it('returns default categories on failure', async () => {
    mockedGenerateText.mockRejectedValue(new Error('boom'));

    const result = await generateCategoriesForBusiness('Cafe', 'coffee shop');

    expect(result).toContain('Product Quality');
    expect(result.length).toBeGreaterThanOrEqual(5);
  });
});

describe('generateInsights', () => {
  it('returns empty array for empty input without calling the model', async () => {
    await expect(generateInsights([])).resolves.toEqual([]);
    expect(mockedGenerateText).not.toHaveBeenCalled();
  });

  it('returns empty array on model failure', async () => {
    mockedGenerateText.mockRejectedValue(new Error('boom'));

    await expect(
      generateInsights([{ category: 'Pricing', text: 'too expensive' }]),
    ).resolves.toEqual([]);
  });
});

describe('buildChatPrompt / streamChat', () => {
  it('embeds the user message and feedback context', () => {
    const prompt = buildChatPrompt('top issues?', [
      { category: 'Pricing', text: 'too expensive', sentiment: 'Negative', urgency: 'High' },
    ]);

    expect(prompt).toContain('top issues?');
    expect(prompt).toContain('too expensive');
  });

  it('includes satisfaction and fixable-problem annotations when present', () => {
    const prompt = buildChatPrompt('why churn risk?', [
      {
        category: 'Service',
        text: 'waited 40 minutes',
        sentiment: 'Positive',
        urgency: 'Medium',
        satisfactionEstimate: 2,
        fixableProblem: true,
        retentionRisk: 'High',
      },
    ]);

    expect(prompt).toContain('Satisfaction: 2/5');
    expect(prompt).toContain('Fixable: yes');
    expect(prompt).toContain('Risk: High');
  });

  it('yields the fallback message when the stream is empty', async () => {
    mockedStreamText.mockReturnValue({
      textStream: (async function* () {})(),
    } as never);

    const chunks: string[] = [];
    for await (const chunk of streamChat('hi', [])) {
      chunks.push(chunk);
    }

    expect(chunks.join('')).toContain('Sorry, I encountered an error');
  });

  it('forwards stream chunks on success', async () => {
    mockedStreamText.mockReturnValue({
      textStream: (async function* () {
        yield 'hel';
        yield 'lo';
      })(),
    } as never);

    const chunks: string[] = [];
    for await (const chunk of streamChat('hi', [])) {
      chunks.push(chunk);
    }

    expect(chunks.join('')).toBe('hello');
  });
});

describe('buildChatSystemPrompt / createChatMessageStream', () => {
  it('injects feedback context into the system prompt', () => {
    const prompt = buildChatSystemPrompt([
      { category: 'Pricing', text: 'too expensive', sentiment: 'Negative', urgency: 'High' },
    ]);

    expect(prompt).toContain('too expensive');
    expect(prompt).not.toContain('User question');
  });

  it('converts UI messages and returns a UI-message stream', async () => {
    const modelMessages = [{ role: 'user', content: 'top issues?' }];
    mockedConvertToModelMessages.mockResolvedValue(modelMessages as never);
    mockedStreamText.mockReturnValue({ stream: 'model-stream' } as never);
    mockedToUIMessageStream.mockReturnValue('ui-stream' as never);

    const messages = [
      { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'top issues?' }] },
    ] as never;

    await expect(createChatMessageStream(messages, [])).resolves.toBe('ui-stream');
    expect(mockedConvertToModelMessages).toHaveBeenCalledWith(messages);
    expect(mockedStreamText).toHaveBeenCalledWith(
      expect.objectContaining({ messages: modelMessages }),
    );
    expect(mockedToUIMessageStream).toHaveBeenCalledWith({ stream: 'model-stream' });
  });
});

describe('draftOwnerReply (Phase 4 D1/F6)', () => {
  it('returns the model draft trimmed to 1000 chars', async () => {
    mockedGenerateText.mockResolvedValue({ text: '  Thanks — fixing it this week.  ' } as never);
    const draft = await draftOwnerReply({ text: 'cold food', category: 'Food' });
    expect(draft).toBe('Thanks — fixing it this week.');
  });

  it('falls back to a suggestedAction template on model failure', async () => {
    mockedGenerateText.mockRejectedValue(new Error('boom'));
    const draft = await draftOwnerReply({
      text: 'cold food',
      category: 'Food',
      suggestedAction: 'Reheat protocol retraining',
      businessName: 'Demo Cafe',
    });
    expect(draft).toContain('Demo Cafe');
    expect(draft).toContain('Reheat protocol retraining');
  });
});

describe('answerAnalyticsQuery (Phase 7 E1)', () => {
  it('routes retention questions to getRetentionRisk and summarizes', async () => {
    vi.mocked(analyticsService.getRetentionRisk).mockResolvedValue({
      counts: { Low: 1, Medium: 2, High: 3 },
      highRiskOpen: [{ id: 'f1' }],
      avgSatisfaction: 2.5,
      total: 6,
      fixableCount: 2,
    } as never);
    mockedGenerateText.mockResolvedValue({ text: 'Churn is concentrated...' } as never);

    const result = await answerAnalyticsQuery('who is at risk of churn?', 'org-1', []);
    expect(analyticsService.getRetentionRisk).toHaveBeenCalledWith('org-1', 30);
    expect(result.cards[0]?.kind).toBe('retention');
    expect(result.summary).toContain('Churn');
  });

  it('defaults to top issues when no keyword matches', async () => {
    vi.mocked(analyticsService.getTopIssues).mockResolvedValue([{ text: 'slow' }] as never);
    mockedGenerateText.mockResolvedValue({ text: 'Top issue is speed.' } as never);

    const result = await answerAnalyticsQuery('hello there', 'org-1', []);
    expect(analyticsService.getTopIssues).toHaveBeenCalled();
    expect(result.cards[0]?.kind).toBe('issues');
  });
});
