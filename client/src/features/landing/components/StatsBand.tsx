import { Container } from '@/components/ui';
import { stats } from '../landing-data';
import { Reveal } from './Reveal';

export function StatsBand() {
  return (
    <section aria-label="FeedWise highlights" className="border-y border-border bg-card/50">
      <Container width="xl">
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 py-14">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 80}>
              <div className="text-center lg:text-left">
                <dd className="text-3xl sm:text-4xl font-semibold tracking-tight gradient-text">
                  {stat.value}
                </dd>
                <dt className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {stat.label}
                </dt>
              </div>
            </Reveal>
          ))}
        </dl>
      </Container>
    </section>
  );
}
