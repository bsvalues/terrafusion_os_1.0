import { Route } from "wouter";
import { Toaster } from "./components/ui/toaster";
import Home from "./pages/Home";
import EnhancedAIValuationPage from "./pages/AIValuationPage.enhanced";
import EnhancedCompliancePage from "./pages/CompliancePage.enhanced";
import EnhancedPhotosPage from "./pages/PhotosPage.enhanced";
import EnhancedSketchesPage from "./pages/SketchesPage.enhanced";
import FormPage from "./pages/FormPage";
import ReportsPage from "./pages/ReportsPage";
import EmailOrderPage from "./pages/EmailOrderPage";
import CompsPage from "./pages/CompsPage";
import NotFoundPage from "./pages/not-found";

export default function EnhancedApp() {
  return (
    <>
      <Route path="/" component={Home} />
      <Route path="/ai-valuation" component={EnhancedAIValuationPage} />
      <Route path="/compliance/:reportId" component={EnhancedCompliancePage} />
      <Route path="/compliance" component={EnhancedCompliancePage} />
      <Route path="/form/:id" component={FormPage} />
      <Route path="/form" component={FormPage} />
      <Route path="/reports/:id" component={ReportsPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/photos/:reportId" component={EnhancedPhotosPage} />
      <Route path="/photos" component={EnhancedPhotosPage} />
      <Route path="/sketches/:reportId" component={EnhancedSketchesPage} />
      <Route path="/sketches" component={EnhancedSketchesPage} />
      <Route path="/email-order" component={EmailOrderPage} />
      <Route path="/comps" component={CompsPage} />
      <Route path="/:rest*" component={NotFoundPage} />
      <Toaster />
    </>
  );
}
