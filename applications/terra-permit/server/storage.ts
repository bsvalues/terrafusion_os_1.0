import { 
  users, type User, type InsertUser,
  permits, type Permit, type InsertPermit,
  uploads, type Upload, type InsertUpload,
  permitHistories, type PermitHistory, type InsertPermitHistory,
  organizations, type Organization, type InsertOrganization,
  organizationMembers, type OrganizationMember, type InsertOrganizationMember,
  recommendations, type Recommendation, type InsertRecommendation,
  ActionType, UserRole
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;

  // Organization methods
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, orgData: Partial<Organization>): Promise<Organization>;
  getUserOrganizations(userId: number): Promise<OrganizationMember[]>;
  addUserToOrganization(userId: number, organizationId: number, role: UserRole): Promise<OrganizationMember>;
  updateUserRole(userId: number, organizationId: number, role: UserRole): Promise<OrganizationMember>;
  removeUserFromOrganization(userId: number, organizationId: number): Promise<void>;

  // Permit methods
  getPermit(id: number): Promise<Permit | undefined>;
  getPermitsByUploadId(uploadId: number): Promise<Permit[]>;
  createPermit(permit: InsertPermit): Promise<Permit>;
  createPermits(permits: InsertPermit[]): Promise<Permit[]>;
  updatePermit(id: number, permit: Partial<InsertPermit>): Promise<Permit>;

  // Upload methods
  getUpload(id: number): Promise<Upload | undefined>;
  getAllUploads(): Promise<Upload[]>;
  getUploadsByOrganization(organizationId: number): Promise<Upload[]>;
  createUpload(upload: InsertUpload): Promise<Upload>;
  updateUploadCounts(uploadId: number, totalCount: number, enterCount: number, skipCount: number): Promise<Upload>;

  // Permit History methods
  getPermitHistoriesByPermitId(permitId: number): Promise<PermitHistory[]>;
  getPermitHistoriesByUploadId(uploadId: number): Promise<PermitHistory[]>;
  createPermitHistory(history: InsertPermitHistory): Promise<PermitHistory>;
  
  // Recommendation methods
  getRecommendationsByUserId(userId: number): Promise<Recommendation[]>;
  getRecommendation(id: string): Promise<Recommendation | undefined>;
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  updateRecommendation(id: string, recommendation: Partial<Recommendation>): Promise<Recommendation>;
  deleteRecommendation(id: string): Promise<boolean>;
}

import { db } from "./db";
import { eq, asc, desc, inArray, and } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
      
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return user;
  }
  
  // Organization methods
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization;
  }
  
  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return organization;
  }
  
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [organization] = await db.insert(organizations).values(org).returning();
    return organization;
  }
  
  async updateOrganization(id: number, orgData: Partial<Organization>): Promise<Organization> {
    const [organization] = await db
      .update(organizations)
      .set({
        ...orgData,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, id))
      .returning();
      
    if (!organization) {
      throw new Error(`Organization with ID ${id} not found`);
    }
    
    return organization;
  }
  
  async getUserOrganizations(userId: number): Promise<OrganizationMember[]> {
    return await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId));
  }
  
  async addUserToOrganization(userId: number, organizationId: number, role: UserRole): Promise<OrganizationMember> {
    const [membership] = await db
      .insert(organizationMembers)
      .values({
        userId,
        organizationId,
        role
      })
      .returning();
      
    return membership;
  }
  
  async updateUserRole(userId: number, organizationId: number, role: UserRole): Promise<OrganizationMember> {
    const [membership] = await db
      .update(organizationMembers)
      .set({
        role,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      )
      .returning();
      
    if (!membership) {
      throw new Error(`Membership for user ${userId} in organization ${organizationId} not found`);
    }
    
    return membership;
  }
  
  async removeUserFromOrganization(userId: number, organizationId: number): Promise<void> {
    await db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId)
        )
      );
  }

  // Permit methods
  async getPermit(id: number): Promise<Permit | undefined> {
    const [permit] = await db.select().from(permits).where(eq(permits.id, id));
    return permit;
  }

  async getPermitsByUploadId(uploadId: number): Promise<Permit[]> {
    return await db.select().from(permits).where(eq(permits.uploadId, uploadId));
  }

  async createPermit(insertPermit: InsertPermit): Promise<Permit> {
    const [permit] = await db.insert(permits).values(insertPermit).returning();
    return permit;
  }

  async createPermits(insertPermits: InsertPermit[]): Promise<Permit[]> {
    if (insertPermits.length === 0) return [];
    return await db.insert(permits).values(insertPermits).returning();
  }

  async updatePermit(id: number, permitUpdate: Partial<InsertPermit>): Promise<Permit> {
    const [updatedPermit] = await db
      .update(permits)
      .set(permitUpdate)
      .where(eq(permits.id, id))
      .returning();
    
    if (!updatedPermit) {
      throw new Error(`Permit with ID ${id} not found`);
    }
    
    return updatedPermit;
  }

  // Upload methods
  async getUpload(id: number): Promise<Upload | undefined> {
    const [upload] = await db.select().from(uploads).where(eq(uploads.id, id));
    return upload;
  }

  async getAllUploads(): Promise<Upload[]> {
    return await db.select().from(uploads).orderBy(desc(uploads.processedAt));
  }

  async getUploadsByOrganization(organizationId: number): Promise<Upload[]> {
    return await db
      .select()
      .from(uploads)
      .where(eq(uploads.organizationId, organizationId))
      .orderBy(desc(uploads.processedAt));
  }

  async createUpload(insertUpload: InsertUpload): Promise<Upload> {
    const [upload] = await db.insert(uploads).values(insertUpload).returning();
    return upload;
  }

  async updateUploadCounts(
    uploadId: number, 
    totalCount: number, 
    enterCount: number, 
    skipCount: number
  ): Promise<Upload> {
    const [updatedUpload] = await db
      .update(uploads)
      .set({
        totalPermits: totalCount,
        enterPermits: enterCount,
        skipPermits: skipCount
      })
      .where(eq(uploads.id, uploadId))
      .returning();
    
    if (!updatedUpload) {
      throw new Error(`Upload with ID ${uploadId} not found`);
    }
    
    return updatedUpload;
  }

  // Permit History methods
  async getPermitHistoriesByPermitId(permitId: number): Promise<PermitHistory[]> {
    return await db
      .select()
      .from(permitHistories)
      .where(eq(permitHistories.permitId, permitId))
      .orderBy(desc(permitHistories.createdAt));
  }

  async getPermitHistoriesByUploadId(uploadId: number): Promise<PermitHistory[]> {
    // First get all permits for this upload
    const permitsForUpload = await this.getPermitsByUploadId(uploadId);
    
    if (permitsForUpload.length === 0) {
      return [];
    }

    // Then get histories for these permits
    const permitIds = permitsForUpload.map(permit => permit.id);
    return await db
      .select()
      .from(permitHistories)
      .where(inArray(permitHistories.permitId, permitIds))
      .orderBy(desc(permitHistories.createdAt));
  }

  async createPermitHistory(history: InsertPermitHistory): Promise<PermitHistory> {
    const [newHistory] = await db
      .insert(permitHistories)
      .values(history)
      .returning();
    
    return newHistory;
  }

  // Recommendation methods
  async getRecommendationsByUserId(userId: number): Promise<Recommendation[]> {
    return await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.userId, userId))
      .orderBy(desc(recommendations.createdAt));
  }

  async getRecommendation(id: string): Promise<Recommendation | undefined> {
    const [recommendation] = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.id, id));
    
    return recommendation;
  }

  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    // Add default values for missing fields to avoid type issues
    const recommendationWithDefaults = {
      id: recommendation.id,
      userId: recommendation.userId,
      organizationId: recommendation.organizationId,
      title: recommendation.title,
      description: recommendation.description,
      type: recommendation.type,
      priority: recommendation.priority,
      source: recommendation.source,
      createdAt: recommendation.createdAt || new Date(),
      expiresAt: recommendation.expiresAt || null,
      isImplemented: recommendation.isImplemented || false,
      implementedAt: recommendation.implementedAt || null,
      implementationNote: recommendation.implementationNote || null,
      relatedEntityId: recommendation.relatedEntityId || null,
      relatedEntityType: recommendation.relatedEntityType || null,
      actionUrl: recommendation.actionUrl || null,
      metadata: recommendation.metadata || {}
    };
    
    const [newRecommendation] = await db
      .insert(recommendations)
      .values(recommendationWithDefaults)
      .returning();
    
    return newRecommendation;
  }

  async updateRecommendation(id: string, updates: Partial<Recommendation>): Promise<Recommendation> {
    const [updatedRecommendation] = await db
      .update(recommendations)
      .set(updates)
      .where(eq(recommendations.id, id))
      .returning();
    
    if (!updatedRecommendation) {
      throw new Error(`Recommendation with ID ${id} not found`);
    }
    
    return updatedRecommendation;
  }

  async deleteRecommendation(id: string): Promise<boolean> {
    try {
      await db
        .delete(recommendations)
        .where(eq(recommendations.id, id));
      
      return true;
    } catch (error) {
      console.error(`Failed to delete recommendation ${id}:`, error);
      return false;
    }
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
