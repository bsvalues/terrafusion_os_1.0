/**
 * Phase 4N1 — Rollback Validator
 *
 * Shared validation functions for rollback operations.
 * Used by both contract tests and the perf-rollback CLI.
 */

// Flexible types to avoid coupling to internal schema evolution
export type ApplyOutcome = 'applied' | 'skipped' | 'blocked' | 'noop' | 'dry-run';

export interface ApplyProof {
  planItemId?: string;
  strategyId?: string;
  outcome: ApplyOutcome;
  finalCommitSha?: string;
  rollbackCommand?: string;
  failureReason?: string;
  selectionReason?: unknown;
  gates?: unknown[];
  diffStats?: unknown;
}

export interface RollbackValidationResult {
  valid: boolean;
  reason?: string;
  parsed?: {
    sha: string;
    command: string;
  };
}

/**
 * Check if `full` SHA starts with `maybePrefix`
 */
export function isShaPrefixOf(full: string, maybePrefix: string): boolean {
  return full.toLowerCase().startsWith(maybePrefix.toLowerCase());
}

/**
 * Parse a `git revert <sha>` command and extract the SHA.
 * Returns null if the command is invalid or contains forbidden patterns.
 *
 * Allowed formats:
 * - "git revert <sha>"
 * - "git revert --no-edit <sha>"
 *
 * Disallowed:
 * - Shell chaining: ; & | ` $ ( )
 * - Multiple commands
 */
export function parseRevertSha(cmd: string): string | null {
  const trimmed = cmd.trim();

  // Disallow chaining / multiple commands / shell injection
  if (/[;&|`$()]/.test(trimmed)) return null;

  // Match: git revert [optional flags] <sha>
  // SHA must be 7-40 hex chars
  const m = trimmed.match(/^git\s+revert(?:\s+--[a-z-]+)*\s+([0-9a-f]{7,40})$/i);
  return m?.[1] ?? null;
}

/**
 * List of forbidden destructive commands
 */
export const FORBIDDEN_COMMANDS = [
  'git reset',
  'git checkout',
  'git clean',
  'git push --force',
  'git push -f',
  'rm -rf',
  'del /f',
  'rmdir',
  'remove-item',
];

/**
 * Check if a rollback command contains forbidden destructive operations.
 * Returns the forbidden pattern if found, null otherwise.
 */
export function containsForbiddenCommand(cmd: string): string | null {
  const lowered = cmd.toLowerCase();

  for (const bad of FORBIDDEN_COMMANDS) {
    if (lowered.includes(bad)) {
      return bad;
    }
  }

  return null;
}

/**
 * Validate a rollback command against all governance contracts.
 */
export function validateRollbackCommand(proof: ApplyProof): RollbackValidationResult {
  // 1. Must have outcome = applied
  if (proof.outcome !== 'applied') {
    return {
      valid: false,
      reason: `Cannot rollback non-applied proof (outcome: ${proof.outcome})`,
    };
  }

  // 2. Must have finalCommitSha
  if (!proof.finalCommitSha) {
    return {
      valid: false,
      reason: 'Proof is missing finalCommitSha',
    };
  }

  // 3. Must have rollbackCommand
  if (!proof.rollbackCommand) {
    return {
      valid: false,
      reason: 'Proof is missing rollbackCommand',
    };
  }

  // 4. Check for forbidden commands
  const forbidden = containsForbiddenCommand(proof.rollbackCommand);
  if (forbidden) {
    return {
      valid: false,
      reason: `rollbackCommand contains forbidden '${forbidden}'`,
    };
  }

  // 5. Parse and validate revert SHA
  const revertSha = parseRevertSha(proof.rollbackCommand);
  if (!revertSha) {
    return {
      valid: false,
      reason: `rollbackCommand must match 'git revert <sha>': ${proof.rollbackCommand}`,
    };
  }

  // 6. SHA must match finalCommitSha (prefix)
  if (!isShaPrefixOf(proof.finalCommitSha, revertSha)) {
    return {
      valid: false,
      reason: `rollback SHA '${revertSha}' does not match finalCommitSha '${proof.finalCommitSha}'`,
    };
  }

  return {
    valid: true,
    parsed: {
      sha: revertSha,
      command: proof.rollbackCommand,
    },
  };
}
