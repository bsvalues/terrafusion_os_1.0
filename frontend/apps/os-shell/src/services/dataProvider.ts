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

// ---------------------------------------------------------------------------
// Data Mode
// ---------------------------------------------------------------------------

export type DataMode = 'live' | 'snapshot' | 'fixtures';

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

/**
 * Get the active DataProvider.
 * Auto-initializes with SnapshotDataProvider on first access.
 */
export function getDataProvider(): DataProvider {
  if (!_provider) {
    _provider = new SnapshotDataProvider();
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

/** Reset provider (for testing or mode switch). */
export function resetDataProvider(): void {
  _provider = null;
}
