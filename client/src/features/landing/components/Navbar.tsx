import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { LayoutDashboard, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container, Logo, Drawer, buttonVariants } from '@/components/ui';

const navLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#demo', label: 'Live demo' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <Container width="xl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-bold text-xl">FeedWise</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                {link.label}
              </a>
            ))}
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
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm"
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
            type="button"
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
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
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
  );
}
