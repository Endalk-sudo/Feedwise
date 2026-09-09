import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { CenteredLayout, buttonVariants } from '@/components/ui';
import { cn } from '@/lib/utils';

export function NotFoundPage() {
  return (
    <CenteredLayout width="sm">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page not found</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or
          doesn&apos;t exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className={cn(buttonVariants({ size: 'lg' }))}>
            Go Home
          </Link>
          <Link
            to="/dashboard"
            className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }))}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </CenteredLayout>
  );
}
