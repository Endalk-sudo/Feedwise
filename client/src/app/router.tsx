import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, type ReactNode } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Link } from '@tanstack/react-router';

import { authClient } from '@/lib/auth-client';
import { queryClient } from '@/lib/query-client';
import { ErrorBoundary } from '@/components/ui';

// Import page components
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { OrgSetupPage } from '@/features/organization/pages/OrgSetupPage';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { DashboardHome } from '@/features/dashboard/pages/DashboardHome';
import { MembersPage } from '@/features/organization/pages/MembersPage';
import { PublicFeedbackPage } from '@/features/feedback/pages/PublicFeedbackPage';
import { NotFoundPage } from '@/features/common/pages/NotFoundPage';

// Root route with context
interface RouterContext {
  queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools />
          <ReactQueryDevtools initialIsOpen={false} />
        </>
      )}
    </QueryClientProvider>
  ),
  notFoundComponent: () => <NotFoundPage />,
  errorComponent: ({ error }) => <RouteErrorFallback error={error} />,
});

import { LoadingState } from '@/components/ui';

// Heavy pages are code-split so the initial bundle stays lean
const AnalyticsPageLazy = lazy(() =>
  import('@/features/analytics/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
);
const FeedbackPageLazy = lazy(() =>
  import('@/features/feedback/pages/FeedbackPage').then((m) => ({ default: m.FeedbackPage })),
);
const AIPageLazy = lazy(() =>
  import('@/features/ai/pages/AIPage').then((m) => ({ default: m.AIPage })),
);
const SettingsPageLazy = lazy(() =>
  import('@/features/settings/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

function lazyRoute(message: string, children: ReactNode) {
  return <Suspense fallback={<LoadingState message={message} />}>{children}</Suspense>;
}

function RouteErrorFallback({ error }: { error: unknown }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        {error instanceof Error ? error.message : 'Please try again or return to the dashboard.'}
      </p>
      <Link
        to="/dashboard"
        className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

// Auth check loader
const requireAuthLoader = async () => {
  const session = await authClient.getSession({
    fetchOptions: { credentials: 'include' },
  });
  if (!session.data) {
    throw redirect({ to: '/auth/login' });
  }
  return session.data;
};

// Logged-in users don't need the auth pages — send them to the dashboard.
const requireGuestLoader = async () => {
  const session = await authClient.getSession({
    fetchOptions: { credentials: 'include' },
  });
  if (session.data) {
    throw redirect({ to: '/dashboard' });
  }
  return null;
};

// Public routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <LandingPage />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/login',
  loader: requireGuestLoader,
  component: () => <LoginPage />,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/register',
  loader: requireGuestLoader,
  component: () => <RegisterPage />,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/forgot-password',
  loader: requireGuestLoader,
  component: () => <ForgotPasswordPage />,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/reset-password',
  loader: requireGuestLoader,
  component: () => <ResetPasswordPage />,
});

const orgSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/org-setup',
  loader: requireAuthLoader,
  component: () => <OrgSetupPage />,
});

// Protected dashboard routes
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  loader: requireAuthLoader,
  component: () => <DashboardLayout />,
});

// Nested dashboard routes
const dashboardHomeRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: '/',
  component: () => <DashboardHome />,
});

const feedbackRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'feedback',
  pendingComponent: () => <LoadingState message="Loading feedback…" />,
  component: () => lazyRoute('Loading feedback…', <FeedbackPageLazy />),
});

const analyticsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'analytics',
  pendingComponent: () => <LoadingState message="Loading analytics…" />,
  component: () => lazyRoute('Loading analytics…', <AnalyticsPageLazy />),
});

const aiRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'ai',
  pendingComponent: () => <LoadingState message="Loading assistant…" />,
  component: () => lazyRoute('Loading assistant…', <AIPageLazy />),
});

const teamRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'team',
  component: () => <MembersPage />,
});

const settingsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'settings',
  pendingComponent: () => <LoadingState message="Loading settings…" />,
  component: () => lazyRoute('Loading settings…', <SettingsPageLazy />),
});

// Public feedback page (by org slug)
const publicFeedbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/feedback/$slug',
  component: () => <PublicFeedbackPage />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  orgSetupRoute,
  dashboardRoute.addChildren([
    dashboardHomeRoute,
    feedbackRoute,
    analyticsRoute,
    aiRoute,
    teamRoute,
    settingsRoute,
  ]),
  publicFeedbackRoute,
]);

// eslint-disable-next-line react-refresh/only-export-components -- TanStack Router registration pattern
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  context: {
    queryClient,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export const Router = () => <RouterProvider router={router} />;
