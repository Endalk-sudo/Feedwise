import { Link } from '@tanstack/react-router';
import { ArrowRight, CheckCircle2, QrCode, Star, TrendingUp, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container, buttonVariants } from '@/components/ui';
import { Reveal } from './Reveal';

const trustPoints = ['No credit card required', '14-day free trial', 'Cancel anytime'];

const trendBars = [38, 52, 44, 63, 58, 74, 82];

function DashboardMock() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-xl shadow-primary/10 overflow-hidden text-left">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border">
        <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-warning/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
        <span className="ml-2 text-xs text-muted-foreground">Feedwise dashboard</span>
      </div>
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Avg. satisfaction</p>
            <p className="text-2xl font-bold">
              4.2 <span className="text-xs font-medium text-muted-foreground">/ 5</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-success bg-success/10 rounded-full px-2.5 py-1">
            <TrendingUp className="w-3.5 h-3.5" />
            +12% this week
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-20" aria-hidden="true">
          {trendBars.map((height, i) => (
            <div
              key={i}
              style={{ height: `${height}%` }}
              className="flex-1 rounded-sm bg-gradient-to-t from-primary/40 to-primary"
            />
          ))}
        </div>
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <TriangleAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">Urgent: long wait times mentioned 6×</p>
            <p className="text-muted-foreground mt-0.5">Alert emailed to your team instantly</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QrMock() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg p-5 text-center">
      <div className="mx-auto w-fit rounded-xl bg-foreground p-3">
        <QrCode className="w-16 h-16 text-background" />
      </div>
      <p className="mt-3 text-sm font-semibold">Scan to leave feedback</p>
      <div className="mt-1.5 flex justify-center gap-0.5" aria-label="4.5 out of 5 stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'w-4 h-4',
              star <= 4 ? 'fill-warning text-warning' : 'text-muted-foreground',
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">No app · no account needed</p>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8">
      {/* Ambient background wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--primary)_0%,transparent_70%)] opacity-10"
      />
      <Container width="xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <a
              href="#demo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 hover:bg-primary/15 transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              New: AI Chat Assistant now available
            </a>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Turn Customer Feedback into{' '}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Actionable Insights
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-10">
              Stick a QR code on the table. AI scores every response for sentiment, satisfaction,
              and urgency — then tells you exactly what to fix first.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
              <Link
                to="/auth/register"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'w-full sm:w-auto px-8 py-4 text-lg shadow-lg shadow-primary/25',
                )}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto border-2 border-input px-8 py-4 rounded-lg text-foreground font-semibold text-lg hover:border-primary transition-all text-center"
              >
                See How It Works
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-3 text-muted-foreground text-sm">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <Reveal className="relative" delay={150}>
            <div className="grid sm:grid-cols-[1fr_180px] gap-4 items-start max-w-lg mx-auto lg:max-w-none">
              <DashboardMock />
              <QrMock />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
