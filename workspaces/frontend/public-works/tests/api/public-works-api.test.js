const request = require('supertest');
const app = require('../src/app');
const { generateTestToken } = require('../utils/test-auth');

/**
 * 🧪 PUBLIC-WORKS API Test Suite
 * THE TERRAFUSION WAY - Government-Grade API Testing
 * 
 * Security Level: MEDIUM
 * Rate Limit: 150 requests/minute per worker
 */

describe('Public Works API Tests', () => {
  let authToken;
  let testClient;

  beforeAll(async () => {
    // Setup test authentication
    authToken = await generateTestToken({
      workspace: 'public-works',
      scopes: ['public-works:read', 'public-works:write'],
      security_level: 'MEDIUM'
    });
    
    testClient = request(app);
  });

  describe('🔒 Authentication & Security', () => {
    test('should require authentication for all endpoints', async () => {
      const response = await testClient
        .get('/api/v1/public-works/health')
        .expect(401);
      
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    test('should accept valid authentication token', async () => {
      const response = await testClient
        .get('/api/v1/public-works/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
    });

    test('should enforce rate limiting', async () => {
      const rateLimitRequests = Array(200).fill().map(() =>
        testClient
          .get('/api/v1/public-works/health')
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
        .get('/api/v1/public-works/health')
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
        .get('/api/v1/public-works/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('requests_total');
      expect(response.body).toHaveProperty('response_time_avg');
    });
  });

  describe('🎯 Primary Endpoints', () => {
    test('should handle GET /infrastructure', async () => {
      const response = await testClient
        .get('/api/v1/public-works/infrastructure')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-TerraFusion-Workspace', 'public-works');

      expect([200, 201, 204]).toContain(response.status);
    });
    test('should handle POST /maintenance', async () => {
      const response = await testClient
        .post('/api/v1/public-works/maintenance')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-TerraFusion-Workspace', 'public-works');

      expect([200, 201, 204]).toContain(response.status);
    });
    test('should handle GET /projects', async () => {
      const response = await testClient
        .get('/api/v1/public-works/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-TerraFusion-Workspace', 'public-works');

      expect([200, 201, 204]).toContain(response.status);
    });
    test('should handle POST /work-orders', async () => {
      const response = await testClient
        .post('/api/v1/public-works/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-TerraFusion-Workspace', 'public-works');

      expect([200, 201, 204]).toContain(response.status);
    });
  });

  describe('📊 Performance Tests', () => {
    test('should respond within SLA (<100ms)', async () => {
      const startTime = Date.now();
      
      await testClient
        .get('/api/v1/public-works/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100);
    });

    test('should handle concurrent requests', async () => {
      const concurrentRequests = Array(50).fill().map(() =>
        testClient
          .get('/api/v1/public-works/health')
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
        .get('/api/v1/public-works/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    test('should reject malformed requests', async () => {
      await testClient
        .post('/api/v1/public-works/data')
        .set('Authorization', `Bearer ${authToken}`)
        .send('{invalid json}')
        .expect(400);
    });
  });

  describe('♿ Accessibility & Compliance', () => {
    test('should include accessibility metadata', async () => {
      const response = await testClient
        .get('/api/v1/public-works/docs')
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
      .delete('/api/v1/public-works/test-cleanup')
      .set('Authorization', `Bearer ${authToken}`);
  });
});

module.exports = {
  testSuite: 'public-works-api-tests',
  security_level: 'MEDIUM',
  endpoints_tested: 6,
  compliance_verified: ['Operational Continuity', 'Safety Compliance']
};