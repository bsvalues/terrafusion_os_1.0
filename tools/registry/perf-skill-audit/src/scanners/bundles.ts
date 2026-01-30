/**
 * Bundles Scanner (Phase 4M1)
 * Detects barrel imports, bundle amplifiers, and import anti-patterns
 * Rule: 1.2 - Bundle Size / Barrel Imports (CRITICAL)
 *
 * Classifications:
 * - barrel-import: Import from barrel/index file (auto-fixable)
 * - barrel-file: Index with many re-exports (review-only)
 * - heavy-import: Known large library import (review-only)
 * - duplicate-import: Same module via multiple paths (auto-fixable)
 * - dynamic-candidate: Could use dynamic import (review-only)
 */

import { BundleKind, EvidenceItem, Finding, ScanContext, Scanner } from './types.js';

const RULE_ID_BARREL = 'bundle.barrel-import';
const RULE_ID_BARREL_EXPORT = 'bundle.barrel-file';
const RULE_ID_HEAVY = 'bundle.heavy-import';
const SEVERITY = 'critical' as const;

// Pragma to suppress bundle detection
const IGNORE_PRAGMA = 'perf-skill:ignore-bundle';

// Shell/pilot paths get priority boost
const HIGH_PRIORITY_PATHS = [
  'os-platform/core/pilot',
  'os-platform/core/types',
  'tools/registry',
  'frontend-v2/shell',
];

// Known heavy libraries that should use selective imports
const HEAVY_LIBRARIES = [
  {
    pattern: /from\s+['"]lodash['"]/,
    name: 'lodash',
    suggestion: "Use 'lodash-es' with tree-shaking or import { fn } from 'lodash/fn'",
  },
  {
    pattern: /from\s+['"]moment['"]/,
    name: 'moment',
    suggestion: "Use 'date-fns' or 'dayjs' instead",
  },
  {
    pattern: /from\s+['"]@mui\/material['"]/,
    name: '@mui/material',
    suggestion: "Import from '@mui/material/Component'",
  },
  { pattern: /from\s+['"]antd['"]/, name: 'antd', suggestion: "Import from 'antd/lib/Component'" },
  {
    pattern: /from\s+['"]recharts['"]/,
    name: 'recharts',
    suggestion: "Import specific components: import { LineChart } from 'recharts'",
  },
];

// Barrel directory patterns (likely to be barrel imports)
const BARREL_DIRECTORY_PATTERNS = [
  /\/(components|utils|hooks|lib|shared|ui|helpers|services|stores)$/i,
  /\/@terrafusion\/[^/]+$/,
  /\/src$/,
];

export const bundlesScanner: Scanner = {
  name: 'bundles',
  description: 'Detect barrel imports, heavy libraries, and bundle amplifiers (Phase 4M1)',

  scan(content: string, filePath: string, ctx: ScanContext): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');
    const isIndexFile = filePath.endsWith('index.ts') || filePath.endsWith('index.tsx');

    // Track imports for duplicate detection
    const importedModules = new Map<string, { line: number; path: string; imports: string[] }[]>();

    // Check for barrel exports in index files (barrel-file)
    if (isIndexFile) {
      const reexportLines: EvidenceItem[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/export\s+(?:\*|\{[^}]+\})\s+from/.test(line)) {
          reexportLines.push({
            line: i + 1,
            snippet: line.trim(),
          });
        }
      }

      if (reexportLines.length >= 5) {
        const priorityScore = calculatePriorityScore(filePath, 'barrel-file', reexportLines.length);

        findings.push({
          severity: SEVERITY,
          rule: RULE_ID_BARREL_EXPORT,
          file: filePath,
          lineStart: reexportLines[0].line,
          lineEnd: reexportLines[reexportLines.length - 1].line,
          message: `Barrel file with ${reexportLines.length} re-exports. Forces bundlers to include all exports.`,
          snippet: `${reexportLines.length} export statements in index file`,
          suggestedFix:
            'Consider direct imports from source files. Remove barrel pattern or split into smaller modules.',
          kind: 'barrel-file' as BundleKind,
          priorityScore,
          evidence: reexportLines.slice(0, 5), // First 5 for evidence
        });
      }
    }

    // Scan all imports line by line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

      // Check for pragma
      const prevLine = i > 0 ? lines[i - 1] : '';
      if (line.includes(IGNORE_PRAGMA) || prevLine.includes(IGNORE_PRAGMA)) continue;

      // Check for heavy library imports (heavy-import)
      for (const lib of HEAVY_LIBRARIES) {
        if (lib.pattern.test(line)) {
          const priorityScore = calculatePriorityScore(filePath, 'heavy-import', 1);

          findings.push({
            severity: SEVERITY,
            rule: RULE_ID_HEAVY,
            file: filePath,
            lineStart: lineNum,
            lineEnd: lineNum,
            message: `Heavy library import: '${lib.name}' pulls large bundle. ${lib.suggestion}`,
            snippet: line.trim(),
            suggestedFix: lib.suggestion,
            kind: 'heavy-import' as BundleKind,
            importPath: lib.name,
            priorityScore,
            evidence: [{ line: lineNum, snippet: line.trim() }],
          });
          break; // Only one finding per line
        }
      }

      // Check for barrel imports (imports from directories)
      const importMatch = line.match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const importNames = importMatch[1]
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        const importPath = importMatch[2];

        // Track for duplicate detection
        const normalizedPath = normalizeImportPath(importPath);
        if (!importedModules.has(normalizedPath)) {
          importedModules.set(normalizedPath, []);
        }
        importedModules.get(normalizedPath)!.push({
          line: lineNum,
          path: importPath,
          imports: importNames,
        });

        // Barrel import detection
        const looksLikeBarrel =
          (importPath.startsWith('@/') ||
            importPath.startsWith('./') ||
            importPath.startsWith('../') ||
            importPath.startsWith('@terrafusion/')) &&
          !importPath.match(/\.(ts|tsx|js|jsx|json|css|scss|mjs|cjs)$/) &&
          !importPath.includes('/index');

        if (looksLikeBarrel) {
          const isHighRisk = BARREL_DIRECTORY_PATTERNS.some(p => p.test(importPath));

          if (importNames.length >= 3 || isHighRisk) {
            const priorityScore = calculatePriorityScore(
              filePath,
              'barrel-import',
              importNames.length
            );

            findings.push({
              severity: SEVERITY,
              rule: RULE_ID_BARREL,
              file: filePath,
              lineStart: lineNum,
              lineEnd: lineNum,
              message: `Barrel import from '${importPath}' with ${importNames.length} items. May pull entire module tree.`,
              snippet: line.trim(),
              suggestedFix: generateDirectImportFix(importPath, importNames),
              kind: 'barrel-import' as BundleKind,
              importPath,
              priorityScore,
              evidence: [{ line: lineNum, snippet: line.trim() }],
            });
          }
        }
      }
    }

    // Detect duplicate imports (same normalized module via different paths)
    for (const [normalizedPath, occurrences] of importedModules) {
      if (occurrences.length >= 2) {
        // Multiple imports to same module
        const uniquePaths = new Set(occurrences.map(o => o.path));
        if (uniquePaths.size >= 2) {
          // Different paths to same module = duplicate-import
          const priorityScore = calculatePriorityScore(
            filePath,
            'duplicate-import',
            occurrences.length
          );
          const evidence: EvidenceItem[] = occurrences.map(o => ({
            line: o.line,
            snippet: `import from '${o.path}'`,
          }));

          findings.push({
            severity: 'high',
            rule: 'bundle.duplicate-import',
            file: filePath,
            lineStart: occurrences[0].line,
            lineEnd: occurrences[occurrences.length - 1].line,
            message: `Module '${normalizedPath}' imported via ${uniquePaths.size} different paths. Consolidate imports.`,
            snippet: evidence.map(e => e.snippet).join('\n'),
            suggestedFix: `Consolidate to a single import path. Prefer the canonical path.`,
            kind: 'duplicate-import' as BundleKind,
            importPath: normalizedPath,
            importChain: Array.from(uniquePaths),
            priorityScore,
            evidence,
          });
        }
      }
    }

    return findings;
  },
};

/**
 * Calculate priority score for bundle findings (0-100)
 */
function calculatePriorityScore(filePath: string, kind: BundleKind, count: number): number {
  let score = 50;

  // Shell/pilot path boost (+30)
  if (HIGH_PRIORITY_PATHS.some(p => filePath.includes(p))) {
    score += 30;
  }

  // Kind-based adjustments
  switch (kind) {
    case 'barrel-import':
      score += 15; // Auto-fixable, high value
      break;
    case 'duplicate-import':
      score += 10; // Auto-fixable
      break;
    case 'heavy-import':
      score += 5; // Usually review-only
      break;
    case 'barrel-file':
      score -= 10; // Usually review-only
      break;
  }

  // Count bonus (more items = higher impact)
  score += Math.min(20, (count - 1) * 3);

  return Math.min(100, Math.max(0, score));
}

/**
 * Normalize import path to detect duplicates
 */
function normalizeImportPath(importPath: string): string {
  // Remove leading ./ and ../ for comparison
  let normalized = importPath.replace(/^\.\.?\//, '').replace(/\/index$/, '');

  // Normalize @terrafusion aliases
  if (normalized.startsWith('@terrafusion/')) {
    normalized = normalized.replace('@terrafusion/', 'os-platform/');
  }

  return normalized;
}

/**
 * Generate direct import suggestion
 */
function generateDirectImportFix(barrelPath: string, imports: string[]): string {
  if (imports.length <= 3) {
    return imports.map(imp => `import { ${imp} } from '${barrelPath}/${imp}';`).join('\n');
  }
  return `Import directly from source files:\n${imports
    .slice(0, 3)
    .map(imp => `import { ${imp} } from '${barrelPath}/${imp}';`)
    .join('\n')}\n// ... and ${imports.length - 3} more`;
}

export default bundlesScanner;
