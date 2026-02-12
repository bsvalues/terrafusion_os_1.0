import { describe, test, expect, beforeEach, beforeAll, afterAll } from "@jest/globals";
import express, { Express } from "express";
import supertest from "supertest";
import { comparePassword, generateTokens } from "../../server/auth";
import { registerRoutes } from "../../server/routes";
import { MockStorage } from "../mocks/mockstorage";

// Using any types to avoid TypeScript errors during testing
type Any = any;

class TestServer {
  app: Express;
  server: any;
  mockStorage: MockStorage;

  constructor() {
    this.app = express();
    this.mockStorage = new MockStorage();
    
    // Access to internal storage for test setup
    Object.defineProperty(global, "_getMockStorage", {
      get: () => this.mockStorage
    });
  }

  async start() {
    this.app.use(express.json());
    this.server = await registerRoutes(this.app);
  }

  async stop() {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server.close(() => resolve());
      });
    }
  }
}

describe("Valuation API Integration Tests", () => {
  let testServer: TestServer;
  let request: any; // Using any to avoid TypeScript issues with supertest
  let testUser: Any;
  let authToken: string;

  beforeAll(async () => {
    testServer = new TestServer();
    await testServer.start();
    request = supertest(testServer.app);
  });

  afterAll(async () => {
    await testServer.stop();
  });

  beforeEach(async () => {
    // Reset the database before each test
    testServer.mockStorage.reset();
    
    // Create a test user
    // Adjust user data to match expected schema
    const userData: any = {
      username: "testuser",
      email: "test@example.com",
      password: "hashedpassword", // In a real scenario this would be hashed
      fullName: "Test User",
      role: "user"
    };
    testUser = await testServer.mockStorage.createUser(userData);
    
    // Generate auth token for API requests
    const payload = {
      userId: testUser.id,
      username: testUser.username,
      email: testUser.email,
      role: testUser.role
    };
    const tokens = generateTokens(payload);
    authToken = tokens.accessToken;
  });

  test("GET /api/multipliers should return income multipliers", async () => {
    const res = await request.get("/api/multipliers");
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(6); // Should have 6 default multipliers
    
    // Check structure of a multiplier
    const multiplier = res.body[0];
    expect(multiplier).toHaveProperty("id");
    expect(multiplier).toHaveProperty("source");
    expect(multiplier).toHaveProperty("multiplier");
    expect(multiplier).toHaveProperty("description");
  });

  test("POST /api/incomes should create a new income", async () => {
    const income: Any = {
      userId: testUser.id,
      source: "salary",
      amount: 5000,
      frequency: "monthly",
      description: "Test income"
    };
    
    const res = await request
      .post("/api/incomes")
      .send(income)
      .set("Authorization", `Bearer ${authToken}`);
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.source).toBe("salary");
    expect(res.body.amount).toBe(5000);
  });

  test("GET /api/users/:userId/incomes should return user's incomes", async () => {
    // Add test incomes
    const incomes: Any[] = [
      {
        userId: testUser.id,
        source: "salary",
        amount: 5000,
        frequency: "monthly",
        description: "Primary job"
      },
      {
        userId: testUser.id,
        source: "freelance",
        amount: 1000,
        frequency: "monthly",
        description: "Side gigs"
      }
    ];
    
    for (const income of incomes) {
      await testServer.mockStorage.createIncome(income);
    }
    
    const res = await request
      .get(`/api/users/${testUser.id}/incomes`)
      .set("Authorization", `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  test("POST /api/valuations should create a new valuation", async () => {
    // First create some incomes
    const income: Any = {
      userId: testUser.id,
      source: "salary",
      amount: 5000,
      frequency: "monthly",
      description: "Test income"
    };
    await testServer.mockStorage.createIncome(income);
    
    // Now create a valuation
    const valuation: Any = {
      userId: testUser.id,
      name: "Test Valuation",
      valuationAmount: 150000,
      totalAnnualIncome: 60000,
      multiplier: 2.5,
      notes: "Test notes",
      isActive: true
    };
    
    const res = await request
      .post("/api/valuations")
      .send(valuation)
      .set("Authorization", `Bearer ${authToken}`);
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Test Valuation");
    expect(res.body.valuationAmount).toBe("150000");
  });

  test("GET /api/users/:userId/valuations should return user's valuations", async () => {
    // Add test valuations
    const valuations: Any[] = [
      {
        userId: testUser.id,
        name: "Valuation 1",
        valuationAmount: 150000,
        totalAnnualIncome: 60000,
        multiplier: 2.5,
        notes: "First valuation",
        isActive: true
      },
      {
        userId: testUser.id,
        name: "Valuation 2",
        valuationAmount: 200000,
        totalAnnualIncome: 80000,
        multiplier: 2.5,
        notes: "Second valuation",
        isActive: true
      }
    ];
    
    for (const valuation of valuations) {
      await testServer.mockStorage.createValuation(valuation);
    }
    
    const res = await request
      .get(`/api/users/${testUser.id}/valuations`)
      .set("Authorization", `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  test("PUT /api/valuations/:id should update a valuation", async () => {
    // Create a valuation
    const valuation: Any = {
      userId: testUser.id,
      name: "Original Name",
      valuationAmount: 150000,
      totalAnnualIncome: 60000,
      multiplier: 2.5,
      notes: "Original notes",
      isActive: true
    };
    
    const createdValuation = await testServer.mockStorage.createValuation(valuation);
    
    // Update the valuation
    const updateData = {
      name: "Updated Name",
      notes: "Updated notes"
    };
    
    const res = await request
      .put(`/api/valuations/${createdValuation.id}`)
      .send(updateData)
      .set("Authorization", `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Name");
    expect(res.body.notes).toBe("Updated notes");
    
    // Other fields should remain unchanged
    expect(res.body.valuationAmount).toBe("150000");
  });

  test("DELETE /api/valuations/:id should delete a valuation", async () => {
    // Create a valuation
    const valuation: Any = {
      userId: testUser.id,
      name: "Test Valuation",
      valuationAmount: 150000,
      totalAnnualIncome: 60000,
      multiplier: 2.5,
      notes: "Test notes",
      isActive: true
    };
    
    const createdValuation = await testServer.mockStorage.createValuation(valuation);
    
    // Delete the valuation
    const res = await request
      .delete(`/api/valuations/${createdValuation.id}`)
      .set("Authorization", `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Verify it's deleted
    const checkRes = await request
      .get(`/api/valuations/${createdValuation.id}`)
      .set("Authorization", `Bearer ${authToken}`);
    
    expect(checkRes.status).toBe(404);
  });
});