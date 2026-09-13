import { useState } from 'react';
import { Dialog } from '@/components/ui';
import { authClient } from '@/lib/auth-client';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { StatsBand } from '../components/StatsBand';
import { HowItWorks } from '../components/HowItWorks';
import { AIDemo } from '../components/AIDemo';
import { FeaturesGrid } from '../components/FeaturesGrid';
import { Testimonials } from '../components/Testimonials';
import { Pricing } from '../components/Pricing';
import { FAQ } from '../components/FAQ';
import { CTA } from '../components/CTA';
import { Footer, type LegalDoc } from '../components/Footer';

export function LandingPage() {
  const [legalDoc, setLegalDoc] = useState<LegalDoc>(null);
  const { data: session } = authClient.useSession();
  const isLoggedIn = Boolean(session);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar isLoggedIn={isLoggedIn} />

      <main>
        <Hero />
        <StatsBand />
        <HowItWorks />
        <AIDemo />
        <FeaturesGrid />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>

      <Footer onOpenLegal={setLegalDoc} />

      <Dialog
        open={legalDoc !== null}
        onOpenChange={(open) => {
          if (!open) setLegalDoc(null);
        }}
        title={legalDoc === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
      >
        {legalDoc === 'privacy' ? (
          <div className="text-sm text-muted-foreground space-y-3">
            <p>
              FeedWise collects your account details (name, email) and the customer feedback you
              gather through your organization pages. Customer feedback is anonymous by default.
            </p>
            <p>
              We use your data to operate the service — AI analysis, analytics, and email alerts you
              opt into. We never sell personal data. You can request export or deletion of your data
              at any time via{' '}
              <a href="mailto:hello@feedwise.app" className="text-primary hover:underline">
                hello@feedwise.app
              </a>
              .
            </p>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground space-y-3">
            <p>
              FeedWise provides feedback collection and AI analysis on a 14-day free trial; paid
              plans (Basic, Pro) bill monthly and can be cancelled anytime from the billing portal.
            </p>
            <p>
              You are responsible for the content you collect and publish. Abusive use (spam, fake
              reviews, unlawful content) may lead to suspension. The AI analysis is advisory —
              verify urgent matters yourself.
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}
