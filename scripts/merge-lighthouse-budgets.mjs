#!/usr/bin/env node
/**
 * Merge Lighthouse (.lhr.json) results with perf-budgets.json into one HTML dashboard.
 * Usage:
 *   node scripts/merge-lighthouse-budgets.mjs <lhciDir> <budgetFile> <outDir>
 * Example:
 *   node scripts/merge-lighthouse-budgets.mjs artifacts/lhci perf-budgets.json artifacts/reports
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const args = process.argv.slice(2);
const [lhciDir = 'artifacts/lhci', budgetFile = 'perf-budgets.json', outDir = 'artifacts/reports'] = args;

if (!fs.existsSync(lhciDir)) {
  console.error(`❌ LHCI dir not found: ${lhciDir}`);
  process.exit(1);
}
if (!fs.existsSync(budgetFile)) {
  console.error(`❌ Budgets file not found: ${budgetFile}`);
  process.exit(1);
}
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const budgets = JSON.parse(fs.readFileSync(budgetFile, 'utf8'));

/** @returns {{timings: Record<string, number>, resourceSizes: Record<string, number>}} */
function findBudgetFor(targetUrl) {
  // very simple wildcard matcher: first budget whose path === "/*" or base prefix of URL path
  const u = new URL(targetUrl);
  const pathBudgets = Array.isArray(budgets) ? budgets : [budgets];
  // Match longest path pattern
  let best = null;
  for (const b of pathBudgets) {
    const patt = b.path || '/*';
    if (patt === '/*') { best = best ?? b; continue; }
    const candidate = patt.replace(/\*$/, ''); // prefix match
    if (u.pathname.startsWith(candidate)) {
      if (!best || (candidate.length > (best.path?.length ?? 0))) best = b;
    }
  }
  return best ?? { timings: {}, resourceSizes: {} };
}

function kb(bytes) { return Math.round((bytes || 0) / 1024); }

function auditNum(lhr, key) {
  const a = lhr.audits?.[key];
  if (!a) return null;
  // Lighthouse stores ms in numericValue for timing; CLS is unitless
  return typeof a.numericValue === 'number' ? a.numericValue : null;
}

function resourceSummary(lhr) {
  const items = lhr.audits?.['resource-summary']?.details?.items ?? [];
  const grouped = {};
  for (const it of items) {
    const t = (it.resourceType || 'other').toLowerCase();
    grouped[t] = (grouped[t] || 0) + (it.transferSize ?? it.size ?? 0);
  }
  return grouped; // bytes by type
}

// Collect all .lhr.json
const entries = fs.readdirSync(lhciDir).filter(f => f.endsWith('.lhr.json'));
if (entries.length === 0) {
  console.error(`❌ No .lhr.json files in ${lhciDir}. Ensure LHCI was run with upload.target=filesystem.`);
  process.exit(1);
}

const rows = [];
for (const f of entries) {
  const p = path.join(lhciDir, f);
  const lhr = JSON.parse(fs.readFileSync(p, 'utf8'));
  const u = lhr.finalDisplayedUrl || lhr.requestedUrl;
  const b = findBudgetFor(u);

  const fcp = auditNum(lhr, 'first-contentful-paint');        // ms
  const lcp = auditNum(lhr, 'largest-contentful-paint');      // ms
  const tbt = auditNum(lhr, 'total-blocking-time');           // ms
  const cls = auditNum(lhr, 'cumulative-layout-shift');       // unitless

  const res = resourceSummary(lhr);
  const resKB = Object.fromEntries(Object.entries(res).map(([k,v]) => [k, kb(v)]));

  // Compare to budgets (if present)
  const timingsBudget = Object.fromEntries((b.timings ?? []).map(t => [t.metric, t.budget]));
  const sizesBudget   = Object.fromEntries((b.resourceSizes ?? []).map(r => [r.resourceType.toLowerCase(), r.budget]));

  const pass = {
    fcp: timingsBudget['first-contentful-paint'] == null ? true : (fcp != null && fcp <= timingsBudget['first-contentful-paint']),
    lcp: timingsBudget['largest-contentful-paint'] == null ? true : (lcp != null && lcp <= timingsBudget['largest-contentful-paint']),
    tbt: timingsBudget['total-blocking-time'] == null ? true : (tbt != null && tbt <= timingsBudget['total-blocking-time']),
    cls: timingsBudget['cumulative-layout-shift'] == null ? true : (cls != null && cls <= timingsBudget['cumulative-layout-shift']),
  };

  const sizePass = {};
  for (const [rtype, budgetKB] of Object.entries(sizesBudget)) {
    sizePass[rtype] = (resKB[rtype] ?? 0) <= budgetKB;
  }

  // try to find matching HTML report next to JSON
  const htmlCandidate = f.replace(/\.lhr\.json$/, '.report.html');
  const htmlExists = fs.existsSync(path.join(lhciDir, htmlCandidate));

  rows.push({
    url: u,
    file: f,
    html: htmlExists ? htmlCandidate : null,
    metrics: { fcp, lcp, tbt, cls },
    budgets: { timings: timingsBudget, resourceSizes: sizesBudget },
    resourcesKB: resKB,
    pass, sizePass
  });
}

// Write JSON
const outJson = path.join(outDir, 'lighthouse-budget-report.json');
fs.writeFileSync(outJson, JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2));

// Write HTML
const outHtml = path.join(outDir, 'lighthouse-budget-report.html');
const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Lighthouse Budget Report</title>
<style>
  :root { --ok:#0a7f2e; --bad:#b00020; --bg:#0b0f14; --fg:#dce7f3; --muted:#8ea3b0; --card:#111722; }
  body { font-family: ui-sans-serif,system-ui,Segoe UI,Roboto,Arial; background:var(--bg); color:var(--fg); margin:2rem; }
  h1 { margin:0 0 1rem; font-weight:700; }
  .muted { color:var(--muted); }
  table { border-collapse: collapse; width:100%; }
  th, td { border-bottom: 1px solid #1c2533; padding: .6rem .5rem; text-align:left; vertical-align: top; }
  th { color:#a8c1d8; font-weight:600; }
  tr:hover { background: #0f1622; }
  code { background:#0f1622; padding:.1rem .35rem; border-radius:.25rem; }
  .chip { border-radius:999px; padding:.1rem .6rem; font-size:.85rem; border:1px solid #223148; display:inline-block; }
  .ok { color:#d5ffe0; background:rgba(10,127,46,.15); border-color:rgba(10,127,46,.3); }
  .bad { color:#ffd7de; background:rgba(176,0,32,.15); border-color:rgba(176,0,32,.35); }
  .grid { display:grid; gap:1rem; grid-template-columns: repeat(2,minmax(0,1fr)); }
  .card { background:var(--card); border:1px solid #1c2533; padding:1rem; border-radius:12px; }
  a { color:#7cc4ff; text-decoration:none; }
  a:hover { text-decoration:underline; }
</style>
<h1>💡 Lighthouse Budget Report</h1>
<p class="muted">Merged from <code>${lhciDir}</code> with budgets in <code>${budgetFile}</code>. Generated ${new Date().toLocaleString()}.</p>

<table>
  <thead>
    <tr>
      <th>URL</th>
      <th>Timings (ms)</th>
      <th>CLS</th>
      <th>Resource Sizes (KB)</th>
      <th>Report</th>
    </tr>
  </thead>
  <tbody>
    ${rows.map(r => {
      const m = r.metrics, b = r.budgets;
      const badge = (ok) => `<span class="chip ${ok?'ok':'bad'}">${ok?'PASS':'FAIL'}</span>`;
      const rowRes = Object.keys(b.resourceSizes).map(rt=>{
        const used = r.resourcesKB[rt] ?? 0;
        const cap  = b.resourceSizes[rt];
        return `<div>${rt}: ${used} / ${cap} ${badge((used<=cap))}</div>`;
      }).join('') || '<div class="muted">no resource budgets</div>';
      return `
        <tr>
          <td style="max-width:420px;word-break:break-word;">
            <div><strong>${r.url}</strong></div>
            <div class="muted">${r.file}</div>
          </td>
          <td>
            <div>FCP: ${m.fcp ?? '—'} ${b.timings['first-contentful-paint']!=null?`/ ${b.timings['first-contentful-paint']}`:''} ${badge(r.pass.fcp)}</div>
            <div>LCP: ${m.lcp ?? '—'} ${b.timings['largest-contentful-paint']!=null?`/ ${b.timings['largest-contentful-paint']}`:''} ${badge(r.pass.lcp)}</div>
            <div>TBT: ${m.tbt ?? '—'} ${b.timings['total-blocking-time']!=null?`/ ${b.timings['total-blocking-time']}`:''} ${badge(r.pass.tbt)}</div>
          </td>
          <td>
            <div>${m.cls ?? '—'} ${b.timings['cumulative-layout-shift']!=null?`/ ${b.timings['cumulative-layout-shift']}`:''} ${badge(r.pass.cls)}</div>
          </td>
          <td>${rowRes}</td>
          <td>${r.html ? `<a href="../lhci/${r.html}" target="_blank">Open</a>` : '<span class="muted">n/a</span>'}</td>
        </tr>
      `;
    }).join('')}
  </tbody>
</table>
`;
fs.writeFileSync(outHtml, html);
console.log(`✅ Wrote ${outHtml}`);
console.log(`✅ Wrote ${outJson}`);