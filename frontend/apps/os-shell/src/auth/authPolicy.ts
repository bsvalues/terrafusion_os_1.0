import { getViteEnv } from '@/env/getViteEnv';

function envFlag(value: unknown): boolean {
  return String(value ?? '').toLowerCase() === 'true';
}

export function isDevPreviewMode(): boolean {
  const env = getViteEnv();
  return envFlag(env.VITE_USE_MOCK_DATA) || envFlag(env.VITE_DEV_PREVIEW_BYPASS_AUTH);
}

export function shouldForceLoginRedirect(): boolean {
  return !isDevPreviewMode();
}

