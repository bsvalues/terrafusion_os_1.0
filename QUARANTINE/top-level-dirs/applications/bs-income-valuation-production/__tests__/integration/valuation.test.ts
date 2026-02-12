import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import express, { Express } from 'express';
import request from 'supertest';
import { registerRoutes } from '../../server/routes';
import { MockStorage } from '../mocks/mockstorage';

// Mock the storage module
jest.mock('../../server/storage', () => {
  const mockStorage = new MockStorage();
  return {
    storage: mockStorage,
    get _getMockStorage() {
      return mockStorage;
    }
  };
});

// Keep track of original NODE_ENV
const originalNodeEnv = process.env.NODE_ENV;

describe('Valuation API Tests', () => {
  let app: Express;
  let server: any;
  let mockStorage: MockStorage;

  beforeAll(async () => {
    // Set to development mode to enable auth bypass
    process.env.NODE_ENV = 'development';
    
    app = express();
    app.use(express.json());
    
    // Get reference to mock storage
    mockStorage = (jest.requireMock('../../server/storage') as any)._getMockStorage;
    
    // Register routes
    server = await registerRoutes(app);
  });

  afterAll((done) => {
    // Restore original environment
    process.env.NODE_ENV = originalNodeEnv;
    
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  beforeEach(() => {
    mockStorage.reset();
    
    // Seed with test data
    mockStorage.createUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      fullName: 'Test User'
    });
    
    // Add test income data
    mockStorage.createIncome({
      userId: 1,
      source: 'rental',
      amount: '2000',
      frequency: 'monthly',
      description: 'Rental income from apartment'
    });
    
    mockStorage.createIncome({
      userId: 1,
      source: 'business',
      amount: '5000',
      frequency: 'monthly',
      description: 'Small business revenue'
    });
    
    // Add test valuation
    mockStorage.createValuation({
      userId: 1,
      name: 'Existing Valuation',
      totalAnnualIncome: '84000',
      multiplier: '3.5',
      valuationAmount: '294000',
      notes: 'Test valuation'
    });
  });

  // Test valuation listing endpoint
  test('GET /api/valuation should return all valuations with auth bypass', async () => {
    const response = await request(app)
      .get('/api/valuation')
      .expect(200);
      
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toHaveProperty('name', 'Existing Valuation');
  });

  // Test individual valuation retrieval
  test('GET /api/valuation/:id should return a specific valuation with auth bypass', async () => {
    // First get the valuation ID (assuming ID 1 based on our seed data)
    const valuationId = 1;
    
    const response = await request(app)
      .get(`/api/valuation/${valuationId}`)
      .expect(200);
      
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('id', valuationId);
    expect(response.body.data).toHaveProperty('name', 'Existing Valuation');
    expect(response.body.data).toHaveProperty('totalAnnualIncome', '84000');
  });

  // Test creating a new valuation
  test('POST /api/valuation should create a new valuation with auth bypass', async () => {
    const newValuation = {
      userId: 1,
      name: 'New Test Valuation',
      totalAnnualIncome: '120000',
      multiplier: '4',
      valuationAmount: '480000',
      notes: 'Another test valuation'
    };
    
    const response = await request(app)
      .post('/api/valuation')
      .send(newValuation)
      .expect(201);
      
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('name', 'New Test Valuation');
    expect(response.body.data).toHaveProperty('valuationAmount', '480000');
    
    // Verify the valuation was actually created
    const getResponse = await request(app)
      .get('/api/valuation')
      .expect(200);
      
    expect(getResponse.body.data).toHaveLength(2);
  });

  // Test valuation calculation
  test('POST /api/valuation/calculate should calculate a new valuation with auth bypass', async () => {
    const valuationRequest = {
      name: 'Calculated Valuation',
      multiplier: '3',
      notes: 'Calculation test'
    };
    
    const response = await request(app)
      .post('/api/valuation/calculate')
      .send(valuationRequest)
      .expect(201);
      
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('valuation');
    expect(response.body.data).toHaveProperty('calculationDetails');
    
    const valuation = response.body.data.valuation;
    expect(valuation).toHaveProperty('name', 'Calculated Valuation');
    
    // Should have calculated based on existing incomes (2000 + 5000) * 12 = 84000
    expect(valuation).toHaveProperty('totalAnnualIncome', '84000');
    
    // Valuation amount should be totalAnnualIncome * multiplier
    expect(valuation).toHaveProperty('valuationAmount', '252000');
  });

  // Test updating a valuation
  test('PUT /api/valuation/:id should update a valuation with auth bypass', async () => {
    const valuationId = 1;
    const updateData = {
      name: 'Updated Valuation Name',
      multiplier: '4',
      valuationAmount: '336000' // 84000 * 4
    };
    
    const response = await request(app)
      .put(`/api/valuation/${valuationId}`)
      .send(updateData)
      .expect(200);
      
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('name', 'Updated Valuation Name');
    expect(response.body.data).toHaveProperty('multiplier', '4');
    expect(response.body.data).toHaveProperty('valuationAmount', '336000');
  });

  // Test deleting a valuation
  test('DELETE /api/valuation/:id should delete a valuation with auth bypass', async () => {
    const valuationId = 1;
    
    const response = await request(app)
      .delete(`/api/valuation/${valuationId}`)
      .expect(200);
      
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message', 'Valuation deleted successfully');
    
    // Verify the valuation was actually deleted
    const getResponse = await request(app)
      .get('/api/valuation')
      .expect(200);
      
    expect(getResponse.body.data).toHaveLength(0);
  });
});