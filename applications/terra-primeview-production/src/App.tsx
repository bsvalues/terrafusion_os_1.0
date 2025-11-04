
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PropertyRecord from "./pages/PropertyRecord";
import AgentDashboard from "./pages/AgentDashboard";
import CountyLanding from "./pages/CountyLanding";
import OrchestratorMonitor from "./pages/OrchestratorMonitor";
import DataImportDashboard from "./pages/DataImportDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/property-record" element={<PropertyRecord />} />
          <Route path="/agent-dashboard" element={<AgentDashboard />} />
          <Route path="/county-landing" element={<CountyLanding />} />
          <Route path="/orchestrator-monitor" element={<OrchestratorMonitor />} />
          <Route path="/data-import-dashboard" element={<DataImportDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
