import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui';
import { faqs } from '../landing-data';
import { Reveal } from './Reveal';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 scroll-mt-16">
      <Container width="lg">
        <Reveal className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Questions, answered
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything else you might want to know before starting your trial.
          </p>
        </Reveal>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const open = openIndex === i;
            return (
              <Reveal key={faq.question} delay={i * 60}>
                <div
                  className={cn(
                    'rounded-xl border bg-card transition-colors',
                    open ? 'border-primary/40' : 'border-border',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : i)}
                    aria-expanded={open}
                    aria-controls={`faq-panel-${i}`}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold"
                  >
                    {faq.question}
                    <ChevronDown
                      className={cn(
                        'w-5 h-5 shrink-0 text-muted-foreground transition-transform',
                        open && 'rotate-180 text-primary',
                      )}
                    />
                  </button>
                  {open && (
                    <p id={`faq-panel-${i}`} className="px-5 pb-5 text-muted-foreground">
                      {faq.answer}
                    </p>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
