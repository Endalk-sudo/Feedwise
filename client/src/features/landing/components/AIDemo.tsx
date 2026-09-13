import { Link } from '@tanstack/react-router';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container, buttonVariants } from '@/components/ui';
import { Reveal } from './Reveal';

const chips = [
  { label: 'Negative', className: 'bg-destructive/10 text-destructive border-destructive/30' },
  { label: 'Service', className: 'bg-primary/10 text-primary border-primary/30' },
  { label: 'High urgency', className: 'bg-warning/10 text-warning border-warning/30' },
  { label: 'Satisfaction 2/5', className: 'bg-muted text-foreground border-border' },
];

export function AIDemo() {
  return (
    <section id="demo" className="py-20 bg-card/50 scroll-mt-16">
      <Container width="xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
              Live sample
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Watch raw words become a to-do list
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              This is what FeedWise produces for every single response — sentiment, satisfaction,
              category, urgency, retention risk, and the one action that matters most.
            </p>
            <Link to="/auth/register" className={cn(buttonVariants({ size: 'lg' }))}>
              Try it on your feedback
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Reveal>

          <Reveal delay={150}>
            <div className="rounded-2xl border border-border bg-card shadow-xl shadow-primary/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border text-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold">AI analysis</span>
                <span className="ml-auto text-xs text-muted-foreground">analyzed in 8s</span>
              </div>
              <div className="p-5 space-y-4">
                <blockquote className="text-foreground italic border-l-2 border-primary pl-3">
                  “Waited 40 minutes for our food and nobody updated us. The pasta was great, but we
                  almost walked out.”
                </blockquote>
                <div className="flex items-center gap-1" aria-label="Customer rating: 2 out of 5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'w-4 h-4',
                        star <= 2 ? 'fill-warning text-warning' : 'text-muted-foreground',
                      )}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip) => (
                    <span
                      key={chip.label}
                      className={cn(
                        'text-xs font-medium border rounded-full px-2.5 py-1',
                        chip.className,
                      )}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
                <div className="rounded-xl bg-muted/60 p-3 text-sm">
                  <p className="font-semibold mb-1">Suggested action</p>
                  <p className="text-muted-foreground">
                    Staff the floor during peak hours and add table wait-time updates — fixable this
                    week.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
