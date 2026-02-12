import { 
  users, 
  incomes, 
  valuations, 
  incomeMultipliers,
  type User, 
  type InsertUser, 
  type Income, 
  type InsertIncome, 
  type Valuation, 
  type InsertValuation,
  type IncomeMultiplier,
  type InsertIncomeMultiplier
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Income operations
  getIncomesByUserId(userId: number): Promise<Income[]>;
  getIncomeById(id: number): Promise<Income | undefined>;
  createIncome(income: InsertIncome): Promise<Income>;
  updateIncome(id: number, income: Partial<InsertIncome>): Promise<Income | undefined>;
  deleteIncome(id: number): Promise<boolean>;
  
  // Valuation operations
  getValuationsByUserId(userId: number): Promise<Valuation[]>;
  getValuationById(id: number): Promise<Valuation | undefined>;
  createValuation(valuation: InsertValuation): Promise<Valuation>;
  updateValuation(id: number, valuation: Partial<InsertValuation>): Promise<Valuation | undefined>;
  deleteValuation(id: number): Promise<boolean>;
  
  // Income Multiplier operations
  getAllIncomeMultipliers(): Promise<IncomeMultiplier[]>;
  getIncomeMultiplierBySource(source: string): Promise<IncomeMultiplier | undefined>;
  createIncomeMultiplier(multiplier: InsertIncomeMultiplier): Promise<IncomeMultiplier>;
  updateIncomeMultiplier(id: number, multiplier: Partial<InsertIncomeMultiplier>): Promise<IncomeMultiplier | undefined>;
  deleteIncomeMultiplier(id: number): Promise<boolean>;
  
  // Valuation calculation
  calculateValuation(userId: number): Promise<{
    incomeBreakdown: Array<{ source: string, annualAmount: number, multiplier: number, valuation: number }>,
    totalAnnualIncome: number,
    weightedMultiplier: number,
    totalValuation: number
  }>;
}

export class DatabaseStorage implements IStorage {
  // Helper method to run a function within a transaction
  private async withTransaction<T>(fn: (tx: PostgresJsDatabase) => Promise<T>): Promise<T> {
    return db.transaction(async (tx) => {
      return await fn(tx);
    });
  }
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Income operations
  async getIncomesByUserId(userId: number): Promise<Income[]> {
    return db
      .select()
      .from(incomes)
      .where(eq(incomes.userId, userId))
      .orderBy(desc(incomes.createdAt));
  }

  async getIncomeById(id: number): Promise<Income | undefined> {
    const [income] = await db
      .select()
      .from(incomes)
      .where(eq(incomes.id, id));
    return income;
  }

  async createIncome(income: InsertIncome): Promise<Income> {
    const [newIncome] = await db
      .insert(incomes)
      .values(income)
      .returning();
    return newIncome;
  }

  async updateIncome(id: number, income: Partial<InsertIncome>): Promise<Income | undefined> {
    const [updatedIncome] = await db
      .update(incomes)
      .set(income)
      .where(eq(incomes.id, id))
      .returning();
    return updatedIncome;
  }

  async deleteIncome(id: number): Promise<boolean> {
    const result = await db
      .delete(incomes)
      .where(eq(incomes.id, id))
      .returning({ id: incomes.id });
    return result.length > 0;
  }

  // Valuation operations
  async getValuationsByUserId(userId: number): Promise<Valuation[]> {
    return db
      .select()
      .from(valuations)
      .where(eq(valuations.userId, userId))
      .orderBy(desc(valuations.createdAt));
  }

  async getValuationById(id: number): Promise<Valuation | undefined> {
    const [valuation] = await db
      .select()
      .from(valuations)
      .where(eq(valuations.id, id));
    return valuation;
  }

  async createValuation(valuation: InsertValuation): Promise<Valuation> {
    // Use a transaction to ensure data consistency
    return this.withTransaction(async (tx) => {
      const [newValuation] = await tx
        .insert(valuations)
        .values(valuation)
        .returning();
      
      // If we need to do additional operations as part of valuation creation
      // we can do them here within the same transaction
      
      return newValuation;
    });
  }

  async updateValuation(id: number, valuation: Partial<InsertValuation>): Promise<Valuation | undefined> {
    const [updatedValuation] = await db
      .update(valuations)
      .set(valuation)
      .where(eq(valuations.id, id))
      .returning();
    return updatedValuation;
  }

  async deleteValuation(id: number): Promise<boolean> {
    // Use transactions to ensure atomicity when deleting data
    return this.withTransaction(async (tx) => {
      // Additional logic could be added here if we needed to delete related records
      // or perform additional cleanup within the transaction
      
      const result = await tx
        .delete(valuations)
        .where(eq(valuations.id, id))
        .returning({ id: valuations.id });
      
      return result.length > 0;
    });
  }
  
  // Income Multiplier operations
  async getAllIncomeMultipliers(): Promise<IncomeMultiplier[]> {
    return db
      .select()
      .from(incomeMultipliers)
      .where(eq(incomeMultipliers.isActive, true))
      .orderBy(incomeMultipliers.source);
  }

  async getIncomeMultiplierBySource(source: string): Promise<IncomeMultiplier | undefined> {
    const [multiplier] = await db
      .select()
      .from(incomeMultipliers)
      .where(and(
        eq(incomeMultipliers.source, source),
        eq(incomeMultipliers.isActive, true)
      ));
    return multiplier;
  }

  async createIncomeMultiplier(multiplier: InsertIncomeMultiplier): Promise<IncomeMultiplier> {
    const [newMultiplier] = await db
      .insert(incomeMultipliers)
      .values(multiplier)
      .returning();
    return newMultiplier;
  }

  async updateIncomeMultiplier(id: number, multiplier: Partial<InsertIncomeMultiplier>): Promise<IncomeMultiplier | undefined> {
    const [updatedMultiplier] = await db
      .update(incomeMultipliers)
      .set({
        ...multiplier,
        updatedAt: new Date()
      })
      .where(eq(incomeMultipliers.id, id))
      .returning();
    return updatedMultiplier;
  }

  async deleteIncomeMultiplier(id: number): Promise<boolean> {
    const result = await db
      .delete(incomeMultipliers)
      .where(eq(incomeMultipliers.id, id))
      .returning({ id: incomeMultipliers.id });
    return result.length > 0;
  }
  
  // Calculate valuation based on user's income sources and their multipliers
  async calculateValuation(userId: number): Promise<{
    incomeBreakdown: Array<{ source: string; annualAmount: number; multiplier: number; valuation: number }>;
    totalAnnualIncome: number;
    weightedMultiplier: number;
    totalValuation: number;
  }> {
    // Get all user incomes
    const userIncomes = await this.getIncomesByUserId(userId);
    
    // Get all income multipliers
    const allMultipliers = await this.getAllIncomeMultipliers();
    
    // Default multiplier if specific source not found
    const DEFAULT_MULTIPLIER = 2.5;
    
    // Convert income to annual and apply multipliers
    const incomeBreakdown = userIncomes.map(income => {
      // Find the multiplier for this income source
      const multiplierConfig = allMultipliers.find(m => 
        m.source.toLowerCase() === income.source.toLowerCase());
      
      // Use the configured multiplier or default
      const multiplier = multiplierConfig ? 
        parseFloat(multiplierConfig.multiplier.toString()) : DEFAULT_MULTIPLIER;
      
      // Calculate annual amount based on frequency
      let annualAmount = parseFloat(income.amount.toString());
      if (income.frequency.toLowerCase() === 'monthly') {
        annualAmount *= 12;
      } else if (income.frequency.toLowerCase() === 'weekly') {
        annualAmount *= 52;
      } else if (income.frequency.toLowerCase() === 'biweekly') {
        annualAmount *= 26;
      }
      
      // Calculate valuation for this income source
      const valuation = annualAmount * multiplier;
      
      return {
        source: income.source,
        annualAmount,
        multiplier,
        valuation
      };
    });
    
    // Calculate totals
    const totalAnnualIncome = incomeBreakdown.reduce((sum, item) => sum + item.annualAmount, 0);
    const totalValuation = incomeBreakdown.reduce((sum, item) => sum + item.valuation, 0);
    
    // Calculate weighted multiplier
    const weightedMultiplier = totalAnnualIncome > 0 ? 
      totalValuation / totalAnnualIncome : 
      DEFAULT_MULTIPLIER;
    
    return {
      incomeBreakdown,
      totalAnnualIncome,
      weightedMultiplier,
      totalValuation
    };
  }
}

export const storage = new DatabaseStorage();
