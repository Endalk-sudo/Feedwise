import { Star } from 'lucide-react';
import { Container } from '@/components/ui';
import { testimonials } from '../landing-data';
import { Reveal } from './Reveal';

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 scroll-mt-16">
      <Container width="xl">
        <Reveal className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Trusted by teams everywhere
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See what our customers have to say about their experience.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <figure className="h-full p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all">
                <div className="flex gap-1 mb-4" aria-label="5 out of 5 stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-warning text-warning" />
                  ))}
                </div>
                <blockquote className="text-foreground mb-6 italic">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <div
                    aria-hidden="true"
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                  >
                    <span className="text-primary-foreground font-medium text-sm">
                      {t.initials}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-muted-foreground text-sm">{t.role}</p>
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
