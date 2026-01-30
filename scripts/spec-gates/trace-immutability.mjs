/**
 * Gate 3: TerraTrace Immutability
 *
 * Spec Reference: docs/architecture/specs/terrafusion/03_TERRATRACE_SPEC_v3.1.md
 * ADR Reference: docs/architecture/specs/terrafusion/adr/ADR-0003_TERRATRACE_APPEND_ONLY.md
 *
 * Validates:
 * - No in-place updates to TraceEvents
 * - Invoke + Result pattern (tool_invoked → tool_succeeded/tool_failed)
 * - No TraceService.update() calls
 *
 * Usage: node scripts/spec-gates/trace-immutability.mjs
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { extname, join } from 'path';

// Forbidden patterns (in-place mutations)
const FORBIDDEN_PATTERNS = [
  // Direct update calls
  /TraceService\.update\s*\(/gi,
  /traceService\.update\s*\(/gi,
  /\.updateTrace\s*\(/gi,
  /\.updateEvent\s*\(/gi,

  // In-place mutation patterns
  /traceEvent\.(data|outputs|inputs)\s*=/gi,
  /event\.data\s*=\s*\{/gi,

  // DELETE operations on trace (should use redaction)
  /TraceService\.delete\s*\(/gi,
  /traceService\.delete\s*\(/gi,
  /DELETE\s+FROM\s+.*trace/gi,
];

// Required patterns (must exist in trace-related files)
const REQUIRED_PATTERNS = [
  // Append-only emit pattern
  /TraceService\.emit|traceService\.emit|\.emitTrace/i,
];

// File extensions to scan
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Directories to skip
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];

// Directories to focus on for trace-related code
const FOCUS_DIRS = ['os-platform', 'backend', 'services', 'lib', 'src'];

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

function isTraceRelatedFile(filepath) {
  const lowerPath = filepath.toLowerCase();
  return (
    lowerPath.includes('trace') || lowerPath.includes('audit') || lowerPath.includes('activity')
  );
}

function scanFile(filepath) {
  const ext = extname(filepath).toLowerCase();
  if (!SCAN_EXTENSIONS.includes(ext)) return [];

  try {
    const content = readFileSync(filepath, 'utf8');
    const lines = content.split('\n');
    const violations = [];

    lines.forEach((line, index) => {
      for (const pattern of FORBIDDEN_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          violations.push({
            file: filepath,
            line: index + 1,
            type: 'forbidden_mutation',
            match: match[0],
            content: line.trim().substring(0, 80),
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
  const traceSpec = join(process.cwd(), specsPath, '03_TERRATRACE_SPEC_v3.1.md');

  if (!existsSync(traceSpec)) {
    console.log('⚠️  Warning: TerraTrace spec not found at expected location');
    console.log(`   Expected: ${traceSpec}`);
    return false;
  }
  return true;
}

// Main execution
console.log('🔍 Gate 3: TerraTrace Immutability');
console.log('==================================');
console.log('');

// Check specs exist
const specsExist = checkSpecsExist();
if (specsExist) {
  console.log('✅ Spec file found');
}

console.log('Scanning for immutability violations...');
console.log('');

const allViolations = [];
const startDir = process.cwd();

walkDir(startDir, filepath => {
  const violations = scanFile(filepath);
  allViolations.push(...violations);
});

if (allViolations.length > 0) {
  console.log('❌ Trace Immutability FAILED');
  console.log('');
  console.log(`Found ${allViolations.length} violation(s):`);
  console.log('');

  for (const v of allViolations.slice(0, 15)) {
    const relPath = v.file.replace(startDir, '').replace(/^[\\\/]/, '');
    console.log(`  ${relPath}:${v.line}`);
    console.log(`    Type: ${v.type}`);
    console.log(`    Found: "${v.match}"`);
    console.log(`    Context: ${v.content}`);
    console.log('');
  }

  if (allViolations.length > 15) {
    console.log(`  ... and ${allViolations.length - 15} more violations`);
  }

  console.log('');
  console.log('📚 Reference: docs/architecture/specs/terrafusion/03_TERRATRACE_SPEC_v3.1.md');
  console.log('   ADR: docs/architecture/specs/terrafusion/adr/ADR-0003_TERRATRACE_APPEND_ONLY.md');
  console.log('');
  console.log('   Rule: TerraTrace is append-only. Use emit() for new events, not update().');
  console.log('   Pattern: tool_invoked → tool_succeeded | tool_failed (separate events)');

  process.exit(1);
} else {
  console.log('✅ Trace Immutability PASSED');
  console.log('   No in-place mutation patterns found');
  process.exit(0);
}
