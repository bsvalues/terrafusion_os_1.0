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
import { resetDataProvider } from '@/services/dataProvider';
// AuthContext and AuthContextValue live in authContextDef.ts to break the circular
// import between this file and useAuthContext.ts.
// Re-exported here for backward compatibility with existing importers.
import { AuthContext } from './authContextDef';
export { AuthContext } from './authContextDef';
export type { AuthContextValue } from './authContextDef';

const DEV_SESSION_KEY = 'tf.session.dev';

function seedDevPreviewSession(): void {
  if (typeof localStorage === 'undefined') return;
  if (localStorage.getItem(DEV_SESSION_KEY)) return;

  localStorage.setItem(
    DEV_SESSION_KEY,
    JSON.stringify({
      userId: 'dev-user',
      countyId: '19190019-1919-1919-1919-191919191919',
      role: 'dev',
      mode: 'pilot',
    })
  );
}

/** Fetch a real JWT from the backend dev-token endpoint. */
async function fetchDevToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/dev-token');
    if (!res.ok) return null;
    const data = await res.json();
    return data.token ?? null;
  } catch {
    return null;
  }
}

/** Return true if token is missing or its exp claim is within 60s of expiry. */
function isTokenExpiredOrMissing(token: string | null): boolean {
  if (!token || token === 'dev-preview-token') return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = typeof payload.exp === 'number' ? payload.exp : 0;
    return Date.now() / 1000 >= exp - 60;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());

  // In dev preview mode, automatically obtain a real JWT from the backend.
  // Re-run whenever the stored token changes so an expired token is replaced.
  useEffect(() => {
    if (!isDevPreviewMode()) return;
    if (!isTokenExpiredOrMissing(token)) return; // token is present and not expired

    let cancelled = false;
    fetchDevToken().then((jwt) => {
      if (cancelled || !jwt) return;
      persistToken(jwt);
      setTokenState(jwt);
      seedDevPreviewSession();
    });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  // Also reset DataProvider so it picks up live mode with the new JWT.
  useEffect(() => {
    resetDataProvider();
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
