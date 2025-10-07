// TerraFusion OS — k6 Load Test: Spike Test (Circuit Breaker Validation)
// Phase 4.9 Week 1 Day 7
// Usage: API_BASE=https://api.terrafusion.local k6 run spike-retry-grid.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// Custom metrics
const circuitBreakerOpen = new Counter('custom_circuit_breaker_open');
const circuitBreakerHalfOpen = new Counter('custom_circuit_breaker_half_open');
const retryCounter = new Counter('custom_retries');
const errorRate = new Rate('custom_error_rate');

export const options = {
  stages: [
    { duration: '90s', target: 500 },  // Ramp up to 500 VUs (spike)
    { duration: '10m', target: 500 },  // Hold at 500 VUs
    { duration: '90s', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // Relaxed threshold during spike
    'http_req_failed': ['rate<0.30'],    // Expect some failures during packet loss
    'custom_error_rate': ['rate<0.30'],
    'custom_retries': ['count<10000'],   // Retries should cap (max 2 per request)
  },
  tags: {
    test: 'spike-retry-grid',
    phase: 'chaos',
  },
};

export default function () {
  const apiBase = __ENV.API_BASE || 'https://api.terrafusion.local';
  
  // Property listing endpoint (most critical read path)
  const res = http.get(`${apiBase}/v1/properties?limit=25&tenant_id=1`, {
    headers: {
      'Authorization': 'Bearer test-token',
      'X-Tenant-ID': '1',
    },
    timeout: '5s', // 5s timeout to test circuit breaker
    tags: { endpoint: 'properties-list' },
  });
  
  check(res, {
    'status 200 or 503': (r) => r.status === 200 || r.status === 503,
    'response time <2s': (r) => r.timings.duration < 2000,
  });
  
  // Track errors
  errorRate.add(res.status >= 400);
  
  // Check for circuit breaker state (X-Circuit-Breaker-State header)
  if (res.headers['X-Circuit-Breaker-State']) {
    const state = res.headers['X-Circuit-Breaker-State'];
    if (state === 'OPEN') {
      circuitBreakerOpen.add(1);
      console.log('⚠️ Circuit breaker OPEN - fast-fail activated');
    } else if (state === 'HALF_OPEN') {
      circuitBreakerHalfOpen.add(1);
      console.log('🔄 Circuit breaker HALF_OPEN - testing recovery');
    }
  }
  
  // Check for retries (X-Retry-Count header)
  if (res.headers['X-Retry-Count']) {
    const retryCount = parseInt(res.headers['X-Retry-Count'], 10);
    if (retryCount > 0) {
      retryCounter.add(retryCount);
      
      // Alert if retry count exceeds threshold (should be ≤2)
      if (retryCount > 2) {
        console.log(`⚠️ Excessive retries: ${retryCount} (expected ≤2)`);
      }
    }
  }
  
  // Check for graceful degradation (X-Fallback-Active header)
  if (res.headers['X-Fallback-Active'] === 'true') {
    console.log('🔄 Fallback path activated (graceful degradation)');
  }
  
  sleep(0.05); // 50ms think time (higher load than brownout test)
}

export function handleSummary(data) {
  const summary = generateTextSummary(data);
  
  return {
    'stdout': summary,
    'ops/tests/chaos/results/k6-spike-retry-summary.json': JSON.stringify(data),
  };
}

function generateTextSummary(data) {
  const lines = [];
  lines.push('\n=== k6 Spike Test (Circuit Breaker Validation) Summary ===\n');
  
  // P95 latency
  if (data.metrics.http_req_duration) {
    const p95 = data.metrics.http_req_duration.values['p(95)'];
    const p99 = data.metrics.http_req_duration.values['p(99)'];
    const passed = p95 < 2000;
    lines.push(`P95 Latency: ${p95.toFixed(2)}ms ${passed ? '✅' : '❌'} (target: <2000ms)`);
    lines.push(`P99 Latency: ${p99.toFixed(2)}ms`);
  }
  
  // Error rate
  if (data.metrics.http_req_failed) {
    const errRate = data.metrics.http_req_failed.values.rate;
    const passed = errRate < 0.30;
    lines.push(`Error Rate: ${(errRate * 100).toFixed(2)}% ${passed ? '✅' : '❌'} (target: <30%)`);
  }
  
  // Circuit breaker metrics
  if (data.metrics.custom_circuit_breaker_open) {
    const openCount = data.metrics.custom_circuit_breaker_open.values.count;
    lines.push(`Circuit Breaker OPEN events: ${openCount}`);
  }
  
  if (data.metrics.custom_circuit_breaker_half_open) {
    const halfOpenCount = data.metrics.custom_circuit_breaker_half_open.values.count;
    lines.push(`Circuit Breaker HALF_OPEN events: ${halfOpenCount}`);
  }
  
  // Retry metrics
  if (data.metrics.custom_retries) {
    const totalRetries = data.metrics.custom_retries.values.count;
    const totalRequests = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
    const avgRetriesPerRequest = totalRequests > 0 ? totalRetries / totalRequests : 0;
    const passed = avgRetriesPerRequest <= 2;
    lines.push(`Total Retries: ${totalRetries}`);
    lines.push(`Avg Retries/Request: ${avgRetriesPerRequest.toFixed(2)} ${passed ? '✅' : '❌'} (target: ≤2)`);
  }
  
  // Recovery validation
  lines.push('\n=== Circuit Breaker Validation ===');
  lines.push('Expected behavior:');
  lines.push('  1. Circuit breaker OPEN: Fast-fail after 5 consecutive failures');
  lines.push('  2. Retry attempts: Cap at 2 retries per request');
  lines.push('  3. Recovery time: HALF_OPEN → CLOSED within 60s post-fault');
  lines.push('  4. No cascading failures: Error rate <30% during fault\n');
  
  return lines.join('\n');
}
