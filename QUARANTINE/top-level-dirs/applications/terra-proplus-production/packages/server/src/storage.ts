import { CoreSchema } from "../../shared/src";

// Extract types and tables from CoreSchema
const { 
  users, properties, appraisals, comparables
} = CoreSchema;

// Type imports
type User = CoreSchema.User;
type InsertUser = CoreSchema.InsertUser;
type Property = CoreSchema.Property;
type InsertProperty = CoreSchema.InsertProperty;
type Appraisal = CoreSchema.Appraisal;
type InsertAppraisal = CoreSchema.InsertAppraisal;
type Comparable = CoreSchema.Comparable;
type InsertComparable = CoreSchema.InsertComparable;
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface defining our storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Property operations
  getProperty(id: number): Promise<Property | undefined>;
  getProperties(): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  
  // Appraisal operations
  getAppraisal(id: number): Promise<Appraisal | undefined>;
  getAppraisalsByProperty(propertyId: number): Promise<Appraisal[]>;
  getAppraisalsByAppraiser(appraiserId: number): Promise<Appraisal[]>;
  createAppraisal(appraisal: InsertAppraisal): Promise<Appraisal>;
  
  // Comparable operations
  getComparable(id: number): Promise<Comparable | undefined>;
  getComparablesByAppraisal(appraisalId: number): Promise<Comparable[]>;
  createComparable(comparable: InsertComparable): Promise<Comparable>;
}

// Database implementation of storage
export class DatabaseStorage implements IStorage {
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
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Property operations
  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }
  
  async getProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }
  
  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values(insertProperty).returning();
    return property;
  }
  
  // Appraisal operations
  async getAppraisal(id: number): Promise<Appraisal | undefined> {
    const [appraisal] = await db.select().from(appraisals).where(eq(appraisals.id, id));
    return appraisal;
  }
  
  async getAppraisalsByProperty(propertyId: number): Promise<Appraisal[]> {
    return await db.select().from(appraisals).where(eq(appraisals.propertyId, propertyId));
  }
  
  async getAppraisalsByAppraiser(appraiserId: number): Promise<Appraisal[]> {
    return await db.select().from(appraisals).where(eq(appraisals.appraiserId, appraiserId));
  }
  
  async createAppraisal(insertAppraisal: InsertAppraisal): Promise<Appraisal> {
    const [appraisal] = await db.insert(appraisals).values(insertAppraisal).returning();
    return appraisal;
  }
  
  // Comparable operations
  async getComparable(id: number): Promise<Comparable | undefined> {
    const [comparable] = await db.select().from(comparables).where(eq(comparables.id, id));
    return comparable;
  }
  
  async getComparablesByAppraisal(appraisalId: number): Promise<Comparable[]> {
    return await db.select().from(comparables).where(eq(comparables.appraisalId, appraisalId));
  }
  
  async createComparable(insertComparable: InsertComparable): Promise<Comparable> {
    const [comparable] = await db.insert(comparables).values(insertComparable).returning();
    return comparable;
  }
}

// Create storage instance
export const storage = new DatabaseStorage();