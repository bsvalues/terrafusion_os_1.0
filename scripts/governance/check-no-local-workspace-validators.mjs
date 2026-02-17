/**
 * Governance scan: ensures the UI does not define local workspace validators.
 * All workspace validation MUST import from the canonical source:
 *   - UI side:   frontend/apps/os-shell/src/canon/reopenPersistence.ts
 *   - Core lane: os-platform/core/canon/reopenPersistence.mjs
 *
 * This is a regression tripwire, not a linter replacement.
 *
 * Run standalone: node scripts/governance/check-no-local-workspace-validators.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_ROOT = process.cwd();

const UI_ROOTS = ['frontend', 'apps', 'src'];

const FILE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

const BANNED_PATTERNS = [
  /\bfunction\s+isValidWorkspace\s*\(/,
  /\bconst\s+isValidWorkspace\s*=\s*\(/,
  /\bexport\s+function\s+isValidWorkspace\s*\(/,
  /\bexport\s+const\s+isValidWorkspace\s*=/,
  /\bfunction\s+validateWorkspace\s*\(/,
  /\bconst\s+validateWorkspace\s*=\s*\(/,
];

// Files that are ALLOWED to define workspace validators (canonical sources).
const ALLOWLIST_SUFFIXES = [
  '/canon/reopenPersistence.ts',
  '/canon/reopenPersistence.mjs',
  '/canon-reopen.contract.test.mjs',
];

function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (
      e.name === 'node_modules' ||
      e.name === 'dist' ||
      e.name === 'build' ||
      e.name === '.next' ||
      e.name === 'QUARANTINE' ||
      e.name === 'ARCHIVE'
    )
      continue;

    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && FILE_EXTS.has(path.extname(e.name))) yield full;
  }
}

function isAllowlisted(filePath) {
  const normalized = filePath.replaceAll('\\', '/');
  return ALLOWLIST_SUFFIXES.some(suffix => normalized.endsWith(suffix));
}

function isInUiRoot(filePath, rootDir) {
  const normalized = filePath.replaceAll('\\', '/');
  const normalizedRoot = rootDir.replaceAll('\\', '/');
  const rel = normalized.startsWith(normalizedRoot)
    ? normalized.slice(normalizedRoot.length + 1)
    : normalized;
  return UI_ROOTS.some(root => rel.startsWith(`${root}/`) || rel.includes(`/${root}/`));
}

function fileContainsBannedPattern(filePath, rootDir) {
  if (isAllowlisted(filePath)) return false;
  if (!isInUiRoot(filePath, rootDir)) return false;

  const raw = fs.readFileSync(filePath, 'utf8');
  return BANNED_PATTERNS.some(re => re.test(raw));
}

export function checkNoLocalWorkspaceValidators({ rootDir = DEFAULT_ROOT } = {}) {
  const offenders = [];

  for (const uiRoot of UI_ROOTS) {
    const abs = path.resolve(rootDir, uiRoot);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) continue;

    for (const f of walk(abs)) {
      if (fileContainsBannedPattern(f, rootDir)) offenders.push(f);
    }
  }

  return offenders;
}

// CLI usage
const thisFile = new URL(import.meta.url).pathname;
const argFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
const isMain =
  thisFile === argFile ||
  thisFile === '/' + argFile.replaceAll('\\', '/') ||
  argFile.replaceAll('\\', '/').endsWith(thisFile.replace(/^\//, ''));

if (isMain && process.argv[1]) {
  const offenders = checkNoLocalWorkspaceValidators();
  if (offenders.length) {
    const rel = offenders.map(f => path.relative(DEFAULT_ROOT, f));
    console.error(
      '❌ Governance violation: local workspace validators detected:\n' +
        rel.map(p => ` - ${p}`).join('\n')
    );
    process.exit(1);
  }
  console.log('✅ Governance OK: no local workspace validators found in UI roots.');
}
