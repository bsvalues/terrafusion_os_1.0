import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';

// Import layouts
import MainLayout from '../layouts/MainLayout';
import MinimalLayout from '../layouts/MinimalLayout';

// Import pages
import Dashboard from '../pages/Dashboard';
import Properties from '../pages/Properties';
import Analysis from '../pages/Analysis';
import Reports from '../pages/Reports';
import Forms from '../pages/Forms';
import Settings from '../pages/Settings';
import Profile from '../pages/Profile';
import Workflow from '../pages/Workflow';

// Auth pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Error pages
import NotFound from '../pages/error/NotFound';

// Private route wrapper
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

/**
 * Application Routes Component
 * Defines the routing structure of the application
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={
        <MinimalLayout>
          <Login />
        </MinimalLayout>
      } />
      
      <Route path="/register" element={
        <MinimalLayout>
          <Register />
        </MinimalLayout>
      } />
      
      <Route path="/forgot-password" element={
        <MinimalLayout>
          <ForgotPassword />
        </MinimalLayout>
      } />
      
      <Route path="/reset-password/:token" element={
        <MinimalLayout>
          <ResetPassword />
        </MinimalLayout>
      } />
      
      {/* Main application routes (protected) */}
      <Route path="/" element={
        <PrivateRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </PrivateRoute>
      } />
      
      <Route path="/properties" element={
        <PrivateRoute>
          <MainLayout>
            <Properties />
          </MainLayout>
        </PrivateRoute>
      } />
      
      <Route path="/analysis" element={
        <PrivateRoute>
          <MainLayout>
            <Analysis />
          </MainLayout>
        </PrivateRoute>
      } />
      
      <Route path="/reports" element={
        <PrivateRoute>
          <MainLayout>
            <Reports />
          </MainLayout>
        </PrivateRoute>
      } />
      
      <Route path="/forms" element={
        <PrivateRoute>
          <MainLayout>
            <Forms />
          </MainLayout>
        </PrivateRoute>
      } />
      
      <Route path="/settings" element={
        <PrivateRoute>
          <MainLayout>
            <Settings />
          </MainLayout>
        </PrivateRoute>
      } />
      
      <Route path="/profile" element={
        <PrivateRoute>
          <MainLayout>
            <Profile />
          </MainLayout>
        </PrivateRoute>
      } />
      
      <Route path="/workflow" element={
        <PrivateRoute>
          <MainLayout>
            <Workflow />
          </MainLayout>
        </PrivateRoute>
      } />
      
      {/* Error routes */}
      <Route path="*" element={
        <MinimalLayout>
          <NotFound />
        </MinimalLayout>
      } />
    </Routes>
  );
};

export default AppRoutes;