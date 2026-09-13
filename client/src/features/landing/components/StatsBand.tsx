import { Container } from '@/components/ui';
import { stats } from '../landing-data';
import { Reveal } from './Reveal';

export function StatsBand() {
  return (
    <section aria-label="Feedwise highlights" className="border-y border-border bg-card/50">
      <Container width="xl">
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-10">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 80}>
              <div className="text-center">
                <dd className="text-3xl sm:text-4xl font-bold gradient-text">{stat.value}</dd>
                <dt className="mt-1 text-sm text-muted-foreground">{stat.label}</dt>
              </div>
            </Reveal>
          ))}
        </dl>
      </Container>
    </section>
  );
}
