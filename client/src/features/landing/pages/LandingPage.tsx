import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  CheckCircle2,
  Zap,
  Shield,
  BarChart3,
  MessageSquare,
  Smartphone,
  ArrowRight,
  Star,
  Users,
  Menu,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container, Logo, Drawer, Dialog, buttonVariants } from '@/components/ui';
import { authClient } from '@/lib/auth-client';

const features = [
  {
    icon: MessageSquare,
    title: 'Collect Feedback Anywhere',
    description:
      'QR codes, links, and embeddable widgets make it easy for customers to share their thoughts.',
  },
  {
    icon: Zap,
    title: 'Instant AI Analysis',
    description:
      'Gemini AI categorizes, analyzes sentiment, detects urgency, and extracts key insights in real-time.',
  },
  {
    icon: BarChart3,
    title: 'Actionable Analytics',
    description:
      'Track sentiment trends, category breakdowns, recurring issues, and priority alerts on beautiful dashboards.',
  },
  {
    icon: Smartphone,
    title: 'AI Chat Assistant',
    description:
      'Ask questions about your feedback in natural language. Get data-driven answers instantly.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'End-to-end encryption and granular access controls keep your data safe and secure.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Invite team members, assign roles, and collaborate on insights together.',
  },
];

const pricing = [
  {
    name: 'Basic',
    plan: 'basic',
    price: 29,
    description: 'Perfect for small businesses getting started',
    features: [
      'Unlimited feedback collection',
      'AI categorization & sentiment',
      'Basic analytics dashboard',
      'QR code generation',
      'Email notifications',
      'Up to 1,000 responses/month',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Pro',
    plan: 'pro',
    price: 79,
    description: 'For growing teams needing deeper insights',
    features: [
      'Everything in Basic',
      'AI Chat Assistant (InsightBot)',
      'Advanced analytics & heatmaps',
      'Priority alerts & recurring issues',
      'AI growth recommendations',
      'Team collaboration (up to 10)',
      'Custom branding',
      'API access',
      'Up to 10,000 responses/month',
    ],
    cta: 'Get Started',
    popular: true,
  },
];

const testimonials = [
  {
    quote:
      'FeedbackAI cut our response analysis time from hours to seconds. The AI categorization is incredibly accurate.',
    name: 'Sarah Chen',
    role: 'Head of Product at NovaTech',
    initials: 'SC',
  },
  {
    quote:
      'We identified our top 3 customer pain points in the first week. The sentiment trends helped us prioritize our roadmap.',
    name: 'Marcus Rodriguez',
    role: 'Customer Success Lead at BrightLocal',
    initials: 'MR',
  },
  {
    quote:
      'The QR code feedback collection is a game changer for our restaurants. Customers love the simplicity.',
    name: 'Emily Park',
    role: 'Operations Manager at FreshBites',
    initials: 'EP',
  },
];

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<'privacy' | 'terms' | null>(null);
  const { data: session } = authClient.useSession();
  const isLoggedIn = Boolean(session);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <Container width="xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="font-bold text-xl">Feedwise</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Testimonials
              </a>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              {isLoggedIn ? (
                <Link to="/dashboard" className={cn(buttonVariants({ size: 'md' }))}>
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link to="/auth/register" className={cn(buttonVariants({ size: 'md' }))}>
                    Get Started Free
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </Container>

        {/* Mobile menu */}
        <Drawer
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          side="right"
          className="w-72"
        >
          <nav className="space-y-4">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-foreground hover:text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-foreground hover:text-primary transition-colors"
            >
              Pricing
            </a>
            <a
              href="#testimonials"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-foreground hover:text-primary transition-colors"
            >
              Testimonials
            </a>
            <hr className="border-border" />
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(buttonVariants(), 'w-full text-center')}
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(buttonVariants(), 'w-full text-center')}
                >
                  Get Started Free
                </Link>
              </>
            )}
          </nav>
        </Drawer>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 hover:bg-primary/15 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            New: AI Chat Assistant now available
          </a>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Turn Customer Feedback into{' '}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Actionable Insights
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Collect feedback via QR codes, analyze instantly with AI, and get actionable growth
            recommendations. No more guessing what your customers want.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/auth/register"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'w-full sm:w-auto px-8 py-4 text-lg shadow-lg shadow-primary/25',
              )}
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto border-2 border-input px-8 py-4 rounded-lg text-foreground font-semibold text-lg hover:border-primary transition-all text-center"
            >
              See How It Works
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-card/50">
        <Container width="xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need to understand your customers
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful features designed to help you collect, analyze, and act on customer feedback.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl bg-card border border-border hover:border-primary/40 transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-accent/30 transition-all">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <Container width="xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the plan that&apos;s right for your business. All plans include a 14-day free
              trial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'relative p-8 rounded-xl bg-card border',
                  plan.popular
                    ? 'border-2 border-primary/50 shadow-lg shadow-primary/10'
                    : 'border-border',
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-5xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-foreground">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/auth/register"
                  search={{ plan: plan.plan }}
                  className={cn(
                    buttonVariants({
                      variant: plan.popular ? 'brand' : 'secondary',
                      size: 'lg',
                    }),
                    'w-full',
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Social Proof */}
      <section id="testimonials" className="py-20 bg-card/50">
        <Container width="xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Trusted by teams everywhere
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              See what our customers have to say about their experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 rounded-xl bg-card border border-border">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-primary-foreground font-medium text-sm">
                      {t.initials}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-muted-foreground text-sm">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
            Ready to understand your customers better?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of businesses using Feedwise to turn feedback into growth.
          </p>
          <Link
            to="/auth/register"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'px-8 py-4 text-lg shadow-lg shadow-primary/25',
            )}
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-background">
        <Container width="xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Logo size="sm" />
                <span className="font-bold text-xl">Feedwise</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Turn customer feedback into actionable insights with AI.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <a href="#testimonials" className="hover:text-foreground transition-colors">
                    Testimonials
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalDoc('privacy')}
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalDoc('terms')}
                    className="hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} Feedwise. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="https://github.com/Endalk-sudo/AI-Feedback-collector-app"
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a
                href="mailto:hello@feedwise.app"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </Container>
      </footer>

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
              Feedwise collects your account details (name, email) and the customer
              feedback you gather through your organization pages. Customer feedback
              is anonymous by default.
            </p>
            <p>
              We use your data to operate the service — AI analysis, analytics, and
              email alerts you opt into. We never sell personal data. You can request
              export or deletion of your data at any time via{' '}
              <a href="mailto:hello@feedwise.app" className="text-primary hover:underline">
                hello@feedwise.app
              </a>
              .
            </p>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground space-y-3">
            <p>
              Feedwise provides feedback collection and AI analysis on a 14-day free
              trial; paid plans (Basic, Pro) bill monthly and can be cancelled anytime
              from the billing portal.
            </p>
            <p>
              You are responsible for the content you collect and publish. Abusive use
              (spam, fake reviews, unlawful content) may lead to suspension. The AI
              analysis is advisory — verify urgent matters yourself.
            </p>
          </div>
        )}
      </Dialog>
    </div>
  );
}
