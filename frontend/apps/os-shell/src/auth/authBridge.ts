/**
 * authBridge — non-React bridge for the axios interceptor.
 *
 * Because api.ts is instantiated at module scope (before any React tree),
 * it can't call useAuth(). Instead it calls authBridge.logout() which
 * triggers a callback registered by AuthProvider at mount time.
 *
 * The bridge also guards against duplicate logouts (e.g., multiple
 * concurrent 401 responses all trying to redirect simultaneously).
 */

type LogoutHandler = (reason: string) => void;

let _logoutHandler: LogoutHandler | null = null;
let _logoutInFlight = false;

/**
 * Called by AuthProvider on mount to register its logout function.
 */
export function registerLogoutHandler(handler: LogoutHandler): void {
  _logoutHandler = handler;
}

/**
 * Called by AuthProvider on unmount.
 */
export function unregisterLogoutHandler(): void {
  _logoutHandler = null;
}

/**
 * Called by the axios 401 interceptor. Ensures at most one logout
 * per burst of 401s.
 */
export function logout(reason: string): void {
  if (_logoutInFlight) return;
  _logoutInFlight = true;

  if (_logoutHandler) {
    _logoutHandler(reason);
  }

  // Reset the in-flight guard after a tick so that a *new* session
  // (after re-login) can still be logged out if needed.
  setTimeout(() => {
    _logoutInFlight = false;
  }, 0);
}

/**
 * Read-only flag for tests and interceptor guards.
 */
export function isLogoutInFlight(): boolean {
  return _logoutInFlight;
}
