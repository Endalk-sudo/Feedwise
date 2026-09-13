import { Container } from '@/components/ui';
import { features } from '../landing-data';
import { Reveal } from './Reveal';

export function FeaturesGrid() {
  return (
    <section id="features" className="py-20 scroll-mt-16">
      <Container width="xl">
        <Reveal className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Everything you need to understand your customers
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful features designed to help you collect, analyze, and act on customer feedback.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={(index % 3) * 80}>
              <div className="group h-full p-6 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-accent/30 transition-all">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
