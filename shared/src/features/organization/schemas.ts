import { z } from 'zod';

export const createOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters'),
    slug: z
      .string()
      .min(2, 'Slug is required')
      .regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric and hyphenated'),
    businessType: z.string().min(2, 'Business type is required'),
    businessDescription: z.string().min(10, 'Business description must be at least 10 characters'),
  }),
});

export const updateOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    logo: z.string().url().optional().or(z.literal('')),
    // Org-level email opt-out consumed by digest/referral sends (mail.ts)
    emailDigest: z.boolean().optional(),
  }),
  params: z.object({
    slug: z.string().min(1),
  }),
});

export const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    role: z.enum(['admin', 'member']).default('member'),
  }),
  params: z.object({
    slug: z.string().min(1),
  }),
});

export const removeMemberSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
    userId: z.string().min(1),
  }),
});

export const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(['admin', 'member']),
  }),
  params: z.object({
    slug: z.string().min(1),
    userId: z.string().min(1),
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

// ===== Client form schema (body-only subset used by react-hook-form) =====
export const orgSetupFormSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric and hyphenated'),
  businessType: z.string().min(2, 'Business type is required'),
  businessDescription: z.string().min(10,'Business description must be at least 10 characters'),
});
export type OrgSetupForm = z.infer<typeof orgSetupFormSchema>;