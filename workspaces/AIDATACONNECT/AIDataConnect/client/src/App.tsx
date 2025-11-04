import React, { Suspense, lazy, useState, useEffect } from "react";
import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SidebarNav } from "@/components/sidebar-nav";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "./lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Lazy load components for better performance
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const FileExplorer = lazy(() => import("@/pages/file-explorer"));
const DataSources = lazy(() => import("@/pages/data-sources"));
const PipelineBuilder = lazy(() => import("@/pages/pipeline-builder"));
const Login = lazy(() => import("@/pages/login"));
const Register = lazy(() => import("@/pages/register"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading component
function PageLoader() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

// Auth provider 
interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: () => {},
});

function useAuth() {
  return React.useContext(AuthContext);
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // For development, you can automatically set a mock user for testing
  // The default mock user will automatically be used when running in development mode
  const isDevMode = import.meta.env.MODE === 'development';
  
  // Check if user is logged in
  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      // For development, return a default admin user without making an API call
      if (isDevMode && !localStorage.getItem('disable-auto-login')) {
        console.log('Dev mode: Using auto-login with mock admin user');
        return {
          id: 1,
          username: 'admin',
          email: 'admin@example.com'
        };
      }
      
      try {
        const response = await apiRequest('GET', '/api/auth/me');
        return await response.json();
      } catch (error) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (!queryLoading) {
      setUser(data);
      setIsLoading(false);
    }
  }, [data, queryLoading]);

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
      queryClient.invalidateQueries();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      setLocation('/login');
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Protected route component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <Component />;
}

// Public route component
function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  
  if (isLoading) {
    return <PageLoader />;
  }

  // Redirect to dashboard if already logged in and trying to access login or register
  if (isAuthenticated && (location === '/login' || location === '/register')) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function AppLayout() {
  const { logout, user } = useAuth();
  
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-background">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">RAG Drive</h1>
          {user && (
            <div className="mt-2 text-sm text-muted-foreground">
              Logged in as: {user.username}
            </div>
          )}
        </div>
        <SidebarNav />
        <div className="p-4 mt-auto border-t">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center" 
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/" component={() => <ProtectedRoute component={DashboardPage} />} />
            <Route path="/files" component={() => <ProtectedRoute component={FileExplorer} />} />
            <Route path="/data-sources" component={() => <ProtectedRoute component={DataSources} />} />
            <Route path="/pipeline" component={() => <ProtectedRoute component={PipelineBuilder} />} />
            <Route path="/login" component={() => <PublicRoute component={Login} />} />
            <Route path="/register" component={() => <PublicRoute component={Register} />} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
    </div>
  );
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <button
              className="mt-4 rounded bg-primary px-4 py-2 text-white"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/login" component={() => <PublicRoute component={Login} />} />
              <Route path="/register" component={() => <PublicRoute component={Register} />} />
              <Route component={AppLayout} />
            </Switch>
          </Suspense>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;