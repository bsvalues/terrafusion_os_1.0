import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { CountyProvider } from "@/hooks/useCounty";
import Dashboard from "@/pages/dashboard";
import OrchestratorPage from "@/pages/orchestrator";
import PropertyDashboard from "@/pages/property-dashboard";
import PropertyRecordCard from "@/pages/property-record-card";
import TerraFusionDashboard from "@/pages/terrafusion-complete";
import AgentsPage from "@/pages/agents";
import IDEPage from "@/pages/ide";
import SystemMonitoringPage from "@/pages/system-monitoring";
import { ParcelWorkbench } from "@/pages/parcel-workbench";
import AnalyticsPage from "@/pages/analytics";
import PropertySearchPage from "@/pages/property-search";
import SimplePropertySearch from "@/pages/simple-property-search";
import CountyWorkflow from "@/pages/county-workflow";


import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/properties" component={PropertyRecordCard} />
      <Route path="/property-dashboard" component={PropertyDashboard} />
      <Route path="/terrafusion" component={TerraFusionDashboard} />
      <Route path="/agents" component={AgentsPage} />
      <Route path="/ide" component={IDEPage} />
      <Route path="/orchestrator" component={OrchestratorPage} />
      <Route path="/monitoring" component={SystemMonitoringPage} />
      <Route path="/parcel-workbench" component={ParcelWorkbench} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/property-search" component={PropertySearchPage} />
      <Route path="/search" component={SimplePropertySearch} />
      <Route path="/county-workflow" component={CountyWorkflow} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CountyProvider>
        <Toaster />
        <Router />
      </CountyProvider>
    </QueryClientProvider>
  );
}

export default App;
