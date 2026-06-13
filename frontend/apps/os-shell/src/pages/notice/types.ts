/**
 * TerraNotice Ops Console — shared types.
 *
 * TerraNotice is the governed control surface for civic notice legality,
 * delivery, explanation, and proof. This file types every data shape the
 * console renders. All console screens read from a single service surface
 * (today: sandbox fixtures, see ./data/sandboxData) so a real backend can be
 * dropped in without touching the screens.
 *
 * @module pages/notice/types
 */

/**
 * Where the data on screen came from. Drives the honesty ribbon: the console
 * never presents sandbox fixtures as live county production data.
 */
export type NoticeDataSource = 'sandbox' | 'live' | 'unavailable';

/** The twelve console areas (left-rail navigation). */
export type ConsoleAreaId =
  | 'command-center'
  | 'county-configuration'
  | 'policy-packs'
  | 'template-governance'
  | 'batch-operations'
  | 'freeze-snapshots'
  | 'vendor-dispatch'
  | 'returned-mail'
  | 'citizen-portal'
  | 'telemetry'
  | 'audit-vault'
  | 'release-console';

/** Operator role — drives which areas are emphasized / actionable. */
export type OperatorRole =
  | 'assessor-admin'
  | 'operations'
  | 'legal-compliance'
  | 'it-admin'
  | 'public-comms';

// ---------------------------------------------------------------------------
// Command Center
// ---------------------------------------------------------------------------

export interface KpiSummary {
  activeBatches: number;
  activeBatchesNote: string;
  noticesPrepared: number;
  validationPassRate: number; // 0..1
  openExceptions: number;
  highRiskExceptions: number;
  auditReadiness: number; // 0..1
  auditReadinessNote: string;
}

export type BatchStatus =
  | 'draft'
  | 'validated'
  | 'legal-review'
  | 'frozen'
  | 'dispatched'
  | 'failed';

export interface BatchRow {
  batchId: string;
  status: BatchStatus;
  notices: number;
  policyVersion: string;
  templateVersion: string;
  program: string;
}

export type TimelineState = 'done' | 'active' | 'pending';

export interface TimelineStep {
  label: string;
  state: TimelineState;
  /** Human time / relative marker. Empty for not-yet-reached steps. */
  at: string;
}

// ---------------------------------------------------------------------------
// County Configuration
// ---------------------------------------------------------------------------

export interface CountyProfile {
  countyName: string;
  program: string;
  taxYear: number;
  environment: string;
  brandingLocked: boolean;
  approvalChain: string[];
  languageDefaults: string[];
  accessibilityDefaults: string[];
  deliveryRules: { label: string; value: string }[];
  vendorMappings: { channel: string; vendor: string; status: 'active' | 'inactive' }[];
  runtimeOverrides: { label: string; value: string; withinBounds: boolean }[];
}

// ---------------------------------------------------------------------------
// Policy Packs
// ---------------------------------------------------------------------------

export type ApprovalStatus = 'approved' | 'pending' | 'rejected' | 'draft';

export interface PolicyRule {
  ruleId: string;
  title: string;
  source: 'state-baseline' | 'county-override';
  effectiveDate: string;
  testStatus: 'pass' | 'fail' | 'untested';
  approval: ApprovalStatus;
}

export interface PolicyPack {
  packId: string;
  label: string;
  approval: ApprovalStatus;
  effectiveDate: string;
  rules: PolicyRule[];
}

// ---------------------------------------------------------------------------
// Template Governance
// ---------------------------------------------------------------------------

export type LifecycleState = 'draft' | 'in-review' | 'approved' | 'retired';

export interface TemplateBlock {
  blockId: string;
  name: string;
  kind: 'legal' | 'plain-language' | 'layout' | 'metadata';
  /** Legal text blocks are immutable once approved. */
  legalControlled: boolean;
  lifecycle: LifecycleState;
}

export interface TemplateAssembly {
  templateId: string;
  version: string;
  lifecycle: LifecycleState;
  legalApproval: ApprovalStatus;
  blocks: string[]; // block names
  previousVersion?: string;
}

// ---------------------------------------------------------------------------
// Freeze Snapshots
// ---------------------------------------------------------------------------

export interface FreezeSnapshot {
  snapshotId: string;
  batchId: string;
  parcelCount: number;
  legalTextVersion: string;
  templateVersion: string;
  policyVersion: string;
  countyConfigVersion: string;
  artifactHash: string;
  frozenAt: string;
  frozenBy: string;
}

// ---------------------------------------------------------------------------
// Vendor Dispatch
// ---------------------------------------------------------------------------

export type DispatchStatus = 'ready' | 'queued' | 'in-transit' | 'delivered' | 'failed';

export interface VendorDispatchRecord {
  bundleId: string;
  batchId: string;
  provider: string;
  channel: 'mail' | 'print' | 'certified';
  mailingClass: string;
  status: DispatchStatus;
  itemCount: number;
  receiptsImported: number;
  failures: number;
}

// ---------------------------------------------------------------------------
// Returned Mail / Exceptions
// ---------------------------------------------------------------------------

export type ExceptionCategory =
  | 'invalid-address'
  | 'vendor-rejection'
  | 'certified-mismatch'
  | 'missing-insert'
  | 'policy-template-conflict'
  | 'citizen-followup';

export interface ExceptionRow {
  category: ExceptionCategory;
  label: string;
  count: number;
  action: string;
  highRisk: boolean;
}

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

export interface TelemetryMetric {
  key: string;
  label: string;
  value: number;
  unit?: string;
  /** Optional delta vs prior period, e.g. "+4%". */
  delta?: string;
}

// ---------------------------------------------------------------------------
// Audit Vault
// ---------------------------------------------------------------------------

export interface AuditBinding {
  label: string;
  value: string;
}

export interface AuditEvidenceBundle {
  bundleId: string;
  batchId: string;
  sealed: boolean;
  bindings: AuditBinding[];
}

// ---------------------------------------------------------------------------
// Release & Deployment
// ---------------------------------------------------------------------------

export type ReleaseHealth = 'healthy' | 'degraded' | 'blocked';

export interface ReleaseManifest {
  releaseId: string;
  environment: string;
  health: ReleaseHealth;
  policyPack: string;
  templateSet: string;
  attestationsComplete: number;
  attestationsRequired: number;
  deployedAt: string;
}

// ---------------------------------------------------------------------------
// Aggregate console snapshot
// ---------------------------------------------------------------------------

export interface NoticeConsoleSnapshot {
  source: NoticeDataSource;
  county: CountyProfile;
  kpis: KpiSummary;
  batches: BatchRow[];
  timeline: TimelineStep[];
  policyPacks: PolicyPack[];
  templateBlocks: TemplateBlock[];
  templateAssemblies: TemplateAssembly[];
  freezeSnapshots: FreezeSnapshot[];
  dispatches: VendorDispatchRecord[];
  exceptions: ExceptionRow[];
  telemetry: TelemetryMetric[];
  auditBundles: AuditEvidenceBundle[];
  releases: ReleaseManifest[];
}
