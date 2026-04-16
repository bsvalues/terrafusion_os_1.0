#!/usr/bin/env node
/**
 * One-shot codemod: repair the quarantine-port JSX corruption in
 * packages/terra-pilt/client/src/**\/*.{tsx,jsx}.
 *
 * The corruption splits every opening element across two lines with a stray
 * fragment open at EOL and a stray fragment close at start of next line:
 *
 *   <div className="x"><>
 *     <p
 *   </> style="color:red">hi</p><>
 *
 * Both `<>` and `</>` fragments here are bogus — they appear only in this
 * mechanical split. Legitimate React fragments do NOT land right after a tag's
 * `>` at EOL, nor at the start of a line followed by attributes/tag-close.
 *
 * Two passes:
 *   Pass A: strip trailing bogus fragment open      `><>\r?\n`   →  `>\r?\n`
 *   Pass B: strip leading  bogus fragment close    `\r?\n\s*</>` →  ``
 *
 * Safety:
 *   - Does NOT touch `.ts` files (no JSX there)
 *   - Skips anything under node_modules / dist
 *   - Refuses to run on non-.tsx / non-.jsx files
 *   - Writes an in-memory summary, backs up nothing (git is the undo)
 *
 * Usage:  node tools/repair/fix-terra-pilt-jsx.mjs [--dry]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = join(__filename, '..', '..', '..');
const TARGET_DIR = join(REPO_ROOT, 'packages', 'terra-pilt', 'client', 'src');

const DRY = process.argv.includes('--dry');

/** @type {string[]} */
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '.vite') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      walk(p);
    } else if (st.isFile()) {
      const ext = extname(name);
      if (ext === '.tsx' || ext === '.jsx') files.push(p);
    }
  }
}

walk(TARGET_DIR);

let totalFragOpen = 0;
let totalFragClose = 0;
let touched = 0;for (const file of files) {
  const rawBefore = readFileSync(file, 'utf8');
  const before = rawBefore.replace(/\r\n?/g, '\n');
  let work = before;

  const priorNonBlankIdx = (lines, i) => {
    for (let k = i - 1; k >= 0; k--) if (lines[k].trim() !== '') return k;
    return -1;
  };
  const nextNonBlankIdx = (lines, i) => {
    for (let k = i + 1; k < lines.length; k++) if (lines[k].trim() !== '') return k;
    return -1;
  };
  const isLegitOpen = (lines, i) => {
    // `<>` is a real fragment opener only if the prior non-blank line ends with `(`
    const p = priorNonBlankIdx(lines, i);
    if (p < 0) return false;
    return /\(\s*$/.test(lines[p]);
  };
  const isLegitClose = (lines, i) => {
    // `</>` is a real fragment closer only if the next non-blank line starts with `)` / `}` / `,` / `;`
    const n = nextNonBlankIdx(lines, i);
    if (n < 0) return false;
    return /^\s*[)\},;]/.test(lines[n]);
  };

  // ── Phase A: strip standalone `<>` lines that are NOT legit fragment openers.
  {
    const lines = work.split('\n');
    const drop = new Set();
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() !== '<>') continue;
      if (isLegitOpen(lines, i)) continue;
      drop.add(i);
    }
    if (drop.size) work = lines.filter((_, i) => !drop.has(i)).join('\n');
  }

  // ── Phase B: `\n[ws]</>` followed by content on same line → join into prior tag.
  //   <Input
  //   </> className="..."
  // becomes:
  //   <Input className="..."
  work = work.replace(/\n[ \t]*<\/>(?=[ \t]*(?:[A-Za-z_{]|>))/g, '');

  // ── Phase C: attr-split shape — `</>` alone, prior line is incomplete tag,
  //   next line is attr continuation. Strip the `</>` line entirely.
  {
    const lines = work.split('\n');
    const drop = new Set();
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() !== '</>') continue;
      if (isLegitClose(lines, i)) continue;
      const p = priorNonBlankIdx(lines, i);
      const n = nextNonBlankIdx(lines, i);
      if (p < 0 || n < 0) continue;
      const prevText = lines[p].trimEnd();
      // prior line must be inside an incomplete opening tag (not ending with `>`)
      if (/[>]$/.test(prevText)) continue;
      // next line must look like attr / tag-close
      if (!/^\s*([A-Za-z_{/]|>)/.test(lines[n])) continue;
      drop.add(i);
    }
    if (drop.size) work = lines.filter((_, i) => !drop.has(i)).join('\n');
  }

  // ── Phase D: any remaining standalone `</>` that isn't a legit closer is orphan residue.
  {
    const lines = work.split('\n');
    const drop = new Set();
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() !== '</>') continue;
      if (isLegitClose(lines, i)) continue;
      drop.add(i);
    }
    if (drop.size) work = lines.filter((_, i) => !drop.has(i)).join('\n');
  }

  const after = work;
  // Count what changed (for reporting)
  const countA = (before.match(/^[ \t]*<>[ \t]*$/gm) || []).length
               - (after.match(/^[ \t]*<>[ \t]*$/gm) || []).length;
  const countB = (before.match(/^[ \t]*<\/>[ \t]*$/gm) || []).length
               - (after.match(/^[ \t]*<\/>[ \t]*$/gm) || []).length
               + (before.match(/\n[ \t]*<\/>[ \t]*[A-Za-z_{>]/g) || []).length
               - (after.match(/\n[ \t]*<\/>[ \t]*[A-Za-z_{>]/g) || []).length;

  totalFragOpen += countA;
  totalFragClose += countB;

  if (after !== before) {
    touched++;
    if (!DRY) writeFileSync(file, after, 'utf8');
    const rel = file.replace(REPO_ROOT + '\\', '').replace(/\\/g, '/');
    console.log(`  ${rel}: -${countA} <>  -${countB} </>`);
  }
}

console.log('');
console.log(`${DRY ? '[DRY] ' : ''}Scanned ${files.length} files`);
console.log(`${DRY ? '[DRY] ' : ''}Modified ${touched} files`);
console.log(`${DRY ? '[DRY] ' : ''}Removed ${totalFragOpen} <> and ${totalFragClose} </> corruption sites`);
