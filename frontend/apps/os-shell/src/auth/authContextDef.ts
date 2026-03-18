/**
 * authContextDef — the raw React context object for TerraFusion auth.
 *
 * Extracted to a standalone file to break the circular dependency between
 * AuthProvider.tsx (which defines the provider) and useAuthContext.ts
 * (which needs to read the context via useContext without calling useAuth).
 *
 * Import AuthContext from here when you need useContext(AuthContext) directly.
 * AuthProvider.tsx re-exports AuthContext for backward compatibility.
 */

import { createContext } from 'react';

export interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: (reason?: string) => void;
}

/**
 * The base React context. Default is null (no provider mounted).
 * AuthProvider.tsx provides a value; useAuth.ts throws when null.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);
