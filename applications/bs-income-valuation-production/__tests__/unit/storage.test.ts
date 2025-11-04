import { MockStorage } from '../mocks/mockstorage';
import { hashPassword } from '../../server/auth';

describe('Storage', () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
    storage.reset();
  });

  describe('User operations', () => {
    it('should create a user and retrieve it by id', async () => {
      const hashedPassword = await hashPassword('password123');
      const userData = {
        username: 'testuser',
        password: hashedPassword,
        email: 'test@example.com',
        role: 'user',
        fullName: 'Test User'
      };

      const createdUser = await storage.createUser(userData);
      expect(createdUser).toHaveProperty('id');
      expect(createdUser.username).toBe('testuser');

      const retrievedUser = await storage.getUser(createdUser.id);
      expect(retrievedUser).toEqual(createdUser);
    });

    it('should retrieve a user by username', async () => {
      const hashedPassword = await hashPassword('password123');
      const userData = {
        username: 'uniqueuser',
        password: hashedPassword,
        email: 'unique@example.com',
        role: 'user'
      };

      const createdUser = await storage.createUser(userData);
      const retrievedUser = await storage.getUserByUsername('uniqueuser');
      expect(retrievedUser).toEqual(createdUser);
    });

    it('should return undefined for nonexistent user', async () => {
      const retrievedUser = await storage.getUser(999);
      expect(retrievedUser).toBeUndefined();
    });
  });

  describe('Income operations', () => {
    let userId: number;

    beforeEach(async () => {
      const hashedPassword = await hashPassword('password123');
      const userData = {
        username: 'incomeuser',
        password: hashedPassword,
        email: 'income@example.com',
        role: 'user'
      };
      const user = await storage.createUser(userData);
      userId = user.id;
    });

    it('should create an income and retrieve it by id', async () => {
      const incomeData = {
        userId,
        source: 'salary',
        amount: 5000,
        frequency: 'monthly',
        description: 'Monthly salary'
      };

      const createdIncome = await storage.createIncome(incomeData);
      expect(createdIncome).toHaveProperty('id');
      expect(createdIncome.amount).toBe(5000);

      const retrievedIncome = await storage.getIncomeById(createdIncome.id);
      expect(retrievedIncome).toEqual(createdIncome);
    });

    it('should retrieve all incomes for a user', async () => {
      const incomeData1 = {
        userId,
        source: 'salary',
        amount: 5000,
        frequency: 'monthly',
        description: 'Monthly salary'
      };

      const incomeData2 = {
        userId,
        source: 'freelance',
        amount: 2000,
        frequency: 'monthly',
        description: 'Freelance work'
      };

      await storage.createIncome(incomeData1);
      await storage.createIncome(incomeData2);

      const incomes = await storage.getIncomesByUserId(userId);
      expect(incomes.length).toBe(2);
      expect(incomes[0].source).toBe('freelance'); // Most recent should be first
      expect(incomes[1].source).toBe('salary');
    });

    it('should update an income', async () => {
      const incomeData = {
        userId,
        source: 'salary',
        amount: 5000,
        frequency: 'monthly',
        description: 'Monthly salary'
      };

      const createdIncome = await storage.createIncome(incomeData);
      const updatedIncome = await storage.updateIncome(createdIncome.id, { 
        amount: 6000, 
        description: 'Increased salary' 
      });

      expect(updatedIncome).toHaveProperty('id', createdIncome.id);
      expect(updatedIncome?.amount).toBe(6000);
      expect(updatedIncome?.description).toBe('Increased salary');
    });

    it('should delete an income', async () => {
      const incomeData = {
        userId,
        source: 'salary',
        amount: 5000,
        frequency: 'monthly',
        description: 'Monthly salary'
      };

      const createdIncome = await storage.createIncome(incomeData);
      const deleteResult = await storage.deleteIncome(createdIncome.id);
      expect(deleteResult).toBe(true);

      const retrievedIncome = await storage.getIncomeById(createdIncome.id);
      expect(retrievedIncome).toBeUndefined();
    });
  });

  describe('Valuation operations', () => {
    let userId: number;

    beforeEach(async () => {
      const hashedPassword = await hashPassword('password123');
      const userData = {
        username: 'valuationuser',
        password: hashedPassword,
        email: 'valuation@example.com',
        role: 'user'
      };
      const user = await storage.createUser(userData);
      userId = user.id;
    });

    it('should create a valuation and retrieve it by id', async () => {
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

      const createdValuation = await storage.createValuation(valuationData);
      expect(createdValuation).toHaveProperty('id');
      expect(createdValuation.valuationAmount).toBe(700000);

      const retrievedValuation = await storage.getValuationById(createdValuation.id);
      expect(retrievedValuation).toEqual(createdValuation);
    });

    it('should retrieve all valuations for a user', async () => {
      const valuationData1 = {
        userId,
        name: 'Business Valuation 1',
        businessType: 'tech',
        annualRevenue: 1000000,
        annualProfit: 200000,
        multiplier: 3.5,
        valuationAmount: 700000,
        notes: 'Tech valuation'
      };

      const valuationData2 = {
        userId,
        name: 'Business Valuation 2',
        businessType: 'retail',
        annualRevenue: 500000,
        annualProfit: 100000,
        multiplier: 2.0,
        valuationAmount: 200000,
        notes: 'Retail valuation'
      };

      await storage.createValuation(valuationData1);
      await storage.createValuation(valuationData2);

      const valuations = await storage.getValuationsByUserId(userId);
      expect(valuations.length).toBe(2);
      expect(valuations[0].name).toBe('Business Valuation 2'); // Most recent first
      expect(valuations[1].name).toBe('Business Valuation 1');
    });

    it('should update a valuation', async () => {
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

      const createdValuation = await storage.createValuation(valuationData);
      const updatedValuation = await storage.updateValuation(createdValuation.id, { 
        multiplier: 4.0, 
        valuationAmount: 800000,
        notes: 'Updated valuation with higher multiplier' 
      });

      expect(updatedValuation).toHaveProperty('id', createdValuation.id);
      expect(updatedValuation?.multiplier).toBe(4.0);
      expect(updatedValuation?.valuationAmount).toBe(800000);
    });

    it('should delete a valuation', async () => {
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

      const createdValuation = await storage.createValuation(valuationData);
      const deleteResult = await storage.deleteValuation(createdValuation.id);
      expect(deleteResult).toBe(true);

      const retrievedValuation = await storage.getValuationById(createdValuation.id);
      expect(retrievedValuation).toBeUndefined();
    });
  });
});