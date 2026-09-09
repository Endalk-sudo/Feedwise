import { MessageSquare, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const sizes = {
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-10 h-10 rounded-lg',
  lg: 'w-14 h-14 rounded-xl',
  xl: 'w-16 h-16 rounded-xl',
} as const;

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
  xl: 'w-8 h-8',
} as const;

export function Logo({
  icon: Icon = MessageSquare,
  size = 'md',
  className,
}: {
  icon?: LucideIcon;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0',
        sizes[size],
        className,
      )}
    >
      <Icon className={cn('text-primary-foreground', iconSizes[size])} />
    </div>
  );
}
