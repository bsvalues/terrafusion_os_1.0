import { pgTable, text, serial, integer, boolean, timestamp, numeric, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Import validation schema
import * as validationSchema from "./validation-schema";

// PILT-specific schemas for your actual data
export const exemptProperties = pgTable("exempt_properties", {
  id: serial("id").primaryKey(),
  year: text("year").notNull().default("2024"),
  propId: text("prop_id").notNull(),
  geoId: text("geo_id").notNull(),
  assessedValue: numeric("assessed_value").notNull(),
  marketValue: numeric("market_value").notNull(),
  exemptionType: text("exemption_type").notNull(),
  agUseValue: numeric("ag_use_value").default("0"),
  agMarket: numeric("ag_market").default("0"),
  agLoss: numeric("ag_loss").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExemptPropertySchema = createInsertSchema(exemptProperties).omit({
  id: true,
  createdAt: true,
});

// User schema for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  feedback: many(feedback),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Feedback schema
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  feedback: text("feedback").notNull(),
  privacy: boolean("privacy").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

export const insertFeedbackSchema = createInsertSchema(feedback).pick({
  name: true,
  email: true,
  feedback: true,
  privacy: true,
  userId: true,
});

// District schema for school districts, county, etc.
export const districts = pgTable("districts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "School", "Hospital", "County", "Port", etc.
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    nameTypeUnique: unique().on(table.name, table.type),
  };
});

export const districtsRelations = relations(districts, ({ many }) => ({
  landClassifications: many(landClassifications),
  levyRates: many(levyRates),
  distributions: many(distributions),
}));

export const insertDistrictSchema = createInsertSchema(districts).pick({
  name: true,
  type: true,
});

// Land classification schema
export const landClassifications = pgTable("land_classifications", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  classificationType: text("classification_type").notNull(), // "Irrigable Land", "Dryland", etc.
  acres: numeric("acres", { precision: 12, scale: 4 }).notNull(),
  valuePerAcre: numeric("value_per_acre", { precision: 12, scale: 2 }).notNull(),
  totalValue: numeric("total_value", { precision: 20, scale: 2 }).notNull(),
  districtId: integer("district_id").references(() => districts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const landClassificationsRelations = relations(landClassifications, ({ one }) => ({
  district: one(districts, {
    fields: [landClassifications.districtId],
    references: [districts.id],
  }),
}));

export const insertLandClassificationSchema = createInsertSchema(landClassifications).pick({
  year: true,
  classificationType: true,
  acres: true,
  valuePerAcre: true,
  totalValue: true,
  districtId: true,
});

// Levy rates schema
export const levyRates = pgTable("levy_rates", {
  id: serial("id").primaryKey(),
  year: text("year").notNull(),
  rate: numeric("rate", { precision: 10, scale: 7 }).notNull(),
  districtId: integer("district_id").references(() => districts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const levyRatesRelations = relations(levyRates, ({ one }) => ({
  district: one(districts, {
    fields: [levyRates.districtId],
    references: [districts.id],
  }),
}));

export const insertLevyRateSchema = createInsertSchema(levyRates).pick({
  year: true,
  rate: true,
  districtId: true,
});

// PILT history schema
export const piltReceipts = pgTable("pilt_receipts", {
  id: serial("id").primaryKey(),
  year: text("year").notNull().unique(),
  amount: integer("amount").notNull(),
  assessedValue: integer("assessed_value"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const piltReceiptsRelations = relations(piltReceipts, ({ many }) => ({
  distributions: many(distributions),
}));

export const insertPiltReceiptSchema = createInsertSchema(piltReceipts).pick({
  year: true,
  amount: true,
  assessedValue: true,
});

// Distribution schema
export const distributions = pgTable("distributions", {
  id: serial("id").primaryKey(),
  district: text("district").notNull(),
  amount: integer("amount").notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }),
  piltReceiptId: integer("pilt_receipt_id").references(() => piltReceipts.id, { onDelete: "cascade" }),
  districtId: integer("district_id").references(() => districts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const distributionsRelations = relations(distributions, ({ one }) => ({
  piltReceipt: one(piltReceipts, {
    fields: [distributions.piltReceiptId],
    references: [piltReceipts.id],
  }),
  district: one(districts, {
    fields: [distributions.districtId],
    references: [districts.id],
  }),
}));

export const insertDistributionSchema = createInsertSchema(distributions).pick({
  district: true,
  amount: true,
  percentage: true,
  piltReceiptId: true,
  districtId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedback.$inferSelect;

export type InsertDistrict = z.infer<typeof insertDistrictSchema>;
export type District = typeof districts.$inferSelect;

export type InsertLandClassification = z.infer<typeof insertLandClassificationSchema>;
export type LandClassification = typeof landClassifications.$inferSelect;

export type InsertLevyRate = z.infer<typeof insertLevyRateSchema>;
export type LevyRate = typeof levyRates.$inferSelect;

export type InsertPiltReceipt = z.infer<typeof insertPiltReceiptSchema>;
export type PiltReceipt = typeof piltReceipts.$inferSelect;

export type InsertDistribution = z.infer<typeof insertDistributionSchema>;
export type Distribution = typeof distributions.$inferSelect;

// Export validation schema components
export const {
  validationRules,
  validationAgents,
  validationRuns,
  validationIssues,
  validationTasks,
  validationAuditLogs,
  insertValidationRuleSchema,
  insertValidationAgentSchema,
  insertValidationRunSchema,
  insertValidationIssueSchema,
  insertValidationTaskSchema,
  insertValidationAuditLogSchema
} = validationSchema;

// Export validation types
export type {
  ValidationRule,
  ValidationAgent,
  ValidationRun,
  ValidationIssue,
  ValidationTask,
  ValidationAuditLog,
  InsertValidationRule,
  InsertValidationAgent,
  InsertValidationRun,
  InsertValidationIssue,
  InsertValidationTask,
  InsertValidationAuditLog
} from "./validation-schema";

// Terrafusion Intelligence Engine Schema
export const intelligenceMetrics = pgTable("intelligence_metrics", {
  id: serial("id").primaryKey(),
  metricType: text("metric_type").notNull(),
  entityId: text("entity_id").notNull(),
  entityType: text("entity_type").notNull(),
  value: numeric("value", { precision: 20, scale: 8 }).notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
  computedAt: timestamp("computed_at").defaultNow(),
  year: text("year").notNull(),
  metadata: text("metadata"),
});

export const predictiveModels = pgTable("predictive_models", {
  id: serial("id").primaryKey(),
  modelName: text("model_name").notNull().unique(),
  modelType: text("model_type").notNull(),
  algorithm: text("algorithm").notNull(),
  accuracy: numeric("accuracy", { precision: 5, scale: 4 }),
  lastTrained: timestamp("last_trained").defaultNow(),
  isActive: boolean("is_active").default(true),
  parameters: text("parameters"),
  performance: text("performance"),
});

export const anomalyDetections = pgTable("anomaly_detections", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  anomalyType: text("anomaly_type").notNull(),
  severity: text("severity").notNull(),
  detectedValue: numeric("detected_value", { precision: 20, scale: 2 }),
  expectedRange: text("expected_range"),
  confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
  detectedAt: timestamp("detected_at").defaultNow(),
  resolved: boolean("resolved").default(false),
  year: text("year").notNull(),
});

export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull(),
  impact: text("impact").notNull(),
  recommendation: text("recommendation").notNull(),
  dataPoints: text("data_points").array(),
  confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
  isImplemented: boolean("is_implemented").default(false),
  year: text("year").notNull(),
});

export const insertIntelligenceMetricSchema = createInsertSchema(intelligenceMetrics).omit({
  id: true,
  computedAt: true,
});

export const insertPredictiveModelSchema = createInsertSchema(predictiveModels).omit({
  id: true,
  lastTrained: true,
});

export const insertAnomalyDetectionSchema = createInsertSchema(anomalyDetections).omit({
  id: true,
  detectedAt: true,
});

export const insertInsightSchema = createInsertSchema(insights).omit({
  id: true,
  generatedAt: true,
});

export type IntelligenceMetric = typeof intelligenceMetrics.$inferSelect;
export type InsertIntelligenceMetric = z.infer<typeof insertIntelligenceMetricSchema>;

export type PredictiveModel = typeof predictiveModels.$inferSelect;
export type InsertPredictiveModel = z.infer<typeof insertPredictiveModelSchema>;

export type AnomalyDetection = typeof anomalyDetections.$inferSelect;
export type InsertAnomalyDetection = z.infer<typeof insertAnomalyDetectionSchema>;

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = z.infer<typeof insertInsightSchema>;
