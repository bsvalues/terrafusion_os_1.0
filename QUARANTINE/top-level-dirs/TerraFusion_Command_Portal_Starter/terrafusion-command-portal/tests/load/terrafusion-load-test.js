/**
 * TerraFusion Load Testing Framework - K6 Configuration
 * 
 * Government-grade performance testing suite for federation system
 * Comprehensive load testing with multiple test scenarios
 * 
 * THE TERRAFUSION WAY: Enterprise-scale performance validation
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for federation-specific monitoring
export let errorRate = new Rate('errors');
export let responseTime = new Trend('response_time');
export let wsConnections = new Counter('ws_connections');
export let apiRequests = new Counter('api_requests');

// Test configuration for different load scenarios
export let options = {
  stages: [
    // Ramp-up phase
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 500 },   // Ramp up to 500 users
    { duration: '10m', target: 1000 }, // Peak load: 1000 users
    { duration: '5m', target: 500 },   // Ramp down to 500 users
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
  
  // Thresholds for government-grade performance requirements
  thresholds: {
    // API response time requirements
    'http_req_duration': [
      'p(50)<100',    // 50% of requests under 100ms
      'p(95)<500',    // 95% of requests under 500ms
      'p(99)<1000',   // 99% of requests under 1000ms
    ],
    
    // Error rate requirements
    'http_req_failed': ['rate<0.01'], // Error rate under 1%
    
    // WebSocket connection requirements
    'ws_session_duration': ['p(95)<30000'], // 95% of WS sessions under 30s
    
    // Custom federation metrics
    'errors': ['rate<0.05'],          // Custom error rate under 5%
    'response_time': ['p(99)<2000'],  // 99% response time under 2s
  },
  
  // Test scenarios for different user behaviors
  scenarios: {
    // Standard API load testing
    api_load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '2m', target: 200 },
        { duration: '30s', target: 0 },
      ],
      exec: 'apiLoadTest',
    },
    
    // WebSocket real-time monitoring load
    websocket_load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 25 },
        { duration: '2m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      exec: 'websocketLoadTest',
    },
    
    // Stress testing for peak government usage
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '2m', target: 300 },
        { duration: '5m', target: 500 },
        { duration: '1m', target: 0 },
      ],
      exec: 'stressTest',
    },
    
    // Spike testing for emergency scenarios
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 1000 }, // Immediate spike
        { duration: '1m', target: 1000 },  // Sustained load
        { duration: '10s', target: 0 },    // Immediate drop
      ],
      exec: 'spikeTest',
    },
  },
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8787';
const FRONTEND_URL = __ENV.FRONTEND_URL || 'http://localhost:5177';
const WS_URL = __ENV.WS_URL || 'ws://localhost:8787/ws/federation';

// Test data for realistic government scenarios
const testCounties = [
  { fips: '06037', name: 'Los Angeles County', state: 'CA' },
  { fips: '36061', name: 'New York County', state: 'NY' },
  { fips: '17031', name: 'Cook County', state: 'IL' },
];

/**
 * API Load Testing Scenario
 * Tests all federation API endpoints under normal load
 */
export function apiLoadTest() {
  let responses = {};
  
  // Test federation dashboard endpoint
  responses.dashboard = http.get(`${BASE_URL}/api/federation/dashboard`);
  check(responses.dashboard, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response time < 500ms': (r) => r.timings.duration < 500,
    'dashboard has valid JSON': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.hasOwnProperty('system_health');
      } catch (e) {
        return false;
      }
    },
  });
  
  apiRequests.add(1);
  errorRate.add(responses.dashboard.status !== 200);
  responseTime.add(responses.dashboard.timings.duration);
  
  // Test counties endpoint
  responses.counties = http.get(`${BASE_URL}/api/federation/counties`);
  check(responses.counties, {
    'counties status is 200': (r) => r.status === 200,
    'counties response time < 300ms': (r) => r.timings.duration < 300,
    'counties returns array': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data);
      } catch (e) {
        return false;
      }
    },
  });
  
  apiRequests.add(1);
  errorRate.add(responses.counties.status !== 200);
  responseTime.add(responses.counties.timings.duration);
  
  // Test connections endpoint
  responses.connections = http.get(`${BASE_URL}/api/federation/connections`);
  check(responses.connections, {
    'connections status is 200': (r) => r.status === 200,
    'connections response time < 300ms': (r) => r.timings.duration < 300,
    'connections returns array': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data);
      } catch (e) {
        return false;
      }
    },
  });
  
  apiRequests.add(1);
  errorRate.add(responses.connections.status !== 200);
  responseTime.add(responses.connections.timings.duration);
  
  // Test health endpoint
  responses.health = http.get(`${BASE_URL}/health`);
  check(responses.health, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  apiRequests.add(1);
  errorRate.add(responses.health.status !== 200);
  responseTime.add(responses.health.timings.duration);
  
  // Realistic user behavior: pause between requests
  sleep(Math.random() * 3 + 1); // 1-4 second pause
}

/**
 * WebSocket Load Testing Scenario
 * Tests real-time WebSocket connections under load
 */
export function websocketLoadTest() {
  const url = WS_URL;
  const params = { tags: { my_tag: 'websocket_test' } };
  
  const res = ws.connect(url, params, function (socket) {
    wsConnections.add(1);
    
    socket.on('open', function open() {
      console.log('WebSocket connection established');
      
      // Send ping message
      socket.send(JSON.stringify({
        message_type: 'ping',
        timestamp: Date.now(),
        data: null
      }));
    });
    
    socket.on('message', function (message) {
      try {
        const data = JSON.parse(message);
        
        check(data, {
          'message has type': (msg) => msg.hasOwnProperty('message_type'),
          'message has timestamp': (msg) => msg.hasOwnProperty('timestamp'),
          'message timestamp is recent': (msg) => {
            const now = Date.now();
            const msgTime = msg.timestamp;
            return Math.abs(now - msgTime) < 60000; // Within 1 minute
          },
        });
        
        // Respond to ping with pong
        if (data.message_type === 'ping') {
          socket.send(JSON.stringify({
            message_type: 'pong',
            timestamp: Date.now(),
            data: null
          }));
        }
        
      } catch (e) {
        console.log('Error parsing WebSocket message:', e);
        errorRate.add(1);
      }
    });
    
    socket.on('close', function close() {
      console.log('WebSocket connection closed');
    });
    
    socket.on('error', function (e) {
      console.log('WebSocket error:', e);
      errorRate.add(1);
    });
    
    // Keep connection alive for realistic duration
    socket.setTimeout(function () {
      console.log('Closing WebSocket connection');
      socket.close();
    }, 10000 + Math.random() * 20000); // 10-30 seconds
  });
  
  check(res, {
    'websocket connection successful': (r) => r && r.status === 101,
  });
  
  if (!res || res.status !== 101) {
    errorRate.add(1);
  }
}

/**
 * Stress Testing Scenario
 * Tests system behavior under high sustained load
 */
export function stressTest() {
  // Rapid-fire API requests to simulate stress
  const endpoints = [
    `${BASE_URL}/api/federation/dashboard`,
    `${BASE_URL}/api/federation/counties`,
    `${BASE_URL}/api/federation/connections`,
    `${BASE_URL}/health`,
  ];
  
  for (let i = 0; i < 5; i++) {
    const endpoint = endpoints[i % endpoints.length];
    const response = http.get(endpoint);
    
    check(response, {
      'stress test status is 200': (r) => r.status === 200,
      'stress test response time acceptable': (r) => r.timings.duration < 2000,
    });
    
    apiRequests.add(1);
    errorRate.add(response.status !== 200);
    responseTime.add(response.timings.duration);
    
    // Minimal pause to create sustained pressure
    sleep(0.1);
  }
  
  // Brief pause between stress bursts
  sleep(0.5);
}

/**
 * Spike Testing Scenario
 * Tests system behavior under sudden load spikes
 */
export function spikeTest() {
  // Simulate emergency scenario with rapid concurrent requests
  const requests = [];
  
  // Prepare batch of concurrent requests
  for (let i = 0; i < 10; i++) {
    requests.push(['GET', `${BASE_URL}/api/federation/dashboard`]);
    requests.push(['GET', `${BASE_URL}/api/federation/counties`]);
    requests.push(['GET', `${BASE_URL}/health`]);
  }
  
  // Execute all requests concurrently
  const responses = http.batch(requests);
  
  // Validate all responses
  responses.forEach((response, index) => {
    check(response, {
      'spike test status is 200': (r) => r.status === 200,
      'spike test no timeouts': (r) => r.timings.duration < 5000,
    });
    
    apiRequests.add(1);
    errorRate.add(response.status !== 200);
    responseTime.add(response.timings.duration);
  });
  
  // No pause during spike test to maintain pressure
}

/**
 * Setup function - runs once per VU
 */
export function setup() {
  console.log('Starting TerraFusion Load Testing Framework');
  console.log(`Backend URL: ${BASE_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`WebSocket URL: ${WS_URL}`);
  
  // Verify system is ready for testing
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error('System health check failed - backend not ready');
  }
  
  console.log('System health check passed - ready for load testing');
  return { startTime: Date.now() };
}

/**
 * Teardown function - runs once after all VUs finish
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Load testing completed in ${duration} seconds`);
  console.log('TerraFusion Load Testing Framework finished');
}