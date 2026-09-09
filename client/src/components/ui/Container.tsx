import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const widths = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-7xl',
} as const;

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  width?: keyof typeof widths;
}

/** Centered content column with standard gutters. */
export function Container({ width = 'xl', className, ...props }: ContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', widths[width], className)}
      {...props}
    />
  );
}

export interface CenteredLayoutProps extends HTMLAttributes<HTMLDivElement> {
  width?: keyof typeof widths;
}

/** Full-screen centered shell used by auth, setup, public and error pages. */
export function CenteredLayout({ width = 'sm', className, ...props }: CenteredLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className={cn('w-full', widths[width], className)} {...props} />
    </div>
  );
}
