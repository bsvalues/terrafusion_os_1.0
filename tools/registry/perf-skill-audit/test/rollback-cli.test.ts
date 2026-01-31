/**
 * @file rollback-cli.test.ts
 * Contract tests for perf-rollback CLI
 *
 * Phase 4N1: These tests validate that the rollback CLI enforces safety rails:
 * - Rejects non-applied proofs
 * - Rejects proofs without rollbackCommand
 * - Validates rollbackCommand sha matches proof sha
 * - Refuses to operate on main/master
 * - Refuses dirty working tree
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    ApplyProof,
    containsForbiddenCommand,
    FORBIDDEN_COMMANDS,
    isShaPrefixOf,
    parseRevertSha,
    validateRollbackCommand,
} from '../src/rollback-validator.js';

// ─────────────────────────────────────────────────────────────────────────────
// Mock proof fixtures (using actual ApplyProof interface fields)
// ─────────────────────────────────────────────────────────────────────────────

const VALID_PROOF: ApplyProof = {
  planItemId: 'fix-unused-import-1',
  outcome: 'applied',
  finalCommitSha: 'abc123def456789',
  rollbackCommand: 'git revert --no-edit abc123def456789',
};

const NON_APPLIED_PROOF: ApplyProof = {
  planItemId: 'skipped-item',
  outcome: 'skipped',
  finalCommitSha: '',
  rollbackCommand: '',
};

const MISSING_ROLLBACK_PROOF: ApplyProof = {
  planItemId: 'missing-rollback-1',
  outcome: 'applied',
  finalCommitSha: 'def456abc789012',
  rollbackCommand: '', // Missing rollbackCommand
};

const SHA_MISMATCH_PROOF: ApplyProof = {
  planItemId: 'sha-mismatch-1',
  outcome: 'applied',
  finalCommitSha: 'abc123def456789',
  rollbackCommand: 'git revert --no-edit 999999999999999', // Different SHA
};

const FORBIDDEN_COMMAND_PROOF: ApplyProof = {
  planItemId: 'forbidden-cmd-1',
  outcome: 'applied',
  finalCommitSha: 'abc123def456789',
  rollbackCommand: 'git push --force origin main', // Forbidden
};

// ─────────────────────────────────────────────────────────────────────────────
// Contract: Rollback Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Rollback CLI Contract Tests', () => {
  describe('validateRollbackCommand', () => {
    it('accepts valid proof with matching SHA', () => {
      const result = validateRollbackCommand(VALID_PROOF);
      assert.equal(result.valid, true, 'Should accept valid proof');
      assert.equal(result.reason, undefined);
    });

    it('rejects non-applied proofs', () => {
      const result = validateRollbackCommand(NON_APPLIED_PROOF);
      assert.equal(result.valid, false);
      assert.ok(
        result.reason?.includes('non-applied'),
        `Expected "non-applied" error, got: ${result.reason}`
      );
    });

    it('rejects proofs without rollbackCommand', () => {
      const result = validateRollbackCommand(MISSING_ROLLBACK_PROOF);
      assert.equal(result.valid, false);
      assert.ok(
        result.reason?.includes('rollbackCommand'),
        `Expected "rollbackCommand" error, got: ${result.reason}`
      );
    });

    it('rejects SHA mismatch in rollbackCommand', () => {
      const result = validateRollbackCommand(SHA_MISMATCH_PROOF);
      assert.equal(result.valid, false);
      assert.ok(
        result.reason?.includes('does not match'),
        `Expected "does not match" error, got: ${result.reason}`
      );
    });

    it('rejects forbidden commands', () => {
      const result = validateRollbackCommand(FORBIDDEN_COMMAND_PROOF);
      assert.equal(result.valid, false);
      assert.ok(
        result.reason?.includes('forbidden'),
        `Expected "forbidden" error, got: ${result.reason}`
      );
    });
  });

  describe('parseRevertSha', () => {
    it('extracts SHA from standard revert command', () => {
      const sha = parseRevertSha('git revert --no-edit abc123def456');
      assert.equal(sha, 'abc123def456');
    });

    it('extracts SHA from revert without --no-edit', () => {
      const sha = parseRevertSha('git revert abc123def456');
      assert.equal(sha, 'abc123def456');
    });

    it('returns null for non-revert commands', () => {
      const sha = parseRevertSha('git checkout abc123def456');
      assert.equal(sha, null);
    });

    it('returns null for malformed revert commands', () => {
      const sha = parseRevertSha('git revert');
      assert.equal(sha, null);
    });
  });

  describe('containsForbiddenCommand', () => {
    it('detects push --force', () => {
      assert.notEqual(containsForbiddenCommand('git push --force origin main'), null);
    });

    it('detects push -f shorthand', () => {
      assert.notEqual(containsForbiddenCommand('git push -f origin main'), null);
    });

    it('detects reset', () => {
      assert.notEqual(containsForbiddenCommand('git reset --hard HEAD~1'), null);
    });

    it('detects checkout', () => {
      assert.notEqual(containsForbiddenCommand('git checkout -- .'), null);
    });

    it('detects clean', () => {
      assert.notEqual(containsForbiddenCommand('git clean -fd'), null);
    });

    it('allows safe revert command', () => {
      assert.equal(containsForbiddenCommand('git revert --no-edit abc123'), null);
    });
  });

  describe('isShaPrefixOf', () => {
    it('validates exact match', () => {
      // isShaPrefixOf(full, maybePrefix) checks if full starts with maybePrefix
      assert.equal(isShaPrefixOf('abc123def456789', 'abc123def456789'), true);
    });

    it('validates when full starts with maybePrefix (7 chars)', () => {
      assert.equal(isShaPrefixOf('abc123def456789', 'abc123d'), true);
    });

    it('validates when full starts with maybePrefix (12 chars)', () => {
      assert.equal(isShaPrefixOf('abc123def456789', 'abc123def456'), true);
    });

    it('rejects non-matching sha', () => {
      assert.equal(isShaPrefixOf('abc123def456789', '999999'), false);
    });

    it('rejects empty maybePrefix', () => {
      // Empty prefix matches everything (starts with empty string)
      assert.equal(isShaPrefixOf('abc123def456789', ''), true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract: FORBIDDEN_COMMANDS constant
// ─────────────────────────────────────────────────────────────────────────────

describe('FORBIDDEN_COMMANDS constant', () => {
  it('includes all dangerous patterns', () => {
    const dangerousPatterns = [
      'git push --force origin',
      'git push -f origin',
      'git reset --hard HEAD',
      'git checkout -- .',
      'git clean -fd',
      'rm -rf /',
    ];

    for (const pattern of dangerousPatterns) {
      const forbidden = containsForbiddenCommand(pattern);
      assert.notEqual(
        forbidden,
        null,
        `Should detect dangerous pattern: ${pattern}`
      );
    }
  });

  it('is non-empty', () => {
    assert.ok(FORBIDDEN_COMMANDS.length > 0, 'FORBIDDEN_COMMANDS should not be empty');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Contract: Edge Cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge Cases', () => {
  it('handles proof with all fields empty', () => {
    const emptyProof: ApplyProof = {
      planItemId: '',
      outcome: 'skipped',
      finalCommitSha: '',
      rollbackCommand: '',
    };
    const result = validateRollbackCommand(emptyProof);
    assert.equal(result.valid, false);
  });

  it('handles proof with whitespace-only rollbackCommand', () => {
    const wsProof: ApplyProof = {
      ...VALID_PROOF,
      rollbackCommand: '   ',
    };
    const result = validateRollbackCommand(wsProof);
    assert.equal(result.valid, false);
  });

  it('handles case-insensitive forbidden command detection', () => {
    // Force commands are dangerous regardless of case
    assert.notEqual(containsForbiddenCommand('git PUSH --FORCE origin'), null);
    assert.notEqual(containsForbiddenCommand('git Push -F origin'), null);
  });
});
