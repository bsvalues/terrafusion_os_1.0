/**
 * Dev-only auth token singleton.
 * In development, fetches a short-lived JWT from GET /api/auth/dev-token
 * (AllowAnonymous on the .NET API) and caches it for all subsequent requests.
 *
 * In production this module is a no-op — getDevToken() returns null.
 */

let cachedToken: string | null = null;
let fetchPromise: Promise<string | null> | null = null;

export async function getDevToken(): Promise<string | null> {
  if (!import.meta.env.DEV) return null;
  if (cachedToken) return cachedToken;

  // Deduplicate concurrent calls during the initial fetch
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch('/api/auth/dev-token');
      if (!res.ok) return null;
      const data = await res.json();
      cachedToken = data.token ?? null;
      return cachedToken;
    } catch {
      return null;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}
