#!/usr/bin/env node
import fs from 'node:fs'; import path from 'node:path';

const readJSON = (p, fb=null) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p,'utf8')) : fb;
const cov = readJSON('coverage/coverage-summary.json', { total:{ statements:{ pct:0 }, branches:{ pct:0 } } });
const perf = readJSON('artifacts/perf.json', {});
const budget = readJSON('artifacts/reports/lighthouse-budget-report.json', { rows:[] });
const a11y = readJSON('artifacts/a11y.json', { violations: 0 });

const coverage = (cov.total?.statements?.pct ?? 0)/100;
const branches = (cov.total?.branches?.pct ?? 0)/100;
const lcp = perf.lcp ?? perf.fcp ?? null;

// Derive average CLS from routes (or null)
let cls = null;
if (budget.rows?.length) {
  const vals = budget.rows.map(r => r.metrics?.cls).filter(v => typeof v === 'number');
  if (vals.length) cls = vals.reduce((a,b)=>a+b,0)/vals.length;
}
let budgetsPass = true, budgetsFailed = 0;
for (const r of (budget.rows ?? [])) {
  const fails = [
    r.pass?.fcp === false, r.pass?.lcp === false, r.pass?.tbt === false, r.pass?.cls === false,
    ...Object.values(r.sizePass ?? {}).map(Boolean).map(x=>!x)
  ].filter(Boolean).length;
  budgetsFailed += fails; if (fails>0) budgetsPass = false;
}

// Load previous entry for deltas
const histDir = 'reports/history';
const histFile = path.join(histDir, 'history.jsonl');
let prev = null;
if (fs.existsSync(histFile)) {
  const lines = fs.readFileSync(histFile,'utf8').trim().split('\n').filter(Boolean);
  if (lines.length) prev = JSON.parse(lines[lines.length-1]);
}

const d = {
  ts: new Date().toISOString(),
  sha: process.env.GITHUB_SHA || null,
  ref: process.env.GITHUB_REF || null,
  coverage,
  branches,
  lcp,
  cls,
  a11y: Number(a11y.violations ?? 0),
  lh_pass: budgetsPass,
  budgets_failed: budgetsFailed,
  delta_lcp: prev?.lcp != null && lcp != null ? (lcp - prev.lcp) : null,
  delta_cls: prev?.cls != null && cls != null ? (cls - prev.cls) : null,
  delta_coverage: prev?.coverage != null ? (coverage - prev.coverage) : null,
  delta_branches: prev?.branches != null ? (branches - prev.branches) : null
};

fs.mkdirSync(histDir, { recursive: true });
fs.appendFileSync(histFile, JSON.stringify(d) + '\n');
console.log('✅ Appended history entry with deltas:', d);