/**
 * PACS Module Storage Implementation
 * 
 * This file contains the implementation of PACS module storage methods.
 */

import pg from 'pg';
import { PacsModule, InsertPacsModule } from '../shared/schema';

interface PacsModuleRow {
  id: number;
  module_name: string;
  source: string;
  integration: string;
  description: string | null;
  category: string | null;
  api_endpoints: any;
  data_schema: any;
  sync_status: string | null;
  last_sync_timestamp: Date | null;
  created_at: Date;
}

/**
 * Get all PACS modules
 */
export async function getAllPacsModules(pacsModules: Map<number, PacsModule>): Promise<PacsModule[]> {
  // If modules are already in memory, return them
  if (pacsModules.size > 0) {
    return Array.from(pacsModules.values());
  }
  
  // If no modules in memory, try to fetch from database
  try {
    // Connect to database using DATABASE_URL
    console.log("Connecting to database with URL:", process.env.DATABASE_URL ? "URL exists" : "URL is missing");
    // Use direct import since we're now importing pg at the top level
    const { Pool } = pg;
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    console.log("Database pool created");
    
    // Query the database
    console.log("Attempting to connect to database...");
    const client = await pool.connect();
    console.log("Database connection established successfully");
    try {
      const result = await client.query('SELECT * FROM pacs_modules ORDER BY module_name');
      
      // Store results in memory for future requests
      for (const row of result.rows) {
        const module: PacsModule = {
          id: row.id,
          moduleName: row.module_name,
          source: row.source,
          integration: row.integration,
          description: row.description,
          category: row.category || null,
          apiEndpoints: row.api_endpoints || null,
          dataSchema: row.data_schema || null,
          syncStatus: row.sync_status || null,
          lastSyncTimestamp: row.last_sync_timestamp || null,
          createdAt: row.created_at
        };
        pacsModules.set(module.id, module);
      }
      
      return result.rows.map((row: PacsModuleRow) => ({
        id: row.id,
        moduleName: row.module_name,
        source: row.source,
        integration: row.integration,
        description: row.description,
        category: row.category || null,
        apiEndpoints: row.api_endpoints || null,
        dataSchema: row.data_schema || null,
        syncStatus: row.sync_status || null,
        lastSyncTimestamp: row.last_sync_timestamp || null,
        createdAt: row.created_at
      }));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching PACS modules from database:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return [];
  }
}

/**
 * Get a PACS module by ID
 */
export async function getPacsModuleById(pacsModules: Map<number, PacsModule>, id: number): Promise<PacsModule | undefined> {
  // First, try to get the module from memory
  const memModule = pacsModules.get(id);
  if (memModule) {
    return memModule;
  }
  
  // If not in memory, try to fetch from database
  try {
    // Connect to database using DATABASE_URL
    const { Pool } = pg;
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM pacs_modules WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      const module: PacsModule = {
        id: row.id,
        moduleName: row.module_name,
        source: row.source,
        integration: row.integration,
        description: row.description,
        category: row.category || null,
        apiEndpoints: row.api_endpoints || null,
        dataSchema: row.data_schema || null,
        syncStatus: row.sync_status || null,
        lastSyncTimestamp: row.last_sync_timestamp || null,
        createdAt: row.created_at
      };
      
      // Add to memory cache
      pacsModules.set(module.id, module);
      
      return module;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching PACS module by ID from database:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return undefined;
  }
}

/**
 * Get PACS modules grouped by category
 */
export async function getPacsModulesByCategory(pacsModules: Map<number, PacsModule>): Promise<PacsModule[]> {
  // First, get all modules
  const modules = await getAllPacsModules(pacsModules);
  
  // Sort by category, then by module name
  return modules.sort((a, b) => {
    if (a.category === b.category) {
      return a.moduleName.localeCompare(b.moduleName);
    }
    if (!a.category) return 1;
    if (!b.category) return -1;
    return a.category.localeCompare(b.category);
  });
}

/**
 * Update PACS module sync status
 */
export async function updatePacsModuleSyncStatus(
  pacsModules: Map<number, PacsModule>, 
  id: number, 
  syncStatus: string, 
  lastSyncTimestamp: Date
): Promise<PacsModule | undefined> {
  try {
    // Connect to database using DATABASE_URL
    const { Pool } = pg;
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE pacs_modules 
         SET sync_status = $1, last_sync_timestamp = $2
         WHERE id = $3
         RETURNING *`,
        [syncStatus, lastSyncTimestamp, id]
      );
      
      if (result.rows.length === 0) {
        return undefined;
      }
      
      const row = result.rows[0];
      const module: PacsModule = {
        id: row.id,
        moduleName: row.module_name,
        source: row.source,
        integration: row.integration,
        description: row.description,
        category: row.category || null,
        apiEndpoints: row.api_endpoints || null,
        dataSchema: row.data_schema || null,
        syncStatus: row.sync_status || null,
        lastSyncTimestamp: row.last_sync_timestamp || null,
        createdAt: row.created_at
      };
      
      // Update memory cache
      pacsModules.set(module.id, module);
      
      return module;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating PACS module sync status:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Try to update the module in memory if possible
    const existingModule = pacsModules.get(id);
    if (existingModule) {
      const updatedModule = {
        ...existingModule,
        syncStatus,
        lastSyncTimestamp
      };
      pacsModules.set(id, updatedModule);
      return updatedModule;
    }
    
    return undefined;
  }
}

/**
 * Upsert a PACS module
 */
export async function upsertPacsModule(
  pacsModules: Map<number, PacsModule>,
  currentPacsModuleId: number,
  insertModule: InsertPacsModule
): Promise<PacsModule> {
  try {
    // Connect to database using DATABASE_URL
    console.log("Upserting module, connecting to database with URL:", process.env.DATABASE_URL ? "URL exists" : "URL is missing");
    // Use direct import since we're now importing pg at the top level
    const { Pool } = pg;
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    console.log("Database pool created for upsert");
    
    console.log("Attempting to connect to database for upsert...");
    const client = await pool.connect();
    console.log("Database connection established successfully for upsert");
    try {
      // Check if the module exists in the database
      const existingResult = await client.query(
        'SELECT * FROM pacs_modules WHERE module_name = $1',
        [insertModule.moduleName]
      );
      
      let result;
      
      if (existingResult.rows.length > 0) {
        // Update existing module
        const existing = existingResult.rows[0] as PacsModuleRow;
        result = await client.query(
          `UPDATE pacs_modules 
           SET source = $1, integration = $2, description = $3, 
               category = $4, api_endpoints = $5, data_schema = $6,
               sync_status = $7, last_sync_timestamp = $8
           WHERE id = $9
           RETURNING *`,
          [
            insertModule.source || existing.source,
            insertModule.integration || existing.integration,
            insertModule.description !== undefined ? insertModule.description : existing.description,
            insertModule.category !== undefined ? insertModule.category : existing.category,
            insertModule.apiEndpoints !== undefined ? insertModule.apiEndpoints : existing.api_endpoints,
            insertModule.dataSchema !== undefined ? insertModule.dataSchema : existing.data_schema,
            insertModule.syncStatus !== undefined ? insertModule.syncStatus : existing.sync_status,
            insertModule.lastSyncTimestamp !== undefined ? insertModule.lastSyncTimestamp : existing.last_sync_timestamp,
            existing.id
          ]
        );
      } else {
        // Insert new module
        result = await client.query(
          `INSERT INTO pacs_modules (
             module_name, source, integration, description, 
             category, api_endpoints, data_schema, 
             sync_status, last_sync_timestamp
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            insertModule.moduleName,
            insertModule.source || 'PACS WA',
            insertModule.integration || 'pending',
            insertModule.description || null,
            insertModule.category || null,
            insertModule.apiEndpoints || null,
            insertModule.dataSchema || null,
            insertModule.syncStatus || 'pending',
            insertModule.lastSyncTimestamp || null
          ]
        );
      }
      
      if (result.rows.length > 0) {
        const row = result.rows[0] as PacsModuleRow;
        const module: PacsModule = {
          id: row.id,
          moduleName: row.module_name,
          source: row.source,
          integration: row.integration,
          description: row.description,
          category: row.category || null,
          apiEndpoints: row.api_endpoints || null,
          dataSchema: row.data_schema || null,
          syncStatus: row.sync_status || null,
          lastSyncTimestamp: row.last_sync_timestamp || null,
          createdAt: row.created_at
        };
        
        // Update in-memory cache
        pacsModules.set(module.id, module);
        
        return module;
      } else {
        throw new Error('Failed to upsert PACS module');
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error upserting PACS module:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Fall back to in-memory storage if database operation fails
    const existingModule = Array.from(pacsModules.values())
      .find(module => module.moduleName === insertModule.moduleName);
    
    if (existingModule) {
      const updatedModule = {
        ...existingModule,
        ...insertModule,
        description: insertModule.description !== undefined ? insertModule.description : existingModule.description,
        category: insertModule.category !== undefined ? insertModule.category : existingModule.category,
        apiEndpoints: insertModule.apiEndpoints !== undefined ? insertModule.apiEndpoints : existingModule.apiEndpoints,
        dataSchema: insertModule.dataSchema !== undefined ? insertModule.dataSchema : existingModule.dataSchema,
        syncStatus: insertModule.syncStatus !== undefined ? insertModule.syncStatus : existingModule.syncStatus,
        lastSyncTimestamp: insertModule.lastSyncTimestamp !== undefined ? insertModule.lastSyncTimestamp : existingModule.lastSyncTimestamp
      };
      pacsModules.set(existingModule.id, updatedModule);
      return updatedModule;
    } else {
      const id = currentPacsModuleId++;
      const timestamp = new Date();
      const module: PacsModule = {
        ...insertModule,
        id,
        createdAt: timestamp,
        description: insertModule.description !== undefined ? insertModule.description : null,
        category: insertModule.category || null,
        apiEndpoints: insertModule.apiEndpoints || null,
        dataSchema: insertModule.dataSchema || null,
        syncStatus: insertModule.syncStatus || 'pending',
        lastSyncTimestamp: insertModule.lastSyncTimestamp || null
      };
      pacsModules.set(id, module);
      return module;
    }
  }
}