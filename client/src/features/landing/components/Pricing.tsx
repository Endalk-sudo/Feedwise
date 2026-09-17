import { Link } from '@tanstack/react-router';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container, buttonVariants } from '@/components/ui';
import { pricing } from '../landing-data';
import { Reveal } from './Reveal';

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-24 bg-muted/40 border-y border-border/60 scroll-mt-16">
      <Container width="xl">
        <Reveal className="text-center mb-12 sm:mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
            Start with a 14-day free trial. Upgrade when the feedback starts flowing.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto items-stretch">
          {pricing.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 100} className="h-full">
              <div
                className={cn(
                  'relative h-full p-7 sm:p-8 rounded-2xl bg-card border flex flex-col',
                  plan.popular
                    ? 'border-primary/40 border-2 shadow-md shadow-primary/10'
                    : 'border-border/70 shadow-xs',
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight whitespace-nowrap shadow-sm">
                    Most popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold tracking-tight mb-1.5">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{plan.description}</p>
                </div>

                <div className="mb-6 flex items-baseline gap-1.5">
                  <span className="text-5xl font-semibold tracking-tight tabular-nums">${plan.price}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-[15px] text-foreground">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0" />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/auth/register"
                  search={{ plan: plan.plan }}
                  className={cn(
                    buttonVariants({
                      variant: plan.popular ? 'brand' : 'secondary',
                      size: 'lg',
                    }),
                    'w-full mt-auto',
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
