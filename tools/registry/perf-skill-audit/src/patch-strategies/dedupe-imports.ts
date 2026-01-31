/**
 * Dedupe Imports Strategy (Phase 4M4a - Tier 0)
 *
 * Normalizes imports to a single module path and removes duplicates.
 * Preserves specifier order and formatting.
 *
 * Safety guarantees:
 * - Only removes truly duplicate imports (same module, same specifiers)
 * - Preserves side-effect imports (import 'module')
 * - Preserves import order for remaining imports
 * - Never modifies non-import code
 */

import type { Finding } from '../scanners/types.js';
import type {
    BuildPatchResult,
    CanApplyResult,
    PatchEvidence,
    PatchIntegrityResult,
    PatchStrategy,
} from './types.js';

interface ParsedImport {
  line: number;
  text: string;
  modulePath: string;
  specifiers: string[];
  isDefault: boolean;
  isNamespace: boolean;
  isSideEffect: boolean;
}

/**
 * Parse an import statement
 */
function parseImport(line: string, lineNum: number): ParsedImport | null {
  const sideEffectMatch = line.match(/^import\s+['"]([^'"]+)['"]\s*;?\s*$/);
  if (sideEffectMatch) {
    return {
      line: lineNum,
      text: line,
      modulePath: sideEffectMatch[1],
      specifiers: [],
      isDefault: false,
      isNamespace: false,
      isSideEffect: true,
    };
  }

  // Match: import Default from 'module'
  const defaultMatch = line.match(/^import\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/);
  if (defaultMatch) {
    return {
      line: lineNum,
      text: line,
      modulePath: defaultMatch[2],
      specifiers: [defaultMatch[1]],
      isDefault: true,
      isNamespace: false,
      isSideEffect: false,
    };
  }

  // Match: import * as Namespace from 'module'
  const namespaceMatch = line.match(/^import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/);
  if (namespaceMatch) {
    return {
      line: lineNum,
      text: line,
      modulePath: namespaceMatch[2],
      specifiers: [namespaceMatch[1]],
      isDefault: false,
      isNamespace: true,
      isSideEffect: false,
    };
  }

  // Match: import { a, b } from 'module'
  const namedMatch = line.match(/^import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/);
  if (namedMatch) {
    const specifiers = namedMatch[1]
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    return {
      line: lineNum,
      text: line,
      modulePath: namedMatch[2],
      specifiers,
      isDefault: false,
      isNamespace: false,
      isSideEffect: false,
    };
  }

  // Match: import Default, { a, b } from 'module'
  const mixedMatch = line.match(
    /^import\s+(\w+)\s*,\s*\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/
  );
  if (mixedMatch) {
    const specifiers = [
      mixedMatch[1],
      ...mixedMatch[2]
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    ];
    return {
      line: lineNum,
      text: line,
      modulePath: mixedMatch[3],
      specifiers,
      isDefault: true,
      isNamespace: false,
      isSideEffect: false,
    };
  }

  return null;
}

/**
 * Normalize module path to canonical form
 */
function normalizeModulePath(path: string): string {
  // Remove trailing index
  let normalized = path.replace(/\/index$/, '');
  // Normalize path separators
  normalized = normalized.replace(/\\/g, '/');
  return normalized;
}

/**
 * Find duplicate imports in file
 */
function findDuplicateImports(content: string): Map<string, ParsedImport[]> {
  const lines = content.split('\n');
  const importsByModule = new Map<string, ParsedImport[]>();

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseImport(lines[i].trim(), i);
    if (parsed) {
      const normalized = normalizeModulePath(parsed.modulePath);
      const existing = importsByModule.get(normalized) || [];
      existing.push(parsed);
      importsByModule.set(normalized, existing);
    }
  }

  // Filter to only modules with duplicates
  const duplicates = new Map<string, ParsedImport[]>();
  for (const [module, imports] of importsByModule) {
    if (imports.length > 1) {
      duplicates.set(module, imports);
    }
  }

  return duplicates;
}

/**
 * Merge duplicate imports into a single import statement
 */
function mergeImports(imports: ParsedImport[], modulePath: string): string {
  const allSpecifiers = new Set<string>();
  let hasDefault = false;
  let defaultName = '';
  let hasNamespace = false;
  let namespaceName = '';

  for (const imp of imports) {
    if (imp.isSideEffect) {
      // Keep side-effect imports as-is, don't merge
      continue;
    }
    if (imp.isNamespace) {
      hasNamespace = true;
      namespaceName = imp.specifiers[0];
    } else if (imp.isDefault && imp.specifiers.length > 0) {
      hasDefault = true;
      defaultName = imp.specifiers[0];
      // Add remaining specifiers (for mixed imports)
      imp.specifiers.slice(1).forEach(s => allSpecifiers.add(s));
    } else {
      imp.specifiers.forEach(s => allSpecifiers.add(s));
    }
  }

  // Build merged import
  const parts: string[] = [];

  if (hasNamespace) {
    return `import * as ${namespaceName} from '${modulePath}';`;
  }

  if (hasDefault) {
    parts.push(defaultName);
  }

  if (allSpecifiers.size > 0) {
    const sorted = Array.from(allSpecifiers).sort();
    if (hasDefault) {
      parts.push(`{ ${sorted.join(', ')} }`);
    } else {
      return `import { ${sorted.join(', ')} } from '${modulePath}';`;
    }
  }

  if (parts.length === 0) {
    return `import '${modulePath}';`;
  }

  return `import ${parts.join(', ')} from '${modulePath}';`;
}

export const dedupeImportsStrategy: PatchStrategy = {
  id: 'dedupe-imports',
  name: 'Deduplicate imports',
  risk: 'low',
  tier: 0,
  handlesKinds: ['duplicate-import'],

  canApply(finding: Finding, fileContent: string): CanApplyResult {
    // Must be the correct kind
    if (finding.kind !== 'duplicate-import') {
      return { ok: false, reason: 'Finding is not duplicate-import kind' };
    }

    // Must be .ts or .tsx file
    if (!finding.file.endsWith('.ts') && !finding.file.endsWith('.tsx')) {
      return { ok: false, reason: 'File is not TypeScript/TSX' };
    }

    // Find actual duplicates
    const duplicates = findDuplicateImports(fileContent);
    if (duplicates.size === 0) {
      return { ok: false, reason: 'No duplicate imports found' };
    }

    // Check for namespace imports - too risky to merge
    for (const imports of duplicates.values()) {
      const hasNamespace = imports.some(i => i.isNamespace);
      const hasOther = imports.some(i => !i.isNamespace && !i.isSideEffect);
      if (hasNamespace && hasOther) {
        return { ok: false, reason: 'Cannot merge namespace import with named imports' };
      }
    }

    // Priority score check
    if ((finding.priorityScore ?? 0) < 70) {
      return { ok: false, reason: 'Priority score below threshold (70)' };
    }

    return { ok: true };
  },

  buildPatch(finding: Finding, fileContent: string): BuildPatchResult {
    const lines = fileContent.split('\n');
    const duplicates = findDuplicateImports(fileContent);

    const evidence: PatchEvidence[] = [];
    const deletedLines: number[] = [];
    const patchLines: string[] = [`--- a/${finding.file}`, `+++ b/${finding.file}`];

    for (const [modulePath, imports] of duplicates) {
      // Sort by line number
      imports.sort((a, b) => a.line - b.line);

      // First import location gets the merged version
      const firstImport = imports[0];
      const merged = mergeImports(imports, modulePath);

      // Mark all but first for deletion
      for (let i = 1; i < imports.length; i++) {
        deletedLines.push(imports[i].line);
        evidence.push({
          line: imports[i].line + 1,
          snippet: imports[i].text,
          before: imports[i].text,
          after: '(deleted)',
        });
      }

      // Add evidence for the merge
      evidence.push({
        line: firstImport.line + 1,
        snippet: merged,
        before: firstImport.text,
        after: merged,
      });

      // Build hunk for this module
      patchLines.push(`@@ -${firstImport.line + 1},1 +${firstImport.line + 1},1 @@`);
      patchLines.push(`-${firstImport.text}`);
      patchLines.push(`+${merged}`);
    }

    // Add deletion hunks
    for (const lineNum of deletedLines.sort((a, b) => b - a)) {
      patchLines.push(`@@ -${lineNum + 1},1 +${lineNum + 1},0 @@`);
      patchLines.push(`-${lines[lineNum]}`);
    }

    return {
      patch: patchLines.join('\n'),
      evidence,
      deletedLines,
    };
  },

  verifyPatchIntegrity(
    finding: Finding,
    originalContent: string,
    patchedContent: string
  ): PatchIntegrityResult {
    const originalLines = originalContent.split('\n');
    const patchedLines = patchedContent.split('\n');

    // Should have fewer lines (removed duplicates)
    if (patchedLines.length >= originalLines.length) {
      return {
        valid: false,
        reason: 'Expected fewer lines after deduplication',
      };
    }

    // Count imports before and after
    const originalImports = originalLines.filter(l => l.trim().startsWith('import '));
    const patchedImports = patchedLines.filter(l => l.trim().startsWith('import '));

    // Should have fewer import statements
    if (patchedImports.length >= originalImports.length) {
      return {
        valid: false,
        reason: 'Expected fewer import statements after deduplication',
      };
    }

    // Non-import code should be unchanged
    const originalNonImport = originalLines.filter(l => !l.trim().startsWith('import '));
    const patchedNonImport = patchedLines.filter(l => !l.trim().startsWith('import '));

    if (originalNonImport.join('\n') !== patchedNonImport.join('\n')) {
      return {
        valid: false,
        reason: 'Non-import code was modified',
      };
    }

    return {
      valid: true,
      diffStats: {
        additions: 0,
        deletions: originalLines.length - patchedLines.length,
        changedFiles: 1,
      },
    };
  },
};

export default dedupeImportsStrategy;
