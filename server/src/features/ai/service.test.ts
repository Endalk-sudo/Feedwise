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

import { generateText, streamText, convertToModelMessages, toUIMessageStream } from 'ai';
import {
  analyzeFeedback,
  generateCategoriesForBusiness,
  generateInsights,
  streamChat,
  buildChatPrompt,
  buildChatSystemPrompt,
  createChatMessageStream,
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
  });

  it('returns the safe fallback when the model call fails', async () => {
    mockedGenerateText.mockRejectedValue(new Error('boom'));

    const result = await analyzeFeedback('anything', ['General']);

    expect(result).toEqual({
      category: 'General',
      sentiment: 'Neutral',
      urgency: 'Low',
      rating: 3,
      keyPoints: ['Analysis failed'],
      keywords: [],
      themes: [],
      rootCause: 'Unknown',
      suggestedAction: 'Review this feedback manually',
      confidence: 0.1,
    });
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
