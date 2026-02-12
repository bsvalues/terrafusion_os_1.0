import { describe, test, expect, beforeEach } from "@jest/globals";
import { MockStorage } from "../mocks/mockstorage";
import { Income, InsertIncome, InsertValuation } from "@shared/schema";

describe("Valuation Calculations", () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
    storage.reset();
  });

  test("should calculate valuation correctly for a single income source", async () => {
    // Create a test user
    const user = await storage.createUser({
      username: "testuser",
      email: "test@example.com",
      password: "hashedPassword123",
      fullName: "Test User",
      role: "user"
    });

    // Add a salary income
    const income: InsertIncome = {
      userId: user.id,
      source: "salary",
      amount: 5000,
      frequency: "monthly",
      description: "My main job"
    };
    await storage.createIncome(income);

    // Calculate valuation
    const result = await storage.calculateValuation(user.id);

    // Annual amount should be monthly * 12
    expect(result.totalAnnualIncome).toBe(5000 * 12);
    // Salary multiplier should be 2.5
    expect(result.incomeBreakdown[0].multiplier).toBe(2.5);
    // Valuation should be annual amount * multiplier
    expect(result.totalValuation).toBe(5000 * 12 * 2.5);
  });

  test("should calculate weighted valuation for multiple income sources", async () => {
    // Create a test user
    const user = await storage.createUser({
      username: "multiuser",
      email: "multi@example.com",
      password: "hashedPassword123",
      fullName: "Multi User",
      role: "user"
    });

    // Add multiple income sources
    const incomes: InsertIncome[] = [
      {
        userId: user.id,
        source: "salary",
        amount: 5000,
        frequency: "monthly",
        description: "Full-time job"
      },
      {
        userId: user.id,
        source: "freelance",
        amount: 1000,
        frequency: "monthly",
        description: "Side gigs"
      },
      {
        userId: user.id,
        source: "rental",
        amount: 2000,
        frequency: "monthly",
        description: "Property rental"
      }
    ];

    for (const income of incomes) {
      await storage.createIncome(income);
    }

    // Calculate valuation
    const result = await storage.calculateValuation(user.id);

    // Total annual income
    const totalAnnualIncome = (5000 + 1000 + 2000) * 12;
    expect(result.totalAnnualIncome).toBe(totalAnnualIncome);

    // Weighted multiplier calculation
    // Salary: 60k (weight: 60/96 = 0.625) * 2.5 multiplier = 1.5625
    // Freelance: 12k (weight: 12/96 = 0.125) * 2.0 multiplier = 0.25
    // Rental: 24k (weight: 24/96 = 0.25) * 5.0 multiplier = 1.25
    // Total weighted multiplier = 1.5625 + 0.25 + 1.25 = 3.0625
    
    // Allow for small floating point differences
    expect(result.weightedMultiplier).toBeCloseTo(3.0625, 4);
    
    // Total valuation = 96000 * 3.0625 = 294000
    expect(result.totalValuation).toBeCloseTo(totalAnnualIncome * 3.0625, 0);
  });

  test("should handle different frequency conversions correctly", async () => {
    // Create a test user
    const user = await storage.createUser({
      username: "frequser",
      email: "freq@example.com",
      password: "hashedPassword123",
      fullName: "Frequency User",
      role: "user"
    });

    // Add incomes with different frequencies
    const incomes: InsertIncome[] = [
      {
        userId: user.id,
        source: "salary",
        amount: 1000,
        frequency: "weekly",
        description: "Weekly paycheck"
      },
      {
        userId: user.id,
        source: "investment",
        amount: 3000,
        frequency: "quarterly",
        description: "Dividend payments"
      },
      {
        userId: user.id,
        source: "business",
        amount: 20000,
        frequency: "yearly",
        description: "Annual bonus"
      }
    ];

    for (const income of incomes) {
      await storage.createIncome(income);
    }

    // Calculate valuation
    const result = await storage.calculateValuation(user.id);

    // Annual amount calculations:
    // Weekly: 1000 * 52 = 52000
    // Quarterly: 3000 * 4 = 12000
    // Yearly: 20000 * 1 = 20000
    // Total: 84000
    const expectedAnnualIncome = (1000 * 52) + (3000 * 4) + 20000;
    expect(result.totalAnnualIncome).toBe(expectedAnnualIncome);

    // Individual annual calculations in breakdown should match
    const weeklyIncome = result.incomeBreakdown.find(i => i.source === "salary");
    const quarterlyIncome = result.incomeBreakdown.find(i => i.source === "investment");
    const yearlyIncome = result.incomeBreakdown.find(i => i.source === "business");

    expect(weeklyIncome?.annualAmount).toBe(1000 * 52);
    expect(quarterlyIncome?.annualAmount).toBe(3000 * 4);
    expect(yearlyIncome?.annualAmount).toBe(20000);
  });

  test("should create and retrieve valuation record", async () => {
    // Create a test user
    const user = await storage.createUser({
      username: "saveuser",
      email: "save@example.com",
      password: "hashedPassword123",
      fullName: "Save User",
      role: "user"
    });

    // Add an income
    await storage.createIncome({
      userId: user.id,
      source: "business",
      amount: 10000,
      frequency: "monthly",
      description: "My business"
    });

    // Calculate valuation
    const result = await storage.calculateValuation(user.id);

    // Save the valuation
    const valuationData: InsertValuation = {
      userId: user.id,
      name: "Test Valuation",
      valuationAmount: result.totalValuation,
      totalAnnualIncome: result.totalAnnualIncome,
      multiplier: result.weightedMultiplier,
      notes: "This is a test valuation"
    };
    
    const savedValuation = await storage.createValuation(valuationData);
    
    // Retrieve the valuation
    const retrievedValuation = await storage.getValuationById(savedValuation.id);
    
    // Verify the valuation was saved and retrieved correctly
    expect(retrievedValuation).toBeDefined();
    expect(retrievedValuation?.valuationAmount).toBe(result.totalValuation);
    expect(retrievedValuation?.multiplier).toBe(result.weightedMultiplier);
    expect(retrievedValuation?.totalAnnualIncome).toBe(result.totalAnnualIncome);
    expect(retrievedValuation?.notes).toBe("This is a test valuation");
  });
});