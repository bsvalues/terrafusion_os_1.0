#!/usr/bin/env node
/**
 * Generates separate coverage badges for statements/branches/functions/lines
 * Creates badges/coverage-{type}.svg for each coverage metric
 */
import fs from 'node:fs';

const readJSON = (p, fallback=null) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p,'utf8')) : fallback;
const cov = readJSON('coverage/coverage-summary.json', { total:{ statements:{ pct:0 }, branches:{ pct:0 }, functions:{ pct:0 }, lines:{ pct:0 } } });

const metrics = [
  { type: 'statements', value: cov.total?.statements?.pct || 0, threshold: 97 },
  { type: 'branches', value: cov.total?.branches?.pct || 0, threshold: 90 },
  { type: 'functions', value: cov.total?.functions?.pct || 0, threshold: 90 },
  { type: 'lines', value: cov.total?.lines?.pct || 0, threshold: 90 }
];

const generateBadge = (type, value, threshold) => {
  const pass = value >= threshold;
  const color = pass ? '#2ea44f' : (value >= threshold * 0.9 ? '#bf8700' : '#cb2431');
  const status = pass ? 'passing' : 'failing';
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20" role="img" aria-label="${type}: ${value}%">
<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".1" stop-opacity=".1"/></linearGradient>
<mask id="m"><rect width="120" height="20" rx="3" fill="#fff"/></mask>
<g mask="url(#m)"><rect width="70" height="20" fill="#555"/><rect x="70" width="50" height="20" fill="${color}"/><rect width="120" height="20" fill="url(#s)"/></g>
<g fill="#fff" text-anchor="start" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
<text x="6" y="15" fill="#010101" fill-opacity=".3">${type}</text><text x="6" y="14">${type}</text>
<text x="76" y="15" fill="#010101" fill-opacity=".3">${value.toFixed(1)}%</text><text x="76" y="14">${value.toFixed(1)}%</text>
</g></svg>`;
};

fs.mkdirSync('badges', { recursive: true });

for (const metric of metrics) {
  const svg = generateBadge(metric.type, metric.value, metric.threshold);
  fs.writeFileSync(`badges/coverage-${metric.type}.svg`, svg);
}

// Generate combined coverage summary badge
const avgCoverage = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
const allPass = metrics.every(m => m.value >= m.threshold);
const color = allPass ? '#2ea44f' : (avgCoverage >= 85 ? '#bf8700' : '#cb2431');

const combinedBadge = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20" role="img" aria-label="coverage: ${avgCoverage.toFixed(1)}%">
<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".1" stop-opacity=".1"/></linearGradient>
<mask id="m"><rect width="200" height="20" rx="3" fill="#fff"/></mask>
<g mask="url(#m)"><rect width="70" height="20" fill="#555"/><rect x="70" width="130" height="20" fill="${color}"/><rect width="200" height="20" fill="url(#s)"/></g>
<g fill="#fff" text-anchor="start" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
<text x="6" y="15" fill="#010101" fill-opacity=".3">coverage</text><text x="6" y="14">coverage</text>
<text x="76" y="15" fill="#010101" fill-opacity=".3">S:${cov.total.statements.pct}% B:${cov.total.branches.pct}% F:${cov.total.functions.pct}%</text><text x="76" y="14">S:${cov.total.statements.pct}% B:${cov.total.branches.pct}% F:${cov.total.functions.pct}%</text>
</g></svg>`;

fs.writeFileSync('badges/coverage-summary.svg', combinedBadge);

console.log(`✅ Generated coverage badges: statements=${cov.total.statements.pct}% branches=${cov.total.branches.pct}% functions=${cov.total.functions.pct}% lines=${cov.total.lines.pct}%`);