/**
 * TruthGate — Validates operations before execution.
 *
 * Phase 7: Source-aware validation. Ensures:
 * - Every operation has a valid source
 * - Every operation has a countyId (county isolation)
 * - AI_PILOT operations without HumanApproverId are STAGED, not EXECUTED
 * - Missing required fields cause BLOCKED outcome
 */

import type {
  OperationSource,
  OperationOutcome,
  ITerraOperation,
  TerraOperationResult,
} from '@/types/terraOperation';

export interface TruthGateValidation {
  outcome: OperationOutcome;
  reason?: string;
}

/**
 * Validates an operation against TruthGate rules.
 * Pure function — no side effects, no network calls.
 */
export function validateOperation(op: ITerraOperation): TruthGateValidation {
  // Rule 1: source must be a valid OperationSource
  const validSources: OperationSource[] = ['UI_WORKBENCH', 'CLI_OPERATOR', 'AI_PILOT'];
  if (!validSources.includes(op.source)) {
    return { outcome: 'BLOCKED', reason: `Invalid source: ${op.source}` };
  }

  // Rule 2: countyId is required (county isolation)
  if (!op.countyId || op.countyId.trim() === '') {
    return { outcome: 'BLOCKED', reason: 'Missing countyId — county isolation required' };
  }

  // Rule 3: actorId is required
  if (!op.actorId || op.actorId.trim() === '') {
    return { outcome: 'BLOCKED', reason: 'Missing actorId — actor attribution required' };
  }

  // Rule 4: AI_PILOT mutations require HumanApproverId (Phase 10 enforcement)
  // Until Phase 10, AI_PILOT operations without approval are STAGED
  if (op.source === 'AI_PILOT' && !op.humanApproverId) {
    return { outcome: 'STAGED', reason: 'AI_PILOT operation requires human approval' };
  }

  // All checks passed
  return { outcome: 'EXECUTED' };
}

/**
 * Creates a TerraOperationResult from a validation.
 */
export function createOperationResult(
  op: ITerraOperation,
  validation: TruthGateValidation,
  traceId: string,
): TerraOperationResult {
  return {
    operation: op,
    outcome: validation.outcome,
    reason: validation.reason,
    traceId,
  };
}
