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

describe('Protected API Routes with Auth Bypass', () => {
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

  test('GET /api/valuation should return user valuations with auth bypass', async () => {
    // Setup valuation data in mock storage
    await mockStorage.createValuation({
      userId: 1,
      name: 'Test Valuation',
      totalAnnualIncome: '60000',
      multiplier: '3',
      valuationAmount: '180000',
      notes: 'Test notes'
    });
    
    // Test valuation endpoint without sending authorization header
    const response = await request(app)
      .get('/api/valuation')
      .expect(200);
      
    // Verify the response contains expected data
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toHaveProperty('name', 'Test Valuation');
    expect(response.body.data[0]).toHaveProperty('valuationAmount', '180000');
  });

  test('POST /api/valuation/calculate should calculate a new valuation with auth bypass', async () => {
    // Setup income data in mock storage
    await mockStorage.createIncome({
      userId: 1,
      source: 'salary',
      amount: '5000',
      frequency: 'monthly',
      description: 'Regular salary'
    });
    
    // Test valuation calculation endpoint without sending authorization header
    const response = await request(app)
      .post('/api/valuation/calculate')
      .send({ name: 'New Calculated Valuation', notes: 'Test calculation' })
      .expect(201);
      
    // Verify the response contains expected data
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('valuation');
    expect(response.body.data).toHaveProperty('calculationDetails');
    expect(response.body.data.valuation).toHaveProperty('name', 'New Calculated Valuation');
  });

  test('POST /api/valuation/income should create a new income with auth bypass', async () => {
    // Test income creation endpoint without sending authorization header
    const response = await request(app)
      .post('/api/valuation/income')
      .send({
        source: 'business',
        amount: '7500',
        frequency: 'monthly',
        description: 'Business revenue'
      })
      .expect(201);
      
    // Verify the response contains expected data
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('source', 'business');
    expect(response.body.data).toHaveProperty('amount', '7500');
    expect(response.body.data).toHaveProperty('userId', 1); // Should be the mock user's ID
  });

  test('GET /api/agents/analyze-income should analyze income with auth bypass', async () => {
    // Setup income data in mock storage
    await mockStorage.createIncome({
      userId: 1,
      source: 'salary',
      amount: '5000',
      frequency: 'monthly',
      description: 'Regular salary'
    });
    
    // Test agent income analysis endpoint without sending authorization header
    const response = await request(app)
      .get('/api/agents/analyze-income')
      .expect(200);
      
    // Verify the response contains expected data structure
    expect(response.body).toHaveProperty('analysis');
    expect(response.body).toHaveProperty('suggestedValuation');
    expect(response.body.analysis).toHaveProperty('findings');
    expect(response.body.analysis).toHaveProperty('metrics');
  });

  test('POST /api/agents/generate-report should generate report with auth bypass', async () => {
    // Setup income and valuation data in mock storage
    await mockStorage.createIncome({
      userId: 1,
      source: 'salary',
      amount: '5000',
      frequency: 'monthly',
      description: 'Regular salary'
    });
    
    await mockStorage.createValuation({
      userId: 1,
      name: 'Test Valuation',
      totalAnnualIncome: '60000',
      multiplier: '3',
      valuationAmount: '180000',
      notes: 'Test notes'
    });
    
    // Test report generation endpoint without sending authorization header
    const response = await request(app)
      .post('/api/agents/generate-report')
      .send({
        period: 'monthly',
        includeCharts: true,
        includeInsights: true,
        includeRecommendations: true
      })
      .expect(200);
      
    // Verify the response contains expected data
    expect(response.body).toHaveProperty('summary');
    expect(response.body).toHaveProperty('metrics');
    expect(response.body).toHaveProperty('dateGenerated');
  });
});