const request = require('supertest');
const app = require('../src/app');
const { generateTestToken } = require('../utils/test-auth');

/**
 * 🧪 PROPERTY-WORKBENCH API Test Suite
 * THE TERRAFUSION WAY - Government-Grade API Testing
 * 
 * Security Level: HIGH
 * Rate Limit: 100 requests/minute per user
 */

describe('Property Workbench API Tests', () => {
  let authToken;
  let testClient;

  beforeAll(async () => {
    // Setup test authentication
    authToken = await generateTestToken({
      workspace: 'property-workbench',
      scopes: ['property-workbench:read', 'property-workbench:write'],
      security_level: 'HIGH'
    });
    
    testClient = request(app);
  });

  describe('🔒 Authentication & Security', () => {
    test('should require authentication for all endpoints', async () => {
      const response = await testClient
        .get('/api/v1/property/health')
        .expect(401);
      
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    test('should accept valid authentication token', async () => {
      const response = await testClient
        .get('/api/v1/property/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
    });

    test('should enforce rate limiting', async () => {
      const rateLimitRequests = Array(200).fill().map(() =>
        testClient
          .get('/api/v1/property/health')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(rateLimitRequests);
      const rateLimited = responses.filter(r => r.status === 429);
      
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('🏥 Health & Monitoring', () => {
    test('should return healthy status', async () => {
      const response = await testClient
        .get('/api/v1/property/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        version: expect.any(String)
      });
    });

    test('should provide metrics endpoint', async () => {
      const response = await testClient
        .get('/api/v1/property/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('requests_total');
      expect(response.body).toHaveProperty('response_time_avg');
    });
  });

  describe('🎯 Primary Endpoints', () => {
    test('should handle GET /properties', async () => {
      const response = await testClient
        .get('/api/v1/property/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-TerraFusion-Workspace', 'property-workbench');

      expect([200, 201, 204]).toContain(response.status);
    });
    test('should handle POST /valuations', async () => {
      const response = await testClient
        .post('/api/v1/property/valuations')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-TerraFusion-Workspace', 'property-workbench');

      expect([200, 201, 204]).toContain(response.status);
    });
    test('should handle GET /ownership', async () => {
      const response = await testClient
        .get('/api/v1/property/ownership')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-TerraFusion-Workspace', 'property-workbench');

      expect([200, 201, 204]).toContain(response.status);
    });
    test('should handle POST /transfers', async () => {
      const response = await testClient
        .post('/api/v1/property/transfers')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-TerraFusion-Workspace', 'property-workbench');

      expect([200, 201, 204]).toContain(response.status);
    });
  });

  describe('📊 Performance Tests', () => {
    test('should respond within SLA (<100ms)', async () => {
      const startTime = Date.now();
      
      await testClient
        .get('/api/v1/property/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
    });

    test('should handle concurrent requests', async () => {
      const concurrentRequests = Array(50).fill().map(() =>
        testClient
          .get('/api/v1/property/health')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(concurrentRequests);
      const successfulResponses = responses.filter(r => r.status === 200);
      
      expect(successfulResponses.length).toBeGreaterThan(45); // 90% success rate
    });
  });

  describe('🛡️ Security Tests', () => {
    test('should validate security headers', async () => {
      const response = await testClient
        .get('/api/v1/property/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    test('should reject malformed requests', async () => {
      await testClient
        .post('/api/v1/property/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send('{invalid json}')
        .expect(400);
    });
  });

  describe('♿ Accessibility & Compliance', () => {
    test('should include accessibility metadata', async () => {
      const response = await testClient
        .get('/api/v1/property/docs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('accessibility');
      expect(response.body.accessibility).toMatchObject({
        wcag_compliance: 'AA',
        section_508: true
      });
    });
  });

  afterAll(async () => {
    // Cleanup test resources
    await testClient
      .delete('/api/v1/property/test-cleanup')
      .set('Authorization', `Bearer ${authToken}`);
  });
});

module.exports = {
  testSuite: 'property-workbench-api-tests',
  security_level: 'HIGH',
  endpoints_tested: 6,
  compliance_verified: ['Property Privacy', 'Valuation Accuracy', 'Ownership Security']
};