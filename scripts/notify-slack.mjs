#!/usr/bin/env node
/**
 * Posts a CI summary to Slack (Incoming Webhook).
 * Inputs (files are optional but recommended):
 *  - coverage/coverage-summary.json
 *  - artifacts/perf.json                      { lcp, fcp }
 *  - artifacts/a11y.json                      { violations }
 *  - artifacts/reports/lighthouse-budget-report.json
 *  - artifacts/reports/budget-failures.json   (from build-budget-failures.mjs)
 *
 * ENV:
 *  - SLACK_WEBHOOK_URL  (required)
 *  - PAGES_URL          (optional; e.g., https://<org>.github.io/<repo>/ )
 *  - GITHUB_SHA, GITHUB_REF, GITHUB_RUN_ID (optional, set in Actions)
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import url from 'node:url';

const hook = process.env.SLACK_WEBHOOK_URL;
if (!hook) {
  console.error('❌ SLACK_WEBHOOK_URL not set. Skipping Slack notification.');
  process.exit(0);
}

const readJSON = (p, fb = null) =>
  fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : fb;

const cov = readJSON('coverage/coverage-summary.json', { total: { statements: { pct: 0 }, branches: { pct: 0 } } });
const perf = readJSON('artifacts/perf.json', {});
const a11y = readJSON('artifacts/a11y.json', { violations: 0 });
const budget = readJSON('artifacts/reports/lighthouse-budget-report.json', { rows: [] });
const failures = readJSON('artifacts/reports/budget-failures.json', { failures: [] });

const coverageStmts = cov.total?.statements?.pct ?? 0;
const coverageBranches = cov.total?.branches?.pct ?? 0;
const lcp = perf.lcp ?? perf.fcp ?? null;
const a11yViol = Number(a11y.violations ?? 0);

// route budgets pass/fail
const rows = budget.rows || [];
const passed = rows.filter(r => {
  const tOK = [r.pass?.fcp, r.pass?.lcp, r.pass?.tbt, r.pass?.cls].every(v => v !== false);
  const sOK = Object.values(r.sizePass || {}).every(Boolean);
  return tOK && sOK;
}).length;
const total = rows.length;

// top N failures for message
const topN = 5;
const failuresList = (failures.failures || []).slice(0, topN).map(f => {
  const parts = f.failures.map(x => {
    if (x.type === 'resource') return `res:${x.metric} +${x.overByKB}KB`;
    const unit = x.metric === 'cumulative-layout-shift' ? '' : 'ms';
    return `${x.metric} +${Math.round(x.overBy)}${unit}`;
  });
  return { url: f.url, details: parts.join(', ') || '—' };
});

const pages = process.env.PAGES_URL || null;
const pagePlaywright = pages ? `${pages}playwright/index.html` : null;
const pageCoverage   = pages ? `${pages}coverage/index.html`   : null;
const pageBudget     = pages ? `${pages}reports/lighthouse-budget-report.html` : null;
const pageFailures   = pages ? `${pages}failures/index.html`   : null;
const pageHistory    = pages ? `${pages}history/index.html`    : null;

const sha = (process.env.GITHUB_SHA || '').slice(0, 7);
const ref = process.env.GITHUB_REF || '';
const run = process.env.GITHUB_RUN_ID ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null;

const headerText = `TerraFusion • Test & Perf Summary ${sha ? `(<${run || '#'}|${sha}>)` : ''}`;

const blocks = [
  { type: 'header', text: { type: 'plain_text', text: headerText, emoji: true } },
  {
    type: 'section',
    fields: [
      { type: 'mrkdwn', text: `*Statements*: ${coverageStmts.toFixed(1)}%` },
      { type: 'mrkdwn', text: `*Branches*: ${coverageBranches.toFixed(1)}%` },
      { type: 'mrkdwn', text: `*LCP*: ${lcp != null ? `${Math.round(lcp)} ms` : 'n/a'}` },
      { type: 'mrkdwn', text: `*A11y Violations*: ${a11yViol}` },
      { type: 'mrkdwn', text: `*Budgets*: ${passed}/${total} routes` },
      { type: 'mrkdwn', text: `*Ref*: ${ref || '(n/a)'}` }
    ]
  },
];

if (pages) {
  blocks.push({
    type: 'actions',
    elements: [
      ...(pagePlaywright ? [{ type: 'button', text: { type: 'plain_text', text: 'Playwright' }, url: pagePlaywright }] : []),
      ...(pageCoverage   ? [{ type: 'button', text: { type: 'plain_text', text: 'Coverage'   }, url: pageCoverage   }] : []),
      ...(pageBudget     ? [{ type: 'button', text: { type: 'plain_text', text: 'Budget Dash'}, url: pageBudget     }] : []),
      ...(pageFailures   ? [{ type: 'button', text: { type: 'plain_text', text: 'Failures'    }, url: pageFailures   }] : []),
      ...(pageHistory    ? [{ type: 'button', text: { type: 'plain_text', text: 'History'     }, url: pageHistory    }] : []),
    ]
  });
}

if (failuresList.length) {
  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: '*Top Budget Failures*' }
  });
  blocks.push({
    type: 'context',
    elements: failuresList.map(f => ({ type: 'mrkdwn', text: `• <${f.url}|${f.url}> — ${f.details}` }))
  });
}

const payload = JSON.stringify({ blocks });
const { hostname, pathname, protocol } = new url.URL(hook);
const req = https.request(
  { method: 'POST', hostname, path: pathname + (hook.split(hostname)[1]?.replace(hostname, '') || ''), protocol, headers: { 'Content-Type': 'application/json' } },
  (res) => {
    res.on('data', ()=>{});
    res.on('end', () => console.log(`✅ Slack notified (${res.statusCode})`));
  }
);
req.on('error', (e) => console.error('❌ Slack error', e));
req.write(payload);
req.end();