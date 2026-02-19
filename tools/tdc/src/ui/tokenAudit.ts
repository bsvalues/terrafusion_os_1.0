import fs from 'node:fs';
import path from 'node:path';
import type {
  TokenViolation,
  UiTokenComplianceContract,
  TokenViolationKind,
} from '../contracts/ui-token-compliance.contract';

// ── Slop patterns (ban these) ────────────────────────────────────
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const TW_ARBITRARY_RE =
  /\b(?:bg|text|border|ring|from|via|to)-\[(?:#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)).*?\]/g;
const COLOR_FN_RE = /\b(?:rgba?|hsla?)\([^)]*\)/g;

// ── Allowlist: TF token patterns ─────────────────────────────────
const ALLOW_TOKEN_RE = /(?:hsl|hsla)\(\s*var\(--tf-[a-z0-9-]+\)|var\(--tf-[a-z0-9-]+\)/;

// ── File extensions to scan ──────────────────────────────────────
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.mdx']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', 'build', 'coverage', '.git', 'ARCHIVE', 'QUARANTINE']);

function walkFiles(dir: string): string[] {
  const results: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (entry.isFile() && SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

function makeViolation(
  kind: TokenViolationKind,
  file: string,
  index: number,
  content: string
): TokenViolation {
  const before = content.slice(0, index);
  const lines = before.split('\n');
  const line = lines.length;
  const column = (lines[lines.length - 1]?.length ?? 0) + 1;
  const excerpt = (content.slice(index, Math.min(index + 140, content.length)).split('\n')[0]) ?? '';
  return { kind, file, line, column, excerpt };
}

export function runTokenAudit(repoRoot: string): UiTokenComplianceContract {
  const cwd = path.resolve(repoRoot);
  const files = walkFiles(cwd);

  const violations: TokenViolation[] = [];

  for (const abs of files) {
    const stat = fs.statSync(abs);
    if (!stat.isFile() || stat.size > 2_000_000) continue;

    const content = fs.readFileSync(abs, 'utf8');
    const rel = path.relative(cwd, abs);

    // Raw hex
    for (const m of content.matchAll(HEX_RE)) {
      violations.push(makeViolation('RAW_HEX', rel, m.index ?? 0, content));
    }

    // Arbitrary Tailwind color classes (excluding TF token patterns)
    for (const m of content.matchAll(TW_ARBITRARY_RE)) {
      const idx = m.index ?? 0;
      const slice = content.slice(idx, Math.min(idx + 200, content.length));
      if (ALLOW_TOKEN_RE.test(slice)) continue;
      violations.push(makeViolation('TAILWIND_ARBITRARY_COLOR', rel, idx, content));
    }

    // Disallowed direct color function usage (rgba/hsl with literal values)
    for (const m of content.matchAll(COLOR_FN_RE)) {
      const idx = m.index ?? 0;
      const slice = content.slice(idx, Math.min(idx + 200, content.length));
      if (ALLOW_TOKEN_RE.test(slice)) continue;
      violations.push(makeViolation('DISALLOWED_COLOR_FUNCTION', rel, idx, content));
    }
  }

  return {
    contract: 'ui-token-compliance.contract.json',
    version: 'v1',
    ok: violations.length === 0,
    scannedFileCount: files.length,
    violationCount: violations.length,
    violations,
    generatedAtIso: new Date().toISOString(),
  };
}
