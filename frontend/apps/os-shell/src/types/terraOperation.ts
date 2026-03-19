/**
 * ITerraOperation — Canonical operation contract for the sovereign spine.
 * Every mutation that passes through the TruthGate must carry this shape.
 *
 * Phase 7: Source tagging ensures every operation is attributable to its origin.
 */

/** The origin of an operation — who or what initiated it */
export type OperationSource = 'UI_WORKBENCH' | 'CLI_OPERATOR' | 'AI_PILOT';

/** Intent identifier — what the operation is trying to do */
export type OperationIntent =
  | 'NAVIGATE'
  | 'ACTIVATE_MODULE'
  | 'UPDATE_VALUE'
  | 'CREATE_RECORD'
  | 'DELETE_RECORD'
  | 'APPROVE_DRAFT'
  | 'REJECT_DRAFT'
  | 'EXPLAIN';

/** Operation status after TruthGate evaluation */
export type OperationOutcome = 'EXECUTED' | 'STAGED' | 'BLOCKED';

/**
 * The canonical operation envelope.
 * Every governed mutation flows through this contract.
 */
export interface ITerraOperation<TPayload = Record<string, unknown>> {
  /** Unique operation identifier */
  intentId: string;

  /** Who or what initiated this operation */
  source: OperationSource;

  /** What this operation intends to do */
  intent: OperationIntent;

  /** County scope — required for all operations */
  countyId: string;

  /** Actor identity — who is performing the operation */
  actorId: string;

  /** Operation-specific data */
  payload: TPayload;

  /** ISO timestamp of when the intent was declared */
  timestamp: string;

  /** Human approver ID — required for AI_PILOT mutations (Phase 10+) */
  humanApproverId?: string;
}

/**
 * Result after TruthGate evaluation.
 */
export interface TerraOperationResult<TResult = unknown> {
  /** The original operation */
  operation: ITerraOperation;

  /** What happened */
  outcome: OperationOutcome;

  /** Result data if executed */
  result?: TResult;

  /** Reason if blocked or staged */
  reason?: string;

  /** Trace correlation ID for audit */
  traceId: string;
}
