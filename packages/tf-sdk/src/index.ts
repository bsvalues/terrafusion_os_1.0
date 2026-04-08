/**
 * @terrafusion/tf-sdk
 *
 * Wire contract types for TerraFusion OS shell ↔ native app integration.
 *
 * BOUNDARY LAW: This is the ONLY package os-shell may import from native app space.
 * os-shell NEVER imports directly from packages/terrabuild, packages/terra-levy, etc.
 * Apps communicate with the shell exclusively via service registry URL + postMessage.
 */

// ─── App Registration ───────────────────────────────────────────────────────

/** A registered native app entry in the service registry. */
export interface AppRegistration {
  /** Canonical module ID matching shell moduleComponents registry (e.g. "costforge") */
  moduleId: string;
  /** TCP port the app dev server listens on */
  port: number;
  /** Base URL the shell uses to iframe the app (e.g. "http://localhost:5002") */
  baseUrl: string;
  /** Human-readable name for display in shell window chrome */
  displayName: string;
  /** Which shell suite this app belongs to (for window grouping) */
  suite: 'forge' | 'atlas' | 'dais' | 'dossier' | 'gpt' | 'os';
}

// ─── Parcel Context ──────────────────────────────────────────────────────────

/** Active parcel context passed from shell to app when a parcel is selected. */
export interface ParcelContext {
  parcelId: string;
  countyId: string;
  assessmentYear: number;
  /** Display label for the shell window title bar */
  label?: string;
}

// ─── Launch Contract ─────────────────────────────────────────────────────────

/**
 * Message the shell posts to the app iframe when launching with context.
 * Apps listen for window.addEventListener('message', ...) with type === 'TF_LAUNCH'.
 */
export interface LaunchMessage {
  type: 'TF_LAUNCH';
  parcel?: ParcelContext;
  /** JWT or session token for the current assessor session */
  authToken?: string;
  /** ISO timestamp of when the shell sent this message */
  sentAt: string;
}

/**
 * Message an app posts back to the shell to signal readiness or request actions.
 * Shell listens for window.addEventListener('message', ...) with TF_APP_* types.
 */
export type AppMessage =
  | { type: 'TF_APP_READY'; moduleId: string }
  | { type: 'TF_APP_TITLE'; title: string }
  | { type: 'TF_APP_ERROR'; error: string };

// ─── Service Registry ────────────────────────────────────────────────────────

/** Shape of backend/service-registry.json for app entries. */
export interface ServiceRegistryEntry {
  Name: string;
  Port: number;
  Url: string;
  Status: 'running' | 'stopped' | 'unknown';
  /** packages/ subdirectory name for this app */
  Package?: string;
}

export interface ServiceRegistry {
  LastUpdated: string;
  Services: Record<string, ServiceRegistryEntry>;
}
