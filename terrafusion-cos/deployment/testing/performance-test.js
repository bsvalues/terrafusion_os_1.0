import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');

// Test configuration
export let options = {
  stages: [
    // Ramp up to 100 users over 2 minutes
    { duration: '2m', target: 100 },
    // Stay at 100 users for 5 minutes
    { duration: '5m', target: 100 },
    // Ramp up to 500 users over 3 minutes
    { duration: '3m', target: 500 },
    // Stay at 500 users for 10 minutes
    { duration: '10m', target: 500 },
    // Ramp up to 1000 users over 2 minutes
    { duration: '2m', target: 1000 },
    // Stay at 1000 users for 5 minutes (peak load)
    { duration: '5m', target: 1000 },
    // Ramp down to 0 users over 2 minutes
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    // HTTP request duration should be less than 1000ms for 95% of requests
    http_req_duration: ['p(95)<1000'],
    // Error rate should be less than 5%
    errors: ['rate<0.05'],
    // 99% of requests should complete within 2 seconds
    http_req_duration: ['p(99)<2000'],
  },
};

// Base URL - update based on environment
const BASE_URL = __ENV.BASE_URL || 'https://api.terrafusion.local';

// Test data
const TEST_USERS = [
  { username: 'test_admin', password: 'secure_test_pass' },
  { username: 'test_user1', password: 'secure_test_pass' },
  { username: 'test_user2', password: 'secure_test_pass' },
];

export function setup() {
  // Warm up the system
  console.log('Setting up performance test environment...');
  
  let warmupResponse = http.get(`${BASE_URL}/health`);
  check(warmupResponse, {
    'warmup health check successful': (r) => r.status === 200,
  });
  
  return { baseUrl: BASE_URL };
}

export default function(data) {
  // Test scenarios with weighted distribution
  let scenario = Math.random();
  
  if (scenario < 0.4) {
    // 40% - Basic API health and status checks
    testHealthEndpoints(data.baseUrl);
  } else if (scenario < 0.7) {
    // 30% - Authentication and user management
    testAuthenticationFlow(data.baseUrl);
  } else if (scenario < 0.85) {
    // 15% - Vendor registration and module operations
    testVendorOperations(data.baseUrl);
  } else if (scenario < 0.95) {
    // 10% - AI Swarm coordination
    testAISwarmOperations(data.baseUrl);
  } else {
    // 5% - Heavy data operations
    testDataOperations(data.baseUrl);
  }
  
  // Random sleep between 1-3 seconds to simulate user think time
  sleep(Math.random() * 2 + 1);
}

function testHealthEndpoints(baseUrl) {
  // Health check
  let healthResponse = http.get(`${baseUrl}/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });
  errorRate.add(healthResponse.status !== 200);
  
  // API status
  let statusResponse = http.get(`${baseUrl}/api/status`);
  check(statusResponse, {
    'status check is 200': (r) => r.status === 200,
    'status response contains version': (r) => r.json('version') !== undefined,
  });
  errorRate.add(statusResponse.status !== 200);
  
  // System metrics
  let metricsResponse = http.get(`${baseUrl}/metrics`);
  check(metricsResponse, {
    'metrics endpoint accessible': (r) => r.status === 200,
  });
  errorRate.add(metricsResponse.status !== 200);
}

function testAuthenticationFlow(baseUrl) {
  // Select random test user
  let user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  
  // Login
  let loginPayload = JSON.stringify({
    username: user.username,
    password: user.password,
  });
  
  let loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  let loginResponse = http.post(`${baseUrl}/api/auth/login`, loginPayload, loginParams);
  check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'login returns token': (r) => r.json('token') !== undefined,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(loginResponse.status !== 200);
  
  if (loginResponse.status === 200) {
    let token = loginResponse.json('token');
    let authHeaders = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    
    // Get user profile
    let profileResponse = http.get(`${baseUrl}/api/auth/profile`, authHeaders);
    check(profileResponse, {
      'profile retrieval successful': (r) => r.status === 200,
      'profile contains user data': (r) => r.json('username') !== undefined,
    });
    errorRate.add(profileResponse.status !== 200);
    
    // Logout
    let logoutResponse = http.post(`${baseUrl}/api/auth/logout`, '', authHeaders);
    check(logoutResponse, {
      'logout successful': (r) => r.status === 200,
    });
    errorRate.add(logoutResponse.status !== 200);
  }
}

function testVendorOperations(baseUrl) {
  // Get vendor list
  let vendorsResponse = http.get(`${baseUrl}/api/vendors`);
  check(vendorsResponse, {
    'vendors list retrieved': (r) => r.status === 200,
    'vendors response time < 300ms': (r) => r.timings.duration < 300,
  });
  errorRate.add(vendorsResponse.status !== 200);
  
  // Get vendor modules
  let modulesResponse = http.get(`${baseUrl}/api/vendors/modules`);
  check(modulesResponse, {
    'modules list retrieved': (r) => r.status === 200,
  });
  errorRate.add(modulesResponse.status !== 200);
  
  // Register a test vendor (simulation)
  let vendorPayload = JSON.stringify({
    name: `TestVendor_${Math.floor(Math.random() * 10000)}`,
    type: 'simulation',
    compliance_level: 'FedRAMP_Moderate',
  });
  
  let vendorParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  let registerResponse = http.post(`${baseUrl}/api/vendors/register`, vendorPayload, vendorParams);
  check(registerResponse, {
    'vendor registration processed': (r) => r.status === 200 || r.status === 201,
  });
  errorRate.add(!(registerResponse.status === 200 || registerResponse.status === 201));
}

function testAISwarmOperations(baseUrl) {
  // Get AI swarm status
  let swarmResponse = http.get(`${baseUrl}/api/ai-swarm/status`);
  check(swarmResponse, {
    'AI swarm status retrieved': (r) => r.status === 200,
    'swarm response time < 400ms': (r) => r.timings.duration < 400,
  });
  errorRate.add(swarmResponse.status !== 200);
  
  // Request agent coordination
  let coordinationPayload = JSON.stringify({
    task_type: 'performance_test',
    priority: 'low',
    agents_required: 5,
  });
  
  let coordinationParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  let coordinationResponse = http.post(`${baseUrl}/api/ai-swarm/coordinate`, coordinationPayload, coordinationParams);
  check(coordinationResponse, {
    'AI coordination request processed': (r) => r.status === 200 || r.status === 202,
  });
  errorRate.add(!(coordinationResponse.status === 200 || coordinationResponse.status === 202));
}

function testDataOperations(baseUrl) {
  // Bulk data operation simulation
  let bulkPayload = JSON.stringify({
    operation: 'bulk_sync',
    records: Array.from({length: 100}, (_, i) => ({
      id: i,
      data: `test_data_${i}`,
      timestamp: new Date().toISOString(),
    })),
  });
  
  let bulkParams = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '10s', // Longer timeout for bulk operations
  };
  
  let bulkResponse = http.post(`${baseUrl}/api/data/bulk`, bulkPayload, bulkParams);
  check(bulkResponse, {
    'bulk operation processed': (r) => r.status === 200 || r.status === 202,
    'bulk operation time < 5s': (r) => r.timings.duration < 5000,
  });
  errorRate.add(!(bulkResponse.status === 200 || bulkResponse.status === 202));
  
  // Data query simulation
  let queryResponse = http.get(`${baseUrl}/api/data/query?limit=50&offset=0`);
  check(queryResponse, {
    'data query successful': (r) => r.status === 200,
  });
  errorRate.add(queryResponse.status !== 200);
}

export function teardown(data) {
  console.log('Performance test completed successfully');
  
  // Final health check
  let finalHealthResponse = http.get(`${data.baseUrl}/health`);
  check(finalHealthResponse, {
    'final health check successful': (r) => r.status === 200,
  });
}