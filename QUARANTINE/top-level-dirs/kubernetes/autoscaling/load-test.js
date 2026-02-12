// TerraFusion OS - Load Testing Script (k6)
// Tests auto-scaling behavior under various load patterns
////////////////////////////////////////////////////////////////////////////////

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCounter = new Counter('requests');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://backend-api.terrafusion-prod.svc.cluster.local:8080';
const AI_URL = __ENV.AI_URL || 'http://ai-agent.terrafusion-prod.svc.cluster.local:3001';
const MCP_URL = __ENV.MCP_URL || 'http://mcp-servers.terrafusion-prod.svc.cluster.local:8080';

// Load testing scenarios
export const options = {
  scenarios: {
    // Scenario 1: Gradual ramp-up (test HPA scale-up)
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users over 2 minutes
        { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
        { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
        { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
        { duration: '2m', target: 0 },    // Ramp down to 0 users over 2 minutes
      ],
      gracefulRampDown: '30s',
      tags: { scenario: 'ramp_up' },
    },

    // Scenario 2: Spike test (test rapid scaling)
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 0 },    // Calm before the storm
        { duration: '30s', target: 200 },  // Spike to 200 users
        { duration: '2m', target: 200 },   // Hold spike
        { duration: '30s', target: 0 },    // Drop to 0
      ],
      gracefulRampDown: '30s',
      startTime: '18m',  // Start after ramp_up scenario
      tags: { scenario: 'spike' },
    },

    // Scenario 3: Stress test (find breaking point)
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },  // Ramp to normal load
        { duration: '5m', target: 100 },  // Stay at normal load
        { duration: '2m', target: 200 },  // Increase to 200
        { duration: '5m', target: 200 },  // Hold at 200
        { duration: '2m', target: 300 },  // Push to 300
        { duration: '5m', target: 300 },  // Hold at 300
        { duration: '2m', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '30s',
      startTime: '23m',  // Start after spike scenario
      tags: { scenario: 'stress' },
    },
  },

  thresholds: {
    // Success criteria
    'http_req_duration': ['p(95)<500'],      // 95% of requests under 500ms
    'http_req_failed': ['rate<0.01'],        // Error rate < 1%
    'errors': ['rate<0.01'],                 // Custom error rate < 1%
  },
};

// Request templates
const endpoints = {
  backend: [
    { method: 'GET', url: `${BASE_URL}/api/health`, name: 'health_check' },
    { method: 'GET', url: `${BASE_URL}/api/properties`, name: 'list_properties' },
    { method: 'GET', url: `${BASE_URL}/api/properties/123`, name: 'get_property' },
    { method: 'POST', url: `${BASE_URL}/api/properties`, name: 'create_property', body: JSON.stringify({
      address: '123 Main St',
      city: 'Portland',
      state: 'OR',
      zip: '97201',
      price: 500000,
    })},
  ],
  ai: [
    { method: 'GET', url: `${AI_URL}/health`, name: 'ai_health' },
    { method: 'POST', url: `${AI_URL}/api/inference`, name: 'ai_inference', body: JSON.stringify({
      model: 'gpt-4',
      prompt: 'Analyze this property',
      context: 'Real estate analysis',
    })},
  ],
  mcp: [
    { method: 'GET', url: `${MCP_URL}/health`, name: 'mcp_health' },
    { method: 'POST', url: `${MCP_URL}/mcp/list`, name: 'mcp_list' },
  ],
};

// Main test function
export default function () {
  // 70% Backend API requests
  if (Math.random() < 0.7) {
    const endpoint = endpoints.backend[Math.floor(Math.random() * endpoints.backend.length)];
    makeRequest(endpoint);
  }
  // 20% AI Agent requests
  else if (Math.random() < 0.9) {
    const endpoint = endpoints.ai[Math.floor(Math.random() * endpoints.ai.length)];
    makeRequest(endpoint);
  }
  // 10% MCP Server requests
  else {
    const endpoint = endpoints.mcp[Math.floor(Math.random() * endpoints.mcp.length)];
    makeRequest(endpoint);
  }

  // Think time (simulate user behavior)
  sleep(Math.random() * 2 + 1);  // Random sleep 1-3 seconds
}

// Helper function to make requests
function makeRequest(endpoint) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: {
      name: endpoint.name,
    },
  };

  const start = Date.now();
  let response;

  if (endpoint.method === 'GET') {
    response = http.get(endpoint.url, params);
  } else if (endpoint.method === 'POST') {
    response = http.post(endpoint.url, endpoint.body, params);
  }

  const duration = Date.now() - start;

  // Record metrics
  requestCounter.add(1);
  responseTime.add(duration);

  // Check response
  const success = check(response, {
    'status is 200-299': (r) => r.status >= 200 && r.status < 300,
    'response time < 1000ms': () => duration < 1000,
  });

  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
}

// Setup function (runs once at start)
export function setup() {
  console.log('🚀 Starting TerraFusion Load Test');
  console.log(`📊 Target URLs:`);
  console.log(`   Backend API: ${BASE_URL}`);
  console.log(`   AI Agent: ${AI_URL}`);
  console.log(`   MCP Servers: ${MCP_URL}`);
  console.log(``);
  console.log(`📈 Scenarios:`);
  console.log(`   1. Ramp-up (0-18m): Gradual load increase to test HPA scale-up`);
  console.log(`   2. Spike (18-23m): Sudden traffic spike to test rapid scaling`);
  console.log(`   3. Stress (23-46m): Progressive load increase to find limits`);
  console.log(``);
  console.log(`✅ Success Criteria:`);
  console.log(`   • P95 response time < 500ms`);
  console.log(`   • Error rate < 1%`);
  console.log(``);

  // Warm-up request
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    console.error(`❌ Backend API health check failed! Status: ${healthCheck.status}`);
  } else {
    console.log('✅ Backend API is healthy');
  }
}

// Teardown function (runs once at end)
export function teardown(data) {
  console.log('');
  console.log('🏁 Load Test Complete!');
  console.log('📊 Check Grafana dashboards for detailed metrics');
  console.log('🔍 Use these commands to verify scaling:');
  console.log('   kubectl get hpa -A --watch');
  console.log('   kubectl get pods -n terrafusion-prod');
  console.log('');
}

// Summary handler
export function handleSummary(data) {
  return {
    'load-test-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
  };
}

// Text summary helper
function textSummary(data, opts = {}) {
  const indent = opts.indent || '';
  const enableColors = opts.enableColors !== false;

  let output = '\n';
  output += indent + '╔════════════════════════════════════════════════════════════════╗\n';
  output += indent + '║          TerraFusion Load Test Summary                        ║\n';
  output += indent + '╚════════════════════════════════════════════════════════════════╝\n\n';

  // Metrics
  const metrics = data.metrics;
  output += indent + 'Key Metrics:\n';
  output += indent + '  • Total Requests:     ' + (metrics.http_reqs?.values.count || 0).toLocaleString() + '\n';
  output += indent + '  • Request Rate:       ' + (metrics.http_reqs?.values.rate || 0).toFixed(2) + ' req/s\n';
  output += indent + '  • Error Rate:         ' + ((metrics.http_req_failed?.values.rate || 0) * 100).toFixed(2) + '%\n';
  output += indent + '  • Avg Response Time:  ' + (metrics.http_req_duration?.values.avg || 0).toFixed(2) + 'ms\n';
  output += indent + '  • P95 Response Time:  ' + (metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2) + 'ms\n';
  output += indent + '  • P99 Response Time:  ' + (metrics.http_req_duration?.values['p(99)'] || 0).toFixed(2) + 'ms\n';
  output += indent + '  • Max Response Time:  ' + (metrics.http_req_duration?.values.max || 0).toFixed(2) + 'ms\n\n';

  // Thresholds
  output += indent + 'Threshold Results:\n';
  const thresholds = data.root_group.checks;
  for (const [name, result] of Object.entries(thresholds || {})) {
    const status = result.passes === result.fails + result.passes ? '✅ PASS' : '❌ FAIL';
    output += indent + `  ${status} ${name}\n`;
  }

  output += '\n';
  return output;
}
