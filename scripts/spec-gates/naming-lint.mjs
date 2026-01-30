/**
 * Gate 1: Naming Lint (Scoped to Identifiers)
 *
 * Spec Reference: docs/architecture/specs/terrafusion/ADR-0001..0004
 *
 * SCOPE: Only checks identifiers in code/manifests, not prose.
 *   - Code files: .ts, .tsx, .js, .jsx, .cs, .rs
 *   - Manifests: terrafusion.app.json, schema*.json, package.json
 *   - Docs: Only code blocks and headings (not body text)
 *
 * BASELINE: If tools/spec-gates/naming-lint.baseline.txt exists,
 *   only NEW violations not in baseline cause failure.
 *
 * Usage:
 *   node scripts/spec-gates/naming-lint.mjs           # Check for violations
 *   node scripts/spec-gates/naming-lint.mjs --baseline # Generate baseline
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { basename, dirname, extname, join } from 'path';

// ============================================================================
// Configuration
// ============================================================================

const BASELINE_PATH = 'tools/spec-gates/naming-lint.baseline.txt';
const GENERATE_BASELINE = process.argv.includes('--baseline');

// Forbidden patterns for SUITE/PRODUCT identifiers
const FORBIDDEN_PATTERNS = [
  // Tara misspellings
  {
    pattern: /\bTara(?:Fusion|Forge|Atlas|Dais|Dossier|Pilot|Trace|Levy|PILT|GPT)\b/gi,
    name: 'Tara misspelling',
  },
  { pattern: /\bTaraFusion\b/gi, name: 'Tara misspelling' },

  // Space variants (should be PascalCase)
  { pattern: /\bTerra\s+Fusion\b/gi, name: 'Space variant' },
  { pattern: /\bTerra\s+Forge\b/gi, name: 'Space variant' },
  { pattern: /\bTerra\s+Atlas\b/gi, name: 'Space variant' },
  { pattern: /\bTerra\s+Dais\b/gi, name: 'Space variant' },
  { pattern: /\bTerra\s+Dossier\b/gi, name: 'Space variant' },
  { pattern: /\bTerra\s+Pilot\b/gi, name: 'Space variant' },
  { pattern: /\bTerra\s+Trace\b/gi, name: 'Space variant' },
  { pattern: /\bTerra\s+Levy\b/gi, name: 'Space variant' },
  { pattern: /\bTerra\s+PILT\b/gi, name: 'Space variant' },
  { pattern: /\bTerra\s+GPT\b/gi, name: 'Space variant' },

  // Dash variants with capital after dash
  { pattern: /\bTerra-Fusion\b/g, name: 'Dash variant' },
  { pattern: /\bTerra-Forge\b/g, name: 'Dash variant' },
  { pattern: /\bTerra-Atlas\b/g, name: 'Dash variant' },
  { pattern: /\bTerra-Dais\b/g, name: 'Dash variant' },
  { pattern: /\bTerra-Dossier\b/g, name: 'Dash variant' },
  { pattern: /\bTerra-Pilot\b/g, name: 'Dash variant' },
  { pattern: /\bTerra-Trace\b/g, name: 'Dash variant' },
  { pattern: /\bTerra-Levy\b/g, name: 'Dash variant' },
];

// HIGH-SIGNAL file patterns (check entire file)
const IDENTIFIER_FILE_PATTERNS = [
  /terrafusion\.app\.json$/i,
  /schema.*\.json$/i,
  /package\.json$/i,
  /manifest\.json$/i,
  /\.csproj$/i,
  /Cargo\.toml$/i,
];

// Code files (check entire file for identifiers)
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.cs', '.rs', '.py'];

// Markdown files (check only code blocks + headings)
const MARKDOWN_EXTENSIONS = ['.md'];

// Directories to always skip
const SKIP_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '__pycache__',
  'obj',
  'bin',
];

// Files to always skip
const SKIP_FILES = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'Cargo.lock'];

// ============================================================================
// Baseline Support
// ============================================================================

function loadBaseline() {
  const baselinePath = join(process.cwd(), BASELINE_PATH);
  if (!existsSync(baselinePath)) {
    return new Set();
  }
  const content = readFileSync(baselinePath, 'utf8');
  return new Set(content.split('\n').filter(line => line.trim()));
}

function saveBaseline(violations) {
  const baselinePath = join(process.cwd(), BASELINE_PATH);
  const dir = dirname(baselinePath);

  // Ensure directory exists
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const lines = violations.map(v => formatViolationKey(v)).sort();
  writeFileSync(baselinePath, lines.join('\n') + '\n');
  console.log(`✅ Baseline written to ${BASELINE_PATH}`);
  console.log(`   ${lines.length} violations baselined`);
}

function formatViolationKey(v) {
  const relPath = v.file
    .replace(process.cwd(), '')
    .replace(/^[\\\/]/, '')
    .replace(/\\/g, '/');
  return `${relPath}:${v.line}:${v.match}`;
}

// ============================================================================
// File Scanning
// ============================================================================

function shouldScanFile(filepath) {
  const filename = basename(filepath);
  const ext = extname(filepath).toLowerCase();

  // Skip lock files
  if (SKIP_FILES.includes(filename)) return false;

  // High-signal manifest files
  for (const pattern of IDENTIFIER_FILE_PATTERNS) {
    if (pattern.test(filepath)) return 'full';
  }

  // Code files
  if (CODE_EXTENSIONS.includes(ext)) return 'full';

  // Markdown (code blocks + headings only)
  if (MARKDOWN_EXTENSIONS.includes(ext)) return 'markdown';

  return false;
}

function scanCodeFile(filepath) {
  try {
    const content = readFileSync(filepath, 'utf8');
    const lines = content.split('\n');
    const violations = [];

    lines.forEach((line, index) => {
      for (const { pattern, name } of FORBIDDEN_PATTERNS) {
        // Reset lastIndex for global patterns
        pattern.lastIndex = 0;
        const match = line.match(pattern);
        if (match) {
          violations.push({
            file: filepath,
            line: index + 1,
            column: line.indexOf(match[0]) + 1,
            match: match[0],
            type: name,
          });
        }
      }
    });

    return violations;
  } catch (e) {
    return [];
  }
}

function scanMarkdownFile(filepath) {
  try {
    const content = readFileSync(filepath, 'utf8');
    const lines = content.split('\n');
    const violations = [];
    let inCodeBlock = false;

    lines.forEach((line, index) => {
      // Track code blocks
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return;
      }

      // Only scan code blocks and headings
      const isHeading = line.trim().startsWith('#');
      if (!inCodeBlock && !isHeading) return;

      for (const { pattern, name } of FORBIDDEN_PATTERNS) {
        pattern.lastIndex = 0;
        const match = line.match(pattern);
        if (match) {
          violations.push({
            file: filepath,
            line: index + 1,
            column: line.indexOf(match[0]) + 1,
            match: match[0],
            type: name,
            context: inCodeBlock ? 'code block' : 'heading',
          });
        }
      }
    });

    return violations;
  } catch (e) {
    return [];
  }
}

function walkDir(dir, callback) {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filepath = join(dir, file);
      try {
        const stat = statSync(filepath);
        if (stat.isDirectory()) {
          if (!SKIP_DIRS.includes(file)) {
            walkDir(filepath, callback);
          }
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

// ============================================================================
// Main Execution
// ============================================================================

console.log('🔍 Gate 1: Naming Lint (Scoped)');
console.log('===============================');
console.log('');

const allViolations = [];
const startDir = process.cwd();

walkDir(startDir, filepath => {
  const scanType = shouldScanFile(filepath);
  if (!scanType) return;

  const violations = scanType === 'markdown' ? scanMarkdownFile(filepath) : scanCodeFile(filepath);

  allViolations.push(...violations);
});

// Generate baseline mode
if (GENERATE_BASELINE) {
  console.log(`Found ${allViolations.length} violations to baseline.`);
  saveBaseline(allViolations);
  process.exit(0);
}

// Load baseline and filter
const baseline = loadBaseline();
const baselineCount = baseline.size;
const newViolations = allViolations.filter(v => !baseline.has(formatViolationKey(v)));

console.log(`Scope: Code files + manifests + MD code blocks/headings`);
console.log(
  `Baseline: ${baselineCount > 0 ? `${baselineCount} known issues` : 'none (all violations reported)'}`
);
console.log('');

if (newViolations.length > 0) {
  console.log('❌ Naming Lint FAILED');
  console.log('');
  console.log(`Found ${newViolations.length} NEW violation(s):`);
  if (baselineCount > 0) {
    console.log(`(${allViolations.length - newViolations.length} baselined violations ignored)`);
  }
  console.log('');

  for (const v of newViolations.slice(0, 20)) {
    const relPath = v.file.replace(startDir, '').replace(/^[\\\/]/, '');
    console.log(`  ${relPath}:${v.line}:${v.column}`);
    console.log(`    Found: "${v.match}" (${v.type})`);
    if (v.context) console.log(`    Context: ${v.context}`);
    console.log('');
  }

  if (newViolations.length > 20) {
    console.log(`  ... and ${newViolations.length - 20} more violations`);
  }

  console.log('');
  console.log('📚 Reference: docs/architecture/specs/terrafusion/README.md');
  console.log(
    '   Canonical: TerraFusion, TerraForge, TerraAtlas, TerraDais, TerraDossier, TerraPilot, TerraTrace'
  );
  console.log('');
  console.log(
    '💡 To baseline current violations: node scripts/spec-gates/naming-lint.mjs --baseline'
  );

  process.exit(1);
} else {
  console.log('✅ Naming Lint PASSED');
  if (baselineCount > 0) {
    console.log(`   ${baselineCount} baselined issues exist (fix when convenient)`);
  } else {
    console.log('   No forbidden naming variants found');
  }
  process.exit(0);
}
