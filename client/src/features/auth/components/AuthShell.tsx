import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { CenteredLayout, Card } from '@/components/ui';

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <CenteredLayout width="sm">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to home
      </Link>

      <Card padding="lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {children}

        {footer && <div className="mt-6 text-center text-muted-foreground">{footer}</div>}
      </Card>
    </CenteredLayout>
  );
}
