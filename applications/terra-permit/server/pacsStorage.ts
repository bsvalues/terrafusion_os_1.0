import { and, eq, sql } from "drizzle-orm";
import { db } from "./db";
import * as pacsSchema from "@shared/pacsSchema";

export interface IPacsStorage {
  // Import Staging methods
  getImportStagingPropertyValue(importId: number): Promise<pacsSchema.ImportStagingPropertyValue | undefined>;
  getImportStagingPropertyValuesByParcelId(parcelId: string): Promise<pacsSchema.ImportStagingPropertyValue[]>;
  createImportStagingPropertyValue(value: pacsSchema.InsertImportStagingPropertyValue): Promise<pacsSchema.ImportStagingPropertyValue>;
  createImportStagingPropertyValues(values: pacsSchema.InsertImportStagingPropertyValue[]): Promise<pacsSchema.ImportStagingPropertyValue[]>;
  
  // Export Snapshot methods
  getExportSnapshotParcelTimeline(snapshotId: string): Promise<pacsSchema.ExportSnapshotParcelTimeline | undefined>;
  getExportSnapshotParcelTimelinesByParcelId(parcelId: string): Promise<pacsSchema.ExportSnapshotParcelTimeline[]>;
  createExportSnapshotParcelTimeline(snapshot: pacsSchema.InsertExportSnapshotParcelTimeline): Promise<pacsSchema.ExportSnapshotParcelTimeline>;
  createExportSnapshotParcelTimelines(snapshots: pacsSchema.InsertExportSnapshotParcelTimeline[]): Promise<pacsSchema.ExportSnapshotParcelTimeline[]>;
  
  // Import Log methods
  getImportLog(logId: number): Promise<pacsSchema.ImportLog | undefined>;
  getImportLogsByType(importType: string): Promise<pacsSchema.ImportLog[]>;
  createImportLog(log: pacsSchema.InsertImportLog): Promise<pacsSchema.ImportLog>;
  updateImportLog(logId: number, log: Partial<pacsSchema.InsertImportLog>): Promise<pacsSchema.ImportLog>;
  completeImportLog(logId: number, successCount: number, errorCount: number, status: string, notes?: string): Promise<pacsSchema.ImportLog>;
  
  // Export Log methods
  getExportLog(logId: number): Promise<pacsSchema.ExportLog | undefined>;
  getExportLogsByType(exportType: string): Promise<pacsSchema.ExportLog[]>;
  createExportLog(log: pacsSchema.InsertExportLog): Promise<pacsSchema.ExportLog>;
  updateExportLog(logId: number, log: Partial<pacsSchema.InsertExportLog>): Promise<pacsSchema.ExportLog>;
  completeExportLog(logId: number, recordCount: number, status: string, notes?: string): Promise<pacsSchema.ExportLog>;
  
  // Validation Error methods
  getValidationErrors(importLogId: number): Promise<pacsSchema.ValidationError[]>;
  createValidationError(error: pacsSchema.InsertValidationError): Promise<pacsSchema.ValidationError>;
  createValidationErrors(errors: pacsSchema.InsertValidationError[]): Promise<pacsSchema.ValidationError[]>;
}

export class PacsDatabaseStorage implements IPacsStorage {
  // Import Staging methods
  async getImportStagingPropertyValue(importId: number): Promise<pacsSchema.ImportStagingPropertyValue | undefined> {
    const results = await db
      .select()
      .from(pacsSchema.importStagingPropertyValues)
      .where(eq(pacsSchema.importStagingPropertyValues.importId, importId))
      .limit(1);
    
    return results.length > 0 ? results[0] : undefined;
  }
  
  async getImportStagingPropertyValuesByParcelId(parcelId: string): Promise<pacsSchema.ImportStagingPropertyValue[]> {
    return await db
      .select()
      .from(pacsSchema.importStagingPropertyValues)
      .where(eq(pacsSchema.importStagingPropertyValues.parcelId, parcelId));
  }
  
  async createImportStagingPropertyValue(value: pacsSchema.InsertImportStagingPropertyValue): Promise<pacsSchema.ImportStagingPropertyValue> {
    const results = await db
      .insert(pacsSchema.importStagingPropertyValues)
      .values(value)
      .returning();
    
    return results[0];
  }
  
  async createImportStagingPropertyValues(values: pacsSchema.InsertImportStagingPropertyValue[]): Promise<pacsSchema.ImportStagingPropertyValue[]> {
    if (values.length === 0) return [];
    
    const results = await db
      .insert(pacsSchema.importStagingPropertyValues)
      .values(values)
      .returning();
    
    return results;
  }
  
  // Export Snapshot methods
  async getExportSnapshotParcelTimeline(snapshotId: string): Promise<pacsSchema.ExportSnapshotParcelTimeline | undefined> {
    const results = await db
      .select()
      .from(pacsSchema.exportSnapshotParcelTimeline)
      .where(eq(pacsSchema.exportSnapshotParcelTimeline.snapshotId, snapshotId))
      .limit(1);
    
    return results.length > 0 ? results[0] : undefined;
  }
  
  async getExportSnapshotParcelTimelinesByParcelId(parcelId: string): Promise<pacsSchema.ExportSnapshotParcelTimeline[]> {
    return await db
      .select()
      .from(pacsSchema.exportSnapshotParcelTimeline)
      .where(eq(pacsSchema.exportSnapshotParcelTimeline.parcelId, parcelId));
  }
  
  async createExportSnapshotParcelTimeline(snapshot: pacsSchema.InsertExportSnapshotParcelTimeline): Promise<pacsSchema.ExportSnapshotParcelTimeline> {
    const values = snapshot as any; // Type casting to avoid TS errors
    const results = await db
      .insert(pacsSchema.exportSnapshotParcelTimeline)
      .values(values)
      .returning();
    
    return results[0];
  }
  
  async createExportSnapshotParcelTimelines(snapshots: pacsSchema.InsertExportSnapshotParcelTimeline[]): Promise<pacsSchema.ExportSnapshotParcelTimeline[]> {
    if (snapshots.length === 0) return [];
    
    const values = snapshots as any[]; // Type casting to avoid TS errors
    const results = await db
      .insert(pacsSchema.exportSnapshotParcelTimeline)
      .values(values)
      .returning();
    
    return results;
  }
  
  // Import Log methods
  async getImportLog(logId: number): Promise<pacsSchema.ImportLog | undefined> {
    const results = await db
      .select()
      .from(pacsSchema.importLog)
      .where(eq(pacsSchema.importLog.logId, logId))
      .limit(1);
    
    return results.length > 0 ? results[0] : undefined;
  }
  
  async getImportLogsByType(importType: string): Promise<pacsSchema.ImportLog[]> {
    return await db
      .select()
      .from(pacsSchema.importLog)
      .where(eq(pacsSchema.importLog.importType, importType))
      .orderBy(sql`${pacsSchema.importLog.startedAt} DESC`);
  }
  
  async createImportLog(log: pacsSchema.InsertImportLog): Promise<pacsSchema.ImportLog> {
    const results = await db
      .insert(pacsSchema.importLog)
      .values(log)
      .returning();
    
    return results[0];
  }
  
  async updateImportLog(logId: number, log: Partial<pacsSchema.InsertImportLog>): Promise<pacsSchema.ImportLog> {
    const results = await db
      .update(pacsSchema.importLog)
      .set(log)
      .where(eq(pacsSchema.importLog.logId, logId))
      .returning();
    
    return results[0];
  }
  
  async completeImportLog(logId: number, successCount: number, errorCount: number, status: string, notes?: string): Promise<pacsSchema.ImportLog> {
    const results = await db
      .update(pacsSchema.importLog)
      .set({
        successCount,
        errorCount, 
        status,
        notes,
        completedAt: new Date()
      })
      .where(eq(pacsSchema.importLog.logId, logId))
      .returning();
    
    return results[0];
  }
  
  // Export Log methods
  async getExportLog(logId: number): Promise<pacsSchema.ExportLog | undefined> {
    const results = await db
      .select()
      .from(pacsSchema.exportLog)
      .where(eq(pacsSchema.exportLog.logId, logId))
      .limit(1);
    
    return results.length > 0 ? results[0] : undefined;
  }
  
  async getExportLogsByType(exportType: string): Promise<pacsSchema.ExportLog[]> {
    return await db
      .select()
      .from(pacsSchema.exportLog)
      .where(eq(pacsSchema.exportLog.exportType, exportType))
      .orderBy(sql`${pacsSchema.exportLog.startedAt} DESC`);
  }
  
  async createExportLog(log: pacsSchema.InsertExportLog): Promise<pacsSchema.ExportLog> {
    const results = await db
      .insert(pacsSchema.exportLog)
      .values(log)
      .returning();
    
    return results[0];
  }
  
  async updateExportLog(logId: number, log: Partial<pacsSchema.InsertExportLog>): Promise<pacsSchema.ExportLog> {
    const results = await db
      .update(pacsSchema.exportLog)
      .set(log)
      .where(eq(pacsSchema.exportLog.logId, logId))
      .returning();
    
    return results[0];
  }
  
  async completeExportLog(logId: number, recordCount: number, status: string, notes?: string): Promise<pacsSchema.ExportLog> {
    const results = await db
      .update(pacsSchema.exportLog)
      .set({
        recordCount,
        status,
        notes,
        completedAt: new Date()
      })
      .where(eq(pacsSchema.exportLog.logId, logId))
      .returning();
    
    return results[0];
  }
  
  // Validation Error methods
  async getValidationErrors(importLogId: number): Promise<pacsSchema.ValidationError[]> {
    return await db
      .select()
      .from(pacsSchema.validationError)
      .where(eq(pacsSchema.validationError.importLogId, importLogId))
      .orderBy(pacsSchema.validationError.recordNumber);
  }
  
  async createValidationError(error: pacsSchema.InsertValidationError): Promise<pacsSchema.ValidationError> {
    const results = await db
      .insert(pacsSchema.validationError)
      .values(error)
      .returning();
    
    return results[0];
  }
  
  async createValidationErrors(errors: pacsSchema.InsertValidationError[]): Promise<pacsSchema.ValidationError[]> {
    if (errors.length === 0) return [];
    
    const results = await db
      .insert(pacsSchema.validationError)
      .values(errors)
      .returning();
    
    return results;
  }
}

// Create and export a singleton instance
export const pacsStorage = new PacsDatabaseStorage();