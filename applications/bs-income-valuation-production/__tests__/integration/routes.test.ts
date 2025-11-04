import express, { Express } from 'express';
import request from 'supertest';
import { describe, test, expect, beforeAll, afterAll, jest, beforeEach } from '@jest/globals';
import { MockStorage } from '../mocks/mockstorage';
import { registerRoutes } from '../../server/routes';
import { InsertUser, Income, Valuation } from '@shared/schema';

// Mock the storage in routes.ts
jest.mock('../../server/storage', () => {
  // Create a getter to ensure we get a fresh mock for each test
  const mockStorage = new MockStorage();
  
  return {
    get storage() {
      return mockStorage;
    }
  };
});

describe('API Routes', () => {
  let app: Express;
  let server: any;
  let mockStorage: MockStorage;
  
  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    server = await registerRoutes(app);
    mockStorage = (jest.requireMock('../../server/storage') as any).storage;
  });
  
  afterAll(() => {
    if (server && server.close) {
      server.close();
    }
  });
  
  beforeEach(() => {
    mockStorage.reset();
  });
  
  test('GET /health should return 200 status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
  
  describe('User Routes', () => {
    let testUser: any;
    
    beforeEach(async () => {
      const userData: InsertUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'user'
      };
      
      testUser = await mockStorage.createUser(userData);
    });
    
    test('GET /users/:id should return a user', async () => {
      const response = await request(app).get(`/api/users/${testUser.id}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testUser.id);
      expect(response.body.username).toBe(testUser.username);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.password).toBeUndefined(); // Password should not be returned
    });
    
    test('POST /users should create a new user', async () => {
      const newUser = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'newpass123',
        fullName: 'New User',
        role: 'user'
      };
      
      const response = await request(app)
        .post('/api/users')
        .send(newUser);
      
      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.username).toBe(newUser.username);
      expect(response.body.email).toBe(newUser.email);
      expect(response.body.password).toBeUndefined(); // Password should not be returned
    });
  });
  
  describe('Income Routes', () => {
    let testUser: any;
    
    beforeEach(async () => {
      const userData: InsertUser = {
        username: 'testincome',
        email: 'income@example.com',
        password: 'password123',
        fullName: 'Income User',
        role: 'user'
      };
      
      testUser = await mockStorage.createUser(userData);
    });
    
    test('GET /users/:userId/incomes should return user incomes', async () => {
      // Create test incomes
      await mockStorage.createIncome({
        userId: testUser.id,
        source: 'salary',
        amount: 5000,
        frequency: 'monthly',
        description: 'My job'
      });
      
      await mockStorage.createIncome({
        userId: testUser.id,
        source: 'rental',
        amount: 1500,
        frequency: 'monthly',
        description: 'Property rental'
      });
      
      const response = await request(app).get(`/api/users/${testUser.id}/incomes`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      
      // Verify income data
      expect(response.body[0].userId).toBe(testUser.id);
      expect(response.body[0].source).toBeTruthy();
      expect(response.body[0].amount).toBeDefined();
      expect(response.body[1].userId).toBe(testUser.id);
    });
    
    test('POST /incomes should create a new income', async () => {
      const newIncome = {
        userId: testUser.id,
        source: 'business',
        amount: 8000,
        frequency: 'monthly',
        description: 'My business'
      };
      
      const response = await request(app)
        .post('/api/incomes')
        .send(newIncome);
      
      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.source).toBe(newIncome.source);
      expect(response.body.amount).toBe(newIncome.amount);
      expect(response.body.frequency).toBe(newIncome.frequency);
      
      // Verify it was actually added to storage
      const incomes = await mockStorage.getIncomesByUserId(testUser.id);
      expect(incomes.length).toBe(1);
      expect(incomes[0].source).toBe(newIncome.source);
    });
  });
  
  describe('Valuation Routes', () => {
    let testUser: any;
    let testIncome: Income;
    
    beforeEach(async () => {
      const userData: InsertUser = {
        username: 'testvaluation',
        email: 'valuation@example.com',
        password: 'password123',
        fullName: 'Valuation User',
        role: 'user'
      };
      
      testUser = await mockStorage.createUser(userData);
      
      // Create test income
      testIncome = await mockStorage.createIncome({
        userId: testUser.id,
        source: 'salary',
        amount: 5000,
        frequency: 'monthly',
        description: 'My job'
      });
    });
    
    test('POST /valuations should create a new valuation', async () => {
      // First, calculate valuation
      const valuationData = await mockStorage.calculateValuation(testUser.id);
      
      const newValuation = {
        userId: testUser.id,
        name: 'My Valuation',
        valuationAmount: valuationData.totalValuation,
        totalAnnualIncome: valuationData.totalAnnualIncome,
        multiplier: valuationData.weightedMultiplier,
        notes: 'Test notes'
      };
      
      const response = await request(app)
        .post('/api/valuations')
        .send(newValuation);
      
      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.valuationAmount).toBe(newValuation.valuationAmount);
      expect(response.body.multiplier).toBe(newValuation.multiplier);
      
      // Verify it was actually added to storage
      const valuations = await mockStorage.getValuationsByUserId(testUser.id);
      expect(valuations.length).toBe(1);
      expect(valuations[0].valuationAmount).toBe(newValuation.valuationAmount);
    });
    
    test('GET /users/:userId/valuations should return user valuations', async () => {
      // Create test valuation
      const valuationData = await mockStorage.calculateValuation(testUser.id);
      
      await mockStorage.createValuation({
        userId: testUser.id,
        name: 'First Valuation',
        valuationAmount: valuationData.totalValuation,
        totalAnnualIncome: valuationData.totalAnnualIncome,
        multiplier: valuationData.weightedMultiplier,
        notes: 'First valuation notes'
      });
      
      await mockStorage.createValuation({
        userId: testUser.id,
        name: 'Second Valuation',
        valuationAmount: valuationData.totalValuation * 1.1, // 10% growth
        totalAnnualIncome: valuationData.totalAnnualIncome * 1.05, // 5% income growth
        multiplier: valuationData.weightedMultiplier,
        notes: 'Second valuation notes'
      });
      
      const response = await request(app).get(`/api/users/${testUser.id}/valuations`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      
      // Verify valuation data
      expect(response.body[0].userId).toBe(testUser.id);
      expect(response.body[0].valuationAmount).toBeDefined();
      expect(response.body[0].totalAnnualIncome).toBeDefined();
      expect(response.body[1].userId).toBe(testUser.id);
      expect(response.body[1].name).toBe('Second Valuation');
    });
  });
});