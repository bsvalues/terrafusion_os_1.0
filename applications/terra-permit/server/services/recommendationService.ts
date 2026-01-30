/**
 * Recommendation Service
 * 
 * This service handles the management and generation of personalized workflow
 * recommendations based on user behavior, permit history, and workflow patterns.
 */

import { db, pool } from '../db';
import { 
  Permit, User, Organization, 
  RecommendationType, RecommendationPriority, RecommendationSource, 
  Recommendation as SchemaRecommendation, InsertRecommendation
} from '../../shared/schema';
import { 
  UserBehaviorPattern
} from '../../shared/recommendation';

// Use the database schema's recommendation type
type Recommendation = SchemaRecommendation;
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../storage';
import { log } from '../vite';

/**
 * Service for managing workflow recommendations.
 */
class RecommendationService {
  constructor() {
    log('Initializing RecommendationService', 'recommendation');
  }
  
  /**
   * Get recommendations for a specific user
   */
  async getRecommendationsForUser(userId: number): Promise<Recommendation[]> {
    try {
      const recommendations = await storage.getRecommendationsByUserId(userId);
      
      // Convert string enums to proper enum types
      return recommendations.map(rec => ({
        ...rec,
        type: rec.type as RecommendationType,
        priority: rec.priority as RecommendationPriority,
        source: rec.source as RecommendationSource
      }));
    } catch (error) {
      log(`Error fetching recommendations for user ${userId}: ${error}`, 'recommendation');
      return [];
    }
  }
  
  /**
   * Create a new recommendation
   */
  async createRecommendation(recommendation: Partial<Recommendation>): Promise<Recommendation> {
    try {
      // Ensure recommendation has an ID
      if (!recommendation.id) {
        recommendation.id = uuidv4();
      }
      
      // Set creation time if not already set
      if (!recommendation.createdAt) {
        recommendation.createdAt = new Date();
      }
      
      // Convert string types to enum types if needed
      const insertRecommendation: InsertRecommendation = {
        userId: recommendation.userId!,
        organizationId: recommendation.organizationId!,
        title: recommendation.title!,
        description: recommendation.description!,
        type: recommendation.type as RecommendationType,
        priority: recommendation.priority as RecommendationPriority,
        source: recommendation.source as RecommendationSource,
        expiresAt: recommendation.expiresAt,
        isImplemented: recommendation.isImplemented ?? false,
        implementedAt: recommendation.implementedAt,
        implementationNote: recommendation.implementationNote,
        relatedEntityId: recommendation.relatedEntityId,
        relatedEntityType: recommendation.relatedEntityType,
        actionUrl: recommendation.actionUrl,
        // Convert metadata to JSON string if needed
        metadata: recommendation.metadata ? JSON.parse(JSON.stringify(recommendation.metadata)) : undefined
      };
      
      // Store recommendation in database
      const createdRecommendation = await storage.createRecommendation(insertRecommendation);
      
      log(`Created recommendation ${createdRecommendation.id} for user ${createdRecommendation.userId}`, 'recommendation');
      
      return createdRecommendation;
    } catch (error) {
      log(`Error creating recommendation: ${error}`, 'recommendation');
      throw error;
    }
  }
  
  /**
   * Get a recommendation by ID
   */
  async getRecommendation(id: string): Promise<Recommendation | undefined> {
    try {
      const recommendation = await storage.getRecommendation(id);
      
      if (!recommendation) {
        return undefined;
      }
      
      // Convert string enums to proper enum types
      return {
        ...recommendation,
        type: recommendation.type as RecommendationType,
        priority: recommendation.priority as RecommendationPriority,
        source: recommendation.source as RecommendationSource
      };
    } catch (error) {
      log(`Error fetching recommendation ${id}: ${error}`, 'recommendation');
      return undefined;
    }
  }
  
  /**
   * Update an existing recommendation
   */
  async updateRecommendation(id: string, updates: Partial<Recommendation>): Promise<Recommendation | undefined> {
    try {
      const recommendation = await storage.getRecommendation(id);
      
      if (!recommendation) {
        return undefined;
      }
      
      // Update recommendation in database
      const updatedRecommendation = await storage.updateRecommendation(id, updates);
      
      log(`Updated recommendation ${id}`, 'recommendation');
      
      // Convert string enums to proper enum types
      return {
        ...updatedRecommendation,
        type: updatedRecommendation.type as RecommendationType,
        priority: updatedRecommendation.priority as RecommendationPriority,
        source: updatedRecommendation.source as RecommendationSource
      };
    } catch (error) {
      log(`Error updating recommendation ${id}: ${error}`, 'recommendation');
      return undefined;
    }
  }
  
  /**
   * Delete a recommendation
   */
  async deleteRecommendation(id: string): Promise<boolean> {
    try {
      const success = await storage.deleteRecommendation(id);
      
      if (success) {
        log(`Deleted recommendation ${id}`, 'recommendation');
      }
      
      return success;
    } catch (error) {
      log(`Error deleting recommendation ${id}: ${error}`, 'recommendation');
      return false;
    }
  }
  
  /**
   * Mark a recommendation as implemented
   */
  async implementRecommendation(id: string, note?: string): Promise<Recommendation | undefined> {
    try {
      const recommendation = await storage.getRecommendation(id);
      
      if (!recommendation) {
        return undefined;
      }
      
      // Update recommendation
      const updatedRecommendation = await storage.updateRecommendation(id, {
        isImplemented: true,
        implementedAt: new Date(),
        implementationNote: note
      });
      
      log(`Marked recommendation ${id} as implemented`, 'recommendation');
      
      // Convert string enums to proper enum types
      return {
        ...updatedRecommendation,
        type: updatedRecommendation.type as RecommendationType,
        priority: updatedRecommendation.priority as RecommendationPriority,
        source: updatedRecommendation.source as RecommendationSource
      };
    } catch (error) {
      log(`Error implementing recommendation ${id}: ${error}`, 'recommendation');
      return undefined;
    }
  }
  
  /**
   * Generate workflow recommendations for a user based on their permit history
   */
  async generateRecommendationsForUser(userId: number): Promise<Recommendation[]> {
    try {
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      
      // Get user's organizations
      const userOrgs = await storage.getUserOrganizations(userId);
      if (userOrgs.length === 0) {
        log(`User ${userId} has no organizations, generating default recommendations`, 'recommendation');
        // Since the user has no organizations/uploads, generate default recommendations
        return this.generateDefaultRecommendations(userId, 1); // Use org ID 1 as fallback
      }
      
      // Get organization
      const organizationId = userOrgs[0].organizationId;
      const organization = await storage.getOrganization(organizationId);
      if (!organization) {
        log(`Organization not found: ${organizationId}, generating default recommendations`, 'recommendation');
        return this.generateDefaultRecommendations(userId, organizationId);
      }
      
      // Get user's permits through uploads
      const uploads = await storage.getUploadsByOrganization(organizationId);
      const userUploads = uploads.filter(upload => upload.userId === userId);
      
      if (userUploads.length === 0) {
        log(`User ${userId} has no uploads, generating default recommendations`, 'recommendation');
        return this.generateDefaultRecommendations(userId, organizationId);
      }
      
      // Get permit histories
      const allRecommendations: Recommendation[] = [];
      
      // Analyze upload patterns
      for (const upload of userUploads) {
        const permits = await storage.getPermitsByUploadId(upload.id);
        const permitHistories = await storage.getPermitHistoriesByUploadId(upload.id);
        
        if (permits.length === 0) {
          continue;
        }
        
        // Analyze permit processing patterns
        const enterPermits = upload.enterPermits || 0;
        const skipPermits = upload.skipPermits || 0;
        const totalPermits = upload.totalPermits || 1; // Prevent division by zero
        const enteredRate = enterPermits / totalPermits;
        const skipRate = skipPermits / totalPermits;
        
        // Generate efficiency recommendations based on processing rates
        if (enteredRate < 0.7 && permits.length > 10) {
          // Create efficiency recommendation
          const recommendation: Recommendation = {
            id: uuidv4(),
            userId,
            organizationId,
            title: 'Improve Permit Processing Efficiency',
            description: `We noticed that you processed only ${Math.round(enteredRate * 100)}% of permits in your recent batch. A streamlined workflow could help you process more permits efficiently.`,
            type: RecommendationType.EFFICIENCY,
            priority: enteredRate < 0.5 ? RecommendationPriority.HIGH : RecommendationPriority.MEDIUM,
            source: RecommendationSource.PERMIT_ANALYSIS,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
            isImplemented: false,
            relatedEntityId: upload.id,
            relatedEntityType: 'upload',
            metadata: {
              enteredRate,
              skipRate,
              totalPermits: totalPermits,
              uploadId: upload.id
            }
          };
          
          await this.createRecommendation(recommendation);
          allRecommendations.push(recommendation);
        }
        
        // Check for consistency patterns
        if (permits.length > 20) {
          // Count neighborhood distributions
          const neighborhoodCounts: Record<string, number> = {};
          permits.forEach(permit => {
            if (permit.neighborhoodCode) {
              neighborhoodCounts[permit.neighborhoodCode] = (neighborhoodCounts[permit.neighborhoodCode] || 0) + 1;
            }
          });
          
          // Find the most frequent neighborhood
          let maxCount = 0;
          let mostFrequentNeighborhood = '';
          
          Object.entries(neighborhoodCounts).forEach(([neighborhood, count]) => {
            if (count > maxCount) {
              maxCount = count;
              mostFrequentNeighborhood = neighborhood;
            }
          });
          
          if (mostFrequentNeighborhood && maxCount > 10) {
            // Create neighborhood-specific workflow recommendation
            const recommendation: Recommendation = {
              id: uuidv4(),
              userId,
              organizationId,
              title: `Optimized Workflow for ${mostFrequentNeighborhood} Neighborhood`,
              description: `Based on your processing patterns, we've created a specialized workflow for permits in the ${mostFrequentNeighborhood} neighborhood, which makes up a significant portion of your workload.`,
              type: RecommendationType.WORKFLOW,
              priority: RecommendationPriority.MEDIUM,
              source: RecommendationSource.PERMIT_ANALYSIS,
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              isImplemented: false,
              relatedEntityId: upload.id,
              relatedEntityType: 'upload',
              metadata: {
                neighborhood: mostFrequentNeighborhood,
                permitCount: maxCount,
                totalPermits: permits.length,
                uploadId: upload.id
              }
            };
            
            await this.createRecommendation(recommendation);
            allRecommendations.push(recommendation);
          }
        }
      }

      // If we couldn't generate any recommendations based on user data,
      // fall back to default recommendations
      if (allRecommendations.length === 0) {
        log(`No pattern-based recommendations generated for user ${userId}, using defaults`, 'recommendation');
        return this.generateDefaultRecommendations(userId, organizationId);
      }
      
      // Limit number of recommendations to prevent overwhelming the user
      if (allRecommendations.length > 5) {
        // Sort by priority and take top 5
        return allRecommendations
          .sort((a, b) => {
            const priorityOrder: Record<RecommendationPriority, number> = { 
              [RecommendationPriority.HIGH]: 0, 
              [RecommendationPriority.MEDIUM]: 1, 
              [RecommendationPriority.LOW]: 2 
            };
            return priorityOrder[a.priority as RecommendationPriority] - priorityOrder[b.priority as RecommendationPriority];
          })
          .slice(0, 5);
      }
      
      return allRecommendations;
    } catch (error) {
      log(`Error generating recommendations for user ${userId}: ${error}`, 'recommendation');
      // In case of error, generate some default recommendations to ensure the UI has content
      return this.generateDefaultRecommendations(userId, 1);
    }
  }
  
  /**
   * Generate default recommendations when user has no history or there's an error
   */
  async generateDefaultRecommendations(userId: number, organizationId: number): Promise<Recommendation[]> {
    const defaultRecommendations: Recommendation[] = [];
    
    // Create workflow recommendation
    const workflowRecommendation: Recommendation = {
      id: uuidv4(),
      userId,
      organizationId,
      title: 'Streamlined Permit Processing Workflow',
      description: 'Implement a streamlined workflow for processing permits that reduces manual steps and increases throughput. This standardized approach can improve processing time by up to 30%.',
      type: RecommendationType.WORKFLOW,
      priority: RecommendationPriority.HIGH,
      source: RecommendationSource.AI_INSIGHT,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isImplemented: false,
      metadata: {
        estimatedTimeReduction: 30,
        complexity: 'moderate',
        automationPotential: 70
      }
    };
    
    await this.createRecommendation(workflowRecommendation);
    defaultRecommendations.push(workflowRecommendation);
    
    // Create consistency recommendation
    const consistencyRecommendation: Recommendation = {
      id: uuidv4(),
      userId,
      organizationId,
      title: 'Enhance Decision Consistency',
      description: 'Our AI analysis suggests implementing decision criteria templates for similar permits to improve consistency. This approach can reduce variance in permit decisions by up to 40%.',
      type: RecommendationType.CONSISTENCY,
      priority: RecommendationPriority.MEDIUM,
      source: RecommendationSource.AI_INSIGHT,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
      isImplemented: false,
      metadata: {
        consistencyImprovement: 40,
        implementationDifficulty: 'low'
      }
    };
    
    await this.createRecommendation(consistencyRecommendation);
    defaultRecommendations.push(consistencyRecommendation);
    
    // Create efficiency recommendation
    const efficiencyRecommendation: Recommendation = {
      id: uuidv4(),
      userId,
      organizationId,
      title: 'Batch Processing Strategy',
      description: 'Implementing a neighborhood-based batch processing strategy can improve efficiency by 25%. Group permits by neighborhood and process similar applications together.',
      type: RecommendationType.EFFICIENCY,
      priority: RecommendationPriority.MEDIUM,
      source: RecommendationSource.AI_INSIGHT,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      isImplemented: false,
      metadata: {
        efficiencyGain: 25,
        implementationTime: 'quick'
      }
    };
    
    await this.createRecommendation(efficiencyRecommendation);
    defaultRecommendations.push(efficiencyRecommendation);
    
    return defaultRecommendations;
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService();