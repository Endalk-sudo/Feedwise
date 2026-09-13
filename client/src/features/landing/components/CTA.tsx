import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container, buttonVariants } from '@/components/ui';
import { Reveal } from './Reveal';

export function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <Container width="lg">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/10 px-6 py-14 sm:px-12 text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_100%,var(--primary)_0%,transparent_70%)] opacity-10"
            />
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Ready to understand your customers better?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Join thousands of businesses using Feedwise to turn feedback into growth. Set up in
              minutes — your first QR code is one signup away.
            </p>
            <Link
              to="/auth/register"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'px-8 py-4 text-lg shadow-lg shadow-primary/25',
              )}
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
