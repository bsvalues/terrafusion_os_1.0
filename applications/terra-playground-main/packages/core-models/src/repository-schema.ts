import { z } from 'zod';

/**
 * Repository Schema Definitions
 * This file contains schema definitions for repositories in the Terrafusion platform.
 */

// Base repository schema
export const repositorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  owner: z.string().uuid(),
  visibility: z.enum(['public', 'private', 'organization']),
  createdAt: z.date(),
  updatedAt: z.date(),
  stars: z.number().int().nonnegative().default(0),
  forks: z.number().int().nonnegative().default(0),
  tags: z.array(z.string()).default([]),
});

export type Repository = z.infer<typeof repositorySchema>;

// Repository version schema
export const repositoryVersionSchema = z.object({
  id: z.string().uuid(),
  repositoryId: z.string().uuid(),
  version: z.string().regex(/^v\d+\.\d+\.\d+$/),
  commitHash: z.string().length(40),
  releaseNotes: z.string().max(1000).optional(),
  createdAt: z.date(),
  isVerified: z.boolean().default(false),
  downloads: z.number().int().nonnegative().default(0),
  isLatest: z.boolean().default(false),
  isCompatible: z.boolean().default(true),
});

export type RepositoryVersion = z.infer<typeof repositoryVersionSchema>;

// Repository feedback schema
export const repositoryFeedbackSchema = z.object({
  id: z.string().uuid(),
  repositoryId: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  createdAt: z.date(),
});

export type RepositoryFeedback = z.infer<typeof repositoryFeedbackSchema>;

// Repository statistics schema
export const repositoryStatisticsSchema = z.object({
  id: z.string().uuid(),
  repositoryId: z.string().uuid(),
  downloads: z.number().int().nonnegative().default(0),
  views: z.number().int().nonnegative().default(0),
  uniqueUsers: z.number().int().nonnegative().default(0),
  averageRating: z.number().min(0).max(5).optional(),
  lastUpdated: z.date(),
});

export type RepositoryStatistics = z.infer<typeof repositoryStatisticsSchema>;

// Repository category schema
export const repositoryCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  parentId: z.string().uuid().optional(),
  displayOrder: z.number().int().nonnegative().default(0),
});

export type RepositoryCategory = z.infer<typeof repositoryCategorySchema>;

// Repository-category relationship schema
export const repositoryCategoryRelationSchema = z.object({
  repositoryId: z.string().uuid(),
  categoryId: z.string().uuid(),
});

export type RepositoryCategoryRelation = z.infer<typeof repositoryCategoryRelationSchema>;

// Insert schemas (for use with forms and API endpoints)
export const repositoryInsertSchema = repositorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stars: true,
  forks: true,
});

export const repositoryVersionInsertSchema = repositoryVersionSchema.omit({
  id: true,
  createdAt: true,
  isVerified: true,
  downloads: true,
});

export const repositoryFeedbackInsertSchema = repositoryFeedbackSchema.omit({
  id: true,
  createdAt: true,
});

// Export types for inserts
export type RepositoryInsert = z.infer<typeof repositoryInsertSchema>;
export type RepositoryVersionInsert = z.infer<typeof repositoryVersionInsertSchema>;
export type RepositoryFeedbackInsert = z.infer<typeof repositoryFeedbackInsertSchema>;
