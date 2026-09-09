import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
} as const;

export function Spinner({
  size = 'md',
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  return <Loader2 className={cn('animate-spin text-primary', sizes[size], className)} />;
}

export function LoadingState({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 p-12 text-center text-muted-foreground text-sm',
        className,
      )}
    >
      <Spinner size="md" />
      {message}
    </div>
  );
}
