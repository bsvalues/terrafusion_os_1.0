/**
 * TerraFusion OS — TerraTrace Event Contract Interfaces
 * ═══════════════════════════════════════════════════════════════
 *
 * Canonical TypeScript interfaces for the append-only audit spine.
 * Every action in the OS emits trace events through this contract.
 *
 * Rules:
 * - Append-only: events are NEVER updated in place.
 * - County-scoped: every event belongs to exactly one county.
 * - Correlation-linked: invoke → result pairs share a correlationId.
 * - Large payloads stored by reference (payloadRef), not inline.
 * - PII is NEVER stored in trace payloads.
 *
 * @see 03_TERRATRACE_SPEC_v3.1.md — Sections 1-7
 * @see 06_CONTRACTS_TYPESCRIPT_INTERFACES_v1.md — Section 3
 */

// ============================================================================
// Primitives
// ============================================================================

/** Classification level for trace events. */
export type TraceClassification = 'PUBLIC' | 'CONFIDENTIAL' | 'RESTRICTED';

/** Canonical event types emitted by the OS. */
export type TraceEventType =
  | 'tool_invoked'
  | 'tool_succeeded'
  | 'tool_failed'
  | 'mode_switched'
  | 'permission_denied'
  | 'policy_blocked'
  | 'workflow_state_changed'
  | 'artifact_created'
  | 'artifact_published'
  | 'redaction_applied'
  | 'retention_archived'
  | 'retention_deleted';

/** Suite identifiers that can emit trace events. */
export type TraceSuite =
  | 'os'
  | 'forge'
  | 'atlas'
  | 'dais'
  | 'dossier'
  | 'pilot'
  | 'gpt';

// ============================================================================
// Actor
// ============================================================================

/**
 * The actor (user or system) that caused the event.
 */
export interface TraceActor {
  userId?: string;
  displayName?: string;
  roles?: string[];
  pilotProfileId?: string;
  /** True if this is a system-generated event (e.g. retention automation). */
  system?: boolean;
}

// ============================================================================
// Trace Event
// ============================================================================

/**
 * A single immutable trace event in the TerraTrace spine.
 *
 * Immutability pattern:
 * - tool_invoked is followed by tool_succeeded OR tool_failed
 * - They share the same correlationId
 * - Neither is ever updated after creation
 */
export interface TraceEvent {
  id: string;
  countyId: string;
  type: TraceEventType;
  /** ISO 8601 timestamp. */
  ts: string;
  /** Links invoke → result events in the same causal chain. */
  correlationId: string;
  suite: TraceSuite;
  /** Sub-module within the suite (e.g. "terra-exempt"). */
  module?: string;
  parcelId?: string;
  dossierId?: string;

  classification: TraceClassification;

  actor: TraceActor;

  /** Safe summaries only — no raw PII. */
  inputSummary?: string;
  outputSummary?: string;

  /** Blob pointer for large/sensitive payloads. */
  payloadRef?: string;

  /** Risk level of the action that produced this event. */
  risk?: 'read_only' | 'write_low' | 'write_high' | 'irreversible';
  /** Reason code provided by the user for write_high/irreversible actions. */
  reasonCode?: string;
  /** Reference to supervisor approval (for irreversible actions). */
  supervisorApprovalRef?: string;
}
