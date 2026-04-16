import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConsolidatedDashboard from "@/pages/ConsolidatedDashboard";
import BulkImport from "@/pages/BulkImport";
import AdvancedAnalyticsDashboard from "@/components/AdvancedAnalyticsDashboard";
import RealTimePiltMonitor from "@/components/RealTimePiltMonitor";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Switch>
              <Route path="/" component={ConsolidatedDashboard} />
              <Route path="/dashboard" component={ConsolidatedDashboard} />
              <Route path="/bulk-import" component={BulkImport} />
              <Route path="/analytics" component={AdvancedAnalyticsDashboard} />
              <Route path="/monitor" component={RealTimePiltMonitor} />
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
