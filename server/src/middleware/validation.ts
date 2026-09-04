import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/** Request shape validated by our schemas: { body?, query?, params? } */
type ValidatedRequest = {
  body?: unknown;
  query?: unknown;
  params?: unknown;
};

/**
 * Validation middleware using Zod schemas (Zod v4).
 * Validates body, query and params, then replaces them with parsed data.
 */
export function validate<T extends z.ZodType<ValidatedRequest>>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await schema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Replace request data with validated (and defaulted) data.
    // NOTE: under Express 5 `req.query` is getter-only, so it must be
    // redefined rather than assigned.
    if (result.data.body !== undefined) req.body = result.data.body;
    if (result.data.query !== undefined) {
      Object.defineProperty(req, 'query', {
        value: result.data.query,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    if (result.data.params !== undefined) req.params = result.data.params as Request['params'];

    next();
  };
}

/** Validate only body */
export function validateBody<T extends z.ZodType>(schema: T) {
  return validate(z.object({ body: schema }));
}

/** Validate only query */
export function validateQuery<T extends z.ZodType>(schema: T) {
  return validate(z.object({ query: schema }));
}

/** Validate only params */
export function validateParams<T extends z.ZodType>(schema: T) {
  return validate(z.object({ params: schema }));
}
