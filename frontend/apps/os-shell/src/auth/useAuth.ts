/**
 * useAuth — hook to consume the auth context.
 *
 * Must be used inside an AuthProvider tree.
 */
import { useContext } from 'react';
// Import from authContextDef (not AuthProvider) to break the circular dependency:
// AuthProvider → useAuthContext → useAuth → AuthProvider
import { AuthContext, type AuthContextValue } from './authContextDef';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
