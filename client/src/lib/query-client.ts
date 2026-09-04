import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query client configuration
 * Optimized for production use
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cache data for 24 hours
      gcTime: 1000 * 60 * 60 * 24,
      // Retry failed queries up to 3 times
      retry: (failureCount, error) => {
        // Don't retry on 401/403
        if (error instanceof Response && (error.status === 401 || error.status === 403)) {
          return false;
        }
        return failureCount < 3;
      },
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});