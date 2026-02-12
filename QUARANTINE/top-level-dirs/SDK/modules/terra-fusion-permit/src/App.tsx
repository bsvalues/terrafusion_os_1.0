/**
 * TerraFusion Permit App - Main Application Entry Point
 * Government. Transcended. - Elite Permit Management System
 *
 * Quantum Factor: 949 | Terra-Cyan: #00FFFF | Golden Ratio: φ=1.618
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import TerraFusionPermitDashboard from './components/TerraFusionPermitDashboard';

// Configure React Query with optimizations for government permit operations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds - frequent updates for permit status
      gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime in v5)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 408 (timeout) and 429 (rate limit)
        if (error instanceof Error && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true, // Re-fetch when window gains focus for permit updates
      refetchOnReconnect: true, // Re-fetch when connection is restored
    },
    mutations: {
      retry: 2, // Retry permit mutations twice
      retryDelay: 1500,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <TerraFusionPermitDashboard />
      </div>

      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
};

export default App;
