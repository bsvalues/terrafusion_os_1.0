import { pgTable, text, integer, timestamp, jsonb, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Analytics snapshots table for historical data
export const analyticsSnapshots = pgTable("analytics_snapshots", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  snapshotDate: timestamp("snapshot_date", { withTimezone: true }).defaultNow().notNull(),
  totalAudits: integer("total_audits").notNull().default(0),
  pendingAudits: integer("pending_audits").notNull().default(0),
  approvedAudits: integer("approved_audits").notNull().default(0),
  rejectedAudits: integer("rejected_audits").notNull().default(0),
  inProgressAudits: integer("in_progress_audits").notNull().default(0),
  needsInfoAudits: integer("needs_info_audits").notNull().default(0),
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  approvalRate: decimal("approval_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  avgProcessingTime: decimal("avg_processing_time", { precision: 8, scale: 2 }).notNull().default("0.00"), // in hours
  priorityBreakdown: jsonb("priority_breakdown").notNull().default({}),
  userMetrics: jsonb("user_metrics").notNull().default({}),
  performanceMetrics: jsonb("performance_metrics").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// User performance tracking
export const userPerformanceMetrics = pgTable("user_performance_metrics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  auditsCompleted: integer("audits_completed").notNull().default(0),
  avgProcessingTime: decimal("avg_processing_time", { precision: 8, scale: 2 }).notNull().default("0.00"),
  approvalRate: decimal("approval_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }).notNull().default("0.00"),
  productivityScore: decimal("productivity_score", { precision: 5, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Customizable dashboard configurations
export const dashboardConfigs = pgTable("dashboard_configs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  configName: text("config_name").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  layout: jsonb("layout").notNull(), // Stores widget positions and sizes
  widgets: jsonb("widgets").notNull(), // Stores enabled widgets and their settings
  filters: jsonb("filters").notNull().default({}), // Default filters
  theme: text("theme").notNull().default("light"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Report templates and configurations
export const reportTemplates = pgTable("report_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  templateType: text("template_type").notNull(), // 'standard', 'custom', 'scheduled'
  config: jsonb("config").notNull(), // Report configuration (fields, filters, formatting)
  isPublic: boolean("is_public").notNull().default(false),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Generated reports history
export const reportHistory = pgTable("report_history", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  templateId: integer("template_id"),
  userId: integer("user_id").notNull(),
  reportName: text("report_name").notNull(),
  reportType: text("report_type").notNull(), // 'pdf', 'excel', 'csv', 'json'
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'failed'
  filePath: text("file_path"),
  parameters: jsonb("parameters").notNull().default({}),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  downloadCount: integer("download_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

// Insert schemas
export const insertAnalyticsSnapshotSchema = createInsertSchema(analyticsSnapshots);

export const insertUserPerformanceMetricsSchema = createInsertSchema(userPerformanceMetrics);

export const insertDashboardConfigSchema = createInsertSchema(dashboardConfigs);

export const insertReportTemplateSchema = createInsertSchema(reportTemplates);

export const insertReportHistorySchema = createInsertSchema(reportHistory);

// Types
export type AnalyticsSnapshot = typeof analyticsSnapshots.$inferSelect;
export type InsertAnalyticsSnapshot = z.infer<typeof insertAnalyticsSnapshotSchema>;

export type UserPerformanceMetrics = typeof userPerformanceMetrics.$inferSelect;
export type InsertUserPerformanceMetrics = z.infer<typeof insertUserPerformanceMetricsSchema>;

export type DashboardConfig = typeof dashboardConfigs.$inferSelect;
export type InsertDashboardConfig = z.infer<typeof insertDashboardConfigSchema>;

export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = z.infer<typeof insertReportTemplateSchema>;

export type ReportHistory = typeof reportHistory.$inferSelect;
export type InsertReportHistory = z.infer<typeof insertReportHistorySchema>;

// Widget configuration types
export interface WidgetConfig {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'gauge' | 'trend';
  title: string;
  dataSource: string;
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  filters?: Record<string, any>;
  refreshInterval?: number; // in seconds
  size: { width: number; height: number };
  position: { x: number; y: number };
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
  gridSize: { columns: number; rows: number };
  theme: 'light' | 'dark' | 'auto';
}

// Report configuration types
export interface ReportConfig {
  title: string;
  description?: string;
  dateRange: {
    type: 'fixed' | 'relative';
    startDate?: string;
    endDate?: string;
    relativePeriod?: string; // 'last_7_days', 'last_30_days', 'last_quarter', etc.
  };
  filters: Record<string, any>;
  sections: ReportSection[];
  formatting: {
    includeCharts: boolean;
    includeTables: boolean;
    chartTypes: string[];
    theme: 'light' | 'dark';
    layout: 'portrait' | 'landscape';
  };
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time?: string;
    recipients?: string[];
  };
}

export interface ReportSection {
  id: string;
  type: 'summary' | 'chart' | 'table' | 'text';
  title: string;
  content: any;
  order: number;
}