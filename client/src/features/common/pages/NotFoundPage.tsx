import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-slate-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page not found</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Go Home
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-slate-800 border border-slate-700 text-white font-medium rounded-xl hover:border-slate-600 transition-all"
          >
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}