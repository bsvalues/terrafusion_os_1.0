/**
 * authStorage — single point of truth for the auth token key.
 *
 * All token persistence goes through this module.
 * No other file should reference localStorage('authToken') directly
 * (legacy consumers still do — they'll be migrated in Phase 19).
 */

const AUTH_TOKEN_KEY = 'authToken' as const;

export function getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
