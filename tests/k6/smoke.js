// NO HARDCODED PORTS! Use environment variables.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 25 }, // Stay at 25 users
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'], // Error rate under 1%
    errors: ['rate<0.05'], // Custom error metric under 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:${TF_STATIC_PORT:-8080}';
const JWT_TOKEN = __ENV.JWT_TOKEN || '';

export function setup() {
  // Setup code - check if API is accessible
  const res = http.get(`${BASE_URL}/health`);
  if (res.status !== 200) {
    throw new Error(`API not accessible: ${res.status}`);
  }
  return { token: JWT_TOKEN };
}

export default function (data) {
  const headers = {};
  if (data.token) {
    headers['Authorization'] = `Bearer ${data.token}`;
  }

  // Test scenarios with weighted distribution
  const scenario = Math.random();

  if (scenario < 0.4) {
    // 40% - Health check (unauthenticated)
    const res = http.get(`${BASE_URL}/health`);
    const success = check(res, {
      'health check status is 200': r => r.status === 200,
      'health check response time < 100ms': r => r.timings.duration < 100,
    });
    errorRate.add(!success);
  } else if (scenario < 0.7) {
    // 30% - Module status (authenticated)
    const res = http.get(`${BASE_URL}/api/modules/status`, { headers });
    const success = check(res, {
      'modules status is 200': r => r.status === 200,
      'modules count > 0': r => {
        try {
          const body = JSON.parse(r.body);
          return body.total > 0;
        } catch {
          return false;
        }
      },
    });
    errorRate.add(!success);
  } else if (scenario < 0.9) {
    // 20% - AI swarm status (authenticated)
    const res = http.get(`${BASE_URL}/api/swarm/status`, { headers });
    const success = check(res, {
      'swarm status is 200': r => r.status === 200,
      'swarm has agents': r => {
        try {
          const body = JSON.parse(r.body);
          return body.swarmStatus && body.swarmStatus.totalAgents > 0;
        } catch {
          return false;
        }
      },
    });
    errorRate.add(!success);
  } else {
    // 10% - Database status (authenticated)
    const res = http.get(`${BASE_URL}/api/database/status`, { headers });
    const success = check(res, {
      'database status is 200': r => r.status === 200,
      'database is connected': r => {
        try {
          const body = JSON.parse(r.body);
          return body.database && body.database.isConnected;
        } catch {
          return false;
        }
      },
    });
    errorRate.add(!success);
  }

  // Random sleep between 0.5 and 2 seconds
  sleep(0.5 + Math.random() * 1.5);
}

export function teardown(data) {
  // Cleanup code if needed
  console.log('Performance test completed');
}
