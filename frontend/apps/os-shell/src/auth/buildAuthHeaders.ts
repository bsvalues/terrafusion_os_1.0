import type { AuthContextValue } from './useAuthContext';

/**
 * buildAuthHeaders — produces request headers from auth context.
 *
 * Rules:
 * - Never emits undefined header values
 * - Safe to call when unauthenticated (returns empty object)
 */
export function buildAuthHeaders(auth: AuthContextValue): Record<string, string> {
  const headers: Record<string, string> = {};

  if (auth.token) {
    headers['Authorization'] = `Bearer ${auth.token}`;
  }
  if (auth.countyId) {
    headers['X-County-Id'] = auth.countyId;
  }
  if (auth.userId) {
    headers['X-User-Id'] = auth.userId;
  }

  return headers;
}
