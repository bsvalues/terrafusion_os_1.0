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

describe('Dashboard API Integration Tests with Auth Bypass', () => {
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
    
    // Seed with a test user
    mockStorage.createUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      fullName: 'Test User'
    });
  });

  test('GET /api/dashboard should return dashboard data with auth bypass', async () => {
    // Setup income data in mock storage
    await mockStorage.createIncome({
      userId: 1,
      source: 'salary',
      amount: '5000',
      frequency: 'monthly',
      description: 'Regular salary'
    });
    
    // Setup valuation data in mock storage
    await mockStorage.createValuation({
      userId: 1,
      name: 'Test Valuation',
      totalAnnualIncome: '60000',
      multiplier: '3',
      valuationAmount: '180000',
      notes: 'Test notes'
    });
    
    // Test dashboard endpoint without sending authorization header
    const response = await request(app)
      .get('/api/dashboard')
      .expect(200);
      
    // Verify the response contains expected data
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('totalMonthlyIncome');
    expect(response.body.data).toHaveProperty('totalAnnualIncome');
    expect(response.body.data).toHaveProperty('incomeCount', 1);
    expect(response.body.data).toHaveProperty('valuationCount', 1);
  });

  test('GET /api/dashboard/detailed should return detailed data with auth bypass', async () => {
    // Setup income data in mock storage
    await mockStorage.createIncome({
      userId: 1,
      source: 'salary',
      amount: '5000',
      frequency: 'monthly',
      description: 'Regular salary'
    });
    
    // Test detailed dashboard endpoint without sending authorization header
    const response = await request(app)
      .get('/api/dashboard/detailed')
      .expect(200);
      
    // Verify the response contains expected data
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('incomes');
    expect(response.body.data).toHaveProperty('valuations');
    expect(response.body.data).toHaveProperty('multipliers');
    expect(response.body.data.incomes).toHaveLength(1);
  });

  test('GET /api/users/:userId/incomes should return user incomes with auth bypass', async () => {
    // Setup income data in mock storage
    await mockStorage.createIncome({
      userId: 1,
      source: 'salary',
      amount: '5000',
      frequency: 'monthly',
      description: 'Regular salary'
    });
    
    // Test user incomes endpoint without sending authorization header
    const response = await request(app)
      .get('/api/users/1/incomes')
      .expect(200);
      
    // Verify the response contains expected data
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toHaveProperty('source', 'salary');
    expect(response.body[0]).toHaveProperty('amount', '5000');
  });
});