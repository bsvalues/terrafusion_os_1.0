/**
 * CostForge API Types
 *
 * Plain TypeScript interfaces matching TerraFusion .NET API DTOs.
 * Replaced the dead Drizzle ORM schema from the old Express server.
 *
 * These types are used by legacy dashboard components that have not yet
 * been wired to the .NET API. Components using these types call Express
 * routes that no longer exist — wire them to the real API before relying
 * on the data shapes defined here.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  username: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string | null;
  preferences?: { theme?: string; notifications?: boolean } | null;
}

export const insertUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().optional(),
  profileImageUrl: z.string().optional(),
  role: z.string().default('user'),
  isActive: z.boolean().default(true),
  preferences: z.object({ theme: z.string().optional(), notifications: z.boolean().optional() }).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// ---------------------------------------------------------------------------
// Cost Matrix
// ---------------------------------------------------------------------------

export interface CostMatrix {
  id: number;
  buildingType: string;
  revalArea: string;
  year: number;
  baseRate: number;
  description?: string | null;
  sourceMatrixId?: number | null;
  buildingTypeDescription?: string | null;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean | null;
  complexityFactorBase?: number | null;
  qualityFactorBase?: number | null;
  conditionFactorBase?: number | null;
  dataPoints?: number | null;
  minCost?: number | null;
  maxCost?: number | null;
  county?: string | null;
  state?: string | null;
}

// ---------------------------------------------------------------------------
// Calculations / History
// ---------------------------------------------------------------------------

export interface Calculation {
  id: number;
  userId?: string | null;
  name?: string | null;
  squareFootage?: number | null;
  createdAt?: string | null;
  buildingType?: string | null;
  assessedValue?: string | null;
  baseCost?: string | null;
  costPerSqft?: string | null;
  totalCost?: string | null;
  quality?: string | null;
  complexity?: string | null;
  revalArea?: string | null;
  revalAreaFactor?: string | null;
  parameters?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// API Endpoints (ApiManager component)
// ---------------------------------------------------------------------------

export interface ApiEndpoint {
  id: number;
  name: string;
  url: string;
  path: string;
  method: string;
  status: string;
  requiresAuth?: boolean;
  description?: string;
}

export type InsertApiEndpoint = Omit<ApiEndpoint, 'id'>;

// ---------------------------------------------------------------------------
// Building Costs
// ---------------------------------------------------------------------------

export interface BuildingCost {
  id: number;
  buildingType: string;
  costPerSqFt: number;
  revalArea: string;
}

export type InsertBuildingCost = Omit<BuildingCost, 'id'>;

// ---------------------------------------------------------------------------
// Cost Factors
// ---------------------------------------------------------------------------

export interface CostFactorPreset {
  id: number;
  name: string;
  factors: Record<string, number>;
}

export interface CostFactor {
  id: number;
  name: string;
  value: number;
  type: string;
}

export type InsertCostFactor = Omit<CostFactor, 'id'>;

// ---------------------------------------------------------------------------
// File Uploads
// ---------------------------------------------------------------------------

export interface FileUpload {
  id: number;
  fileId: string;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: string;
  uploadedBy?: string | null;
  uploadedAt: string;
  associatedEntity?: string | null;
  associatedEntityId?: string | null;
  isPublic?: string | null;
  description?: string | null;
  status: string;
  processedItems?: string | null;
  totalItems?: string | null;
  errorCount?: string | null;
}

export const insertFileUploadSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  filePath: z.string().min(1),
  fileSize: z.string(),
  uploadedBy: z.string().optional(),
  associatedEntity: z.string().optional(),
  associatedEntityId: z.string().optional(),
  isPublic: z.string().optional(),
  description: z.string().optional(),
  status: z.string().default('uploaded'),
  processedItems: z.string().optional(),
  totalItems: z.string().optional(),
  errorCount: z.string().optional(),
});

export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;
