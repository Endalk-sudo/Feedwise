import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-semibold tracking-tight rounded-full border whitespace-nowrap leading-none',
  {
    variants: {
      variant: {
        success: 'bg-success/10 text-success border-success/25',
        warning: 'bg-warning/10 text-warning border-warning/25',
        destructive: 'bg-destructive/10 text-destructive border-destructive/25',
        info: 'bg-primary/10 text-primary border-primary/25',
        neutral: 'bg-muted/70 text-muted-foreground border-border/60',
        muted: 'bg-muted/70 text-muted-foreground border-border/60',
      },
      size: {
        xs: 'px-2.5 py-1 text-[11px]',
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-3 py-1.5 text-[13px]',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'xs' },
  },
);
