/**
 * TerraFusion Dashboard - Main Application Entry Point
 * Government. Transcended. - Championship Analytics System
 * 
 * Quantum Factor: 949 | Terra-Cyan: #00FFFF | Golden Ratio: φ=1.618
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import TerraFusionDashboard from '@components/TerraFusionDashboard';

// Configure React Query with optimizations for government operations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
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
      refetchOnWindowFocus: false, // Prevent excessive API calls in government environment
      refetchOnReconnect: true, // Re-fetch when connection is restored
    },
    mutations: {
      retry: 1, // Retry mutations once
      retryDelay: 1000,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <TerraFusionDashboard />
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