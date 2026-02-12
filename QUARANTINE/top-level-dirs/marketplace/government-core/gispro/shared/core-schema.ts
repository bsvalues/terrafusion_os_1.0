import { pgTable, text, integer, timestamp, boolean, decimal, jsonb } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'),
  department: text('department'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull()
})

export const parcels = pgTable('parcels', {
  id: text('id').primaryKey(),
  parcelNumber: text('parcel_number').notNull().unique(),
  legalDescription: text('legal_description').notNull(),
  address: text('address'),
  ownerName: text('owner_name'),
  assessedValue: decimal('assessed_value', { precision: 12, scale: 2 }),
  marketValue: decimal('market_value', { precision: 12, scale: 2 }),
  acreage: decimal('acreage', { precision: 10, scale: 4 }),
  geometry: jsonb('geometry'),
  zoning: text('zoning'),
  taxYear: integer('tax_year'),
  status: text('status').default('active').notNull(),
  countyId: text('county_id').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  lastModified: timestamp('last_modified').defaultNow().notNull(),
  modifiedBy: text('modified_by').references(() => users.id)
})

export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  parcelId: text('parcel_id').references(() => parcels.id),
  fileName: text('file_name').notNull(),
  documentType: text('document_type').notNull(),
  classification: text('classification'),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  extractedData: jsonb('extracted_data'),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  uploadedBy: text('uploaded_by').references(() => users.id),
  isProcessed: boolean('is_processed').default(false).notNull()
})

export const mapLayers = pgTable('map_layers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  url: text('url'),
  opacity: integer('opacity').default(100),
  isVisible: boolean('is_visible').default(true),
  ordering: integer('ordering').default(0),
  createdBy: text('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const counties = pgTable('counties', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  state: text('state').notNull(),
  fips: text('fips').notNull().unique(),
  population: integer('population'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  metadata: jsonb('metadata')
})

export const workflows = pgTable('workflows', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  status: text('status').default('draft').notNull(),
  config: jsonb('config').notNull(),
  createdBy: text('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastRun: timestamp('last_run'),
  isActive: boolean('is_active').default(true)
})

export const gisLayers = pgTable('gis_layers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  layerType: text('layer_type').notNull(),
  dataSource: text('data_source'),
  styleConfig: jsonb('style_config'),
  countyId: text('county_id').references(() => counties.id),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  userId: text('user_id').references(() => users.id),
  changes: jsonb('changes'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  ipAddress: text('ip_address')
})

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastActiveAt: true })
export const insertParcelSchema = createInsertSchema(parcels).omit({ id: true, lastModified: true })
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, uploadedAt: true })
export const insertMapLayerSchema = createInsertSchema(mapLayers).omit({ id: true, createdAt: true })
export const insertCountySchema = createInsertSchema(counties).omit({ id: true, createdAt: true })
export const insertWorkflowSchema = createInsertSchema(workflows).omit({ id: true, createdAt: true, lastRun: true })
export const insertGisLayerSchema = createInsertSchema(gisLayers).omit({ id: true, createdAt: true, updatedAt: true })

export type User = typeof users.$inferSelect
export type Parcel = typeof parcels.$inferSelect
export type Document = typeof documents.$inferSelect
export type MapLayer = typeof mapLayers.$inferSelect
export type County = typeof counties.$inferSelect
export type Workflow = typeof workflows.$inferSelect
export type GisLayer = typeof gisLayers.$inferSelect
export type AuditLog = typeof auditLogs.$inferSelect

export type InsertUser = z.infer<typeof insertUserSchema>
export type InsertParcel = z.infer<typeof insertParcelSchema>
export type InsertDocument = z.infer<typeof insertDocumentSchema>
export type InsertMapLayer = z.infer<typeof insertMapLayerSchema>
export type InsertCounty = z.infer<typeof insertCountySchema>
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>
export type InsertGisLayer = z.infer<typeof insertGisLayerSchema>