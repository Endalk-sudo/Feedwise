import { Container } from '@/components/ui';
import { steps } from '../landing-data';
import { Reveal } from './Reveal';

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-24 scroll-mt-16">
      <Container width="xl">
        <Reveal className="text-center mb-12 sm:mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
            From table tent to insight in three steps
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            No hardware, no training, no spreadsheets. Just print, scan, and act.
          </p>
        </Reveal>

        <ol className="grid md:grid-cols-3 gap-6">
          {steps.map((item, i) => (
            <Reveal key={item.step} delay={i * 100} className="h-full">
              <li className="relative h-full p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-xs hover:shadow-md hover:border-primary/30 hover:-translate-y-1 transition-all">
                <span className="text-5xl font-semibold text-primary/20" aria-hidden="true">
                  {item.step}
                </span>
                <h3 className="text-lg font-semibold mt-4 mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
