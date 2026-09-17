import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Drawer({
  open,
  onClose,
  label = 'Menu',
  side = 'left',
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  label?: string;
  side?: 'left' | 'right';
  children: ReactNode;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute top-0 bottom-0 w-72 max-w-[85vw] bg-card border-border flex flex-col shadow-xl',
          side === 'left' ? 'left-0 border-r rounded-r-2xl' : 'right-0 border-l rounded-l-2xl',
          className,
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/70">
          <span className="font-semibold tracking-tight">{label}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
