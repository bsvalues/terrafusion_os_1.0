import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import DashboardPage from "@/pages/DashboardPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ValuationForm from "@/pages/ValuationForm";
import ValuationResult from "@/pages/ValuationResult";
import { ValuationsPage } from "@/pages/ValuationsPage";
import ReportsPage from "@/pages/ReportsPage";
import Calculator from "@/pages/Calculator";
import ProFormaCalculator from "@/pages/ProFormaCalculator";
import DevDocs from "@/pages/DevDocs";
import DevLogin from "@/pages/DevLogin";
import DevTokenManagement from "@/pages/DevTokenManagement";
import AgentDashboard from "@/pages/AgentDashboard";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { OnboardingWizard, MascotButton } from "@/components/onboarding";
import { useEffect } from "react";
import { AIDevBadge } from "@/components/AIDevBadge";
import ErrorBoundary from "@/components/ErrorBoundary";

// Private route component to protect authenticated routes
function PrivateRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!isAuthenticated && !isLoading) {
      setLocation('/login');
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  // Show loading or render the component if authenticated
  return isLoading ? (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center"><>

        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p
</>

className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  ) : isAuthenticated ? (
    <Component />
  ) : null; // Will redirect in the useEffect
}

function Router() {
  // Use an environment variable check to determine if we should show dev routes
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <Switch>
      {/* Main application routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Dev-specific routes - only register these in development */}
      {isDevelopment && <Route path="/dev-login" component={DevLogin} />}
      {isDevelopment && <Route path="/docs/dev" component={DevDocs} />}
      {isDevelopment && (
        <Route path="/dev/token-management">
          {() => <PrivateRoute component={DevTokenManagement} />}
        </Route>
      )}
      
      {/* Protected routes */}
      <Route path="/dashboard">
        {() => <PrivateRoute component={DashboardPage} />}
      </Route>
      <Route path="/calculator">
        {() => <PrivateRoute component={Calculator} />}
      </Route>
      <Route path="/pro-forma">
        {() => <PrivateRoute component={ProFormaCalculator} />}
      </Route>
      <Route path="/ai-agents">
        {() => <PrivateRoute component={AgentDashboard} />}
      </Route>
      <Route path="/agent-dashboard">
        {() => <PrivateRoute component={AgentDashboard} />}
      </Route>
      <Route path="/valuation/new">
        {() => <PrivateRoute component={ValuationForm} />}
      </Route>
      <Route path="/valuation/:id">
        {(params) => {
          // Create a wrapper component to pass the id parameter
          const ValuationResultWithParams = () => <ValuationResult id={params.id} />;
          return <PrivateRoute component={ValuationResultWithParams} />;
        }}
      </Route>
      
      <Route path="/valuations">
        {() => <PrivateRoute component={ValuationsPage} />}
      </Route>
      
      <Route path="/reports">
        {() => <PrivateRoute component={ReportsPage} />}
      </Route>
      
      {/* 404 page - must be last */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OnboardingProvider>
          <ErrorBoundary>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow"><>

                <Router />
              </main>
              <Footer
</>

/>
            </div>
            <Toaster />
            {/* Dev badge - only visible in development mode */}
            <AIDevBadge />
            {/* Onboarding components */}
            <OnboardingWizard />
            <MascotButton />
          </ErrorBoundary>
        </OnboardingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
