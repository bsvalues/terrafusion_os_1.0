import { describe, test, expect } from "@jest/globals";
import {
  incomeMultipliers,
  users,
  authTokens,
  incomes,
  valuations,
  insertUserSchema,
  loginSchema,
  registerSchema,
  insertIncomeSchema,
  insertValuationSchema,
  insertIncomeMultiplierSchema,
  incomeSourceEnum
} from "../../shared/schema";
import { z } from "zod";

describe("Database Schema", () => {
  test("incomeSourceEnum contains the expected values", () => {
    expect(incomeSourceEnum.enumValues).toEqual([
      "salary",
      "business",
      "freelance",
      "investment",
      "rental",
      "other"
    ]);
  });

  test("users table has the required columns", () => {
    const requiredColumns = ["id", "username", "email", "password", "role", "createdAt", "updatedAt"];
    const columnNames = Object.keys(users);
    
    requiredColumns.forEach(column => {
      expect(columnNames).toContain(column);
    });
  });

  test("incomes table has the required columns", () => {
    const requiredColumns = ["id", "userId", "source", "amount", "frequency", "description", "createdAt", "updatedAt"];
    const columnNames = Object.keys(incomes);
    
    requiredColumns.forEach(column => {
      expect(columnNames).toContain(column);
    });
  });

  test("valuations table has the required columns", () => {
    const requiredColumns = [
      "id", 
      "userId", 
      "name", 
      "valuationAmount", 
      "totalAnnualIncome", 
      "multiplier", 
      "notes", 
      "isActive",
      "createdAt",
      "updatedAt"
    ];
    const columnNames = Object.keys(valuations);
    
    requiredColumns.forEach(column => {
      expect(columnNames).toContain(column);
    });
  });

  test("incomeMultipliers table has the required columns", () => {
    const requiredColumns = ["id", "source", "multiplier", "description", "createdAt", "updatedAt"];
    const columnNames = Object.keys(incomeMultipliers);
    
    requiredColumns.forEach(column => {
      expect(columnNames).toContain(column);
    });
  });

  test("insertUserSchema validates correctly", () => {
    // Valid data should pass
    const validUser = {
      username: "testuser",
      email: "test@example.com",
      password: "securePassword123",
      fullName: "Test User",
      role: "user"
    };
    
    expect(() => insertUserSchema.parse(validUser)).not.toThrow();
    
    // Invalid email should fail
    const invalidEmail = { ...validUser, email: "invalid-email" };
    expect(() => insertUserSchema.parse(invalidEmail)).toThrow();
    
    // Missing required field should fail
    const missingUsername = { 
      email: "test@example.com",
      password: "securePassword123",
      role: "user"
    };
    expect(() => insertUserSchema.parse(missingUsername)).toThrow();
  });

  test("loginSchema validates correctly", () => {
    // Valid login should pass
    const validLogin = {
      username: "testuser",
      password: "securePassword123"
    };
    
    expect(() => loginSchema.parse(validLogin)).not.toThrow();
    
    // Missing password should fail
    const missingPassword = { username: "testuser" };
    expect(() => loginSchema.parse(missingPassword)).toThrow();
  });

  test("insertIncomeSchema validates correctly", () => {
    // Valid income should pass
    const validIncome = {
      userId: 1,
      source: "salary",
      amount: 5000,
      frequency: "monthly",
      description: "My main job"
    };
    
    expect(() => insertIncomeSchema.parse(validIncome)).not.toThrow();
    
    // Invalid source should fail
    const invalidSource = { ...validIncome, source: "invalid-source" };
    expect(() => insertIncomeSchema.parse(invalidSource)).toThrow();
    
    // Missing required field should fail
    const missingAmount = {
      userId: 1,
      source: "salary",
      frequency: "monthly"
    };
    expect(() => insertIncomeSchema.parse(missingAmount)).toThrow();
  });

  test("insertValuationSchema validates correctly", () => {
    // Valid valuation should pass
    const validValuation = {
      userId: 1,
      name: "My Valuation",
      valuationAmount: 250000,
      totalAnnualIncome: 100000,
      multiplier: 2.5,
      notes: "Test notes",
      isActive: true
    };
    
    expect(() => insertValuationSchema.parse(validValuation)).not.toThrow();
    
    // Missing required field should fail
    const missingAmount = {
      userId: 1,
      name: "My Valuation",
      totalAnnualIncome: 100000,
      multiplier: 2.5
    };
    expect(() => insertValuationSchema.parse(missingAmount)).toThrow();
  });

  test("insertIncomeMultiplierSchema validates correctly", () => {
    // Valid multiplier should pass
    const validMultiplier = {
      source: "salary",
      multiplier: "2.5",
      description: "Standard employment income"
    };
    
    expect(() => insertIncomeMultiplierSchema.parse(validMultiplier)).not.toThrow();
    
    // Invalid source should fail
    const invalidSource = { ...validMultiplier, source: "invalid-source" };
    expect(() => insertIncomeMultiplierSchema.parse(invalidSource)).toThrow();
  });
});