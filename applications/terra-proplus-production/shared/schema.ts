import { relations, sql } from 'drizzle-orm';
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  integer, 
  boolean, 
  numeric, 
  date,
  varchar 
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  password: text('password').notNull(),
  role: text('role').notNull().default('appraiser'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  appraisals: many(appraisals),
}));

// Properties table
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: varchar('zip_code', { length: 10 }).notNull(),
  propertyType: text('property_type').notNull(),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: text('bathrooms').notNull(),
  squareFeet: text('square_feet').notNull(),
  lotSize: text('lot_size'),
  yearBuilt: integer('year_built').notNull(),
  description: text('description').notNull(),
  parcelNumber: varchar('parcel_number', { length: 50 }).notNull(),
  zoning: text('zoning').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const propertiesRelations = relations(properties, ({ many, one }) => ({
  appraisals: many(appraisals),
}));

// Appraisals table
export const appraisals = pgTable('appraisals', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').notNull().references(() => properties.id),
  appraiserId: integer('appraiser_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  status: text('status').notNull().default('in_progress'),
  purpose: text('purpose'),
  marketValue: numeric('market_value'),
  valuationMethod: text('valuation_method'),
  effectiveDate: date('effective_date'),
  reportDate: date('report_date'),
});

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
  attachments: many(attachments),
}));

// Comparables table
export const comparables = pgTable('comparables', {
  id: serial('id').primaryKey(),
  appraisalId: integer('appraisal_id').notNull().references(() => appraisals.id),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zipCode: varchar('zip_code', { length: 10 }).notNull(),
  propertyType: text('property_type').notNull(),
  bedrooms: integer('bedrooms').notNull(),
  bathrooms: text('bathrooms').notNull(),
  squareFeet: text('square_feet').notNull(),
  lotSize: text('lot_size'),
  yearBuilt: integer('year_built').notNull(),
  salePrice: numeric('sale_price').notNull(),
  saleDate: date('sale_date').notNull(),
  distance: numeric('distance').notNull(),
  notes: text('notes'),
  adjustedValue: numeric('adjusted_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const comparablesRelations = relations(comparables, ({ one, many }) => ({
  appraisal: one(appraisals, {
    fields: [comparables.appraisalId],
    references: [appraisals.id],
  }),
  adjustments: many(adjustments),
}));

// Adjustments table
export const adjustments = pgTable('adjustments', {
  id: serial('id').primaryKey(),
  comparableId: integer('comparable_id').notNull().references(() => comparables.id),
  featureName: text('feature_name').notNull(),
  description: text('description'),
  amount: numeric('amount').notNull(),
  isAdditive: boolean('is_additive').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const adjustmentsRelations = relations(adjustments, ({ one }) => ({
  comparable: one(comparables, {
    fields: [adjustments.comparableId],
    references: [comparables.id],
  }),
}));

// Attachments table
export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  appraisalId: integer('appraisal_id').notNull().references(() => appraisals.id),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  fileUrl: text('file_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  appraisal: one(appraisals, {
    fields: [attachments.appraisalId],
    references: [appraisals.id],
  }),
}));

// Market data table
export const marketData = pgTable('market_data', {
  id: serial('id').primaryKey(),
  zipCode: varchar('zip_code', { length: 10 }).notNull(),
  period: text('period').notNull(), // e.g., '2023-Q1', '2023-Q2'
  medianSalePrice: numeric('median_sale_price').notNull(),
  averageSalePrice: numeric('average_sale_price').notNull(),
  averagePricePerSqft: numeric('average_price_per_sqft').notNull(),
  totalSales: integer('total_sales').notNull(),
  averageDaysOnMarket: numeric('average_days_on_market').notNull(),
  propertyType: text('property_type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(8),
});

export const insertPropertySchema = createInsertSchema(properties).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAppraisalSchema = createInsertSchema(appraisals).omit({ 
  id: true,
  createdAt: true,
  completedAt: true
});

export const insertComparableSchema = createInsertSchema(comparables).omit({ 
  id: true,
  createdAt: true
});

export const insertAdjustmentSchema = createInsertSchema(adjustments).omit({
  id: true,
  createdAt: true
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  createdAt: true
});

export const insertMarketDataSchema = createInsertSchema(marketData).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types
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