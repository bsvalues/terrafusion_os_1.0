import React, {useEffect} from "react";
import {Switch, Route, Redirect, useLocation} from "wouter";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing-page";
import Dashboard from "@/pages/dashboard";
import AuditQueue from "@/pages/audit-queue";
import CreateAudit from "@/pages/create-audit";
import Analytics from "@/pages/analytics";
import EnhancedAnalytics from "@/pages/enhanced-analytics";
import AuditHistory from "@/pages/audit-history";
import AccountManagement from "@/pages/account-management";
import Settings from "@/pages/settings";
import AIRecommendations from "@/pages/ai-recommendations";
import ActionDemo from "@/pages/action-demo";
import StyleDemo from "@/pages/style-demo";
import RoadmapPage from "@/pages/roadmap";
import WorkflowManagementPage from "@/pages/workflow-management";
import TerraFusionEnterprisePage from "@/pages/terrafusion-enterprise";
import BrandShowcasePage from "@/pages/brand-showcase";
import BrandChecklistPage from "@/pages/brand-checklist";
import BrandImplementationPage from "@/pages/brand-implementation";
import QuantumProcessingPage from "@/pages/quantum-processing";
import AssessorPromisedLandPage from "@/pages/assessor-promised-land";
import CollaborationDemo from "@/pages/collaboration";
import {AIInsightsPage} from "@/pages/ai-insights";
import AccessibilityDemo from "@/pages/accessibility-demo";

import GISDashboard from "@/pages/gis-dashboard";
import {AdvancedAnalyticsPage} from "./pages/AdvancedAnalyticsPage";
import {AuthProvider, useAuth} from "@/hooks/use-auth";
import ConnectionAlert from "./components/connection-alert";
import {Loader2} from '@mui/icons-material';
import MainLayout from "@/layouts/main-layout";
import {AccessibilityProvider, SkipToContent} from "@/components/accessibility-provider";
import {AccessibilityShortcuts, AccessibleLoading} from "@/components/accessibility-settings";

// Inner App component that relies on AuthContext
function AuthenticatedApp() {const auth = useAuth();
  const [location, navigate] = useLocation();
  
  // Use useEffect for navigation to avoid state updates during render
  useEffect(() =>{
    if (auth.isLoading) return; // Skip navigation logic during loading
    
    // During development, don't redirect to auth page
    // This will be re-enabled before deployment
    // if (!auth.user && 
    //   !["/", "/auth", "/style-demo", "/modern-style-demo", "/gis-dashboard"].includes(location)) {
    //   navigate("/");
    //}
  }, [auth.user, auth.isLoading, location, navigate]);
  
  // Show loading spinner while checking authentication
  if (auth.isLoading) {
    return (<AccessibleLoading isLoading={true} loadingText="Authenticating user..."><div /></AccessibleLoading>);
  }
  
  // Render the appropriate page based on the route
  return (<SkipToContent /><AccessibilityShortcuts /><ConnectionAlert />{/* Full-screen Terrafusion Enterprise Application */}<main id="main-content" tabIndex={-1} role="main" aria-label="Terrafusion application content"><Switch><Route path="/" component={Dashboard} /><Route path="/quantum" component={QuantumProcessingPage} /><Route path="/assessor-promised-land" component={AssessorPromisedLandPage} /><Route path="/audit-queue" component={AuditQueue} /><Route path="/create-audit" component={CreateAudit} /><Route path="/analytics" component={Analytics} /><Route path="/enhanced-analytics" component={EnhancedAnalytics} /><Route path="/audit-history" component={AuditHistory} /><Route path="/account" component={AccountManagement} /><Route path="/settings" component={Settings} /><Route path="/ai-recommendations" component={AIRecommendations} /><Route path="/roadmap" component={RoadmapPage} /><Route path="/workflow" component={WorkflowManagementPage} /><Route path="/terrafusion" component={TerraFusionEnterprisePage} /><Route path="/brand" component={BrandShowcasePage} /><Route path="/brand-checklist" component={BrandChecklistPage} /><Route path="/brand-implementation" component={BrandImplementationPage} /><Route path="/action-demo" component={ActionDemo} /><Route path="/gis-dashboard" component={GISDashboard} /><Route path="/ai-insights" component={AIInsightsPage} /><Route path="/advanced-analytics" component={AdvancedAnalyticsPage} /><Route path="/collaboration" component={CollaborationDemo} /><Route path="/accessibility" component={AccessibilityDemo} /><Route path="/style-demo" component={StyleDemo} /><Route component={NotFound} /></Switch></main>);
}

// Root App component that provides the AuthProvider and AccessibilityProvider
function App() {return (<AccessibilityProvider><AuthProvider><AuthenticatedApp /></AuthProvider></AccessibilityProvider>
  );}

export default App;
