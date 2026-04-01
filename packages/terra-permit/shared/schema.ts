import { pgTable, text, serial, integer, boolean, timestamp, jsonb, primaryKey, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Organization/Tenant Table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: integer("ownerId"),
  plan: text("plan").default("free").notNull(), // free, standard, premium
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});

export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
  slug: true,
  ownerId: true,
  plan: true,
  isActive: true
});

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// User Role Enum
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  REVIEWER = 'reviewer',
  VIEWER = 'viewer'
}

// Enhanced users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("firstName"),
  lastName: text("lastName"),
  avatarUrl: text("avatarUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  lastLogin: timestamp("lastLogin"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  avatarUrl: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Organization Membership Table (Many-to-Many relationship between users and organizations)
export const organizationMembers = pgTable("organization_members", {
  userId: integer("userId").notNull().references(() => users.id),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
  role: text("role").default(UserRole.VIEWER).notNull(), // admin, manager, reviewer, viewer
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.organizationId] }),
  };
});

export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers).pick({
  userId: true,
  organizationId: true,
  role: true
});

export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
export type OrganizationMember = typeof organizationMembers.$inferSelect;

// Permit schema for classification
export const permits = pgTable("permits", {
  id: serial("id").primaryKey(),
  parcelNumber: text("parcelNumber").notNull(),
  neighborhoodCode: text("neighborhoodCode"),
  permitDescription: text("permitDescription"),
  value: text("value"),
  issueDate: text("issue_date"),
  enterPermit: boolean("enterPermit").default(false),
  reason: text("reason"),
  processedAt: timestamp("processedAt").defaultNow(),
  uploadId: integer("uploadId").notNull(),
});

export const insertPermitSchema = createInsertSchema(permits).omit({
  id: true,
  processedAt: true,
});

export type InsertPermit = z.infer<typeof insertPermitSchema>;
export type Permit = typeof permits.$inferSelect;

// Upload record to group permits by upload session
export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  fileName: text("fileName").notNull(),
  processedAt: timestamp("processedAt").defaultNow(),
  totalPermits: integer("totalPermits").default(0),
  enterPermits: integer("enterPermits").default(0),
  skipPermits: integer("skipPermits").default(0),
  userId: integer("userId").notNull().references(() => users.id),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
});

export const insertUploadSchema = createInsertSchema(uploads).omit({
  id: true,
  processedAt: true,
}).pick({
  fileName: true,
  totalPermits: true,
  enterPermits: true,
  skipPermits: true,
  userId: true,
  organizationId: true,
});

export type InsertUpload = z.infer<typeof insertUploadSchema>;
export type Upload = typeof uploads.$inferSelect;

// Define collaborative session schema
export interface CollaborationSession {
  id: string;
  uploadId: number;
  createdAt: string;
  participants: CollaborationParticipant[];
  activePermitId?: number; // The permit currently being discussed
}

export interface CollaborationParticipant {
  id: string;
  name: string;
  avatar?: string;
  joinedAt: string;
  isActive: boolean;
  color: string; // For highlighting user activity
}

export interface PermitComment {
  id: string;
  permitId: number;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export enum CollaborationEventType {
  JOIN_SESSION = 'join_session',
  LEAVE_SESSION = 'leave_session',
  USER_ACTIVITY = 'user_activity',
  PERMIT_FOCUS = 'permit_focus',
  PERMIT_COMMENT = 'permit_comment',
  PERMIT_UPDATE = 'permit_update',
}

export interface CollaborationEvent {
  type: CollaborationEventType;
  sessionId: string;
  userId: string;
  timestamp: string;
  payload: any;
}

// History tracking for permits
export enum ActionType {
  CREATE = 'create',
  UPDATE = 'update',
  REVIEW = 'review',
  COMMENT = 'comment',
}

// Permit history table to track changes
export const permitHistories = pgTable("permit_histories", {
  id: serial("id").primaryKey(),
  permitId: integer("permitId").notNull(),
  userId: integer("userId").notNull(),
  action: text("action").notNull(), // Use ActionType
  detail: jsonb("detail").notNull(), // Store detailed information about the change
  createdAt: timestamp("createdAt").defaultNow(),
});

export const insertPermitHistorySchema = createInsertSchema(permitHistories).omit({
  id: true,
  createdAt: true,
});

export type InsertPermitHistory = z.infer<typeof insertPermitHistorySchema>;
export type PermitHistory = typeof permitHistories.$inferSelect;

// Define relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  uploads: many(uploads),
  members: many(organizationMembers),
}));

export const usersRelations = relations(users, ({ many }) => ({
  permitHistories: many(permitHistories),
  uploads: many(uploads),
  organizations: many(organizationMembers),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
}));

export const permitsRelations = relations(permits, ({ one, many }) => ({
  upload: one(uploads, {
    fields: [permits.uploadId],
    references: [uploads.id],
  }),
  histories: many(permitHistories),
}));

export const uploadsRelations = relations(uploads, ({ many, one }) => ({
  permits: many(permits),
  user: one(users, {
    fields: [uploads.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [uploads.organizationId],
    references: [organizations.id],
  }),
}));

export const permitHistoriesRelations = relations(permitHistories, ({ one }) => ({
  permit: one(permits, {
    fields: [permitHistories.permitId],
    references: [permits.id],
  }),
  user: one(users, {
    fields: [permitHistories.userId],
    references: [users.id],
  }),
}));

// Recommendation types
export enum RecommendationType {
  WORKFLOW = 'workflow',
  PROCESS_IMPROVEMENT = 'process_improvement',
  EFFICIENCY = 'efficiency',
  CONSISTENCY = 'consistency',
  COMPLIANCE = 'compliance'
}

// Recommendation priority levels
export enum RecommendationPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

// Source of the recommendation
export enum RecommendationSource {
  USER_BEHAVIOR = 'user_behavior',
  PERMIT_ANALYSIS = 'permit_analysis',
  HISTORICAL_PATTERNS = 'historical_patterns',
  AI_INSIGHT = 'ai_insight',
  NEIGHBOR_COMPARISON = 'neighbor_comparison'
}

// Recommendations table
export const recommendations = pgTable("recommendations", {
  id: uuid("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // Matches RecommendationType as text
  priority: text("priority").notNull(), // Matches RecommendationPriority as text
  source: text("source").notNull(), // Matches RecommendationSource as text
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  isImplemented: boolean("isImplemented").default(false).notNull(),
  implementedAt: timestamp("implementedAt"),
  implementationNote: text("implementationNote"),
  relatedEntityId: integer("relatedEntityId"),
  relatedEntityType: text("relatedEntityType"),
  actionUrl: text("actionUrl"),
  metadata: jsonb("metadata")
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
  createdAt: true,
});

export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendations.$inferSelect;

// Define recommendations relations
export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  user: one(users, {
    fields: [recommendations.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [recommendations.organizationId],
    references: [organizations.id],
  }),
}));
