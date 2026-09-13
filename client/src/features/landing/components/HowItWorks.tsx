import { Container } from '@/components/ui';
import { steps } from '../landing-data';
import { Reveal } from './Reveal';

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 scroll-mt-16">
      <Container width="xl">
        <Reveal className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            From table tent to insight in three steps
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            No hardware, no training, no spreadsheets. Just print, scan, and act.
          </p>
        </Reveal>

        <ol className="grid md:grid-cols-3 gap-6">
          {steps.map((item, i) => (
            <Reveal key={item.step} delay={i * 100}>
              <li className="relative h-full p-6 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all">
                <span className="text-5xl font-bold text-primary/15" aria-hidden="true">
                  {item.step}
                </span>
                <h3 className="text-xl font-semibold mt-2 mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
