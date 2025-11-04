import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Server } from 'http';
import { db } from '../../server/db';
import { registerRoutes } from '../../server/routes';
import { valuations, incomes, users } from '@shared/schema';
import { insertValuationSchema } from '@shared/schema';
import { cleanupDatabase } from '../helpers/db-helpers';
import { createTestUser, createTestIncome, createTestValuation } from '../helpers/test-data-helpers';
import { generateTokens } from '../../server/auth';

let app: express.Application;
let httpServer: Server;
let testUserId: number;
let authToken: string;

// Helper function to create test valuations
async function createTestValuations(userId: number, count: number = 2) {
  const valuations = [];
  for (let i = 1; i <= count; i++) {
    const valuation = await createTestValuation(
      userId,
      `Test Valuation ${i}`,
      (50000 * i).toFixed(2),
      (3 + i * 0.5).toFixed(2),
      (50000 * i * (3 + i * 0.5)).toFixed(2),
      JSON.stringify({ rental: 30000 * i, business: 20000 * i })
    );
    valuations.push(valuation);
  }
  return valuations;
}

beforeAll(async () => {
  // Setup express app
  app = express();
  app.use(express.json());
  
  // Register routes and start server
  httpServer = await registerRoutes(app);
  
  // Create a test user
  const user = await createTestUser('testvaluation', 'testvaluation@example.com', 'password123');
  testUserId = user.id;
  
  // Generate auth token
  const { accessToken } = generateTokens({
    userId: testUserId,
    username: user.username,
    email: user.email,
    role: 'user'
  });
  authToken = accessToken;
});

afterAll(async () => {
  // Close HTTP server
  await new Promise<void>((resolve) => {
    httpServer.close(() => {
      resolve();
    });
  });
  
  // Clean up database
  await cleanupDatabase();
});

describe('Valuation API', () => {
  let agent: request.SuperTest<request.Test>;
  
  beforeEach(async () => {
    // Clean valuations table
    await db.delete(valuations);
    
    // Set up supertest agent
    agent = request(app);
  });
  
  it('should get all valuations for a user', async () => {
    // Create test valuations
    const testValuations = await createTestValuations(testUserId, 3);
    
    // Request valuations
    const response = await agent
      .get(`/api/users/${testUserId}/valuations`)
      .set('Authorization', `Bearer ${authToken}`);
    
    // Check response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(3);
    expect(response.body.data[0].userId).toBe(testUserId);
  });
  
  it('should get a specific valuation by ID', async () => {
    // Create a test valuation
    const testValuation = await createTestValuation(
      testUserId,
      'Specific Valuation',
      '100000.00',
      '4.5',
      '450000.00'
    );
    
    // Request the valuation
    const response = await agent
      .get(`/api/valuations/${testValuation.id}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    // Check response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(testValuation.id);
    expect(response.body.data.name).toBe('Specific Valuation');
    expect(response.body.data.totalAnnualIncome).toBe('100000.00');
    expect(response.body.data.multiplier).toBe('4.5');
    expect(response.body.data.valuationAmount).toBe('450000.00');
  });
  
  it('should create a new valuation', async () => {
    // Prepare valuation data
    const valuationData = {
      userId: testUserId,
      name: 'New Test Valuation',
      totalAnnualIncome: '80000.00',
      multiplier: '3.5',
      valuationAmount: '280000.00',
      incomeBreakdown: JSON.stringify({ rental: 50000, business: 30000 }),
      notes: 'Test notes'
    };
    
    // Create valuation
    const response = await agent
      .post('/api/valuations')
      .set('Authorization', `Bearer ${authToken}`)
      .send(valuationData);
    
    // Check response
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.name).toBe('New Test Valuation');
    expect(response.body.data.totalAnnualIncome).toBe('80000.00');
    expect(response.body.data.multiplier).toBe('3.5');
    expect(response.body.data.valuationAmount).toBe('280000.00');
    expect(response.body.data.userId).toBe(testUserId);
    expect(response.body.data.isActive).toBe(true);
  });
  
  it('should update an existing valuation', async () => {
    // Create a test valuation
    const testValuation = await createTestValuation(
      testUserId,
      'Valuation To Update',
      '75000.00',
      '3.8',
      '285000.00'
    );
    
    // Update data
    const updateData = {
      name: 'Updated Valuation',
      multiplier: '4.2',
      valuationAmount: '315000.00',
      notes: 'Updated notes'
    };
    
    // Update valuation
    const response = await agent
      .put(`/api/valuations/${testValuation.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData);
    
    // Check response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Updated Valuation');
    expect(response.body.data.multiplier).toBe('4.2');
    expect(response.body.data.valuationAmount).toBe('315000.00');
    expect(response.body.data.notes).toBe('Updated notes');
    
    // Verify in database
    const updated = await db
      .select()
      .from(valuations)
      .where({ id: testValuation.id })
      .execute();
    
    expect(updated[0].name).toBe('Updated Valuation');
  });
  
  it('should soft delete a valuation (set isActive to false)', async () => {
    // Create a test valuation
    const testValuation = await createTestValuation(
      testUserId,
      'Valuation To Delete',
      '60000.00',
      '3.0',
      '180000.00'
    );
    
    // Delete valuation
    const response = await agent
      .delete(`/api/valuations/${testValuation.id}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    // Check response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Valuation successfully deleted');
    
    // Verify in database (should still exist but with isActive=false)
    const deleted = await db
      .select()
      .from(valuations)
      .where({ id: testValuation.id })
      .execute();
    
    expect(deleted).toHaveLength(1);
    expect(deleted[0].isActive).toBe(false);
  });
  
  it('should compare two valuations', async () => {
    // Create two test valuations
    const valuationsArray = await createTestValuations(testUserId, 2);
    const firstValuation = valuationsArray[0];
    const secondValuation = valuationsArray[1];
    
    // Request comparison
    const response = await agent
      .get(`/api/valuations/compare?ids=${firstValuation.id},${secondValuation.id}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    // Check response
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.valuations).toHaveLength(2);
    expect(response.body.data.comparison).toBeDefined();
    expect(response.body.data.comparison.incomeDifference).toBeDefined();
    expect(response.body.data.comparison.multiplierDifference).toBeDefined();
    expect(response.body.data.comparison.valuationDifference).toBeDefined();
    expect(response.body.data.comparison.percentageChange).toBeDefined();
  });
});