import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_HEADER = '// GENERATED - DO NOT EDIT';
const ROOT = process.cwd();
const BAD_PATHS = ['os-platform/core/pilot/pilot', 'os-platform/core/trace/trace'];
const ALLOWED_TOOLREGISTRY_JS = new Set([
  'os-platform/core/ToolRegistry.js',
  'os-platform/core/pilot/ToolRegistry.js',
]);
const DISALLOWED_TOOLREGISTRY_EXTS = new Set(['.mjs', '.cjs', '.min.js']);
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.venv',
  '.claude',
  'dist',
  '_archive',
  '_pre_restore_safety_20260108_144218',
]);

let failed = false;

for (const rel of BAD_PATHS) {
  const abs = path.resolve(ROOT, rel);
  if (fs.existsSync(abs)) {
    console.error(`ERROR: Unexpected nested output directory detected: ${rel}`);
    failed = true;
  }
}

function normalizeRel(rel) {
  return rel.replace(/\\/g, '/');
}

function walk(dir, enforceHeader) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, enforceHeader);
      continue;
    }
    if (!entry.isFile()) continue;

    const rel = normalizeRel(path.relative(ROOT, full));
    const base = path.basename(full);
    const ext = path.extname(full);

    if (base.startsWith('ToolRegistry.')) {
      // Allow ToolRegistry in governance surfaces: os-platform/core/ OR packages/os-core/
      const inGovernanceSurface =
        rel.startsWith('os-platform/core/') || rel.startsWith('packages/os-core/');
      if (!inGovernanceSurface) {
        console.error(`ToolRegistry artifact outside governance surface: ${rel}`);
        failed = true;
      }
      if (DISALLOWED_TOOLREGISTRY_EXTS.has(ext)) {
        console.error(`ToolRegistry extension is not allowed: ${rel}`);
        failed = true;
      }
      if (ext === '.js' && !ALLOWED_TOOLREGISTRY_JS.has(rel)) {
        console.error(`Unexpected ToolRegistry artifact: ${rel}`);
        failed = true;
      }
    }

    if (!enforceHeader || ext !== '.js') continue;

    const contents = fs.readFileSync(full, 'utf8');
    const firstLine = contents.split(/\r?\n/, 1)[0];
    if (firstLine.trim() !== REQUIRED_HEADER) {
      console.error(`Missing generated header: ${rel}`);
      failed = true;
    }
  }
}

walk(path.resolve(ROOT, 'os-platform/core'), true);
walk(ROOT, false);

if (failed) {
  process.exit(1);
}

console.log('Generated JS headers verified.');
