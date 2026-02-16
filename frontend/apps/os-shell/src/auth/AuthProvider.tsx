/**
 * AuthProvider — reactive auth boundary for TerraFusion OS.
 *
 * Provides: token, isAuthenticated, login(), logout()
 * Initializes from localStorage via authStorage.
 * Registers a bridge so non-React code (axios interceptor) can trigger logout.
 */
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken, setToken as persistToken, clearToken } from './authStorage';
import { registerLogoutHandler, unregisterLogoutHandler } from './authBridge';
import { useAuth } from './useAuth';

export interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: (reason?: string) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());

  const login = useCallback((newToken: string) => {
    persistToken(newToken);
    setTokenState(newToken);
  }, []);

  const logout = useCallback((_reason?: string) => {
    clearToken();
    setTokenState(null);
  }, []);

  // Register bridge so axios 401 handler can call logout without React
  useEffect(() => {
    registerLogoutHandler((reason) => logout(reason));
    return () => unregisterLogoutHandler();
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: token !== null,
      login,
      logout,
    }),
    [token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * AuthGuard — minimal route guard.
 *
 * If not authenticated and not already on /login, redirect to /login.
 * Wrap protected content with this component.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to='/login' replace />;
  }

  return <>{children}</>;
}
