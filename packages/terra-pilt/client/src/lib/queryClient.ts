import { QueryClient } from '@tanstack/react-query';

/**
 * Shared React Query client for terra-pilt.
 *
 * Historical note: App.tsx and hooks/use-auth.tsx both import this module,
 * but the file was missing from the quarantined port — the frontend build
 * was silently broken. Restored as part of the v1 honest-surface pass.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});
