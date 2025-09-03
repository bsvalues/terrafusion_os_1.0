#!/usr/bin/env node
/**
 * Quality gates:
 *   --coverage=0.97  (statements target)
 *   --branches=0.90  (branches target)
 *   --lcp=2500       (ms)
 *   --a11y=0         (violations)
 * Reads:
 *   coverage/coverage-summary.json
 *   artifacts/perf.json            { lcp?, fcp? }
 *   artifacts/a11y.json            { violations? }
 */
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(kv=>{
  const [k,v] = kv.replace(/^--/,'').split('=');
  return [k, Number(v)];
}));
const fail = (m)=>{ console.error(`❌ ${m}`); process.exit(1); };
const ok = (m)=> console.log(`✅ ${m}`);

const covPath = path.join('coverage','coverage-summary.json');
if (!fs.existsSync(covPath)) fail('coverage-summary.json not found.');
const cov = JSON.parse(fs.readFileSync(covPath,'utf8'));

const stmtPct = (cov.total?.statements?.pct ?? 0)/100;
const brPct   = (cov.total?.branches?.pct ?? 0)/100;
const stmtTarget = args.coverage ?? 0.97;
const brTarget   = args.branches ?? 0.90;

if (stmtPct < stmtTarget) fail(`Statements ${ (stmtPct*100).toFixed(1)}% < target ${(stmtTarget*100)}%`);
ok(`Statements ${(stmtPct*100).toFixed(1)}% ≥ ${(stmtTarget*100)}%`);

if (brPct < brTarget) fail(`Branches ${(brPct*100).toFixed(1)}% < target ${(brTarget*100)}%`);
ok(`Branches ${(brPct*100).toFixed(1)}% ≥ ${(brTarget*100)}%`);

const perfPath = path.join('artifacts','perf.json');
if (fs.existsSync(perfPath)) {
  const perf = JSON.parse(fs.readFileSync(perfPath,'utf8'));
  const lcp = Number(perf.lcp ?? perf.fcp ?? 9e9);
  const lcpTarget = args.lcp ?? 2500;
  if (lcp > lcpTarget) fail(`LCP ${lcp}ms > target ${lcpTarget}ms`);
  ok(`LCP ${lcp}ms ≤ ${lcpTarget}ms`);
} else {
  console.warn('⚠️  artifacts/perf.json not found; skipping perf gate.');
}

const a11yPath = path.join('artifacts','a11y.json');
if (fs.existsSync(a11yPath)) {
  const violations = Number(JSON.parse(fs.readFileSync(a11yPath,'utf8')).violations ?? 0);
  const a11yTarget = args.a11y ?? 0;
  if (violations > a11yTarget) fail(`A11y violations ${violations} > allowed ${a11yTarget}`);
  ok(`A11y violations ${violations} ≤ ${a11yTarget}`);
} else {
  console.warn('⚠️  artifacts/a11y.json not found; skipping a11y gate.');
}

console.log('🎉 Quality gates passed.');