/**
 * Terrafusion OS - API Performance Benchmark Suite
 * Measures real API performance against production SLOs
 */

import { check } from 'k6';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for tracking
const apiLatency = new Trend('api_latency');
const apiErrors = new Rate('api_errors');
const authLatency = new Trend('auth_latency');
const propertyLatency = new Trend('property_latency');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Warm-up
    { duration: '1m', target: 50 },    // Ramp to normal load
    { duration: '3m', target: 100 },   // Stay at normal load
    { duration: '1m', target: 500 },   // Spike to peak load
    { duration: '2m', target: 500 },   // Stay at peak
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<200', 'p(99)<500'],  // SLO targets
    'api_latency': ['p(50)<50', 'p(95)<200', 'p(99)<500'],
    'auth_latency': ['p(95)<2000'],  // Auth should be <2s
    'property_latency': ['p(95)<3000'], // Property valuation <3s
    'api_errors': ['rate<0.01'],  // Error rate <1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000';

// Test data - Benton County properties
const testPropertyIds = [
  '089247001', '089247002', '089247003', '089247004', '089247005',
  '089247006', '089247007', '089247008', '089247009', '089247010',
];

export default function() {
  // Benchmark: Authentication endpoint
  const authStart = Date.now();
  const authRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    username: 'benchmark@bentoncounty.gov',
    password: 'BenchmarkTest123!',
    mfa_code: '123456'  // Testing MFA performance
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  authLatency.add(Date.now() - authStart);
  
  check(authRes, {
    'auth status is 200': (r) => r.status === 200,
    'auth has token': (r) => r.json('token') !== undefined,
    'auth latency < 2s': (r) => Date.now() - authStart < 2000,
  }) || apiErrors.add(1);

  const token = authRes.json('token');
  const authHeader = { 'Authorization': `Bearer ${token}` };

  // Benchmark: Property lookup endpoint
  const propertyId = testPropertyIds[Math.floor(Math.random() * testPropertyIds.length)];
  const propStart = Date.now();
  const propRes = http.get(`${BASE_URL}/api/properties/${propertyId}`, {
    headers: authHeader,
  });
  
  propertyLatency.add(Date.now() - propStart);
  apiLatency.add(Date.now() - propStart);
  
  check(propRes, {
    'property status is 200': (r) => r.status === 200,
    'property has data': (r) => r.json('parcelNumber') !== undefined,
    'property latency < 1s': (r) => Date.now() - propStart < 1000,
  }) || apiErrors.add(1);

  // Benchmark: Property valuation endpoint (AI-powered)
  const valuationStart = Date.now();
  const valuationRes = http.post(`${BASE_URL}/api/properties/${propertyId}/valuation`, 
    JSON.stringify({ method: 'ai_enhanced' }),
    { headers: { ...authHeader, 'Content-Type': 'application/json' } }
  );
  
  apiLatency.add(Date.now() - valuationStart);
  
  check(valuationRes, {
    'valuation status is 200': (r) => r.status === 200,
    'valuation has estimate': (r) => r.json('estimatedValue') > 0,
    'valuation latency < 3s': (r) => Date.now() - valuationStart < 3000,
  }) || apiErrors.add(1);

  // Benchmark: Bulk operations
  const bulkStart = Date.now();
  const bulkRes = http.post(`${BASE_URL}/api/properties/bulk/search`,
    JSON.stringify({
      county: 'Benton',
      limit: 100,
      filters: {
        minValue: 100000,
        maxValue: 500000,
        propertyType: 'residential'
      }
    }),
    { headers: { ...authHeader, 'Content-Type': 'application/json' } }
  );
  
  apiLatency.add(Date.now() - bulkStart);
  
  check(bulkRes, {
    'bulk status is 200': (r) => r.status === 200,
    'bulk returns results': (r) => r.json('properties') && r.json('properties').length > 0,
    'bulk latency < 5s': (r) => Date.now() - bulkStart < 5000,
  }) || apiErrors.add(1);

  // Benchmark: Harris PACS sync endpoint
  const syncStart = Date.now();
  const syncRes = http.get(`${BASE_URL}/api/sync/harris-pacs/status`, {
    headers: authHeader,
  });
  
  apiLatency.add(Date.now() - syncStart);
  
  check(syncRes, {
    'sync status is 200': (r) => r.status === 200,
    'sync is active': (r) => r.json('status') === 'active',
    'sync latency < 500ms': (r) => Date.now() - syncStart < 500,
  }) || apiErrors.add(1);
}

export function handleSummary(data) {
  return {
    'bench/reports/api-performance.json': JSON.stringify(data, null, 2),
    'bench/reports/api-performance.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function htmlReport(data) {
  const metrics = data.metrics;
  return `
<!DOCTYPE html>
<html>
<head>
<>
<>
<>
<>

  <title>API Performance Report - Terrafusion OS</title>
  <style
</>
</>
</>
</>>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .metric { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    .pass { color: green; }
    .fail { color: red; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
  </style>
</head>
<body>
<>
<>
<>
<>

  <h1>API Performance Benchmark Results</h1>
  <div
</>
</>
</>
</> class="metric">
<>
<>
<>
<>

    <h2>Overall API Latency</h2>
    <table
</>
</>
</>
</>>
      <tr><th>Percentile</th><th>Latency (ms)</th><th>Target</th><th>Status</th></tr>
      <tr>
<>
<>
<>
<>

        <td>p50</td>
        <td
</>
</>
</>
</>>${metrics.api_latency.values['p(50)'].toFixed(2)}</td>
<>
<>
<>
<>

        <td>&lt;50ms</td>
        <td
</>
</>
</>
</> class="${metrics.api_latency.values['p(50)'] < 50 ? 'pass' : 'fail'}">
          ${metrics.api_latency.values['p(50)'] < 50 ? '✅' : '❌'}
        </td>
      </tr>
      <tr>
<>
<>
<>
<>

        <td>p95</td>
        <td
</>
</>
</>
</>>${metrics.api_latency.values['p(95)'].toFixed(2)}</td>
<>
<>
<>
<>

        <td>&lt;200ms</td>
        <td
</>
</>
</>
</> class="${metrics.api_latency.values['p(95)'] < 200 ? 'pass' : 'fail'}">
          ${metrics.api_latency.values['p(95)'] < 200 ? '✅' : '❌'}
        </td>
      </tr>
      <tr>
<>
<>
<>
<>

        <td>p99</td>
        <td
</>
</>
</>
</>>${metrics.api_latency.values['p(99)'].toFixed(2)}</td>
<>
<>
<>
<>

        <td>&lt;500ms</td>
        <td
</>
</>
</>
</> class="${metrics.api_latency.values['p(99)'] < 500 ? 'pass' : 'fail'}">
          ${metrics.api_latency.values['p(99)'] < 500 ? '✅' : '❌'}
        </td>
      </tr>
    </table>
  </div>
  <div class="metric">
<>
<>
<>
<>

    <h2>Error Rate</h2>
    <p
</>
</>
</>
</>>Current: ${(metrics.api_errors.rate * 100).toFixed(2)}%</p>
<>
<>
<>
<>

    <p>Target: &lt;1%</p>
    <p
</>
</>
</>
</>>Status: ${metrics.api_errors.rate < 0.01 ? '✅ PASS' : '❌ FAIL'}</p>
  </div>
</body>
</html>
  `;
}
