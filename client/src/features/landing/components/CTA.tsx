import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container, buttonVariants } from '@/components/ui';
import { Reveal } from './Reveal';

export function CTA() {
  return (
    <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
      <Container width="lg">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card px-6 py-12 sm:px-12 sm:py-16 text-center shadow-md">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"
            />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance mb-4">
                Ready to understand your customers better?
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-xl mx-auto">
                Set up in minutes — your first QR code is one signup away.
              </p>
              <Link
                to="/auth/register"
                className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}
              >
                Start your free trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="mt-4 text-[13px] text-muted-foreground">
                No credit card required · 14-day free trial
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
