import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import Home from "@/pages/Home";
import History from "@/pages/History";
import UploadDetail from "@/pages/UploadDetail";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import AIAnalytics from "@/pages/AIAnalytics";
import Auth from "@/pages/Auth";
import ConfigurationPage from "@/pages/ConfigurationPage";
import MCPDashboardPage from "@/pages/MCPDashboardPage";
import TerraFusionPermitPage from "@/pages/TerraFusionPermitPage";
import TerraFusionAI from "@/pages/TerraFusionAI";
import Diagnostics from "@/pages/Diagnostics";
import ProjectTrackerPage from "@/pages/ProjectTrackerPage";
import PACSPage from "@/pages/PACSPage";
import DeploymentPage from "@/pages/DeploymentPage";
import CommandCenter from "@/pages/CommandCenter";
import EnterpriseSecurityDashboard from "@/pages/EnterpriseSecurityDashboard";
import NeuralPermitDashboard from "@/pages/NeuralPermitDashboard";
import KnowledgeBase from "@/pages/KnowledgeBase";
import { OfflineModeProvider } from "@/hooks/use-offline-mode";
import { useAuth } from "@/hooks/use-auth";
import { AuthProvider } from "@/contexts/AuthContext";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import AutoLogin from "@/components/AutoLogin";
import { ChatInterface } from "@/components/chatbot";
import { chatbotEngine } from "@/lib/chatbot";
import HelpCenter from "@/components/help/HelpCenter";
import { HelpProvider } from "@/contexts/HelpContext";
import { TourProvider } from "@/components/tour/TourProvider";
import { TourContextProvider } from "@/contexts/TourContext";

function AppRoutes() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  const isAuthPage = location === "/auth";
  
  // For demonstration, always use development mode
  const isDevelopment = true; // Always enabled for demonstration

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {(isAuthenticated || isDevelopment) && !isAuthPage && <Navigation />}
          <ErrorBoundary>
            <Switch>
              {/* Auth route with consistent rendering pattern */}
              <Route path="/auth">
                {() => <Auth />}
              </Route>
              <Route path="/">
                {() => (
                  <ProtectedRoute>
                    <TerraFusionAI />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/history">
                {() => (
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/history/:id">
                {() => (
                  <ProtectedRoute>
                    <UploadDetail />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/reports">
                {() => (
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/settings">
                {() => (
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/ai-analytics">
                {() => (
                  <ProtectedRoute>
                    <AIAnalytics />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/configuration">
                {() => (
                  <ProtectedRoute>
                    <ConfigurationPage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/mcp">
                {() => (
                  <ProtectedRoute>
                    <MCPDashboardPage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/diagnostics">
                {() => (
                  <ProtectedRoute>
                    <Diagnostics />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/permits">
                {() => (
                  <ProtectedRoute>
                    <TerraFusionPermitPage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/project-tracker">
                {() => (
                  <ProtectedRoute>
                    <ProjectTrackerPage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/pacs">
                {() => (
                  <ProtectedRoute>
                    <PACSPage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/deployment">
                {() => (
                  <ProtectedRoute>
                    <DeploymentPage />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/command-center">
                {() => (
                  <ProtectedRoute>
                    <CommandCenter />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/enterprise-security">
                {() => (
                  <ProtectedRoute>
                    <EnterpriseSecurityDashboard />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/neural-permits">
                {() => (
                  <ProtectedRoute>
                    <NeuralPermitDashboard />
                  </ProtectedRoute>
                )}
              </Route>
              <Route path="/knowledge-base">
                {() => (
                  <ProtectedRoute>
                    <KnowledgeBase />
                  </ProtectedRoute>
                )}
              </Route>
              <Route>
                {() => (
                  <ProtectedRoute>
                    <NotFound />
                  </ProtectedRoute>
                )}
              </Route>
            </Switch>
          </ErrorBoundary>
        </div>
      </main>
      <Footer />
      <Toaster />
      {/* Maintenance Chatbot */}
      {(isAuthenticated || isDevelopment) && !isAuthPage && <ChatInterface chatbotEngine={chatbotEngine} />}
      {/* Help Center */}
      {(isAuthenticated || isDevelopment) && !isAuthPage && <HelpCenter />}
      {/* Disable AutoLogin in development mode */}
      {!isDevelopment && !isAuthenticated && <AutoLogin />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <OfflineModeProvider>
        <SupabaseAuthProvider>
          <AuthProvider>
            <HelpProvider>
              <TourContextProvider>
                <TourProvider>
                  <AppRoutes />
                </TourProvider>
              </TourContextProvider>
            </HelpProvider>
          </AuthProvider>
        </SupabaseAuthProvider>
      </OfflineModeProvider>
    </ErrorBoundary>
  );
}

export default App;
