#!/usr/bin/env node
/**
 * Generates a detailed failure diff page showing exactly which budgets failed per URL
 * Creates artifacts/reports/budget-failures.html with detailed breakdown
 */
import fs from 'node:fs';
import path from 'node:path';

const readJSON = (p, fallback=null) => fs.existsSync(p) ? JSON.parse(fs.readFileSync(p,'utf8')) : fallback;
const budget = readJSON('artifacts/reports/lighthouse-budget-report.json', { rows:[] });

if (!budget.rows || budget.rows.length === 0) {
  console.log('⚠️ No budget data found, skipping failure diff generation');
  process.exit(0);
}

// Analyze failures
const failures = [];
const warnings = [];
let totalChecks = 0;
let passedChecks = 0;

for (const row of budget.rows) {
  const url = row.url;
  const metrics = row.metrics || {};
  const pass = row.pass || {};
  const budgets = row.budgets || {};
  const resourcesKB = row.resourcesKB || {};
  const sizePass = row.sizePass || {};
  
  const routeFailures = [];
  const routeWarnings = [];
  
  // Check timing budgets
  const timingBudgets = budgets.timings || {};
  for (const [metric, budget] of Object.entries(timingBudgets)) {
    totalChecks++;
    const actual = metrics[metric.replace('-', '')]; // fcp, lcp, tbt, cls
    const failed = pass[metric.replace('-', '')] === false;
    
    if (failed && actual !== null && actual !== undefined) {
      const over = metric === 'cumulative-layout-shift' ? 
        ((actual - budget) * 100).toFixed(1) : 
        Math.round(actual - budget);
      const unit = metric === 'cumulative-layout-shift' ? '' : 'ms';
      
      routeFailures.push({
        type: 'timing',
        metric: metric.toUpperCase(),
        actual: metric === 'cumulative-layout-shift' ? actual.toFixed(3) : Math.round(actual),
        budget,
        unit: metric === 'cumulative-layout-shift' ? '' : 'ms',
        over: over + unit,
        severity: actual > budget * 1.5 ? 'critical' : 'warning'
      });
    } else if (actual !== null && actual !== undefined) {
      passedChecks++;
      // Check for warnings (within budget but close)
      const warningThreshold = budget * 0.9;
      if (actual >= warningThreshold) {
        routeWarnings.push({
          type: 'timing-warning',
          metric: metric.toUpperCase(),
          actual: metric === 'cumulative-layout-shift' ? actual.toFixed(3) : Math.round(actual),
          budget,
          unit: metric === 'cumulative-layout-shift' ? '' : 'ms',
          usage: Math.round((actual / budget) * 100)
        });
      }
    }
  }
  
  // Check resource size budgets
  const sizeBudgets = budgets.resourceSizes || {};
  for (const [resourceType, budgetKB] of Object.entries(sizeBudgets)) {
    totalChecks++;
    const actualKB = resourcesKB[resourceType] || 0;
    const failed = sizePass[resourceType] === false;
    
    if (failed) {
      const overKB = actualKB - budgetKB;
      routeFailures.push({
        type: 'size',
        metric: resourceType.toUpperCase(),
        actual: actualKB,
        budget: budgetKB,
        unit: 'KB',
        over: overKB + 'KB',
        severity: actualKB > budgetKB * 1.5 ? 'critical' : 'warning'
      });
    } else {
      passedChecks++;
      // Check for warnings
      const warningThreshold = budgetKB * 0.9;
      if (actualKB >= warningThreshold) {
        routeWarnings.push({
          type: 'size-warning',
          metric: resourceType.toUpperCase(),
          actual: actualKB,
          budget: budgetKB,
          unit: 'KB',
          usage: Math.round((actualKB / budgetKB) * 100)
        });
      }
    }
  }
  
  if (routeFailures.length > 0) {
    failures.push({ url, failures: routeFailures });
  }
  
  if (routeWarnings.length > 0) {
    warnings.push({ url, warnings: routeWarnings });
  }
}

// Generate HTML report
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Budget Failure Analysis - TerraFusion OS</title>
  <style>
    :root {
      --bg: #0b0f14;
      --fg: #dce7f3;
      --card: #111722;
      --border: #1c2533;
      --critical: #ff6b6b;
      --warning: #ffa726;
      --success: #2ea44f;
      --info: #7cc4ff;
    }
    
    body {
      font-family: ui-sans-serif, system-ui, 'Segoe UI', Roboto, Arial;
      background: var(--bg);
      color: var(--fg);
      margin: 0;
      padding: 2rem;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1, h2, h3 {
      margin: 0 0 1rem;
    }
    
    .summary {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .metric {
      text-align: center;
    }
    
    .metric-value {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    
    .critical { color: var(--critical); }
    .warning { color: var(--warning); }
    .success { color: var(--success); }
    .info { color: var(--info); }
    
    .route-section {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }
    
    .route-header {
      background: rgba(255, 107, 107, 0.1);
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    
    .route-header.warning-header {
      background: rgba(255, 167, 38, 0.1);
    }
    
    .route-url {
      font-family: 'Courier New', monospace;
      font-size: 1.1rem;
      margin: 0;
    }
    
    .failure-list {
      padding: 1.5rem;
    }
    
    .failure-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      margin-bottom: 0.5rem;
      background: rgba(255, 107, 107, 0.05);
      border: 1px solid rgba(255, 107, 107, 0.2);
      border-radius: 8px;
    }
    
    .failure-item.warning-item {
      background: rgba(255, 167, 38, 0.05);
      border-color: rgba(255, 167, 38, 0.2);
    }
    
    .failure-metric {
      font-weight: bold;
      font-family: 'Courier New', monospace;
    }
    
    .failure-details {
      text-align: right;
      font-size: 0.9rem;
    }
    
    .over-budget {
      font-weight: bold;
      margin-top: 0.25rem;
    }
    
    .no-failures {
      text-align: center;
      padding: 2rem;
      color: var(--success);
      font-size: 1.2rem;
    }
    
    .tabs {
      display: flex;
      margin-bottom: 0;
      background: var(--card);
      border-radius: 12px 12px 0 0;
      border: 1px solid var(--border);
      border-bottom: none;
    }
    
    .tab {
      padding: 1rem 1.5rem;
      cursor: pointer;
      border-right: 1px solid var(--border);
      background: transparent;
      color: var(--fg);
      border: none;
      font-size: 1rem;
      transition: background-color 0.2s;
    }
    
    .tab:last-child {
      border-right: none;
    }
    
    .tab.active {
      background: rgba(124, 196, 255, 0.1);
      color: var(--info);
    }
    
    .tab:hover {
      background: rgba(124, 196, 255, 0.05);
    }
    
    .tab-content {
      background: var(--card);
      border: 1px solid var(--border);
      border-top: none;
      border-radius: 0 0 12px 12px;
      min-height: 200px;
    }
    
    .tab-panel {
      display: none;
      padding: 1.5rem;
    }
    
    .tab-panel.active {
      display: block;
    }
    
    .legend {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem;
      margin-top: 2rem;
      font-size: 0.9rem;
    }
    
    .legend h3 {
      margin-top: 0;
    }
    
    .legend-item {
      margin: 0.5rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Budget Failure Analysis</h1>
    
    <div class="summary">
      <div class="metric">
        <div class="metric-value success">${passedChecks}</div>
        <div>Checks Passed</div>
      </div>
      <div class="metric">
        <div class="metric-value critical">${totalChecks - passedChecks}</div>
        <div>Checks Failed</div>
      </div>
      <div class="metric">
        <div class="metric-value info">${budget.rows.length}</div>
        <div>Routes Tested</div>
      </div>
      <div class="metric">
        <div class="metric-value ${passedChecks === totalChecks ? 'success' : 'warning'}">${Math.round((passedChecks / totalChecks) * 100)}%</div>
        <div>Success Rate</div>
      </div>
    </div>
    
    <div class="tabs">
      <button class="tab active" onclick="showTab('failures')">❌ Failures (${failures.length})</button>
      <button class="tab" onclick="showTab('warnings')">⚠️ Warnings (${warnings.length})</button>
      <button class="tab" onclick="showTab('all')">📊 All Routes (${budget.rows.length})</button>
    </div>
    
    <div class="tab-content">
      <div id="failures" class="tab-panel active">
        ${failures.length === 0 ? 
          '<div class="no-failures">🎉 No budget failures detected! All routes are within performance budgets.</div>' :
          failures.map(route => `
            <div class="route-section">
              <div class="route-header">
                <h3 class="route-url">${route.url}</h3>
              </div>
              <div class="failure-list">
                ${route.failures.map(failure => `
                  <div class="failure-item ${failure.severity === 'critical' ? '' : 'warning-item'}">
                    <div>
                      <div class="failure-metric ${failure.severity}">${failure.metric}</div>
                      <div class="failure-details">
                        <div>Actual: ${failure.actual}${failure.unit} | Budget: ${failure.budget}${failure.unit}</div>
                        <div class="over-budget ${failure.severity}">Over by: ${failure.over}</div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')
        }
      </div>
      
      <div id="warnings" class="tab-panel">
        ${warnings.length === 0 ?
          '<div class="no-failures">✨ No warnings detected! All routes are comfortably within budgets.</div>' :
          warnings.map(route => `
            <div class="route-section">
              <div class="route-header warning-header">
                <h3 class="route-url">${route.url}</h3>
              </div>
              <div class="failure-list">
                ${route.warnings.map(warning => `
                  <div class="failure-item warning-item">
                    <div>
                      <div class="failure-metric warning">${warning.metric}</div>
                      <div class="failure-details">
                        <div>Actual: ${warning.actual}${warning.unit} | Budget: ${warning.budget}${warning.unit}</div>
                        <div class="over-budget warning">Usage: ${warning.usage}% of budget</div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')
        }
      </div>
      
      <div id="all" class="tab-panel">
        ${budget.rows.map(row => {
          const hasFailures = failures.some(f => f.url === row.url);
          const hasWarnings = warnings.some(w => w.url === row.url);
          const status = hasFailures ? '🔴 FAIL' : hasWarnings ? '🟡 WARN' : '🟢 PASS';
          
          return `
            <div class="route-section">
              <div class="route-header ${hasFailures ? '' : hasWarnings ? 'warning-header' : ''}" style="${!hasFailures && !hasWarnings ? 'background: rgba(46, 164, 79, 0.1);' : ''}">
                <h3 class="route-url">${row.url} ${status}</h3>
              </div>
              <div class="failure-list">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                  <div><strong>FCP:</strong> ${row.metrics.fcp ? Math.round(row.metrics.fcp) + 'ms' : '—'} ${row.pass.fcp !== false ? '✅' : '❌'}</div>
                  <div><strong>LCP:</strong> ${row.metrics.lcp ? Math.round(row.metrics.lcp) + 'ms' : '—'} ${row.pass.lcp !== false ? '✅' : '❌'}</div>
                  <div><strong>TBT:</strong> ${row.metrics.tbt ? Math.round(row.metrics.tbt) + 'ms' : '—'} ${row.pass.tbt !== false ? '✅' : '❌'}</div>
                  <div><strong>CLS:</strong> ${row.metrics.cls ? row.metrics.cls.toFixed(3) : '—'} ${row.pass.cls !== false ? '✅' : '❌'}</div>
                  <div><strong>Script:</strong> ${row.resourcesKB.script || 0}KB ${row.sizePass.script !== false ? '✅' : '❌'}</div>
                  <div><strong>Style:</strong> ${row.resourcesKB.style || 0}KB ${row.sizePass.style !== false ? '✅' : '❌'}</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <div class="legend">
      <h3>📖 Legend</h3>
      <div class="legend-item"><span class="critical">🔴 Critical:</span> Significantly over budget (>150% of limit)</div>
      <div class="legend-item"><span class="warning">🟡 Warning:</span> Over budget or close to limit (90-100%)</div>
      <div class="legend-item"><span class="success">🟢 Pass:</span> Within budget and performing well</div>
      <div class="legend-item"><strong>Budget Limits:</strong> FCP ≤1500ms, LCP ≤2500ms, TBT ≤200ms, CLS ≤0.1, Script ≤350KB, Style ≤120KB</div>
    </div>
  </div>
  
  <script>
    function showTab(tabName) {
      // Hide all panels
      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
      });
      
      // Remove active from all tabs
      document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
      });
      
      // Show selected panel and activate tab
      document.getElementById(tabName).classList.add('active');
      event.target.classList.add('active');
    }
  </script>
</body>
</html>`;

// Write the HTML report
fs.mkdirSync('artifacts/reports', { recursive: true });
fs.writeFileSync('artifacts/reports/budget-failures.html', html);

console.log(`✅ Generated failure diff report: ${failures.length} routes with failures, ${warnings.length} with warnings, ${passedChecks}/${totalChecks} checks passed`);