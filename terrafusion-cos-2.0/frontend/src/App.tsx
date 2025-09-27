/**
 * TerraFusion cOS 2.0 - Main Application
 * MIT PhD Systems Design Engineer Standards
 * "Government. Transcended."
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

// Layout components
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AISwarmPage from './pages/AISwarmPage';
import CostForgePage from './pages/CostForgePage';
import SyncPage from './pages/SyncPage';
import FlowPage from './pages/FlowPage';
import VendorPortal from './pages/VendorPortal';
import IDEPage from './pages/IDEPage';
import ReportBuilderPage from './pages/ReportBuilderPage';
import AnalyticsPage from './pages/AnalyticsPage';

// Global styles
import '../brand/terrafusion-brand.css';
import './styles/app.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="tf-app">
          {/* Background gradient animation */}
          <motion.div
            className="tf-bg-gradient"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, #0099ff33 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, #00ffee33 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, #00ffaa33 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, #0099ff33 0%, transparent 50%)',
              ],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          <Routes>
            {/* Public routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/vendor-portal" element={<VendorPortal />} />
            </Route>

            {/* Dashboard routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/ai-swarm" element={<AISwarmPage />} />
              <Route path="/costforge" element={<CostForgePage />} />
              <Route path="/sync" element={<SyncPage />} />
              <Route path="/flow" element={<FlowPage />} />
              <Route path="/ide" element={<IDEPage />} />
              <Route path="/reports" element={<ReportBuilderPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Route>
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1f3a',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                backdropFilter: 'blur(12px)',
              },
              success: {
                iconTheme: {
                  primary: '#00ffaa',
                  secondary: '#0b1020',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff4444',
                  secondary: '#0b1020',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
