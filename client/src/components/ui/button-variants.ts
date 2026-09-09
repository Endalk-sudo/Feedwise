import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        brand: 'btn-brand',
        secondary:
          'bg-secondary text-secondary-foreground border border-input rounded-lg hover:bg-secondary/80',
        outline: 'border border-input bg-background rounded-lg text-foreground hover:bg-muted',
        ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg',
        destructive:
          'bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90',
        success: 'bg-success/15 text-success rounded-lg hover:bg-success/25',
        warning: 'bg-warning/15 text-warning rounded-lg hover:bg-warning/25',
      },
      size: {
        xs: 'px-3 py-1.5 text-xs rounded-lg',
        sm: 'px-3 py-2 text-xs rounded-lg',
        md: 'px-4 py-2 text-sm rounded-lg',
        lg: 'px-6 py-3 text-sm rounded-lg',
      },
    },
    defaultVariants: { variant: 'brand', size: 'md' },
  },
);
