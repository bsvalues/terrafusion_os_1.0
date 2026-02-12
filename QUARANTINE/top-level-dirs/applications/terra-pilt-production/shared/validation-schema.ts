/**
 * Validation System Schema
 * 
 * Defines the database schema for the PILT Dashboard validation system.
 * Includes tables for validation rules, issues, agents, and scheduled tasks.
 */

import { pgTable, serial, text, json, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Validation Rules Table
 * 
 * Stores validation rules used to check data quality.
 */
export const validationRules = pgTable('validation_rules', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  rule_type: text('rule_type').notNull(), // sum_check, existence_check, format_check, uniqueness_check, referential_integrity
  rule_definition: json('rule_definition').notNull(),
  severity: text('severity').notNull().default('medium'), // critical, high, medium, low
  enabled: boolean('enabled').notNull().default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

/**
 * Validation Agents Table
 * 
 * Stores AI validation agent configurations.
 */
export const validationAgents = pgTable('validation_agents', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  agent_type: text('agent_type').notNull(), // pattern_recognition, relationship_validation, correction_recommendation, data_reconciliation
  configuration: json('configuration').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

/**
 * Validation Runs Table
 * 
 * Tracks validation run execution and results.
 */
export const validationRuns = pgTable('validation_runs', {
  id: serial('id').primaryKey(),
  data_type: text('data_type').notNull(), // pilt_receipt, distribution, land_classification, levy_rate, district
  year: integer('year'),
  status: text('status').notNull(), // pending, processing, completed, failed
  started_at: timestamp('started_at').notNull(),
  completed_at: timestamp('completed_at'),
  user_id: integer('user_id').notNull(),
  issues_count: integer('issues_count').default(0),
  critical_issues: integer('critical_issues').default(0),
  high_issues: integer('high_issues').default(0),
  medium_issues: integer('medium_issues').default(0),
  low_issues: integer('low_issues').default(0),
  fixable_issues: integer('fixable_issues').default(0),
  ai_recommendations: text('ai_recommendations'),
  error_message: text('error_message')
});

/**
 * Validation Issues Table
 * 
 * Stores issues found during validation runs.
 */
export const validationIssues = pgTable('validation_issues', {
  id: text('id').primaryKey(), // UUID
  validation_run_id: integer('validation_run_id').notNull().references(() => validationRuns.id),
  rule_id: integer('rule_id').references(() => validationRules.id),
  rule_name: text('rule_name'),
  rule_type: text('rule_type'),
  agent_id: integer('agent_id').references(() => validationAgents.id),
  agent_name: text('agent_name'),
  agent_type: text('agent_type'),
  issue_type: text('issue_type').notNull(), // data_consistency, missing_reference, format_violation, duplicate_records, referential_integrity, pattern_anomaly, relationship_violation, data_conflict
  severity: text('severity').notNull(), // critical, high, medium, low
  description: text('description').notNull(),
  affected_records: json('affected_records'),
  fix_suggestion: json('fix_suggestion'),
  status: text('status').notNull().default('open'), // open, fixed, ignored
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

/**
 * Scheduled Validation Tasks Table
 * 
 * Stores scheduled validation tasks for automatic execution.
 */
export const validationTasks = pgTable('validation_tasks', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  task_type: text('task_type').notNull().default('validation'), // validation, cleanup, report
  cron_expression: text('cron_expression').notNull(),
  parameters: json('parameters').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  last_run_at: timestamp('last_run_at'),
  next_run_at: timestamp('next_run_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

/**
 * Validation Audit Logs Table
 * 
 * Tracks validation-related actions for audit purposes.
 */
export const validationAuditLogs = pgTable('validation_audit_logs', {
  id: serial('id').primaryKey(),
  action: text('action').notNull(), // create_rule, update_rule, delete_rule, run_validation, fix_issue, etc.
  entity_type: text('entity_type').notNull(), // rule, agent, run, issue, task
  entity_id: text('entity_id').notNull(),
  user_id: integer('user_id').notNull(),
  details: json('details'),
  created_at: timestamp('created_at').defaultNow()
});

// Zod schemas for validation

export const insertValidationRuleSchema = createInsertSchema(validationRules, {
  rule_definition: z.any(),
}).omit({ id: true, created_at: true, updated_at: true });

export const insertValidationAgentSchema = createInsertSchema(validationAgents, {
  configuration: z.any(),
}).omit({ id: true, created_at: true, updated_at: true });

export const insertValidationRunSchema = createInsertSchema(validationRuns)
  .omit({ id: true });

export const insertValidationIssueSchema = createInsertSchema(validationIssues, {
  affected_records: z.any(),
  fix_suggestion: z.any(),
}).omit({ created_at: true, updated_at: true });

export const insertValidationTaskSchema = createInsertSchema(validationTasks, {
  parameters: z.any(),
}).omit({ id: true, created_at: true, updated_at: true, last_run_at: true, next_run_at: true });

export const insertValidationAuditLogSchema = createInsertSchema(validationAuditLogs, {
  details: z.any(),
}).omit({ id: true, created_at: true });

// Types for the validation schema

export type ValidationRule = typeof validationRules.$inferSelect;
export type InsertValidationRule = z.infer<typeof insertValidationRuleSchema>;

export type ValidationAgent = typeof validationAgents.$inferSelect;
export type InsertValidationAgent = z.infer<typeof insertValidationAgentSchema>;

export type ValidationRun = typeof validationRuns.$inferSelect;
export type InsertValidationRun = z.infer<typeof insertValidationRunSchema>;

export type ValidationIssue = typeof validationIssues.$inferSelect;
export type InsertValidationIssue = z.infer<typeof insertValidationIssueSchema>;

export type ValidationTask = typeof validationTasks.$inferSelect;
export type InsertValidationTask = z.infer<typeof insertValidationTaskSchema>;

export type ValidationAuditLog = typeof validationAuditLogs.$inferSelect;
export type InsertValidationAuditLog = z.infer<typeof insertValidationAuditLogSchema>;