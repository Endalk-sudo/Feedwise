import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 font-medium rounded-full border whitespace-nowrap',
  {
    variants: {
      variant: {
        success: 'bg-success/15 text-success border-success/30',
        warning: 'bg-warning/15 text-warning border-warning/30',
        destructive: 'bg-destructive/15 text-destructive border-destructive/30',
        info: 'bg-primary/15 text-primary border-primary/30',
        neutral: 'bg-muted text-muted-foreground border-transparent',
        muted: 'bg-muted text-muted-foreground border-transparent',
      },
      size: {
        xs: 'px-2 py-0.5 text-[10px]',
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'xs' },
  },
);
