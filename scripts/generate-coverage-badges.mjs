#!/usr/bin/env node
/**
 * Creates badges:
 *  - badges/coverage-statements.svg
 *  - badges/coverage-branches.svg
 * And injects them into README between:
 *  <!-- QUALITY-BADGES:START --> ... <!-- QUALITY-BADGES:END -->
 */
import fs from 'node:fs';

const covPath = 'coverage/coverage-summary.json';
if (!fs.existsSync(covPath)) {
  console.error('❌ coverage-summary.json not found. Run tests with coverage first.');
  process.exit(1);
}
const cov = JSON.parse(fs.readFileSync(covPath, 'utf8'));
const pctStmts = cov.total?.statements?.pct ?? 0;
const pctBranches = cov.total?.branches?.pct ?? 0;

const svg = (label, value, color) => `
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="20" role="img" aria-label="${label}: ${value}">
<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".1" stop-opacity=".1"/></linearGradient>
<mask id="m"><rect width="140" height="20" rx="3" fill="#fff"/></mask>
<g mask="url(#m)">
  <rect width="70" height="20" fill="#555"/>
  <rect x="70" width="70" height="20" fill="${color}"/>
  <rect width="140" height="20" fill="url(#s)"/>
</g>
<g fill="#fff" text-anchor="start" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
  <text x="6" y="15" fill="#010101" fill-opacity=".3">${label}</text><text x="6" y="14">${label}</text>
  <text x="76" y="15" fill="#010101" fill-opacity=".3">${value}</text><text x="76" y="14">${value}</text>
</g></svg>`.trim();

const colorFor = (pct) => pct >= 97 ? '#2ea44f' : pct >= 90 ? '#bf8700' : '#cb2431';

fs.mkdirSync('badges', { recursive: true });
fs.writeFileSync('badges/coverage-statements.svg', svg('statements', `${pctStmts}%`, colorFor(pctStmts)));
fs.writeFileSync('badges/coverage-branches.svg', svg('branches', `${pctBranches}%`, colorFor(pctBranches)));

const badgeBlock =
`<!-- QUALITY-BADGES:START -->
[![Statements](badges/coverage-statements.svg)](./badges/coverage-statements.svg)
[![Branches](badges/coverage-branches.svg)](./badges/coverage-branches.svg)
<!-- QUALITY-BADGES:END -->
`;

const readmePath = 'README.md';
let md = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
if (md.includes('<!-- QUALITY-BADGES:START -->')) {
  md = md.replace(/<!-- QUALITY-BADGES:START -->[\s\S]*?<!-- QUALITY-BADGES:END -->/m, badgeBlock);
} else {
  md = (md ? md + '\n\n' : '') + badgeBlock;
}
fs.writeFileSync(readmePath, md);
console.log(`✅ Badges written. Statements=${pctStmts}%, Branches=${pctBranches}%`);