// TerraFusion OS — k6 Load Test: Read Path (Brown-Out Simulation)
// Phase 4.9 Week 1 Day 7
// Usage: API_BASE=https://api.terrafusion.local k6 run brownout-read-api.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('custom_error_rate');
const requestDuration = new Trend('custom_request_duration');
const cacheHitRate = new Rate('custom_cache_hit_rate');
const retryCounter = new Counter('custom_retries');

export const options = {
  vus: 100,
  duration: '15m',
  thresholds: {
    'http_req_duration': ['p(95)<500'], // Key SLO: P95 <500ms under F1 (+150ms fault)
    'http_req_failed': ['rate<0.01'],   // Key SLO: Error rate <1%
    'custom_error_rate': ['rate<0.01'],
    'custom_request_duration': ['p(95)<500'],
  },
  tags: {
    test: 'brownout-read-api',
    phase: 'chaos',
  },
};

export default function () {
  const apiBase = __ENV.API_BASE || 'https://api.terrafusion.local';
  
  // Test 1: Property listing (read path with cache)
  const listRes = http.get(`${apiBase}/v1/properties?limit=25&tenant_id=1`, {
    headers: {
      'Authorization': 'Bearer test-token',
      'X-Tenant-ID': '1',
    },
    tags: { endpoint: 'properties-list' },
  });
  
  check(listRes, {
    'status 200': (r) => r.status === 200,
    'response time <500ms': (r) => r.timings.duration < 500,
    'has properties array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.properties);
      } catch {
        return false;
      }
    },
  });
  
  errorRate.add(listRes.status >= 400);
  requestDuration.add(listRes.timings.duration);
  
  // Check for cache hit (X-Cache-Status header)
  if (listRes.headers['X-Cache-Status']) {
    cacheHitRate.add(listRes.headers['X-Cache-Status'] === 'HIT');
  }
  
  // Check for retries (X-Retry-Count header from circuit breaker)
  if (listRes.headers['X-Retry-Count']) {
    const retryCount = parseInt(listRes.headers['X-Retry-Count'], 10);
    if (retryCount > 0) {
      retryCounter.add(retryCount);
    }
  }
  
  sleep(0.1); // 100ms think time
  
  // Test 2: Single property fetch (cache hit path)
  if (listRes.status === 200) {
    try {
      const body = JSON.parse(listRes.body);
      if (body.properties && body.properties.length > 0) {
        const propertyId = body.properties[0].id;
        
        const detailRes = http.get(`${apiBase}/v1/properties/${propertyId}`, {
          headers: {
            'Authorization': 'Bearer test-token',
            'X-Tenant-ID': '1',
          },
          tags: { endpoint: 'property-detail' },
        });
        
        check(detailRes, {
          'detail status 200': (r) => r.status === 200,
          'detail response time <300ms': (r) => r.timings.duration < 300,
        });
        
        errorRate.add(detailRes.status >= 400);
        requestDuration.add(detailRes.timings.duration);
        
        if (detailRes.headers['X-Cache-Status']) {
          cacheHitRate.add(detailRes.headers['X-Cache-Status'] === 'HIT');
        }
      }
    } catch (e) {
      console.error(`Parse error: ${e}`);
    }
  }
  
  sleep(0.1); // 100ms think time
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: '  ', enableColors: true }),
    'ops/tests/chaos/results/k6-brownout-read-summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  const summary = [];
  summary.push(`${indent}=== k6 Brown-Out Read Path Test Summary ===\n`);
  
  if (data.metrics.http_req_duration) {
    const p95 = data.metrics.http_req_duration.values['p(95)'];
    const passed = p95 < 500;
    summary.push(`${indent}P95 Latency: ${p95.toFixed(2)}ms ${passed ? '✅ PASS' : '❌ FAIL'} (target: <500ms)`);
  }
  
  if (data.metrics.http_req_failed) {
    const errorRate = data.metrics.http_req_failed.values.rate;
    const passed = errorRate < 0.01;
    summary.push(`${indent}Error Rate: ${(errorRate * 100).toFixed(2)}% ${passed ? '✅ PASS' : '❌ FAIL'} (target: <1%)`);
  }
  
  if (data.metrics.custom_cache_hit_rate) {
    const hitRate = data.metrics.custom_cache_hit_rate.values.rate;
    summary.push(`${indent}Cache Hit Rate: ${(hitRate * 100).toFixed(2)}%`);
  }
  
  if (data.metrics.custom_retries) {
    const retries = data.metrics.custom_retries.values.count;
    summary.push(`${indent}Total Retries: ${retries}`);
  }
  
  return summary.join('\n');
}
