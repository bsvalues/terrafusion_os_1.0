import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PILTDashboard } from './components/PILTDashboard';
import { UnifiedRevenueDashboard } from './components/UnifiedRevenueDashboard';
import { initializeTelemetry } from './utils/telemetry';

initializeTelemetry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <PILTDashboard />
        <div className="mt-8">
          <UnifiedRevenueDashboard />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
