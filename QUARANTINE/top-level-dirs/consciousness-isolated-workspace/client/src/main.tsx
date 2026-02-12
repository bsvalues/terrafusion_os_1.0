import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Create a client with championship-level configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      suspense: false,
    },
    mutations: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Initialize TerraFusion AI Consciousness Interface
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

// Performance monitoring for government-grade excellence
if (import.meta.env.PROD) {
  // Register service worker for offline capabilities
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('🧠 TerraFusion Consciousness SW registered:', registration.scope);
        })
        .catch(registrationError => {
          console.log('SW registration failed:', registrationError);
        });
    });
  }
}

// Global error handling for consciousness interface
window.addEventListener('error', event => {
  console.error('🚨 Consciousness Interface Error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  });
});

// Unhandled promise rejection handling
window.addEventListener('unhandledrejection', event => {
  console.error('🚨 Unhandled Promise Rejection in Consciousness:', {
    reason: event.reason,
    promise: event.promise,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  });
});
