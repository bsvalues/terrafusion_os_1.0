/**
 * TerraFusion OS — PulseHome Contract Interfaces
 * ═══════════════════════════════════════════════════════════════
 *
 * Canonical, UNAVAILABLE-SAFE contracts for the future live "County Nerve
 * Center" Home. These types exist so the cinematic Home prototype
 * (docs/prototypes/terrafusion_home_county_nerve_center.html) can eventually
 * become production WITHOUT inventing county data.
 *
 * This module is DESIGN-ONLY / TYPED-CONTRACT-FIRST. It defines no UI, makes
 * no network calls, and does not touch StageZeroState. It is the data shape a
 * later, governed read layer must satisfy.
 *
 * ── Honesty invariants (enforced by the types, not just documented) ─────────
 *  1. No live datum exists without a {@link PulseSourceAttribution}. A
 *     `PulseRead` can only be `live` if it carries `data` AND `source`.
 *  2. No count / metric exists outside a `live` read. Counts live on evidence
 *     items, which only appear inside `live` reads with a source.
 *  3. `unavailable` carries a human-readable `reason` and NEVER placeholder
 *     data. There is no field to smuggle a fabricated value through.
 *  4. `loading` is distinct from `unavailable` — stale/absent data must never
 *     render as live.
 *  5. County-scoped: every brief, event, and evidence item belongs to exactly
 *     one county + roll year.
 *
 * @see docs/contracts/pulse-home-contract.md
 * @see 06_CONTRACTS_TYPESCRIPT_INTERFACES_v1.md
 */

import type { DataClassification } from './workbench';

// ============================================================================
// Primitives
// ============================================================================

/** County + roll-year scope. Every Pulse datum is scoped to exactly one. */
export interface PulseCountyRef {
  countyId: string;
  /** Display label, e.g. "Benton County, WA". */
  label: string;
  /** Assessment roll year the data pertains to. */
  rollYear: number;
}

/** Operational condition levels, worst-to-best ordered for sorting. */
export type PulseConditionLevel = 'critical' | 'attention' | 'watching' | 'stable';

/** The county functions the Pulse reports on. */
export type PulseFunction =
  | 'valuation'
  | 'appeals'
  | 'exemptions'
  | 'notices'
  | 'certification'
  | 'public_counter';

/**
 * Future-correct routing destinations. Labels are stable even before the
 * target surfaces exist, so Home directs and the workbench executes.
 */
export type PulseDestination =
  | 'forge.valuation-review'
  | 'dais.exemption-queue'
  | 'dossier.appeal-packets'
  | 'dossier.evidence-review'
  | 'certification.roll-readiness'
  | 'notices.mail-cycle'
  | 'atlas.filtered-review'
  | 'counter.approved-explanations';

/** Urgency of a priority action. */
export type PulseUrgency = 'today' | 'this_week' | 'scheduled' | 'none';

// ============================================================================
// Source attribution — the honesty anchor
// ============================================================================

/**
 * Provenance for a live datum. Required on every `live` read and every
 * recorded event/evidence item. Without this, a value cannot be presented as
 * truth.
 */
export interface PulseSourceAttribution {
  /** Originating system, e.g. "TerraForge ratio study", "TerraDais queue". */
  system: string;
  /** Stable reference/id for the underlying record, e.g. "ratio-study:2026-06-13". */
  reference: string;
  /** ISO-8601 timestamp the value was observed or computed. */
  observedAt: string;
  /** Optional sensitivity classification (reuses the canonical workbench enum). */
  classification?: DataClassification;
}

// ============================================================================
// Unavailable-safe read wrapper
// ============================================================================

export type PulseReadState = 'loading' | 'live' | 'unavailable';

/** A live value — ALWAYS carries its source. */
export interface PulseLive<T> {
  state: 'live';
  data: T;
  source: PulseSourceAttribution;
}

/** An explicit gap. Carries a reason, never data. */
export interface PulseUnavailable {
  state: 'unavailable';
  /** Plain-English reason, e.g. "TerraForge ratio study returned no data." */
  reason: string;
}

/** An in-flight read. Distinct from unavailable. */
export interface PulseLoading {
  state: 'loading';
}

/**
 * The universal Pulse read result. Every Home datum flows through this so the
 * UI can only ever render live-with-source, an explicit gap, or loading.
 */
export type PulseRead<T> = PulseLive<T> | PulseUnavailable | PulseLoading;

// ============================================================================
// Condition
// ============================================================================

/** Plain-English status of one county function. */
export interface PulseCondition {
  function: PulseFunction;
  level: PulseConditionLevel;
  /** Why it is at this level, in operational language. Derived from real data. */
  reason: string;
  /** Where to go to act on it. */
  destination?: PulseDestination;
}

// ============================================================================
// Evidence — counts only ever live here, with a source
// ============================================================================

export type PulseEvidenceKind =
  | 'qualified_sales'
  | 'permits_imported'
  | 'appeals_filed'
  | 'notices_prepared'
  | 'missing_evidence'
  | 'audit_entries';

/** A single, traceable evidence figure. A count cannot exist without a source. */
export interface PulseEvidenceItem {
  id: string;
  kind: PulseEvidenceKind;
  /** Human label, e.g. "Qualified sales reviewed". */
  label: string;
  /** Real count from the source system. Never fabricated. */
  count: number;
  /** Optional context, e.g. "Grandview East · last 90 days". */
  detail?: string;
  /** True when this is a gap that blocks readiness (e.g. missing narrative). */
  gating?: boolean;
  source: PulseSourceAttribution;
  destination?: PulseDestination;
}

/** The "Evidence Behind Today" payload. */
export interface PulseEvidenceSummary {
  items: PulseEvidenceItem[];
}

/** Lightweight pointer from an action to a piece of evidence. */
export interface PulseEvidenceRef {
  /** Matches a {@link PulseEvidenceItem.id} once resolved. */
  evidenceId: string;
  label: string;
}

// ============================================================================
// Priority action
// ============================================================================

/**
 * A prioritized "what to do next". Counts are NOT inlined — actions reference
 * evidence items, so every number a user sees is sourced.
 */
export interface PulsePriorityAction {
  id: string;
  title: string;
  /** Why it matters, plain English. */
  why: string;
  /** 1 = the single dominant recommended action. */
  rank: number;
  urgency: PulseUrgency;
  /** Optional derived due label, e.g. "Due today". */
  dueLabel?: string;
  /** Evidence backing the action. Empty array is honest; fabricated counts are not. */
  evidence: PulseEvidenceRef[];
  destination: PulseDestination;
}

// ============================================================================
// Activity event (overnight stream)
// ============================================================================

export type PulseActivityKind =
  | 'permit_import'
  | 'appeal_filed'
  | 'ratio_study_updated'
  | 'notice_batch'
  | 'evidence_packet'
  | 'doctrine_note'
  | 'sync_completed';

/** A recorded operational event. Always traceable to its source. */
export interface PulseActivityEvent {
  id: string;
  kind: PulseActivityKind;
  /** ISO-8601 timestamp the event occurred. */
  occurredAt: string;
  summary: string;
  detail?: string;
  source: PulseSourceAttribution;
  destination?: PulseDestination;
}

// ============================================================================
// Morning brief + snapshot
// ============================================================================

/** The narrative "Morning Brief" payload. */
export interface PulseHomeBrief {
  county: PulseCountyRef;
  /** ISO-8601 timestamp the brief was generated. */
  generatedAt: string;
  /** Worst condition across functions, for the headline tone. */
  overallCondition: PulseConditionLevel;
  /** Narrative summary derived from the conditions below. */
  headline: string;
  /** Per-function conditions. */
  conditions: PulseCondition[];
  /** Prioritized actions; rank 1 is the recommended first action. */
  priorityActions: PulsePriorityAction[];
  /** Id of the recommended first action (references priorityActions). */
  recommendedFirstActionId?: string;
}

/**
 * The full Home read. Each region is an independent {@link PulseRead} so the
 * Home can show real partial availability — e.g. live brief, unavailable
 * evidence — without faking the missing parts.
 */
export interface PulseHomeSnapshot {
  county: PulseCountyRef;
  brief: PulseRead<PulseHomeBrief>;
  activity: PulseRead<PulseActivityEvent[]>;
  evidence: PulseRead<PulseEvidenceSummary>;
}

// ============================================================================
// Constructors — the ONLY sanctioned way to build reads
// ============================================================================

/** Build a live read. A source is mandatory; there is no live-without-source. */
export function pulseLive<T>(data: T, source: PulseSourceAttribution): PulseLive<T> {
  return { state: 'live', data, source };
}

/** Build an explicit gap. A reason is mandatory; no data is carried. */
export function pulseUnavailable(reason: string): PulseUnavailable {
  return { state: 'unavailable', reason };
}

/** Build a loading read. */
export function pulseLoading(): PulseLoading {
  return { state: 'loading' };
}

// ============================================================================
// Type guards
// ============================================================================

export function isPulseLive<T>(read: PulseRead<T>): read is PulseLive<T> {
  return read.state === 'live';
}

export function isPulseUnavailable<T>(read: PulseRead<T>): read is PulseUnavailable {
  return read.state === 'unavailable';
}

export function isPulseLoading<T>(read: PulseRead<T>): read is PulseLoading {
  return read.state === 'loading';
}

// ============================================================================
// Presentation helpers (honesty-preserving)
// ============================================================================

/**
 * Resolve a read to its live data, or `null` when not live. Forces callers to
 * handle the gap explicitly rather than defaulting to a fabricated value.
 */
export function pulseDataOrNull<T>(read: PulseRead<T>): T | null {
  return isPulseLive(read) ? read.data : null;
}

/** Format a source for display, e.g. "TerraForge ratio study · ratio-study:2026-06-13". */
export function formatPulseSource(source: PulseSourceAttribution): string {
  return `${source.system} · ${source.reference}`;
}
