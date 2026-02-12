// Shared schema definitions for TerraFusion Sync
import { z } from 'zod';

export interface File {
  id: string;
  name: string;
  type: string;
  size: number;
  path?: string;
  content?: string;
  metadata?: Record<string, any>;
  aiSummary?: string;
  category?: string;
  tags?: string[];
  createdAt?: string;
  modifiedAt?: string;
  processingStatus?: {
    status: string;
    progress: number;
  };
}

export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'cloud';
  config: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}

// Zod schemas for validation
export const insertDataSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(['database', 'api', 'file', 'cloud']),
  config: z.record(z.string(), z.any()).optional().default({}),
});

export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;

export const sqlConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive(),
  database: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
});

export const apiConfigSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
  headers: z.record(z.string(), z.string()).optional(),
  authentication: z.object({
    type: z.enum(['none', 'basic', 'bearer', 'api-key']),
    credentials: z.record(z.string(), z.string()).optional(),
  }).optional(),
});

export const cloudStorageConfigSchema = z.object({
  provider: z.enum(['aws', 'gcp', 'azure']),
  region: z.string().min(1),
  bucket: z.string().min(1),
  accessKey: z.string().min(1),
  secretKey: z.string().min(1),
});

export interface SyncJob {
  id: string;
  name: string;
  sourceId: string;
  destinationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'readonly';
  preferences?: Record<string, any>;
  createdAt: string;
  lastLogin?: string;
}
