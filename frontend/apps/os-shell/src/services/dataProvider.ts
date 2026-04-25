/**
 * TerraFusion OS — DataProvider Contract
 *
 * Three data modes:
 *   live     → actual backend API (Phase 8)
 *   snapshot → promoted Benton snapshot export, local and deterministic
 *   fixtures → synthetic edge-case records for testing uncommon states
 *
 * Source of truth flow:
 *   PACS/operational snapshot → exported dev JSON → DataProvider → store → workbench
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

// Static import — SnapshotDataProvider is the default, always bundled
import { SnapshotDataProvider } from '../data/dev-snapshots/SnapshotDataProvider';
import { LiveDataProvider } from './LiveDataProvider';
import { getToken } from '../auth/authStorage';

// ---------------------------------------------------------------------------
// Data Mode
// ---------------------------------------------------------------------------

export type DataMode = 'live' | 'snapshot' | 'fixtures';

/**
 * Why the provider is in this mode.
 *   'env-default'  — VITE_DATA_MODE unset or 'live'; live is the canonical default
 *   'env-explicit' — VITE_DATA_MODE=snapshot|fixtures + VITE_ALLOW_NON_LIVE_MODE=1
 */
export type DataModeReason = 'env-default' | 'env-explicit';

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

// Partial env snapshot — passed explicitly in tests, read from import.meta.env in prod.
type EnvSnapshot = {
  VITE_DATA_MODE?: string;
  VITE_ALLOW_NON_LIVE_MODE?: string;
};

function readImportMetaEnv(): EnvSnapshot {
  try {
    return {
      VITE_DATA_MODE: (import.meta as unknown as { env: Record<string, string> }).env?.VITE_DATA_MODE,
      VITE_ALLOW_NON_LIVE_MODE: (import.meta as unknown as { env: Record<string, string> }).env?.VITE_ALLOW_NON_LIVE_MODE,
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
 * Fail-fast contract: if VITE_DATA_MODE is 'snapshot' or 'fixtures' but
 * VITE_ALLOW_NON_LIVE_MODE is not '1', this throws immediately to prevent
 * accidental snapshot data in production builds.
 */
export function resolveDataMode(env?: EnvSnapshot): DataModeResolution {
  const { VITE_DATA_MODE: envMode, VITE_ALLOW_NON_LIVE_MODE: allowFlag } =
    env ?? readImportMetaEnv();

  // Unset or explicitly 'live' → canonical default
  if (!envMode || envMode === 'live') {
    return { mode: 'live', reason: 'env-default' };
  }

  // Unknown value → fall back to live (no throw — don't break on typos in CI)
  if (envMode !== 'snapshot' && envMode !== 'fixtures') {
    return { mode: 'live', reason: 'env-default' };
  }

  // Non-live mode: require explicit opt-in flag
  if (allowFlag !== '1') {
    throw new Error(
      `[DataProvider] VITE_DATA_MODE="${envMode}" requires VITE_ALLOW_NON_LIVE_MODE=1. ` +
        `Non-live modes must be explicitly opted into to prevent snapshot data reaching ` +
        `production. Add VITE_ALLOW_NON_LIVE_MODE=1 to your .env.development file.`,
    );
  }

  return { mode: envMode as DataMode, reason: 'env-explicit' };
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
 * Fail-fast: throws if VITE_DATA_MODE=snapshot|fixtures without VITE_ALLOW_NON_LIVE_MODE=1.
 *
 * Note: PACS endpoints (/api/pacs/*, /ops/pacs/*) do NOT require JWT.
 */
export function getDataProvider(): DataProvider {
  if (!_provider) {
    const { mode, reason } = resolveDataMode();

    if (mode === 'snapshot' || mode === 'fixtures') {
      // Synchronous snapshot for both; async fixtures via createDataProvider
      _provider = new SnapshotDataProvider();
    } else {
      // Default: live PACS (works with or without JWT)
      _provider = new LiveDataProvider();
    }

    _diagnostics = { mode, reason, initializedAt: new Date() };
  }
  return _provider;
}

/**
 * Initialize the DataProvider with a specific mode.
 *
 * Mode resolution:
 *   1. Check if live backend is reachable → 'live' (Phase 8)
 *   2. Otherwise → 'snapshot' (Benton promoted snapshot)
 *
 * Pass mode='fixtures' explicitly for edge-case testing.
 */
export async function createDataProvider(
  mode?: DataMode,
): Promise<DataProvider> {
  const resolvedMode = mode ?? 'snapshot';

  if (resolvedMode === 'live') {
    // Phase 8: health check → LiveDataProvider
    // For now, fall through to snapshot
  }

  if (resolvedMode === 'fixtures') {
    const { FixtureDataProvider } = await import('../data/fixtures/FixtureDataProvider');
    _provider = new FixtureDataProvider();
    return _provider;
  }

  // Default: snapshot-backed Benton dev data
  _provider = new SnapshotDataProvider();
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
