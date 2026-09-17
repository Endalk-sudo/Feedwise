import { Star } from 'lucide-react';
import { Container } from '@/components/ui';
import { testimonials } from '../landing-data';
import { Reveal } from './Reveal';

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 sm:py-24 scroll-mt-16">
      <Container width="xl">
        <Reveal className="text-center mb-12 sm:mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance mb-4">
            Trusted by teams everywhere
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
            What owners notice after their first month of listening closely.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 100} className="h-full">
              <figure className="h-full flex flex-col p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs hover:border-primary/30 hover:shadow-md transition-all duration-200">
                <div className="flex gap-1 mb-4" aria-label="5 out of 5 stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                <blockquote className="text-foreground leading-relaxed mb-6 flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="flex items-center gap-3 pt-5 border-t border-border/60">
                  <div
                    aria-hidden="true"
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0"
                  >
                    <span className="text-primary-foreground font-semibold text-sm">
                      {t.initials}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm tracking-tight truncate">{t.name}</p>
                    <p className="text-muted-foreground text-[13px] truncate">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
