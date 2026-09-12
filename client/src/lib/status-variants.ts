import type { BadgeProps } from '@/components/ui';

/** Single source of truth for sentiment/urgency badge colors (all pages). */
export const sentimentVariant: Record<string, BadgeProps['variant']> = {
  Positive: 'success',
  Negative: 'destructive',
  Neutral: 'neutral',
  Mixed: 'warning',
};

export const urgencyVariant: Record<string, BadgeProps['variant']> = {
  High: 'destructive',
  Medium: 'warning',
  Low: 'success',
};

export const retentionRiskVariant: Record<string, BadgeProps['variant']> = {
  High: 'destructive',
  Medium: 'warning',
  Low: 'success',
};

export function satisfactionVariant(score: number | null | undefined): BadgeProps['variant'] {
  if (typeof score !== 'number') return 'neutral';
  if (score <= 2) return 'destructive';
  if (score === 3) return 'warning';
  return 'success';
}
