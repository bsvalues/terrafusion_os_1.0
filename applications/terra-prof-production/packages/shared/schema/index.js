/**
 * TerraFusionPro Shared Schema
 * 
 * This file exports the database schema definitions used across the platform.
 * It uses Drizzle ORM to define tables, relationships, and types.
 */

import { pgTable, pgEnum, serial, varchar, text, integer, decimal, date, boolean, timestamp, primaryKey, unique } from 'drizzle-orm/pg-core';

// Define enums for various field types
export const userRoleEnum = pgEnum('user_role', ['admin', 'appraiser', 'reviewer', 'client', 'field_agent']);
export const propertyTypeEnum = pgEnum('property_type', ['residential', 'commercial', 'industrial', 'land', 'mixed_use']);
export const reportStatusEnum = pgEnum('report_status', ['draft', 'pending_review', 'in_review', 'approved', 'finalized', 'archived']);
export const formTypeEnum = pgEnum('form_type', ['property_details', 'site_inspection', 'valuation', 'comparable', 'environmental']);
export const propertyImageTypeEnum = pgEnum('image_type', ['exterior', 'interior', 'aerial', 'site', 'floor_plan', 'other']);

// Users table for authentication and user management
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull().default('appraiser'),
  company: varchar('company', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  avatar: varchar('avatar', { length: 255 }),
  active: boolean('active').notNull().default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Properties table for storing property details
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  address: varchar('address', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 2 }).notNull(),
  zipCode: varchar('zip_code', { length: 10 }).notNull(),
  county: varchar('county', { length: 100 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  propertyType: propertyTypeEnum('property_type').notNull(),
  yearBuilt: integer('year_built'),
  bedrooms: decimal('bedrooms', { precision: 4, scale: 1 }),
  bathrooms: decimal('bathrooms', { precision: 4, scale: 1 }),
  buildingSize: decimal('building_size', { precision: 12, scale: 2 }),
  lotSize: decimal('lot_size', { precision: 12, scale: 2 }),
  lotUnit: varchar('lot_unit', { length: 10 }).default('sqft'),
  parkingSpaces: integer('parking_spaces'),
  parkingType: varchar('parking_type', { length: 50 }),
  taxAssessedValue: decimal('tax_assessed_value', { precision: 12, scale: 2 }),
  taxYear: integer('tax_year'),
  zonedAs: varchar('zoned_as', { length: 50 }),
  description: text('description'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Property images table for storing property photos, floor plans, etc.
export const propertyImages = pgTable('property_images', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').notNull().references(() => properties.id),
  url: text('url').notNull(),
  caption: varchar('caption', { length: 255 }),
  type: propertyImageTypeEnum('type').notNull().default('exterior'),
  isPrimary: boolean('is_primary').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow()
});

// Appraisal reports table
export const appraisalReports = pgTable('appraisal_reports', {
  id: serial('id').primaryKey(),
  reportNumber: varchar('report_number', { length: 50 }).notNull().unique(),
  propertyId: integer('property_id').notNull().references(() => properties.id),
  clientId: integer('client_id').references(() => users.id),
  appraiserId: integer('appraiser_id').notNull().references(() => users.id),
  reviewerId: integer('reviewer_id').references(() => users.id),
  status: reportStatusEnum('status').notNull().default('draft'),
  effectiveDate: date('effective_date').notNull(),
  inspectionDate: date('inspection_date'),
  purpose: varchar('purpose', { length: 255 }).notNull(),
  approachesUsed: text('approaches_used'),
  estimatedValue: decimal('estimated_value', { precision: 12, scale: 2 }),
  finalValue: decimal('final_value', { precision: 12, scale: 2 }),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  valuationMethod: varchar('valuation_method', { length: 100 }),
  comments: text('comments'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  submittedAt: timestamp('submitted_at'),
  approvedAt: timestamp('approved_at'),
  finalizedAt: timestamp('finalized_at')
});

// Comparable properties table
export const comparables = pgTable('comparables', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id').notNull().references(() => appraisalReports.id),
  address: varchar('address', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 2 }).notNull(),
  zipCode: varchar('zip_code', { length: 10 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  propertyType: propertyTypeEnum('property_type').notNull(),
  yearBuilt: integer('year_built'),
  bedrooms: decimal('bedrooms', { precision: 4, scale: 1 }),
  bathrooms: decimal('bathrooms', { precision: 4, scale: 1 }),
  buildingSize: decimal('building_size', { precision: 12, scale: 2 }),
  lotSize: decimal('lot_size', { precision: 12, scale: 2 }),
  salePrice: decimal('sale_price', { precision: 12, scale: 2 }).notNull(),
  saleDate: date('sale_date').notNull(),
  daysOnMarket: integer('days_on_market'),
  distanceInMiles: decimal('distance_in_miles', { precision: 5, scale: 2 }),
  similarityScore: decimal('similarity_score', { precision: 3, scale: 2 }),
  adjustedPrice: decimal('adjusted_price', { precision: 12, scale: 2 }),
  adjustments: text('adjustments'),
  description: text('description'),
  imageUrl: text('image_url'),
  addedBy: integer('added_by').references(() => users.id),
  addedAt: timestamp('added_at').notNull().defaultNow()
});

// Forms definition table for custom form templates
export const forms = pgTable('forms', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: formTypeEnum('type').notNull(),
  schema: text('schema').notNull(), // JSON schema for the form
  uiSchema: text('ui_schema'), // UI rendering hints as JSON
  version: integer('version').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  isRequired: boolean('is_required').notNull().default(false),
  propertyTypes: text('property_types'), // Array of property types as JSON
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Form submissions table for storing completed form data
export const formSubmissions = pgTable('form_submissions', {
  id: serial('id').primaryKey(),
  formId: integer('form_id').notNull().references(() => forms.id),
  reportId: integer('report_id').notNull().references(() => appraisalReports.id),
  data: text('data').notNull(), // Form data as JSON
  submittedBy: integer('submitted_by').notNull().references(() => users.id),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completionStatus: decimal('completion_status', { precision: 3, scale: 2 }).notNull().default(1.00),
  validationStatus: boolean('validation_status').notNull().default(true),
  validationErrors: text('validation_errors') // Validation errors as JSON
});

// Market data table for storing market analytics
export const marketData = pgTable('market_data', {
  id: serial('id').primaryKey(),
  location: varchar('location', { length: 100 }).notNull(), // City, ZIP code, or other location identifier
  propertyType: propertyTypeEnum('property_type').notNull(),
  period: varchar('period', { length: 20 }).notNull(), // e.g., '2025-Q1', '2025-03', etc.
  medianPrice: decimal('median_price', { precision: 12, scale: 2 }),
  averagePrice: decimal('average_price', { precision: 12, scale: 2 }),
  inventoryCount: integer('inventory_count'),
  daysOnMarket: integer('days_on_market'),
  monthsOfSupply: decimal('months_of_supply', { precision: 4, scale: 1 }),
  soldCount: integer('sold_count'),
  listedCount: integer('listed_count'),
  pricePerSqFt: decimal('price_per_sqft', { precision: 8, scale: 2 }),
  yearOverYearChange: decimal('year_over_year_change', { precision: 5, scale: 2 }),
  quarterOverQuarterChange: decimal('quarter_over_quarter_change', { precision: 5, scale: 2 }),
  updateDate: timestamp('update_date').notNull().defaultNow(),
  dataSource: varchar('data_source', { length: 100 }),
  // Composite unique constraint on location, type, and period
  // This ensures we don't have duplicate entries for the same market segment
  uniqueConstraint: unique().on('location', 'property_type', 'period')
});

// Export the complete schema
export const schema = {
  users,
  properties,
  propertyImages,
  appraisalReports,
  comparables,
  forms,
  formSubmissions,
  marketData,
  // Enums
  userRoleEnum,
  propertyTypeEnum,
  reportStatusEnum,
  formTypeEnum,
  propertyImageTypeEnum
};