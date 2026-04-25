/**
 * TerraFusion OS — DataProvider Contract
 *
 * Live backend API only. Offline providers are not selectable through runtime
 * configuration because operational workbench surfaces must use backend truth or
 * render explicit unavailable states.
 */

import type {
  Property,
  Assessment,
  ValuationRecord,
  TaxDistrict,
  LevyCertification,
  TaxStatement,
  Appeal,
  HearingEvent,
  GISLayer,
  ParcelDocument,
  RecordingEntry,
  AuditEntry,
  OperationTrace,
  SystemHealthStatus,
  CountyAggregateStats,
  AggregateProperty,
  PropertySearchResult,
  SearchQuery,
  SearchResults,
  CalendarEvent,
} from '../types/domain';

import { LiveDataProvider } from './LiveDataProvider';

// ---------------------------------------------------------------------------
// Data Mode
// ---------------------------------------------------------------------------

export type DataMode = 'live';

/**
 * Why the provider is in this mode.
 *   'env-default'  — VITE_DATA_MODE unset or 'live'; live is the canonical default
 */
export type DataModeReason = 'env-default';

export interface DataModeResolution {
  mode: DataMode;
  reason: DataModeReason;
}

export interface DataProviderDiagnostics {
  mode: DataMode;
  reason: DataModeReason;
  /** When the singleton was first constructed. Null before first access. */
  initializedAt: Date | null;
}

// Partial env shape — passed explicitly in tests, read from import.meta.env in prod.
type EnvShape = {
  VITE_DATA_MODE?: string;
  VITE_ALLOW_NON_LIVE_MODE?: string;
};

function readImportMetaEnv(): EnvShape {
  try {
    const env = (import.meta as unknown as { env: Record<string, string> }).env ?? {};
    return {
      VITE_DATA_MODE: env.VITE_DATA_MODE,
      VITE_ALLOW_NON_LIVE_MODE: env.VITE_ALLOW_NON_LIVE_MODE,
    };
  } catch {
    return {};
  }
}

/**
 * Resolve which data mode to use and why.
 *
 * Pass an explicit `env` object in tests so you can exercise fail-fast logic
 * without touching real env vars.
 *
 * Fail-fast contract: any non-live VITE_DATA_MODE throws immediately to prevent
 * offline providers from reaching operational builds.
 */
export function resolveDataMode(env?: EnvShape): DataModeResolution {
  const resolvedEnv = env ?? readImportMetaEnv();
  const envMode = resolvedEnv.VITE_DATA_MODE;
  const allowNonLive = resolvedEnv.VITE_ALLOW_NON_LIVE_MODE === '1';

  // Unset or explicitly 'live' → canonical default
  if (!envMode || envMode === 'live') {
    return { mode: 'live', reason: 'env-default' };
  }

  // 'snapshot' and 'fixtures' are gated behind VITE_ALLOW_NON_LIVE_MODE=1.
  // Without the gate they are a fail-fast misconfiguration; with the gate
  // they're an explicit dev/test choice. Any other value silently degrades
  // to live so a typo can't take down a live build.
  if (envMode === 'snapshot') {
    if (!allowNonLive) {
      throw new Error(
        '[DataProvider] VITE_DATA_MODE="snapshot" requires VITE_ALLOW_NON_LIVE_MODE=1',
      );
    }
    return { mode: 'snapshot', reason: 'env-explicit' };
  }

  if (envMode === 'fixtures') {
    if (!allowNonLive) {
      throw new Error(
        '[DataProvider] VITE_DATA_MODE="fixtures" requires VITE_ALLOW_NON_LIVE_MODE=1',
      );
    }
    return { mode: 'fixtures', reason: 'env-explicit' };
  }

  // Unknown VITE_DATA_MODE values silently fall back to live (typo protection).
  return { mode: 'live', reason: 'env-default' };
}

// ---------------------------------------------------------------------------
// Provider Interface
// ---------------------------------------------------------------------------

export interface DataProvider {
  /** Current data mode */
  readonly mode: DataMode;

  // -- Search & Lookup -------------------------------------------------------
  search(query: SearchQuery): Promise<SearchResults<PropertySearchResult>>;
  getParcel(parcelId: string): Promise<Property | null>;

  // -- Assessment ------------------------------------------------------------
  getAssessments(parcelId: string): Promise<Assessment[]>;
  getValuationRecord(parcelId: string, taxYear: number): Promise<ValuationRecord | null>;

  // -- Tax & Levy ------------------------------------------------------------
  getLevyDistricts(): Promise<TaxDistrict[]>;
  getLevyCertifications(taxYear: number): Promise<LevyCertification[]>;
  getTaxStatements(parcelId: string): Promise<TaxStatement[]>;

  // -- Appeals ---------------------------------------------------------------
  getAppeals(parcelId: string): Promise<Appeal[]>;
  getHearings(parcelId?: string): Promise<HearingEvent[]>;

  // -- GIS / Atlas -----------------------------------------------------------
  getLayers(): Promise<GISLayer[]>;

  // -- Documents / Dossier ---------------------------------------------------
  getDocuments(parcelId: string): Promise<ParcelDocument[]>;

  // -- Clerk / Recording -----------------------------------------------------
  getRecordingHistory(parcelId: string): Promise<RecordingEntry[]>;

  // -- Audit -----------------------------------------------------------------
  getAuditTrail(parcelId: string): Promise<AuditEntry[]>;

  // -- Operations / Pilot ----------------------------------------------------
  getRecentOperations(parcelId?: string): Promise<OperationTrace[]>;
  getSystemHealth(): Promise<SystemHealthStatus>;

  // -- Aggregates / Dashboards -----------------------------------------------
  getCountyStats(): Promise<CountyAggregateStats>;
  getAggregateProperties(options?: {
    page?: number;
    pageSize?: number;
    city?: string;
  }): Promise<SearchResults<AggregateProperty>>;

  // -- Calendar --------------------------------------------------------------
  getCalendarEvents(startDate?: string, endDate?: string): Promise<CalendarEvent[]>;
}

// ---------------------------------------------------------------------------
// Provider Singleton
// ---------------------------------------------------------------------------

let _provider: DataProvider | null = null;
let _diagnostics: DataProviderDiagnostics | null = null;

/**
 * Returns diagnostics for the current provider singleton.
 *
 * Safe to call before the first `getDataProvider()` — returns null initializedAt
 * until the singleton is constructed.
 */
export function getDataProviderDiagnostics(): DataProviderDiagnostics {
  if (_diagnostics) return _diagnostics;
  // Uninitialized — resolve mode without constructing provider (no side effects)
  try {
    const { mode, reason } = resolveDataMode();
    return { mode, reason, initializedAt: null };
  } catch {
    return { mode: 'live', reason: 'env-default', initializedAt: null };
  }
}

/**
 * Get the active DataProvider.
 *
 * Mode is resolved once via resolveDataMode() and cached for the session.
 * Fail-fast: throws if VITE_DATA_MODE is anything except live.
 *
 * Note: county assessment endpoints are backend-governed and may be available without JWT locally.
 */
export function getDataProvider(): DataProvider {
  if (!_provider) {
    const { mode, reason } = resolveDataMode();

    _provider = new LiveDataProvider();

    _diagnostics = { mode, reason, initializedAt: new Date() };
  }
  return _provider;
}

/**
 * Initialize the DataProvider with a specific mode.
 *
 * Mode resolution:
 *   1. Use explicit mode when provided
 *   2. Otherwise use the governed environment resolver
 *
 */
export async function createDataProvider(
  mode?: DataMode,
): Promise<DataProvider> {
  const resolvedMode = mode ?? resolveDataMode().mode;
  if (resolvedMode !== 'live') {
    throw new Error('Live backend mode is required.');
  }
  _provider = new LiveDataProvider();
  return _provider;
}

/** Reset provider and diagnostics (for testing, mode switch, or auth change). */
export function resetDataProvider(): void {
  _provider = null;
  _diagnostics = null;
}

/** Called after auth token changes to switch to live provider if available. */
export function refreshDataProvider(): void {
  _provider = null;
  // Re-initialize on next access
}
