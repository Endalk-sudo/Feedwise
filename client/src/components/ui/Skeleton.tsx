import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('loading-skeleton rounded-md', className)} {...props} />;
}

export function SkeletonText({
  lines = 3,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

export function SkeletonCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-4 p-4', className)} {...props}>
      <Skeleton className="h-6 w-1/4" />
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonStatCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-4 space-y-2', className)} {...props}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  );
}

export function SkeletonTableRow({
  columns = 5,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { columns?: number }) {
  return (
    <div className={cn('grid gap-4', `grid-cols-${columns}`, className)} {...props}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

export function SkeletonChart({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Skeleton className={cn('h-[300px] w-full', className)} {...props} />;
}
