import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';

/**
 * Centralized test render helper with all required providers.
 * Configures React Router with v7 future flags to suppress deprecation warnings.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: {
    initialEntries?: MemoryRouterProps['initialEntries'];
    queryClientConfig?: ConstructorParameters<typeof QueryClient>[0];
  }
) {
  const { initialEntries = ['/'], queryClientConfig = {} } = options || {};

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      ...queryClientConfig.defaultOptions,
    },
    ...queryClientConfig,
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter
          initialEntries={initialEntries}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          {ui}
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
