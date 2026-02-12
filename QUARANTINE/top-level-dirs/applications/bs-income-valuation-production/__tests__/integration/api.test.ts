import { Express } from 'express';
import request from 'supertest';
import { hashPassword } from '../../server/auth';
import { MockStorage } from '../mocks/mockstorage';
import { registerRoutes } from '../../server/routes';

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

// Import express app after mocking dependencies
import express from 'express';

describe('API Integration Tests', () => {
  let app: Express;
  let server: any;
  let mockStorage: MockStorage;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Get reference to mock storage
    mockStorage = (jest.requireMock('../../server/storage') as any)._getMockStorage;
    
    // Register routes
    server = await registerRoutes(app);
  });

  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  beforeEach(() => {
    mockStorage.reset();
  });

  describe('User API', () => {
    it('should create a new user', async () => {
      const userData = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        role: 'user',
        fullName: 'Test User'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe('testuser');
      expect(response.body.email).toBe('test@example.com');
      expect(response.body).not.toHaveProperty('password'); // Password should not be returned
    });

    it('should get a user by id', async () => {
      // Create a user first
      const hashedPassword = await hashPassword('password123');
      const user = await mockStorage.createUser({
        username: 'getuser',
        password: hashedPassword,
        email: 'get@example.com',
        role: 'user'
      });

      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', user.id);
      expect(response.body.username).toBe('getuser');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/999')
        .expect(404);
    });
  });

  describe('Income API', () => {
    let userId: number;

    beforeEach(async () => {
      const hashedPassword = await hashPassword('password123');
      const user = await mockStorage.createUser({
        username: 'incomeuser',
        password: hashedPassword,
        email: 'income@example.com',
        role: 'user'
      });
      userId = user.id;
    });

    it('should create a new income', async () => {
      const incomeData = {
        userId,
        source: 'salary',
        amount: 5000,
        frequency: 'monthly',
        description: 'Monthly salary'
      };

      const response = await request(app)
        .post('/api/incomes')
        .send(incomeData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(5000);
      expect(response.body.source).toBe('salary');
    });

    it('should get incomes for a user', async () => {
      // Create a couple of incomes first
      await mockStorage.createIncome({
        userId,
        source: 'salary',
        amount: 5000,
        frequency: 'monthly',
        description: 'Monthly salary'
      });

      await mockStorage.createIncome({
        userId,
        source: 'freelance',
        amount: 2000,
        frequency: 'monthly',
        description: 'Freelance work'
      });

      const response = await request(app)
        .get(`/api/users/${userId}/incomes`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].source).toBe('freelance'); // Most recent first
      expect(response.body[1].source).toBe('salary');
    });

    it('should update an income', async () => {
      // Create an income first
      const income = await mockStorage.createIncome({
        userId,
        source: 'salary',
        amount: 5000,
        frequency: 'monthly',
        description: 'Monthly salary'
      });

      const updatedData = {
        amount: 6000,
        description: 'Increased salary'
      };

      const response = await request(app)
        .put(`/api/incomes/${income.id}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty('id', income.id);
      expect(response.body.amount).toBe(6000);
      expect(response.body.description).toBe('Increased salary');
      expect(response.body.source).toBe('salary'); // Unchanged field
    });

    it('should delete an income', async () => {
      // Create an income first
      const income = await mockStorage.createIncome({
        userId,
        source: 'salary',
        amount: 5000,
        frequency: 'monthly',
        description: 'Monthly salary'
      });

      await request(app)
        .delete(`/api/incomes/${income.id}`)
        .expect(200);

      // Verify it's deleted
      const retrieved = await mockStorage.getIncomeById(income.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Valuation API', () => {
    let userId: number;

    beforeEach(async () => {
      const hashedPassword = await hashPassword('password123');
      const user = await mockStorage.createUser({
        username: 'valuationuser',
        password: hashedPassword,
        email: 'valuation@example.com',
        role: 'user'
      });
      userId = user.id;
    });

    it('should create a new valuation', async () => {
      const valuationData = {
        userId,
        name: 'Business Valuation',
        businessType: 'tech',
        annualRevenue: 1000000,
        annualProfit: 200000,
        multiplier: 3.5,
        valuationAmount: 700000,
        notes: 'Initial valuation'
      };

      const response = await request(app)
        .post('/api/valuations')
        .send(valuationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Business Valuation');
      expect(response.body.valuationAmount).toBe(700000);
    });

    it('should get valuations for a user', async () => {
      // Create a couple of valuations first
      await mockStorage.createValuation({
        userId,
        name: 'Business Valuation 1',
        businessType: 'tech',
        annualRevenue: 1000000,
        annualProfit: 200000,
        multiplier: 3.5,
        valuationAmount: 700000,
        notes: 'Tech valuation'
      });

      await mockStorage.createValuation({
        userId,
        name: 'Business Valuation 2',
        businessType: 'retail',
        annualRevenue: 500000,
        annualProfit: 100000,
        multiplier: 2.0,
        valuationAmount: 200000,
        notes: 'Retail valuation'
      });

      const response = await request(app)
        .get(`/api/users/${userId}/valuations`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].name).toBe('Business Valuation 2'); // Most recent first
      expect(response.body[1].name).toBe('Business Valuation 1');
    });

    it('should update a valuation', async () => {
      // Create a valuation first
      const valuation = await mockStorage.createValuation({
        userId,
        name: 'Business Valuation',
        businessType: 'tech',
        annualRevenue: 1000000,
        annualProfit: 200000,
        multiplier: 3.5,
        valuationAmount: 700000,
        notes: 'Initial valuation'
      });

      const updatedData = {
        multiplier: 4.0,
        valuationAmount: 800000,
        notes: 'Updated valuation with higher multiplier'
      };

      const response = await request(app)
        .put(`/api/valuations/${valuation.id}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty('id', valuation.id);
      expect(response.body.multiplier).toBe(4.0);
      expect(response.body.valuationAmount).toBe(800000);
      expect(response.body.name).toBe('Business Valuation'); // Unchanged field
    });

    it('should delete a valuation', async () => {
      // Create a valuation first
      const valuation = await mockStorage.createValuation({
        userId,
        name: 'Business Valuation',
        businessType: 'tech',
        annualRevenue: 1000000,
        annualProfit: 200000,
        multiplier: 3.5,
        valuationAmount: 700000,
        notes: 'Initial valuation'
      });

      await request(app)
        .delete(`/api/valuations/${valuation.id}`)
        .expect(200);

      // Verify it's deleted
      const retrieved = await mockStorage.getValuationById(valuation.id);
      expect(retrieved).toBeUndefined();
    });
  });
});