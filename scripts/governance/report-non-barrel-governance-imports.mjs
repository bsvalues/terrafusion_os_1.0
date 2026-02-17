/**
 * Informational governance report (non-blocking):
 * Finds UI files importing governance symbols from non-barrel paths
 * (e.g. reopenPersistence directly instead of canon/governance).
 *
 * Exit code ALWAYS 0. This is a visibility tool, not enforcement.
 *
 * @module scripts/governance/report-non-barrel-governance-imports
 * @see Phase 43: Import Hygiene
 */

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_ROOT = process.cwd();

const UI_ROOTS = ['frontend', 'apps', 'src'];

const FILE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.next', 'QUARANTINE', 'ARCHIVE']);

const NON_BARREL_IMPORT_PATTERNS = [/from\s+['"][^'"]*reopenPersistence['"]/];

function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && FILE_EXTS.has(path.extname(e.name))) yield full;
  }
}

function scanFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const norm = filePath.replaceAll('\\', '/');

  // Allow the barrel itself and the canonical source to import reopenPersistence
  if (norm.endsWith('/canon/governance.ts') || norm.endsWith('/canon/governance.js')) return false;
  if (norm.endsWith('/canon/reopenPersistence.ts') || norm.endsWith('/canon/reopenPersistence.js'))
    return false;

  // Allow test files that explicitly test reopenPersistence
  if (norm.includes('/tests/') && norm.includes('canon-reopen')) return false;
  if (norm.includes('/tests/') && norm.includes('canon-governance-barrel')) return false;

  return NON_BARREL_IMPORT_PATTERNS.some(re => re.test(raw));
}

export function reportNonBarrelGovernanceImports({ rootDir = DEFAULT_ROOT } = {}) {
  const offenders = [];
  const root = path.resolve(rootDir);

  for (const uiRoot of UI_ROOTS) {
    const abs = path.resolve(root, uiRoot);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) continue;

    for (const f of walk(abs)) {
      if (scanFile(f)) offenders.push(path.relative(root, f));
    }
  }

  return offenders;
}

// CLI entry: always exit 0
const isMain =
  import.meta.url === `file:///${process.argv[1].replaceAll('\\', '/')}` ||
  import.meta.url === `file://${process.argv[1].replaceAll('\\', '/')}`;

if (isMain) {
  const offenders = reportNonBarrelGovernanceImports();
  if (offenders.length === 0) {
    console.log('✅ Governance import hygiene: no non-barrel imports detected.');
  } else {
    console.log(
      'ℹ️ Governance import hygiene report: non-barrel imports detected (please migrate to canon/governance.ts):'
    );
    for (const f of offenders) console.log(` - ${f}`);
  }
  process.exit(0);
}
