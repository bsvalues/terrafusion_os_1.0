/**
 * CRDT Sync Performance and Load Testing
 *
 * This script tests the performance of CRDT sync operations under load,
 * using k6 to simulate many concurrent users and measure response times.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import {
  randomString,
  randomItem,
  randomIntBetween,
} from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import encoding from 'k6/encoding';

// Custom metrics
const syncOps = new Counter('crdt_sync_operations');
const syncErrors = new Counter('crdt_sync_errors');
const syncSuccess = new Rate('crdt_sync_success');
const syncLatency = new Trend('crdt_sync_latency', true);
const mergeLatency = new Trend('crdt_merge_latency', true);

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_ENDPOINT = `${BASE_URL}/api/mobile-sync`;
const PROPERTIES_API = `${BASE_URL}/api/properties`;
const NUM_PROPERTIES = 5; // Number of properties to create per VU

// Sample property data
const propertyTemplates = [
  {
    address: '123 Main St',
    owner: 'John Doe',
    value: 250000,
    features: ['3 bedrooms', '2 baths', 'garage'],
  },
  {
    address: '456 Oak Ave',
    owner: 'Jane Smith',
    value: 320000,
    features: ['4 bedrooms', '3 baths', 'pool'],
  },
  {
    address: '789 Pine Rd',
    owner: 'Bob Johnson',
    value: 180000,
    features: ['2 bedrooms', '1 bath', 'yard'],
  },
  {
    address: '101 Cedar Ln',
    owner: 'Alice Brown',
    value: 420000,
    features: ['5 bedrooms', '4 baths', 'basement'],
  },
  {
    address: '202 Maple Dr',
    owner: 'Charlie Davis',
    value: 295000,
    features: ['3 bedrooms', '2.5 baths', 'deck'],
  },
];

// Test options
export const options = {
  // Test with gradually increasing users
  stages: [
    { duration: '1m', target: 10 }, // Ramp up to 10 users over 1 minute
    { duration: '2m', target: 50 }, // Ramp up to 50 users over 2 minutes
    { duration: '1m', target: 100 }, // Ramp up to 100 users over 1 minute
    { duration: '3m', target: 100 }, // Stay at 100 users for 3 minutes
    { duration: '1m', target: 0 }, // Ramp down to 0 users over 1 minute
  ],
  thresholds: {
    crdt_sync_success: ['rate>0.95'], // 95% success rate
    crdt_sync_latency: ['p(95)<500'], // 95% of requests under 500ms
    crdt_merge_latency: ['p(95)<1000'], // 95% of merges under 1000ms
  },
};

// Setup function - create test properties
export function setup() {
  console.log('Creating test properties for load testing...');

  const properties = [];

  // Create properties
  for (let i = 0; i < 10; i++) {
    const template = randomItem(propertyTemplates);
    const property = {
      id: `load-test-${randomString(8)}`,
      address: `${template.address} #${i}`,
      owner: template.owner,
      value: template.value,
      features: template.features,
      notes: `Load test property created at ${new Date().toISOString()}`,
    };

    const response = http.post(PROPERTIES_API, JSON.stringify(property), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 201) {
      properties.push(property);
      console.log(`Created property ${property.id}`);
    } else {
      console.error(`Failed to create property: ${response.status}`);
    }
  }

  console.log(`Created ${properties.length} test properties`);
  return { properties };
}

// Generate mock CRDT update
function generateMockUpdate(propertyId, size = 'small') {
  // This is a simplified representation of a Y.js update
  // In a real scenario, you would use Y.js to generate actual updates
  let updateSize;

  switch (size) {
    case 'small':
      updateSize = randomIntBetween(100, 500);
      break;
    case 'medium':
      updateSize = randomIntBetween(500, 2000);
      break;
    case 'large':
      updateSize = randomIntBetween(2000, 10000);
      break;
    default:
      updateSize = randomIntBetween(100, 500);
  }

  // Generate a random update of the specified size
  const update = new Uint8Array(updateSize);
  for (let i = 0; i < updateSize; i++) {
    update[i] = Math.floor(Math.random() * 256);
  }

  return {
    propertyId,
    update: Array.from(update),
    userId: `user-${randomIntBetween(1, 1000)}`,
    timestamp: Date.now(),
  };
}

// Main test function
export default function (data) {
  const { properties } = data;

  // Skip if no properties were created
  if (!properties || properties.length === 0) {
    console.error('No properties available for testing');
    return;
  }

  // Select a random property
  const property = randomItem(properties);

  // Generate update sizes with distribution: 70% small, 20% medium, 10% large
  const updateSize = (() => {
    const rand = Math.random();
    if (rand < 0.7) return 'small';
    if (rand < 0.9) return 'medium';
    return 'large';
  })();

  // Generate a mock update
  const updatePayload = generateMockUpdate(property.id, updateSize);

  // Measure sync latency
  const startTime = new Date();

  // Send sync request
  const response = http.post(`${API_ENDPOINT}/${property.id}`, JSON.stringify(updatePayload), {
    headers: { 'Content-Type': 'application/json' },
  });

  // Calculate latency
  const syncLatencyMs = new Date() - startTime;
  syncLatency.add(syncLatencyMs);

  // Increment sync operations counter
  syncOps.add(1);

  // Check response
  const success = check(response, {
    'sync operation successful': r => r.status === 200,
    'sync response contains merge info': r => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('merged') && body.hasOwnProperty('latency');
      } catch (e) {
        return false;
      }
    },
  });

  // Record success rate
  syncSuccess.add(success);

  // If successful, record merge latency if available
  if (success) {
    try {
      const body = JSON.parse(response.body);
      if (body.latency) {
        mergeLatency.add(body.latency);
      }
    } catch (e) {
      console.error('Error parsing response body:', e);
    }
  } else {
    syncErrors.add(1);
    console.error(`Sync failed for ${property.id}: ${response.status} ${response.body}`);
  }

  // Wait between requests
  sleep(randomIntBetween(1, 5));
}

// Teardown function - clean up test properties
export function teardown(data) {
  console.log('Cleaning up test properties...');

  const { properties } = data;

  // Skip if no properties were created
  if (!properties || properties.length === 0) {
    console.error('No properties to clean up');
    return;
  }

  // Delete each property
  for (const property of properties) {
    const response = http.del(`${PROPERTIES_API}/${property.id}`);

    if (response.status === 200) {
      console.log(`Deleted property ${property.id}`);
    } else {
      console.error(`Failed to delete property ${property.id}: ${response.status}`);
    }
  }

  console.log('Cleanup complete');
}
