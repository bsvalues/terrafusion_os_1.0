/**
 * Waterfall Parallelize Strategy (Tier 1)
 *
 * Converts sequential await statements to Promise.all() when safe.
 *
 * SAFETY INVARIANTS:
 * - Only applies to safe-parallel findings
 * - Same function scope required
 * - No writes/mutations between awaits
 * - No await uses result of previous await (dependency check)
 * - No try/catch boundaries that change semantics
 * - Preserves variable names (no _res1/_res2 fallback)
 *
 * GOVERNANCE: Phase 4M4c Tier 1 Strategy
 */

import type { Finding } from '../scanners/types.js';
import type {
    BuildPatchResult,
    CanApplyResult,
    PatchEvidence,
    PatchIntegrityResult,
    PatchStrategy,
} from './types.js';

/**
 * Parse an await statement to extract variable name and expression
 */
interface ParsedAwait {
  line: number;
  fullLine: string;
  varName: string | null;
  declarationType: 'const' | 'let' | 'var' | 'assignment' | 'bare';
  awaitExpression: string;
  leadingWhitespace: string;
}

/**
 * Parse a line containing an await statement
 */
function parseAwaitLine(line: string, lineNumber: number): ParsedAwait | null {
  const trimmed = line.trim();
  const leadingWhitespace = line.match(/^(\s*)/)?.[1] || '';

  // Match: const/let/var varName = await expression;
  const declMatch = trimmed.match(/^(const|let|var)\s+(\w+)\s*=\s*await\s+(.+?);?\s*$/);
  if (declMatch) {
    return {
      line: lineNumber,
      fullLine: line,
      varName: declMatch[2],
      declarationType: declMatch[1] as 'const' | 'let' | 'var',
      awaitExpression: declMatch[3].replace(/;$/, ''),
      leadingWhitespace,
    };
  }

  // Match: varName = await expression; (assignment)
  const assignMatch = trimmed.match(/^(\w+)\s*=\s*await\s+(.+?);?\s*$/);
  if (assignMatch) {
    return {
      line: lineNumber,
      fullLine: line,
      varName: assignMatch[1],
      declarationType: 'assignment',
      awaitExpression: assignMatch[2].replace(/;$/, ''),
      leadingWhitespace,
    };
  }

  // Match: await expression; (bare, no variable assignment)
  const bareMatch = trimmed.match(/^await\s+(.+?);?\s*$/);
  if (bareMatch) {
    return {
      line: lineNumber,
      fullLine: line,
      varName: null,
      declarationType: 'bare',
      awaitExpression: bareMatch[1].replace(/;$/, ''),
      leadingWhitespace,
    };
  }

  return null;
}

/**
 * Check if an expression references any of the given variable names
 */
function referencesVariable(expression: string, varNames: string[]): boolean {
  // Create word boundary regex for each variable
  for (const varName of varNames) {
    const regex = new RegExp(`\\b${varName}\\b`);
    if (regex.test(expression)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if there are mutations between two lines
 * Looks for assignments, increments, decrements, method calls that mutate
 */
function hasMutationsBetween(lines: string[], startLine: number, endLine: number): boolean {
  for (let i = startLine; i < endLine; i++) {
    const line = lines[i]?.trim() || '';

    // Skip empty lines and comments
    if (!line || line.startsWith('//') || line.startsWith('/*')) continue;

    // Skip the await lines themselves
    if (line.includes('await')) continue;

    // Look for assignments (=, +=, -=, etc.) that aren't declarations
    if (/\w+\s*[+\-*/%&|^]?=(?!=)/.test(line) && !/^(const|let|var)\s/.test(line)) {
      return true;
    }

    // Look for increment/decrement
    if (/\+\+|--/.test(line)) {
      return true;
    }

    // Look for array mutations (.push, .pop, .shift, etc.)
    if (/\.(push|pop|shift|unshift|splice|sort|reverse|fill)\s*\(/.test(line)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if there's a try/catch boundary that would change semantics
 */
function hasTryCatchBoundary(lines: string[], startLine: number, endLine: number): boolean {
  let tryDepth = 0;

  for (let i = startLine; i <= endLine; i++) {
    const line = lines[i]?.trim() || '';

    if (/\btry\s*\{/.test(line)) tryDepth++;
    if (/\bcatch\s*\(/.test(line) || /\bfinally\s*\{/.test(line)) {
      if (tryDepth > 0) tryDepth--;
    }

    // If we have unbalanced try/catch in the range, semantics change
    if (/\btry\s*\{/.test(line) || /\bcatch\s*\(/.test(line)) {
      // Check if the try/catch isn't fully contained
      return true;
    }
  }

  return tryDepth !== 0;
}

/**
 * Build Promise.all transformation
 */
function buildPromiseAllPatch(
  parsedAwaits: ParsedAwait[],
  leadingWhitespace: string,
  declarationType: 'const' | 'let' = 'const'
): string[] {
  const lines: string[] = [];

  // Build the destructuring pattern
  const varNames = parsedAwaits.map(p => p.varName).filter((v): v is string => v !== null);
  const expressions = parsedAwaits.map(p => p.awaitExpression);

  if (varNames.length === 0) {
    // All bare awaits - just wrap in Promise.all
    lines.push(`${leadingWhitespace}await Promise.all([`);
    for (let i = 0; i < expressions.length; i++) {
      const comma = i < expressions.length - 1 ? ',' : '';
      lines.push(`${leadingWhitespace}  ${expressions[i]}${comma}`);
    }
    lines.push(`${leadingWhitespace}]);`);
  } else if (varNames.length === parsedAwaits.length) {
    // All have variable names - use destructuring
    lines.push(
      `${leadingWhitespace}${declarationType} [${varNames.join(', ')}] = await Promise.all([`
    );
    for (let i = 0; i < expressions.length; i++) {
      const comma = i < expressions.length - 1 ? ',' : '';
      lines.push(`${leadingWhitespace}  ${expressions[i]}${comma}`);
    }
    lines.push(`${leadingWhitespace}]);`);
  } else {
    // Mixed - not supported for safety
    return [];
  }

  return lines;
}

/**
 * Waterfall Parallelize Strategy
 */
export const waterfallParallelizeStrategy: PatchStrategy = {
  id: 'waterfall-parallelize',
  name: 'Waterfall → Promise.all()',
  risk: 'medium',
  tier: 1,
  handlesKinds: ['safe-parallel'],

  canApply(finding: Finding, fileContent: string): CanApplyResult {
    // Must be safe-parallel kind
    if (finding.kind !== 'safe-parallel') {
      return { ok: false, reason: 'Not a safe-parallel finding' };
    }

    // Must have evidence with line numbers
    if (!finding.evidence || finding.evidence.length < 2) {
      return { ok: false, reason: 'Need at least 2 sequential awaits' };
    }

    // Must have line boundaries
    if (!finding.lineStart || !finding.lineEnd) {
      return { ok: false, reason: 'Missing line boundaries' };
    }

    // Parse the file
    const lines = fileContent.split('\n');

    // Parse all await statements from evidence
    const parsedAwaits: ParsedAwait[] = [];
    for (const e of finding.evidence) {
      const parsed = parseAwaitLine(e.snippet, e.line);
      if (!parsed) {
        return { ok: false, reason: `Cannot parse await at line ${e.line}` };
      }
      parsedAwaits.push(parsed);
    }

    // Check for variable name requirement: ALL must have names OR NONE
    const hasVars = parsedAwaits.filter(p => p.varName !== null).length;
    if (hasVars > 0 && hasVars < parsedAwaits.length) {
      return { ok: false, reason: 'Mixed variable/bare awaits not supported' };
    }

    // Check for dependency: no await expression can reference a prior variable
    const priorVarNames: string[] = [];
    for (const parsed of parsedAwaits) {
      if (referencesVariable(parsed.awaitExpression, priorVarNames)) {
        return {
          ok: false,
          reason: `Await at line ${parsed.line} depends on prior await result`,
        };
      }
      if (parsed.varName) {
        priorVarNames.push(parsed.varName);
      }
    }

    // Check for mutations between awaits
    const firstLine = Math.min(...parsedAwaits.map(p => p.line)) - 1; // 0-indexed
    const lastLine = Math.max(...parsedAwaits.map(p => p.line)) - 1;
    if (hasMutationsBetween(lines, firstLine, lastLine)) {
      return { ok: false, reason: 'Mutations between awaits detected' };
    }

    // Check for try/catch boundaries
    if (hasTryCatchBoundary(lines, firstLine, lastLine)) {
      return { ok: false, reason: 'try/catch boundary would change semantics' };
    }

    // Priority threshold
    if ((finding.priorityScore ?? 0) < 70) {
      return { ok: false, reason: 'Priority score below threshold (70)' };
    }

    return { ok: true };
  },

  buildPatch(finding: Finding, fileContent: string): BuildPatchResult {
    const lines = fileContent.split('\n');

    // Parse awaits again (safe because canApply passed)
    const parsedAwaits: ParsedAwait[] = [];
    for (const e of finding.evidence) {
      const parsed = parseAwaitLine(e.snippet, e.line);
      if (parsed) parsedAwaits.push(parsed);
    }

    if (parsedAwaits.length === 0) {
      return { patch: '', evidence: [] };
    }

    // Get leading whitespace from first await
    const leadingWhitespace = parsedAwaits[0].leadingWhitespace;

    // Determine declaration type (prefer const)
    const hasLet = parsedAwaits.some(p => p.declarationType === 'let');
    const declarationType = hasLet ? 'let' : 'const';

    // Build the Promise.all version
    const newLines = buildPromiseAllPatch(parsedAwaits, leadingWhitespace, declarationType);
    if (newLines.length === 0) {
      return { patch: '', evidence: [] };
    }

    // Build unified diff
    const firstLine = Math.min(...parsedAwaits.map(p => p.line));
    const lastLine = Math.max(...parsedAwaits.map(p => p.line));
    const originalLines = parsedAwaits.map(p => p.fullLine);

    const diffLines: string[] = [
      `--- a/${finding.file}`,
      `+++ b/${finding.file}`,
      `@@ -${firstLine},${originalLines.length} +${firstLine},${newLines.length} @@`,
    ];

    for (const line of originalLines) {
      diffLines.push(`-${line}`);
    }
    for (const line of newLines) {
      diffLines.push(`+${line}`);
    }

    // Build evidence
    const evidence: PatchEvidence[] = parsedAwaits.map(p => ({
      line: p.line,
      snippet: p.fullLine,
      before: p.fullLine,
      after: newLines.join('\n'),
      varName: p.varName || undefined,
    }));

    return {
      patch: diffLines.join('\n'),
      evidence,
      insertLine: firstLine,
      deletedLines: parsedAwaits.map(p => p.line),
    };
  },

  verifyPatchIntegrity(
    finding: Finding,
    originalContent: string,
    patchedContent: string
  ): PatchIntegrityResult {
    // Verify the patched content has Promise.all
    if (!patchedContent.includes('Promise.all')) {
      return { valid: false, reason: 'Patched content missing Promise.all' };
    }

    // Count await statements before and after
    const originalAwaits = (originalContent.match(/\bawait\b/g) || []).length;
    const patchedAwaits = (patchedContent.match(/\bawait\b/g) || []).length;

    // Should have fewer individual awaits (merged into one)
    if (patchedAwaits >= originalAwaits) {
      return { valid: false, reason: 'Await count did not decrease' };
    }

    // Check balanced braces
    const openBraces = (patchedContent.match(/\{/g) || []).length;
    const closeBraces = (patchedContent.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      return { valid: false, reason: 'Unbalanced braces after patch' };
    }

    // Check balanced brackets
    const openBrackets = (patchedContent.match(/\[/g) || []).length;
    const closeBrackets = (patchedContent.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      return { valid: false, reason: 'Unbalanced brackets after patch' };
    }

    return {
      valid: true,
      diffStats: {
        additions: 1,
        deletions:
          (originalContent.match(/\n/g) || []).length -
          (patchedContent.match(/\n/g) || []).length +
          1,
        changedFiles: 1,
      },
    };
  },
};
