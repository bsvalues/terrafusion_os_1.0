/**
 * AuthProvider — reactive auth boundary for TerraFusion OS.
 *
 * Provides: token, isAuthenticated, login(), logout()
 * Initializes from localStorage via authStorage.
 * Registers a bridge so non-React code (axios interceptor) can trigger logout.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken, setToken as persistToken, clearToken } from './authStorage';
import { registerLogoutHandler, unregisterLogoutHandler } from './authBridge';
import { useAuth } from './useAuth';
import { isDevPreviewMode, shouldForceLoginRedirect } from './authPolicy';
import { decodeAuthClaims } from '@/auth/useAuthContext';
import { initTraceContext } from '@/services/terraTrace';
// AuthContext and AuthContextValue live in authContextDef.ts to break the circular
// import between this file and useAuthContext.ts.
// Re-exported here for backward compatibility with existing importers.
import { AuthContext } from './authContextDef';
export { AuthContext } from './authContextDef';
export type { AuthContextValue } from './authContextDef';

const DEV_PREVIEW_TOKEN = 'dev-preview-token';
const DEV_SESSION_KEY = 'tf.session.dev';

function seedDevPreviewSession(): void {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem(DEV_SESSION_KEY)) return;

  localStorage.setItem(
    DEV_SESSION_KEY,
    JSON.stringify({
      userId: 'dev-user',
      countyId: '12345',
      role: 'dev',
      mode: 'pilot',
    })
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => {
    const existing = getToken();
    if (existing) return existing;

    if (isDevPreviewMode()) {
      persistToken(DEV_PREVIEW_TOKEN);
      seedDevPreviewSession();
      return DEV_PREVIEW_TOKEN;
    }

    return null;
  });

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

  // Wave 1: sync TerraTrace session context whenever token changes.
  // Uses shared decodeAuthClaims() — single JWT decode source, no duplication.
  useEffect(() => {
    if (!token) { initTraceContext('', ''); return; }
    const claims = decodeAuthClaims(token);
    initTraceContext(claims.countyId ?? '', claims.userId ?? '');
  }, [token]);

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

  if (!shouldForceLoginRedirect()) {
    return <>{children}</>;
  }

  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to='/login' replace />;
  }

  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to='/canon' replace />;
  }

  return <>{children}</>;
}
