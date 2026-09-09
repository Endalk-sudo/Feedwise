import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: keyof typeof paddings;
}

export function Card({ padding = 'md', className, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-card border border-border rounded-xl', paddings[padding], className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'px-5 py-4 border-b border-border flex items-center justify-between gap-3',
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('font-semibold flex items-center gap-2', className)} {...props} />;
}
