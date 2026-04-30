// ── Sync State (mirrors County Studio SyncState) ─────────────────────────────
export type AtlasSyncState = 'LIVE' | 'STAGED' | 'SNAPSHOT' | 'DISCONNECTED';

// ── Selection Tool ────────────────────────────────────────────────────────────
export type SelectionTool = 'none' | 'lasso' | 'click' | 'box';

// ── Overlay Types ─────────────────────────────────────────────────────────────
export type OverlayType =
  | 'metric-overlay'
  | 'scenario-delta'
  | 'cohort-shade'
  | 'edge-warnings'
  | 'compare-overlay';

export interface ActiveOverlay {
  id: string;
  type: OverlayType;
  metricKey: string | null;
  values: OverlayValue[];
  styleHints: Record<string, unknown>;
  contractId?: TerraForgeOverlayContractId;
  sourcePopulation?: string;
  trustPosture?: string;
}

export interface OverlayValue {
  parcelId?: string;
  segmentId?: string;
  value: number;
  color?: string;
}

export type TerraForgeOverlayContractId =
  | 'terraforge_operational_health_v1'
  | 'terraforge_statistics_compat_v1'
  | 'terraforge_segment_derivation_v1'
  | 'terraforge_correction_priority_v1';

// ── Selection Events sent to Forge (Channel C) ────────────────────────────────
export interface DrawnGeometrySelection {
  type: 'selection:drawn-geometry';
  studyId: string;
  geometry: unknown;
  parcelCount: number;
  areaEstimate?: number;
}

export interface ParcelIdsSelection {
  type: 'selection:parcel-ids';
  studyId: string;
  parcelIds: string[];
  source: 'click' | 'lasso' | 'box';
}

// ── Projection Events received from Forge (Channel B) ────────────────────────
export interface MetricOverlayProjection {
  type: 'projection:metric-overlay';
  studyId: string;
  metricKey: string;
  values: OverlayValue[];
  styleHints: Record<string, unknown>;
}

export interface ScenarioDeltaProjection {
  type: 'projection:scenario-delta';
  studyId: string;
  scenarioId: string;
  deltas: { parcelId: string; deltaPercent: number }[];
  cohortBbox: [number, number, number, number];
}

export interface CohortShadeProjection {
  type: 'projection:cohort-shade';
  studyId: string;
  cohortId: string;
  parcelIds: string[];
  style: { fillColor: string; opacity: number };
}

export interface EdgeWarningsProjection {
  type: 'projection:edge-warnings';
  studyId: string;
  warnings: { boundaryId: string; severity: 'low' | 'medium' | 'high' }[];
}

export interface ClearProjection {
  type: 'projection:clear';
  studyId: string;
  layerIds?: string[];
}

export type ProjectionEvent =
  | MetricOverlayProjection
  | ScenarioDeltaProjection
  | CohortShadeProjection
  | EdgeWarningsProjection
  | ClearProjection;
