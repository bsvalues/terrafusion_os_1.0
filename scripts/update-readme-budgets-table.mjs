#!/usr/bin/env node
/**
 * Alternative implementation for per-route budget snapshot table
 * Creates budget table and injects into README between:
 *  <!-- BUDGET-SNAPSHOT:START --> ... <!-- BUDGET-SNAPSHOT:END -->
 */
import fs from 'node:fs';

const budgetPath = 'artifacts/reports/lighthouse-budget-report.json';
if (!fs.existsSync(budgetPath)) {
  console.error('❌ lighthouse-budget-report.json not found. Run Lighthouse CI first.');
  process.exit(1);
}

const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
if (!budget.rows || budget.rows.length === 0) {
  console.log('⚠️ No budget data found, skipping table update');
  process.exit(0);
}

// Generate performance budget table
let table = '| Route | Performance | Size Budgets | Overall |\n';
table += '|-------|-------------|--------------|----------|\n';

for (const row of budget.rows) {
  const route = row.url.replace(/^https?:\/\/[^\/]+/, '') || '/';
  const metrics = row.metrics || {};
  const pass = row.pass || {};
  const sizePass = row.sizePass || {};
  const resources = row.resourcesKB || {};
  
  // Performance metrics with pass/fail
  const perfMetrics = [
    `FCP: ${metrics.fcp ? Math.round(metrics.fcp) + 'ms' : '—'} ${pass.fcp !== false ? '✅' : '❌'}`,
    `LCP: ${metrics.lcp ? Math.round(metrics.lcp) + 'ms' : '—'} ${pass.lcp !== false ? '✅' : '❌'}`,
    `TBT: ${metrics.tbt ? Math.round(metrics.tbt) + 'ms' : '—'} ${pass.tbt !== false ? '✅' : '❌'}`,
    `CLS: ${metrics.cls ? metrics.cls.toFixed(3) : '—'} ${pass.cls !== false ? '✅' : '❌'}`
  ];
  
  // Size budgets
  const sizeMetrics = [
    `JS: ${resources.script || 0}KB ${sizePass.script !== false ? '✅' : '❌'}`,
    `CSS: ${resources.style || 0}KB ${sizePass.style !== false ? '✅' : '❌'}`
  ];
  
  // Overall status
  const allPerfPass = Object.values(pass).every(p => p !== false);
  const allSizePass = Object.values(sizePass).every(p => p !== false);
  const overallPass = allPerfPass && allSizePass;
  
  const status = overallPass ? '🟢 PASS' : '🔴 FAIL';
  
  table += `| \`${route}\` | ${perfMetrics.join('<br>')} | ${sizeMetrics.join('<br>')} | ${status} |\n`;
}

// Summary stats
const totalRoutes = budget.rows.length;
const passingRoutes = budget.rows.filter(row => {
  const allPass = Object.values(row.pass || {}).every(p => p !== false) && 
                  Object.values(row.sizePass || {}).every(p => p !== false);
  return allPass;
}).length;

table += `| **Total** | **${totalRoutes} routes tested** | **${passingRoutes} passing** | **${Math.round((passingRoutes/totalRoutes)*100)}% success rate** |\n`;

const tableBlock = 
`<!-- BUDGET-SNAPSHOT:START -->
### 📊 Performance Budget Snapshot

${table}

**Thresholds:** FCP ≤1500ms, LCP ≤2500ms, TBT ≤200ms, CLS ≤0.1, JavaScript ≤350KB, CSS ≤120KB
<!-- BUDGET-SNAPSHOT:END -->
`;

const readmePath = 'README.md';
let readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';

if (readme.includes('<!-- BUDGET-SNAPSHOT:START -->')) {
  readme = readme.replace(/<!-- BUDGET-SNAPSHOT:START -->[\s\S]*?<!-- BUDGET-SNAPSHOT:END -->/m, tableBlock);
} else {
  readme = (readme ? readme + '\n\n' : '') + tableBlock;
}

fs.writeFileSync(readmePath, readme);
console.log(`✅ Budget snapshot table updated. ${passingRoutes}/${totalRoutes} routes passing`);