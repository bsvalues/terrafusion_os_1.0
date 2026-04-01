import { pgTable, serial, text, numeric, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const piltReceipts = pgTable('pilt_receipts', {
  id: serial('id').primaryKey(),
  year: text('year').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  assessedValue: numeric('assessed_value', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const piltDistributions = pgTable('pilt_distributions', {
  id: serial('id').primaryKey(),
  year: text('year').notNull(),
  district: text('district').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  percentage: numeric('percentage', { precision: 5, scale: 2 }),
  districtId: integer('district_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const landClassifications = pgTable('land_classifications', {
  id: serial('id').primaryKey(),
  year: text('year').notNull(),
  classificationType: text('classification_type').notNull(),
  acres: numeric('acres', { precision: 10, scale: 2 }).notNull(),
  valuePerAcre: numeric('value_per_acre', { precision: 8, scale: 2 }).notNull(),
  totalValue: numeric('total_value', { precision: 12, scale: 2 }).notNull(),
  districtId: integer('district_id').notNull(),
  districtName: text('district_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const levyRates = pgTable('levy_rates', {
  id: serial('id').primaryKey(),
  year: text('year').notNull(),
  rate: numeric('rate', { precision: 6, scale: 4 }).notNull(),
  districtId: integer('district_id').notNull(),
  districtName: text('district_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const validationResults = pgTable('validation_results', {
  id: serial('id').primaryKey(),
  year: text('year').notNull(),
  validationType: text('validation_type').notNull(),
  status: text('status').notNull(),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertPiltReceiptSchema = createInsertSchema(piltReceipts).omit({
  id: true,
  createdAt: true,
});

export const insertDistributionSchema = createInsertSchema(piltDistributions).omit({
  id: true,
  createdAt: true,
});

export const insertLandClassificationSchema = createInsertSchema(landClassifications).omit({
  id: true,
  createdAt: true,
});

export const insertLevyRateSchema = createInsertSchema(levyRates).omit({
  id: true,
  createdAt: true,
});

export type PiltReceipt = typeof piltReceipts.$inferSelect;
export type PiltDistribution = typeof piltDistributions.$inferSelect;
export type LandClassification = typeof landClassifications.$inferSelect;
export type LevyRate = typeof levyRates.$inferSelect;
export type ValidationResult = typeof validationResults.$inferSelect;

export type InsertPiltReceipt = z.infer<typeof insertPiltReceiptSchema>;
export type InsertDistribution = z.infer<typeof insertDistributionSchema>;
export type InsertLandClassification = z.infer<typeof insertLandClassificationSchema>;
export type InsertLevyRate = z.infer<typeof insertLevyRateSchema>;