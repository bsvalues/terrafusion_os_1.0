import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { integer, pgTable, serial, text, timestamp, decimal, varchar, uuid, date } from 'drizzle-orm/pg-core';

// Import Staging Table Schemas
export const importStagingPropertyValues = pgTable('import_staging_property_values', {
  importId: serial('import_id').primaryKey(),
  parcelId: varchar('parcel_id', { length: 20 }).notNull(),
  valueType: varchar('value_type', { length: 50 }).notNull(),
  valueAmount: decimal('value_amount', { precision: 18, scale: 2 }).notNull(),
  effectiveDate: date('effective_date').notNull(),
  source: varchar('source', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Export Snapshot Table Schemas
export const exportSnapshotParcelTimeline = pgTable('export_snapshot_parcel_timeline', {
  snapshotId: uuid('snapshot_id').defaultRandom().primaryKey(),
  parcelId: varchar('parcel_id', { length: 20 }).notNull(),
  year: integer('year').notNull(),
  value: decimal('value', { precision: 18, scale: 2 }).notNull(),
  extractedBy: varchar('extracted_by', { length: 50 }).notNull(),
  exportedAt: timestamp('exported_at').defaultNow().notNull()
});

// Import Staging Schema for Property Values
export const insertImportStagingPropertyValueSchema = createInsertSchema(importStagingPropertyValues)
  .omit({ importId: true, createdAt: true });

export type InsertImportStagingPropertyValue = z.infer<typeof insertImportStagingPropertyValueSchema>;
export type ImportStagingPropertyValue = typeof importStagingPropertyValues.$inferSelect;

// Export Snapshot Schema for Parcel Timeline
export const insertExportSnapshotParcelTimelineSchema = createInsertSchema(exportSnapshotParcelTimeline)
  .omit({ snapshotId: true, exportedAt: true });

export type InsertExportSnapshotParcelTimeline = z.infer<typeof insertExportSnapshotParcelTimelineSchema>;
export type ExportSnapshotParcelTimeline = typeof exportSnapshotParcelTimeline.$inferSelect;

// Schema for Import Log
export const importLog = pgTable('import_log', {
  logId: serial('log_id').primaryKey(),
  importType: varchar('import_type', { length: 50 }).notNull(),
  sourceFile: varchar('source_file', { length: 255 }),
  recordCount: integer('record_count').notNull(),
  successCount: integer('success_count').notNull(),
  errorCount: integer('error_count').notNull(),
  importedBy: varchar('imported_by', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'pending', 'validating', 'completed', 'failed'
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  notes: text('notes')
});

export const insertImportLogSchema = createInsertSchema(importLog)
  .omit({ logId: true, startedAt: true, completedAt: true });

export type InsertImportLog = z.infer<typeof insertImportLogSchema>;
export type ImportLog = typeof importLog.$inferSelect;

// Schema for Export Log
export const exportLog = pgTable('export_log', {
  logId: serial('log_id').primaryKey(),
  exportType: varchar('export_type', { length: 50 }).notNull(),
  destinationFile: varchar('destination_file', { length: 255 }),
  recordCount: integer('record_count').notNull(),
  exportedBy: varchar('exported_by', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'pending', 'completed', 'failed'
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  notes: text('notes')
});

export const insertExportLogSchema = createInsertSchema(exportLog)
  .omit({ logId: true, startedAt: true, completedAt: true });

export type InsertExportLog = z.infer<typeof insertExportLogSchema>;
export type ExportLog = typeof exportLog.$inferSelect;

// Schema for validation errors
export const validationError = pgTable('validation_error', {
  errorId: serial('error_id').primaryKey(),
  importLogId: integer('import_log_id').references(() => importLog.logId),
  recordNumber: integer('record_number'),
  fieldName: varchar('field_name', { length: 100 }),
  errorMessage: text('error_message').notNull(),
  severity: varchar('severity', { length: 20 }).notNull(), // 'info', 'warning', 'error'
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const insertValidationErrorSchema = createInsertSchema(validationError)
  .omit({ errorId: true, createdAt: true });

export type InsertValidationError = z.infer<typeof insertValidationErrorSchema>;
export type ValidationError = typeof validationError.$inferSelect;