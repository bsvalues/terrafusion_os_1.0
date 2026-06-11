export type WorkbenchLiveScopeClassification = 'LIVE-NOW' | 'DEFERRED';

export type WorkbenchWeakLane =
  | 'pilot'
  | 'dais-permits'
  | 'forge-income'
  | 'atlas-enrichment-layers'
  | 'clerk-title-chain'
  | 'parcel-specific-audit';

export interface WorkbenchLiveScopeDecision {
  lane: WorkbenchWeakLane;
  intendedProductRole: string;
  intendedBackendContract: string;
  currentRuntimeStatus: 'partial' | 'unavailable' | 'not-live' | 'thin';
  uiAheadOfBackend: boolean;
  blockerType:
    | 'missing projection'
    | 'parcel-dependent data gap'
    | 'stale/stub runtime'
    | 'wrong product expectation'
    | 'not in current scope';
  classification: WorkbenchLiveScopeClassification;
  rationale: string;
  smallestSafeAction: string;
}

export const WORKBENCH_LIVE_SCOPE_DECISIONS: WorkbenchLiveScopeDecision[] = [
  {
    lane: 'pilot',
    intendedProductRole: 'Parcel-scoped governed tool invocation and trace review.',
    intendedBackendContract: '/pilot/tools, /pilot/invoke, /pilot/traces backed by the dedicated Pilot runtime.',
    currentRuntimeStatus: 'not-live',
    uiAheadOfBackend: true,
    blockerType: 'stale/stub runtime',
    classification: 'DEFERRED',
    rationale: 'The dedicated Pilot runtime is offline; the .NET fallback can only disclose not-live status.',
    smallestSafeAction: 'Keep Pilot visibly not-live until the dedicated runtime is started and verified across the parcel matrix.',
  },
  {
    lane: 'dais-permits',
    intendedProductRole: 'Parcel permit history and assessment-impact workflow.',
    intendedBackendContract: '/api/dais/permits?parcelId={parcelId} with governed permit records projected by parcel.',
    currentRuntimeStatus: 'not-live',
    uiAheadOfBackend: true,
    blockerType: 'missing projection',
    classification: 'DEFERRED',
    rationale: 'Permit records are not projected into the governed Dais store.',
    smallestSafeAction: 'Keep permit lane labeled not-live:permit-records-not-projected until a real permit projection exists.',
  },
  {
    lane: 'forge-income',
    intendedProductRole: 'Income approach valuation for parcels with real income data.',
    intendedBackendContract: '/api/forge/{parcelId}/income backed by actual parcel income records or an explicit not-applicable result.',
    currentRuntimeStatus: 'unavailable',
    uiAheadOfBackend: true,
    blockerType: 'parcel-dependent data gap',
    classification: 'DEFERRED',
    rationale: 'The selected real parcel matrix returned no income records; default cap-rate math is not production income support.',
    smallestSafeAction: 'Keep income marked deferred/unavailable unless a parcel has real income records.',
  },
  {
    lane: 'atlas-enrichment-layers',
    intendedProductRole: 'Zoning, flood, tax area, and land-class enrichment over live parcel geometry.',
    intendedBackendContract: '/api/atlas/gis/parcels/{parcelId}/layers with per-layer source and availability.',
    currentRuntimeStatus: 'unavailable',
    uiAheadOfBackend: true,
    blockerType: 'parcel-dependent data gap',
    classification: 'DEFERRED',
    rationale: 'Geometry is live for many parcels, but enrichment layers remain unavailable or partial across the matrix.',
    smallestSafeAction: 'Keep enrichment overlays visibly deferred/unavailable while preserving live geometry.',
  },
  {
    lane: 'clerk-title-chain',
    intendedProductRole: 'Parcel title-chain history and current-owner trace.',
    intendedBackendContract: '/api/clerk/parcels/{parcelId}/title-chain backed by projected title-chain entries.',
    currentRuntimeStatus: 'thin',
    uiAheadOfBackend: true,
    blockerType: 'missing projection',
    classification: 'DEFERRED',
    rationale: 'Recording summary is live, but title-chain records are not projected for the sampled parcels.',
    smallestSafeAction: 'Keep title-chain marked not-live/thin and reject fake parcels until title-chain projection exists.',
  },
  {
    lane: 'parcel-specific-audit',
    intendedProductRole: 'Parcel-specific audit findings, roll compliance, and cross-office reconciliation.',
    intendedBackendContract: 'Parcel-aware audit endpoints or tools with parcel-specific findings and evidence.',
    currentRuntimeStatus: 'partial',
    uiAheadOfBackend: true,
    blockerType: 'wrong product expectation',
    classification: 'DEFERRED',
    rationale: 'Current audit contracts are county/static controls with parcel context, not true parcel-specific audit proof.',
    smallestSafeAction: 'Keep Audit labeled as county controls with parcel context until parcel-specific audit backend exists.',
  },
];

export function getWorkbenchLiveScopeDecision(lane: WorkbenchWeakLane): WorkbenchLiveScopeDecision {
  const decision = WORKBENCH_LIVE_SCOPE_DECISIONS.find((item) => item.lane === lane);
  if (!decision) {
    throw new Error(`Unknown Workbench live-scope lane: ${lane}`);
  }
  return decision;
}
