/**
 * Repo Shape Guard – Hard Allowlist Enforcement for TerraFusion OS
 *
 * Enforces the root spine by checking tracked root entries against a
 * hard allowlist (keep-list.json). Uses `git ls-tree` for git-aware truth
 * instead of filesystem enumeration.
 *
 * Usage:
 *   node scripts/repo-shape-guard.mjs           # enforce (warn on missing dirs)
 *   node scripts/repo-shape-guard.mjs --strict   # also fail on missing dirs
 *
 * Policy:
 *   violations (unknown root entries) → exit 1
 *   missing keep-list files           → exit 1
 *   missing keep-list dirs            → warn (exit 0), or exit 1 with --strict
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(__filename, '../..');

const IGNORED = new Set(['QUARANTINE', 'ARCHIVE']);
const HIDDEN_RE = /^\./;

/**
 * Core enforcement: check root entries against keep-list.
 * @param {string[]} rootEntries  All root-level entry names from git ls-tree
 * @param {{ dirs: string[], files: string[] }} keepList
 * @returns {{ violations: string[], missingDirs: string[], missingFiles: string[] }}
 */
export function checkShape(rootEntries, keepList) {
  const allowed = new Set([...keepList.dirs, ...keepList.files]);
  const visible = rootEntries.filter(e => !HIDDEN_RE.test(e) && !IGNORED.has(e));

  const violations = visible.filter(e => !allowed.has(e)).sort();
  const entrySet = new Set(rootEntries);
  const missingDirs = keepList.dirs.filter(d => !entrySet.has(d)).sort();
  const missingFiles = keepList.files.filter(f => !entrySet.has(f)).sort();

  return { violations, missingDirs, missingFiles };
}

/**
 * SEAL allowlist regression check.
 * @param {string} content  Contents of seal-gate-fast.yml
 * @returns {string[]}  Missing required escaped patterns
 */
export function checkSealAllowlist(content) {
  const REQUIRED = [
    'frontend/Dockerfile',
    'frontend/nginx\\.conf',
    'frontend/pnpm-lock\\.yaml',
    'frontend/\\.dockerignore',
  ];
  return REQUIRED.filter(p => !content.includes(p));
}

function main() {
  const strict = process.argv.includes('--strict');
  let exitCode = 0;

  // Load keep-list
  const keepListPath = join(ROOT, 'scripts', 'quarantine', 'keep-list.json');
  const keepList = JSON.parse(readFileSync(keepListPath, 'utf8'));

  // Get tracked root entries via git (null-byte separator avoids quoting)
  let rootEntries;
  try {
    const output = execSync('git ls-tree --name-only -z HEAD', {
      encoding: 'utf8',
      cwd: ROOT,
    });
    rootEntries = output.split('\0').filter(Boolean);
  } catch {
    console.error('FATAL: not in a git repo or git not available.');
    process.exit(2);
  }

  const { violations, missingDirs, missingFiles } = checkShape(rootEntries, keepList);

  // Report summary
  const allowedCount = keepList.dirs.length + keepList.files.length;
  const visibleCount = rootEntries.filter(e => !HIDDEN_RE.test(e) && !IGNORED.has(e)).length;
  console.log(`Root entries: ${visibleCount} visible (${rootEntries.length} total)`);
  console.log(
    `Keep-list: ${allowedCount} allowed (${keepList.dirs.length} dirs + ${keepList.files.length} files)`
  );

  if (violations.length) {
    console.error(`\n❌ VIOLATIONS: ${violations.length} root entries not in keep-list:`);
    violations.forEach(v => console.error(`  ⛔ ${v}`));
    exitCode = 1;
  }

  if (missingFiles.length) {
    console.error(`\n❌ MISSING FILES: ${missingFiles.length} required root files absent:`);
    missingFiles.forEach(f => console.error(`  ⚠️  ${f}`));
    exitCode = 1;
  }

  if (missingDirs.length) {
    const icon = strict ? '❌' : '⚠️';
    const label = strict ? 'MISSING DIRS (strict — exit 1)' : 'MISSING DIRS (warn — non-fatal)';
    console.warn(`\n${icon} ${label}: ${missingDirs.length} keep-list dirs absent:`);
    missingDirs.forEach(d => console.warn(`  📁 ${d}`));
    if (strict) exitCode = 1;
  }

  // ── SEAL allowlist regression guard ─────────────────────────────
  const sealGatePath = join(ROOT, '.github', 'workflows', 'seal-gate-fast.yml');
  try {
    const sealGate = readFileSync(sealGatePath, 'utf8');
    const missingSeal = checkSealAllowlist(sealGate);
    if (missingSeal.length) {
      console.error(`\n❌ SEAL ALLOWLIST REGRESSION: missing from seal-gate-fast.yml:`);
      missingSeal.forEach(p => console.error(`  ❌ ${p}`));
      console.error('Re-add them to the legacy-frontend grep -v allowlist.');
      exitCode = 1;
    }
  } catch {
    // seal-gate-fast.yml not found — skip in local dev
  }

  if (exitCode === 0) {
    console.log('\n✅ Repo shape OK');
  } else {
    console.error(`\n💥 Repo shape FAILED (exit ${exitCode})`);
  }

  process.exit(exitCode);
}

// Run main when executed directly
if (resolve(process.argv[1] || '') === __filename) {
  main();
}
