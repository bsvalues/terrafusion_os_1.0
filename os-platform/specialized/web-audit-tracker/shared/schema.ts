import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  json,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// User model
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  fullName: text('full_name').notNull(),
  email: text('email'),
  role: text('role').notNull().default('auditor'), // auditor, supervisor, admin
  externalAuth: boolean('external_auth').default(false), // Flag for users authenticated via SSO
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login'),
});

// Create user schema
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  role: true,
  externalAuth: true,
});

// Audit status enum - expanded with more granular states
export const auditStatusEnum = pgEnum('audit_status', [
  'pending',
  'in_progress',
  'approved',
  'rejected',
  'needs_info',
  'waiting_for_supervisor',
  'waiting_for_admin',
  'under_review',
  'approved_with_changes',
  'resubmission_required',
  'on_hold',
]);

// Priority enum
export const priorityEnum = pgEnum('priority', ['low', 'normal', 'high', 'urgent']);

// Audit type enum - allows for different audit workflows
export const auditTypeEnum = pgEnum('audit_type', [
  'standard', // Standard assessment audit
  'complex', // Complex assessments requiring additional review
  'commercial', // Commercial property assessments
  'residential', // Residential property assessments
  'agriculture', // Agricultural property assessments
  'appeal', // Tax appeal cases
  'correction', // Error correction assessments
]);

// Property type enum for GIS features
export const propertyTypeEnum = pgEnum('property_type', [
  'residential',
  'commercial',
  'agricultural',
  'industrial',
]);

// Audit model
export const audits = pgTable('audits', {
  id: serial('id').primaryKey(),
  auditNumber: text('audit_number').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  propertyId: text('property_id').notNull(),
  address: text('address').notNull(),
  currentAssessment: integer('current_assessment').notNull(),
  proposedAssessment: integer('proposed_assessment').notNull(),
  taxImpact: integer('tax_impact'),
  reason: text('reason'),
  status: auditStatusEnum('status').notNull().default('pending'),
  priority: priorityEnum('priority').notNull().default('normal'),
  auditType: auditTypeEnum('audit_type').default('standard'),
  propertyType: propertyTypeEnum('property_type').default('residential'),
  submittedById: integer('submitted_by_id').notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  dueDate: timestamp('due_date').notNull(),
  assignedToId: integer('assigned_to_id'),
  workflowEnabled: boolean('workflow_enabled').default(false),
  autoAssign: boolean('auto_assign').default(false),
  metadata: json('metadata'), // For additional custom fields and data
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create audit schema
export const insertAuditSchema = createInsertSchema(audits).omit({
  id: true,
  updatedAt: true,
});

// Audit event model for activity log
export const auditEvents = pgTable('audit_events', {
  id: serial('id').primaryKey(),
  auditId: integer('audit_id').notNull(),
  userId: integer('user_id').notNull(),
  eventType: text('event_type').notNull(), // approved, rejected, commented, etc.
  comment: text('comment'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  changes: json('changes'), // Store before/after data as JSON
});

// Create audit event schema
export const insertAuditEventSchema = createInsertSchema(auditEvents).omit({
  id: true,
});

// Document model for storing audit documents
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  auditId: integer('audit_id').notNull(),
  filename: text('filename').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  fileKey: text('file_key').notNull(), // For cloud storage reference
  uploadedById: integer('uploaded_by_id').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// Create document schema
export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
});

// Workflow definition model - enables custom approval workflows
export const workflowDefinitions = pgTable('workflow_definitions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  auditType: auditTypeEnum('audit_type').notNull(),
  thresholdAmount: integer('threshold_amount'), // Financial threshold for this workflow
  steps: json('steps').notNull(), // Array of workflow steps
  createdById: integer('created_by_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isActive: boolean('is_active').notNull().default(true),
});

// Create workflow definition schema
export const insertWorkflowDefinitionSchema = createInsertSchema(workflowDefinitions).omit({
  id: true,
  updatedAt: true,
});

// Audit workflow instances - tracks an audit's progress through a workflow
export const workflowInstances = pgTable('workflow_instances', {
  id: serial('id').primaryKey(),
  auditId: integer('audit_id').notNull().unique(), // One workflow per audit
  workflowDefinitionId: integer('workflow_definition_id').notNull(),
  currentStepIndex: integer('current_step_index').notNull().default(0),
  completedStepIndexes: json('completed_step_indexes').notNull().default([]), // Array of completed steps
  status: text('status').notNull().default('active'), // active, completed, canceled
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'), // Null until completed
  data: json('data'), // Additional workflow data/state
});

// Create workflow instance schema
export const insertWorkflowInstanceSchema = createInsertSchema(workflowInstances).omit({
  id: true,
  completedAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Audit = typeof audits.$inferSelect;
export type InsertAudit = z.infer<typeof insertAuditSchema>;

export type AuditEvent = typeof auditEvents.$inferSelect;
export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type WorkflowDefinition = typeof workflowDefinitions.$inferSelect;
export type InsertWorkflowDefinition = z.infer<typeof insertWorkflowDefinitionSchema>;

export type WorkflowInstance = typeof workflowInstances.$inferSelect;
export type InsertWorkflowInstance = z.infer<typeof insertWorkflowInstanceSchema>;

// Annotation types enum
export const annotationTypeEnum = pgEnum('annotation_type', [
  'general',
  'property_note',
  'assessment_issue',
  'compliance_flag',
  'improvement_suggestion',
  'risk_indicator',
  'data_correction',
  'workflow_note',
]);

// Comment status enum
export const commentStatusEnum = pgEnum('comment_status', [
  'active',
  'resolved',
  'archived',
  'flagged',
]);

// Annotations table - for highlighting and annotating specific elements
export const annotations = pgTable('annotations', {
  id: serial('id').primaryKey(),
  entityType: text('entity_type').notNull(), // 'audit', 'property', 'document', 'map_point'
  entityId: integer('entity_id').notNull(), // ID of the annotated entity
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  type: annotationTypeEnum('type').notNull().default('general'),
  title: text('title').notNull(),
  content: text('content').notNull(),
  coordinates: json('coordinates'), // For spatial annotations: { x, y, width, height } or { lat, lng }
  metadata: json('metadata'), // Additional context data
  isPrivate: boolean('is_private').default(false), // Private to user or shared
  priority: priorityEnum('priority').default('normal'),
  status: commentStatusEnum('status').default('active'),
  resolvedBy: integer('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Comments table - for threaded discussions on annotations or entities
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id'), // For threaded replies - self-reference
  annotationId: integer('annotation_id').references(() => annotations.id),
  entityType: text('entity_type'), // Can comment directly on entities without annotation
  entityId: integer('entity_id'), // ID of the commented entity
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  content: text('content').notNull(),
  mentions: json('mentions'), // Array of mentioned user IDs: [1, 2, 3]
  attachments: json('attachments'), // Array of attachment metadata
  isEdited: boolean('is_edited').default(false),
  editedAt: timestamp('edited_at'),
  status: commentStatusEnum('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Notification table for collaborative activities
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  type: text('type').notNull(), // 'mention', 'reply', 'annotation_created', 'status_change'
  title: text('title').notNull(),
  content: text('content').notNull(),
  entityType: text('entity_type'),
  entityId: integer('entity_id'),
  relatedUserId: integer('related_user_id').references(() => users.id), // Who triggered the notification
  isRead: boolean('is_read').default(false),
  actionUrl: text('action_url'), // URL to navigate to when clicked
  metadata: json('metadata'), // Additional context
  createdAt: timestamp('created_at').defaultNow(),
});

// Create annotation schema
export const insertAnnotationSchema = createInsertSchema(annotations).omit({
  id: true,
  resolvedBy: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Create comment schema
export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  isEdited: true,
  editedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Create notification schema
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

// Type exports for collaborative system
export type Annotation = typeof annotations.$inferSelect;
export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Custom type for workflow step configuration
export type WorkflowStep = {
  id: string;
  name: string;
  description?: string;
  role: string; // Required role to complete this step
  nextSteps: string[]; // Possible next steps after this one
  formFields?: string[]; // Required form fields for this step
  statusMapping: string; // Maps to an audit status
  isApprovalStep?: boolean;
  requiredApprovals?: number; // Number of approvals needed (for multi-person approval)
  conditionalLogic?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan';
    value: string | number;
    nextStepOnMatch: string;
    nextStepOnFail: string;
  }[];
};
