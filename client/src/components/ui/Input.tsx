import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const inputBase =
  'w-full bg-background border border-input rounded-xl text-foreground text-[15px] placeholder:text-muted-foreground/80 shadow-xs hover:border-ring/40 focus:outline-none focus:ring-4 focus:ring-ring/15 focus:border-ring transition-all duration-200 disabled:opacity-50';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputBase, 'px-4 py-3', className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(inputBase, 'px-4 py-3', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(inputBase, 'px-3 py-2.5 text-sm', className)} {...props} />
  ),
);
Select.displayName = 'Select';

export function Field({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label?: ReactNode;
  htmlFor?: string;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      {children}
      {error && <FieldError message={error} />}
    </div>
  );
}

export function FieldError({ message }: { message: ReactNode }) {
  return (
    <p className="mt-1 text-sm text-destructive flex items-center gap-1">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {message}
    </p>
  );
}
