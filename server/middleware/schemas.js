import { z } from 'zod';

// --- AUTH SCHEMAS ---

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const orgSetupSchema = z.object({
  body: z.object({
    orgName: z.string().min(2, 'Organization name is required'),
    orgSlug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric and hyphenated'),
    businessType: z.string().min(2, 'Business type is required'),
    businessDescription: z.string().min(10, 'Business description must be at least 10 characters'),
  }),
});

// --- FEEDBACK SCHEMAS ---

export const submitFeedbackSchema = z.object({
  params: z.object({
    orgSlug: z.string().min(1, 'Organization slug is required'),
  }),
  body: z.object({
    text: z.string().min(10, 'Feedback must be at least 10 characters').max(5000, 'Feedback is too long'),
  }),
});

export const getFeedbackSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});
