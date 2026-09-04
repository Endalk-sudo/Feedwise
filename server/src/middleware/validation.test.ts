import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from './validation.js';

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & { status: typeof res.status; json: typeof res.json };
}

describe('validate middleware', () => {
  it('passes valid input and replaces req data with parsed values', async () => {
    const schema = z.object({
      body: z.object({ name: z.string().min(2) }),
      query: z.object({ page: z.coerce.number().default(1) }),
      params: z.object({ slug: z.string() }),
    });

    const req = { body: { name: 'ab' }, query: {}, params: { slug: 'demo' } } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await validate(schema)(req, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.body).toEqual({ name: 'ab' });
    // defaults applied by zod
    expect((req.query as unknown as { page: number }).page).toBe(1);
  });

  it('rejects invalid input with a 400 envelope', async () => {
    const schema = z.object({ body: z.object({ name: z.string().min(2) }) });

    const req = { body: { name: 'x' }, query: {}, params: {} } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const payload = res.json.mock.calls[0]?.[0] as {
      success: boolean;
      errors: Array<{ field: string }>;
    };
    expect(payload.success).toBe(false);
    expect(payload.errors[0]?.field).toBe('body.name');
  });

  it('replaces getter-only req.query (Express 5) without throwing', async () => {
    const schema = z.object({ query: z.object({ days: z.coerce.number().default(30) }) });

    // Simulate Express 5: query is a getter-only property
    const req = {} as Record<string, unknown>;
    Object.defineProperty(req, 'query', { value: {}, enumerable: true, configurable: true });
    (req as Record<string, unknown>).body = undefined;
    (req as Record<string, unknown>).params = {};

    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await validate(schema)(req as unknown as Request, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect((req.query as unknown as { days: number }).days).toBe(30);
  });
});
