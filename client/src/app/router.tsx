import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { authClient } from '@/lib/auth-client';
import { queryClient } from '@/lib/query-client';

// Import page components
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { OrgSetupPage } from '@/features/organization/pages/OrgSetupPage';
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
import { DashboardHome } from '@/features/dashboard/pages/DashboardHome';
import { FeedbackPage } from '@/features/feedback/pages/FeedbackPage';
import { AIPage } from '@/features/ai/pages/AIPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { PublicFeedbackPage } from '@/features/feedback/pages/PublicFeedbackPage';
import { NotFoundPage } from '@/features/common/pages/NotFoundPage';

// Root route with context
interface RouterContext {
  queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <TanStackRouterDevtools />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  ),
  notFoundComponent: () => <NotFoundPage />,
});

import { LoadingState } from '@/components/ui';

// Heavy chart page is code-split (recharts) so the initial bundle stays lean
const AnalyticsPageLazy = lazy(() =>
  import('@/features/analytics/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
);

function AnalyticsRouteComponent() {
  return (
    <Suspense fallback={<LoadingState message="Loading analytics…" />}>
      <AnalyticsPageLazy />
    </Suspense>
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

// Public routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <LandingPage />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/login',
  component: () => <LoginPage />,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/register',
  component: () => <RegisterPage />,
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
  component: () => <FeedbackPage />,
});

const analyticsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'analytics',
  component: AnalyticsRouteComponent,
});

const aiRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'ai',
  component: () => <AIPage />,
});

const settingsRoute = createRoute({
  getParentRoute: () => dashboardRoute,
  path: 'settings',
  component: () => <SettingsPage />,
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
  orgSetupRoute,
  dashboardRoute.addChildren([
    dashboardHomeRoute,
    feedbackRoute,
    analyticsRoute,
    aiRoute,
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
