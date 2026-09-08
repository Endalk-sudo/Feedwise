import { describe, it, expect } from 'vitest';

import { chatSchema, chatStreamSchema } from './schemas.js';

const slug = { slug: 'demo-coffee' };

function streamBody(overrides = {}) {
  return {
    messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'top issues?' }] }],
    ...overrides,
  };
}

describe('chatStreamSchema', () => {
  it('accepts a valid UI-message payload (extra transport keys stripped)', () => {
    const result = chatStreamSchema.safeParse({
      body: { ...streamBody(), id: 'chat-1', trigger: 'submit-message' },
      params: slug,
    });

    expect(result.success).toBe(true);
  });

  it('accepts multi-turn history with assistant replies', () => {
    const result = chatStreamSchema.safeParse({
      body: {
        messages: [
          { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'hi' }] },
          { id: 'm2', role: 'assistant', parts: [{ type: 'text', text: 'hello' }] },
          { id: 'm3', role: 'user', parts: [{ type: 'text', text: 'more detail' }] },
        ],
      },
      params: slug,
    });

    expect(result.success).toBe(true);
  });

  it('rejects empty history, system roles, and non-text parts', () => {
    expect(chatStreamSchema.safeParse({ body: { messages: [] }, params: slug }).success).toBe(
      false,
    );
    expect(
      chatStreamSchema.safeParse({
        body: streamBody({
          messages: [{ id: 'm1', role: 'system', parts: [{ type: 'text', text: 'x' }] }],
        }),
        params: slug,
      }).success,
    ).toBe(false);
    expect(
      chatStreamSchema.safeParse({
        body: streamBody({
          messages: [{ id: 'm1', role: 'user', parts: [{ type: 'file', url: 'x' }] }],
        }),
        params: slug,
      }).success,
    ).toBe(false);
  });

  it('rejects oversized payloads', () => {
    const tooLong = 'x'.repeat(4001);
    expect(
      chatStreamSchema.safeParse({
        body: streamBody({
          messages: [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: tooLong }] }],
        }),
        params: slug,
      }).success,
    ).toBe(false);
    expect(
      chatStreamSchema.safeParse({
        body: {
          messages: Array.from({ length: 51 }, (_, i) => ({
            id: `m${i}`,
            role: 'user',
            parts: [{ type: 'text', text: 'hi' }],
          })),
        },
        params: slug,
      }).success,
    ).toBe(false);
  });
});

describe('chatSchema (blocking endpoint)', () => {
  it('still accepts the legacy single-message payload', () => {
    expect(chatSchema.safeParse({ body: { message: 'hi' }, params: slug }).success).toBe(true);
  });
});
