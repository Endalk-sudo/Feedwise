import type { HTMLAttributes } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { badgeVariants } from './badge-variants';

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ variant, size, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
