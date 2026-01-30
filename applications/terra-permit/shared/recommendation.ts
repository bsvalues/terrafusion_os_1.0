/**
 * Workflow Recommendation Engine Interfaces
 * 
 * This module defines the interfaces and types for the personalized
 * workflow recommendation engine.
 */

import { z } from "zod";

// Import enums from schema
import { 
  RecommendationType,
  RecommendationPriority,
  RecommendationSource
} from './schema';

// Re-export enums from schema for backward compatibility
export { 
  RecommendationType,
  RecommendationPriority,
  RecommendationSource
};

// Recommendation schema
export const recommendationSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.number(),
  organizationId: z.number(),
  title: z.string(),
  description: z.string(),
  type: z.nativeEnum(RecommendationType),
  priority: z.nativeEnum(RecommendationPriority),
  source: z.nativeEnum(RecommendationSource),
  createdAt: z.date().optional(),
  expiresAt: z.date().optional(),
  isImplemented: z.boolean().default(false),
  implementedAt: z.date().optional(),
  implementationNote: z.string().optional(),
  relatedEntityId: z.number().optional(), // Could be a permit ID, upload ID, etc.
  relatedEntityType: z.string().optional(), // 'permit', 'upload', 'workflow', etc.
  actionUrl: z.string().optional(), // URL for taking action on the recommendation
  metadata: z.record(z.unknown()).optional() // Additional data specific to recommendation type
});

export type Recommendation = z.infer<typeof recommendationSchema>;

// Workflow recommendation specifics
export interface WorkflowRecommendation extends Recommendation {
  metadata: {
    workflowId: string;
    estimatedTimeReduction: number; // in minutes
    successRate: number; // percentage of successful outcomes
    complexity: 'simple' | 'moderate' | 'complex';
    requiredSteps: string[];
    automationPotential: number; // 0-100 score
    precedingActions: string[];
  };
}

// User behavior patterns for recommendation generation
export interface UserBehaviorPattern {
  userId: number;
  pattern: string;
  frequency: number;
  lastObserved: Date;
  associatedOutcomes: {
    type: string;
    success: boolean;
    timeSpent: number;
  }[];
}

// Recommendation engine options
export interface RecommendationEngineOptions {
  minConfidenceThreshold: number; // 0-1 score, minimum confidence to generate recommendation
  maxRecommendationsPerUser: number;
  refreshInterval: number; // in milliseconds
  considerUserHistory: boolean;
  preferenceWeight: number; // 0-1, weight given to user preferences vs. global patterns
  useMachineLearning: boolean;
}