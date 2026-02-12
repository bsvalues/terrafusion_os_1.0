import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from './db';
import {
  users,
  properties,
  appraisals,
  comparables,
  adjustments,
  attachments,
  marketData,
  User,
  InsertUser,
  Property,
  InsertProperty,
  Appraisal,
  InsertAppraisal,
  Comparable,
  InsertComparable,
  Adjustment,
  InsertAdjustment,
  Attachment,
  InsertAttachment,
  MarketData,
  InsertMarketData
} from '../shared/schema';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Property operations
  getProperty(id: number): Promise<Property | undefined>;
  getProperties(filters?: Partial<Property>): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  
  // Appraisal operations
  getAppraisal(id: number): Promise<Appraisal | undefined>;
  getAppraisalsByProperty(propertyId: number): Promise<Appraisal[]>;
  getAppraisalsByAppraiser(appraiserId: number): Promise<Appraisal[]>;
  createAppraisal(appraisal: InsertAppraisal): Promise<Appraisal>;
  updateAppraisal(id: number, appraisal: Partial<InsertAppraisal>): Promise<Appraisal | undefined>;
  deleteAppraisal(id: number): Promise<boolean>;
  
  // Comparable operations
  getComparable(id: number): Promise<Comparable | undefined>;
  getComparablesByAppraisal(appraisalId: number): Promise<Comparable[]>;
  createComparable(comparable: InsertComparable): Promise<Comparable>;
  updateComparable(id: number, comparable: Partial<InsertComparable>): Promise<Comparable | undefined>;
  deleteComparable(id: number): Promise<boolean>;
  
  // Adjustment operations
  getAdjustment(id: number): Promise<Adjustment | undefined>;
  getAdjustmentsByComparable(comparableId: number): Promise<Adjustment[]>;
  createAdjustment(adjustment: InsertAdjustment): Promise<Adjustment>;
  updateAdjustment(id: number, adjustment: Partial<InsertAdjustment>): Promise<Adjustment | undefined>;
  deleteAdjustment(id: number): Promise<boolean>;
  
  // Attachment operations
  getAttachment(id: number): Promise<Attachment | undefined>;
  getAttachmentsByAppraisal(appraisalId: number): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(id: number): Promise<boolean>;
  
  // Market data operations
  getMarketData(id: number): Promise<MarketData | undefined>;
  getMarketDataByZipCode(zipCode: string): Promise<MarketData[]>;
  createMarketData(marketData: InsertMarketData): Promise<MarketData>;
  getMarketDataForProperty(propertyId: number): Promise<MarketData[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  // Property operations
  async getProperty(id: number): Promise<Property | undefined> {
    const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getProperties(filters?: Partial<Property>): Promise<Property[]> {
    // Base query with no filters
    if (!filters) {
      return await db.select().from(properties).orderBy(desc(properties.createdAt));
    }
    
    // Build conditions for filtering
    const conditions: any[] = [];
    
    if (filters.propertyType) {
      conditions.push(eq(properties.propertyType, filters.propertyType));
    }
    if (filters.city) {
      conditions.push(eq(properties.city, filters.city));
    }
    if (filters.state) {
      conditions.push(eq(properties.state, filters.state));
    }
    if (filters.zipCode) {
      conditions.push(eq(properties.zipCode, filters.zipCode));
    }
    
    // Execute query with appropriate conditions
    if (conditions.length === 0) {
      return await db.select().from(properties).orderBy(desc(properties.createdAt));
    } else if (conditions.length === 1) {
      return await db.select()
        .from(properties)
        .where(conditions[0])
        .orderBy(desc(properties.createdAt));
    } else {
      return await db.select()
        .from(properties)
        .where(and(...conditions))
        .orderBy(desc(properties.createdAt));
    }
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const result = await db.insert(properties).values(insertProperty).returning();
    return result[0];
  }

  async updateProperty(id: number, propertyData: Partial<InsertProperty>): Promise<Property | undefined> {
    const result = await db.update(properties).set(propertyData).where(eq(properties.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteProperty(id: number): Promise<boolean> {
    // First check if the property exists
    const property = await this.getProperty(id);
    if (!property) {
      return false;
    }
    
    // Check if there are any appraisals for this property
    const propertyAppraisals = await this.getAppraisalsByProperty(id);
    
    if (propertyAppraisals.length > 0) {
      // If there are appraisals, we should not allow deletion
      // In a real application, you might want to implement cascading deletion or soft deletion
      return false;
    }
    
    const result = await db.delete(properties).where(eq(properties.id, id)).returning();
    return result.length > 0;
  }

  // Appraisal operations
  async getAppraisal(id: number): Promise<Appraisal | undefined> {
    const result = await db.select().from(appraisals).where(eq(appraisals.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getAppraisalsByProperty(propertyId: number): Promise<Appraisal[]> {
    return db.select().from(appraisals).where(eq(appraisals.propertyId, propertyId));
  }

  async getAppraisalsByAppraiser(appraiserId: number): Promise<Appraisal[]> {
    return db.select().from(appraisals).where(eq(appraisals.appraiserId, appraiserId));
  }

  async createAppraisal(insertAppraisal: InsertAppraisal): Promise<Appraisal> {
    const result = await db.insert(appraisals).values(insertAppraisal).returning();
    return result[0];
  }

  async updateAppraisal(id: number, appraisalData: Partial<InsertAppraisal>): Promise<Appraisal | undefined> {
    const result = await db.update(appraisals).set(appraisalData).where(eq(appraisals.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteAppraisal(id: number): Promise<boolean> {
    // First check if the appraisal exists
    const appraisal = await this.getAppraisal(id);
    if (!appraisal) {
      return false;
    }
    
    // In a real application, you would likely need to delete related records first
    // or use cascading deletes in the database
    
    // Delete any comparables associated with this appraisal
    const appraisalComparables = await this.getComparablesByAppraisal(id);
    for (const comparable of appraisalComparables) {
      await this.deleteComparable(comparable.id);
    }
    
    // Delete any attachments associated with this appraisal
    const appraisalAttachments = await this.getAttachmentsByAppraisal(id);
    for (const attachment of appraisalAttachments) {
      await this.deleteAttachment(attachment.id);
    }
    
    const result = await db.delete(appraisals).where(eq(appraisals.id, id)).returning();
    return result.length > 0;
  }

  // Comparable operations
  async getComparable(id: number): Promise<Comparable | undefined> {
    const result = await db.select().from(comparables).where(eq(comparables.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getComparablesByAppraisal(appraisalId: number): Promise<Comparable[]> {
    return db.select().from(comparables).where(eq(comparables.appraisalId, appraisalId));
  }

  async createComparable(insertComparable: InsertComparable): Promise<Comparable> {
    const result = await db.insert(comparables).values(insertComparable).returning();
    return result[0];
  }

  async updateComparable(id: number, comparableData: Partial<InsertComparable>): Promise<Comparable | undefined> {
    const result = await db.update(comparables).set(comparableData).where(eq(comparables.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteComparable(id: number): Promise<boolean> {
    // First check if the comparable exists
    const comparable = await this.getComparable(id);
    if (!comparable) {
      return false;
    }
    
    // Delete any adjustments associated with this comparable
    const comparableAdjustments = await this.getAdjustmentsByComparable(id);
    for (const adjustment of comparableAdjustments) {
      await this.deleteAdjustment(adjustment.id);
    }
    
    const result = await db.delete(comparables).where(eq(comparables.id, id)).returning();
    return result.length > 0;
  }

  // Adjustment operations
  async getAdjustment(id: number): Promise<Adjustment | undefined> {
    const result = await db.select().from(adjustments).where(eq(adjustments.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getAdjustmentsByComparable(comparableId: number): Promise<Adjustment[]> {
    return db.select().from(adjustments).where(eq(adjustments.comparableId, comparableId));
  }

  async createAdjustment(insertAdjustment: InsertAdjustment): Promise<Adjustment> {
    const result = await db.insert(adjustments).values(insertAdjustment).returning();
    return result[0];
  }

  async updateAdjustment(id: number, adjustmentData: Partial<InsertAdjustment>): Promise<Adjustment | undefined> {
    const result = await db.update(adjustments).set(adjustmentData).where(eq(adjustments.id, id)).returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteAdjustment(id: number): Promise<boolean> {
    const result = await db.delete(adjustments).where(eq(adjustments.id, id)).returning();
    return result.length > 0;
  }

  // Attachment operations
  async getAttachment(id: number): Promise<Attachment | undefined> {
    const result = await db.select().from(attachments).where(eq(attachments.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getAttachmentsByAppraisal(appraisalId: number): Promise<Attachment[]> {
    return db.select().from(attachments).where(eq(attachments.appraisalId, appraisalId));
  }

  async createAttachment(insertAttachment: InsertAttachment): Promise<Attachment> {
    const result = await db.insert(attachments).values(insertAttachment).returning();
    return result[0];
  }

  async deleteAttachment(id: number): Promise<boolean> {
    const result = await db.delete(attachments).where(eq(attachments.id, id)).returning();
    return result.length > 0;
  }

  // Market data operations
  async getMarketData(id: number): Promise<MarketData | undefined> {
    const result = await db.select().from(marketData).where(eq(marketData.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  async getMarketDataByZipCode(zipCode: string): Promise<MarketData[]> {
    return db.select().from(marketData).where(eq(marketData.zipCode, zipCode));
  }

  async createMarketData(insertMarketData: InsertMarketData): Promise<MarketData> {
    const result = await db.insert(marketData).values(insertMarketData).returning();
    return result[0];
  }

  async getMarketDataForProperty(propertyId: number): Promise<MarketData[]> {
    // First get the property to get its zip code
    const property = await this.getProperty(propertyId);
    if (!property) {
      return [];
    }
    
    // Then get market data for that zip code
    return this.getMarketDataByZipCode(property.zipCode);
  }
}

export const storage = new DatabaseStorage();