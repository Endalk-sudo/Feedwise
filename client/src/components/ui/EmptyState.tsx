import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('text-center', compact ? 'py-8 px-4' : 'py-12 px-6', className)}>
      {Icon && (
        <div
          className={cn(
            'mx-auto mb-4 flex items-center justify-center rounded-2xl bg-muted/60 border border-border/60',
            compact ? 'h-14 w-14' : 'h-16 w-16',
          )}
        >
          <Icon
            className={cn(
              'text-muted-foreground',
              compact ? 'w-7 h-7' : 'w-8 h-8',
            )}
          />
        </div>
      )}
      {compact ? (
        <p className="font-semibold text-[15px] tracking-tight">{title}</p>
      ) : (
        <h2 className="text-xl font-semibold tracking-tight text-balance">{title}</h2>
      )}
      {description && (
        <div
          className={cn(
            'text-muted-foreground mx-auto leading-relaxed text-balance',
            compact ? 'text-[13px] mt-1.5 max-w-sm' : 'text-sm mt-2 max-w-md',
          )}
        >
          {description}
        </div>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
