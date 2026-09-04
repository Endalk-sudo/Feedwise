import { z } from 'zod';

export const createOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters'),
    slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric and hyphenated'),
    businessType: z.string().min(2, 'Business type is required'),
    businessDescription: z.string().min(10, 'Business description must be at least 10 characters'),
  }),
});

export const updateOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    logo: z.string().url().optional().or(z.literal('')),
  }),
});

export const orgParamsSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
    orgId: z.string().optional(),
  }),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;