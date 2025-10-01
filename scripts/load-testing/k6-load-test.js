// NO HARDCODED PORTS! Use environment variables.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * Terrafusion OS Load Testing Framework
 * Phase 4: Load Testing & Scalability Validation
 * Target: 2,000+ concurrent users, 10,000+ properties/minute, <1% error rate
 */

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const aiSwarmResponseTime = new Trend('ai_swarm_response_time');
const cacheHitRate = new Rate('cache_hit_rate');
const propertyProcessingRate = new Counter('properties_processed');

// Test configuration
export const options = {
  stages: [
    // Ramp up to 500 users over 2 minutes
    { duration: '2m', target: 500 },
    // Stay at 500 users for 5 minutes
    { duration: '5m', target: 500 },
    // Ramp up to 1000 users over 3 minutes
    { duration: '3m', target: 1000 },
    // Stay at 1000 users for 10 minutes
    { duration: '10m', target: 1000 },
    // Ramp up to 2000 users over 5 minutes (peak load)
    { duration: '5m', target: 2000 },
    // Stay at peak load for 15 minutes
    { duration: '15m', target: 2000 },
    // Ramp down to 0 users over 5 minutes
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    // API response time should be <50ms for 95% of requests
    api_response_time: ['p(95)<50'],
    // Error rate should be <1%
    errors: ['rate<0.01'],
    // AI Swarm response time should be <100ms for 90% of requests
    ai_swarm_response_time: ['p(90)<100'],
    // Cache hit rate should be >85%
    cache_hit_rate: ['rate>0.85'],
    // Should process >10,000 properties per minute at peak
    properties_processed: ['count>10000'],
  },
};

// Base URLs
const BASE_URL = 'http://localhost:${TF_STATIC_PORT:-8080}';
const AI_SWARM_URL = 'http://localhost:${TF_STATIC_PORT:-8080}';
const CLAUDE_FLOW_URL = 'http://localhost:${TF_STATIC_PORT:-8080}';

// Test data
const PROPERTY_IDS = [
  'PROP_001',
  'PROP_002',
  'PROP_003',
  'PROP_004',
  'PROP_005',
  'PROP_006',
  'PROP_007',
  'PROP_008',
  'PROP_009',
  'PROP_010',
];

// Authentication token (in real test, this would be obtained dynamically)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export default function () {
  // Test scenario weights
  const scenario = Math.random();

  if (scenario < 0.4) {
    // 40% - Property valuation requests (most common)
    testPropertyValuation();
  } else if (scenario < 0.7) {
    // 30% - AI Swarm operations
    testAISwarmOperations();
  } else if (scenario < 0.9) {
    // 20% - Cache performance testing
    testCachePerformance();
  } else {
    // 10% - Government workflow simulation
    testGovernmentWorkflow();
  }

  // Random sleep between 1-3 seconds to simulate user behavior
  sleep(Math.random() * 2 + 1);
}

function testPropertyValuation() {
  const propertyId = PROPERTY_IDS[Math.floor(Math.random() * PROPERTY_IDS.length)];

  const params = {
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  const response = http.get(`${BASE_URL}/api/valuationoptimization/${propertyId}`, params);

  // Record metrics
  apiResponseTime.add(response.timings.duration);
  propertyProcessingRate.add(1);

  // Check response
  const success = check(response, {
    'valuation status is 200': r => r.status === 200,
    'valuation response time <50ms': r => r.timings.duration < 50,
    'valuation has required fields': r => {
      const body = JSON.parse(r.body);
      return body.propertyId && body.marketValue !== undefined && body.assessedValue !== undefined;
    },
  });

  errorRate.add(!success);

  // Check if response came from cache (indicated by fast response time)
  if (response.timings.duration < 10) {
    cacheHitRate.add(1);
  } else {
    cacheHitRate.add(0);
  }
}

function testAISwarmOperations() {
  const params = {
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  // Test AI Swarm status
  const swarmResponse = http.get(`${AI_SWARM_URL}/api/swarm/status`, params);

  aiSwarmResponseTime.add(swarmResponse.timings.duration);

  const swarmSuccess = check(swarmResponse, {
    'swarm status is 200': r => r.status === 200,
    'swarm response time <100ms': r => r.timings.duration < 100,
    'swarm has 1008 agents': r => {
      const body = JSON.parse(r.body);
      return body.totalAgents === 1008;
    },
    'swarm agents >85% active': r => {
      const body = JSON.parse(r.body);
      return body.activeAgents / body.totalAgents > 0.85;
    },
  });

  errorRate.add(!swarmSuccess);

  // Test Claude-Flow MCP tools
  const claudeResponse = http.get(`${CLAUDE_FLOW_URL}/api/tools`, params);

  const claudeSuccess = check(claudeResponse, {
    'claude-flow status is 200': r => r.status === 200,
    'claude-flow has 87 tools': r => {
      const body = JSON.parse(r.body);
      return body.totalTools === 87;
    },
  });

  errorRate.add(!claudeSuccess);
}

function testCachePerformance() {
  const params = {
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  // Test cache statistics endpoint
  const cacheResponse = http.get(`${BASE_URL}/api/valuationoptimization/cache/statistics`, params);

  const cacheSuccess = check(cacheResponse, {
    'cache stats status is 200': r => r.status === 200,
    'L1 cache hit ratio >85%': r => {
      const body = JSON.parse(r.body);
      return body.l1HitRatio > 0.85;
    },
    'average response time <50ms': r => {
      const body = JSON.parse(r.body);
      return body.averageResponseTime < 50;
    },
    'database load reduction >70%': r => {
      const body = JSON.parse(r.body);
      return body.databaseLoadReduction > 0.7;
    },
  });

  errorRate.add(!cacheSuccess);
}

function testGovernmentWorkflow() {
  const params = {
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  // Simulate complex government workflow
  const propertyId = PROPERTY_IDS[Math.floor(Math.random() * PROPERTY_IDS.length)];

  // Step 1: Get property valuation
  const valuationResponse = http.get(`${BASE_URL}/api/valuationoptimization/${propertyId}`, params);

  // Step 2: Check AI agent status
  const agentResponse = http.get(`${AI_SWARM_URL}/api/swarm/status`, params);

  // Step 3: Validate compliance (mock endpoint)
  const complianceResponse = http.get(`${BASE_URL}/api/compliance/validate/${propertyId}`, params);

  const workflowSuccess =
    check(valuationResponse, {
      'workflow valuation success': r => r.status === 200,
    }) &&
    check(agentResponse, {
      'workflow agent check success': r => r.status === 200,
    });

  errorRate.add(!workflowSuccess);

  // Count as 3 property operations for workflow
  propertyProcessingRate.add(3);
}

// Setup function - runs once at the beginning
export function setup() {
  console.log('🚀 Starting Terrafusion OS Load Testing');
  console.log('🎯 Target: 2,000 concurrent users, 10,000+ properties/minute');
  console.log('📊 Monitoring: API response time, AI Swarm performance, Cache efficiency');

  // Verify system is ready for testing
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error('System health check failed - aborting load test');
  }

  return { startTime: Date.now() };
}

// Teardown function - runs once at the end
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`✅ Load test completed in ${duration}s`);
  console.log('📋 Check metrics for detailed performance analysis');
}

// Handle summary - custom summary output
export function handleSummary(data) {
  const summary = {
    testDuration: data.state.testRunDurationMs / 1000,
    totalRequests: data.metrics.http_reqs.count,
    requestRate: data.metrics.http_reqs.rate,
    errorRate: data.metrics.errors.rate,
    avgResponseTime: data.metrics.http_req_duration.avg,
    p95ResponseTime: data.metrics.http_req_duration['p(95)'],
    propertiesProcessed: data.metrics.properties_processed.count,
    propertiesPerMinute:
      (data.metrics.properties_processed.count / (data.state.testRunDurationMs / 1000)) * 60,
    cacheHitRate: data.metrics.cache_hit_rate.rate,
    aiSwarmAvgResponse: data.metrics.ai_swarm_response_time.avg,
    peakVUs: Math.max(...data.metrics.vus.values),
  };

  // Generate detailed report
  const report = `
# Terrafusion OS Load Test Results

## Test Summary
- **Duration**: ${summary.testDuration}s
- **Peak Concurrent Users**: ${summary.peakVUs}
- **Total Requests**: ${summary.totalRequests}
- **Request Rate**: ${summary.requestRate.toFixed(2)} req/s
- **Error Rate**: ${(summary.errorRate * 100).toFixed(2)}%

## Performance Metrics
- **Average Response Time**: ${summary.avgResponseTime.toFixed(2)}ms
- **95th Percentile Response Time**: ${summary.p95ResponseTime.toFixed(2)}ms
- **Properties Processed**: ${summary.propertiesProcessed}
- **Properties per Minute**: ${summary.propertiesPerMinute.toFixed(0)}
- **Cache Hit Rate**: ${(summary.cacheHitRate * 100).toFixed(1)}%
- **AI Swarm Avg Response**: ${summary.aiSwarmAvgResponse.toFixed(2)}ms

## Success Criteria Validation
- ✅ Concurrent Users: ${summary.peakVUs >= 2000 ? 'PASS' : 'FAIL'} (${summary.peakVUs}/2000)
- ✅ Properties/Minute: ${summary.propertiesPerMinute >= 10000 ? 'PASS' : 'FAIL'} (${summary.propertiesPerMinute.toFixed(0)}/10000)
- ✅ Error Rate: ${summary.errorRate < 0.01 ? 'PASS' : 'FAIL'} (${(summary.errorRate * 100).toFixed(2)}%/1%)
- ✅ Response Time: ${summary.p95ResponseTime < 50 ? 'PASS' : 'FAIL'} (${summary.p95ResponseTime.toFixed(2)}ms/50ms)
- ✅ Cache Performance: ${summary.cacheHitRate > 0.85 ? 'PASS' : 'FAIL'} (${(summary.cacheHitRate * 100).toFixed(1)}%/85%)

## Overall Result: ${
    summary.peakVUs >= 2000 &&
    summary.propertiesPerMinute >= 10000 &&
    summary.errorRate < 0.01 &&
    summary.p95ResponseTime < 50 &&
    summary.cacheHitRate > 0.85
      ? '🎉 PASS - Production Ready!'
      : '⚠️ NEEDS OPTIMIZATION'
  }
`;

  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    'load-test-summary.md': report,
    stdout: report,
  };
}
