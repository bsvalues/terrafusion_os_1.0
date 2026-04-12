/**
 * auth-context.tsx — OS-native auth shim.
 *
 * CostForge is a TerraFusion OS module. Auth is owned by the OS shell.
 * This file exists only to keep the `useAuth()` interface stable for the
 * many legacy components that still call it. All data comes from OsContext
 * (which is populated by the TF_LAUNCH postMessage from the OS AppFrame).
 *
 * No API calls. No mutations. No sessions. No Express routes.
 * Login / logout / register are no-ops — the OS shell owns those flows.
 */
import { AuthErrorBoundary } from '@/components/auth/auth-error-boundary';
import { useOsContext } from '@/contexts/OsContext';
import { createContext, ReactNode, useContext } from 'react';

// ---------------------------------------------------------------------------
// Types (kept compatible with legacy consumers)
// ---------------------------------------------------------------------------

type AuthMethod = 'county-network' | 'local';

export interface User {
  id: number;
  username: string;
  name: string | null;
  role: string;
  is_active: boolean;
}

export interface RegisterData {
  username: string;
  password: string;
  name?: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<User>;
  error: Error | null;
  authMethod: AuthMethod;
  setAuthMethod: (method: AuthMethod) => void;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const AuthContext = createContext<AuthContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider — reads OS identity, exposes legacy interface
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const { osUser, isOsAuthenticated } = useOsContext();

  const user: User | null = osUser
    ? { id: 0, username: osUser.username, name: osUser.username, role: osUser.role, is_active: true }
    : null;

  const noop = async (..._args: any[]) => { /* OS owns auth */ };

  const value: AuthContextType = {
    user,
    isLoading: false,
    isAuthenticated: isOsAuthenticated || import.meta.env.DEV,
    login: noop as any,
    logout: noop,
    register: noop as any,
    error: null,
    authMethod: 'county-network',
    setAuthMethod: noop,
    loginMutation: { isPending: false, mutateAsync: noop },
    logoutMutation: { isPending: false, mutateAsync: noop },
    registerMutation: { isPending: false, mutateAsync: noop },
  };

  return (
    <AuthErrorBoundary>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </AuthErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    // Fallback for components rendered outside AuthProvider (e.g. tests)
    return {
      user: null,
      isLoading: false,
      isAuthenticated: import.meta.env.DEV,
      login: async () => null as any,
      logout: async () => {},
      register: async () => null as any,
      error: null,
      authMethod: 'county-network',
      setAuthMethod: () => {},
      loginMutation: { isPending: false, mutateAsync: async () => null },
      logoutMutation: { isPending: false, mutateAsync: async () => {} },
      registerMutation: { isPending: false, mutateAsync: async () => null },
    };
  }
  return context;
};
