import { db } from '../../server/db';
import { users, incomes, valuations } from '@shared/schema';
import { hashPassword } from '../../server/auth';

/**
 * Create a test user for testing purposes
 */
export const createTestUser = async (username: string, email: string, password: string) => {
  const hashedPassword = await hashPassword(password);
  
  const [user] = await db
    .insert(users)
    .values({
      username,
      email,
      password: hashedPassword,
      fullName: `Test ${username}`,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
    })
    .returning();
  
  return user;
};

/**
 * Create a test income record for testing purposes
 */
export const createTestIncome = async (
  userId: number,
  source: string,
  amount: string,
  frequency: string,
  description: string = 'Test income'
) => {
  const [income] = await db
    .insert(incomes)
    .values({
      userId,
      source,
      amount,
      frequency,
      description,
      createdAt: new Date(),
    })
    .returning();
  
  return income;
};

/**
 * Create a test valuation record for testing purposes
 */
export const createTestValuation = async (
  userId: number,
  name: string,
  totalAnnualIncome: string,
  multiplier: string,
  valuationAmount: string,
  incomeBreakdown: string = '{}',
  notes: string = 'Test valuation'
) => {
  const [valuation] = await db
    .insert(valuations)
    .values({
      userId,
      name,
      totalAnnualIncome,
      multiplier,
      valuationAmount,
      incomeBreakdown,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    })
    .returning();
  
  return valuation;
};