/**
 * Terrafusion Shared Schema
 * 
 * This file defines the data models and interfaces used across
 * the Terrafusion application ecosystem.
 */

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  assessedValue: number;
  yearBuilt: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  hasGarage: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LevyCalculation {
  propertyId: string;
  amount: number;
  taxYear: number;
  assessmentDate: Date;
  calculatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  publisher: string;
  iconUrl: string; 
  entryPoint: string;
  dependencies: string[];
  tags: string[];
  category: PluginCategory;
  installCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum PluginCategory {
  WORKFLOW = 'workflow',
  INTEGRATION = 'integration',
  VISUALIZATION = 'visualization',
  ANALYSIS = 'analysis',
  UTILITY = 'utility'
}

export interface AnalysisResult {
  id: string;
  analysisType: string;
  targetEntity: string;
  targetEntityId: string;
  result: any; // This is intentionally 'any' to support different result structures
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface WorkflowPattern {
  id: string;
  name: string;
  description: string;
  templateStructure: any; // This is intentionally 'any' for template flexibility
  applicableScenarios: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncOperation {
  id: string;
  sourceSystem: string;
  targetSystem: string;
  status: SyncStatus;
  startedAt: Date;
  completedAt?: Date;
  dataCount: number;
  errorCount: number;
  logs: string[];
}

export enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}