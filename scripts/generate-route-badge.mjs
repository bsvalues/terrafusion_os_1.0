#!/usr/bin/env node
/**
 * Creates badge badges/route-budgets.svg and injects into README between:
 *   <!-- ROUTE-BADGE:START --> ... <!-- ROUTE-BADGE:END -->
 * Uses artifacts/reports/lighthouse-budget-report.json
 */
import fs from 'node:fs';

const rpt = 'artifacts/reports/lighthouse-budget-report.json';
if (!fs.existsSync(rpt)) {
  console.warn('⚠️  No lighthouse-budget-report.json; skipping route badge.');
  process.exit(0);
}
const { rows = [] } = JSON.parse(fs.readFileSync(rpt,'utf8'));
const passByRow = rows.map(r => {
  const p = r.pass || {};
  const allTiming = [p.fcp, p.lcp, p.tbt, p.cls].every(v => v !== false);
  const sizes = Object.values(r.sizePass || {}).every(Boolean);
  return allTiming && sizes;
});
const passed = passByRow.filter(Boolean).length;
const total = rows.length;

const color = passed === total ? '#2ea44f' : passed/Math.max(1,total) >= 0.9 ? '#bf8700' : '#cb2431';
const label = 'budgets';
const value = `${passed}/${total} routes`;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="20" role="img" aria-label="${label}: ${value}">
<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".1" stop-opacity=".1"/></linearGradient>
<mask id="m"><rect width="150" height="20" rx="3" fill="#fff"/></mask>
<g mask="url(#m)"><rect width="70" height="20" fill="#555"/><rect x="70" width="80" height="20" fill="${color}"/><rect width="150" height="20" fill="url(#s)"/></g>
<g fill="#fff" text-anchor="start" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
<text x="6" y="15" fill="#010101" fill-opacity=".3">${label}</text><text x="6" y="14">${label}</text>
<text x="76" y="15" fill="#010101" fill-opacity=".3">${value}</text><text x="76" y="14">${value}</text>
</g></svg>`.trim();

fs.mkdirSync('badges', { recursive: true });
fs.writeFileSync('badges/route-budgets.svg', svg);

const readme = 'README.md';
const block = `<!-- ROUTE-BADGE:START -->\n[![Budgets](badges/route-budgets.svg)](./badges/route-budgets.svg)\n<!-- ROUTE-BADGE:END -->\n`;
let md = fs.existsSync(readme) ? fs.readFileSync(readme,'utf8') : '';
if (md.includes('<!-- ROUTE-BADGE:START -->')) {
  md = md.replace(/<!-- ROUTE-BADGE:START -->[\s\S]*?<!-- ROUTE-BADGE:END -->/m, block);
} else {
  md = (md ? md + '\n\n' : '') + block;
}
fs.writeFileSync(readme, md);

console.log(`✅ Route budgets badge: ${passed}/${total} routes`);