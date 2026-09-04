import { z } from 'zod';

export const logoQuerySchema = z.object({
  query: z.object({
    slug: z.string().min(1,'Organization slug is required'),
  }),
});

export const updateSettingsSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).optional(),
      logo: z.string().url().optional().or(z.literal('')),
    })
    .refine((body) => body.name !== undefined || body.logo !== undefined, {
      message: 'At least one of name or logo is required',
    }),
  params: z.object({
    slug: z.string().min(1),
  }),
});

export const getSettingsSchema = z.object({
  params: z.object({
    slug: z.string().min(1),
  }),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

// ===== Client form schema (body-only subset used by react-hook-form) =====
export const updateSettingsFormSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  logo: z.string().url().optional().or(z.literal('')),
});
export type SettingsForm = z.infer<typeof updateSettingsFormSchema>;