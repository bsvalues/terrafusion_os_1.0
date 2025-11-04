/**
 * Web Vitals Schema
 *
 * Schema definitions for Web Vitals metrics tables, used for tracking performance
 * metrics from real users. Includes tables for raw metrics, aggregated metrics, and summaries.
 */
import {
  pgTable,
  text,
  timestamp,
  doublePrecision,
  integer,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Raw Web Vitals metrics table
 * Stores individual Web Vitals measurements from user devices
 */
export const webVitalsMetrics = pgTable('web_vitals_metrics', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  value: doublePrecision('value').notNull(),
  delta: doublePrecision('delta').notNull(),
  rating: text('rating'),
  navigationType: text('navigation_type'),
  url: text('url').notNull(),
  userAgent: text('user_agent'),
  deviceType: text('device_type'),
  connectionType: text('connection_type'),
  effectiveConnectionType: text('effective_connection_type'),
  userId: text('user_id'),
  sessionId: text('session_id'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  tags: jsonb('tags'),
});

export const insertWebVitalsMetricsSchema = createInsertSchema(webVitalsMetrics).omit({
  timestamp: true,
});

export type WebVitalsMetric = typeof webVitalsMetrics.$inferSelect;
export type InsertWebVitalsMetric = z.infer<typeof insertWebVitalsMetricsSchema>;

/**
 * Web Vitals reports table
 * Stores batched reports from clients
 */
export const webVitalsReports = pgTable('web_vitals_reports', {
  id: text('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  url: text('url').notNull(),
  metrics: jsonb('metrics').notNull(),
  percentiles: jsonb('percentiles'),
  deviceInfo: jsonb('device_info'),
  tags: jsonb('tags'),
});

export const insertWebVitalsReportsSchema = createInsertSchema(webVitalsReports).omit({
  timestamp: true,
});

export type WebVitalsReport = typeof webVitalsReports.$inferSelect;
export type InsertWebVitalsReport = z.infer<typeof insertWebVitalsReportsSchema>;

/**
 * Web Vitals aggregated metrics table
 * Stores hourly aggregated metrics for faster queries
 */
export const webVitalsAggregates = pgTable('web_vitals_aggregates', {
  id: text('id').primaryKey(),
  metricName: text('metric_name').notNull(),
  urlPattern: text('url_pattern').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  p50: doublePrecision('p50').notNull(),
  p75: doublePrecision('p75').notNull(),
  p95: doublePrecision('p95').notNull(),
  count: integer('count').notNull(),
  deviceType: text('device_type'),
  connectionType: text('connection_type'),
});

export const insertWebVitalsAggregatesSchema = createInsertSchema(webVitalsAggregates).omit({
  timestamp: true,
});

export type WebVitalsAggregate = typeof webVitalsAggregates.$inferSelect;
export type InsertWebVitalsAggregate = z.infer<typeof insertWebVitalsAggregatesSchema>;

/**
 * Web Vitals performance budgets table
 * Stores performance budgets for different metrics and URL patterns
 */
export const webVitalsBudgets = pgTable('web_vitals_budgets', {
  id: text('id').primaryKey(),
  metricName: text('metric_name').notNull(),
  urlPattern: text('url_pattern').notNull(),
  budget: doublePrecision('budget').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: text('created_by'),
  active: boolean('active').default(true),
});

export const insertWebVitalsBudgetsSchema = createInsertSchema(webVitalsBudgets).omit({
  createdAt: true,
  updatedAt: true,
});

export type WebVitalsBudget = typeof webVitalsBudgets.$inferSelect;
export type InsertWebVitalsBudget = z.infer<typeof insertWebVitalsBudgetsSchema>;

/**
 * Web Vitals alerts table
 * Stores alerts when metrics exceed budgets or anomalies are detected
 */
export const webVitalsAlerts = pgTable('web_vitals_alerts', {
  id: text('id').primaryKey(),
  metricName: text('metric_name').notNull(),
  value: doublePrecision('value').notNull(),
  threshold: doublePrecision('threshold').notNull(),
  url: text('url').notNull(),
  deviceType: text('device_type'),
  sampleSize: integer('sample_size').notNull(),
  severity: text('severity').notNull(), // low, medium, high
  title: text('title').notNull(),
  description: text('description').notNull(),
  detectedAt: timestamp('detected_at').defaultNow().notNull(),
  acknowledged: boolean('acknowledged').default(false),
  acknowledgedBy: text('acknowledged_by'),
  acknowledgedAt: timestamp('acknowledged_at'),
  alertType: text('alert_type').default('threshold').notNull(), // threshold, anomaly
});

export const insertWebVitalsAlertsSchema = createInsertSchema(webVitalsAlerts).omit({
  detectedAt: true,
  acknowledgedAt: true,
});

export type WebVitalsAlert = typeof webVitalsAlerts.$inferSelect;
export type InsertWebVitalsAlert = z.infer<typeof insertWebVitalsAlertsSchema>;
