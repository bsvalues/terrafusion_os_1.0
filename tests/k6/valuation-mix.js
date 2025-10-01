// NO HARDCODED PORTS! Use environment variables.
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const valuationDuration = new Trend('valuation_duration');
const harrisSyncDuration = new Trend('harris_sync_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 }, // Warm up
    { duration: '2m', target: 20 }, // Main test
    { duration: '30s', target: 0 }, // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.02'],
    valuation_duration: ['p(95)<1500'],
    harris_sync_duration: ['p(95)<500'],
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:${TF_STATIC_PORT:-8080}';
const JWT_TOKEN = __ENV.JWT_TOKEN || '';

// Test data generators
function generateParcelId() {
  const prefix = Math.floor(Math.random() * 9) + 1;
  const middle = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, '0');
  const suffix = Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, '0');
  return `${prefix}-${middle}-${suffix}-0000`;
}

function generatePropertyFeatures() {
  return {
    sqft: Math.floor(Math.random() * 3000) + 800,
    year_built: Math.floor(Math.random() * 60) + 1960,
    bedrooms: Math.floor(Math.random() * 4) + 1,
    bathrooms: Math.floor(Math.random() * 3) + 1,
    lot_size: Math.floor(Math.random() * 10000) + 2000,
    stories: Math.floor(Math.random() * 2) + 1,
  };
}

export default function () {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (JWT_TOKEN) {
    headers['Authorization'] = `Bearer ${JWT_TOKEN}`;
  }

  // 90% read / 10% write distribution
  const isWrite = Math.random() < 0.1;

  if (isWrite) {
    group('Valuation Write Operations', () => {
      // Submit a new valuation request
      const payload = JSON.stringify({
        parcelId: generateParcelId(),
        features: generatePropertyFeatures(),
        requestedModels: ['ai-model-v2', 'costforge-enhanced'],
        useComparableSales: true,
        confidenceTarget: 0.85,
      });

      const startTime = Date.now();
      const res = http.post(`${BASE_URL}/api/valuation/estimate`, payload, { headers });
      const duration = Date.now() - startTime;

      valuationDuration.add(duration);

      const success = check(res, {
        'valuation create status 200-299': r => r.status >= 200 && r.status < 300,
        'valuation has estimated value': r => {
          try {
            const body = JSON.parse(r.body);
            return body.estimatedValue > 0;
          } catch {
            return false;
          }
        },
        'valuation confidence > 0.7': r => {
          try {
            const body = JSON.parse(r.body);
            return body.confidence > 0.7;
          } catch {
            return false;
          }
        },
      });

      errorRate.add(!success);
    });
  } else {
    group('Read Operations', () => {
      const readType = Math.random();

      if (readType < 0.5) {
        // 50% of reads - Check Harris PACS sync status
        const startTime = Date.now();
        const res = http.get(`${BASE_URL}/api/sync/harris/status`, { headers });
        const duration = Date.now() - startTime;

        harrisSyncDuration.add(duration);

        const success = check(res, {
          'harris sync status is 200': r => r.status === 200,
          'harris sync is recent': r => {
            try {
              const body = JSON.parse(r.body);
              return body.stalenessSeconds < 60;
            } catch {
              return false;
            }
          },
        });

        errorRate.add(!success);
      } else if (readType < 0.8) {
        // 30% of reads - Get module metrics
        const res = http.get(`${BASE_URL}/api/modules/metrics`, { headers });

        const success = check(res, {
          'module metrics status is 200': r => r.status === 200,
          'has module data': r => {
            try {
              const body = JSON.parse(r.body);
              return body.modules && Array.isArray(body.modules);
            } catch {
              return false;
            }
          },
        });

        errorRate.add(!success);
      } else {
        // 20% of reads - Get specific property assessment
        const parcelId = generateParcelId();
        const res = http.get(`${BASE_URL}/api/property/${parcelId}/assessment`, { headers });

        const success = check(res, {
          'property assessment status ok': r => r.status === 200 || r.status === 404,
          'response time < 500ms': r => r.timings.duration < 500,
        });

        errorRate.add(!success && res.status !== 404);
      }
    });
  }

  // Variable think time between requests
  sleep(Math.random() * 2 + 0.5);
}
