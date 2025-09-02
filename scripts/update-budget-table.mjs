#!/usr/bin/env node
/**
 * Generates a per-route budget table and injects it into README
 * Reads lighthouse-budget-report.json and creates markdown table
 * Injects between <!-- BUDGET-TABLE:START --> ... <!-- BUDGET-TABLE:END -->
 */
import fs from 'node:fs';

const readJSON = (p, fallback=null) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p,'utf8')) : fallback;
const budget = readJSON('artifacts/reports/lighthouse-budget-report.json', { rows:[] });

if (!budget.rows || budget.rows.length === 0) {
  console.log('⚠️ No budget data found, skipping table update');
  process.exit(0);
}

// Generate markdown table
let table = `| Route | FCP | LCP | TBT | CLS | Script (KB) | Style (KB) | Status |\n`;
table += `|-------|-----|-----|-----|-----|-------------|------------|--------|\n`;

for (const row of budget.rows) {
  const url = row.url.replace(/^https?:\/\/[^\/]+/, '') || '/';
  const metrics = row.metrics || {};
  const pass = row.pass || {};
  const resourcesKB = row.resourcesKB || {};
  
  const fcp = metrics.fcp ? `${Math.round(metrics.fcp)}ms` : '—';
  const lcp = metrics.lcp ? `${Math.round(metrics.lcp)}ms` : '—';
  const tbt = metrics.tbt ? `${Math.round(metrics.tbt)}ms` : '—';
  const cls = metrics.cls ? metrics.cls.toFixed(3) : '—';
  
  const fcpIcon = pass.fcp !== false ? '✅' : '❌';
  const lcpIcon = pass.lcp !== false ? '✅' : '❌';
  const tbtIcon = pass.tbt !== false ? '✅' : '❌';
  const clsIcon = pass.cls !== false ? '✅' : '❌';
  
  const script = resourcesKB.script || 0;
  const style = resourcesKB.style || 0;
  
  const sizePass = row.sizePass || {};
  const scriptIcon = sizePass.script !== false ? '✅' : '❌';
  const styleIcon = sizePass.style !== false ? '✅' : '❌';
  
  const overallPass = Object.values(pass).every(p => p !== false) && Object.values(sizePass).every(p => p !== false);
  const status = overallPass ? '🟢 PASS' : '🔴 FAIL';
  
  table += `| \`${url}\` | ${fcp} ${fcpIcon} | ${lcp} ${lcpIcon} | ${tbt} ${tbtIcon} | ${cls} ${clsIcon} | ${script} ${scriptIcon} | ${style} ${styleIcon} | ${status} |\n`;
}

// Add summary row
const totalRoutes = budget.rows.length;
const passingRoutes = budget.rows.filter(r => {
  const allPass = Object.values(r.pass || {}).every(p => p !== false) && Object.values(r.sizePass || {}).every(p => p !== false);
  return allPass;
}).length;
const failingRoutes = totalRoutes - passingRoutes;

table += `| **Summary** | | | | | | | **${passingRoutes}/${totalRoutes} routes passing** |\n`;

// Add legend
const legend = `\n**Legend:** ✅ Within budget | ❌ Over budget | 🟢 All metrics pass | 🔴 One or more metrics fail\n\n**Budgets:** FCP ≤1500ms, LCP ≤2500ms, TBT ≤200ms, CLS ≤0.1, Script ≤350KB, Style ≤120KB`;

const tableBlock = `<!-- BUDGET-TABLE:START -->\n### 📊 Performance Budget Status\n\n${table}\n${legend}\n<!-- BUDGET-TABLE:END -->\n`;

// Update README
const readmePath = 'README.md';
let readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath,'utf8') : '';

if (readme.includes('<!-- BUDGET-TABLE:START -->')) {
  readme = readme.replace(/<!-- BUDGET-TABLE:START -->[\s\S]*?<!-- BUDGET-TABLE:END -->/m, tableBlock);
} else {
  // Insert after quality badge if present, otherwise at end
  if (readme.includes('<!-- QUALITY-BADGE:END -->')) {
    readme = readme.replace(/(<!-- QUALITY-BADGE:END -->\n)/, `$1\n${tableBlock}`);
  } else {
    readme = (readme ? readme + '\n\n' : '') + tableBlock;
  }
}

fs.writeFileSync(readmePath, readme);

console.log(`✅ Updated budget table: ${passingRoutes}/${totalRoutes} routes passing`);