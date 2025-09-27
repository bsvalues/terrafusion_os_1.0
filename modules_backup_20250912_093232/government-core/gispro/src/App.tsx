import React, {useState, useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate, useLocation} from 'react-router-dom';
import {Toaster} from '@/components/ui/toaster';
import {ThemeProvider} from '@/components/ui/theme-provider';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';

// Layout Components
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';

// Page Components
import HomePage from '@/pages/home-page';
import AuthPage from '@/pages/auth-page';
import PropertySearchPage from '@/pages/property-search-page';
import MapViewerPage from '@/pages/map-viewer-page';
import ReportPage from '@/pages/report-page';
import DashboardPage from '@/pages/dashboard-page';
import DocumentClassificationPage from '@/pages/document-classification-page';
import LegalDescriptionAgentPage from '@/pages/legal-description-agent-page';
import CollaborativeWorkspacePage from '@/pages/collaborative-workspace-page';
import ProgressTrackerDemo from '@/pages/progress-tracker-demo';
import ParcelGeneratorPage from '@/pages/parcel-generator-page';
import PublicPropertyPortal from '@/pages/public-property-portal';
import MapboxDemoPage from '@/pages/mapbox-demo-page';
import CollaborativeMapboxPage from '@/pages/collaborative-mapbox-page';
import GeospatialAnalysisPage from '@/pages/geospatial-analysis-page';
import CartographerToolsPage from '@/pages/cartographer-tools-page';
import EnhancedMapCollaborationPage from '@/pages/enhanced-map-collaboration-page';
import CollaborativeDocumentParcelMap from '@/pages/collaborative-document-parcel-map';
import DocumentParcelManagement from '@/pages/document-parcel-management';
import DataMigration from '@/pages/data-migration';
import ErrorHandlingPage from '@/pages/error-handling-page';
import WebSocketTest from '@/pages/websocket-test';
import ToastTestPage from '@/pages/toast-test-page';
import WebSocketDemoPage from '@/pages/websocket-demo-page';
import WorkflowPage from '@/pages/workflow-page';
import WorkflowDashboardPage from '@/pages/workflow-dashboard-page';
import ProjectProgress from '@/pages/project-progress';
import NotFound from '@/pages/not-found';

// Create React Query client
const queryClient = new QueryClient({defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes},
  },
});

// Protected Route Component
interface ProtectedRouteProps {children: React.ReactNode;}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({children}) => {const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() =>{
    // Check authentication status
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      const user = localStorage.getItem('user_data');
      setIsAuthenticated(!!token && !!user);};

    checkAuth();

    // Listen for storage changes (login/logout in other tabs)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Loading state
  if (isAuthenticated === null) {return (<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>);}

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return<Navigate to="/auth" state={{ from: location}} replace />;
  }

  return <>{children}</>;
};

// Main App Layout Component
const AppLayout: React.FC<{children: React.ReactNode}>= ({children}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Don't show layout on auth page
  if (location.pathname === '/auth') {
    return<>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50"><Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} /><div className="flex"><Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /><main className="flex-1 lg:ml-64"><div className="min-h-screen">{children}</div></main></div><Footer /></div>);
};

// Main App Component
function App() {
  return (<QueryClientProvider client={queryClient}><ThemeProvider defaultTheme="light" storageKey="terrafusion-theme"><Router><AppLayout><Routes>{/* Public Routes */}<Route path="/auth" element={<AuthPage />} /><Route path="/public" element={<PublicPropertyPortal />} />{/* Protected Routes */}<Route
                path="/"
                element={<ProtectedRoute><HomePage /></ProtectedRoute>}
              /><Route
                path="/dashboard"
                element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
              /><Route
                path="/properties"
                element={<ProtectedRoute><PropertySearchPage /></ProtectedRoute>}
              /><Route
                path="/map"
                element={<ProtectedRoute><MapViewerPage /></ProtectedRoute>}
              /><Route
                path="/reports"
                element={<ProtectedRoute><ReportPage /></ProtectedRoute>}
              /><Route
                path="/documents"
                element={<ProtectedRoute><DocumentClassificationPage /></ProtectedRoute>}
              /><Route
                path="/legal-descriptions"
                element={<ProtectedRoute><LegalDescriptionAgentPage /></ProtectedRoute>}
              /><Route
                path="/workspace"
                element={<ProtectedRoute><CollaborativeWorkspacePage /></ProtectedRoute>}
              /><Route
                path="/progress"
                element={<ProtectedRoute><ProgressTrackerDemo /></ProtectedRoute>}
              /><Route
                path="/parcels"
                element={<ProtectedRoute><ParcelGeneratorPage /></ProtectedRoute>}
              /><Route
                path="/mapbox-demo"
                element={<ProtectedRoute><MapboxDemoPage /></ProtectedRoute>}
              /><Route
                path="/collaborative-mapbox"
                element={<ProtectedRoute><CollaborativeMapboxPage /></ProtectedRoute>}
              /><Route
                path="/geospatial"
                element={<ProtectedRoute><GeospatialAnalysisPage /></ProtectedRoute>}
              /><Route
                path="/cartographer"
                element={<ProtectedRoute><CartographerToolsPage /></ProtectedRoute>}
              /><Route
                path="/enhanced-collaboration"
                element={<ProtectedRoute><EnhancedMapCollaborationPage /></ProtectedRoute>}
              /><Route
                path="/document-parcel-map"
                element={<ProtectedRoute><CollaborativeDocumentParcelMap /></ProtectedRoute>}
              /><Route
                path="/document-management"
                element={<ProtectedRoute><DocumentParcelManagement /></ProtectedRoute>}
              /><Route
                path="/data-migration"
                element={<ProtectedRoute><DataMigration /></ProtectedRoute>}
              /><Route
                path="/error-handling"
                element={<ProtectedRoute><ErrorHandlingPage /></ProtectedRoute>}
              /><Route
                path="/websocket-test"
                element={<ProtectedRoute><WebSocketTest /></ProtectedRoute>}
              /><Route
                path="/toast-test"
                element={<ProtectedRoute><ToastTestPage /></ProtectedRoute>}
              /><Route
                path="/websocket-demo"
                element={<ProtectedRoute><WebSocketDemoPage /></ProtectedRoute>}
              /><Route
                path="/workflow"
                element={<ProtectedRoute><WorkflowPage /></ProtectedRoute>}
              /><Route
                path="/workflow-dashboard"
                element={<ProtectedRoute><WorkflowDashboardPage /></ProtectedRoute>}
              /><Route
                path="/project-progress"
                element={<ProtectedRoute><ProjectProgress /></ProtectedRoute>}
              />{/* Fallback Routes */}<Route path="/404" element={<NotFound />} /><Route path="*" element={<Navigate to="/404" replace />} /></Routes></AppLayout>{/* Global Components */}<Toaster /></Router>{/* Development Tools */}
        {process.env.NODE_ENV === 'development' &&<ReactQueryDevtools initialIsOpen={false} />}
      </ThemeProvider></QueryClientProvider>
  );
}

export default App;
