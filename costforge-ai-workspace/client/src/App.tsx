import CostForgeAIApp from '@/components/CostForgeAIApp';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import { QueryClientProvider } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { Route, Switch } from 'wouter';
import { queryClient } from './lib/queryClient';

// Import all page components
import AnalyticsPage from '@/pages/AnalyticsPage';
import AuthPage from '@/pages/auth-page';
import DashboardPage from '@/pages/DashboardPage';
import EnhancedCalculatorPage from '@/pages/EnhancedCalculatorPage';
import UsersPage from '@/pages/users-page';
// Use the newly renamed file to avoid casing conflicts
import DocumentationPage from '@/pages/documentation';
import FAQPage from '@/pages/faq';
import TutorialsPage from '@/pages/tutorials';
// TerraFusion Quantum Header System - Elite Government OS Interface
import ProtectedRoute from '@/components/auth/protected-route';
import DataFlowProvider from '@/contexts/DataFlowContext';
import { AuthProvider } from './contexts/auth-context';
import { SidebarProvider } from './contexts/SidebarContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WindowProvider } from './contexts/WindowContext';
// Theme providers have been replaced with TerraFusion design system
// Import for NavigationMenuProvider has been removed
import { EnhancedSupabaseProvider } from '@/components/supabase/EnhancedSupabaseProvider';
import React, { useEffect } from 'react';

// Add TypeScript declaration for our custom window property
declare global {
  interface Window {
    lastSupabaseErrorTime?: number;
  }
}

// Add link to Remix Icon for icons
const RemixIconLink = () => (
  <link href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css" rel="stylesheet" />
);

// Track global promise rejections and handle them gracefully
const GlobalErrorHandler = () => {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault(); // Prevent default console error
      console.warn('Unhandled promise rejection caught:', event.reason);

      try {
        // Log error details to help with debugging
        const errorSource = event.reason?.stack?.split('\n')?.[1] || 'Unknown source';
        const errorMessage = event.reason?.message || 'Unknown error';

        // Determine the error type for more specific handling
        const isApiError =
          errorMessage.includes('fetch') ||
          errorMessage.includes('network') ||
          errorMessage.includes('API') ||
          errorMessage.includes('/api/');

        const isAuthError =
          errorMessage.includes('auth') ||
          errorMessage.includes('login') ||
          errorMessage.includes('token') ||
          errorSource.includes('AuthContext') ||
          errorSource.includes('useAuth');

        const isSupabaseError =
          errorMessage.includes('Supabase') ||
          errorSource.includes('supabase') ||
          errorSource.includes('Supabase') ||
          errorMessage.includes('Failed to fetch');

        // Handling specific error types
        if (isSupabaseError) {
          // Handle Supabase connection errors more gracefully
          // Avoid flooding the console with repeated errors
          const timeSinceLastSupabaseError = Date.now() - (window.lastSupabaseErrorTime || 0);
          if (timeSinceLastSupabaseError > 5000) {
            // Throttle to once every 5 seconds
            window.lastSupabaseErrorTime = Date.now();
            console.group('Supabase Connection Issue:');
            console.warn(
              'The application is having trouble connecting to Supabase. This is expected in development mode.'
            );
            console.warn(
              'If using this in production, check your Supabase credentials and network connection.'
            );
            console.groupEnd();
          }

          // Don't log detailed errors for Supabase in dev mode to reduce console noise
          return;
        }

        if (process.env.NODE_ENV === 'development') {
          // In development, show detailed error information
          console.group('Error Details:');
          console.error('Error:', errorMessage);
          console.error('Source:', errorSource);
          console.error('Stack:', event.reason?.stack);
          console.groupEnd();
        }

        // For production, we could send errors to a monitoring service
        // logErrorToService({ message: errorMessage, source: errorSource, stack: event.reason?.stack });
      } catch (handlingError) {
        // Ensure our error handling doesn't itself cause errors
        console.error('Error while handling unhandled rejection:', handlingError);
      }
    };

    const handleError = (event: ErrorEvent) => {
      // Determine the type of error
      const isAuthError =
        event.message.includes('useAuth') ||
        event.message.includes('AuthProvider') ||
        event.message.includes('Authentication') ||
        event.message.includes('token') ||
        event.message.includes('login');

      const isSupabaseError =
        event.message.includes('Supabase') ||
        event.message.includes('supabase') ||
        (event.filename && event.filename.includes('supabase')) ||
        event.message.includes('Failed to fetch');

      // Handle specific error types more gracefully
      if (isAuthError) {
        // Don't prevent default for auth errors, but log them specially
        console.warn('Auth-related error caught:', event.message);
      }

      // Handle Supabase connection errors more gracefully
      if (isSupabaseError) {
        // Throttle Supabase error messages to reduce console noise
        const timeSinceLastSupabaseError = Date.now() - (window.lastSupabaseErrorTime || 0);
        if (timeSinceLastSupabaseError > 5000) {
          // Throttle to once every 5 seconds
          window.lastSupabaseErrorTime = Date.now();
          console.group('Supabase Connection Issue:');
          console.warn(
            'The application is having trouble connecting to Supabase. This is expected in development mode.'
          );
          console.warn(
            'If using this in production, check your Supabase credentials and network connection.'
          );
          console.groupEnd();
        }
        return; // Skip further logging for Supabase errors
      }

      // Log all other errors in development
      if (process.env.NODE_ENV === 'development') {
        console.group('Global Error:');
        console.error('Message:', event.message);
        console.error('Source:', event.filename, 'Line:', event.lineno, 'Col:', event.colno);
        console.error('Error object:', event.error);
        console.groupEnd();
      }
    };

    // Add the event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Clean up the event listeners on component unmount
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
};

// Development mode setup - avoid Promise usage to prevent unhandled rejections
// This is only run once at app startup to set the mock user data
if (process.env.NODE_ENV === 'development') {
  // Set mock admin user directly in the query cache
  queryClient.setQueryData(['/api/user'], {
    id: 1,
    username: 'admin',
    name: 'Admin User',
    role: 'admin',
    isActive: true,
  });
}

// Global error handler wrapper component to handle unhandled rejections and errors
const ErrorHandlerWrapper = () => {
  // For development mode, set mock admin user directly in the query cache
  useEffect(() => {
    try {
      if (import.meta.env.DEV) {
        console.log('Setting up mock admin user for development');
        // Set mock user data directly to avoid HTML parsing issues
        queryClient.setQueryData(['/api/user'], {
          id: 1,
          username: 'admin',
          name: 'Admin User',
          role: 'admin',
          isActive: true,
        });

        // Set up a mock implementation for fetch when requesting user data
        const originalFetch = window.fetch;
        window.fetch = function (input, init) {
          // Check if this is a request to /api/user or /api/auth/user
          if (
            typeof input === 'string' &&
            (input.endsWith('/api/user') || input.endsWith('/api/auth/user'))
          ) {
            console.log('Intercepting auth request in development mode');
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () =>
                Promise.resolve({
                  id: 1,
                  username: 'admin',
                  name: 'Admin User',
                  role: 'admin',
                  isActive: true,
                }),
            } as Response);
          }
          // Otherwise, use the original fetch
          return originalFetch(input as RequestInfo, init);
        };
      }
    } catch (error) {
      console.error('Error setting up mock user:', error);
    }
  }, []);

  return <GlobalErrorHandler />;
};

// Create a wrapper component to combine Route and ProtectedRoute
interface ProtectedRouteWrapperProps {
  path: string;
  component: React.ComponentType<any>;
  requiredRole?: string | string[];
}

const ProtectedRouteWrapper = ({
  path,
  component: Component,
  requiredRole,
}: ProtectedRouteWrapperProps) => {
  return (
    <Route path={path}>
      <ProtectedRoute requiredRole={requiredRole}>
        <Component />
      </ProtectedRoute>
    </Route>
  );
};

function Router() {
  return (
    <Switch>
      {/* CostForge AI Main Application - handle all main routes */}
      <Route path="/" component={CostForgeAIApp} />
      <Route path="/quantum-lab" component={CostForgeAIApp} />
      <Route path="/calculations" component={CostForgeAIApp} />
      <Route path="/analytics" component={CostForgeAIApp} />
      <Route path="/insights" component={CostForgeAIApp} />
      <Route path="/settings" component={CostForgeAIApp} />
      <Route path="/models" component={CostForgeAIApp} />

      {/* TerraFusion Quantum Routes - Pure Proprietary Technology */}
      {/* Legacy routes eliminated - TerraFusion operates with 100% proprietary quantum technology */}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Global error fallback UI
  const globalErrorFallback = (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md p-6 space-y-4 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">
          The application encountered an unexpected error. Please try refreshing the page.
        </p>
        <Button onClick={() => window.location.reload()} className="w-full mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reload Application
        </Button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={globalErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RemixIconLink />
          <ErrorHandlerWrapper />
          <EnhancedSupabaseProvider>
            <WindowProvider>
              {/* Using only the AuthProvider to prevent duplicate context issues */}
              <AuthProvider>
                <DataFlowProvider>
                  <SidebarProvider>
                    <Router />
                    <Toaster />
                  </SidebarProvider>
                </DataFlowProvider>
              </AuthProvider>
            </WindowProvider>
          </EnhancedSupabaseProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
