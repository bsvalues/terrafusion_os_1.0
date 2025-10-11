/**
 * K6 Load Testing Script for TerraFusion OS 1.0
 * 
 * MIT/PhD-Level Load Testing with Grafana K6
 * 
 * This script performs comprehensive load testing using K6,
 * the industry-standard open-source load testing tool.
 * 
 * Test Scenarios:
 * 1. Smoke Test - Verify system works under minimal load
 * 2. Load Test - Test normal expected load
 * 3. Stress Test - Test beyond normal load to find limits
 * 4. Spike Test - Test sudden traffic spikes
 * 5. Soak Test - Test system stability over extended period
 * 
 * @author TerraFusion Systems Engineering Team
 * @license MIT
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// ============================================================================
// CUSTOM METRICS
// ============================================================================

const errorRate = new Rate('errors');
const propertySearchDuration = new Trend('property_search_duration');
const aiValuationDuration = new Trend('ai_valuation_duration');
const blockchainVerificationDuration = new Trend('blockchain_verification_duration');
const paymentProcessingDuration = new Trend('payment_processing_duration');
const apiCalls = new Counter('api_calls_total');

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

export const options = {
  // Test scenarios
  scenarios: {
    // SCENARIO 1: Smoke Test (2 VUs for 1 minute)
    smoke: {
      executor: 'constant-vus',
      vus: 2,
      duration: '1m',
      tags: { test_type: 'smoke' },
      exec: 'smokeTest',
    },

    // SCENARIO 2: Load Test (Ramp up to 100 VUs)
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },   // Ramp up to 10 users
        { duration: '5m', target: 50 },   // Ramp up to 50 users
        { duration: '5m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 0 },    // Ramp down
      ],
      tags: { test_type: 'load' },
      exec: 'loadTest',
      startTime: '2m', // Start after smoke test
    },

    // SCENARIO 3: Stress Test (Push beyond normal capacity)
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },  // Ramp to normal load
        { duration: '5m', target: 200 },  // Beyond normal
        { duration: '5m', target: 300 },  // Even higher
        { duration: '5m', target: 400 },  // Push to limits
        { duration: '5m', target: 500 },  // Find breaking point
        { duration: '10m', target: 0 },   // Recovery
      ],
      tags: { test_type: 'stress' },
      exec: 'stressTest',
      startTime: '21m', // Start after load test
    },

    // SCENARIO 4: Spike Test (Sudden traffic spike)
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },   // Normal load
        { duration: '1m', target: 500 },   // Sudden spike!
        { duration: '3m', target: 500 },   // Sustain spike
        { duration: '10s', target: 10 },   // Quick recovery
        { duration: '3m', target: 10 },    // Recovery period
      ],
      tags: { test_type: 'spike' },
      exec: 'spikeTest',
      startTime: '74m', // Start after stress test
    },

    // SCENARIO 5: Soak Test (Extended duration at normal load)
    soak: {
      executor: 'constant-vus',
      vus: 50,
      duration: '1h', // Run for 1 hour
      tags: { test_type: 'soak' },
      exec: 'soakTest',
      startTime: '82m', // Start after spike test
    },
  },

  // Thresholds - Define success criteria
  thresholds: {
    // 95% of requests must complete within 500ms
    'http_req_duration': ['p(95)<500'],
    
    // 99% of requests must complete within 1000ms
    'http_req_duration{test_type:load}': ['p(99)<1000'],
    
    // Error rate must be less than 1%
    'errors': ['rate<0.01'],
    
    // 95% of property searches must complete within 300ms
    'property_search_duration': ['p(95)<300'],
    
    // 95% of AI valuations must complete within 500ms (quantum-optimized)
    'ai_valuation_duration': ['p(95)<500'],
    
    // 95% of blockchain verifications must complete within 2000ms
    'blockchain_verification_duration': ['p(95)<2000'],
    
    // 95% of payment processing must complete within 1000ms
    'payment_processing_duration': ['p(95)<1000'],
    
    // At least 100 requests per second throughput
    'http_reqs': ['rate>100'],
  },

  // External metrics export
  ext: {
    loadimpact: {
      projectID: 3579145,
      name: 'TerraFusion OS 1.0 - Performance Test',
    },
  },
};

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_VERSION = 'v1';

// Test user credentials
const TEST_USER = {
  email: 'loadtest@terrafusion.test',
  password: 'LoadTest123!@#',
};

// ============================================================================
// SETUP PHASE (Runs once before all scenarios)
// ============================================================================

export function setup() {
  console.log('🚀 Starting TerraFusion OS 1.0 Load Tests');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Total Duration: ~2.5 hours`);
  console.log('');

  // Register test user and get authentication token
  const registerResponse = http.post(
    `${BASE_URL}/api/${API_VERSION}/auth/register`,
    JSON.stringify(TEST_USER),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (registerResponse.status !== 201 && registerResponse.status !== 409) {
    console.error('Failed to register test user');
    return null;
  }

  // Login and get token
  const loginResponse = http.post(
    `${BASE_URL}/api/${API_VERSION}/auth/login`,
    JSON.stringify(TEST_USER),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const token = JSON.parse(loginResponse.body).token;

  console.log('✅ Test user authenticated');
  console.log('');

  return {
    token,
    baseUrl: BASE_URL,
  };
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

/**
 * Smoke Test - Verify basic functionality
 */
export function smokeTest(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Test 1: Health check
  const healthResponse = http.get(`${data.baseUrl}/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(1);

  // Test 2: Get properties
  const propertiesResponse = http.get(
    `${data.baseUrl}/api/${API_VERSION}/properties`,
    { headers }
  );
  check(propertiesResponse, {
    'get properties status is 200': (r) => r.status === 200,
    'get properties response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(propertiesResponse.status !== 200);
  apiCalls.add(1);

  sleep(1);
}

/**
 * Load Test - Simulate normal user behavior
 */
export function loadTest(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Scenario: User searches for properties
  const searchResponse = http.get(
    `${data.baseUrl}/api/${API_VERSION}/properties/search?location=Portland&minPrice=400000&maxPrice=600000`,
    { headers }
  );

  check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search has results': (r) => JSON.parse(r.body).properties.length > 0,
  });

  propertySearchDuration.add(searchResponse.timings.duration);
  errorRate.add(searchResponse.status !== 200);
  apiCalls.add(1);

  sleep(2);

  // Scenario: User views property details with AI valuation
  if (searchResponse.status === 200) {
    const properties = JSON.parse(searchResponse.body).properties;
    const propertyId = properties[0].id;

    const detailsResponse = http.get(
      `${data.baseUrl}/api/${API_VERSION}/properties/${propertyId}`,
      { headers }
    );

    check(detailsResponse, {
      'property details status is 200': (r) => r.status === 200,
      'property has AI valuation': (r) => JSON.parse(r.body).aiValuation !== undefined,
    });

    aiValuationDuration.add(detailsResponse.timings.duration);
    errorRate.add(detailsResponse.status !== 200);
    apiCalls.add(1);
  }

  sleep(3);

  // Scenario: User gets personalized recommendations
  const recommendationsResponse = http.get(
    `${data.baseUrl}/api/${API_VERSION}/properties/recommendations?budget=600000&bedrooms=3`,
    { headers }
  );

  check(recommendationsResponse, {
    'recommendations status is 200': (r) => r.status === 200,
  });

  errorRate.add(recommendationsResponse.status !== 200);
  apiCalls.add(1);

  sleep(2);
}

/**
 * Stress Test - Push system beyond normal capacity
 */
export function stressTest(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Mix of different API calls
  const endpoints = [
    `/api/${API_VERSION}/properties`,
    `/api/${API_VERSION}/properties/search?location=Portland`,
    `/api/${API_VERSION}/properties/recommendations?budget=500000`,
    `/api/${API_VERSION}/analytics/market-trends`,
    `/api/${API_VERSION}/users/profile`,
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = http.get(`${data.baseUrl}${endpoint}`, { headers });

  check(response, {
    'status is 200': (r) => r.status === 200,
  });

  errorRate.add(response.status !== 200);
  apiCalls.add(1);

  sleep(0.5); // Minimal sleep to maximize load
}

/**
 * Spike Test - Test sudden traffic spike
 */
export function spikeTest(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Heavy operations during spike
  const aiResponse = http.post(
    `${data.baseUrl}/api/${API_VERSION}/ai/analyze-market`,
    JSON.stringify({
      region: 'Portland Metro',
      timeframe: '12-months',
    }),
    { headers }
  );

  check(aiResponse, {
    'AI analysis status is 200': (r) => r.status === 200,
  });

  aiValuationDuration.add(aiResponse.timings.duration);
  errorRate.add(aiResponse.status !== 200);
  apiCalls.add(1);

  sleep(1);
}

/**
 * Soak Test - Test system stability over time
 */
export function soakTest(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Realistic user workflow
  const workflows = [
    // Workflow 1: Browse properties
    () => {
      http.get(`${data.baseUrl}/api/${API_VERSION}/properties`, { headers });
      sleep(5);
    },
    // Workflow 2: Search and view
    () => {
      const searchResp = http.get(
        `${data.baseUrl}/api/${API_VERSION}/properties/search?location=Seattle`,
        { headers }
      );
      sleep(3);
      if (searchResp.status === 200) {
        const props = JSON.parse(searchResp.body).properties;
        if (props.length > 0) {
          http.get(
            `${data.baseUrl}/api/${API_VERSION}/properties/${props[0].id}`,
            { headers }
          );
        }
      }
      sleep(5);
    },
    // Workflow 3: Get recommendations
    () => {
      http.get(
        `${data.baseUrl}/api/${API_VERSION}/properties/recommendations?budget=500000`,
        { headers }
      );
      sleep(4);
    },
  ];

  const workflow = workflows[Math.floor(Math.random() * workflows.length)];
  workflow();

  apiCalls.add(1);
}

// ============================================================================
// TEARDOWN PHASE (Runs once after all scenarios)
// ============================================================================

export function teardown(data) {
  console.log('');
  console.log('✅ TerraFusion OS 1.0 Load Tests Complete');
  console.log('');
}

// ============================================================================
// CUSTOM SUMMARY (Generate HTML report)
// ============================================================================

export function handleSummary(data) {
  return {
    'performance-report.html': htmlReport(data),
    'performance-summary.json': JSON.stringify(data),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}
