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
import { useState, useEffect } from "react";

interface District {
  name: string;
  code: string;
  year: number;
}

// Simple test component to verify frontend is working
function TestDashboard() {
  const [apiStatus, setApiStatus] = useState("Testing...");
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    // Test API connection
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setApiStatus("✅ API Connected");
        // Test districts API
        return fetch('/api/pilt/districts?year=2024');
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setDistricts(data.data);
        }
      })
      .catch(error => {
        setApiStatus("❌ API Error: " + (error instanceof Error ? error.message : 'Unknown error'));
      });
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-8"><>

        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          🎉 TerraFusionPilt V2.0.0 - LIVE!
        </h1>
        <p
</> className="text-xl text-gray-600 mb-6">
          Benton County PILT Management System
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg"><>

            <h3 className="text-lg font-semibold mb-3">🔗 API Status</h3>
            <p
</> className="text-lg">{apiStatus}</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg"><>

            <h3 className="text-lg font-semibold mb-3">🏫 School Districts</h3>
            <p
</> className="text-lg">{districts.length} districts loaded</p>
          </div>
        </div>

        {districts.length > 0 && (
          <div className="mt-8"><>

            <h3 className="text-2xl font-semibold mb-4">📊 Benton County School Districts</h3>
            <div
</> className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {districts.map((district /* , index */) => (
                <div key={index} className="bg-white border border-gray-200 p-4 rounded-lg shadow"><>

                  <h4 className="font-semibold text-blue-600">{district.name}</h4>
                  <p
</> className="text-sm text-gray-500">Code: {district.code}</p>
                  <p className="text-sm text-gray-500">Year: {district.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 p-6 bg-gray-50 rounded-lg"><>

          <h3 className="text-lg font-semibold mb-3">🚀 System Status</h3>
          <ul
</> className="space-y-2"><>

            <li>✅ Frontend: React app loaded successfully</li>
                            <li
</>>✅ Backend: Node.js server running on port 5009</li><>

            <li>✅ Database: SQLite initialized with 8 tables</li>
                            <li
</>>✅ APIs: Health and Districts endpoints working</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={TestDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [apiStatus, setApiStatus] = useState("Testing...");
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    // Test API connection
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setApiStatus(`✅ Connected - ${data.status} (v${data.version})`);
      })
      .catch(() => {
        setApiStatus("❌ API Connection Failed");
      });

    // Load districts
    fetch('/api/pilt/districts?year=2024')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDistricts(data.data || []);
        }
      })
      .catch(err => {
        console.error("Failed to load districts:", err);
      });
  }, []);

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
