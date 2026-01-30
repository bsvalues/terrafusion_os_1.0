import React, { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated: isLegacyAuthenticated } = useAuth();
  const { isAuthenticated: isSupabaseAuthenticated } = useSupabaseAuth();
  
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Check authentication from either system
  const isAuthenticated = isLegacyAuthenticated || isSupabaseAuthenticated;
  
  // If authenticated or in development mode, render children
  if (isAuthenticated || isDevelopment) {
    return <>{children}</>;
  }
  
  // Otherwise, redirect to login
  return <Redirect to="/auth" />;
};

export default ProtectedRoute;