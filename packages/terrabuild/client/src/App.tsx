import ErrorBoundary from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import NotFound from '@/pages/not-found';
import { QueryClientProvider } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { Route, Switch } from 'wouter';
import { queryClient } from './lib/queryClient';

// Import all page components
import AICostWizardPage from '@/pages/AICostWizardPage';
import CalibrationWorkbench from '@/pages/CalibrationWorkbench';
import AIToolsPage from '@/pages/AIToolsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import ARVisualizationPage from '@/pages/ARVisualizationPage';
// AuthPage removed — CostForge is an OS module; auth is handled by TerraFusion OS shell
import BenchmarkingPage from '@/pages/BenchmarkingPage';
import BentonCountyDemoPage from '@/pages/BentonCountyDemoPage';
import CalculatorPage from '@/pages/CalculatorPage';
import ComparativeAnalysisDemo from '@/pages/ComparativeAnalysisDemo';
import CostTrendAnalysisDemo from '@/pages/CostTrendAnalysisDemo';
import DashboardPage from '@/pages/DashboardPage';
import DataExplorationDemo from '@/pages/DataExplorationDemo';
import DataImportPage from '@/pages/DataImportPage';
import EnhancedCalculatorPage from '@/pages/EnhancedCalculatorPage';
// EnhancedCalculatorPageV2 — unrouted, kept for future use (uncomment to activate)
// import EnhancedCalculatorPageV2 from '@/pages/EnhancedCalculatorPageV2';
// LandingPage — removed; CostForge is an OS module, no marketing landing page
// import LandingPage from '@/pages/LandingPage';
import MCPOverviewPage from '@/pages/MCPOverviewPage';
import PredictiveCostAnalysisDemo from '@/pages/PredictiveCostAnalysisDemo';
import RegionalCostComparisonPage from '@/pages/RegionalCostComparisonPage';
import ReportsPage from '@/pages/ReportsPage';
import SharedProjectsPage from '@/pages/SharedProjectsPage';
import StatisticalAnalysisDemo from '@/pages/StatisticalAnalysisDemo';
import UsersPage from '@/pages/users-page';
import VisualizationsPage from '@/pages/VisualizationsPage';
import WhatIfScenariosPage from '@/pages/WhatIfScenariosPage';
import WorkflowDashboardPage from '@/pages/WorkflowDashboardPage';
// Use the newly renamed file to avoid casing conflicts
import ContextualDataPage from '@/pages/contextual-data';
import CostCalculator from '@/pages/CostCalculator';
import CostCalculatorAPI from '@/components/CostCalculatorAPI';
import CostWizardPage from '@/pages/CostWizardPage';
import CreateProjectPage from '@/pages/CreateProjectPage';
import DataConnectionsPage from '@/pages/DataConnectionsPage';
import DocumentationPage from '@/pages/documentation';
import FAQPage from '@/pages/faq';
import FTPConnectionPage from '@/pages/FTPConnectionPage';
import FTPConnectionTestPage from '@/pages/FTPConnectionTestPage';
import FTPSyncSchedulePage from '@/pages/FTPSyncSchedulePage';
import GeoAssessmentPage from '@/pages/GeoAssessmentPage';
import InfrastructureLifecyclePage from '@/pages/InfrastructureLifecyclePage';
import MCPDashboard from '@/pages/MainDashboard';
import MCPVisualizationsPage from '@/pages/MCPVisualizationsPage';
import ProjectDetailsPage from '@/pages/ProjectDetailsPage';
import PropertyBrowserPage from '@/pages/PropertyBrowserPage';
import PropertyDetailsPage from '@/pages/PropertyDetailsPage';
import SharedProjectDashboardPage from '@/pages/SharedProjectDashboardPage';
// SupabaseTestPage removed — Supabase not used in OS module
import SwarmPage from '@/pages/SwarmPage';
import TutorialsPage from '@/pages/tutorials';
import ProtectedRoute from '@/components/auth/protected-route';
import Sidebar from '@/components/layout/Sidebar';
import DataFlowProvider from '@/contexts/DataFlowContext';
import { AuthProvider } from './contexts/auth-context';
import { SidebarProvider } from './contexts/SidebarContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WindowProvider } from './contexts/WindowContext';
// Theme providers have been replaced with TerraFusion design system
// EnhancedSupabaseProvider removed — Supabase not used in OS module
import { OsContextProvider } from './contexts/OsContext';
import React, { useEffect } from 'react';

// Add link to Remix Icon for icons
const RemixIconLink = () => (
  <link href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css" rel="stylesheet" />
);

// Lightweight global error handler — logs unhandled rejections in dev only
const GlobalErrorHandler = () => {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (import.meta.env.DEV) {
        console.warn('[CostForge] Unhandled rejection:', event.reason);
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);
  return null;
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
      {/* CostForge opens directly to Dashboard — no marketing landing page */}
      <Route path="/" component={DashboardPage} />
      {/* /auth route removed — CostForge is an OS module, auth is owned by TerraFusion OS */}
      <Route path="/documentation" component={DocumentationPage} />
      <Route path="/tutorials" component={TutorialsPage} />
      <Route path="/faq" component={FAQPage} />

      {/* Supabase test route - without protection for easier testing */}
      {/* /supabase-test route removed — Supabase not used in OS module */}
      <Route path="/cost-wizard" component={CostWizardPage} />

      {/* Collaborative routes - without CollaborationProvider at this level */}
      <Route path="/shared-projects">
        <Switch>
          <ProtectedRouteWrapper path="/shared-projects" component={SharedProjectsPage} />
          <ProtectedRouteWrapper path="/shared-projects/create" component={CreateProjectPage} />
          <ProtectedRouteWrapper path="/shared-projects/:id" component={ProjectDetailsPage} />
          <ProtectedRouteWrapper
            path="/shared-projects/:id/dashboard"
            component={SharedProjectDashboardPage}
          />
        </Switch>
      </Route>

      <Route path="/projects">
        <Switch>
          <ProtectedRouteWrapper path="/projects/:id" component={ProjectDetailsPage} />
        </Switch>
      </Route>

      {/* Other protected routes */}
      <ProtectedRouteWrapper path="/dashboard" component={DashboardPage} />
      <ProtectedRouteWrapper path="/calculator" component={CostCalculatorAPI} />
      <ProtectedRouteWrapper path="/calculator-v2" component={EnhancedCalculatorPage} />
      <ProtectedRouteWrapper path="/workflows" component={WorkflowDashboardPage} />
      <ProtectedRouteWrapper path="/calculator-old" component={CalculatorPage} />
      <ProtectedRouteWrapper path="/analytics" component={AnalyticsPage} />
      <ProtectedRouteWrapper path="/users" component={UsersPage} />
      <ProtectedRouteWrapper path="/ai-tools" component={AIToolsPage} />
      <ProtectedRouteWrapper path="/ai-cost-wizard" component={AICostWizardPage} />
      <ProtectedRouteWrapper path="/ar-visualization" component={ARVisualizationPage} />
      <ProtectedRouteWrapper path="/data-import" component={DataImportPage} />
      <ProtectedRouteWrapper path="/benchmarking" component={BenchmarkingPage} />
      <ProtectedRouteWrapper path="/mcp-overview" component={MCPOverviewPage} />
      <ProtectedRouteWrapper path="/mcp-dashboard" component={MCPDashboard} />
      <ProtectedRouteWrapper path="/what-if-scenarios" component={WhatIfScenariosPage} />
      <ProtectedRouteWrapper path="/reports" component={ReportsPage} />
      <ProtectedRouteWrapper path="/visualizations" component={VisualizationsPage} />
      <ProtectedRouteWrapper path="/benton-county-demo" component={BentonCountyDemoPage} />
      <ProtectedRouteWrapper path="/data-exploration-demo" component={DataExplorationDemo} />
      <ProtectedRouteWrapper
        path="/comparative-analysis-demo"
        component={ComparativeAnalysisDemo}
      />
      <ProtectedRouteWrapper
        path="/statistical-analysis-demo"
        component={StatisticalAnalysisDemo}
      />
      <ProtectedRouteWrapper path="/cost-trend-analysis-demo" component={CostTrendAnalysisDemo} />
      <ProtectedRouteWrapper
        path="/predictive-cost-analysis-demo"
        component={PredictiveCostAnalysisDemo}
      />
      <ProtectedRouteWrapper path="/data-exploration" component={DataExplorationDemo} />
      <ProtectedRouteWrapper
        path="/infrastructure-lifecycle"
        component={InfrastructureLifecyclePage}
      />
      <ProtectedRouteWrapper path="/comparative-analysis" component={ComparativeAnalysisDemo} />
      <ProtectedRouteWrapper path="/statistical-analysis" component={StatisticalAnalysisDemo} />
      <ProtectedRouteWrapper path="/cost-trend-analysis" component={CostTrendAnalysisDemo} />
      <ProtectedRouteWrapper
        path="/predictive-cost-analysis"
        component={PredictiveCostAnalysisDemo}
      />
      <ProtectedRouteWrapper
        path="/regional-cost-comparison"
        component={RegionalCostComparisonPage}
      />
      <ProtectedRouteWrapper path="/contextual-data" component={ContextualDataPage} />
      <ProtectedRouteWrapper path="/data-connections" component={DataConnectionsPage} />
      <ProtectedRouteWrapper path="/data-connections/ftp" component={FTPConnectionPage} />
      <ProtectedRouteWrapper path="/data-connections/ftp/test" component={FTPConnectionTestPage} />
      <ProtectedRouteWrapper path="/settings/ftp-sync" component={FTPSyncSchedulePage} />
      <ProtectedRouteWrapper path="/properties" component={PropertyBrowserPage} />
      <ProtectedRouteWrapper path="/properties/:id" component={PropertyDetailsPage} />
      <ProtectedRouteWrapper path="/geo-assessment" component={GeoAssessmentPage} />
      <ProtectedRouteWrapper path="/mcp-visualizations" component={MCPVisualizationsPage} />
      <ProtectedRouteWrapper path="/cost-calculator" component={CostCalculatorAPI} />
      <ProtectedRouteWrapper path="/cost-calculator-legacy" component={CostCalculator} />
      <ProtectedRouteWrapper path="/ai-swarm" component={SwarmPage} />
      <ProtectedRouteWrapper path="/calibration" component={CalibrationWorkbench} />

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
          <GlobalErrorHandler />
          <OsContextProvider>
            <WindowProvider>
              <AuthProvider>
                <DataFlowProvider>
                  <SidebarProvider>
                    <div className="flex h-screen overflow-hidden bg-background">
                      <Sidebar />
                      <main className="flex-1 overflow-y-auto">
                        <Router />
                      </main>
                    </div>
                    <Toaster />
                  </SidebarProvider>
                </DataFlowProvider>
              </AuthProvider>
            </WindowProvider>
          </OsContextProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
