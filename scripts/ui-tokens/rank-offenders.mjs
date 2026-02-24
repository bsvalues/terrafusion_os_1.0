#!/usr/bin/env node
/**
 * Rank token offenders by counting raw color literals.
 * Safe heuristic to pick the next B2 batch (CSS-first).
 *
 * Usage:
 *   node scripts/ui-tokens/rank-offenders.mjs
 *   node scripts/ui-tokens/rank-offenders.mjs --root frontend --top 20
 *   node scripts/ui-tokens/rank-offenders.mjs --include-ts
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const ROOT = process.cwd();

const getArg = (name, fallback) => {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  return args[i + 1] ?? fallback;
};

const ROOT_DIR = path.resolve(ROOT, getArg('--root', 'frontend'));
const TOP = Number(getArg('--top', '15'));
const INCLUDE_TS = args.includes('--include-ts');

const CSS_EXT = new Set(['.css', '.scss', '.sass', '.less']);
const TS_EXT = new Set(['.ts', '.tsx']);

const IGNORE_DIRS = new Set(['node_modules', 'dist', 'build', '.next', '.turbo', '.git']);

// Color literal regexes (intentionally broad; this is ranking, not validation)
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const RGB = /\brgba?\(\s*[\d.\s,%]+\)/g;
const HSL = /\bhsla?\(\s*[\d.\s,%]+\)/g;

// Exclusions: already-tokenized patterns should not count as "raw"
const TOKEN_HSL_VAR = /hsl\(\s*var\(--tf-[^)]+\)\s*[^)]*\)/g;
const TOKEN_VAR = /var\(--tf-[^)]+\)/g;

async function walk(dir) {
  const out = [];
  const ents = await fs.readdir(dir, { withFileTypes: true });
  for (const e of ents) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (e.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function countMatches(content, re) {
  const m = content.match(re);
  return m ? m.length : 0;
}

function scoreFile(content) {
  const scrubbed = content.replace(TOKEN_HSL_VAR, '').replace(TOKEN_VAR, '');
  const hex = countMatches(scrubbed, HEX);
  const rgb = countMatches(scrubbed, RGB);
  const hsl = countMatches(scrubbed, HSL);
  return { hex, rgb, hsl, total: hex + rgb + hsl };
}

async function main() {
  if (!Number.isFinite(TOP) || TOP <= 0) {
    console.error(`❌ Invalid --top value: ${TOP}`);
    process.exit(2);
  }

  const st = await fs.stat(ROOT_DIR).catch(() => null);
  if (!st?.isDirectory()) {
    console.error(`❌ Root not found: ${ROOT_DIR}`);
    process.exit(2);
  }

  const files = await walk(ROOT_DIR);
  const candidates = files.filter(f => {
    const ext = path.extname(f);
    if (CSS_EXT.has(ext)) return true;
    if (INCLUDE_TS && TS_EXT.has(ext)) return true;
    return false;
  });

  const ranked = [];
  for (const f of candidates) {
    const txt = await fs.readFile(f, 'utf8').catch(() => null);
    if (!txt) continue;
    const s = scoreFile(txt);
    if (s.total > 0) ranked.push({ file: f, ...s });
  }

  ranked.sort((a, b) => b.total - a.total);

  console.log(`Token Offender Ranking (root=${path.relative(ROOT, ROOT_DIR)})`);
  console.log(`Top ${TOP} files by raw color literals:\n`);

  for (const r of ranked.slice(0, TOP)) {
    console.log(
      `${String(r.total).padStart(5)}  hex:${String(r.hex).padStart(4)}  rgb:${String(r.rgb).padStart(4)}  hsl:${String(r.hsl).padStart(4)}  ${path.relative(ROOT, r.file)}`
    );
  }

  const cssOnly = ranked.filter(r => CSS_EXT.has(path.extname(r.file)));
  const pick = cssOnly.slice(0, 2);
  if (pick.length === 2) {
    console.log('\nSuggested B2-03 pair:');
    console.log(`- ${path.relative(ROOT, pick[0].file)} (${pick[0].total})`);
    console.log(`- ${path.relative(ROOT, pick[1].file)} (${pick[1].total})`);
  }
}

main().catch(e => {
  console.error('❌ Failed:', e?.stack || e);
  process.exit(1);
});
