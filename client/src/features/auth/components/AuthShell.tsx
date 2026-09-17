import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronLeft, QrCode, Sparkles, BarChart3 } from 'lucide-react';
import { CenteredLayout, Card, Logo } from '@/components/ui';
import { cn } from '@/lib/utils';

const HIGHLIGHTS = [
  {
    icon: QrCode,
    title: 'Make it easy to share',
    text: 'Collect feedback with a QR code or a link. No customer account needed.',
  },
  {
    icon: Sparkles,
    title: 'Find what needs attention',
    text: 'See satisfaction, urgency, and recurring issues in one place.',
  },
  {
    icon: BarChart3,
    title: 'Keep your team informed',
    text: 'Follow trends and get feedback summaries in your inbox.',
  },
];

export function AuthShell({
  title,
  description,
  children,
  footer,
  step,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  step?: { current: number; total: number; label: string };
}) {
  return (
    <CenteredLayout width="lg">
      <Link
        to="/"
        className="inline-flex min-h-11 items-center gap-1 rounded-lg text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mb-5"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to home
      </Link>

      <Card padding="none" className="overflow-hidden rounded-2xl shadow-sm">
        <div className="grid lg:grid-cols-[0.9fr_1.2fr]">
          <aside className="hidden lg:flex flex-col justify-between gap-10 bg-muted/50 border-r border-border p-8">
            <div>
              <div className="flex items-center gap-2.5 mb-12">
                <Logo size="sm" />
                <span className="font-semibold text-lg tracking-tight">FeedWise</span>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight leading-tight mb-4">
                A clearer view of your customer experience.
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Bring customer feedback into one workspace, then decide what to improve next.
              </p>
            </div>
            <ul className="space-y-6">
              {HIGHLIGHTS.map((h) => (
                <li key={h.title} className="flex gap-3">
                  <span className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                    <h.icon className="w-4 h-4 text-primary" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium mb-1">{h.title}</span>
                    <span className="block text-sm leading-relaxed text-muted-foreground">{h.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
              Collect feedback. Understand the patterns. Take the next step.
            </p>
          </aside>

          <main className="min-w-0 p-5 sm:p-10">
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <Logo size="sm" />
              <span className="font-semibold tracking-tight">FeedWise</span>
            </div>
            {step && (
              <div className="mb-8 border-b border-border pb-6">
                <p className="mb-3 text-xs font-medium text-muted-foreground">{step.label}</p>
                <ol aria-label="Signup progress" className="flex flex-wrap items-center gap-4 text-xs font-medium">
                  {Array.from({ length: step.total }).map((_, i) => (
                    <li
                      key={i}
                      aria-current={i + 1 === step.current ? 'step' : undefined}
                      className="flex items-center gap-2"
                    >
                      <span
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center border',
                          i + 1 <= step.current
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'border-border text-muted-foreground',
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className={i + 1 === step.current ? 'text-foreground' : 'text-muted-foreground'}>
                        {i === 0 ? 'Account' : 'Organization'}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">{title}</h1>
              <div className="text-sm leading-relaxed text-muted-foreground">{description}</div>
            </div>

            {children}

            {footer && <div className="mt-8 border-t border-border pt-6 text-center text-sm leading-relaxed text-muted-foreground">{footer}</div>}
          </main>
        </div>
      </Card>
    </CenteredLayout>
  );
}
