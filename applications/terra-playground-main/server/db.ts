import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema';
import * as gisSchema from '../shared/gis-schema';

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

// Validate database URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

// Configure PostgreSQL connection
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Merge all schemas
const mergedSchema = { ...schema, ...gisSchema };

// Initialize Drizzle with the pool
export const db = drizzle(pool, { schema: mergedSchema });

// Export specific schemas for type safety and autocomplete
export const gisLayersTable = gisSchema.gisLayers;
export const gisFeatureCollectionsTable = gisSchema.gisFeatureCollections;
export const gisMapProjectsTable = gisSchema.gisMapProjects;
export const etlJobsTable = gisSchema.etlJobs;
export const gisAgentTasksTable = gisSchema.gisAgentTasks;
export const agentMessagesTable = gisSchema.agentMessages;
export const spatialEventsTable = gisSchema.spatialEvents;
