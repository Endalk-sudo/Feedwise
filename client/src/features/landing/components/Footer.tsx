import { Container, Logo } from '@/components/ui';

export type LegalDoc = 'privacy' | 'terms' | null;

const productLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#demo', label: 'Live demo' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export function Footer({ onOpenLegal }: { onOpenLegal: (doc: Exclude<LegalDoc, null>) => void }) {
  return (
    <footer className="py-12 border-t border-border bg-background">
      <Container width="xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Logo size="sm" />
              <span className="font-bold text-xl">FeedWise</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Turn customer feedback into actionable insights with AI.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="hover:text-foreground transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
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
              <li>
                <a
                  href="https://github.com/Endalk-sudo/AI-Feedback-collector-app"
                  className="hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@feedwise.app"
                  className="hover:text-foreground transition-colors"
                >
                  Contact
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
                  onClick={() => onOpenLegal('privacy')}
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('terms')}
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
            &copy; {new Date().getFullYear()} FeedWise. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="https://github.com/Endalk-sudo/AI-Feedback-collector-app"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="mailto:hello@feedwise.app"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Contact
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
