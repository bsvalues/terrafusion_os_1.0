/**
 * Property Insight Sharing Service
 * 
 * This service handles the creation, retrieval, and management of shareable property insights.
 * It provides functionality for generating shareable links and tracking access to shared insights.
 */

import { randomUUID } from 'crypto';
import { IStorage } from '../storage';
import { 
  InsertPropertyInsightShare, 
  PropertyInsightShare 
} from '../../shared/schema';

/**
 * Interface for share creation options
 */
export interface ShareCreationOptions {
  expiresInDays?: number;
  isPublic?: boolean;
  password?: string;
  allowedDomains?: string[];
  title?: string;
}

/**
 * Share Types
 */
export enum InsightType {
  STORY = 'story',
  COMPARISON = 'comparison',
  DATA = 'data'
}

/**
 * Property Insight Sharing Service
 */
export class PropertyInsightSharingService {
  constructor(private storage: IStorage) {}

  /**
   * Create a shareable property story
   * 
   * @param propertyId The ID of the property
   * @param storyContent The generated story content
   * @param format The format of the story (simple, detailed, summary)
   * @param options Additional share options
   * @returns The created share information
   */
  async createPropertyStoryShare(
    propertyId: string,
    storyContent: string,
    format: string = 'detailed',
    options: ShareCreationOptions = {},
    propertyName?: string,
    propertyAddress?: string
  ): Promise<PropertyInsightShare> {
    // Generate unique share ID
    const shareId = randomUUID();
    
    // Calculate expiration date if provided
    let expiresAt = null;
    if (options.expiresInDays) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + options.expiresInDays);
      expiresAt = expirationDate;
    }
    
    // Create a title that includes the property name if available
    let title = options.title;
    if (!title) {
      if (propertyName) {
        title = `Property Insight: ${propertyName}`;
      } else {
        title = `Property Insight: ${propertyId}`;
      }
    }
    
    // Create the share entry
    const insightShare: InsertPropertyInsightShare = {
      shareId,
      propertyId,
      propertyName,
      propertyAddress,
      title,
      insightType: InsightType.STORY,
      insightData: { content: storyContent },
      format,
      isPublic: options.isPublic !== undefined ? options.isPublic : true,
      password: options.password,
      allowedDomains: options.allowedDomains,
      expiresAt: expiresAt,
    };
    
    // Store the share in the database
    const createdShare = await this.storage.createPropertyInsightShare(insightShare);
    return createdShare;
  }

  /**
   * Create a shareable property comparison
   * 
   * @param propertyIds Array of property IDs
   * @param comparisonContent The generated comparison content
   * @param format The format of the comparison
   * @param options Additional share options
   * @returns The created share information
   */
  async createPropertyComparisonShare(
    propertyIds: string[],
    comparisonContent: string,
    format: string = 'detailed',
    options: ShareCreationOptions = {},
    propertyNames?: string[],
    propertyAddresses?: string[]
  ): Promise<PropertyInsightShare> {
    // Generate unique share ID
    const shareId = randomUUID();
    
    // Calculate expiration date if provided
    let expiresAt = null;
    if (options.expiresInDays) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + options.expiresInDays);
      expiresAt = expirationDate;
    }
    
    // Format property names for display if available
    let title = options.title;
    if (!title) {
      if (propertyNames && propertyNames.length > 0) {
        title = `Property Comparison: ${propertyNames.join(', ')}`;
      } else {
        title = `Property Comparison: ${propertyIds.join(', ')}`;
      }
    }
    
    // Create the share entry
    const insightShare: InsertPropertyInsightShare = {
      shareId,
      propertyId: propertyIds.join(','), // Store multiple property IDs
      propertyName: propertyNames ? propertyNames.join(', ') : undefined,
      propertyAddress: propertyAddresses ? propertyAddresses.join(', ') : undefined,
      title,
      insightType: InsightType.COMPARISON,
      insightData: { 
        content: comparisonContent,
        propertyIds 
      },
      format,
      isPublic: options.isPublic !== undefined ? options.isPublic : true,
      password: options.password,
      allowedDomains: options.allowedDomains,
      expiresAt: expiresAt,
    };
    
    // Store the share in the database
    const createdShare = await this.storage.createPropertyInsightShare(insightShare);
    return createdShare;
  }

  /**
   * Create a shareable property data report
   * 
   * @param propertyId The ID of the property
   * @param propertyData The property data to share
   * @param options Additional share options
   * @returns The created share information
   */
  async createPropertyDataShare(
    propertyId: string,
    propertyData: any,
    options: ShareCreationOptions = {},
    propertyName?: string,
    propertyAddress?: string
  ): Promise<PropertyInsightShare> {
    // Generate unique share ID
    const shareId = randomUUID();
    
    // Calculate expiration date if provided
    let expiresAt = null;
    if (options.expiresInDays) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + options.expiresInDays);
      expiresAt = expirationDate;
    }
    
    // Create a title that includes the property name if available
    let title = options.title;
    if (!title) {
      if (propertyName) {
        title = `Property Data: ${propertyName}`;
      } else {
        title = `Property Data: ${propertyId}`;
      }
    }
    
    // Create the share entry
    const insightShare: InsertPropertyInsightShare = {
      shareId,
      propertyId,
      propertyName,
      propertyAddress,
      title,
      insightType: InsightType.DATA,
      insightData: propertyData,
      format: 'detailed', // Default for data shares
      isPublic: options.isPublic !== undefined ? options.isPublic : true,
      password: options.password,
      allowedDomains: options.allowedDomains,
      expiresAt: expiresAt,
    };
    
    // Store the share in the database
    const createdShare = await this.storage.createPropertyInsightShare(insightShare);
    return createdShare;
  }

  /**
   * Get a shared property insight by share ID
   * 
   * @param shareId The unique share ID
   * @param password Optional password for protected shares
   * @returns The shared property insight
   */
  async getPropertyInsightShare(shareId: string, password?: string): Promise<PropertyInsightShare | null> {
    // Get the share from the database
    const share = await this.storage.getPropertyInsightShareById(shareId);
    
    // Return null if not found
    if (!share) {
      return null;
    }
    
    // Check if the share has expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return null;
    }
    
    // Verify password if the share is password-protected
    if (share.password && share.password !== password) {
      throw new Error('Invalid password');
    }
    
    // Increment access count
    await this.incrementAccessCount(shareId);
    
    return share;
  }

  /**
   * Delete a property insight share
   * 
   * @param shareId The unique share ID
   * @returns True if successful, false otherwise
   */
  async deletePropertyInsightShare(shareId: string): Promise<boolean> {
    return await this.storage.deletePropertyInsightShare(shareId);
  }

  /**
   * Get all shares for a property
   * 
   * @param propertyId The ID of the property
   * @returns Array of property insight shares
   */
  async getSharesByPropertyId(propertyId: string): Promise<PropertyInsightShare[]> {
    return await this.storage.getPropertyInsightSharesByPropertyId(propertyId);
  }

  /**
   * Update a property insight share
   * 
   * @param shareId The unique share ID
   * @param updates The updates to apply
   * @returns The updated share
   */
  async updatePropertyInsightShare(
    shareId: string, 
    updates: Partial<InsertPropertyInsightShare>
  ): Promise<PropertyInsightShare | null> {
    return await this.storage.updatePropertyInsightShare(shareId, updates);
  }

  /**
   * Increment the access count for a shared insight
   * 
   * @param shareId The unique share ID
   * @returns The new access count
   */
  private async incrementAccessCount(shareId: string): Promise<number> {
    const share = await this.storage.getPropertyInsightShareById(shareId);
    if (!share) {
      throw new Error('Share not found');
    }
    
    const newAccessCount = (share.accessCount || 0) + 1;
    
    // Since accessCount is not part of the InsertPropertyInsightShare type,
    // we'll use a custom query approach through the storage interface
    // We're casting the update object to any to bypass the type check
    await this.storage.updatePropertyInsightShare(shareId, { 
      // Using type assertion to handle the accessCount which is not part of InsertPropertyInsightShare
      accessCount: newAccessCount 
    } as any);
    
    return newAccessCount;
  }
  
  /**
   * Track access to a shared property insight
   * 
   * @param shareId The unique share ID
   * @returns The updated share
   */
  async trackShareAccess(shareId: string): Promise<PropertyInsightShare | null> {
    try {
      const newAccessCount = await this.incrementAccessCount(shareId);
      
      // Create system activity record
      await this.storage.createSystemActivity({
        agentId: 2, // Analysis Agent
        activity: `Property insight share accessed (ID: ${shareId})`,
        entityType: 'propertyInsightShare',
        entityId: shareId
      });
      
      return await this.storage.getPropertyInsightShareById(shareId);
    } catch (error) {
      console.error('Error tracking share access:', error);
      return null;
    }
  }
  
  /**
   * Create a property insight share directly with data
   * 
   * @param shareData The share data to insert
   * @returns The created share
   */
  async createPropertyInsightShare(shareData: InsertPropertyInsightShare): Promise<PropertyInsightShare> {
    // Generate a unique share ID if not provided
    if (!shareData.shareId) {
      shareData.shareId = randomUUID();
    }
    
    return await this.storage.createPropertyInsightShare(shareData);
  }
  
  /**
   * Get all property insight shares
   * 
   * @returns Array of all property insight shares
   */
  async getAllPropertyInsightShares(): Promise<PropertyInsightShare[]> {
    return await this.storage.getAllPropertyInsightShares();
  }
}

// We'll create the instance in storage.ts to avoid circular dependencies
// export const propertyInsightSharingService = new PropertyInsightSharingService(storage);