import { pgTable, text, serial, integer, boolean, jsonb, numeric, varchar, primaryKey, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { AuditAction, AuditEntityType } from './agent/AuditLogger';

// Neighborhood timeline data point type
export interface NeighborhoodTimelineDataPoint {
  year: string;
  value: number;
  percentChange?: number;
  transactionCount?: number;
}

// Neighborhood timeline type
export interface NeighborhoodTimeline {
  id: string;
  name: string;
  data: NeighborhoodTimelineDataPoint[];
  avgValue?: number;
  growthRate?: number;
}

// User table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("viewer"),
  email: text("email"),
  isActive: boolean("is_active").notNull().default(true)
});

// Property table for storing property data
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  parcelId: text("parcel_id").notNull().unique(),
  address: text("address").notNull(),
  owner: text("owner"),
  value: text("value"),
  estimatedValue: numeric("estimated_value", { precision: 10, scale: 2 }),
  salePrice: text("sale_price"),
  squareFeet: integer("square_feet").notNull(),
  yearBuilt: integer("year_built"),
  landValue: text("land_value"),
  coordinates: jsonb("coordinates"),
  latitude: numeric("latitude", { precision: 10, scale: 6 }), // Stored as number in database
  longitude: numeric("longitude", { precision: 10, scale: 6 }), // Stored as number in database
  neighborhood: text("neighborhood"),
  propertyType: text("property_type"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  lotSize: integer("lot_size"),
  zoning: text("zoning"),
  lastSaleDate: text("last_sale_date"),
  taxAssessment: text("tax_assessment"),
  pricePerSqFt: text("price_per_sqft"),
  attributes: jsonb("attributes"),
  historicalValues: jsonb("historical_values"), // Stores yearly property values as a JSON object
  sourceId: text("source_id"), // This remains text for legacy compatibility
  zillowId: text("zillow_id")
});

// Project table for storing project metadata
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  year: text("year").notNull(),
  metrics: jsonb("metrics"),
  records: jsonb("records")
});

// Script table for storing script definitions
export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  type: text("type").notNull(),
  code: text("code"),
  order: integer("order").notNull()
});

// Script group table
export const scriptGroups = pgTable("script_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(false),
  order: integer("order").notNull()
});

// Regression models table
export const regressionModels = pgTable("regression_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  r2: text("r2").notNull(),
  variables: integer("variables").notNull(),
  cov: text("cov"),
  samples: integer("samples"),
  lastRun: text("last_run"),
  modelType: text("model_type").notNull(),
  configuration: jsonb("configuration")
});

// Income Approach Tables
export const incomeHotelMotel = pgTable("income_hotel_motel", {
  incomeYear: numeric("income_yr", { precision: 4, scale: 0 }).notNull(),
  supNum: integer("sup_num").notNull(),
  incomeId: integer("income_id").notNull(),
  sizeInSqft: numeric("size_in_sqft", { precision: 8, scale: 0 }).notNull().default("0"),
  averageDailyRoomRate: numeric("average_daily_room_rate", { precision: 9, scale: 2 }).notNull().default("0"),
  numberOfRooms: numeric("number_of_rooms", { precision: 4, scale: 0 }).notNull().default("0"),
  numberOfRoomNights: numeric("number_of_room_nights", { precision: 8, scale: 0 }).notNull().default("0"),
  incomeValueReconciled: numeric("income_value_reconciled", { precision: 9, scale: 0 }).notNull().default("0"),
  incomeValuePerRoom: numeric("income_value_per_room", { precision: 14, scale: 2 }).notNull().default("0"),
  assessmentValuePerRoom: numeric("assessment_value_per_room", { precision: 14, scale: 2 }).notNull().default("0"),
  incomeValuePerSqft: numeric("income_value_per_sqft", { precision: 14, scale: 2 }).notNull().default("0"),
  assessmentValuePerSqft: numeric("assessment_value_per_sqft", { precision: 14, scale: 2 }).notNull().default("0")
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.incomeYear, table.supNum, table.incomeId] })
  };
});

export const incomeHotelMotelDetail = pgTable("income_hotel_motel_detail", {
  incomeYear: numeric("income_yr", { precision: 4, scale: 0 }).notNull(),
  supNum: integer("sup_num").notNull(),
  incomeId: integer("income_id").notNull(),
  valueType: varchar("value_type", { length: 1 }).notNull(),
  roomRevenue: numeric("room_revenue", { precision: 9, scale: 0 }).notNull().default("0"),
  roomRevenuePct: numeric("room_revenue_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  roomRevenueUpdate: varchar("room_revenue_update", { length: 1 }).notNull().default(""),
  vacancyCollectionLoss: numeric("vacancy_collection_loss", { precision: 9, scale: 0 }).notNull().default("0"),
  vacancyCollectionLossPct: numeric("vacancy_collection_loss_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  vacancyCollectionLossUpdate: varchar("vacancy_collection_loss_update", { length: 1 }).notNull().default(""),
  foodBeverageIncome: numeric("food_beverage_income", { precision: 9, scale: 0 }).notNull().default("0"),
  foodBeverageIncomePct: numeric("food_beverage_income_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  foodBeverageIncomeUpdate: varchar("food_beverage_income_update", { length: 1 }).notNull().default(""),
  miscIncome: numeric("misc_income", { precision: 9, scale: 0 }).notNull().default("0"),
  miscIncomePct: numeric("misc_income_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  miscIncomeUpdate: varchar("misc_income_update", { length: 1 }).notNull().default(""),
  effectiveGrossIncome: numeric("effective_gross_income", { precision: 9, scale: 0 }).notNull().default("0"),
  effectiveGrossIncomePct: numeric("effective_gross_income_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  utilities: numeric("utilities", { precision: 9, scale: 0 }).notNull().default("0"),
  utilitiesPct: numeric("utilities_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  utilitiesUpdate: varchar("utilities_update", { length: 1 }).notNull().default(""),
  maintenanceRepair: numeric("maintenance_repair", { precision: 9, scale: 0 }).notNull().default("0"),
  maintenanceRepairPct: numeric("maintenance_repair_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  maintenanceRepairUpdate: varchar("maintenance_repair_update", { length: 1 }).notNull().default(""),
  departmentExpenses: numeric("department_expenses", { precision: 9, scale: 0 }).notNull().default("0"),
  departmentExpensesPct: numeric("department_expenses_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  departmentExpensesUpdate: varchar("department_expenses_update", { length: 1 }).notNull().default(""),
  management: numeric("management", { precision: 9, scale: 0 }).notNull().default("0"),
  managementPct: numeric("management_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  managementUpdate: varchar("management_update", { length: 1 }).notNull().default(""),
  administrative: numeric("administrative", { precision: 9, scale: 0 }).notNull().default("0"),
  administrativePct: numeric("administrative_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  administrativeUpdate: varchar("administrative_update", { length: 1 }).notNull().default(""),
  payroll: numeric("payroll", { precision: 9, scale: 0 }).notNull().default("0"),
  payrollPct: numeric("payroll_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  payrollUpdate: varchar("payroll_update", { length: 1 }).notNull().default(""),
  insurance: numeric("insurance", { precision: 9, scale: 0 }).notNull().default("0"),
  insurancePct: numeric("insurance_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  insuranceUpdate: varchar("insurance_update", { length: 1 }).notNull().default(""),
  marketing: numeric("marketing", { precision: 9, scale: 0 }).notNull().default("0"),
  marketingPct: numeric("marketing_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  marketingUpdate: varchar("marketing_update", { length: 1 }).notNull().default(""),
  realEstateTax: numeric("real_estate_tax", { precision: 9, scale: 0 }).notNull().default("0"),
  realEstateTaxPct: numeric("real_estate_tax_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  realEstateTaxUpdate: varchar("real_estate_tax_update", { length: 1 }).notNull().default(""),
  franchiseFee: numeric("franchise_fee", { precision: 9, scale: 0 }).notNull().default("0"),
  franchiseFeePct: numeric("franchise_fee_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  franchiseFeeUpdate: varchar("franchise_fee_update", { length: 1 }).notNull().default(""),
  other: numeric("other", { precision: 9, scale: 0 }).notNull().default("0"),
  otherPct: numeric("other_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  otherUpdate: varchar("other_update", { length: 1 }).notNull().default(""),
  totalExpenses: numeric("total_expenses", { precision: 9, scale: 0 }).notNull().default("0"),
  totalExpensesPct: numeric("total_expenses_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  totalExpensesUpdate: varchar("total_expenses_update", { length: 1 }).notNull().default(""),
  netOperatingIncome: numeric("net_operating_income", { precision: 9, scale: 0 }).notNull().default("0"),
  netOperatingIncomePct: numeric("net_operating_income_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  capRate: numeric("cap_rate", { precision: 4, scale: 2 }).notNull().default("0"),
  capRateUpdate: varchar("cap_rate_update", { length: 1 }).notNull().default(""),
  taxRate: numeric("tax_rate", { precision: 4, scale: 2 }).notNull().default("0"),
  taxRateUpdate: varchar("tax_rate_update", { length: 1 }).notNull().default(""),
  overallCapRate: numeric("overall_cap_rate", { precision: 4, scale: 2 }).notNull().default("0"),
  incomeValue: numeric("income_value", { precision: 9, scale: 0 }).notNull().default("0"),
  personalPropertyValue: numeric("personal_property_value", { precision: 9, scale: 0 }).notNull().default("0"),
  personalPropertyValueUpdate: varchar("personal_property_value_update", { length: 1 }).notNull().default(""),
  otherValue: numeric("other_value", { precision: 9, scale: 0 }).notNull().default("0"),
  otherValueUpdate: varchar("other_value_update", { length: 1 }).notNull().default(""),
  indicatedIncomeValue: numeric("indicated_income_value", { precision: 9, scale: 0 }).notNull().default("0"),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.incomeYear, table.supNum, table.incomeId, table.valueType] })
  };
});

export const incomeLeaseUp = pgTable("income_lease_up", {
  incomeLeaseUpId: integer("income_lease_up_id").notNull().primaryKey(),
  incomeYear: numeric("income_yr", { precision: 4, scale: 0 }).notNull(),
  supNum: integer("sup_num").notNull(),
  incomeId: integer("income_id").notNull(),
  frequency: varchar("frequency", { length: 1 }).notNull().default("A"),
  leaseType: varchar("lease_type", { length: 1 }),
  unitOfMeasure: varchar("unit_of_measure", { length: 1 }),
  rentLossAreaSqft: numeric("rent_loss_area_sqft", { precision: 14, scale: 0 }),
  rentSqft: numeric("rent_sqft", { precision: 14, scale: 2 }),
  rentNumberOfYears: numeric("rent_number_of_years", { precision: 5, scale: 2 }),
  rentTotal: numeric("rent_total", { precision: 14, scale: 0 }),
  leasePct: numeric("lease_pct", { precision: 5, scale: 2 }),
  leaseTotal: numeric("lease_total", { precision: 14, scale: 0 }),
  totalFinishOutSqft: numeric("total_finish_out_sqft", { precision: 14, scale: 2 }),
  totalFinishOutTotal: numeric("total_finish_out_total", { precision: 14, scale: 0 }),
  discountRate: numeric("discount_rate", { precision: 5, scale: 2 }),
  numberOfYears: numeric("number_of_years", { precision: 5, scale: 2 }),
  leaseUpCost: numeric("lease_up_cost", { precision: 14, scale: 0 }),
  leaseUpCostOverride: boolean("lease_up_cost_override").notNull().default(false),
  netRentableArea: numeric("net_rentable_area", { precision: 9, scale: 0 }).notNull().default("0"),
  currentOccupancyPct: numeric("current_occupancy_pct", { precision: 5, scale: 2 }).notNull().default("100"),
  stabilizedOccupancyPct: numeric("stabilized_occupancy_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  stabilizedOccupancy: numeric("stabilized_occupancy", { precision: 9, scale: 0 }).notNull().default("0"),
  spaceToBeAbsorbed: numeric("space_to_be_absorbed", { precision: 9, scale: 0 }).notNull().default("0"),
  absorptionPeriodInMonths: numeric("absorption_period_in_months", { precision: 2, scale: 0 }).notNull().default("0"),
  estimatedAbsorptionPerYear: numeric("estimated_absorption_per_year", { precision: 9, scale: 0 }).notNull().default("0"),
  estimatedAbsorptionPerMonth: numeric("estimated_absorption_per_month", { precision: 9, scale: 0 }).notNull().default("0"),
  leasingCommissionsPct: numeric("leasing_commissions_pct", { precision: 2, scale: 0 }).notNull().default("0"),
  grossRentLossPerSqft: numeric("gross_rent_loss_per_sqft", { precision: 7, scale: 2 }).notNull().default("0"),
  tenantFinishAllowancePerSqft: numeric("tenant_finish_allowance_per_sqft", { precision: 7, scale: 2 }).notNull().default("0"),
});

export const incomeLeaseUpMonthListing = pgTable("income_lease_up_month_listing", {
  incomeLeaseUpMonthListingId: integer("income_lease_up_month_listing_id").notNull().primaryKey(),
  incomeLeaseUpId: integer("income_lease_up_id").notNull(),
  yearNumber: integer("year_number").notNull(),
  monthNumber: integer("month_number").notNull(),
  available: numeric("available", { precision: 9, scale: 1 }).notNull().default("0"),
  rentLoss: numeric("rent_loss", { precision: 14, scale: 2 }).notNull().default("0"),
  finishAllowance: numeric("finish_allowance", { precision: 14, scale: 2 }).notNull().default("0"),
  commissions: numeric("commissions", { precision: 14, scale: 0 }).notNull().default("0"),
  presentValueFactor: numeric("present_value_factor", { precision: 14, scale: 8 }).notNull().default("0"),
  presentValue: numeric("present_value", { precision: 14, scale: 2 }).notNull().default("0")
});

// ETL Data Sources table
export const etlDataSources = pgTable("etl_data_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // database, api, file, memory
  connectionDetails: jsonb("connection_details").notNull(),
  isConnected: boolean("is_connected").default(false),
  lastConnected: timestamp("last_connected"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ETL Transformation Rules table
export const etlTransformationRules = pgTable("etl_transformation_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  dataType: text("data_type").notNull(), // text, number, date, boolean, object
  transformationCode: text("transformation_code").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ETL Jobs table
export const etlJobs = pgTable("etl_jobs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sourceId: integer("source_id").notNull(), // References etlDataSources.id
  targetId: integer("target_id").notNull(), // References etlDataSources.id
  transformationIds: jsonb("transformation_ids").notNull().default([]), // Array of transformation rule IDs
  status: text("status").notNull().default("idle"), // idle, running, success, failed, warning
  schedule: jsonb("schedule"), // frequency, start_date, days_of_week, time_of_day, etc.
  metrics: jsonb("metrics"), // execution time, CPU/memory utilization, rows processed, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastRunAt: timestamp("last_run_at")
});

// ETL Optimization Suggestions table
export const etlOptimizationSuggestions = pgTable("etl_optimization_suggestions", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(), // References etlJobs.id (integer to match etlJobs.id type)
  type: text("type").notNull(), // performance, resource, code, scheduling
  severity: text("severity").notNull(), // low, medium, high
  title: text("title").notNull(),
  description: text("description").notNull(),
  suggestedAction: text("suggested_action").notNull(),
  estimatedImprovement: jsonb("estimated_improvement").notNull(), // metric, percentage
  status: text("status").notNull().default("new"), // new, in_progress, implemented, ignored
  category: text("category"),
  implementationComplexity: text("implementation_complexity"),
  suggestedCode: text("suggested_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ETL Batch Jobs table
export const etlBatchJobs = pgTable("etl_batch_jobs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  jobIds: jsonb("job_ids").notNull(), // Array of job IDs
  status: text("status").notNull().default("idle"), // idle, running, success, failed, warning
  progress: integer("progress").notNull().default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at")
});

// ETL Alerts table
export const etlAlerts = pgTable("etl_alerts", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(), // References etlJobs.id
  type: text("type").notNull(), // error, warning, info
  message: text("message").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").default(false)
});

// Create schemas for inserting data
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  email: true,
  isActive: true
});

// Create insert schema with type refinements
export const insertPropertySchema = createInsertSchema(properties)
.extend({
  latitude: z.union([z.number(), z.string()]).transform(val => 
    typeof val === 'string' ? parseFloat(val) : val
  ).nullable().optional(),
  longitude: z.union([z.number(), z.string()]).transform(val => 
    typeof val === 'string' ? parseFloat(val) : val
  ).nullable().optional(),
  // Ensure the coordinates field is always valid
  coordinates: z.any().optional().nullable(),
})
.pick({
  parcelId: true,
  address: true,
  owner: true,
  value: true,
  estimatedValue: true,
  salePrice: true,
  squareFeet: true,
  yearBuilt: true,
  landValue: true,
  coordinates: true,
  latitude: true,
  longitude: true,
  neighborhood: true,
  propertyType: true,
  bedrooms: true,
  bathrooms: true,
  lotSize: true,
  zoning: true,
  lastSaleDate: true,
  taxAssessment: true,
  pricePerSqFt: true,
  attributes: true,
  historicalValues: true,
  sourceId: true,
  zillowId: true
});

// Type definitions
// These are properly defined as a group at the end of the file

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  year: true,
  metrics: true,
  records: true
});

export const insertScriptSchema = createInsertSchema(scripts).pick({
  groupId: true,
  name: true,
  status: true,
  type: true,
  code: true,
  order: true
});

export const insertScriptGroupSchema = createInsertSchema(scriptGroups).pick({
  name: true,
  active: true,
  order: true
});

export const insertRegressionModelSchema = createInsertSchema(regressionModels).pick({
  name: true,
  r2: true,
  variables: true,
  cov: true,
  samples: true,
  lastRun: true,
  modelType: true,
  configuration: true
});

// Income Approach insert schemas
export const insertIncomeHotelMotelSchema = createInsertSchema(incomeHotelMotel).pick({
  incomeYear: true,
  supNum: true,
  incomeId: true,
  sizeInSqft: true,
  averageDailyRoomRate: true,
  numberOfRooms: true,
  numberOfRoomNights: true,
  incomeValueReconciled: true,
  incomeValuePerRoom: true,
  assessmentValuePerRoom: true,
  incomeValuePerSqft: true,
  assessmentValuePerSqft: true
});

export const insertIncomeHotelMotelDetailSchema = createInsertSchema(incomeHotelMotelDetail).pick({
  incomeYear: true,
  supNum: true,
  incomeId: true,
  valueType: true,
  roomRevenue: true,
  roomRevenuePct: true,
  roomRevenueUpdate: true,
  vacancyCollectionLoss: true,
  vacancyCollectionLossPct: true,
  vacancyCollectionLossUpdate: true,
  foodBeverageIncome: true,
  foodBeverageIncomePct: true,
  foodBeverageIncomeUpdate: true,
  miscIncome: true,
  miscIncomePct: true,
  miscIncomeUpdate: true,
  effectiveGrossIncome: true,
  effectiveGrossIncomePct: true,
  utilities: true,
  utilitiesPct: true,
  utilitiesUpdate: true,
  maintenanceRepair: true,
  maintenanceRepairPct: true,
  maintenanceRepairUpdate: true,
  departmentExpenses: true,
  departmentExpensesPct: true,
  departmentExpensesUpdate: true,
  management: true,
  managementPct: true,
  managementUpdate: true,
  administrative: true,
  administrativePct: true,
  administrativeUpdate: true,
  payroll: true,
  payrollPct: true,
  payrollUpdate: true,
  insurance: true,
  insurancePct: true,
  insuranceUpdate: true,
  marketing: true,
  marketingPct: true,
  marketingUpdate: true,
  realEstateTax: true,
  realEstateTaxPct: true,
  realEstateTaxUpdate: true,
  franchiseFee: true,
  franchiseFeePct: true,
  franchiseFeeUpdate: true,
  other: true,
  otherPct: true,
  otherUpdate: true,
  totalExpenses: true,
  totalExpensesPct: true,
  totalExpensesUpdate: true,
  netOperatingIncome: true,
  netOperatingIncomePct: true,
  capRate: true,
  capRateUpdate: true,
  taxRate: true,
  taxRateUpdate: true,
  overallCapRate: true,
  incomeValue: true,
  personalPropertyValue: true,
  personalPropertyValueUpdate: true,
  otherValue: true,
  otherValueUpdate: true,
  indicatedIncomeValue: true
});

export const insertIncomeLeaseUpSchema = createInsertSchema(incomeLeaseUp).pick({
  incomeLeaseUpId: true,
  incomeYear: true,
  supNum: true,
  incomeId: true,
  frequency: true,
  leaseType: true,
  unitOfMeasure: true,
  rentLossAreaSqft: true,
  rentSqft: true,
  rentNumberOfYears: true,
  rentTotal: true,
  leasePct: true,
  leaseTotal: true,
  totalFinishOutSqft: true,
  totalFinishOutTotal: true,
  discountRate: true,
  numberOfYears: true,
  leaseUpCost: true,
  leaseUpCostOverride: true,
  netRentableArea: true,
  currentOccupancyPct: true,
  stabilizedOccupancyPct: true,
  stabilizedOccupancy: true,
  spaceToBeAbsorbed: true,
  absorptionPeriodInMonths: true,
  estimatedAbsorptionPerYear: true,
  estimatedAbsorptionPerMonth: true,
  leasingCommissionsPct: true,
  grossRentLossPerSqft: true,
  tenantFinishAllowancePerSqft: true
});

export const insertIncomeLeaseUpMonthListingSchema = createInsertSchema(incomeLeaseUpMonthListing).pick({
  incomeLeaseUpMonthListingId: true,
  incomeLeaseUpId: true,
  yearNumber: true,
  monthNumber: true,
  available: true,
  rentLoss: true,
  finishAllowance: true,
  commissions: true,
  presentValueFactor: true,
  presentValue: true
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Script = typeof scripts.$inferSelect;

export type InsertScriptGroup = z.infer<typeof insertScriptGroupSchema>;
export type ScriptGroup = typeof scriptGroups.$inferSelect;

export type InsertRegressionModel = z.infer<typeof insertRegressionModelSchema>;
export type RegressionModel = typeof regressionModels.$inferSelect;

// Income Approach types
export type InsertIncomeHotelMotel = z.infer<typeof insertIncomeHotelMotelSchema>;
export type IncomeHotelMotel = typeof incomeHotelMotel.$inferSelect;

export type InsertIncomeHotelMotelDetail = z.infer<typeof insertIncomeHotelMotelDetailSchema>;
export type IncomeHotelMotelDetail = typeof incomeHotelMotelDetail.$inferSelect;

export type InsertIncomeLeaseUp = z.infer<typeof insertIncomeLeaseUpSchema>;
export type IncomeLeaseUp = typeof incomeLeaseUp.$inferSelect;

export type InsertIncomeLeaseUpMonthListing = z.infer<typeof insertIncomeLeaseUpMonthListingSchema>;
export type IncomeLeaseUpMonthListing = typeof incomeLeaseUpMonthListing.$inferSelect;

// ETL insert schemas
export const insertEtlDataSourceSchema = createInsertSchema(etlDataSources).pick({
  name: true,
  description: true,
  type: true,
  connectionDetails: true,
  isConnected: true,
  lastConnected: true
});

export const insertEtlTransformationRuleSchema = createInsertSchema(etlTransformationRules).pick({
  name: true,
  description: true,
  dataType: true,
  transformationCode: true,
  isActive: true
});

export const insertEtlJobSchema = createInsertSchema(etlJobs).pick({
  name: true,
  description: true,
  sourceId: true,
  targetId: true,
  transformationIds: true,
  status: true,
  schedule: true,
  metrics: true,
  lastRunAt: true
});

export const insertEtlOptimizationSuggestionSchema = createInsertSchema(etlOptimizationSuggestions).pick({
  jobId: true,
  type: true,
  severity: true,
  title: true,
  description: true,
  suggestedAction: true,
  estimatedImprovement: true,
  status: true,
  category: true,
  implementationComplexity: true,
  suggestedCode: true
});

export const insertEtlBatchJobSchema = createInsertSchema(etlBatchJobs).pick({
  name: true,
  description: true,
  jobIds: true,
  status: true,
  progress: true,
  startedAt: true,
  completedAt: true
});

export const insertEtlAlertSchema = createInsertSchema(etlAlerts).pick({
  jobId: true,
  type: true,
  message: true,
  details: true,
  isRead: true
});

// ETL type exports
export type InsertEtlDataSource = z.infer<typeof insertEtlDataSourceSchema>;
export type EtlDataSource = typeof etlDataSources.$inferSelect;

export type InsertEtlTransformationRule = z.infer<typeof insertEtlTransformationRuleSchema>;
export type EtlTransformationRule = typeof etlTransformationRules.$inferSelect;

export type InsertEtlJob = z.infer<typeof insertEtlJobSchema>;
export type EtlJob = typeof etlJobs.$inferSelect;

export type InsertEtlOptimizationSuggestion = z.infer<typeof insertEtlOptimizationSuggestionSchema>;
export type EtlOptimizationSuggestion = typeof etlOptimizationSuggestions.$inferSelect;

export type InsertEtlBatchJob = z.infer<typeof insertEtlBatchJobSchema>;
export type EtlBatchJob = typeof etlBatchJobs.$inferSelect;

export type InsertEtlAlert = z.infer<typeof insertEtlAlertSchema>;
export type EtlAlert = typeof etlAlerts.$inferSelect;

// Audit records table for regulatory compliance tracking
export const auditRecords = pgTable("audit_records", {
  id: text("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  actor: text("actor").notNull(),
  action: text("action").notNull(), // Maps to AuditAction enum
  entityType: text("entity_type").notNull(), // Maps to AuditEntityType enum
  entityId: text("entity_id").notNull(),
  previousState: jsonb("previous_state"),
  newState: jsonb("new_state"),
  changes: jsonb("changes"),
  ipAddress: text("ip_address"),
  requestId: text("request_id"),
  context: jsonb("context"),
  success: boolean("success").notNull().default(true),
  error: text("error"),
  retentionPeriod: integer("retention_period").notNull().default(2555), // Default to 7 years (2555 days) for regulatory compliance
  isArchived: boolean("is_archived").notNull().default(false)
});

// Insert schema for audit records
export const insertAuditRecordSchema = createInsertSchema(auditRecords).pick({
  id: true,
  timestamp: true,
  actor: true,
  action: true,
  entityType: true,
  entityId: true,
  previousState: true,
  newState: true,
  changes: true,
  ipAddress: true,
  requestId: true,
  context: true,
  success: true,
  error: true,
  retentionPeriod: true,
  isArchived: true
});

export type InsertAuditRecord = z.infer<typeof insertAuditRecordSchema>;
export type AuditRecord = typeof auditRecords.$inferSelect;

// Property history records table
export const propertyHistoryRecords = pgTable("property_history_records", {
  id: serial("id").primaryKey(),
  propertyId: text("property_id").notNull(),
  year: text("year").notNull(),
  value: numeric("value", { precision: 10, scale: 2 }).notNull(),
  source: text("source"),
  notes: text("notes"),
  confidence: integer("confidence"),
  timestamp: timestamp("timestamp").defaultNow(),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow()
}, (table) => {
  return {
    uniqueIdx: uniqueIndex("property_history_unique_idx").on(table.propertyId, table.year)
  };
});

// Insert schema for property history records
export const insertPropertyHistoryRecordSchema = createInsertSchema(propertyHistoryRecords).pick({
  propertyId: true,
  year: true,
  value: true,
  source: true,
  notes: true,
  confidence: true,
  updatedBy: true
});

export type InsertPropertyHistoryRecord = z.infer<typeof insertPropertyHistoryRecordSchema>;
export type PropertyHistoryRecord = typeof propertyHistoryRecords.$inferSelect;
