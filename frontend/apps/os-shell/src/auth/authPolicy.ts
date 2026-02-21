import { getViteEnv } from '@/env/getViteEnv';

function envFlag(value: unknown): boolean {
  return String(value ?? '').toLowerCase() === 'true';
}

export function isDevPreviewMode(): boolean {
  const env = getViteEnv();
  const explicitPreviewBypass =
    envFlag(env.VITE_USE_MOCK_DATA) || envFlag(env.VITE_DEV_PREVIEW_BYPASS_AUTH);

  // Local Vite dev server should default to open cockpit mode unless explicitly forced on.
  // This avoids preview/login loops when terminal env flags are missing.
  const viteDevMode =
    envFlag(env.DEV) && String(env.MODE ?? '').toLowerCase() === 'development';
  const forceAuthInDev = envFlag(env.VITE_ENFORCE_AUTH_IN_DEV);

  return explicitPreviewBypass || (viteDevMode && !forceAuthInDev);
}

export function shouldForceLoginRedirect(): boolean {
  return !isDevPreviewMode();
}
