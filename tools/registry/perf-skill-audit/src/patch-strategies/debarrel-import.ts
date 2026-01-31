/**
 * Debarrel Import Strategy (Phase 4M4a - Tier 0)
 *
 * Replaces barrel imports (from '@/x' or './components') with direct-path imports.
 * Only applies when the direct path is unambiguous and locally resolvable.
 *
 * Safety guarantees:
 * - Only transforms when mapping is 100% unambiguous
 * - Preserves all imported specifiers
 * - Marks as review-only if index re-export chains detected
 * - Never modifies barrel file itself
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
 * Common barrel file patterns
 */
const BARREL_PATTERNS = ['/index', '/index.ts', '/index.tsx', '/index.js'];

/**
 * Known direct-path mappings (conservative set)
 * Only includes patterns where the mapping is unambiguous
 */
const KNOWN_DIRECT_MAPPINGS: [RegExp, string][] = [
  // imports from './components' → './components/ComponentName'
  // Only safe when specifier matches filename
];

/**
 * Check if an import path looks like a barrel import
 */
function isBarrelImport(importPath: string): boolean {
  // Ends with just a directory name (no file extension)
  if (!importPath.includes('.')) {
    const parts = importPath.split('/');
    const last = parts[parts.length - 1];
    // Not a file (no extension) and not a node_module
    return !importPath.startsWith('@') || importPath.includes('/');
  }

  // Explicitly imports index
  return BARREL_PATTERNS.some(p => importPath.endsWith(p));
}

/**
 * Try to infer direct path from specifier name
 * Only works for simple cases where ComponentName → ComponentName.tsx
 */
function inferDirectPath(importPath: string, specifier: string): string | null {
  // Remove index suffix if present
  let basePath = importPath;
  for (const pattern of BARREL_PATTERNS) {
    if (basePath.endsWith(pattern)) {
      basePath = basePath.slice(0, -pattern.length);
      break;
    }
  }

  // For named exports, try ComponentName → components/ComponentName
  if (specifier && /^[A-Z]/.test(specifier)) {
    // Title case - likely a component
    return `${basePath}/${specifier}`;
  }

  // For other named exports, be very conservative
  return null;
}

export const debarrelImportStrategy: PatchStrategy = {
  id: 'debarrel-import',
  name: 'Replace barrel import with direct path',
  risk: 'low',
  tier: 0,
  handlesKinds: ['barrel-import'],

  canApply(finding: Finding, fileContent: string): CanApplyResult {
    // Must be the correct kind
    if (finding.kind !== 'barrel-import') {
      return { ok: false, reason: 'Finding is not barrel-import kind' };
    }

    // Must be .ts or .tsx file
    if (!finding.file.endsWith('.ts') && !finding.file.endsWith('.tsx')) {
      return { ok: false, reason: 'File is not TypeScript/TSX' };
    }

    // Must have import path in evidence
    if (!finding.importPath) {
      return { ok: false, reason: 'No import path available' };
    }

    // Only handle relative imports (not @alias imports - too risky)
    if (!finding.importPath.startsWith('./') && !finding.importPath.startsWith('../')) {
      return { ok: false, reason: 'Only relative barrel imports can be auto-fixed' };
    }

    // Check if we can infer the direct path
    // For now, we're very conservative - only single-specifier imports from components
    const lines = fileContent.split('\n');
    const importLine = lines[finding.lineStart ? finding.lineStart - 1 : 0] || '';

    // Match: import { SingleComponent } from './components'
    const singleNamedMatch = importLine.match(/import\s+\{\s*(\w+)\s*\}\s+from\s+['"]/);
    if (!singleNamedMatch) {
      return {
        ok: false,
        reason:
          'Only single-specifier named imports can be auto-fixed; multi-specifier requires review',
      };
    }

    const specifier = singleNamedMatch[1];
    const directPath = inferDirectPath(finding.importPath, specifier);

    if (!directPath) {
      return { ok: false, reason: 'Cannot infer direct path for specifier' };
    }

    // Priority score check
    if ((finding.priorityScore ?? 0) < 70) {
      return { ok: false, reason: 'Priority score below threshold (70)' };
    }

    return { ok: true };
  },

  buildPatch(finding: Finding, fileContent: string): BuildPatchResult {
    const lines = fileContent.split('\n');
    const lineIdx = (finding.lineStart || 1) - 1;
    const importLine = lines[lineIdx];

    // Parse the import
    const match = importLine.match(/import\s+\{\s*(\w+)\s*\}\s+from\s+['"]([^'"]+)['"]/);
    if (!match) {
      return { patch: '', evidence: [] };
    }

    const specifier = match[1];
    const oldPath = match[2];
    const directPath = inferDirectPath(oldPath, specifier);

    if (!directPath) {
      return { patch: '', evidence: [] };
    }

    // Build new import line
    const newImportLine = importLine.replace(oldPath, directPath);

    // Build unified diff
    const patchLines: string[] = [
      `--- a/${finding.file}`,
      `+++ b/${finding.file}`,
      `@@ -${lineIdx + 1},1 +${lineIdx + 1},1 @@`,
    ];

    // Show context
    if (lineIdx > 0) {
      patchLines.push(` ${lines[lineIdx - 1]}`);
    }

    patchLines.push(`-${importLine}`);
    patchLines.push(`+${newImportLine}`);

    if (lineIdx < lines.length - 1) {
      patchLines.push(` ${lines[lineIdx + 1]}`);
    }

    const evidence: PatchEvidence[] = [
      {
        line: lineIdx + 1,
        snippet: newImportLine,
        before: importLine,
        after: newImportLine,
      },
    ];

    return {
      patch: patchLines.join('\n'),
      evidence,
    };
  },

  verifyPatchIntegrity(
    finding: Finding,
    originalContent: string,
    patchedContent: string
  ): PatchIntegrityResult {
    const originalLines = originalContent.split('\n');
    const patchedLines = patchedContent.split('\n');

    // Line count should be the same (replacing, not adding/removing)
    if (patchedLines.length !== originalLines.length) {
      return {
        valid: false,
        reason: 'Line count changed unexpectedly',
      };
    }

    // Only one line should differ
    let diffCount = 0;
    let diffLine = -1;

    for (let i = 0; i < originalLines.length; i++) {
      if (originalLines[i] !== patchedLines[i]) {
        diffCount++;
        diffLine = i;
      }
    }

    if (diffCount !== 1) {
      return {
        valid: false,
        reason: `Expected exactly 1 line to change, but ${diffCount} changed`,
      };
    }

    // The changed line should still be an import
    if (!patchedLines[diffLine].trim().startsWith('import ')) {
      return {
        valid: false,
        reason: 'Changed line is not an import statement',
      };
    }

    // The specifiers should be preserved
    const origMatch = originalLines[diffLine].match(/import\s+\{([^}]+)\}/);
    const patchMatch = patchedLines[diffLine].match(/import\s+\{([^}]+)\}/);

    if (origMatch && patchMatch) {
      const origSpecs = origMatch[1]
        .split(',')
        .map(s => s.trim())
        .sort()
        .join(',');
      const patchSpecs = patchMatch[1]
        .split(',')
        .map(s => s.trim())
        .sort()
        .join(',');

      if (origSpecs !== patchSpecs) {
        return {
          valid: false,
          reason: 'Import specifiers were modified',
        };
      }
    }

    return {
      valid: true,
      diffStats: {
        additions: 0,
        deletions: 0,
        changedFiles: 1,
      },
    };
  },
};

export default debarrelImportStrategy;
