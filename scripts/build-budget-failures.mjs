#!/usr/bin/env node
/**
 * Alternative implementation for budget failure-diff page
 * Creates detailed HTML report showing exactly which budgets failed
 * Outputs to artifacts/reports/budget-failure-analysis.html
 */
import fs from 'node:fs';

const budgetPath = 'artifacts/reports/lighthouse-budget-report.json';
if (!fs.existsSync(budgetPath)) {
  console.error('❌ lighthouse-budget-report.json not found. Run Lighthouse CI first.');
  process.exit(1);
}

const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
if (!budget.rows || budget.rows.length === 0) {
  console.log('⚠️ No budget data found, skipping failure analysis');
  process.exit(0);
}

// Analyze each route for failures and warnings
const analysis = {
  routes: [],
  summary: {
    totalRoutes: budget.rows.length,
    passingRoutes: 0,
    failingRoutes: 0,
    totalChecks: 0,
    failedChecks: 0
  }
};

for (const row of budget.rows) {
  const route = {
    url: row.url,
    path: row.url.replace(/^https?:\/\/[^\/]+/, '') || '/',
    failures: [],
    warnings: [],
    metrics: row.metrics || {},
    budgets: row.budgets || {}
  };
  
  let routeHasFailures = false;
  
  // Check timing budgets
  const timingBudgets = row.budgets?.timings || {};
  for (const [metric, budgetValue] of Object.entries(timingBudgets)) {
    analysis.summary.totalChecks++;
    const actualKey = metric.replace(/-/g, ''); // fcp, lcp, tbt, cls
    const actual = row.metrics?.[actualKey];
    const passed = row.pass?.[actualKey] !== false;
    
    if (!passed && actual != null) {
      analysis.summary.failedChecks++;
      routeHasFailures = true;
      
      const unit = metric === 'cumulative-layout-shift' ? '' : 'ms';
      const overAmount = metric === 'cumulative-layout-shift' ? 
        ((actual - budgetValue) * 100).toFixed(1) : 
        Math.round(actual - budgetValue);
      
      route.failures.push({
        category: 'Performance',
        metric: metric.replace(/-/g, ' ').toUpperCase(),
        actual: metric === 'cumulative-layout-shift' ? actual.toFixed(3) : Math.round(actual),
        budget: budgetValue,
        unit,
        overBy: overAmount + unit,
        severity: actual > budgetValue * 1.5 ? 'critical' : 'major'
      });
    } else if (actual != null) {
      // Check for warnings (90-100% of budget)
      const warningThreshold = budgetValue * 0.9;
      if (actual >= warningThreshold) {
        const usage = Math.round((actual / budgetValue) * 100);
        route.warnings.push({
          category: 'Performance',
          metric: metric.replace(/-/g, ' ').toUpperCase(),
          actual: metric === 'cumulative-layout-shift' ? actual.toFixed(3) : Math.round(actual),
          budget: budgetValue,
          unit: metric === 'cumulative-layout-shift' ? '' : 'ms',
          usage: usage + '%'
        });
      }
    }
  }
  
  // Check resource size budgets
  const sizeBudgets = row.budgets?.resourceSizes || {};
  for (const [resource, budgetKB] of Object.entries(sizeBudgets)) {
    analysis.summary.totalChecks++;
    const actualKB = row.resourcesKB?.[resource] || 0;
    const passed = row.sizePass?.[resource] !== false;
    
    if (!passed) {
      analysis.summary.failedChecks++;
      routeHasFailures = true;
      
      route.failures.push({
        category: 'Bundle Size',
        metric: resource.toUpperCase(),
        actual: actualKB,
        budget: budgetKB,
        unit: 'KB',
        overBy: (actualKB - budgetKB) + 'KB',
        severity: actualKB > budgetKB * 1.5 ? 'critical' : 'major'
      });
    } else {
      // Check for warnings
      const warningThreshold = budgetKB * 0.9;
      if (actualKB >= warningThreshold) {
        route.warnings.push({
          category: 'Bundle Size',
          metric: resource.toUpperCase(),
          actual: actualKB,
          budget: budgetKB,
          unit: 'KB',
          usage: Math.round((actualKB / budgetKB) * 100) + '%'
        });
      }
    }
  }
  
  analysis.routes.push(route);
  if (routeHasFailures) {
    analysis.summary.failingRoutes++;
  } else {
    analysis.summary.passingRoutes++;
  }
}

// Generate comprehensive HTML report
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Budget Failure Analysis - TerraFusion OS</title>
  <style>
    * { box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0d1117;
      color: #e6edf3;
      margin: 0;
      padding: 2rem;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    h1, h2, h3 { margin: 0 0 1rem; }
    
    .header {
      text-align: center;
      margin-bottom: 3rem;
      padding: 2rem;
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      border-radius: 16px;
      border: 1px solid #374151;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin: 2rem 0;
    }
    
    .stat-card {
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
    }
    
    .stat-value {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    
    .stat-label {
      color: #8b949e;
      font-size: 0.9rem;
    }
    
    .success { color: #238636; }
    .warning { color: #d29922; }
    .critical { color: #f85149; }
    .info { color: #58a6ff; }
    
    .route-card {
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 12px;
      margin: 1.5rem 0;
      overflow: hidden;
    }
    
    .route-header {
      padding: 1.5rem;
      border-bottom: 1px solid #30363d;
    }
    
    .route-header.has-failures {
      background: rgba(248, 81, 73, 0.1);
      border-bottom-color: rgba(248, 81, 73, 0.2);
    }
    
    .route-header.has-warnings {
      background: rgba(210, 153, 34, 0.1);
      border-bottom-color: rgba(210, 153, 34, 0.2);
    }
    
    .route-url {
      font-family: 'SF Mono', Consolas, monospace;
      font-size: 1.2rem;
      color: #58a6ff;
    }
    
    .route-status {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: bold;
      margin-left: 1rem;
    }
    
    .status-pass { background: #238636; color: white; }
    .status-fail { background: #f85149; color: white; }
    .status-warn { background: #d29922; color: white; }
    
    .issues-section {
      padding: 1.5rem;
    }
    
    .issue-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1rem;
    }
    
    .issue-item {
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 8px;
      padding: 1rem;
    }
    
    .issue-item.failure {
      border-left: 4px solid #f85149;
    }
    
    .issue-item.warning {
      border-left: 4px solid #d29922;
    }
    
    .issue-category {
      font-size: 0.8rem;
      color: #8b949e;
      margin-bottom: 0.25rem;
    }
    
    .issue-metric {
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    
    .issue-details {
      font-family: 'SF Mono', Consolas, monospace;
      font-size: 0.9rem;
      color: #8b949e;
    }
    
    .no-issues {
      text-align: center;
      padding: 3rem;
      color: #238636;
      font-size: 1.2rem;
    }
    
    .section-tabs {
      display: flex;
      margin: 2rem 0 0;
      border-bottom: 1px solid #30363d;
    }
    
    .tab-button {
      background: none;
      border: none;
      padding: 1rem 1.5rem;
      color: #8b949e;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    
    .tab-button.active {
      color: #58a6ff;
      border-bottom-color: #58a6ff;
    }
    
    .tab-content {
      margin: 2rem 0;
    }
    
    .tab-panel {
      display: none;
    }
    
    .tab-panel.active {
      display: block;
    }
    
    .legend {
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 3rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 Performance Budget Failure Analysis</h1>
      <p>Comprehensive analysis of Lighthouse performance budget compliance</p>
    </div>
    
    <div class="summary-grid">
      <div class="stat-card">
        <div class="stat-value success">${analysis.summary.passingRoutes}</div>
        <div class="stat-label">Routes Passing</div>
      </div>
      <div class="stat-card">
        <div class="stat-value critical">${analysis.summary.failingRoutes}</div>
        <div class="stat-label">Routes Failing</div>
      </div>
      <div class="stat-card">
        <div class="stat-value info">${analysis.summary.totalRoutes}</div>
        <div class="stat-label">Total Routes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value ${analysis.summary.failedChecks === 0 ? 'success' : 'warning'}">${Math.round(((analysis.summary.totalChecks - analysis.summary.failedChecks) / analysis.summary.totalChecks) * 100)}%</div>
        <div class="stat-label">Success Rate</div>
      </div>
    </div>
    
    <div class="section-tabs">
      <button class="tab-button active" onclick="showTab('failures')">❌ Failures (${analysis.routes.filter(r => r.failures.length > 0).length})</button>
      <button class="tab-button" onclick="showTab('warnings')">⚠️ Warnings (${analysis.routes.filter(r => r.warnings.length > 0).length})</button>
      <button class="tab-button" onclick="showTab('all')">📊 All Routes (${analysis.summary.totalRoutes})</button>
    </div>
    
    <div class="tab-content">
      <div id="failures" class="tab-panel active">
        ${analysis.routes.filter(r => r.failures.length > 0).length === 0 ? 
          '<div class="no-issues">🎉 No budget failures detected! All routes are performing within budgets.</div>' :
          analysis.routes.filter(r => r.failures.length > 0).map(route => `
            <div class="route-card">
              <div class="route-header has-failures">
                <span class="route-url">${route.path}</span>
                <span class="route-status status-fail">FAILING</span>
              </div>
              <div class="issues-section">
                <div class="issue-grid">
                  ${route.failures.map(failure => `
                    <div class="issue-item failure">
                      <div class="issue-category">${failure.category}</div>
                      <div class="issue-metric critical">${failure.metric}</div>
                      <div class="issue-details">
                        Actual: ${failure.actual}${failure.unit}<br>
                        Budget: ${failure.budget}${failure.unit}<br>
                        <span class="critical">Over by: ${failure.overBy}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `).join('')
        }
      </div>
      
      <div id="warnings" class="tab-panel">
        ${analysis.routes.filter(r => r.warnings.length > 0).length === 0 ?
          '<div class="no-issues">✨ No warnings detected! All routes are comfortably within budgets.</div>' :
          analysis.routes.filter(r => r.warnings.length > 0).map(route => `
            <div class="route-card">
              <div class="route-header has-warnings">
                <span class="route-url">${route.path}</span>
                <span class="route-status status-warn">WARNING</span>
              </div>
              <div class="issues-section">
                <div class="issue-grid">
                  ${route.warnings.map(warning => `
                    <div class="issue-item warning">
                      <div class="issue-category">${warning.category}</div>
                      <div class="issue-metric warning">${warning.metric}</div>
                      <div class="issue-details">
                        Actual: ${warning.actual}${warning.unit}<br>
                        Budget: ${warning.budget}${warning.unit}<br>
                        <span class="warning">Usage: ${warning.usage} of budget</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `).join('')
        }
      </div>
      
      <div id="all" class="tab-panel">
        ${analysis.routes.map(route => {
          const hasFailures = route.failures.length > 0;
          const hasWarnings = route.warnings.length > 0;
          const status = hasFailures ? 'FAIL' : hasWarnings ? 'WARN' : 'PASS';
          const statusClass = hasFailures ? 'status-fail' : hasWarnings ? 'status-warn' : 'status-pass';
          
          return `
            <div class="route-card">
              <div class="route-header ${hasFailures ? 'has-failures' : hasWarnings ? 'has-warnings' : ''}">
                <span class="route-url">${route.path}</span>
                <span class="route-status ${statusClass}">${status}</span>
              </div>
              <div class="issues-section">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; font-family: 'SF Mono', Consolas, monospace; font-size: 0.9rem;">
                  <div><strong>FCP:</strong> ${route.metrics.fcp ? Math.round(route.metrics.fcp) + 'ms' : '—'}</div>
                  <div><strong>LCP:</strong> ${route.metrics.lcp ? Math.round(route.metrics.lcp) + 'ms' : '—'}</div>
                  <div><strong>TBT:</strong> ${route.metrics.tbt ? Math.round(route.metrics.tbt) + 'ms' : '—'}</div>
                  <div><strong>CLS:</strong> ${route.metrics.cls ? route.metrics.cls.toFixed(3) : '—'}</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <div class="legend">
      <h3>📖 Reference</h3>
      <p><strong>Performance Budgets:</strong> FCP ≤1500ms, LCP ≤2500ms, TBT ≤200ms, CLS ≤0.1</p>
      <p><strong>Bundle Size Budgets:</strong> JavaScript ≤350KB, CSS ≤120KB</p>
      <p><strong>Severity Levels:</strong> Critical (>150% of budget), Major (100-150% of budget), Warning (90-100% of budget)</p>
    </div>
  </div>
  
  <script>
    function showTab(tabName) {
      // Hide all panels
      document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
      });
      
      // Remove active from all tabs
      document.querySelectorAll('.tab-button').forEach(tab => {
        tab.classList.remove('active');
      });
      
      // Show selected panel and activate tab
      document.getElementById(tabName).classList.add('active');
      event.target.classList.add('active');
    }
  </script>
</body>
</html>`;

// Write the analysis report
fs.mkdirSync('artifacts/reports', { recursive: true });
fs.writeFileSync('artifacts/reports/budget-failure-analysis.html', html);

// Also write JSON summary for Slack notifier
const jsonSummary = {
  summary: analysis.summary,
  failures: analysis.routes.filter(r => r.failures.length > 0).map(route => ({
    url: route.path,
    failures: route.failures.map(f => ({
      type: f.category.toLowerCase().includes('size') ? 'resource' : 'timing',
      metric: f.metric,
      overBy: f.severity === 'critical' ? parseFloat(f.overBy) : parseFloat(f.overBy),
      overByKB: f.unit === 'KB' ? parseFloat(f.overBy) : null
    }))
  }))
};

fs.writeFileSync('artifacts/reports/budget-failures.json', JSON.stringify(jsonSummary, null, 2));

console.log(`✅ Generated budget failure analysis: ${analysis.summary.failingRoutes} failing routes, ${analysis.summary.failedChecks} failed checks`);