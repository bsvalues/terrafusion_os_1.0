/**
 * TerraFusionPro Web Client - Main App Component
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import context providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppProvider } from './contexts/AppContext';

// Import core components
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';

// Import pages
import UploadPage from './pages/UploadPage';
import SyncPage from './pages/SyncPage';

// Lazy load less frequently accessed components
const PropertyDetail = lazy(() => import('./components/PropertyDetail'));
const ReportDetail = lazy(() => import('./components/ReportDetail'));

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="spinner"></div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Main App Component
const App = () => {
  return (
    <ThemeProvider>
      <Suspense fallback={<div className="global-spinner"></div>}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/upload" element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          } />
          
          <Route path="/sync" element={
            <ProtectedRoute>
              <SyncPage />
            </ProtectedRoute>
          } />
          
          <Route path="/properties/:id" element={
            <ProtectedRoute>
              <PropertyDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/reports/:id" element={
            <ProtectedRoute>
              <ReportDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
};

// App wrapped with providers
const AppWithProviders = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  );
};

export default AppWithProviders;