#!/usr/bin/env node
/**
 * tf sweep — TerraTrace drift detection
 *
 * Scans the frontend source tree for files that import or call
 * mutation-related dispatch functions (osActions dispatch, TruthGate
 * validateOperation) and checks that they also call emitIntent /
 * emitResult.
 *
 * Exit codes:
 *   0 — no drift detected
 *   1 — drift detected (mutation sites missing trace pairing)
 *
 * Usage: npx tsx tools/tf/sweep.ts [--src <path>]
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve, relative } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const DEFAULT_SRC = join(REPO_ROOT, 'frontend', 'apps', 'os-shell', 'src');

const args = process.argv.slice(2);
const srcIdx = args.indexOf('--src');
const SRC_ROOT = srcIdx >= 0 ? resolve(args[srcIdx + 1]) : DEFAULT_SRC;

// Patterns that indicate a file is performing a mutation through the spine
const MUTATION_PATTERNS = [
  /dispatch\s*\(/,
  /validateOperation\s*\(/,
  /emitTraceEvent\s*\(/,
  /emitCanonTrace\s*\(/,
];

// Patterns that indicate a file has paired trace calls
const INTENT_PATTERN = /emitIntent\s*\(/;
const RESULT_PATTERN = /emitResult\s*\(/;

// ---------------------------------------------------------------------------
// Scanner
// ---------------------------------------------------------------------------

function walkSrc(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (['node_modules', '__tests__', 'dist', '.cache'].includes(entry)) continue;
      walkSrc(full, files);
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

interface DriftResult {
  file: string;
  hasMutation: boolean;
  hasIntent: boolean;
  hasResult: boolean;
}

function scanFile(filePath: string): DriftResult | null {
  const content = readFileSync(filePath, 'utf-8');
  const hasMutation = MUTATION_PATTERNS.some((p) => p.test(content));
  if (!hasMutation) return null;

  const hasIntent = INTENT_PATTERN.test(content);
  const hasResult = RESULT_PATTERN.test(content);

  // Only flag as drift if mutation exists but pairing is absent
  if (hasIntent && hasResult) return null;

  return {
    file: relative(REPO_ROOT, filePath),
    hasMutation: true,
    hasIntent,
    hasResult,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const EXCLUDED_FILES = [
  'terraTrace.ts',
  'osActions.ts',
  'truthGate.ts',
];

function main(): void {
  console.log(`🔍 tf sweep — scanning ${SRC_ROOT}`);

  const srcStat = statSync(SRC_ROOT, { throwIfNoEntry: false } as Parameters<typeof statSync>[1]);
  if (!srcStat?.isDirectory()) {
    console.error(`❌ Source directory not found: ${SRC_ROOT}`);
    process.exit(1);
  }

  const files = walkSrc(SRC_ROOT);
  const driftFiles: DriftResult[] = [];

  for (const f of files) {
    const name = f.split(/[/\\]/).pop() ?? '';
    if (EXCLUDED_FILES.includes(name)) continue;

    const result = scanFile(f);
    if (result) driftFiles.push(result);
  }

  if (driftFiles.length === 0) {
    console.log('✅ No drift detected — all mutation sites have paired trace calls.');
    process.exit(0);
  }

  console.log(`\n⚠️  Drift detected — ${driftFiles.length} file(s) have mutations without emitIntent/emitResult:\n`);
  for (const d of driftFiles) {
    const missing: string[] = [];
    if (!d.hasIntent) missing.push('emitIntent');
    if (!d.hasResult) missing.push('emitResult');
    console.log(`  ${d.file}`);
    console.log(`    Missing: ${missing.join(', ')}`);
  }

  console.log('\n❌ Sweep failed. Add paired emitIntent/emitResult calls to flagged files.');
  process.exit(1);
}

main();
