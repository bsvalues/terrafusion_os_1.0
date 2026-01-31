/**
 * Missing Use Client Strategy (Phase 4M4a - Tier 0)
 *
 * Injects "use client" directive at the correct top-of-file boundary.
 * This is the safest possible transformation: adding a directive.
 *
 * Safety guarantees:
 * - Only adds directive, never modifies existing code
 * - Respects shebang lines (stays after #!)
 * - Respects leading comments (JSDoc, license headers)
 * - Never applies if "use client" or "use server" already exists
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
 * Find the correct insertion point for "use client" directive
 * Returns the line number (0-indexed) where directive should be inserted
 */
function findDirectiveInsertionPoint(lines: string[]): number {
  let insertAt = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines at the top
    if (line === '') {
      insertAt = i + 1;
      continue;
    }

    // Shebang must stay at very top
    if (line.startsWith('#!')) {
      insertAt = i + 1;
      continue;
    }

    // Single-line comments (license headers, file descriptions)
    if (line.startsWith('//')) {
      insertAt = i + 1;
      continue;
    }

    // Start of block comment
    if (line.startsWith('/*') || line.startsWith('/**')) {
      // Find end of block comment
      for (let j = i; j < lines.length; j++) {
        if (lines[j].includes('*/')) {
          insertAt = j + 1;
          break;
        }
      }
      continue;
    }

    // Within block comment
    if (line.startsWith('*')) {
      insertAt = i + 1;
      continue;
    }

    // End of block comment
    if (line.endsWith('*/')) {
      insertAt = i + 1;
      continue;
    }

    // Stop at first non-comment, non-empty line
    break;
  }

  return insertAt;
}

export const missingUseClientStrategy: PatchStrategy = {
  id: 'missing-use-client',
  name: 'Add "use client" directive',
  risk: 'low',
  tier: 0,
  handlesKinds: ['missing-use-client'],

  canApply(finding: Finding, fileContent: string): CanApplyResult {
    // Must be the correct kind
    if (finding.kind !== 'missing-use-client') {
      return { ok: false, reason: 'Finding is not missing-use-client kind' };
    }

    // Must be .ts or .tsx file
    if (!finding.file.endsWith('.ts') && !finding.file.endsWith('.tsx')) {
      return { ok: false, reason: 'File is not TypeScript/TSX' };
    }

    // Check if directive already exists
    const lines = fileContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '"use client"' || trimmed === "'use client'") {
        return { ok: false, reason: '"use client" already exists' };
      }
      if (trimmed === '"use server"' || trimmed === "'use server'") {
        return { ok: false, reason: '"use server" exists - cannot add "use client"' };
      }
    }

    // Must have evidence
    if (!finding.evidence || finding.evidence.length === 0) {
      return { ok: false, reason: 'No evidence for transformation' };
    }

    // Priority score check (70 threshold for auto-fix)
    if ((finding.priorityScore ?? 0) < 70) {
      return { ok: false, reason: 'Priority score below threshold (70)' };
    }

    return { ok: true };
  },

  buildPatch(finding: Finding, fileContent: string): BuildPatchResult {
    const lines = fileContent.split('\n');
    const insertAt = findDirectiveInsertionPoint(lines);

    // Build the directive line
    const directive = '"use client";\n';

    // Determine if we need a blank line after
    const needsBlankLine =
      insertAt < lines.length &&
      lines[insertAt].trim() !== '' &&
      !lines[insertAt].startsWith('import');

    const insertion = needsBlankLine ? directive + '\n' : directive;

    // Build unified diff
    const patchLines: string[] = [
      `--- a/${finding.file}`,
      `+++ b/${finding.file}`,
      `@@ -${insertAt + 1},0 +${insertAt + 1},${needsBlankLine ? 2 : 1} @@`,
    ];

    // Show context before insertion
    if (insertAt > 0) {
      patchLines.push(` ${lines[insertAt - 1]}`);
    }

    // Add the new line
    patchLines.push(`+"use client";`);
    if (needsBlankLine) {
      patchLines.push(`+`);
    }

    // Show context after insertion
    if (insertAt < lines.length) {
      patchLines.push(` ${lines[insertAt]}`);
    }

    const evidence: PatchEvidence[] = [
      {
        line: insertAt + 1,
        snippet: '"use client";',
        before: insertAt > 0 ? lines[insertAt - 1] : '',
        after: insertAt < lines.length ? lines[insertAt] : '',
      },
      ...(finding.evidence || []),
    ];

    return {
      patch: patchLines.join('\n'),
      evidence,
      insertLine: insertAt + 1,
    };
  },

  verifyPatchIntegrity(
    finding: Finding,
    originalContent: string,
    patchedContent: string
  ): PatchIntegrityResult {
    const originalLines = originalContent.split('\n');
    const patchedLines = patchedContent.split('\n');

    // Patched should have exactly 1-2 more lines
    const lineDiff = patchedLines.length - originalLines.length;
    if (lineDiff < 1 || lineDiff > 2) {
      return {
        valid: false,
        reason: `Unexpected line count change: ${lineDiff}`,
      };
    }

    // Must contain the directive
    const hasDirective = patchedLines.some(
      l => l.trim() === '"use client";' || l.trim() === "'use client';"
    );
    if (!hasDirective) {
      return { valid: false, reason: 'Directive not found in patched content' };
    }

    // All original lines must still exist (in order)
    let originalIdx = 0;
    for (const patchedLine of patchedLines) {
      // Skip the new directive lines
      if (patchedLine.trim() === '"use client";' || patchedLine.trim() === '') {
        continue;
      }

      if (patchedLine === originalLines[originalIdx]) {
        originalIdx++;
      }
    }

    // Should have matched all original lines
    if (originalIdx < originalLines.length - 1) {
      return {
        valid: false,
        reason: 'Original content was modified, not just appended',
      };
    }

    return {
      valid: true,
      diffStats: {
        additions: lineDiff,
        deletions: 0,
        changedFiles: 1,
      },
    };
  },
};

export default missingUseClientStrategy;
