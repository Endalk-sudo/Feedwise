import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ChevronLeft, QrCode, Sparkles, BarChart3 } from 'lucide-react';
import { CenteredLayout, Card, Logo } from '@/components/ui';
import { cn } from '@/lib/utils';

const HIGHLIGHTS = [
  {
    icon: QrCode,
    title: 'QR in seconds',
    text: 'Print one code, collect feedback on every table and receipt.',
  },
  {
    icon: Sparkles,
    title: 'AI that triages',
    text: 'Satisfaction, urgency and fixable issues — flagged instantly.',
  },
  {
    icon: BarChart3,
    title: 'Insights that act',
    text: 'Trends, alerts and a daily digest in your inbox.',
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
  /** Onboarding progress: register is step 1 of 2 (account → organization). */
  step?: { current: number; total: number; label: string };
}) {
  return (
    <CenteredLayout width="lg">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to home
      </Link>

      <Card padding="none" className="overflow-hidden">
        <div className="grid lg:grid-cols-[1fr_1.2fr]">
          {/* Brand panel — desktop only */}
          <aside className="hidden lg:flex flex-col justify-between gap-8 bg-gradient-to-br from-primary/15 via-card to-accent/10 border-r border-border p-10">
            <div>
              <div className="flex items-center gap-2 mb-8">
                <Logo size="md" />
                <span className="font-bold text-xl">FeedWise</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                Know what your customers think in seconds, not hours.
              </h2>
              <p className="text-muted-foreground text-sm">
                Join businesses turning raw feedback into revenue-saving action.
              </p>
            </div>
            <ul className="space-y-5">
              {HIGHLIGHTS.map((h) => (
                <li key={h.title} className="flex gap-3">
                  <span className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <h.icon className="w-4.5 h-4.5 text-primary" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{h.title}</span>
                    <span className="block text-sm text-muted-foreground">{h.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <figure className="rounded-xl border border-border bg-card p-4">
              <blockquote className="text-sm italic text-foreground">
                “We spotted our top complaint in the first week — and fixed it before
                the weekend rush.”
              </blockquote>
              <figcaption className="text-xs text-muted-foreground mt-2">
                Sarah Chen, Head of Product at NovaTech
              </figcaption>
            </figure>
          </aside>

          {/* Form column */}
          <div className="p-6 sm:p-10">
            {step && (
              <ol
                aria-label="Signup progress"
                className="flex items-center gap-2 mb-6 text-xs font-medium"
              >
                {Array.from({ length: step.total }).map((_, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center border',
                        i + 1 < step.current ||
                          (i + 1 === step.current && step.current === step.total)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : i + 1 === step.current
                            ? 'border-primary text-primary'
                            : 'border-border text-muted-foreground',
                      )}
                    >
                      {i + 1}
                    </span>
                    {i === 0 && <span className="text-foreground">Account</span>}
                    {i === 1 && <span className="text-muted-foreground">Organization</span>}
                    {i < step.total - 1 && <span className="w-6 h-px bg-border mx-1" />}
                  </li>
                ))}
                <span className="ml-auto text-muted-foreground">{step.label}</span>
              </ol>
            )}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">{title}</h1>
              <div className="text-muted-foreground">{description}</div>
            </div>

            {children}

            {footer && <div className="mt-6 text-center text-muted-foreground">{footer}</div>}
          </div>
        </div>
      </Card>
    </CenteredLayout>
  );
}
