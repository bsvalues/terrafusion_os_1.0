/**
 * Phase 4M6d — Rollback Drill Contract
 *
 * Ensures every ApplyProof with outcome="applied" has a valid,
 * non-destructive rollback command that targets the correct commit.
 *
 * This contract makes ApplyProof auditable by county governance.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Flexible types to avoid coupling to internal schema evolution
type ApplyOutcome = 'applied' | 'skipped' | 'blocked' | 'noop' | 'dry-run';

interface ApplyProof {
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

// ============================================================================
// Helper functions (could be extracted to src/proof/rollback-validator.ts)
// ============================================================================

/**
 * Check if `full` SHA starts with `maybePrefix`
 */
function isShaPrefixOf(full: string, maybePrefix: string): boolean {
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
function parseRevertSha(cmd: string): string | null {
  const trimmed = cmd.trim();

  // Disallow chaining / multiple commands / shell injection
  if (/[;&|`$()]/.test(trimmed)) return null;

  // Match: git revert [optional flags] <sha>
  // SHA must be 7-40 hex chars
  const m = trimmed.match(/^git\s+revert(?:\s+--[a-z-]+)*\s+([0-9a-f]{7,40})$/i);
  return m?.[1] ?? null;
}

/**
 * Assert that a rollback command does not use destructive git operations.
 */
function assertNonDestructiveRollback(cmd: string): void {
  const lowered = cmd.toLowerCase();

  const forbidden = [
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

  for (const bad of forbidden) {
    assert.ok(
      !lowered.includes(bad),
      `rollbackCommand contains forbidden '${bad}': ${cmd}`
    );
  }
}

// ============================================================================
// Load fixture
// ============================================================================

function loadSampleProofs(): ApplyProof[] {
  const fixturePath = path.join(
    __dirname,
    'fixtures',
    'proofs',
    'apply-proofs.sample.json'
  );

  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Fixture not found: ${fixturePath}`);
  }

  return JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
}

// ============================================================================
// Phase 4M6d Contract Tests
// ============================================================================

console.log('✅ Phase 4M6d rollback contract tests loaded');

describe('Phase 4M6d — Rollback Drill Contract', () => {
  test('Every applied proof has a valid git revert rollback command targeting finalCommitSha', () => {
    const proofs = loadSampleProofs();

    const applied = proofs.filter(p => p.outcome === 'applied');
    assert.ok(applied.length > 0, 'fixture must include at least one applied proof');

    for (const p of applied) {
      // Applied proofs MUST have finalCommitSha
      assert.ok(
        p.finalCommitSha,
        `applied proof '${p.planItemId}' must include finalCommitSha`
      );

      // Applied proofs MUST have rollbackCommand
      assert.ok(
        p.rollbackCommand,
        `applied proof '${p.planItemId}' must include rollbackCommand`
      );

      // Rollback must be non-destructive
      assertNonDestructiveRollback(p.rollbackCommand!);

      // Parse and validate the revert SHA
      const revertSha = parseRevertSha(p.rollbackCommand!);
      assert.ok(
        revertSha,
        `rollbackCommand must match 'git revert <sha>': ${p.rollbackCommand}`
      );

      // Revert SHA must match finalCommitSha (prefix is OK)
      assert.ok(
        isShaPrefixOf(p.finalCommitSha!, revertSha),
        `rollback sha '${revertSha}' must match finalCommitSha '${p.finalCommitSha}'`
      );
    }
  });

  test('Non-applied outcomes must not claim a revert of a non-existent commit', () => {
    const proofs = loadSampleProofs();

    for (const p of proofs) {
      if (p.outcome !== 'applied') {
        // If rollbackCommand exists on non-applied, it must NOT be executable
        if (p.rollbackCommand && p.rollbackCommand.trim() !== '') {
          const revertSha = parseRevertSha(p.rollbackCommand);
          assert.ok(
            !revertSha,
            `non-applied proof '${p.planItemId || p.outcome}' must not include executable revert: ${p.rollbackCommand}`
          );
        }
      }
    }
  });

  test('Rollback command must be a single command (no chaining)', () => {
    const proofs = loadSampleProofs();

    for (const p of proofs) {
      if (p.rollbackCommand && p.rollbackCommand.trim() !== '') {
        const cmd = p.rollbackCommand;

        // Check for shell chaining operators
        assert.ok(
          !/[;&|]/.test(cmd),
          `rollbackCommand must not contain shell chaining: ${cmd}`
        );

        // Check for subshell/command substitution
        assert.ok(
          !/[`$()]/.test(cmd),
          `rollbackCommand must not contain subshell syntax: ${cmd}`
        );
      }
    }
  });

  test('Rollback SHA length is standardized (10 chars for readability)', () => {
    const proofs = loadSampleProofs();
    const applied = proofs.filter(p => p.outcome === 'applied');

    for (const p of applied) {
      const revertSha = parseRevertSha(p.rollbackCommand!);
      assert.ok(revertSha, `Applied proof must have parseable rollback`);

      // Standardized length: exactly 10 chars (short SHA for readability + uniqueness)
      assert.equal(
        revertSha!.length,
        10,
        `rollback SHA should be 10 chars for standardization, got ${revertSha!.length}: ${revertSha}`
      );
    }
  });

  test('Forbidden destructive commands are rejected', () => {
    // Test the validator directly with known-bad commands
    const badCommands = [
      'git reset --hard HEAD~1',
      'git checkout -- .',
      'git clean -fd',
      'git push --force origin main',
      'rm -rf /',
      'del /f /q *',
      'git revert abc1234 && rm -rf .',
      'git revert abc1234; git push --force',
    ];

    for (const cmd of badCommands) {
      assert.throws(
        () => assertNonDestructiveRollback(cmd),
        /rollbackCommand contains forbidden/,
        `Should reject destructive command: ${cmd}`
      );
    }
  });

  test('Shell injection patterns are rejected by parser', () => {
    // These should all return null from parseRevertSha
    const injectionPatterns = [
      'git revert abc1234; rm -rf /',
      'git revert abc1234 && malicious',
      'git revert abc1234 | cat /etc/passwd',
      'git revert $(cat secret)',
      'git revert `whoami`',
      'git revert abc1234 (subshell)',
    ];

    for (const cmd of injectionPatterns) {
      const result = parseRevertSha(cmd);
      assert.equal(
        result,
        null,
        `Should reject injection pattern: ${cmd}`
      );
    }
  });

  test('Valid revert commands are accepted', () => {
    // These should all parse successfully
    const validCommands = [
      { cmd: 'git revert abc1234567', expectedSha: 'abc1234567' },
      { cmd: 'git revert 843da9cf64', expectedSha: '843da9cf64' },
      { cmd: 'git revert --no-edit abc1234567', expectedSha: 'abc1234567' },
      { cmd: 'git revert 843da9cf649dbcde0ee103d407d2ae0e3d3985f6', expectedSha: '843da9cf649dbcde0ee103d407d2ae0e3d3985f6' },
    ];

    for (const { cmd, expectedSha } of validCommands) {
      const result = parseRevertSha(cmd);
      assert.equal(
        result,
        expectedSha,
        `Should parse valid command: ${cmd}`
      );
    }
  });
});
