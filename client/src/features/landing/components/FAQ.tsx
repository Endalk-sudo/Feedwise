import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from '@/components/ui';
import { faqs } from '../landing-data';
import { Reveal } from './Reveal';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-24 scroll-mt-16">
      <Container width="lg">
        <Reveal className="text-center mb-10 sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance mb-4">
            Questions, answered
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
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
                    'rounded-2xl border bg-card shadow-xs transition-all duration-200',
                    open ? 'border-primary/30 shadow-sm' : 'border-border/70',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : i)}
                    aria-expanded={open}
                    aria-controls={`faq-panel-${i}`}
                    className="flex w-full items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 min-h-14 text-left font-semibold tracking-tight text-[15px] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {faq.question}
                    <ChevronDown
                      className={cn(
                        'w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-200',
                        open && 'rotate-180 text-primary',
                      )}
                    />
                  </button>
                  {open && (
                    <p
                      id={`faq-panel-${i}`}
                      className="px-5 sm:px-6 pb-5 sm:pb-6 text-muted-foreground text-[15px] leading-relaxed"
                    >
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
