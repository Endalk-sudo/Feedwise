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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          'absolute top-0 bottom-0 w-64 bg-card border-border flex flex-col',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          className,
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-bold">{label}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
