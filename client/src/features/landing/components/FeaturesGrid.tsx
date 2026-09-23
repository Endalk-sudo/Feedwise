import { Container } from '@/components/ui';
import { features } from '../landing-data';
import { Reveal } from './Reveal';

export function FeaturesGrid() {
  return (
    <section id="features" className="py-20 sm:py-24 scroll-mt-16">
      <Container width="xl">
        <Reveal className="text-center mb-12 sm:mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance mb-4">
            Everything you need to understand your customers
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
            Collect, analyze, and act on customer feedback — without extra busywork.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={(index % 3) * 80} className="h-full">
              <div className="group h-full p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs hover:border-primary/30 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div className="w-11 h-11 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-[17px] font-semibold tracking-tight mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-[15px] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
