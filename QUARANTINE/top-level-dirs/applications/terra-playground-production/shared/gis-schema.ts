import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  json,
  boolean,
  uuid,
  unique,
} from 'drizzle-orm/pg-core';

// GIS Agent Task table
export const gisAgentTasks = pgTable('gis_agent_tasks', {
  id: serial('id').primaryKey(),
  taskType: varchar('task_type', { length: 50 }).notNull(),
  agentType: varchar('agent_type', { length: 50 }).notNull(),
  agentId: varchar('agent_id', { length: 255 }),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  priority: integer('priority').default(1),
  data: json('data'),
  result: json('result'),
  error: text('error'),
  startTime: timestamp('start_time').defaultNow(),
  endTime: timestamp('end_time'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: integer('user_id'),
  metadata: json('metadata'),
});

// Agent Message table for GIS agents
export const agentMessages: any = pgTable('agent_messages', {
  id: serial('id').primaryKey(),
  agentId: varchar('agent_id', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  content: text('content').notNull(),
  parentId: integer('parent_id').references(() => agentMessages.id),
  metadata: json('metadata'),
  timestamp: timestamp('timestamp').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Spatial layers table for GIS data
export const spatialLayers = pgTable('spatial_layers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(),
  source: varchar('source', { length: 255 }),
  format: varchar('format', { length: 50 }),
  spatialReference: varchar('spatial_reference', { length: 50 }).default('EPSG:4326'),
  metadata: json('metadata'),
  isVisible: boolean('is_visible').default(true),
  isActive: boolean('is_active').default(true),
  style: json('style'),
  minZoom: integer('min_zoom'),
  maxZoom: integer('max_zoom'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: integer('user_id'),
  properties: json('properties'),
});

// Spatial features table for GIS data
export const spatialFeatures = pgTable(
  'spatial_features',
  {
    id: serial('id').primaryKey(),
    layerId: integer('layer_id')
      .references(() => spatialLayers.id)
      .notNull(),
    featureId: varchar('feature_id', { length: 255 }).notNull(),
    geometry: json('geometry').notNull(),
    properties: json('properties'),
    boundingBox: json('bounding_box'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    createdBy: integer('created_by'),
    updatedBy: integer('updated_by'),
  },
  table => {
    return {
      featureLayerUnique: unique().on(table.layerId, table.featureId),
    };
  }
);

// Spatial events table for tracking changes in GIS data
export const spatialEvents = pgTable('spatial_events', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(),
  layerId: integer('layer_id').references(() => spatialLayers.id),
  featureId: varchar('feature_id', { length: 255 }),
  userId: integer('user_id'),
  details: json('details'),
  timestamp: timestamp('timestamp').defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  sessionId: varchar('session_id', { length: 255 }),
  metadata: json('metadata'),
});

// GIS conversion jobs for tracking schema and data format conversions
export const gisConversionJobs = pgTable('gis_conversion_jobs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  sourceFormat: varchar('source_format', { length: 50 }).notNull(),
  targetFormat: varchar('target_format', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  progress: integer('progress').default(0),
  sourceSchema: json('source_schema'),
  targetSchema: json('target_schema'),
  conversionMappings: json('conversion_mappings'),
  warnings: json('warnings'),
  errors: json('errors'),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: integer('user_id'),
  metadata: json('metadata'),
});

// GIS layers for map visualization
export const gisLayers = pgTable('gis_layers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(),
  source: varchar('source', { length: 255 }),
  format: varchar('format', { length: 50 }),
  url: text('url'),
  apiKey: varchar('api_key', { length: 255 }),
  spatialReference: varchar('spatial_reference', { length: 50 }).default('EPSG:4326'),
  attribution: text('attribution'),
  metadata: json('metadata'),
  style: json('style'),
  isVisible: boolean('is_visible').default(true),
  isBasemap: boolean('is_basemap').default(false),
  minZoom: integer('min_zoom'),
  maxZoom: integer('max_zoom'),
  opacity: integer('opacity').default(100),
  zIndex: integer('z_index').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: integer('user_id'),
});

// GIS feature collections for storing geospatial data
export const gisFeatureCollections = pgTable('gis_feature_collections', {
  id: serial('id').primaryKey(),
  layerId: integer('layer_id')
    .references(() => gisLayers.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  featureType: varchar('feature_type', { length: 50 }).notNull(),
  features: json('features').notNull(),
  properties: json('properties'),
  bbox: json('bbox'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: integer('user_id'),
});

// GIS map projects for saving user map configurations
export const gisMapProjects = pgTable('gis_map_projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  center: json('center').notNull(), // [longitude, latitude]
  zoom: integer('zoom').notNull(),
  layers: json('layers').notNull(), // Array of layer IDs with visibility settings
  basemap: varchar('basemap', { length: 50 }).notNull().default('streets'),
  settings: json('settings'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: integer('user_id').notNull(),
});

// ETL Jobs for data extraction, transformation, and loading
export const etlJobs = pgTable('etl_jobs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  type: varchar('type', { length: 50 }).notNull(),
  sourceType: varchar('source_type', { length: 50 }).notNull(),
  sourceConfig: json('source_config').notNull(),
  targetType: varchar('target_type', { length: 50 }).notNull(),
  targetConfig: json('target_config').notNull(),
  transformConfig: json('transform_config'),
  progress: integer('progress').default(0),
  logMessages: json('log_messages'),
  errors: json('errors'),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: integer('user_id'),
  metadata: json('metadata'),
});

// Define Zod schemas for validation
export const insertGISAgentTaskSchema = createInsertSchema(gisAgentTasks, {
  taskType: z.string().min(1),
  agentType: z.string().min(1),
  data: z.any().optional(),
  priority: z.number().int().min(1).max(10).optional(),
  metadata: z.any().optional(),
});

export const insertAgentMessageSchema = createInsertSchema(agentMessages, {
  agentId: z.string().min(1),
  type: z.enum(['INFO', 'WARNING', 'ERROR']),
  content: z.string().min(1),
  parentId: z.number().int().positive().optional(),
  metadata: z.any().optional(),
});

export const insertSpatialLayerSchema = createInsertSchema(spatialLayers, {
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  source: z.string().optional(),
  format: z.string().optional(),
  spatialReference: z.string().optional(),
  metadata: z.any().optional(),
  isVisible: z.boolean().optional(),
  isActive: z.boolean().optional(),
  style: z.any().optional(),
  minZoom: z.number().int().min(0).max(22).optional(),
  maxZoom: z.number().int().min(0).max(22).optional(),
  properties: z.any().optional(),
});

export const insertSpatialFeatureSchema = createInsertSchema(spatialFeatures, {
  layerId: z.number().int().positive(),
  featureId: z.string().min(1),
  geometry: z.any().refine(val => val.type && val.coordinates, {
    message: 'Geometry must have type and coordinates fields',
  }),
  properties: z.any().optional(),
  boundingBox: z.any().optional(),
});

export const insertSpatialEventSchema = createInsertSchema(spatialEvents, {
  type: z.string().min(1),
  layerId: z.number().int().positive().optional(),
  featureId: z.string().optional(),
  userId: z.number().int().positive().optional(),
  details: z.any().optional(),
  ipAddress: z.string().optional(),
  sessionId: z.string().optional(),
  metadata: z.any().optional(),
});

export const insertGISConversionJobSchema = createInsertSchema(gisConversionJobs, {
  name: z.string().min(1),
  description: z.string().optional(),
  sourceFormat: z.string().min(1),
  targetFormat: z.string().min(1),
  sourceSchema: z.any().optional(),
  targetSchema: z.any().optional(),
  conversionMappings: z.any().optional(),
  metadata: z.any().optional(),
});

// Schema for GIS layers
export const insertGISLayerSchema = createInsertSchema(gisLayers, {
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string().min(1),
  source: z.string().optional(),
  format: z.string().optional(),
  url: z.string().optional(),
  apiKey: z.string().optional(),
  spatialReference: z.string().optional(),
  attribution: z.string().optional(),
  metadata: z.any().optional(),
  style: z.any().optional(),
  isVisible: z.boolean().optional(),
  isBasemap: z.boolean().optional(),
  minZoom: z.number().int().min(0).max(22).optional(),
  maxZoom: z.number().int().min(0).max(22).optional(),
  opacity: z.number().int().min(0).max(100).optional(),
  zIndex: z.number().int().optional(),
});

// Schema for GIS feature collections
export const insertGISFeatureCollectionSchema = createInsertSchema(gisFeatureCollections, {
  layerId: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().optional(),
  featureType: z.string().min(1),
  features: z.any().refine(val => Array.isArray(val), {
    message: 'Features must be an array',
  }),
  properties: z.any().optional(),
  bbox: z.any().optional(),
});

// Schema for GIS map projects
export const insertGISMapProjectSchema = createInsertSchema(gisMapProjects, {
  name: z.string().min(1),
  description: z.string().optional(),
  center: z
    .array(z.number())
    .length(2)
    .refine(val => val[0] >= -180 && val[0] <= 180 && val[1] >= -90 && val[1] <= 90, {
      message: 'Center must be valid [longitude, latitude] coordinates',
    }),
  zoom: z.number().int().min(0).max(22),
  layers: z.array(
    z.object({
      id: z.number().int().positive(),
      visible: z.boolean().optional(),
    })
  ),
  basemap: z.string().min(1),
  settings: z.any().optional(),
  isPublic: z.boolean().optional(),
});

// Schema for ETL jobs
export const insertETLJobSchema = createInsertSchema(etlJobs, {
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string().min(1),
  sourceType: z.string().min(1),
  sourceConfig: z.any().refine(val => val !== null, {
    message: 'Source configuration cannot be null',
  }),
  targetType: z.string().min(1),
  targetConfig: z.any().refine(val => val !== null, {
    message: 'Target configuration cannot be null',
  }),
  transformConfig: z.any().optional(),
  metadata: z.any().optional(),
});

// Export types for use in the application
export type GISAgentTask = typeof gisAgentTasks.$inferSelect;
export type InsertGISAgentTask = z.infer<typeof insertGISAgentTaskSchema>;

export type AgentMessage = typeof agentMessages.$inferSelect;
export type InsertAgentMessage = z.infer<typeof insertAgentMessageSchema>;

export type SpatialLayer = typeof spatialLayers.$inferSelect;
export type InsertSpatialLayer = z.infer<typeof insertSpatialLayerSchema>;

export type SpatialFeature = typeof spatialFeatures.$inferSelect;
export type InsertSpatialFeature = z.infer<typeof insertSpatialFeatureSchema>;

export type SpatialEvent = typeof spatialEvents.$inferSelect;
export type InsertSpatialEvent = z.infer<typeof insertSpatialEventSchema>;

export type GISConversionJob = typeof gisConversionJobs.$inferSelect;
export type InsertGISConversionJob = z.infer<typeof insertGISConversionJobSchema>;

export type GISLayer = typeof gisLayers.$inferSelect;
export type InsertGISLayer = z.infer<typeof insertGISLayerSchema>;

export type GISFeatureCollection = typeof gisFeatureCollections.$inferSelect;
export type InsertGISFeatureCollection = z.infer<typeof insertGISFeatureCollectionSchema>;

export type GISMapProject = typeof gisMapProjects.$inferSelect;
export type InsertGISMapProject = z.infer<typeof insertGISMapProjectSchema>;

export type ETLJob = typeof etlJobs.$inferSelect;
export type InsertETLJob = z.infer<typeof insertETLJobSchema>;

// Export enums for use in the application
export enum AgentTaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}
