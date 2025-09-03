#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const site = 'site';
const srcPW = 'playwright-report';
const srcLH = 'lighthouse-reports';
const srcMisc = 'perf-a11y-artifacts';
const merged = 'artifacts/reports';
const coverage = 'coverage-html';                 // NEW: coverage artifact dir
const historyFile = 'reports/history/history.jsonl'; // committed history

fs.rmSync(site, { recursive: true, force: true });
fs.mkdirSync(site, { recursive: true });

const cp = (src, dst) => fs.existsSync(src) && fs.cpSync(src, dst, { recursive: true, force: true });

cp(srcPW, path.join(site, 'playwright'));
cp(srcLH, path.join(site, 'lhci'));
cp(srcMisc, path.join(site, 'artifacts'));
cp(merged, path.join(site, 'reports'));
cp(coverage, path.join(site, 'coverage'));

let history = [];
if (fs.existsSync(historyFile)) {
  history = fs.readFileSync(historyFile, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
  fs.mkdirSync(path.join(site, 'history'), { recursive: true });
  const html = `<!doctype html>
<html><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Quality History</title>
<style>body{font-family:system-ui,Segoe UI,Roboto,Arial;margin:2rem;background:#0b0f14;color:#dce7f3}
h1{margin:0 0 1rem}.muted{color:#8ea3b0}.card{background:#111722;border:1px solid #1c2533;border-radius:12px;padding:1rem}
.grid{display:grid;grid-template-columns:1fr;gap:16px}canvas{background:#0f1622;border-radius:8px}</style>
<h1>📈 Quality Timeline</h1>
<div class="grid">
  <div class="card"><h3>Coverage & Branches</h3><canvas id="cov"></canvas></div>
  <div class="card"><h3>LCP & CLS</h3><canvas id="perf"></canvas></div>
  <div class="card"><h3>Deltas (vs previous)</h3><canvas id="delta"></canvas></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
const data=${JSON.stringify(history)};
const labels=data.map(d=>new Date(d.ts).toLocaleString());
const cov=data.map(d=>Math.round((d.coverage||0)*100));       // %
const br =data.map(d=>Math.round((d.branches||0)*100));       // %
const lcp=data.map(d=>Math.round(d.lcp||0));                   // ms
const cls=data.map(d=>Number((d.cls??0).toFixed(3)));          // unitless
const dcov=data.map(d=>d.delta_coverage!=null?Math.round(d.delta_coverage*100):null);
const dbr =data.map(d=>d.delta_branches!=null?Math.round(d.delta_branches*100):null);
const dlcp=data.map(d=>d.delta_lcp);  // ms
const dcls=data.map(d=>d.delta_cls);  // unitless

new Chart(document.getElementById('cov'),{
  type:'line',
  data:{ labels, datasets:[
    {label:'Statements %', data: cov, borderWidth:2},
    {label:'Branches %', data: br, borderWidth:2},
  ]},
  options:{ responsive:true, scales:{ y:{ beginAtZero:true, max:100 } } }
});

new Chart(document.getElementById('perf'),{
  type:'line',
  data:{ labels, datasets:[
    {label:'LCP ms', data: lcp, borderWidth:2, yAxisID:'y'},
    {label:'CLS', data: cls, borderWidth:2, yAxisID:'y1'},
  ]},
  options:{ responsive:true,
    scales:{ y:{ beginAtZero:true, position:'left', title:{display:true,text:'ms'} },
             y1:{ beginAtZero:true, position:'right', title:{display:true,text:'unitless'}, grid:{drawOnChartArea:false} } }
  }
});

new Chart(document.getElementById('delta'),{
  type:'bar',
  data:{ labels, datasets:[
    {label:'Δ LCP (ms)', data: dlcp, borderWidth:1, yAxisID:'y'},
    {label:'Δ CLS', data: dcls, borderWidth:1, yAxisID:'y1'},
    {label:'Δ Statements (pp)', data: dcov, borderWidth:1, yAxisID:'y2'},
    {label:'Δ Branches (pp)', data: dbr, borderWidth:1, yAxisID:'y2'},
  ]},
  options:{ responsive:true,
    scales:{ y:{ title:{display:true,text:'ms'} },
             y1:{ position:'right', grid:{drawOnChartArea:false}, title:{display:true,text:'unitless'} },
             y2:{ position:'right', grid:{drawOnChartArea:false}, title:{display:true,text:'percentage points'} } }
  }
});
</script>`;
  fs.writeFileSync(path.join(site, 'history', 'index.html'), html);
}

const hasMerged = fs.existsSync(path.join(site, 'reports', 'lighthouse-budget-report.html'));
const hasFailureDiff = fs.existsSync(path.join(site, 'reports', 'budget-failures.html'));

const index = `<!doctype html>
<html lang="en"><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Test & Perf Reports</title>
<style>
body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial;background:#0b0f14;color:#dce7f3;margin:2.5rem}
h1{margin:0 0 1rem}.card{background:#111722;border:1px solid #1c2533;border-radius:12px;padding:1rem;margin:.75rem 0}
a{color:#7cc4ff;text-decoration:none}a:hover{text-decoration:underline}.muted{color:#8ea3b0}ul{margin:.2rem 0 .6rem 1.2rem}
</style>
<h1>📊 TerraFusion Reports</h1>
<div class="card"><h2>End-to-End (Playwright)</h2><p class="muted">Cross-browser traces, videos, failures.</p><p><a href="./playwright/index.html" target="_blank">Open Playwright Report</a></p></div>
<div class="card"><h2>Coverage (Istanbul)</h2><p class="muted">HTML coverage explorer with line-by-line analysis.</p><p><a href="./coverage/index.html" target="_blank">Open Coverage Report</a></p></div>
<div class="card"><h2>Lighthouse (LHCI)</h2><p class="muted">Perf, a11y, SEO, best-practices with budget analysis.</p>
<ul><li><a href="./lhci" target="_blank">LHCI Files</a> (Raw HTML & JSON reports)</li>${hasMerged?'<li><a href="./reports/lighthouse-budget-report.html" target="_blank">Budget Dashboard</a> (Pass/fail summary)</li>':''}${hasFailureDiff?'<li><a href="./reports/budget-failures.html" target="_blank">Failure Analysis</a> (Detailed breakdown)</li>':''}</ul></div>
${history.length?'<div class="card"><h2>Quality History</h2><p class="muted">Trend analysis with Chart.js visualization.</p><p><a href="./history/index.html" target="_blank">Open Timeline</a></p></div>':''}
<div class="card"><h2>Raw Artifacts</h2><p class="muted">JSON files for CI integration and automation.</p><p><a href="./artifacts" target="_blank">Browse Artifacts</a></p></div>
<footer class="muted">Generated ${new Date().toLocaleString()} • TerraFusion OS Government AI Platform</footer>`;
fs.writeFileSync(path.join(site, 'index.html'), index);

console.log('✅ Built static site at ./site');