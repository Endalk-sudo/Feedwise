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
    <div className={cn('text-center', compact ? 'py-8' : 'py-12', className)}>
      {Icon && (
        <Icon
          className={cn(
            'text-muted-foreground/40 mx-auto mb-3',
            compact ? 'w-10 h-10' : 'w-12 h-12',
          )}
        />
      )}
      {compact ? (
        <p className="font-medium text-sm">{title}</p>
      ) : (
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
      )}
      {description && (
        <div
          className={cn(
            'text-muted-foreground mx-auto',
            compact ? 'text-xs mt-1 max-w-sm' : 'text-sm mt-1 max-w-md',
          )}
        >
          {description}
        </div>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
