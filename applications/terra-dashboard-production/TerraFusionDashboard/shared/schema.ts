import { pgTable, text, serial, integer, boolean, timestamp, uuid, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").default("user"),
  countyId: text("county_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Properties table
export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  parcelId: text("parcel_id").notNull().unique(),
  address: text("address").notNull(),
  ownerName: text("owner_name"),
  assessedValue: decimal("assessed_value", { precision: 12, scale: 2 }),
  marketValue: decimal("market_value", { precision: 12, scale: 2 }),
  landValue: decimal("land_value", { precision: 12, scale: 2 }),
  improvementValue: decimal("improvement_value", { precision: 12, scale: 2 }),
  squareFootage: integer("square_footage"),
  yearBuilt: integer("year_built"),
  propertyType: text("property_type"),
  coordinates: jsonb("coordinates"), // {lat, lng}
  countyName: text("county_name").notNull(),
  active: boolean("active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales Comparables table
export const salesComparables = pgTable("sales_comparables", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: text("property_id").notNull(),
  salePrice: decimal("sale_price", { precision: 12, scale: 2 }).notNull(),
  saleDate: timestamp("sale_date").notNull(),
  deedType: text("deed_type"),
  verified: boolean("verified").default(false),
  adjustments: jsonb("adjustments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Agents table
export const aiAgents = pgTable("ai_agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull(), // cost-analysis, exemption-seer, narrator-ai, etc.
  status: text("status").default("active"), // active, inactive, error
  description: text("description"),
  capabilities: jsonb("capabilities"), // array of capability strings
  config: jsonb("config"), // agent-specific configuration
  endpoint: text("endpoint"), // API endpoint for agent communication
  healthStatus: text("health_status").default("unknown"), // healthy, degraded, unhealthy, unknown
  lastHeartbeat: timestamp("last_heartbeat"),
  activeTasks: integer("active_tasks").default(0),
  maxConcurrentTasks: integer("max_concurrent_tasks").default(5),
  lastRunAt: timestamp("last_run_at"),
  jobCount: integer("job_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent Jobs table
export const agentJobs = pgTable("agent_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id").references(() => aiAgents.id),
  propertyId: uuid("property_id").references(() => properties.id),
  status: text("status").default("pending"), // pending, running, completed, failed, cancelled, timeout
  jobType: text("job_type").notNull(),
  inputData: jsonb("input_data"),
  result: jsonb("result"),
  errorMessage: text("error_message"),
  priority: integer("priority").default(5), // 1-10, higher = more priority
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  timeoutSeconds: integer("timeout_seconds").default(300),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Counties table
export const counties = pgTable("counties", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  state: text("state").notNull(),
  status: text("status").default("active"), // active, setup, inactive
  customizations: jsonb("customizations"), // county-specific settings
  propertyCount: integer("property_count").default(0),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System Health table
export const systemHealth = pgTable("system_health", {
  id: uuid("id").primaryKey().defaultRandom(),
  service: text("service").notNull(), // terrafusion-sync, agent-orchestrator, etc.
  status: text("status").notNull(), // healthy, warning, error
  lastCheck: timestamp("last_check").defaultNow(),
  responseTime: integer("response_time"), // in milliseconds
  errorCount: integer("error_count").default(0),
  metadata: jsonb("metadata"),
});

// Audit Log table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableName: text("table_name").notNull(),
  recordId: uuid("record_id").notNull(),
  action: text("action").notNull(), // insert, update, delete, view
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  changedBy: uuid("changed_by"),
  changedAt: timestamp("changed_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  reason: text("reason"),
});

// Task Queue table for orchestration
export const taskQueue = pgTable("task_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskType: text("task_type").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").default("pending"), // pending, processing, completed, failed
  priority: integer("priority").default(5),
  maxRetries: integer("max_retries").default(3),
  retryCount: integer("retry_count").default(0),
  scheduledFor: timestamp("scheduled_for").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Infrastructure Assets table
export const infrastructureAssets = pgTable("infrastructure_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  assetId: text("asset_id").notNull().unique(),
  name: text("name").notNull(),
  assetType: text("asset_type").notNull(), // transportation, utilities, communications, etc.
  location: jsonb("location").notNull(), // {latitude, longitude}
  operationalStatus: text("operational_status").default("operational"),
  criticalityScore: decimal("criticality_score", { precision: 3, scale: 1 }).default("5.0"),
  lastInspection: timestamp("last_inspection").defaultNow(),
  maintenanceSchedule: jsonb("maintenance_schedule").default("[]"),
  dependencies: jsonb("dependencies").default("[]"), // Array of asset IDs
  realTimeMetrics: jsonb("real_time_metrics").default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Threat Assessments table
export const threatAssessments = pgTable("threat_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  threatId: text("threat_id").notNull().unique(),
  assetId: text("asset_id").notNull(),
  threatType: text("threat_type").notNull(),
  severity: text("severity").notNull(), // minimal, low, moderate, high, critical, catastrophic
  probability: decimal("probability", { precision: 3, scale: 2 }).notNull(),
  impactAssessment: jsonb("impact_assessment").notNull(),
  mitigationStrategies: jsonb("mitigation_strategies").default("[]"),
  detectedAt: timestamp("detected_at").defaultNow(),
  requiresImmediateAction: boolean("requires_immediate_action").default(false),
  automatedResponseTriggered: boolean("automated_response_triggered").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Simulation Requests table
export const simulationRequests = pgTable("simulation_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  simulationId: text("simulation_id").notNull().unique(),
  scenarioName: text("scenario_name").notNull(),
  assetIds: jsonb("asset_ids").notNull(), // Array of asset IDs
  simulationParameters: jsonb("simulation_parameters").notNull(),
  durationHours: decimal("duration_hours", { precision: 5, scale: 2 }).notNull(),
  priority: integer("priority").default(5),
  requestedBy: text("requested_by").notNull(),
  status: text("status").default("queued"), // queued, initializing, running, completed, failed, cancelled
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  results: jsonb("results"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const propertiesRelations = relations(properties, ({ many }) => ({
  agentJobs: many(agentJobs),
}));

export const countiesRelations = relations(counties, ({ many }) => ({
  properties: many(properties),
}));

export const aiAgentsRelations = relations(aiAgents, ({ many }) => ({
  jobs: many(agentJobs),
}));

export const agentJobsRelations = relations(agentJobs, ({ one }) => ({
  agent: one(aiAgents, {
    fields: [agentJobs.agentId],
    references: [aiAgents.id],
  }),
  property: one(properties, {
    fields: [agentJobs.propertyId],
    references: [properties.id],
  }),
}));

export const infrastructureAssetsRelations = relations(infrastructureAssets, ({ many }) => ({
  threatAssessments: many(threatAssessments),
}));

export const threatAssessmentsRelations = relations(threatAssessments, ({ one }) => ({
  asset: one(infrastructureAssets, {
    fields: [threatAssessments.assetId],
    references: [infrastructureAssets.assetId],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  countyId: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentJobSchema = createInsertSchema(agentJobs).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
});

export const insertInfrastructureAssetSchema = createInsertSchema(infrastructureAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertThreatAssessmentSchema = createInsertSchema(threatAssessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSimulationRequestSchema = createInsertSchema(simulationRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type AIAgent = typeof aiAgents.$inferSelect;
export type AgentJob = typeof agentJobs.$inferSelect;
export type InsertAgentJob = z.infer<typeof insertAgentJobSchema>;
export type County = typeof counties.$inferSelect;
export type SystemHealth = typeof systemHealth.$inferSelect;
export type InfrastructureAsset = typeof infrastructureAssets.$inferSelect;
export type InsertInfrastructureAsset = z.infer<typeof insertInfrastructureAssetSchema>;
export type ThreatAssessment = typeof threatAssessments.$inferSelect;
export type InsertThreatAssessment = z.infer<typeof insertThreatAssessmentSchema>;
export type SimulationRequest = typeof simulationRequests.$inferSelect;
export type InsertSimulationRequest = z.infer<typeof insertSimulationRequestSchema>;
