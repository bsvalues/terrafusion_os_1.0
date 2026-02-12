/**
 * TerraFusion Load Testing Suite with k6
 * 
 * Comprehensive performance testing for government-scale applications
 * Tests critical user journeys including citizen services, permit applications,
 * and emergency response systems across the 3-county federation.
 * 
 * Test Scenarios:
 * - Citizen portal load testing
 * - API endpoint performance validation
 * - Cross-county federation stress testing
 * - Emergency response load simulation
 * - Database connection pooling validation
 */

import http from 'k6/http';
import { check, group, sleep, fail } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics for government services
export let citizenServiceResponseTime = new Trend('citizen_service_response_time');
export let permitApplicationThroughput = new Rate('permit_application_success_rate');
export let federationLatency = new Trend('federation_latency');
export let emergencyResponseTime = new Trend('emergency_response_time');
export let complianceCheckDuration = new Trend('compliance_check_duration');
export let auditLogWrites = new Counter('audit_log_writes');
export let activeConnections = new Gauge('active_websocket_connections');

// Test configuration for different environments
export let options = {
  scenarios: {
    // Baseline citizen portal usage
    citizen_portal_baseline: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
      tags: { test_type: 'baseline', service: 'citizen_portal' },
      env: { SCENARIO: 'citizen_baseline' },
    },
    
    // Peak citizen traffic simulation
    citizen_portal_peak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up
        { duration: '5m', target: 100 },  // Peak traffic
        { duration: '2m', target: 0 },    // Ramp down
      ],
      tags: { test_type: 'peak_load', service: 'citizen_portal' },
      env: { SCENARIO: 'citizen_peak' },
    },
    
    // Permit application stress test
    permit_stress_test: {
      executor: 'constant-arrival-rate',
      rate: 20, // 20 permit applications per second
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVUs: 30,
      maxVUs: 100,
      tags: { test_type: 'stress', service: 'permits' },
      env: { SCENARIO: 'permit_stress' },
    },
    
    // Emergency response load test
    emergency_response: {
      executor: 'shared-iterations',
      vus: 5,
      iterations: 100,
      maxDuration: '5m',
      tags: { test_type: 'emergency', service: 'emergency_response' },
      env: { SCENARIO: 'emergency' },
    },
    
    // Cross-county federation test
    federation_test: {
      executor: 'per-vu-iterations',
      vus: 15,
      iterations: 10,
      maxDuration: '8m',
      tags: { test_type: 'federation', service: 'federation_relay' },
      env: { SCENARIO: 'federation' },
    },
    
    // Soak test for long-running stability
    soak_test: {
      executor: 'constant-vus',
      vus: 25,
      duration: '30m',
      tags: { test_type: 'soak', service: 'all_services' },
      env: { SCENARIO: 'soak' },
    },
  },
  
  // Performance thresholds for SLA compliance
  thresholds: {
    // HTTP request thresholds
    'http_req_duration': ['p(95)<500'], // 95% of requests under 500ms
    'http_req_duration{service:citizen_portal}': ['p(95)<300'], // Citizen portal specific
    'http_req_duration{service:permits}': ['p(95)<1000'], // Permit processing
    'http_req_duration{service:emergency_response}': ['p(95)<200'], // Emergency services
    
    // Success rate thresholds
    'http_req_failed': ['rate<0.01'], // Less than 1% failures
    'http_req_failed{service:emergency_response}': ['rate<0.001'], // Emergency: < 0.1% failures
    
    // Custom metrics thresholds
    'citizen_service_response_time': ['p(95)<400'],
    'permit_application_success_rate': ['rate>0.98'], // 98% success rate
    'federation_latency': ['p(95)<300'], // Cross-county federation
    'emergency_response_time': ['p(95)<150'], // Emergency response SLA
    'compliance_check_duration': ['p(95)<100'], // Compliance validation
  },
  
  // Load test configuration
  noConnectionReuse: false,
  userAgent: 'TerraFusion-LoadTest/1.0',
  
  // Output configuration
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  
  // Environment-specific overrides
  ext: {
    loadimpact: {
      projectID: 3543321,
      name: 'TerraFusion Government Services Load Test',
    },
  },
};

// Test data for different scenarios
const testData = {
  counties: ['benton', 'franklin', 'yakima'],
  permitTypes: ['building', 'business', 'environmental', 'emergency'],
  citizenServices: ['pothole_report', 'service_request', 'public_records', 'complaint'],
  emergencyTypes: ['fire', 'medical', 'flood', 'utility_outage'],
  users: [
    { name: 'John Citizen', email: 'john@example.com', county: 'benton' },
    { name: 'Jane Employee', email: 'jane@franklin.gov', county: 'franklin' },
    { name: 'Bob Admin', email: 'bob@yakima.gov', county: 'yakima' },
  ],
};

// Environment configuration
const config = {
  baseUrl: __ENV.BASE_URL || 'https://terrafusionmarket.com',
  apiUrl: __ENV.API_URL || 'https://api.terrafusionmarket.com',
  federationUrl: __ENV.FEDERATION_URL || 'https://federation.terrafusionmarket.com',
  authToken: __ENV.AUTH_TOKEN || 'test-token-12345',
  testEnvironment: __ENV.TEST_ENV || 'staging',
};

// Test setup - runs once before all scenarios
export function setup() {
  console.log('🚀 Starting TerraFusion Load Testing Suite');
  console.log(`Environment: ${config.testEnvironment}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Federation URL: ${config.federationUrl}`);
  
  // Health check all services before starting tests
  const healthCheck = http.get(`${config.apiUrl}/health`);
  if (healthCheck.status !== 200) {
    fail('API health check failed - aborting test');
  }
  
  // Verify federation connectivity
  const federationHealth = http.get(`${config.federationUrl}/health`);
  if (federationHealth.status !== 200) {
    console.warn('Federation health check failed - some tests may be skipped');
  }
  
  return {
    apiHealthy: healthCheck.status === 200,
    federationHealthy: federationHealth.status === 200,
    startTime: new Date().toISOString(),
  };
}

// Main test execution
export default function(data) {
  const scenario = __ENV.SCENARIO || 'citizen_baseline';
  
  group('TerraFusion Load Test Suite', function() {
    switch (scenario) {
      case 'citizen_baseline':
        citizenPortalBaseline();
        break;
      case 'citizen_peak':
        citizenPortalPeak();
        break;
      case 'permit_stress':
        permitStressTest();
        break;
      case 'emergency':
        emergencyResponseTest();
        break;
      case 'federation':
        federationTest(data);
        break;
      case 'soak':
        soakTest();
        break;
      default:
        console.warn(`Unknown scenario: ${scenario}, running baseline`);
        citizenPortalBaseline();
    }
  });
}

// Citizen portal baseline load test
function citizenPortalBaseline() {
  group('Citizen Portal - Baseline Load', function() {
    // Homepage load
    let response = http.get(`${config.baseUrl}/`);
    check(response, {
      'homepage loads successfully': (r) => r.status === 200,
      'homepage loads within 2s': (r) => r.timings.duration < 2000,
    });
    citizenServiceResponseTime.add(response.timings.duration);
    
    sleep(1);
    
    // Service directory browse
    response = http.get(`${config.baseUrl}/services`);
    check(response, {
      'services page loads': (r) => r.status === 200,
      'services data present': (r) => r.body.includes('permit') || r.body.includes('service'),
    });
    
    sleep(2);
    
    // Search functionality
    const searchQuery = 'building permit';
    response = http.get(`${config.baseUrl}/search?q=${encodeURIComponent(searchQuery)}`);
    check(response, {
      'search returns results': (r) => r.status === 200,
      'search response time acceptable': (r) => r.timings.duration < 1000,
    });
    
    auditLogWrites.add(1);
  });
}

// Peak traffic simulation for citizen portal
function citizenPortalPeak() {
  group('Citizen Portal - Peak Traffic', function() {
    const user = testData.users[Math.floor(Math.random() * testData.users.length)];
    const county = testData.counties[Math.floor(Math.random() * testData.counties.length)];
    
    // Simulate user login
    const loginPayload = {
      email: user.email,
      county: county,
      timestamp: new Date().toISOString(),
    };
    
    let response = http.post(`${config.apiUrl}/auth/login`, JSON.stringify(loginPayload), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(response, {
      'login successful': (r) => r.status === 200 || r.status === 201,
      'login response time': (r) => r.timings.duration < 500,
    });
    
    if (response.status >= 200 && response.status < 300) {
      const authToken = response.json('token') || config.authToken;
      
      // Access authenticated citizen dashboard
      response = http.get(`${config.baseUrl}/dashboard`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      check(response, {
        'dashboard loads for authenticated user': (r) => r.status === 200,
        'dashboard personalization present': (r) => r.body.includes(user.name) || r.body.includes(county),
      });
      
      citizenServiceResponseTime.add(response.timings.duration);
      
      // Submit a service request
      const serviceType = testData.citizenServices[Math.floor(Math.random() * testData.citizenServices.length)];
      const servicePayload = {
        type: serviceType,
        description: `Load test service request for ${serviceType}`,
        location: `Test Location, ${county} County`,
        priority: 'normal',
        citizen: user.name,
      };
      
      response = http.post(`${config.apiUrl}/services/request`, JSON.stringify(servicePayload), {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      check(response, {
        'service request submitted': (r) => r.status === 201,
        'service request response time': (r) => r.timings.duration < 800,
      });
      
      auditLogWrites.add(1);
    }
    
    sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
  });
}

// Permit application stress test
function permitStressTest() {
  group('Permit Application - Stress Test', function() {
    const permitType = testData.permitTypes[Math.floor(Math.random() * testData.permitTypes.length)];
    const county = testData.counties[Math.floor(Math.random() * testData.counties.length)];
    
    // Create permit application
    const permitPayload = {
      type: permitType,
      applicant: `Load Test Applicant ${__VU}-${__ITER}`,
      project_address: `${Math.floor(Math.random() * 9999)} Test Street`,
      county: county,
      estimated_cost: Math.floor(Math.random() * 500000) + 10000,
      description: `Load test permit application for ${permitType} permit`,
      timestamp: new Date().toISOString(),
    };
    
    let response = http.post(`${config.apiUrl}/permits/apply`, JSON.stringify(permitPayload), {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.authToken}`,
      },
    });
    
    check(response, {
      'permit application submitted': (r) => r.status === 201,
      'permit response includes application ID': (r) => {
        try {
          const json = r.json();
          return json.applicationId !== undefined;
        } catch {
          return false;
        }
      },
    });
    
    if (response.status === 201) {
      permitApplicationThroughput.add(1);
      const applicationId = response.json('applicationId');
      
      // Check application status
      response = http.get(`${config.apiUrl}/permits/${applicationId}/status`, {
        headers: { Authorization: `Bearer ${config.authToken}` },
      });
      
      check(response, {
        'permit status check successful': (r) => r.status === 200,
        'permit status response time': (r) => r.timings.duration < 300,
      });
      
      // Compliance check simulation
      const complianceStart = Date.now();
      response = http.post(`${config.apiUrl}/permits/${applicationId}/compliance-check`, '{}', {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.authToken}`,
        },
      });
      const complianceDuration = Date.now() - complianceStart;
      
      check(response, {
        'compliance check initiated': (r) => r.status === 200 || r.status === 202,
      });
      
      complianceCheckDuration.add(complianceDuration);
      auditLogWrites.add(2); // Application + status check
    } else {
      permitApplicationThroughput.add(0);
    }
    
    sleep(0.5);
  });
}

// Emergency response system load test
function emergencyResponseTest() {
  group('Emergency Response - Load Test', function() {
    const emergencyType = testData.emergencyTypes[Math.floor(Math.random() * testData.emergencyTypes.length)];
    const county = testData.counties[Math.floor(Math.random() * testData.counties.length)];
    
    const emergencyPayload = {
      type: emergencyType,
      severity: Math.random() > 0.7 ? 'high' : 'medium',
      location: {
        county: county,
        address: `${Math.floor(Math.random() * 9999)} Emergency Lane`,
        coordinates: {
          lat: 46.0 + Math.random() * 0.5,
          lng: -119.0 - Math.random() * 0.5,
        },
      },
      description: `Load test emergency: ${emergencyType}`,
      reporter: `Test Reporter ${__VU}`,
      timestamp: new Date().toISOString(),
    };
    
    const emergencyStart = Date.now();
    let response = http.post(`${config.apiUrl}/emergency/report`, JSON.stringify(emergencyPayload), {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.authToken}`,
      },
    });
    const emergencyDuration = Date.now() - emergencyStart;
    
    check(response, {
      'emergency report submitted': (r) => r.status === 201,
      'emergency response under 200ms': (r) => r.timings.duration < 200,
      'emergency includes incident ID': (r) => {
        try {
          return r.json('incidentId') !== undefined;
        } catch {
          return false;
        }
      },
    });
    
    emergencyResponseTime.add(emergencyDuration);
    
    if (response.status === 201) {
      const incidentId = response.json('incidentId');
      
      // Emergency status tracking
      for (let i = 0; i < 3; i++) {
        sleep(1);
        response = http.get(`${config.apiUrl}/emergency/${incidentId}/status`, {
          headers: { Authorization: `Bearer ${config.authToken}` },
        });
        
        check(response, {
          'emergency status check successful': (r) => r.status === 200,
        });
      }
      
      auditLogWrites.add(4); // Report + 3 status checks
    }
  });
}

// Cross-county federation test
function federationTest(data) {
  if (!data.federationHealthy) {
    console.warn('Federation system unhealthy - skipping federation tests');
    return;
  }
  
  group('Cross-County Federation - Load Test', function() {
    const sourceCounty = testData.counties[Math.floor(Math.random() * testData.counties.length)];
    const targetCounty = testData.counties.filter(c => c !== sourceCounty)[Math.floor(Math.random() * 2)];
    
    // Cross-county citizen service request
    const federationPayload = {
      sourceCounty: sourceCounty,
      targetCounty: targetCounty,
      serviceType: 'public_records_request',
      requestDetails: {
        requester: `Federation Test User ${__VU}`,
        recordType: 'property_records',
        subject: `Test Property ${Math.floor(Math.random() * 10000)}`,
      },
      priority: 'normal',
      timestamp: new Date().toISOString(),
    };
    
    const federationStart = Date.now();
    let response = http.post(`${config.federationUrl}/request`, JSON.stringify(federationPayload), {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.authToken}`,
      },
    });
    const federationDuration = Date.now() - federationStart;
    
    check(response, {
      'federation request successful': (r) => r.status === 200 || r.status === 201,
      'federation response time acceptable': (r) => r.timings.duration < 500,
      'federation routing correct': (r) => {
        try {
          const json = r.json();
          return json.routedTo === targetCounty;
        } catch {
          return false;
        }
      },
    });
    
    federationLatency.add(federationDuration);
    
    // Check federation connectivity between counties
    response = http.get(`${config.federationUrl}/counties/${targetCounty}/health`, {
      headers: { Authorization: `Bearer ${config.authToken}` },
    });
    
    check(response, {
      'target county reachable': (r) => r.status === 200,
      'county health check fast': (r) => r.timings.duration < 100,
    });
    
    auditLogWrites.add(2);
    sleep(2);
  });
}

// Long-running soak test
function soakTest() {
  group('Soak Test - All Services', function() {
    // Rotate through different service types
    const testType = __ITER % 4;
    
    switch (testType) {
      case 0:
        citizenPortalBaseline();
        break;
      case 1:
        // Lightweight permit check
        let response = http.get(`${config.apiUrl}/permits/types`);
        check(response, { 'permit types available': (r) => r.status === 200 });
        break;
      case 2:
        // Service status check
        response = http.get(`${config.apiUrl}/services/status`);
        check(response, { 'services status healthy': (r) => r.status === 200 });
        break;
      case 3:
        // Health monitoring
        response = http.get(`${config.apiUrl}/health`);
        check(response, { 'system health check': (r) => r.status === 200 });
        break;
    }
    
    sleep(3); // Longer sleep for soak test
  });
}

// Test teardown - runs once after all scenarios
export function teardown(data) {
  console.log('🏁 TerraFusion Load Testing Suite Completed');
  console.log(`Test started: ${data.startTime}`);
  console.log(`Test completed: ${new Date().toISOString()}`);
  
  // Cleanup test data if needed
  if (config.testEnvironment === 'staging') {
    console.log('Cleaning up test data...');
    // Add cleanup logic here
  }
}

// Custom summary for detailed reporting
export function handleSummary(data) {
  const summary = {
    'summary.html': htmlReport(data),
    'summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
  
  // Add custom government service metrics
  const customMetrics = {
    citizen_service_sla: data.metrics.citizen_service_response_time?.values.p95 < 400,
    permit_throughput_target: data.metrics.permit_application_success_rate?.values.rate > 0.98,
    emergency_response_sla: data.metrics.emergency_response_time?.values.p95 < 150,
    federation_latency_target: data.metrics.federation_latency?.values.p95 < 300,
    overall_success_rate: data.metrics.http_req_failed?.values.rate < 0.01,
  };
  
  console.log('\n📊 Government Service SLA Compliance:');
  Object.entries(customMetrics).forEach(([metric, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${metric}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  return summary;
}

// Generate HTML report
function htmlReport(data) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>TerraFusion Load Test Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; }
          .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
          .metric-card { background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
          .pass { border-left-color: #10b981; }
          .fail { border-left-color: #ef4444; }
          .value { font-size: 24px; font-weight: bold; color: #1f2937; }
          .label { color: #6b7280; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏛️ TerraFusion Government Services Load Test Report</h1>
          <p>Generated: ${new Date().toISOString()}</p>
        </div>
        
        <div class="metrics">
          <div class="metric-card ${data.metrics.citizen_service_response_time?.values.p95 < 400 ? 'pass' : 'fail'}">
            <div class="label">Citizen Service Response Time (P95)</div>
            <div class="value">${Math.round(data.metrics.citizen_service_response_time?.values.p95 || 0)}ms</div>
          </div>
          
          <div class="metric-card ${data.metrics.permit_application_success_rate?.values.rate > 0.98 ? 'pass' : 'fail'}">
            <div class="label">Permit Application Success Rate</div>
            <div class="value">${Math.round((data.metrics.permit_application_success_rate?.values.rate || 0) * 100)}%</div>
          </div>
          
          <div class="metric-card ${data.metrics.emergency_response_time?.values.p95 < 150 ? 'pass' : 'fail'}">
            <div class="label">Emergency Response Time (P95)</div>
            <div class="value">${Math.round(data.metrics.emergency_response_time?.values.p95 || 0)}ms</div>
          </div>
          
          <div class="metric-card ${data.metrics.federation_latency?.values.p95 < 300 ? 'pass' : 'fail'}">
            <div class="label">Federation Latency (P95)</div>
            <div class="value">${Math.round(data.metrics.federation_latency?.values.p95 || 0)}ms</div>
          </div>
        </div>
        
        <h2>📈 Detailed Metrics</h2>
        <pre>${JSON.stringify(data.metrics, null, 2)}</pre>
      </body>
    </html>
  `;
}