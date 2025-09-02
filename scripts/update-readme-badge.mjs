#!/usr/bin/env node
/**
 * Generates badges/quality.svg and injects a markdown badge into README between
 * markers: <!-- QUALITY-BADGE:START --> ... <!-- QUALITY-BADGE:END -->
 * Inputs it reads if present:
 *  - coverage/coverage-summary.json
 *  - artifacts/perf.json        ({ lcp, fcp })
 *  - artifacts/a11y.json        ({ violations })
 *  - artifacts/reports/lighthouse-budget-report.json
 * Env overrides:
 *  - COVERAGE_TARGET (default 0.97), LCP_TARGET (default 2500), A11Y_TARGET (default 0)
 */
import fs from 'node:fs'; import path from 'node:path';

const readJSON = (p, fallback=null) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p,'utf8')) : fallback;

const cov = readJSON('coverage/coverage-summary.json', { total:{ statements:{ pct:0 } } });
const perf = readJSON('artifacts/perf.json', {});
const a11y = readJSON('artifacts/a11y.json', {});
const budget = readJSON('artifacts/reports/lighthouse-budget-report.json', { rows:[] });

const coverage = (cov.total?.statements?.pct ?? 0)/100;
const lcp = perf.lcp ?? perf.fcp ?? null;
const a11yViol = Number(a11y.violations ?? 0);

let budgetsPass = true, budgetsFailed = 0;
for (const r of budget.rows ?? []) {
  const fails = [
    r.pass?.fcp === false,
    r.pass?.lcp === false,
    r.pass?.tbt === false,
    r.pass?.cls === false,
    ...Object.values(r.sizePass ?? {}).map(Boolean).map(x=>!x)
  ].filter(Boolean).length;
  budgetsFailed += fails;
  if (fails > 0) budgetsPass = false;
}

const ct = Number(process.env.COVERAGE_TARGET ?? 0.97);
const lt = Number(process.env.LCP_TARGET ?? 2500);
const at = Number(process.env.A11Y_TARGET ?? 0);

const pass = (coverage>=ct) && (lcp==null || lcp<=lt) && (a11yViol<=at) && budgetsPass;

// SVG badge
const color = pass ? '#2ea44f' : (coverage>=ct*0.9 ? '#bf8700' : '#cb2431');
const label = 'quality';
const value = pass ? 'passing' : 'failing';
const extra = `cov ${Math.round(coverage*100)}% • ${lcp?`lcp ${Math.round(lcp)}ms • `:''}a11y ${a11yViol} • budget ${budgetsPass?'ok':'fail'}`;

const svg = (lbl,val,extra,color)=>`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="20" role="img" aria-label="${lbl}: ${val}">
<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".1" stop-opacity=".1"/></linearGradient>
<mask id="m"><rect width="300" height="20" rx="3" fill="#fff"/></mask>
<g mask="url(#m)"><rect width="60" height="20" fill="#555"/><rect x="60" width="240" height="20" fill="${color}"/><rect width="300" height="20" fill="url(#s)"/></g>
<g fill="#fff" text-anchor="start" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
<text x="6" y="15" fill="#010101" fill-opacity=".3">${lbl}</text><text x="6" y="14">${lbl}</text>
<text x="66" y="15" fill="#010101" fill-opacity=".3">${val} • ${extra}</text><text x="66" y="14">${val} • ${extra}</text>
</g></svg>`;

fs.mkdirSync('badges', { recursive: true });
fs.writeFileSync('badges/quality.svg', svg(label, value, extra, color));

// README injection with coverage badges
const readmePath = 'README.md';
const qualityBadge = `[![Quality Gates](badges/quality.svg)](./badges/quality.svg)`;
const coverageBadge = `[![Coverage](badges/coverage-summary.svg)](./badges/coverage-summary.svg)`;
const linkMD = ` — view detailed reports: **GitHub Pages →** _Settings ▸ Pages_ or the CI output URL.`;

// Individual coverage badges
const individualBadges = `
[![Statements](badges/coverage-statements.svg)](./badges/coverage-statements.svg)
[![Branches](badges/coverage-branches.svg)](./badges/coverage-branches.svg) 
[![Functions](badges/coverage-functions.svg)](./badges/coverage-functions.svg)
[![Lines](badges/coverage-lines.svg)](./badges/coverage-lines.svg)`;

const block = `<!-- QUALITY-BADGE:START -->\n${qualityBadge} ${coverageBadge}${linkMD}\n\n**Coverage Breakdown:**${individualBadges}\n<!-- QUALITY-BADGE:END -->\n`;

let readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath,'utf8') : '';
if (readme.includes('<!-- QUALITY-BADGE:START -->')) {
  readme = readme.replace(/<!-- QUALITY-BADGE:START -->[\s\S]*?<!-- QUALITY-BADGE:END -->/m, block);
} else {
  readme = (readme ? readme + '\n\n' : '') + block;
}
fs.writeFileSync(readmePath, readme);

console.log(`✅ Badge ${pass?'PASS':'FAIL'} | coverage=${(coverage*100).toFixed(1)}% lcp=${lcp??'n/a'} a11y=${a11yViol} budgetsFailed=${budgetsFailed}`);