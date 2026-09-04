import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-foreground mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page not found</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 btn-brand hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Go Home
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-secondary border border-input text-foreground font-medium rounded-lg hover:border-input transition-all"
          >
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}