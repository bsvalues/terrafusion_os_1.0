/**
 * Terrafusion Integration Test Suite
 * Comprehensive testing for property assessment platform
 */

const request = require('supertest');
const app = require('./server/index');

describe('Terrafusion API Integration Tests', () => {
  
  describe('System Health', () => {
    test('should return healthy system status', async () => {
      const response = await request(app)
        .get('/api/system/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Property Management', () => {
    test('should retrieve property list', async () => {
      const response = await request(app)
        .get('/api/properties')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('parcelId');
        expect(response.body[0]).toHaveProperty('address');
        expect(response.body[0]).toHaveProperty('assessedValue');
      }
    });

    test('should retrieve property by ID', async () => {
      const propertiesResponse = await request(app)
        .get('/api/properties')
        .expect(200);
      
      if (propertiesResponse.body.length > 0) {
        const propertyId = propertiesResponse.body[0].id;
        const response = await request(app)
          .get(`/api/properties/${propertyId}`)
          .expect(200);
        
        expect(response.body).toHaveProperty('id', propertyId);
        expect(response.body).toHaveProperty('parcelId');
        expect(response.body).toHaveProperty('assessedValue');
      }
    });
  });

  describe('AI Agent System', () => {
    test('should list available agents', async () => {
      const response = await request(app)
        .get('/api/agents')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('status');
      }
    });

    test('should submit task to orchestrator', async () => {
      const propertiesResponse = await request(app)
        .get('/api/properties')
        .expect(200);
      
      if (propertiesResponse.body.length > 0) {
        const propertyId = propertiesResponse.body[0].id;
        
        const taskRequest = {
          taskType: 'property-analysis',
          propertyId: propertyId,
          parameters: {
            analysisType: 'comprehensive'
          }
        };

        const response = await request(app)
          .post('/api/orchestrator/submit')
          .send(taskRequest)
          .expect(201);
        
        expect(response.body).toHaveProperty('taskId');
        expect(response.body).toHaveProperty('status', 'submitted');
      }
    });
  });

  describe('Dashboard Statistics', () => {
    test('should retrieve dashboard stats', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);
      
      expect(response.body).toHaveProperty('totalProperties');
      expect(response.body).toHaveProperty('activeAgents');
      expect(response.body).toHaveProperty('systemHealth');
      expect(typeof response.body.totalProperties).toBe('number');
    });
  });

  describe('Benton County Data Integrity', () => {
    test('should have authentic Benton County property data loaded', async () => {
      const response = await request(app)
        .get('/api/properties')
        .expect(200);
      
      expect(response.body.length).toBeGreaterThan(0);
      
      const bentonProperty = response.body.find(p => p.countyName === 'Benton County');
      expect(bentonProperty).toBeDefined();
      expect(bentonProperty).toHaveProperty('countyName', 'Benton County');
      expect(bentonProperty).toHaveProperty('assessedValue');
      expect(bentonProperty.assessedValue).toBeGreaterThan(0);
    });

    test('should validate authentic property data completeness', async () => {
      const response = await request(app)
        .get('/api/properties')
        .expect(200);
      
      if (response.body.length > 0) {
        const property = response.body[0];
        
        // Verify essential fields from authentic Benton County data
        expect(property).toHaveProperty('parcelId');
        expect(property).toHaveProperty('address');
        expect(property).toHaveProperty('assessedValue');
        expect(property).toHaveProperty('landValue');
        expect(property).toHaveProperty('improvementValue');
        
        // Verify authentic data types and values
        expect(typeof property.assessedValue).toBe('number');
        expect(typeof property.landValue).toBe('number');
        expect(typeof property.improvementValue).toBe('number');
        expect(property.assessedValue).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance Tests', () => {
    test('should respond to health check within acceptable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/system/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000);
    });

    test('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        request(app)
          .get('/api/properties')
          .expect(200)
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(Array.isArray(response.body)).toBe(true);
      });
    });
  });
});