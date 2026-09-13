import { Link } from '@tanstack/react-router';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container, buttonVariants } from '@/components/ui';
import { pricing } from '../landing-data';
import { Reveal } from './Reveal';

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-card/50 scroll-mt-16">
      <Container width="xl">
        <Reveal className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the plan that&apos;s right for your business. All plans include a 14-day free
            trial.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {pricing.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 100} className="h-full">
              <div
                className={cn(
                  'relative h-full p-8 rounded-xl bg-card border flex flex-col',
                  plan.popular
                    ? 'border-2 border-primary/50 shadow-lg shadow-primary/10'
                    : 'border-border',
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-5xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-foreground">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
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
