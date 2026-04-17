import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, desc, sql } from 'drizzle-orm';
import {
  piltReceipts,
  piltDistributions,
  landClassifications,
  levyRates,
  validationResults,
  type PiltReceipt,
  type PiltDistribution,
  type LandClassification,
  type LevyRate,
  type ValidationResult,
  type InsertPiltReceipt,
  type InsertDistribution,
  type InsertLandClassification,
  type InsertLevyRate
} from '../shared/core-schema.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export interface ICoreStorage {
  getPiltHistory(): Promise<PiltReceipt[]>;
  getDistributions(year?: string): Promise<PiltDistribution[]>;
  getLandClassifications(year?: string): Promise<LandClassification[]>;
  getLevyRates(year?: string): Promise<LevyRate[]>;
  getValidationResults(year?: string): Promise<ValidationResult[]>;
  
  createPiltReceipt(data: InsertPiltReceipt): Promise<PiltReceipt>;
  createDistribution(data: InsertDistribution): Promise<PiltDistribution>;
  createLandClassification(data: InsertLandClassification): Promise<LandClassification>;
  createLevyRate(data: InsertLevyRate): Promise<LevyRate>;
  
  updatePiltReceipt(id: number, data: Partial<InsertPiltReceipt>): Promise<PiltReceipt>;
  updateDistribution(id: number, data: Partial<InsertDistribution>): Promise<PiltDistribution>;
  
  deletePiltReceipt(id: number): Promise<void>;
  deleteDistribution(id: number): Promise<void>;
  
  bulkInsertDistributions(data: InsertDistribution[]): Promise<PiltDistribution[]>;
  bulkInsertLandClassifications(data: InsertLandClassification[]): Promise<LandClassification[]>;
  bulkInsertLevyRates(data: InsertLevyRate[]): Promise<LevyRate[]>;
}

export class CoreStorage implements ICoreStorage {
  async getPiltHistory(): Promise<PiltReceipt[]> {
    return await db.select().from(piltReceipts).orderBy(desc(piltReceipts.year));
  }

  async getDistributions(year?: string): Promise<PiltDistribution[]> {
    if (year) {
      return await db.select().from(piltDistributions).where(eq(piltDistributions.year, year));
    }
    return await db.select().from(piltDistributions).orderBy(desc(piltDistributions.year));
  }

  async getLandClassifications(year?: string): Promise<LandClassification[]> {
    if (year) {
      return await db.select().from(landClassifications).where(eq(landClassifications.year, year));
    }
    return await db.select().from(landClassifications).orderBy(desc(landClassifications.year));
  }

  async getLevyRates(year?: string): Promise<LevyRate[]> {
    if (year) {
      return await db.select().from(levyRates).where(eq(levyRates.year, year));
    }
    return await db.select().from(levyRates).orderBy(desc(levyRates.year));
  }

  async getValidationResults(year?: string): Promise<ValidationResult[]> {
    if (year) {
      return await db.select().from(validationResults).where(eq(validationResults.year, year));
    }
    return await db.select().from(validationResults).orderBy(desc(validationResults.createdAt));
  }

  async createPiltReceipt(data: InsertPiltReceipt): Promise<PiltReceipt> {
    const [result] = await db.insert(piltReceipts).values(data).returning();
    return result;
  }

  async createDistribution(data: InsertDistribution): Promise<PiltDistribution> {
    const [result] = await db.insert(piltDistributions).values(data).returning();
    return result;
  }

  async createLandClassification(data: InsertLandClassification): Promise<LandClassification> {
    const [result] = await db.insert(landClassifications).values(data).returning();
    return result;
  }

  async createLevyRate(data: InsertLevyRate): Promise<LevyRate> {
    const [result] = await db.insert(levyRates).values(data).returning();
    return result;
  }

  async updatePiltReceipt(id: number, data: Partial<InsertPiltReceipt>): Promise<PiltReceipt> {
    const [result] = await db.update(piltReceipts)
      .set(data)
      .where(eq(piltReceipts.id, id))
      .returning();
    return result;
  }

  async updateDistribution(id: number, data: Partial<InsertDistribution>): Promise<PiltDistribution> {
    const [result] = await db.update(piltDistributions)
      .set(data)
      .where(eq(piltDistributions.id, id))
      .returning();
    return result;
  }

  async deletePiltReceipt(id: number): Promise<void> {
    await db.delete(piltReceipts).where(eq(piltReceipts.id, id));
  }

  async deleteDistribution(id: number): Promise<void> {
    await db.delete(piltDistributions).where(eq(piltDistributions.id, id));
  }

  async bulkInsertDistributions(data: InsertDistribution[]): Promise<PiltDistribution[]> {
    if (data.length === 0) return [];
    return await db.insert(piltDistributions).values(data).returning();
  }

  async bulkInsertLandClassifications(data: InsertLandClassification[]): Promise<LandClassification[]> {
    if (data.length === 0) return [];
    return await db.insert(landClassifications).values(data).returning();
  }

  async bulkInsertLevyRates(data: InsertLevyRate[]): Promise<LevyRate[]> {
    if (data.length === 0) return [];
    return await db.insert(levyRates).values(data).returning();
  }
}

export const coreStorage = new CoreStorage();