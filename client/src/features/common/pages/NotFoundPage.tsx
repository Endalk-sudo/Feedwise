import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { CenteredLayout, buttonVariants } from '@/components/ui';
import { cn } from '@/lib/utils';

export function NotFoundPage() {
  return (
    <CenteredLayout width="sm">
      <div className="text-center rounded-3xl border border-border/70 bg-card shadow-sm px-6 py-12 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
          Error 404
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance mb-3">
          Page not found
        </h1>
        <p className="text-muted-foreground text-[15px] leading-relaxed mb-8 max-w-md mx-auto">
          This link may be mistyped, moved, or no longer available.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}>
            Go home
          </Link>
          <Link
            to="/dashboard"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full sm:w-auto')}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </CenteredLayout>
  );
}
