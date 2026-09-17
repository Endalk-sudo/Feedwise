import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        brand: 'btn-brand',
        secondary:
          'bg-secondary text-secondary-foreground border border-border/60 rounded-xl shadow-xs hover:bg-secondary/80 hover:shadow-sm',
        outline:
          'border border-input bg-card rounded-xl text-foreground shadow-xs hover:bg-muted hover:border-ring/40 hover:shadow-sm',
        ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl',
        destructive:
          'bg-destructive text-destructive-foreground rounded-xl shadow-xs hover:bg-destructive/90 hover:shadow-sm',
        success:
          'bg-success/10 text-success border border-success/20 rounded-xl hover:bg-success/20',
        warning:
          'bg-warning/10 text-warning border border-warning/20 rounded-xl hover:bg-warning/20',
      },
      size: {
        xs: 'px-3 py-1.5 min-h-8 text-xs rounded-xl',
        sm: 'px-3.5 py-2 min-h-9 text-xs rounded-xl',
        md: 'px-4 py-2.5 min-h-10 text-sm rounded-xl',
        lg: 'px-6 py-3.5 min-h-12 text-[15px] rounded-xl',
      },
    },
    defaultVariants: { variant: 'brand', size: 'md' },
  },
);
