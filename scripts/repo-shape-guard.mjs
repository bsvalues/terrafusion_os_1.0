/**
 * Repo Shape Guard – Entropy Lock for TerraFusion OS
 *
 * Prevents directory sprawl by asserting the number of top-level
 * non-hidden directories stays within bounds. Run in CI (SEAL gate)
 * or locally via: node scripts/repo-shape-guard.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

const IGNORED = new Set(['node_modules', 'QUARANTINE', '.git']);

const dirs = readdirSync(ROOT)
  .filter(name => {
    if (name.startsWith('.') || IGNORED.has(name)) return false;
    try {
      return statSync(join(ROOT, name)).isDirectory();
    } catch {
      return false;
    }
  })
  .sort();

const MAX_DIRS = 20; // Current: 16.  Headroom: 4.
const MAX_ROOT_FILES = 40; // Current: 29.  Headroom: 11.

const files = readdirSync(ROOT).filter(name => {
  try {
    return statSync(join(ROOT, name)).isFile();
  } catch {
    return false;
  }
});

// ── SEAL allowlist regression guard ─────────────────────────────────
// These frontend/ paths are permitted by the SEAL legacy-frontend gate
// (seal-gate-fast.yml). If someone removes them from the workflow's
// grep -v allowlist, the Docker build PR gate will silently break.
let exitCode = 0;

const SEAL_ALLOWLIST = [
  'frontend/Dockerfile',
  'frontend/nginx\\.conf',
  'frontend/pnpm-lock\\.yaml',
  'frontend/\\.dockerignore',
];

const sealGatePath = join(ROOT, '.github', 'workflows', 'seal-gate-fast.yml');
try {
  const sealGate = readFileSync(sealGatePath, 'utf8');
  const missing = SEAL_ALLOWLIST.filter(p => !sealGate.includes(p));
  if (missing.length) {
    console.error(`\nSEAL ALLOWLIST REGRESSION: these paths are missing from seal-gate-fast.yml:`);
    missing.forEach(p => console.error(`  ❌ ${p}`));
    console.error('Re-add them to the legacy-frontend grep -v allowlist.');
    exitCode = 1;
  }
} catch {
  // seal-gate-fast.yml not found — skip (non-fatal in local dev)
}
// ────────────────────────────────────────────────────────────────────

console.log(`Top-level directories: ${dirs.length} / ${MAX_DIRS} max`);
dirs.forEach(d => console.log(`  ${d}`));

console.log(`\nRoot files: ${files.length} / ${MAX_ROOT_FILES} max`);

if (dirs.length > MAX_DIRS) {
  console.error(`\nENTROPY VIOLATION: ${dirs.length} dirs exceed cap of ${MAX_DIRS}`);
  exitCode = 1;
}
if (files.length > MAX_ROOT_FILES) {
  console.error(`\nENTROPY VIOLATION: ${files.length} root files exceed cap of ${MAX_ROOT_FILES}`);
  exitCode = 1;
}

if (exitCode === 0) {
  console.log('\nRepo shape OK');
}

process.exit(exitCode);
