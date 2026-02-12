import { Switch, Route } from "wouter";
import Home from "./pages/Home";
import EnhancedHome from "./pages/Home.enhanced";
import AppraiserHome from "./pages/AppraiserHome";
import FormPage from "./pages/FormPage";
import CompsPage from "./pages/CompsPage";
import CompsSearchPage from "./pages/CompsSearchPage";
import PhotosPage from "./pages/PhotosPage";
import SketchesPage from "./pages/SketchesPage";
import ReportsPage from "./pages/ReportsPage";
import CompliancePage from "./pages/CompliancePage";
import AIValuationPage from "./pages/AIValuationPage";
import StardustProperty from "./pages/StardustProperty";
import SimpleHome from "./pages/SimpleHome";
import EmailOrderPage from "./pages/EmailOrderPage";
import PropertyDataPage from "./pages/PropertyDataPage";
import PropertyAppraisalPage from "./pages/PropertyAppraisalPage";
import PropertyAnalysis from "./pages/PropertyAnalysis";
import SimplePropertyPage from "./pages/SimplePropertyPage";
import UADFormPage from "./pages/UADFormPage";
import EnhancedUADFormPage from "./pages/UADFormPage.enhanced";
import { ComparablePropertiesPage } from "./pages/ComparablePropertiesPage";
import ImportPage from "./pages/ImportPage";
import LegacyImporter from "./pages/LegacyImporter";
import NotFound from "./pages/not-found";
import SharedPropertyPage from "./pages/SharedPropertyPage";
import SnapshotViewerPage from "./pages/SnapshotViewerPage";
import SystemMonitorPage from "./pages/SystemMonitorPage";
import { TooltipProvider } from "./contexts/TooltipContext";
import TermsPage from "./pages/TermsPage";
import CRDTTestPage from "./pages/CRDTTestPage";
import PhotoEnhancementPage from "./pages/PhotoEnhancementPage";
import PhotoSyncTestPage from "./pages/PhotoSyncTestPage";
import NotificationTestPage from "./pages/NotificationTestPage";
import WebSocketTestPage from "./pages/WebSocketTestPage";
import BasicWebSocketTestPage from "./pages/BasicWebSocketTestPage";
import ShapViewerPage from "./pages/ShapViewerPage";
// Import the new URAR page
import UrarPage from "./pages/UrarPage";
import { WorkflowPage } from "./pages/WorkflowPage";
import { ReportGenerationPage } from "./pages/ReportGenerationPage";
import MarketAnalysisPage from "./pages/MarketAnalysisPage";
import SettingsPage from "./pages/SettingsPage";
import HelpSupportPage from "./pages/HelpSupportPage";
import BatchAdjustmentPage from "./pages/BatchAdjustmentPage";
import ReviewerPage from "./pages/ReviewerPage";
import OnboardingPage from "./pages/OnboardingPage";
import { AppProvider } from "./contexts/AppContext";
import { PerformanceProvider } from "./contexts/PerformanceContext";
import { RealtimeProvider } from "./contexts/RealtimeContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { BasicWebSocketProvider } from "./contexts/BasicWebSocketContext";
import { AppShell } from "./components/ui/app-shell";
import WebSocketManager from "./components/WebSocketManager";
import { useState, useEffect } from "react";
// Add missing imports if any
import RedirectToProperty from "./pages/RedirectToProperty";
import NewHomePage from "./pages/NewHomePage";
import PropertyDashboard from "./pages/PropertyDashboard";
import NewPropertyAnalyzer from "./pages/NewPropertyAnalyzer";
import TerraFusionDashboard from "./pages/TerraFusionDashboard";
import TestDashboard from "./pages/TestDashboard";
import IntelligentURAR from "./pages/IntelligentURAR";
import ConversionCenter from "./pages/ConversionCenter";
import SimpleLegacyImporter from "./pages/SimpleLegacyImporter";
import ExplorerPage from "./pages/ExplorerPage";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import MetaInfrastructurePage from "./pages/MetaInfrastructurePage";
import FormEnginePage from "./pages/FormEnginePage";
import InfiniformEnginePage from "./pages/InfiniformEnginePage";
import PublicLedgerPage from "./pages/PublicLedgerPage";
import ZoningAIMapPage from "./pages/ZoningAIMapPage";
import WACountyPortalPage from "./pages/WACountyPortalPage";
import TriCitiesRegionalPage from "./pages/TriCitiesRegionalPage";
import WAStatewidePage from "./pages/WAStatewidePage";
import UAD36PipelinePage from "./pages/UAD36PipelinePage";
import NeuralAppraiserPage from "./pages/NeuralAppraiserPage";
import MultiZipForecastPage from "./pages/MultiZipForecastPage";
import ZkChainTrustPage from "./pages/ZkChainTrustPage";
import UADTrainingAgentPage from "./pages/UADTrainingAgentPage";
import AgentSessionsPage from "./pages/AgentSessionsPage";
import LegacyImporterPage from "./pages/LegacyImporterPage";

// Main App Component - Now using AppProvider and AppShell for consistent layout
function App() {
  // Track if app is loaded to reduce flash of unstyled content
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate app initialization process
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Loading state while app initializes
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="h-12 w-12 animate-pulse"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          ><>

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3"
            />
          </svg>
          <p
</> className="text-lg font-medium animate-pulse">Loading TerraFusionPlatform...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <Switch>
        {/* Explicit routes first - Show Terrafusion Pro Dashboard */}
        <Route path="/">{() => <TerraFusionDashboard />}</Route>
        <Route path="/property-analysis" component={PropertyDashboard} />
        <Route path="/property-analysis-new" component={PropertyDashboard} />
        <Route path="/property-analyzer" component={NewPropertyAnalyzer} />
        <Route path="/stardust" component={SimplePropertyPage} />
        <Route path="/appraiser" component={AppraiserHome} />
        <Route path="/form" component={FormPage} />
        <Route path="/comps" component={CompsPage} />
        <Route path="/comps-search">{() => <CompsSearchPage />}</Route>
        <Route path="/photos" component={PhotosPage} />
        <Route path="/sketches" component={SketchesPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/compliance" component={CompliancePage} />
        <Route path="/ai-valuation" component={RedirectToProperty} />
        <Route path="/property-analysis" component={PropertyAnalysis} />
        <Route path="/email-order" component={EmailOrderPage} />
        <Route path="/property-data" component={PropertyDataPage} />
        <Route path="/property/:id" component={PropertyDataPage} />
        <Route path="/property-appraisal" component={PropertyAppraisalPage} />
        <Route path="/appraisal-report" component={PropertyAppraisalPage} />
        <Route path="/uad-form" component={EnhancedUADFormPage} />
        <Route path="/uad-form/:id" component={EnhancedUADFormPage} />
        <Route path="/comparables/:reportId" component={ComparablePropertiesPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/import" component={ImportPage} />
        <Route path="/legacy-import" component={LegacyImporter} />
        <Route path="/legacy-importer" component={LegacyImporter} />
        <Route path="/crdt-test" component={CRDTTestPage} />
        <Route path="/photo-enhancement" component={PhotoEnhancementPage} />
        <Route path="/photo-sync-test" component={PhotoSyncTestPage} />
        <Route path="/notification-test" component={NotificationTestPage} />
        <Route path="/ws-test" component={WebSocketTestPage} />
        <Route path="/websocket-test" component={WebSocketTestPage} />
        <Route path="/basic-ws-test" component={BasicWebSocketTestPage} />
        <Route path="/stardust-property" component={StardustProperty} />
        <Route path="/shared/:token" component={SharedPropertyPage} />
        <Route path="/workflow" component={WorkflowPage} />
        <Route path="/workflow/:reportId" component={WorkflowPage} />
        <Route path="/reports/:reportId" component={ReportGenerationPage} />
        <Route path="/ai-analysis" component={MarketAnalysisPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/help" component={HelpSupportPage} />
        <Route path="/snapshots" component={SnapshotViewerPage} />
        <Route path="/snapshots/:propertyId" component={SnapshotViewerPage} />
        <Route path="/system-monitor" component={SystemMonitorPage} />
        <Route path="/system-status" component={SystemMonitorPage} />
        <Route path="/shap-viewer" component={ShapViewerPage} />
        <Route path="/batch-adjustment" component={BatchAdjustmentPage} />
        <Route path="/batch-adjustment/:appraisalId" component={BatchAdjustmentPage} />
        <Route path="/reviewer" component={ReviewerPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/get-started" component={OnboardingPage} />
        {/* Data Conversion Center */}
        <Route path="/conversion" component={ConversionCenter} />
        <Route path="/conversion-center" component={ConversionCenter} />
        <Route path="/data-conversion" component={ConversionCenter} />
        {/* Terrafusion Explorer & Analytics */}
        <Route path="/explorer" component={ExplorerPage} />
        <Route path="/analytics" component={AnalyticsDashboard} />
        <Route path="/meta-infrastructure" component={MetaInfrastructurePage} />
        <Route path="/form-engine" component={FormEnginePage} />
        <Route path="/infiniform" component={InfiniformEnginePage} />
        <Route path="/ledger" component={PublicLedgerPage} />
        <Route path="/zoning-map" component={ZoningAIMapPage} />
        <Route path="/wa-counties" component={WACountyPortalPage} />
        <Route path="/tri-cities" component={TriCitiesRegionalPage} />
        <Route path="/wa-statewide" component={WAStatewidePage} />
        <Route path="/uad-pipeline" component={UAD36PipelinePage} />
        <Route path="/neural-appraiser" component={NeuralAppraiserPage} />
        <Route path="/multi-zip-forecast" component={MultiZipForecastPage} />
        <Route path="/zk-chain-trust" component={ZkChainTrustPage} />
        <Route path="/uad-training" component={UADTrainingAgentPage} />
        <Route path="/agent-sessions" component={AgentSessionsPage} />
        <Route path="/legacy-importer" component={LegacyImporterPage} />
        {/* URAR + AI Assistant Pages - Multiple routes for compatibility */}
        <Route path="/urar">{() => <IntelligentURAR />}</Route>
        <Route path="/urar/:propertyId">
          {(params) => <IntelligentURAR propertyId={Number(params.propertyId)} />}
        </Route>
        <Route path="/legal-urar">{() => <UrarPage />}</Route>
        <Route path="/legal-urar/:propertyId">
          {(params) => <UrarPage propertyId={Number(params.propertyId)} />}
        </Route>
        <Route path="/debug/performance">
          {() => {
            // Only import PerformanceDebugger in development
            const { PerformanceDebugger } = require("./components/dev/PerformanceDebugger");
            return (
              <div className="container mx-auto p-6 flex justify-center">
                <PerformanceDebugger />
              </div>
            );
          }}
        </Route>
        <Route path="/:rest*" component={NotFound} />
      </Switch>
    </AppShell>
  );
}

export default App;
