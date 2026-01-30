/**
 * Gate 2: Workbench Extension Compliance
 *
 * Spec Reference: docs/architecture/specs/terrafusion/01_PROPERTY_WORKBENCH_SPEC_v3.1.md
 * ADR Reference: docs/architecture/specs/terrafusion/adr/ADR-0001_PROPERTY_WORKBENCH_TIER0.md
 *
 * Validates:
 * - Canonical tab slugs (summary|forge|atlas|dais|dossier|pilot)
 * - Canonical route pattern (/property/:parcelId[/tab])
 * - No suite-owned parcel routes outside Workbench
 *
 * Usage: node scripts/spec-gates/workbench-compliance.mjs
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { extname, join } from 'path';

// Canonical tab slugs per spec
const CANONICAL_TABS = ['summary', 'forge', 'atlas', 'dais', 'dossier', 'pilot'];

// Canonical route pattern
const CANONICAL_ROUTE_PATTERN = /\/property\/:parcelId/;

// Forbidden route patterns (suite-owned parcel routes)
const FORBIDDEN_ROUTE_PATTERNS = [
  // Direct parcel routes outside /property/
  /\/forge\/parcel\//i,
  /\/atlas\/parcel\//i,
  /\/dais\/parcel\//i,
  /\/dossier\/parcel\//i,
  /\/valuation\/parcel\//i,
  /\/gis\/parcel\//i,

  // Legacy patterns that should redirect
  /\/parcels\/\:id(?![a-z])/i,
  /\/parcel\/\:parcelId(?!\/)/i,
];

// File extensions to scan
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Directories to skip
const SKIP_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '__tests__',
  'test',
  // Legacy/archive directories - not enforced
  'Archive',
  'archive',
  'Dev',
  'legacy',
  'deprecated',
];

// Directory patterns to skip (regex match on path)
const SKIP_PATTERNS = [
  /\.archived$/i,
  /backup/i,
  // Backend/API routing files - Gate 2 is UI Workbench compliance only
  /(^|[\\\/])(backend|server|api|services)([\\\/]|$)/i,
  /(^|[\\\/])(core-routes|routes|router)\.(ts|js)x?$/i,
];

// UI route line heuristics - only flag lines that look like frontend route declarations
function isUiRouteLine(line) {
  const s = line.trim();
  return (
    s.includes('<Route') ||
    /\bpath\s*:\s*["'`]/.test(s) ||
    /\bpath\s*=\s*["'`]/.test(s) ||
    /create(Browser|Hash|Memory)?Router/.test(s) ||
    /createRoutesFromElements/.test(s)
  );
}

function walkDir(dir, callback) {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filepath = join(dir, file);
      try {
        const stat = statSync(filepath);
        if (stat.isDirectory()) {
          // Skip by name
          if (SKIP_DIRS.includes(file)) continue;
          // Skip by pattern match on filepath
          if (SKIP_PATTERNS.some(p => p.test(filepath))) continue;
          walkDir(filepath, callback);
        } else if (stat.isFile()) {
          callback(filepath);
        }
      } catch (e) {
        // Skip files we can't stat
      }
    }
  } catch (e) {
    // Skip directories we can't read
  }
}

function scanForRoutes(filepath) {
  const ext = extname(filepath).toLowerCase();
  if (!SCAN_EXTENSIONS.includes(ext)) return [];

  // Skip backend/API files at file level too
  if (SKIP_PATTERNS.some(p => p.test(filepath))) return [];

  try {
    const content = readFileSync(filepath, 'utf8');
    const lines = content.split('\n');
    const violations = [];

    lines.forEach((line, index) => {
      // Only check lines that look like UI route declarations
      if (!isUiRouteLine(line)) return;

      // Check for forbidden route patterns
      for (const pattern of FORBIDDEN_ROUTE_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({
            file: filepath,
            line: index + 1,
            type: 'forbidden_route',
            content: line.trim().substring(0, 100),
            pattern: pattern.toString(),
          });
        }
      }

      // Check for non-canonical tab slugs in Workbench context
      const tabMatch = line.match(/slug:\s*['"]([^'"]+)['"]/);
      if (tabMatch && line.toLowerCase().includes('workbench')) {
        const slug = tabMatch[1];
        if (!CANONICAL_TABS.includes(slug)) {
          violations.push({
            file: filepath,
            line: index + 1,
            type: 'non_canonical_tab',
            content: `slug: "${slug}"`,
            expected: CANONICAL_TABS.join('|'),
          });
        }
      }
    });

    return violations;
  } catch (e) {
    return [];
  }
}

function checkSpecsExist() {
  const specsPath = process.env.SPECS_PATH || 'docs/architecture/specs/terrafusion';
  const workbenchSpec = join(process.cwd(), specsPath, '01_PROPERTY_WORKBENCH_SPEC_v3.1.md');

  if (!existsSync(workbenchSpec)) {
    console.log('⚠️  Warning: Workbench spec not found at expected location');
    console.log(`   Expected: ${workbenchSpec}`);
    return false;
  }
  return true;
}

// Main execution
console.log('🔍 Gate 2: Workbench Extension Compliance');
console.log('=========================================');
console.log('');

// Check specs exist
const specsExist = checkSpecsExist();
if (specsExist) {
  console.log('✅ Spec file found');
}

console.log('Scanning for route compliance...');
console.log('');

const allViolations = [];
const startDir = process.cwd();

walkDir(startDir, filepath => {
  const violations = scanForRoutes(filepath);
  allViolations.push(...violations);
});

if (allViolations.length > 0) {
  console.log('❌ Workbench Compliance FAILED');
  console.log('');
  console.log(`Found ${allViolations.length} violation(s):`);
  console.log('');

  for (const v of allViolations.slice(0, 15)) {
    const relPath = v.file.replace(startDir, '').replace(/^[\\\/]/, '');
    console.log(`  ${relPath}:${v.line}`);
    console.log(`    Type: ${v.type}`);
    console.log(`    Found: ${v.content}`);
    if (v.expected) {
      console.log(`    Expected: ${v.expected}`);
    }
    console.log('');
  }

  if (allViolations.length > 15) {
    console.log(`  ... and ${allViolations.length - 15} more violations`);
  }

  console.log('');
  console.log(
    '📚 Reference: docs/architecture/specs/terrafusion/01_PROPERTY_WORKBENCH_SPEC_v3.1.md'
  );
  console.log(
    '   ADR: docs/architecture/specs/terrafusion/adr/ADR-0001_PROPERTY_WORKBENCH_TIER0.md'
  );
  console.log('');
  console.log('   Canonical tabs: summary | forge | atlas | dais | dossier | pilot');
  console.log('   Canonical route: /property/:parcelId[/tab]');

  process.exit(1);
} else {
  console.log('✅ Workbench Compliance PASSED');
  console.log('   No forbidden routes or non-canonical tabs found');
  process.exit(0);
}
