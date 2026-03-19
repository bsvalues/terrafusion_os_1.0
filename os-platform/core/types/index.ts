/**
 * TerraFusion OS Core Types
 *
 * Shared type definitions for TerraPilot, TerraTrace, and runtime enforcement.
 * These types mirror the manifest schema and CI gate contracts.
 *
 * Reference: tools/registry/terrapilot.tools.schema.json
 */

import type { CommandGovernanceMeta } from './commandGovernance.js';

// ============================================================================
// Suite & Risk Enums (matches manifest schema)
// ============================================================================

export type Suite = 'forge' | 'atlas' | 'dais' | 'dossier' | 'os' | 'pilot' | 'gpt' | 'clerk' | 'treasury' | 'audit';

export type Risk = 'read_only' | 'write_low' | 'write_high' | 'irreversible';

export type Mode = 'pilot' | 'muse';

export type TouchTarget =
  | 'parcel'
  | 'dossier'
  | 'workflow'
  | 'notice'
  | 'trace'
  | 'model'
  | 'map'
  | 'canon'
  | 'canon_file'
  | 'compliance'
  | 'exemption'
  | 'levy'
  | 'recording'
  | 'tax';

export type PiiHandling = 'none' | 'sanitize' | 'payload_ref';

export type TracePolicy = 'none' | 'summary_only' | 'payload_ref';

export type PayloadStore = 'dossier' | 'secure-blob' | 'case-store' | 'clerk' | 'treasury' | 'audit';

// ============================================================================
// Office Registry Types (R3.1)
// ============================================================================

export type OfficeId = 'assessor' | 'clerk' | 'treasurer' | 'auditor' | 'recorder';

export type OfficeStatus = 'active' | 'reserved' | 'planned';

export interface OfficeDefinition {
  /** Unique office identifier */
  id: OfficeId;
  /** Human-readable display name */
  displayName: string;
  /** Suite IDs mapped to this office */
  suiteIds: Suite[];
  /** Workbench tab IDs contributed by this office */
  tabIds: string[];
  /** Office activation status */
  status: OfficeStatus;
  /** Governed tools available to this office */
  toolAllowlist: string[];
}

export interface OfficeRegistry {
  /** All known offices */
  offices: OfficeDefinition[];
  /** Get office by ID */
  getOffice(id: OfficeId): OfficeDefinition | undefined;
  /** Get active offices */
  getActiveOffices(): OfficeDefinition[];
  /** Get tools allowed for an office */
  getToolsForOffice(id: OfficeId): string[];
}

// ============================================================================
// Tool Manifest Types
// ============================================================================

export interface Tool {
  toolId: string;
  displayName?: string;
  suite: Suite;
  mode?: Mode;
  risk: Risk;
  writeLane: Suite | null;
  touches?: TouchTarget[];
  description?: string;
  endpoints?: string[];
  uiSurfaces?: string[];
  requiresConfirmation?: boolean;
  reasonCodeRequired?: boolean;
  reasonCodes?: string[];
  requiresSupervisorApproval?: boolean;
  supervisorRoles?: string[];
  crossSuiteReads?: Suite[];
  piiHandling?: PiiHandling;
  tracePolicy?: TracePolicy;
  payloadStore?: PayloadStore | null;
  /** Office scope — which office owns this tool (R3.1) */
  officeScope?: OfficeId;
  /** Optional command governance metadata for preflight policy checks. */
  governance?: CommandGovernanceMeta;
  /** Optional JSON-schema-like parameter contract used by UI/runtime validation. */
  paramsSchema?: Record<string, unknown>;
}

export interface ToolManifest {
  $schema?: string;
  version: string;
  description?: string;
  lastUpdated?: string;
  tools: Tool[];
}

// ============================================================================
// Tool Execution Types
// ============================================================================

export interface SupervisorApproval {
  approvedBy: string;
  approvedAt: string;
  role: string;
}

export interface ToolExecutionContext {
  /** County ID for isolation */
  countyId: string;
  /** Executing user ID */
  userId: string;
  /** User's roles for authorization */
  roles: string[];
  /** Pilot or Muse mode */
  mode: Mode;
  /** Target parcel ID (if applicable) */
  parcelId?: string;
  /** Target dossier ID (if applicable) */
  dossierId?: string;
  /** Active office context (R3.1) */
  officeId?: OfficeId;
  /** User confirmed the action */
  confirmation?: boolean;
  /** Reason code for audit trail */
  reasonCode?: string;
  /** Supervisor approval for irreversible actions */
  supervisorApproval?: SupervisorApproval;
}

export interface ToolExecutionInput<TParams = unknown> {
  toolId: string;
  params: TParams;
  context: ToolExecutionContext;
}

export interface ToolExecutionSuccess<TResult = unknown> {
  ok: true;
  result: TResult;
  correlationId: string;
  traceEventId?: string;
}

export interface ToolExecutionFailure {
  ok: false;
  error: string;
  errorCode: string;
  correlationId: string;
  traceEventId?: string;
}

export type ToolExecutionResult<TResult = unknown> =
  | ToolExecutionSuccess<TResult>
  | ToolExecutionFailure;

// ============================================================================
// Trace Event Types
// ============================================================================

export type TraceEventType =
  | 'tool_invoked'
  | 'tool_completed'
  | 'tool_failed'
  | 'value_changed'
  | 'status_changed'
  | 'document_generated'
  | 'approval_requested'
  | 'approval_granted'
  | 'approval_denied'
  | 'redaction_requested'
  | 'redaction_ticket_created'
  | 'trace_accessed'
  | 'permission_denied';

export interface TraceEventInput {
  /** Event type */
  type: TraceEventType;
  /** Tool that generated this event */
  toolId: string;
  /** Correlation ID for invoke/result linkage */
  correlationId: string;
  /** Execution context */
  context: ToolExecutionContext;
  /** Office that generated this event (R3.1) */
  officeId?: OfficeId;
  /** Sanitized summary (always present) */
  summary: string;
  /** Reference to secure payload storage (if tracePolicy is payload_ref) */
  payloadRef?: string;
  /** Payload store location */
  payloadStore?: PayloadStore;
  /** Fields that were redacted */
  redactedFields?: string[];
  /** Error code for tool_failed events */
  errorCode?: string;
  /** Component that emitted the event (ToolRunner, ToolRegistry, Handler) */
  component?: string;
  /** Stack trace for handler errors (tool_failed events only) */
  stackTrace?: string;
}

export interface TraceEvent extends TraceEventInput {
  /** Unique event ID */
  eventId: string;
  /** Timestamp of event creation */
  timestamp: string;
  /** Schema version for forward compatibility */
  schemaVersion: string;
  /** SHA-256 of the previous event (null for genesis). Enables tamper-evident chain verification. */
  previousHash?: string | null;
}

export interface TraceQueryOptions {
  parcelId?: string;
  dossierId?: string;
  toolId?: string;
  correlationId?: string;
  type?: TraceEventType;
  /** ISO 8601 lower bound (inclusive). Events with timestamp >= from. */
  from?: string;
  /** ISO 8601 upper bound (inclusive). Events with timestamp <= to. */
  to?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Enforcement Error Types
// ============================================================================

export class ToolEnforcementError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly toolId: string,
    public readonly gate: 'write_lane' | 'risk_policy' | 'pii_policy'
  ) {
    super(message);
    this.name = 'ToolEnforcementError';
  }
}

export class TraceEnforcementError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly toolId: string
  ) {
    super(message);
    this.name = 'TraceEnforcementError';
  }
}

// ============================================================================
// Shell Lifecycle Event Types (Lane B: OS Shell Window System)
// ============================================================================

export type ShellEventType =
  | 'window_opened'
  | 'window_closed'
  | 'window_focused'
  | 'window_minimized'
  | 'window_restored'
  | 'window_maximized'
  | 'window_snapped'
  | 'shell_mode_changed'
  | 'spawn_rejected'
  | 'spawn_routed_to_workbench';

export interface ShellEvent {
  /** Event type */
  type: ShellEventType;
  /** Window ID (null for shell-level events) */
  windowId: string | null;
  /** Module that owns the window */
  moduleId: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Additional context */
  detail?: Record<string, unknown>;
}

// ============================================================================
// Forge Statistics Contract Types (Tranche 1A: Statistics Studio)
// ============================================================================

/** Outlier detection method for ratio study computation */
export type OutlierMethod = 'iqr' | 'trim' | 'none';

/** Parameters for an on-demand ratio study computation */
export interface RatioStudyParams {
  taxYear: number;
  salesWindowMonths: number;
  neighborhood?: string;
  propertyType?: string;
  outlierMethod: OutlierMethod;
}

/** Tier median ratios by value quartile */
export interface TierMedians {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
}

/** Complete ratio study result — IAAO-standard statistics */
export interface RatioStudyResult {
  medianRatio: number;
  meanRatio: number;
  weightedMeanRatio: number;
  cod: number;
  prd: number;
  prb: number;
  cov: number;
  sampleSize: number;
  outlierCount: number;
  tierMedians: TierMedians;
  tierSlope: number;
  iaaoCompliant: boolean;
  complianceNotes: string[];
  computedAt: string;
  params: RatioStudyParams;
}

/** IAAO qualification metrics for a ratio study */
export interface QualificationMetrics {
  cod: number;
  prd: number;
  prb: number;
  medianRatio: number;
  tierSlope: number;
  sampleSize: number;
  passCount: number;
  qualified: boolean;
}

/** Strata-level ratio study result */
export interface StrataResult {
  strataId: string;
  strataLabel: string;
  neighborhood: string;
  propertyType: string;
  sampleSize: number;
  medianRatio: number;
  cod: number;
  prd: number;
  qualified: boolean;
}

/** Flagged parcel from outlier detection */
export interface OutlierRecord {
  parcelId: string;
  address: string;
  neighborhood: string;
  salePrice: number;
  assessedValue: number;
  ratio: number;
  ratioDeviation: number;
  outlierMethod: 'iqr' | 'trim';
  flagReason: string;
  confidence: number;
  reviewStatus: 'pending' | 'confirmed' | 'dismissed';
}

/** Side-by-side model comparison result */
export interface ModelComparisonResult {
  modelA: { label: string; params: RatioStudyParams; result: RatioStudyResult };
  modelB: { label: string; params: RatioStudyParams; result: RatioStudyResult };
  deltas: { cod: number; prd: number; prb: number; medianRatio: number; sampleSize: number };
  improvedMetrics: string[];
  degradedMetrics: string[];
}

/** IAAO residential compliance thresholds */
export const IAAO_THRESHOLDS = {
  cod: { max: 15.0 },
  prd: { min: 0.98, max: 1.03 },
  prb: { absMax: 0.05 },
  medianRatio: { min: 0.90, max: 1.10 },
  tierSlope: { absMax: 0.05 },
} as const;

// ── Forge > Reconciliation (Tranche 1B) ────────────────────────

/** Valuation approach identifier */
export type ApproachType = 'cost' | 'sales' | 'income';

/** A single approach indication with its weight */
export interface ApproachIndication {
  approach: ApproachType;
  indicatedValue: number;
  /** 0–100 weight assigned by appraiser or model */
  weight: number;
  /** Optional confidence score 0–1 */
  confidence?: number;
  /** Free-form note or AI-generated justification */
  note?: string;
}

/** Method used to derive the reconciled value */
export type ReconciliationMethod =
  | 'weighted_average'
  | 'appraiser_judgment'
  | 'single_approach'
  | 'ai_assisted';

/** Full reconciliation result — parcel-scoped, write-owner = Forge */
export interface ReconciliationResult {
  parcelId: string;
  taxYear: number;
  approaches: ApproachIndication[];
  reconciledValue: number;
  method: ReconciliationMethod;
  effectiveDate: string;
  /** The appraiser or agent who finalized */
  reconciledBy: string;
  /** Correlation ID for TerraTrace */
  correlationId?: string;
}

/** Constraint: Approach weights must sum to 100 */
export const RECONCILIATION_RULES = {
  weightSum: 100,
  minApproaches: 1,
  maxApproaches: 3,
  validApproaches: ['cost', 'sales', 'income'] as const,
} as const;

// ============================================================================
// Tranche 1C: Regression Studio — governed types (cross-parcel, standalone)
// ============================================================================

/** Supported regression model types */
export type RegressionModelType = 'OLS' | 'GWR' | 'Quantile';

/** Model lifecycle status: draft → validated → production */
export type RegressionModelStatus = 'draft' | 'validated' | 'production';

/** A single coefficient in a fitted regression model */
export interface RegressionCoefficient {
  variable: string;
  estimate: number;
  stdError: number;
  tStat: number;
  pValue: number;
  significant: boolean;
  /** Variance Inflation Factor — multicollinearity diagnostic */
  vif?: number;
}

/** Feature (independent variable) available for model specification */
export interface RegressionFeature {
  id: string;
  name: string;
  category: 'Physical' | 'Quality' | 'Location' | 'Amenity';
  selected: boolean;
  description?: string;
}

/** Goodness-of-fit and information-criterion diagnostics */
export interface RegressionDiagnostics {
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  mse: number;
  aic: number;
  bic: number;
  observations: number;
}

/** Validation metrics for IAAO compliance assessment */
export interface RegressionValidation {
  qualificationPass: boolean;
  /** Optional reason when qualificationPass is false */
  failureReason?: string;
}

/** Full regression model record — cross-parcel, write-owner = Forge */
export interface RegressionModelRecord extends RegressionDiagnostics, RegressionValidation {
  id: string;
  name: string;
  modelType: RegressionModelType;
  version: number;
  status: RegressionModelStatus;
  createdAt: string;
  variables: string[];
  coefficients: RegressionCoefficient[];
}

/** Coefficient delta between two model versions (for comparison) */
export interface CoefficientDelta {
  variable: string;
  estimateA: number;
  estimateB: number;
  delta: number;
  significantA: boolean;
  significantB: boolean;
  signChange: boolean;
}

/** Metric deltas between two model versions */
export interface RegressionMetricDeltas {
  rSquared: number;
  adjustedRSquared: number;
  aic: number;
  bic: number;
  mse: number;
}

/** IAAO-aligned qualification thresholds for regression models */
export const REGRESSION_THRESHOLDS = {
  /** Minimum acceptable R² for a production model */
  minRSquared: 0.70,
  /** Maximum acceptable VIF before multicollinearity concern */
  maxVIF: 10.0,
  /** Significance threshold (α) for coefficient p-values */
  significanceAlpha: 0.05,
  /** Minimum observations for a valid model run */
  minObservations: 30,
  /** Valid model types */
  validModelTypes: ['OLS', 'GWR', 'Quantile'] as const,
  /** Valid model statuses */
  validStatuses: ['draft', 'validated', 'production'] as const,
  /** Valid feature categories */
  validCategories: ['Physical', 'Quality', 'Location', 'Amenity'] as const,
} as const;

// ============================================================================
// BATCH COST MODEL RUNS (Tranche 1D — cross-parcel, Forge write-lane)
// ============================================================================

/** Filter criteria for a batch cost model run */
export interface BatchCostRunFilter {
  /** Strata codes to include (e.g. residential, commercial) */
  strata: string[];
  /** Neighborhood codes to include */
  neighborhoods: string[];
  /** Property class codes to include */
  propertyClasses: string[];
}

/** Status of a batch cost model run */
export type BatchCostRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/** Request to initiate a batch cost model run */
export interface BatchCostRunRequest {
  /** Run label / description */
  label: string;
  /** Model year for the run */
  modelYear: number;
  /** Cost table version identifier */
  costTableVersion: string;
  /** Filter criteria */
  filter: BatchCostRunFilter;
  /** Whether this is a dry-run (preview only, no persistence) */
  dryRun: boolean;
}

/** Summary produced by a dry-run or completed run */
export interface BatchCostRunSummary {
  /** Total parcels matched by filter */
  totalParcels: number;
  /** Parcels with increased value */
  increasedCount: number;
  /** Parcels with decreased value */
  decreasedCount: number;
  /** Parcels unchanged */
  unchangedCount: number;
  /** Mean value change (absolute dollars) */
  meanChange: number;
  /** Median value change (absolute dollars) */
  medianChange: number;
  /** Mean percentage change */
  meanPctChange: number;
}

/** Record of a batch cost model run */
export interface BatchCostRunRecord {
  /** Unique run identifier */
  id: string;
  /** Request parameters */
  request: BatchCostRunRequest;
  /** Run status */
  status: BatchCostRunStatus;
  /** Summary statistics (populated after completion or dry-run) */
  summary: BatchCostRunSummary | null;
  /** ISO timestamp when run was created */
  createdAt: string;
  /** ISO timestamp when run completed */
  completedAt: string | null;
  /** County GUID scope */
  countyId: string;
}

// ============================================================================
// COEFFICIENT APPLICATION PREVIEW (Tranche 1D — cross-parcel, read-only)
// ============================================================================

/** A single coefficient delta: current vs proposed */
export interface CoefficientDelta {
  /** Variable / feature name */
  variable: string;
  /** Current production coefficient */
  currentValue: number;
  /** Proposed (candidate) coefficient */
  proposedValue: number;
  /** Absolute change */
  delta: number;
  /** Percentage change */
  deltaPct: number;
}

/** Set of coefficient deltas between two model versions */
export interface CoefficientDeltaSet {
  /** Source model ID (current production) */
  sourceModelId: string;
  /** Candidate model ID (proposed) */
  candidateModelId: string;
  /** Individual variable deltas */
  deltas: CoefficientDelta[];
}

/** Metric deltas for the coefficient preview impact */
export interface CoefficientImpactMetrics {
  /** COD change (current → proposed) */
  codDelta: number;
  /** PRD change (current → proposed) */
  prdDelta: number;
  /** Mean ratio change */
  meanRatioDelta: number;
  /** Median ratio change */
  medianRatioDelta: number;
}

/** A bucket of parcels impacted by coefficient change */
export interface ImpactBucket {
  /** Bucket label (e.g. "+5% to +10%") */
  label: string;
  /** Number of parcels in this bucket */
  count: number;
  /** Mean dollar impact for parcels in this bucket */
  meanDollarImpact: number;
}

/** Full coefficient application preview result */
export interface CoefficientPreviewResult {
  /** Coefficient delta set */
  coefficients: CoefficientDeltaSet;
  /** Impact metrics */
  metrics: CoefficientImpactMetrics;
  /** Total parcels impacted (value change > 0) */
  impactedParcelCount: number;
  /** Total parcels evaluated */
  totalParcelsEvaluated: number;
  /** Impact distribution buckets */
  impactBuckets: ImpactBucket[];
}

/** Thresholds and constants for batch cost operations */
export const BATCH_COST_THRESHOLDS = {
  /** Maximum parcels in a single batch run */
  maxBatchSize: 50_000,
  /** Minimum parcels for a valid batch run */
  minBatchSize: 10,
  /** Valid run statuses */
  validStatuses: ['pending', 'running', 'completed', 'failed', 'cancelled'] as const,
  /** Valid strata codes (Benton County) */
  validStrata: ['residential', 'commercial', 'industrial', 'agricultural', 'exempt'] as const,
  /** COD improvement threshold (negative = improvement) */
  codImprovementThreshold: -0.5,
  /** Impact bucket boundaries (percentage) */
  impactBucketEdges: [-20, -10, -5, -2, 0, 2, 5, 10, 20] as const,
} as const;

// ============================================================================
// Tranche 1E — Model Application / Audit Proof
// ============================================================================

/**
 * ForgeApplyMode — the three-state lifecycle of a model application.
 *
 * preview_only           — dry-run preview, no side-effects, no persistence.
 * apply_pending_backend  — user requested apply but backend capability is absent;
 *                          the request is recorded but NOT executed.
 * apply_executed         — backend confirmed execution; values persisted.
 */
export type ForgeApplyMode = 'preview_only' | 'apply_pending_backend' | 'apply_executed';

/** Request to apply (or preview) a cost/coefficient model across parcels. */
export interface ModelApplicationRequest {
  /** Unique request identifier */
  requestId: string;
  /** Which model to apply */
  modelId: string;
  /** Model name (human-readable) */
  modelName: string;
  /** Model year */
  modelYear: number;
  /** Lifecycle mode — preview, pending, or executed */
  mode: ForgeApplyMode;
  /** Filter (same shape as batch cost) */
  filter: BatchCostRunFilter;
  /** Timestamp of the request */
  requestedAt: string;
  /** Requesting user identifier */
  requestedBy: string;
  /** County scope (multi-tenant) */
  countyId: string;
  // NOTE: parcelId is intentionally ABSENT — cross-parcel only
}

/** Preview result returned from a model application dry-run. */
export interface ModelApplicationPreview {
  requestId: string;
  mode: 'preview_only';
  impactSummary: ModelApplicationImpactSummary;
  /** SHA-256 hash of the input parameters (for audit reproducibility) */
  inputHash: string;
  generatedAt: string;
}

/** Aggregated impact summary for a model application. */
export interface ModelApplicationImpactSummary {
  totalParcelsEvaluated: number;
  impactedParcelCount: number;
  meanValueChange: number;
  medianValueChange: number;
  meanPctChange: number;
  impactedStrata: string[];
  impactBuckets: ImpactBucket[];
}

/** Persisted record of a model application (preview or execution). */
export interface ModelApplicationRecord {
  id: string;
  request: ModelApplicationRequest;
  mode: ForgeApplyMode;
  preview: ModelApplicationPreview | null;
  /** Non-null only when mode === 'apply_executed' */
  executionResult: { completedAt: string; affectedParcels: number } | null;
  /** Non-null when mode === 'apply_pending_backend' */
  blockers: ModelApplicationBlocker[] | null;
  auditEvents: ModelApplicationAuditEvent[];
  countyId: string;
  createdAt: string;
}

/** Audit event emitted on every preview/apply interaction. */
export interface ModelApplicationAuditEvent {
  eventId: string;
  requestId: string;
  /** Who triggered the action */
  requestedBy: string;
  /** Owning suite */
  suite: 'forge';
  /** Write lane (forge for apply, none for preview) */
  writeLane: 'forge' | 'none';
  /** Lifecycle mode at event time */
  mode: ForgeApplyMode;
  /** SHA-256 hash of input parameters */
  inputHash: string;
  /** Which strata were impacted */
  impactedStrata: string[];
  /** Outcome of the interaction */
  outcome: 'preview_generated' | 'apply_accepted' | 'apply_blocked' | 'apply_executed';
  /** ISO timestamp */
  timestamp: string;
  /** County scope */
  countyId: string;
}

/** Reason an apply action was blocked. */
export interface ModelApplicationBlocker {
  code: 'no_backend_capability' | 'insufficient_permissions' | 'validation_failed';
  message: string;
  /** Timestamp blocker was recorded */
  recordedAt: string;
}

/** Canonical rules enforced for all model application interactions. */
export const MODEL_APPLICATION_RULES = {
  /** Preview is always non-destructive — no persistence, no side-effects */
  previewNonDestructive: true,
  /** Apply requires backend capability flag; without it, mode stays pending */
  applyRequiresBackend: true,
  /** Write lane is always Forge */
  writeLane: 'forge' as const,
  /** Cross-parcel only — parcelId must be absent from requests */
  crossParcelOnly: true,
  /** Every interaction must emit an audit event */
  auditRequired: true,
  /** Valid apply modes */
  validModes: ['preview_only', 'apply_pending_backend', 'apply_executed'] as const,
  /** Valid audit outcomes */
  validOutcomes: ['preview_generated', 'apply_accepted', 'apply_blocked', 'apply_executed'] as const,
  /** Valid blocker codes */
  validBlockerCodes: ['no_backend_capability', 'insufficient_permissions', 'validation_failed'] as const,
} as const;
