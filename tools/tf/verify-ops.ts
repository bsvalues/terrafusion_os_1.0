#!/usr/bin/env node
/**
 * tf verify-ops — Shadow write detector
 *
 * Scans the backend C# source for direct SaveChangesAsync() calls
 * that appear outside officially sanctioned data service files.
 *
 * Sanctioned callers: files whose name ends in Service.cs, Repository.cs,
 * Interceptor.cs, DbContext.cs, or DbContextFactory.cs.
 * Everything else is a shadow write candidate.
 *
 * Exit codes:
 *   0 — no shadow writes detected
 *   1 — shadow write patterns detected
 *
 * Usage: npx tsx tools/tf/verify-ops.ts [--src <path>]
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve, relative } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(__dirname, '../..');
const DEFAULT_SRC = join(REPO_ROOT, 'backend', 'src');

const args = process.argv.slice(2);
const srcIdx = args.indexOf('--src');
const BACKEND_SRC = srcIdx >= 0 ? resolve(args[srcIdx + 1]) : DEFAULT_SRC;

// Sanctioned file name suffixes — these are allowed to call SaveChangesAsync
const SANCTIONED_SUFFIXES = [
  'Service.cs',
  'Repository.cs',
  'Interceptor.cs',
  'DbContext.cs',
  'DbContextFactory.cs',
  'TerraFusionDbContext.cs',
  'SeedData.cs',
  'Seeder.cs',
  'Migration.cs',
];

const SAVE_CHANGES_PATTERN = /SaveChangesAsync\s*\(/;

// ---------------------------------------------------------------------------
// Scanner
// ---------------------------------------------------------------------------

function walkBackend(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (['obj', 'bin', 'Migrations', '.git'].includes(entry)) continue;
      walkBackend(full, files);
    } else if (entry.endsWith('.cs') && !entry.includes('.Designer.')) {
      files.push(full);
    }
  }
  return files;
}

function isSanctioned(filePath: string): boolean {
  const name = filePath.split(/[/\\]/).pop() ?? '';
  return SANCTIONED_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

interface ShadowWriteResult {
  file: string;
  lineNumbers: number[];
}

function scanCsFile(filePath: string): ShadowWriteResult | null {
  if (isSanctioned(filePath)) return null;

  const lines = readFileSync(filePath, 'utf-8').split('\n');
  const hits: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (SAVE_CHANGES_PATTERN.test(lines[i])) {
      hits.push(i + 1);
    }
  }

  if (hits.length === 0) return null;

  return {
    file: relative(REPO_ROOT, filePath),
    lineNumbers: hits,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  console.log(`🔍 tf verify-ops — scanning ${BACKEND_SRC}`);

  const srcStat = statSync(BACKEND_SRC, { throwIfNoEntry: false } as Parameters<typeof statSync>[1]);
  if (!srcStat?.isDirectory()) {
    console.error(`❌ Backend source directory not found: ${BACKEND_SRC}`);
    process.exit(1);
  }

  const files = walkBackend(BACKEND_SRC);
  const shadowWrites: ShadowWriteResult[] = [];

  for (const f of files) {
    const result = scanCsFile(f);
    if (result) shadowWrites.push(result);
  }

  if (shadowWrites.length === 0) {
    console.log('✅ No shadow writes detected — all SaveChangesAsync calls are in sanctioned service files.');
    process.exit(0);
  }

  console.log(`\n⚠️  Shadow write candidates — ${shadowWrites.length} file(s) call SaveChangesAsync outside sanctioned paths:\n`);
  for (const s of shadowWrites) {
    console.log(`  ${s.file}`);
    console.log(`    Lines: ${s.lineNumbers.join(', ')}`);
  }

  console.log('\n❌ verify-ops failed. Review flagged files — mutations must route through registered service layer.');
  process.exit(1);
}

main();
