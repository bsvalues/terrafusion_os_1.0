import { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export function renderWithProviders(ui: ReactNode) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ReactFlowProvider>
        {ui}
      </ReactFlowProvider>
    </QueryClientProvider>
  );
}
