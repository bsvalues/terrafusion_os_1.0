/**
 * API base-URL utility.
 *
 * Phase 1 of the v1 honest-surface pass: decouple terra-pilt client fetches
 * from a hardcoded same-origin assumption so they can be retargeted at the
 * main TerraFusion.API backend (port 5000, real PiltController.cs) without
 * shotgun-editing every call site.
 *
 * Precedence:
 *   1. `VITE_PILT_API_URL` — absolute URL for the real PILT backend
 *   2. `VITE_MAIN_API_URL` — absolute URL for the main TerraFusion.API
 *   3. Same-origin (empty string) — legacy terra-pilt Express on :5009
 *
 * Endpoints already matched by the main backend (PiltController.cs):
 *   - GET /api/pilt/districts
 *   - GET /api/pilt/status
 *   - GET /api/pilt/receipts
 *   - POST /api/pilt/receipts
 *   - POST /api/pilt/calculate/{receiptId}
 *   - POST /api/pilt/approve/{calculationId}
 *   - GET /api/pilt/reports/{year}
 *
 * Endpoints NOT YET present on main backend (stay same-origin for now):
 *   - /api/pilt/history
 *   - /api/pilt/distribution
 *   - /api/pilt/generate-report (POST)
 *   - /api/auth/*
 *   - /api/etl/*
 *   - /api/reports/*
 */

type ImportMetaEnv = {
  readonly VITE_PILT_API_URL?: string;
  readonly VITE_MAIN_API_URL?: string;
};

function readEnv(): ImportMetaEnv {
  try {
    // Vite replaces this at build time; guard for non-Vite test runners.
    return (import.meta as unknown as { env?: ImportMetaEnv }).env ?? {};
  } catch {
    return {};
  }
}

function normalizeBase(base: string): string {
  if (!base) return '';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

/**
 * Returns the configured PILT API base URL (absolute) or '' for same-origin.
 */
export function piltApiBase(): string {
  const env = readEnv();
  return normalizeBase(env.VITE_PILT_API_URL ?? env.VITE_MAIN_API_URL ?? '');
}

/**
 * Build a PILT API URL. Pass paths beginning with '/'.
 * Use this for endpoints present on the real main backend (PiltController.cs).
 */
export function piltApiUrl(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`piltApiUrl expects a path starting with '/', got: ${path}`);
  }
  return `${piltApiBase()}${path}`;
}
