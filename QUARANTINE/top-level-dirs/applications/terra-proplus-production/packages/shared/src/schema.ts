import { pgTable, serial, varchar, integer, decimal, timestamp, boolean, json, text } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { relations } from 'drizzle-orm';

// Users table definition
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("appraiser"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Define user relations
export const usersRelations = relations(users, ({ many }) => ({
  appraisals: many(appraisals),
  uploadedAttachments: many(attachments, { relationName: "uploader" })
}));

// Properties table definition
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  address: varchar("address", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zip_code: varchar("zip_code", { length: 20 }).notNull(),
  property_type: varchar("property_type", { length: 50 }).notNull(),
  year_built: integer("year_built").notNull(),
  square_feet: integer("square_feet").notNull(),
  bedrooms: decimal("bedrooms", { precision: 3, scale: 1 }).notNull(),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }).notNull(),
  lot_size: integer("lot_size").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  parcel_number: varchar("parcel_number", { length: 50 }),
  zoning: varchar("zoning", { length: 50 }),
  lot_unit: varchar("lot_unit", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 6 }),
  longitude: decimal("longitude", { precision: 10, scale: 6 }),
  features: json("features"),
  created_by: integer("created_by").references(() => users.id)
});

// Define property relations
export const propertiesRelations = relations(properties, ({ many, one }) => ({
  appraisals: many(appraisals),
  creator: one(users, {
    fields: [properties.created_by],
    references: [users.id]
  }),
  attachments: many(attachments, { relationName: "property_attachments" })
}));

// Appraisals table definition
export const appraisals = pgTable("appraisals", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  appraiserId: integer("appraiser_id").notNull().references(() => users.id),
  status: varchar("status", { length: 50 }).notNull().default("Draft"),
  purpose: varchar("purpose", { length: 100 }).notNull(),
  marketValue: integer("market_value"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  inspectionDate: timestamp("inspection_date"),
  effectiveDate: timestamp("effective_date"),
  reportType: varchar("report_type", { length: 50 }),
  clientName: varchar("client_name", { length: 100 }),
  clientEmail: varchar("client_email", { length: 100 }),
  clientPhone: varchar("client_phone", { length: 50 }),
  lenderName: varchar("lender_name", { length: 100 }),
  loanNumber: varchar("loan_number", { length: 50 }),
  intendedUse: varchar("intended_use", { length: 255 }),
  valuationMethod: varchar("valuation_method", { length: 50 }),
  scopeOfWork: text("scope_of_work"),
  notes: text("notes")
});

// Define appraisal relations
export const appraisalsRelations = relations(appraisals, ({ one, many }) => ({
  property: one(properties, {
    fields: [appraisals.propertyId],
    references: [properties.id],
  }),
  appraiser: one(users, {
    fields: [appraisals.appraiserId],
    references: [users.id],
  }),
  comparables: many(comparables),
  attachments: many(attachments, { relationName: "appraisal_attachments" })
}));

// Comparables table definition
export const comparables = pgTable("comparables", {
  id: serial("id").primaryKey(),
  appraisalId: integer("appraisal_id").notNull().references(() => appraisals.id),
  address: varchar("address", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zipCode: varchar("zip_code", { length: 20 }).notNull(),
  salePrice: integer("sale_price").notNull(),
  saleDate: timestamp("sale_date").notNull(),
  squareFeet: integer("square_feet").notNull(),
  bedrooms: decimal("bedrooms", { precision: 3, scale: 1 }),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  yearBuilt: integer("year_built"),
  propertyType: varchar("property_type", { length: 50 }).notNull(),
  lotSize: integer("lot_size"),
  condition: varchar("condition", { length: 50 }),
  daysOnMarket: integer("days_on_market"),
  source: varchar("source", { length: 100 }),
  adjustedPrice: integer("adjusted_price"),
  adjustmentNotes: text("adjustment_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Define comparables relations
export const comparablesRelations = relations(comparables, ({ one, many }) => ({
  appraisal: one(appraisals, {
    fields: [comparables.appraisalId],
    references: [appraisals.id]
  }),
  adjustments: many(adjustments)
}));

// Adjustments table definition
export const adjustments = pgTable("adjustments", {
  id: serial("id").primaryKey(),
  comparableId: integer("comparable_id").notNull().references(() => comparables.id),
  category: varchar("category", { length: 50 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: integer("amount").notNull(),
  isPercentage: boolean("is_percentage").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Define adjustment relations
export const adjustmentsRelations = relations(adjustments, ({ one }) => ({
  comparable: one(comparables, {
    fields: [adjustments.comparableId],
    references: [comparables.id]
  })
}));

// Attachments table definition
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id),
  appraisalId: integer("appraisal_id").references(() => appraisals.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: varchar("file_url", { length: 255 }).notNull(),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  category: varchar("category", { length: 50 }),
  description: text("description"),
  uploadDate: timestamp("upload_date").notNull().defaultNow()
});

// Define attachments relations
export const attachmentsRelations = relations(attachments, ({ one }) => ({
  property: one(properties, {
    fields: [attachments.propertyId],
    references: [properties.id],
    relationName: "property_attachments"
  }),
  appraisal: one(appraisals, {
    fields: [attachments.appraisalId],
    references: [appraisals.id],
    relationName: "appraisal_attachments"
  }),
  uploader: one(users, {
    fields: [attachments.uploadedBy],
    references: [users.id],
    relationName: "uploader"
  })
}));

// Market data table definition
export const marketData = pgTable("market_data", {
  id: serial("id").primaryKey(),
  location: varchar("location", { length: 100 }).notNull(),
  dataType: varchar("data_type", { length: 50 }).notNull(),
  time: varchar("time", { length: 50 }).notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  comparisonValue: decimal("comparison_value", { precision: 12, scale: 2 }),
  percentChange: decimal("percent_change", { precision: 6, scale: 2 }),
  source: varchar("source", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Create insert schemas with zod
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(8)
});

export const insertPropertySchema = createInsertSchema(properties).omit({ 
  created_at: true,
  updated_at: true
});

export const insertAppraisalSchema = createInsertSchema(appraisals).omit({ 
  createdAt: true,
  completedAt: true
});

export const insertComparableSchema = createInsertSchema(comparables).omit({ 
  createdAt: true
});

export const insertAdjustmentSchema = createInsertSchema(adjustments).omit({
  createdAt: true
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  uploadDate: true
});

export const insertMarketDataSchema = createInsertSchema(marketData).omit({
  createdAt: true,
  updatedAt: true
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Appraisal = typeof appraisals.$inferSelect;
export type InsertAppraisal = z.infer<typeof insertAppraisalSchema>;

export type Comparable = typeof comparables.$inferSelect;
export type InsertComparable = z.infer<typeof insertComparableSchema>;

export type Adjustment = typeof adjustments.$inferSelect;
export type InsertAdjustment = z.infer<typeof insertAdjustmentSchema>;

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;