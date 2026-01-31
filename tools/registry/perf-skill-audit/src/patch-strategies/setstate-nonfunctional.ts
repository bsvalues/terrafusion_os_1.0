/**
 * SetState Non-Functional Strategy (Phase 4M6a - Tier 0)
 *
 * Transforms non-functional setState calls to functional updater pattern.
 * This is a safe Tier 0 strategy because:
 * - No new imports needed
 * - No hook insertion
 * - Single expression transform (local, same callsite)
 * - Semantically equivalent (functional updater is always correct)
 *
 * TRANSFORMS:
 *   setCount(count + 1)   → setCount(prev => prev + 1)
 *   setValue(value - 1)   → setValue(prev => prev - 1)
 *   setOpen(!open)        → setOpen(prev => !prev)
 *
 * REJECTS (becomes review-only):
 *   setCount(count + delta)   // non-literal RHS
 *   setCount(count += 1)      // mutation operator
 *   setCount(++count)         // mutation operator
 *   setCount(fn(count))       // call expression in arg
 *   setCount(prev => prev+1)  // already functional
 */

import type { Finding } from '../scanners/types.js';
import type {
    BuildPatchResult,
    CanApplyResult,
    PatchEvidence,
    PatchIntegrityResult,
    PatchStrategy,
} from './types.js';

// ============================================================================
// SEMANTIC GUARDS (Tier 0 safety checks)
// ============================================================================

/**
 * Semantic guard identifiers for proof trail
 */
export type SemanticGuard =
  | 'arg-not-functional'
  | 'binary-id-op-literal'
  | 'unary-not-identifier'
  | 'setter-and-state-identifier-match'
  | 'no-mutations'
  | 'no-calls-in-arg'
  | 'single-setter-call-arg';

/**
 * Result of analyzing a setState call
 */
export interface SetStateAnalysis {
  ok: boolean;
  reason?: string;
  guardsPassed: SemanticGuard[];
  guardsFailed?: SemanticGuard[];
  // If ok=true, these are populated
  setterName?: string;
  stateVarName?: string;
  operator?: string;
  operand?: string;
  transformType?: 'binary' | 'unary-not';
  originalExpr?: string;
  transformedExpr?: string;
}

/**
 * Supported binary operators for Tier 0
 */
const SUPPORTED_BINARY_OPS = new Set([
  '+',
  '-',
  '*',
  '/',
  '%',
  '**',
  '<<',
  '>>',
  '>>>',
  '&',
  '|',
  '^',
]);

/**
 * Mutation operators to reject
 */
const MUTATION_OPS = ['+=', '-=', '*=', '/=', '%=', '++', '--', '='];

/**
 * Regex to detect setter pattern: setXxx(...)
 */
const SETTER_PATTERN = /^set[A-Z][a-zA-Z0-9]*$/;

/**
 * Analyze a setState call expression for Tier 0 eligibility
 *
 * Uses simple pattern matching (not full AST) because:
 * 1. Evidence snippets are single-line
 * 2. Patterns are constrained enough to be regex-safe
 * 3. Any edge case fails to review-only (safe default)
 */
export function analyzeSetStateCall(snippet: string): SetStateAnalysis {
  const guardsPassed: SemanticGuard[] = [];
  const guardsFailed: SemanticGuard[] = [];

  // Clean the snippet
  const cleanSnippet = snippet.trim().replace(/;$/, '');

  // Extract setter call: setXxx(...arg...)
  const callMatch = cleanSnippet.match(/^(\w+)\s*\(\s*(.*)\s*\)$/);
  if (!callMatch) {
    return {
      ok: false,
      reason: 'Not a valid function call pattern',
      guardsPassed,
      guardsFailed: ['single-setter-call-arg'],
    };
  }

  const [, setterName, argContent] = callMatch;

  // Guard: Must be a setter pattern (setXxx)
  if (!SETTER_PATTERN.test(setterName)) {
    return {
      ok: false,
      reason: `Not a setState setter pattern: ${setterName}`,
      guardsPassed,
      guardsFailed: ['setter-and-state-identifier-match'],
    };
  }

  // Infer state variable name: setCount -> count, setIsOpen -> isOpen
  const stateVarName = setterName.replace(/^set/, '');
  const lowercaseStateVar = stateVarName.charAt(0).toLowerCase() + stateVarName.slice(1);

  guardsPassed.push('single-setter-call-arg');

  // Guard: Already functional? (arrow function or function expression)
  if (argContent.includes('=>') || argContent.startsWith('function')) {
    guardsFailed.push('arg-not-functional');
    return {
      ok: false,
      reason: 'Already uses functional updater pattern',
      guardsPassed,
      guardsFailed,
    };
  }
  guardsPassed.push('arg-not-functional');

  // Guard: No mutation operators
  for (const mutOp of MUTATION_OPS) {
    if (argContent.includes(mutOp)) {
      guardsFailed.push('no-mutations');
      return {
        ok: false,
        reason: `Contains mutation operator: ${mutOp}`,
        guardsPassed,
        guardsFailed,
      };
    }
  }
  guardsPassed.push('no-mutations');

  // Guard: No call expressions in argument (too complex for Tier 0)
  // Simple heuristic: look for function-call-like patterns that aren't the outer call
  const hasNestedCalls = /\w+\s*\([^)]*\)/.test(argContent);
  if (hasNestedCalls) {
    guardsFailed.push('no-calls-in-arg');
    return {
      ok: false,
      reason: 'Contains nested function calls',
      guardsPassed,
      guardsFailed,
    };
  }
  guardsPassed.push('no-calls-in-arg');

  // Try to match Pattern 1: Unary NOT (e.g., !open, !isVisible)
  const unaryNotMatch = argContent.match(/^!(\w+)$/);
  if (unaryNotMatch) {
    const [, identifier] = unaryNotMatch;
    // Guard: identifier must match inferred state var
    if (identifier !== lowercaseStateVar && identifier !== stateVarName) {
      guardsFailed.push('setter-and-state-identifier-match');
      return {
        ok: false,
        reason: `State variable mismatch: expected ${lowercaseStateVar}, got ${identifier}`,
        guardsPassed,
        guardsFailed,
      };
    }
    guardsPassed.push('unary-not-identifier', 'setter-and-state-identifier-match');
    return {
      ok: true,
      guardsPassed,
      setterName,
      stateVarName: identifier,
      operator: '!',
      transformType: 'unary-not',
      originalExpr: argContent,
      transformedExpr: 'prev => !prev',
    };
  }

  // Try to match Pattern 2: Binary operation (e.g., count + 1, value - 1)
  // Pattern: identifier op literal OR literal op identifier
  const binaryMatch = argContent.match(
    /^(\w+)\s*([+\-*/%&|^]+)\s*([0-9]+(?:\.[0-9]+)?|0x[0-9a-fA-F]+)$/
  );
  if (binaryMatch) {
    const [, identifier, op, literal] = binaryMatch;

    // Guard: operator must be supported
    if (!SUPPORTED_BINARY_OPS.has(op)) {
      guardsFailed.push('binary-id-op-literal');
      return {
        ok: false,
        reason: `Unsupported operator: ${op}`,
        guardsPassed,
        guardsFailed,
      };
    }

    // Guard: identifier must match inferred state var
    if (identifier !== lowercaseStateVar && identifier !== stateVarName) {
      guardsFailed.push('setter-and-state-identifier-match');
      return {
        ok: false,
        reason: `State variable mismatch: expected ${lowercaseStateVar}, got ${identifier}`,
        guardsPassed,
        guardsFailed,
      };
    }

    guardsPassed.push('binary-id-op-literal', 'setter-and-state-identifier-match');
    return {
      ok: true,
      guardsPassed,
      setterName,
      stateVarName: identifier,
      operator: op,
      operand: literal,
      transformType: 'binary',
      originalExpr: argContent,
      transformedExpr: `prev => prev ${op} ${literal}`,
    };
  }

  // Pattern not recognized - reject to review-only
  return {
    ok: false,
    reason: `Pattern not recognized as Tier 0 safe: ${argContent}`,
    guardsPassed,
    guardsFailed: ['binary-id-op-literal', 'unary-not-identifier'],
  };
}

// ============================================================================
// PATCH STRATEGY
// ============================================================================

export const setstateNonfunctionalStrategy: PatchStrategy = {
  id: 'setstate-nonfunctional',
  name: 'Convert to functional updater',
  risk: 'low',
  tier: 0,
  handlesKinds: ['setstate-nonfunctional'],

  canApply(finding: Finding, fileContent: string): CanApplyResult {
    // Must be correct kind
    if (finding.kind !== 'setstate-nonfunctional') {
      return { ok: false, reason: 'Finding is not setstate-nonfunctional kind' };
    }

    // Must be .ts or .tsx file
    if (!finding.file.endsWith('.ts') && !finding.file.endsWith('.tsx')) {
      return { ok: false, reason: 'File is not TypeScript/TSX' };
    }

    // Must have evidence
    if (!finding.evidence || finding.evidence.length === 0) {
      return { ok: false, reason: 'No evidence for transformation' };
    }

    // Priority score check (70 threshold for auto-fix)
    if ((finding.priorityScore ?? 0) < 70) {
      return { ok: false, reason: 'Priority score below threshold (70)' };
    }

    // Analyze the setState call
    const evidence = finding.evidence[0];
    const analysis = analyzeSetStateCall(evidence.snippet);

    if (!analysis.ok) {
      return { ok: false, reason: analysis.reason };
    }

    return { ok: true };
  },

  buildPatch(finding: Finding, fileContent: string): BuildPatchResult {
    const evidence = finding.evidence[0];
    const line = evidence.line;
    const analysis = analyzeSetStateCall(evidence.snippet);

    if (!analysis.ok || !analysis.transformedExpr || !analysis.setterName) {
      throw new Error(`Cannot build patch: ${analysis.reason}`);
    }

    // Normalize line endings to Unix-style for patch compatibility
    const normalizedContent = fileContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Get original line
    const lines = normalizedContent.split('\n');
    const originalLine = lines[line - 1];

    // Build the transformed call
    const originalCall = evidence.snippet.trim();
    const transformedCall = `${analysis.setterName}(${analysis.transformedExpr})`;

    // Replace in the line
    const patchedLine = originalLine.replace(originalCall, transformedCall);

    // Calculate context lines
    const hasContextBefore = line > 1;
    const hasContextAfter = line < lines.length;
    const contextCount = (hasContextBefore ? 1 : 0) + 1 + (hasContextAfter ? 1 : 0);
    const startLine = hasContextBefore ? line - 1 : line;

    // Build unified diff with proper hunk header
    const patchLines: string[] = [
      `--- a/${finding.file}`,
      `+++ b/${finding.file}`,
      `@@ -${startLine},${contextCount} +${startLine},${contextCount} @@`,
    ];

    // Context before
    if (hasContextBefore) {
      patchLines.push(` ${lines[line - 2]}`);
    }

    // The change
    patchLines.push(`-${originalLine}`);
    patchLines.push(`+${patchedLine}`);

    // Context after
    if (hasContextAfter) {
      patchLines.push(` ${lines[line]}`);
    }

    const patchEvidence: PatchEvidence[] = [
      {
        line,
        snippet: transformedCall,
        before: originalCall,
        after: transformedCall,
        varName: analysis.stateVarName,
      },
    ];

    // Join with newlines and ensure trailing newline for git apply
    return {
      patch: patchLines.join('\n') + '\n',
      evidence: patchEvidence,
    };
  },

  verifyPatchIntegrity(
    finding: Finding,
    originalContent: string,
    patchedContent: string
  ): PatchIntegrityResult {
    const originalLines = originalContent.split('\n');
    const patchedLines = patchedContent.split('\n');

    // Line count should be identical (we're replacing, not adding)
    if (originalLines.length !== patchedLines.length) {
      return {
        valid: false,
        reason: `Line count changed: ${originalLines.length} → ${patchedLines.length}`,
      };
    }

    // Only one line should differ
    let diffCount = 0;
    let diffLine = -1;
    for (let i = 0; i < originalLines.length; i++) {
      if (originalLines[i] !== patchedLines[i]) {
        diffCount++;
        diffLine = i + 1;
      }
    }

    if (diffCount === 0) {
      return { valid: false, reason: 'No changes detected' };
    }

    if (diffCount > 1) {
      return { valid: false, reason: `Too many lines changed: ${diffCount}` };
    }

    // The changed line should contain functional updater pattern
    const changedLine = patchedLines[diffLine - 1];
    if (!changedLine.includes('=>')) {
      return {
        valid: false,
        reason: 'Changed line does not contain arrow function',
      };
    }

    return {
      valid: true,
      diffStats: {
        additions: 1,
        deletions: 1,
        changedFiles: 1,
      },
    };
  },
};

/**
 * Get semantic guards for a finding (for ApplyProof)
 */
export function getSemanticGuards(finding: Finding): string[] {
  if (!finding.evidence || finding.evidence.length === 0) {
    return [];
  }
  const analysis = analyzeSetStateCall(finding.evidence[0].snippet);
  return analysis.guardsPassed;
}

/**
 * Get transformation summary for ApplyProof
 */
export function getTransformationSummary(finding: Finding): string | null {
  if (!finding.evidence || finding.evidence.length === 0) {
    return null;
  }
  const analysis = analyzeSetStateCall(finding.evidence[0].snippet);
  if (!analysis.ok || !analysis.originalExpr || !analysis.transformedExpr || !analysis.setterName) {
    return null;
  }
  return `${analysis.setterName}(${analysis.originalExpr}) -> ${analysis.setterName}(${analysis.transformedExpr})`;
}

export default setstateNonfunctionalStrategy;
