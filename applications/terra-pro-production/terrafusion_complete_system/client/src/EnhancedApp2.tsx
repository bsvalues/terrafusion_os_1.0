import { Route } from "wouter";
import { AppProvider } from "./contexts/AppContext";
import { TooltipProvider } from "./contexts/TooltipContext";
import { Toaster } from "./components/ui/toaster";
import { AppShell } from "./components/layout/app-shell";
import { ErrorBoundary } from "./components/error-boundary";
import { WebSocketProvider } from "./contexts/WebSocketContext";

// Import pages
import Home from "./pages/Home";
import FormPage from "./pages/FormPage";
import CompsPage from "./pages/CompsPage";
import CompsSearchPage from "./pages/CompsSearchPage";
import PhotosPage from "./pages/PhotosPage";
import SketchesPage from "./pages/SketchesPage";
import ReportsPage from "./pages/ReportsPage";
import CompliancePage from "./pages/CompliancePage";
import AIValuationPage from "./pages/AIValuationPage";
import EmailOrderPage from "./pages/EmailOrderPage";
import PropertyDataPage from "./pages/PropertyDataPage";
import PropertyEntryPage from "./pages/PropertyEntryPage";
import UADFormPage from "./pages/UADFormPage";
import MarketAnalysisPage from "./pages/MarketAnalysisPage";
import { ComparablePropertiesPage } from "./pages/ComparablePropertiesPage";
import ImportPage from "./pages/ImportPage";
import NotFound from "./pages/not-found";
import SharedPropertyPage from "./pages/SharedPropertyPage";
import TermsPage from "./pages/TermsPage";
import CRDTTestPage from "./pages/CRDTTestPage";
import PhotoEnhancementPage from "./pages/PhotoEnhancementPage";
import PhotoSyncTestPage from "./pages/PhotoSyncTestPage";
import NotificationTestPage from "./pages/NotificationTestPage";
import UrarPage from "./pages/UrarPage";
import SettingsPage from "./pages/SettingsPage";
import HelpSupportPage from "./pages/HelpSupportPage";
import SystemMonitorPage from "./pages/SystemMonitorPage";
import { WorkflowPage } from "./pages/WorkflowPage";
import { ReportGenerationPage } from "./pages/ReportGenerationPage";
import WebSocketTestPage from "./pages/WebSocketTestPage";
import SnapshotViewerPage from "./pages/SnapshotViewerPage";
import ShapViewerPage from "./pages/ShapViewerPage";

// Import the enhanced versions of pages
import EnhancedHome from "./pages/Home.enhanced";
import EnhancedAIValuationPage from "./pages/AIValuationPage.enhanced";
import EnhancedCompliancePage from "./pages/CompliancePage.enhanced";
import EnhancedPhotosPage from "./pages/PhotosPage.enhanced";
// Import simplified version of SketchesPage to avoid errors
import BasicSketchesPage from "./pages/BasicSketchesPage";
import EnhancedPhotoSyncTestPage from "./pages/PhotoSyncTestPage.enhanced";
import EnhancedUADFormPage from "./pages/UADFormPage.enhanced";

// Use the enhanced versions
const HomeComponent = EnhancedHome;
const AIValuationPageComponent = EnhancedAIValuationPage;
const CompliancePageComponent = EnhancedCompliancePage;
const PhotosPageComponent = EnhancedPhotosPage;
const SketchesPageComponent = BasicSketchesPage;
const PhotoSyncTestPageComponent = EnhancedPhotoSyncTestPage;
const UADFormPageComponent = EnhancedUADFormPage;

export default function EnhancedApp2() {
  return (
    <AppProvider>
      <WebSocketProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <AppShell>
              <Route path="/" component={HomeComponent} />
              <Route path="/form" component={FormPage} />
              <Route path="/form/:id" component={FormPage} />
              <Route path="/comps" component={CompsPage} />
              <Route path="/comps-search" component={CompsSearchPage} />
              <Route
                path="/photos"
                component={() => (
                  <ErrorBoundary>
                    <PhotosPageComponent />
                  </ErrorBoundary>
                )}
              />
              <Route
                path="/photos/:reportId"
                component={() => (
                  <ErrorBoundary>
                    <PhotosPageComponent />
                  </ErrorBoundary>
                )}
              />
              <Route path="/sketches" component={SketchesPageComponent} />
              <Route path="/sketches/:reportId" component={SketchesPageComponent} />
              <Route path="/reports" component={ReportsPage} />
              <Route path="/reports/:id" component={ReportsPage} />
              <Route
                path="/compliance"
                component={() => (
                  <ErrorBoundary>
                    <CompliancePageComponent />
                  </ErrorBoundary>
                )}
              />
              <Route
                path="/compliance/:reportId"
                component={() => (
                  <ErrorBoundary>
                    <CompliancePageComponent />
                  </ErrorBoundary>
                )}
              />
              <Route
                path="/ai-valuation"
                component={() => (
                  <ErrorBoundary>
                    <AIValuationPageComponent />
                  </ErrorBoundary>
                )}
              />
              <Route path="/email-order" component={EmailOrderPage} />
              <Route path="/property-data" component={PropertyDataPage} />
              <Route path="/property/:id" component={PropertyDataPage} />
              <Route path="/property-entry" component={PropertyEntryPage} />
              <Route path="/property-entry/:id" component={PropertyEntryPage} />
              <Route
                path="/uad-form"
                component={() => (
                  <ErrorBoundary>
                    <UADFormPageComponent />
                  </ErrorBoundary>
                )}
              />
              <Route
                path="/uad-form/:id"
                component={() => (
                  <ErrorBoundary>
                    <UADFormPageComponent />
                  </ErrorBoundary>
                )}
              />
              <Route path="/market-analysis" component={MarketAnalysisPage} />
              <Route path="/comparables/:reportId" component={ComparablePropertiesPage} />
              <Route path="/terms" component={TermsPage} />
              <Route path="/import" component={ImportPage} />
              <Route path="/crdt-test" component={CRDTTestPage} />
              <Route path="/photo-enhancement" component={PhotoEnhancementPage} />
              <Route
                path="/photo-sync-test"
                component={() => (
                  <ErrorBoundary>
                    <PhotoSyncTestPageComponent />
                  </ErrorBoundary>
                )}
              />
              <Route path="/notification-test" component={NotificationTestPage} />
              <Route path="/shared/:token" component={SharedPropertyPage} />

              {/* URAR Routes */}
              <Route path="/urar">{() => <UrarPage />}</Route>
              <Route path="/urar/:propertyId">
                {(params) => <UrarPage propertyId={Number(params.propertyId)} />}
              </Route>
              <Route path="/legal-urar">{() => <UrarPage />}</Route>
              <Route path="/legal-urar/:propertyId">
                {(params) => <UrarPage propertyId={Number(params.propertyId)} />}
              </Route>

              {/* System & Settings Routes */}
              <Route path="/settings" component={SettingsPage} />
              <Route path="/help" component={HelpSupportPage} />
              <Route path="/system-monitor" component={SystemMonitorPage} />
              <Route path="/system-status" component={SystemMonitorPage} />

              {/* Workflow & Report Routes */}
              <Route path="/workflow" component={WorkflowPage} />
              <Route path="/workflow/:reportId" component={WorkflowPage} />
              <Route path="/reports/:reportId" component={ReportGenerationPage} />

              {/* Utility Routes */}
              <Route path="/ws-test" component={WebSocketTestPage} />
              <Route path="/websocket-test" component={WebSocketTestPage} />
              <Route path="/snapshots" component={SnapshotViewerPage} />
              <Route path="/snapshots/:propertyId" component={SnapshotViewerPage} />
              <Route path="/shap-viewer" component={ShapViewerPage} />
              <Route path="/shap" component={ShapViewerPage} />
              <Route path="/ai-analysis" component={MarketAnalysisPage} />

              <Route path="/:rest*" component={NotFound} />
              <Toaster />
            </AppShell>
          </ErrorBoundary>
        </TooltipProvider>
      </WebSocketProvider>
    </AppProvider>
  );
}
