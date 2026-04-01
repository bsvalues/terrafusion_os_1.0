/**
 * Database Adapters
 * 
 * This file contains adapters for connecting to different types of databases
 * and querying their schemas. Each adapter implements a common interface
 * for consistency across different database types.
 */

import { DatabaseType } from './types';
import { Pool as PgPool } from 'pg';
import { createPool as createMySqlPool } from 'mysql2/promise';
import * as sqlite3 from 'sqlite3';
import { open as openSqlite } from 'sqlite';

// Interface for database adapter options
export interface DatabaseAdapterOptions {
  testConnectionOnly?: boolean;
  includeViews?: boolean;
  includeProcedures?: boolean;
  includeFunctions?: boolean;
  includeTriggers?: boolean;
  includeConstraints?: boolean;
  tableFilter?: string[];
}

/**
 * Factory function to query database schema based on database type
 */
export async function queryDatabaseSchema(
  connectionString: string,
  databaseType: DatabaseType,
  options: DatabaseAdapterOptions = {}
): Promise<any> {
  try {
    switch (databaseType) {
      case DatabaseType.PostgreSQL:
        return await queryPostgresSchema(connectionString, options);
      case DatabaseType.MySQL:
        return await queryMySqlSchema(connectionString, options);
      case DatabaseType.SQLite:
        return await querySqliteSchema(connectionString, options);
      case DatabaseType.SQLServer:
        return await querySqlServerSchema(connectionString, options);
      case DatabaseType.Oracle:
        return await queryOracleSchema(connectionString, options);
      case DatabaseType.MongoDB:
        return await queryMongoDbSchema(connectionString, options);
      default:
        throw new Error(`Unsupported database type: ${databaseType}`);
    }
  } catch (error) {
    console.error(`Error querying database schema for ${databaseType}:`, error);
    throw error;
  }
}

/**
 * Query PostgreSQL database schema
 */
async function queryPostgresSchema(
  connectionString: string,
  options: DatabaseAdapterOptions = {}
): Promise<any> {
  // For now we'll use mocked data for development
  if (process.env.NODE_ENV === 'development' || process.env.USE_MOCKED_DATA === 'true') {
    // Return mock schema data
    return getMockSchemaData(DatabaseType.PostgreSQL, options);
  }

  const pool = new PgPool({ connectionString });
  
  try {
    if (options.testConnectionOnly) {
      // Just test the connection
      const client = await pool.connect();
      const result = await client.query('SELECT version(), current_database() as dbname');
      client.release();
      
      return {
        databaseInfo: {
          name: result.rows[0].dbname,
          version: result.rows[0].version.split(' ')[1],
          type: 'PostgreSQL'
        }
      };
    }
    
    // Query tables
    const tablesQuery = `
      SELECT 
        t.table_name as name,
        t.table_schema as schema,
        obj_description(pgc.oid) as description,
        pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)) / 1024.0 / 1024.0 as estimated_size_mb
      FROM 
        information_schema.tables t
      JOIN 
        pg_catalog.pg_class pgc ON pgc.relname = t.table_name
      WHERE 
        t.table_schema NOT IN ('pg_catalog', 'information_schema')
        AND t.table_type = 'BASE TABLE'
      ORDER BY 
        t.table_schema, t.table_name
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    const tables = [];
    
    // For each table, query its columns, constraints, etc.
    for (const table of tablesResult.rows) {
      // Query columns
      const columnsQuery = `
        SELECT 
          c.column_name as name,
          c.data_type as type,
          c.is_nullable = 'YES' as nullable,
          c.column_default as default_value,
          c.ordinal_position as position,
          c.character_maximum_length as length,
          c.numeric_precision as precision,
          c.numeric_scale as scale,
          (SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
              AND tc.table_name = kcu.table_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_schema = c.table_schema
              AND tc.table_name = c.table_name
              AND kcu.column_name = c.column_name
          )) as is_primary_key,
          (SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
              AND tc.table_name = kcu.table_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_schema = c.table_schema
              AND tc.table_name = c.table_name
              AND kcu.column_name = c.column_name
          )) as is_foreign_key,
          (SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
              AND tc.table_name = kcu.table_name
            WHERE tc.constraint_type = 'UNIQUE'
              AND tc.table_schema = c.table_schema
              AND tc.table_name = c.table_name
              AND kcu.column_name = c.column_name
          )) as is_unique,
          pg_catalog.col_description(
            (quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass::oid, 
            c.ordinal_position
          ) as description
        FROM 
          information_schema.columns c
        WHERE 
          c.table_schema = $1
          AND c.table_name = $2
        ORDER BY 
          c.ordinal_position
      `;
      
      const columnsResult = await pool.query(columnsQuery, [table.schema, table.name]);
      
      // Map column results to our schema format
      const columns = columnsResult.rows.map(col => ({
        name: col.name,
        type: col.type,
        nullable: col.nullable,
        defaultValue: col.default_value,
        autoIncrement: col.default_value ? col.default_value.includes('nextval') : false,
        isPrimaryKey: col.is_primary_key,
        isForeignKey: col.is_foreign_key,
        isUnique: col.is_unique,
        description: col.description,
        position: col.position,
        length: col.length,
        precision: col.precision,
        scale: col.scale
      }));
      
      // Query primary key
      const pkQuery = `
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
          AND tc.table_name = kcu.table_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2
        ORDER BY kcu.ordinal_position
      `;
      
      const pkResult = await pool.query(pkQuery, [table.schema, table.name]);
      const primaryKey = pkResult.rows.map(row => row.column_name);
      
      // Query foreign keys
      const fkQuery = `
        SELECT
          tc.constraint_name as name,
          kcu.column_name,
          ccu.table_schema as foreign_table_schema,
          ccu.table_name as foreign_table_name,
          ccu.column_name as foreign_column_name,
          rc.update_rule,
          rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
          AND tc.table_name = kcu.table_name
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
          AND tc.table_schema = ccu.constraint_schema
        JOIN information_schema.referential_constraints rc
          ON tc.constraint_name = rc.constraint_name
          AND tc.table_schema = rc.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2
        ORDER BY kcu.ordinal_position
      `;
      
      const fkResult = await pool.query(fkQuery, [table.schema, table.name]);
      
      // Group foreign keys by constraint name
      const foreignKeyMap = new Map();
      for (const row of fkResult.rows) {
        if (!foreignKeyMap.has(row.name)) {
          foreignKeyMap.set(row.name, {
            name: row.name,
            columnNames: [],
            referencedTableName: row.foreign_table_name,
            referencedColumnNames: [],
            updateRule: row.update_rule,
            deleteRule: row.delete_rule
          });
        }
        
        const fk = foreignKeyMap.get(row.name);
        fk.columnNames.push(row.column_name);
        fk.referencedColumnNames.push(row.foreign_column_name);
      }
      
      const foreignKeys = Array.from(foreignKeyMap.values());
      
      // Query indexes
      const indexQuery = `
        SELECT
          i.relname as name,
          am.amname as method,
          array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as column_names,
          ix.indisunique as is_unique,
          ix.indisprimary as is_primary
        FROM pg_index ix
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_class t ON t.oid = ix.indrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN pg_am am ON am.oid = i.relam
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        WHERE t.relkind = 'r'
          AND n.nspname = $1
          AND t.relname = $2
        GROUP BY i.relname, am.amname, ix.indisunique, ix.indisprimary
        ORDER BY i.relname
      `;
      
      const indexResult = await pool.query(indexQuery, [table.schema, table.name]);
      
      const indexes = indexResult.rows.map(idx => ({
        name: idx.name,
        columnNames: idx.column_names,
        isUnique: idx.is_unique,
        isPrimaryKey: idx.is_primary,
        method: idx.method
      }));
      
      // Estimate row count
      const rowCountQuery = `
        SELECT reltuples::bigint as estimate
        FROM pg_class
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_class.relname = $1
          AND pg_namespace.nspname = $2
      `;
      
      const rowCountResult = await pool.query(rowCountQuery, [table.name, table.schema]);
      const estimatedRowCount = rowCountResult.rows[0]?.estimate || 0;
      
      // Combine all information
      tables.push({
        name: table.name,
        schema: table.schema,
        description: table.description,
        columns,
        primaryKey,
        foreignKeys,
        indexes,
        estimatedRowCount,
        estimatedSizeMb: parseFloat(table.estimated_size_mb || '0')
      });
    }
    
    // Query views if requested
    let views = [];
    if (options.includeViews !== false) {
      const viewsQuery = `
        SELECT 
          v.table_name as name,
          v.table_schema as schema,
          pg_catalog.pg_get_viewdef(c.oid, true) as definition,
          obj_description(c.oid) as description
        FROM 
          information_schema.views v
        JOIN 
          pg_catalog.pg_class c ON c.relname = v.table_name
        JOIN 
          pg_catalog.pg_namespace n ON n.oid = c.relnamespace AND n.nspname = v.table_schema
        WHERE 
          v.table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY 
          v.table_schema, v.table_name
      `;
      
      const viewsResult = await pool.query(viewsQuery);
      
      // For each view, query its columns
      for (const view of viewsResult.rows) {
        const columnsQuery = `
          SELECT 
            c.column_name as name,
            c.data_type as type,
            c.is_nullable = 'YES' as nullable,
            c.ordinal_position as position,
            c.character_maximum_length as length,
            c.numeric_precision as precision,
            c.numeric_scale as scale
          FROM 
            information_schema.columns c
          WHERE 
            c.table_schema = $1
            AND c.table_name = $2
          ORDER BY 
            c.ordinal_position
        `;
        
        const columnsResult = await pool.query(columnsQuery, [view.schema, view.name]);
        
        const columns = columnsResult.rows.map(col => ({
          name: col.name,
          type: col.type,
          nullable: col.nullable,
          position: col.position,
          length: col.length,
          precision: col.precision,
          scale: col.scale
        }));
        
        // Check if view is materialized
        const materializedQuery = `
          SELECT COUNT(*) > 0 as is_materialized
          FROM pg_catalog.pg_class c
          JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relname = $1
            AND n.nspname = $2
            AND c.relkind = 'm'
        `;
        
        const materializedResult = await pool.query(materializedQuery, [view.name, view.schema]);
        const isMaterialized = materializedResult.rows[0]?.is_materialized || false;
        
        views.push({
          name: view.name,
          schema: view.schema,
          description: view.description,
          definition: view.definition,
          columns,
          isMaterialized
        });
      }
    }
    
    // Query procedures, functions, triggers, and constraints based on options
    let procedures = [];
    let functions = [];
    let triggers = [];
    let constraints = [];
    
    // Query procedures if requested
    if (options.includeProcedures !== false) {
      const proceduresQuery = `
        SELECT
          p.proname as name,
          n.nspname as schema,
          pg_catalog.pg_get_function_arguments(p.oid) as arguments,
          pg_catalog.pg_get_function_result(p.oid) as return_type,
          pg_catalog.pg_get_functiondef(p.oid) as definition,
          l.lanname as language,
          obj_description(p.oid) as description
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        JOIN pg_catalog.pg_language l ON l.oid = p.prolang
        WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
          AND p.prokind = 'p'  -- 'p' for procedure (PostgreSQL 11+)
        ORDER BY n.nspname, p.proname
      `;
      
      const proceduresResult = await pool.query(proceduresQuery);
      
      procedures = proceduresResult.rows.map(proc => {
        // Parse arguments into parameters
        const argStr = proc.arguments;
        const parameters = argStr.split(',').map((arg, i) => {
          const parts = arg.trim().split(' ');
          return {
            name: parts[0] || `param${i + 1}`,
            type: parts.slice(1).join(' '),
            position: i + 1
          };
        });
        
        return {
          name: proc.name,
          schema: proc.schema,
          description: proc.description,
          parameters,
          returnType: proc.return_type,
          definition: proc.definition,
          language: proc.language
        };
      });
    }
    
    // Query functions if requested
    if (options.includeFunctions !== false) {
      const functionsQuery = `
        SELECT
          p.proname as name,
          n.nspname as schema,
          pg_catalog.pg_get_function_arguments(p.oid) as arguments,
          pg_catalog.pg_get_function_result(p.oid) as return_type,
          pg_catalog.pg_get_functiondef(p.oid) as definition,
          l.lanname as language,
          p.proretset as returns_set,
          p.proisstrict as is_strict,
          p.provolatile as volatility,
          obj_description(p.oid) as description
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        JOIN pg_catalog.pg_language l ON l.oid = p.prolang
        WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
          AND p.prokind = 'f'  -- 'f' for function (PostgreSQL 11+)
        ORDER BY n.nspname, p.proname
      `;
      
      const functionsResult = await pool.query(functionsQuery);
      
      functions = functionsResult.rows.map(func => {
        // Parse arguments into parameters
        const argStr = func.arguments;
        const parameters = argStr.split(',').map((arg, i) => {
          const parts = arg.trim().split(' ');
          return {
            name: parts[0] || `param${i + 1}`,
            type: parts.slice(1).join(' '),
            position: i + 1
          };
        });
        
        return {
          name: func.name,
          schema: func.schema,
          description: func.description,
          parameters,
          returnType: func.return_type,
          definition: func.definition,
          language: func.language,
          deterministic: func.volatility === 'i'  // 'i' for immutable
        };
      });
    }
    
    // Query triggers if requested
    if (options.includeTriggers !== false) {
      const triggersQuery = `
        SELECT
          t.tgname as name,
          n.nspname as schema,
          c.relname as table_name,
          pg_catalog.pg_get_triggerdef(t.oid) as definition,
          t.tgenabled as enabled,
          obj_description(t.oid) as description,
          CASE 
            WHEN t.tgtype & 1 = 1 THEN 'ROW'
            ELSE 'STATEMENT'
          END as level,
          CASE 
            WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
            WHEN t.tgtype & 16 = 16 THEN 'AFTER'
            WHEN t.tgtype & 64 = 64 THEN 'INSTEAD OF'
            ELSE 'UNKNOWN'
          END as timing,
          CASE 
            WHEN t.tgtype & 4 = 4 THEN 'INSERT'
            WHEN t.tgtype & 8 = 8 THEN 'DELETE'
            WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
            WHEN t.tgtype & 32 = 32 THEN 'TRUNCATE'
            ELSE 'UNKNOWN'
          END as event
        FROM pg_catalog.pg_trigger t
        JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
          AND NOT t.tgisinternal
        ORDER BY n.nspname, c.relname, t.tgname
      `;
      
      const triggersResult = await pool.query(triggersQuery);
      
      triggers = triggersResult.rows.map(trig => ({
        name: trig.name,
        schema: trig.schema,
        tableName: trig.table_name,
        event: trig.event,
        timing: trig.timing,
        definition: trig.definition,
        enabled: trig.enabled === 'O',  // 'O' for enabled
        description: trig.description
      }));
    }
    
    // Query constraints if requested
    if (options.includeConstraints !== false) {
      const constraintsQuery = `
        SELECT
          tc.constraint_name as name,
          tc.table_schema as schema,
          tc.table_name,
          tc.constraint_type as type,
          array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as column_names,
          CASE 
            WHEN tc.constraint_type = 'CHECK' THEN pg_get_constraintdef(pgc.oid)
            ELSE NULL
          END as check_expression,
          CASE 
            WHEN tc.constraint_type = 'FOREIGN KEY' THEN (
              SELECT ccu.table_name 
              FROM information_schema.constraint_column_usage ccu
              WHERE ccu.constraint_name = tc.constraint_name
                AND ccu.constraint_schema = tc.constraint_schema
              LIMIT 1
            )
            ELSE NULL
          END as referenced_table,
          CASE 
            WHEN tc.constraint_type = 'FOREIGN KEY' THEN (
              SELECT array_agg(ccu.column_name ORDER BY kcu.ordinal_position) 
              FROM information_schema.constraint_column_usage ccu
              JOIN information_schema.key_column_usage kcu 
                ON ccu.constraint_name = kcu.constraint_name
                AND ccu.constraint_schema = kcu.constraint_schema
              WHERE ccu.constraint_name = tc.constraint_name
                AND ccu.constraint_schema = tc.constraint_schema
            )
            ELSE NULL
          END as referenced_column_names
        FROM information_schema.table_constraints tc
        JOIN pg_catalog.pg_constraint pgc ON pgc.conname = tc.constraint_name
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
          AND tc.table_name = kcu.table_name
        WHERE tc.table_schema NOT IN ('pg_catalog', 'information_schema')
          AND tc.constraint_type IN ('CHECK', 'UNIQUE', 'PRIMARY KEY', 'FOREIGN KEY')
        GROUP BY tc.constraint_name, tc.table_schema, tc.table_name, tc.constraint_type, pgc.oid
        ORDER BY tc.table_schema, tc.table_name, tc.constraint_name
      `;
      
      const constraintsResult = await pool.query(constraintsQuery);
      
      constraints = constraintsResult.rows.map(con => ({
        name: con.name,
        schema: con.schema,
        type: con.type,
        tableName: con.table_name,
        columnNames: con.column_names,
        checkExpression: con.check_expression,
        referencedTableName: con.referenced_table,
        referencedColumnNames: con.referenced_column_names
      }));
    }
    
    // Calculate total estimated size
    const totalSizeMb = tables.reduce((sum, table) => sum + (table.estimatedSizeMb || 0), 0);
    
    return {
      tables,
      views,
      procedures,
      functions,
      triggers,
      constraints,
      estimatedSizeMb: totalSizeMb,
      databaseInfo: {
        type: 'PostgreSQL'
      }
    };
  } finally {
    // Release resources
    await pool.end();
  }
}

/**
 * Query MySQL database schema
 */
async function queryMySqlSchema(
  connectionString: string,
  options: DatabaseAdapterOptions = {}
): Promise<any> {
  // For now we'll use mocked data for development
  if (process.env.NODE_ENV === 'development' || process.env.USE_MOCKED_DATA === 'true') {
    // Return mock schema data with MySQL-specific adjustments
    return getMockSchemaData(DatabaseType.MySQL, options);
  }

  // TODO: Implement real MySQL schema querying
  throw new Error('MySQL schema querying not yet implemented');
}

/**
 * Query SQLite database schema
 */
async function querySqliteSchema(
  connectionString: string,
  options: DatabaseAdapterOptions = {}
): Promise<any> {
  // For now we'll use mocked data for development
  if (process.env.NODE_ENV === 'development' || process.env.USE_MOCKED_DATA === 'true') {
    // Return mock schema data with SQLite-specific adjustments
    return getMockSchemaData(DatabaseType.SQLite, options);
  }

  // TODO: Implement real SQLite schema querying
  throw new Error('SQLite schema querying not yet implemented');
}

/**
 * Query SQL Server database schema
 */
async function querySqlServerSchema(
  connectionString: string,
  options: DatabaseAdapterOptions = {}
): Promise<any> {
  // For now we'll use mocked data for development
  if (process.env.NODE_ENV === 'development' || process.env.USE_MOCKED_DATA === 'true') {
    // Return mock schema data with SQL Server-specific adjustments
    return getMockSchemaData(DatabaseType.SQLServer, options);
  }

  // TODO: Implement real SQL Server schema querying
  throw new Error('SQL Server schema querying not yet implemented');
}

/**
 * Query Oracle database schema
 */
async function queryOracleSchema(
  connectionString: string,
  options: DatabaseAdapterOptions = {}
): Promise<any> {
  // For now we'll use mocked data for development
  if (process.env.NODE_ENV === 'development' || process.env.USE_MOCKED_DATA === 'true') {
    // Return mock schema data with Oracle-specific adjustments
    return getMockSchemaData(DatabaseType.Oracle, options);
  }

  // TODO: Implement real Oracle schema querying
  throw new Error('Oracle schema querying not yet implemented');
}

/**
 * Query MongoDB database schema
 */
async function queryMongoDbSchema(
  connectionString: string,
  options: DatabaseAdapterOptions = {}
): Promise<any> {
  // For now we'll use mocked data for development
  if (process.env.NODE_ENV === 'development' || process.env.USE_MOCKED_DATA === 'true') {
    // Return mock schema data with MongoDB-specific adjustments
    return getMockSchemaData(DatabaseType.MongoDB, options);
  }

  // TODO: Implement real MongoDB schema querying
  throw new Error('MongoDB schema querying not yet implemented');
}

/**
 * Get mock schema data for development
 */
function getMockSchemaData(databaseType: DatabaseType, options: DatabaseAdapterOptions = {}): any {
  if (options.testConnectionOnly) {
    return {
      databaseInfo: {
        name: 'mock_database',
        version: '14.5',
        type: databaseType
      }
    };
  }
  
  // Mock tables
  const tables = [
    {
      name: 'users',
      schema: 'public',
      description: 'User accounts',
      columns: [
        {
          name: 'id',
          type: databaseType === DatabaseType.PostgreSQL ? 'integer' : 
                databaseType === DatabaseType.MySQL ? 'int' : 
                databaseType === DatabaseType.SQLite ? 'INTEGER' : 
                databaseType === DatabaseType.SQLServer ? 'int' : 
                databaseType === DatabaseType.Oracle ? 'NUMBER' : 'integer',
          nullable: false,
          isPrimaryKey: true,
          position: 1,
          autoIncrement: true
        },
        {
          name: 'email',
          type: databaseType === DatabaseType.PostgreSQL ? 'varchar' : 
                databaseType === DatabaseType.MySQL ? 'varchar' : 
                databaseType === DatabaseType.SQLite ? 'TEXT' : 
                databaseType === DatabaseType.SQLServer ? 'varchar' : 
                databaseType === DatabaseType.Oracle ? 'VARCHAR2' : 'string',
          nullable: false,
          isUnique: true,
          position: 2,
          length: 255
        },
        {
          name: 'password_hash',
          type: databaseType === DatabaseType.PostgreSQL ? 'varchar' : 
                databaseType === DatabaseType.MySQL ? 'varchar' : 
                databaseType === DatabaseType.SQLite ? 'TEXT' : 
                databaseType === DatabaseType.SQLServer ? 'varchar' : 
                databaseType === DatabaseType.Oracle ? 'VARCHAR2' : 'string',
          nullable: false,
          position: 3,
          length: 60
        },
        {
          name: 'created_at',
          type: databaseType === DatabaseType.PostgreSQL ? 'timestamp' : 
                databaseType === DatabaseType.MySQL ? 'datetime' : 
                databaseType === DatabaseType.SQLite ? 'TEXT' : 
                databaseType === DatabaseType.SQLServer ? 'datetime' : 
                databaseType === DatabaseType.Oracle ? 'TIMESTAMP' : 'date',
          nullable: false,
          defaultValue: databaseType === DatabaseType.PostgreSQL ? 'CURRENT_TIMESTAMP' :
                        databaseType === DatabaseType.MySQL ? 'CURRENT_TIMESTAMP' :
                        databaseType === DatabaseType.SQLite ? "datetime('now')" :
                        databaseType === DatabaseType.SQLServer ? 'GETDATE()' :
                        databaseType === DatabaseType.Oracle ? 'SYSTIMESTAMP' : '',
          position: 4
        },
        {
          name: 'updated_at',
          type: databaseType === DatabaseType.PostgreSQL ? 'timestamp' : 
                databaseType === DatabaseType.MySQL ? 'datetime' : 
                databaseType === DatabaseType.SQLite ? 'TEXT' : 
                databaseType === DatabaseType.SQLServer ? 'datetime' : 
                databaseType === DatabaseType.Oracle ? 'TIMESTAMP' : 'date',
          nullable: true,
          position: 5
        }
      ],
      primaryKey: ['id'],
      indexes: [
        {
          name: 'users_email_idx',
          columnNames: ['email'],
          isUnique: true,
          isPrimaryKey: false
        }
      ],
      estimatedRowCount: 1000,
      estimatedSizeMb: 0.5
    },
    {
      name: 'posts',
      schema: 'public',
      description: 'Blog posts',
      columns: [
        {
          name: 'id',
          type: databaseType === DatabaseType.PostgreSQL ? 'integer' : 
                databaseType === DatabaseType.MySQL ? 'int' : 
                databaseType === DatabaseType.SQLite ? 'INTEGER' : 
                databaseType === DatabaseType.SQLServer ? 'int' : 
                databaseType === DatabaseType.Oracle ? 'NUMBER' : 'integer',
          nullable: false,
          isPrimaryKey: true,
          position: 1,
          autoIncrement: true
        },
        {
          name: 'user_id',
          type: databaseType === DatabaseType.PostgreSQL ? 'integer' : 
                databaseType === DatabaseType.MySQL ? 'int' : 
                databaseType === DatabaseType.SQLite ? 'INTEGER' : 
                databaseType === DatabaseType.SQLServer ? 'int' : 
                databaseType === DatabaseType.Oracle ? 'NUMBER' : 'integer',
          nullable: false,
          isForeignKey: true,
          position: 2
        },
        {
          name: 'title',
          type: databaseType === DatabaseType.PostgreSQL ? 'varchar' : 
                databaseType === DatabaseType.MySQL ? 'varchar' : 
                databaseType === DatabaseType.SQLite ? 'TEXT' : 
                databaseType === DatabaseType.SQLServer ? 'varchar' : 
                databaseType === DatabaseType.Oracle ? 'VARCHAR2' : 'string',
          nullable: false,
          position: 3,
          length: 200
        },
        {
          name: 'content',
          type: databaseType === DatabaseType.PostgreSQL ? 'text' : 
                databaseType === DatabaseType.MySQL ? 'text' : 
                databaseType === DatabaseType.SQLite ? 'TEXT' : 
                databaseType === DatabaseType.SQLServer ? 'text' : 
                databaseType === DatabaseType.Oracle ? 'CLOB' : 'string',
          nullable: false,
          position: 4
        },
        {
          name: 'published',
          type: databaseType === DatabaseType.PostgreSQL ? 'boolean' : 
                databaseType === DatabaseType.MySQL ? 'tinyint' : 
                databaseType === DatabaseType.SQLite ? 'INTEGER' : 
                databaseType === DatabaseType.SQLServer ? 'bit' : 
                databaseType === DatabaseType.Oracle ? 'NUMBER(1)' : 'boolean',
          nullable: false,
          defaultValue: databaseType === DatabaseType.MySQL ? '0' : 'false',
          position: 5
        },
        {
          name: 'created_at',
          type: databaseType === DatabaseType.PostgreSQL ? 'timestamp' : 
                databaseType === DatabaseType.MySQL ? 'datetime' : 
                databaseType === DatabaseType.SQLite ? 'TEXT' : 
                databaseType === DatabaseType.SQLServer ? 'datetime' : 
                databaseType === DatabaseType.Oracle ? 'TIMESTAMP' : 'date',
          nullable: false,
          defaultValue: databaseType === DatabaseType.PostgreSQL ? 'CURRENT_TIMESTAMP' :
                        databaseType === DatabaseType.MySQL ? 'CURRENT_TIMESTAMP' :
                        databaseType === DatabaseType.SQLite ? "datetime('now')" :
                        databaseType === DatabaseType.SQLServer ? 'GETDATE()' :
                        databaseType === DatabaseType.Oracle ? 'SYSTIMESTAMP' : '',
          position: 6
        },
        {
          name: 'updated_at',
          type: databaseType === DatabaseType.PostgreSQL ? 'timestamp' : 
                databaseType === DatabaseType.MySQL ? 'datetime' : 
                databaseType === DatabaseType.SQLite ? 'TEXT' : 
                databaseType === DatabaseType.SQLServer ? 'datetime' : 
                databaseType === DatabaseType.Oracle ? 'TIMESTAMP' : 'date',
          nullable: true,
          position: 7
        }
      ],
      primaryKey: ['id'],
      foreignKeys: [
        {
          name: 'posts_user_id_fkey',
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          updateRule: 'CASCADE',
          deleteRule: 'CASCADE'
        }
      ],
      indexes: [
        {
          name: 'posts_user_id_idx',
          columnNames: ['user_id'],
          isUnique: false,
          isPrimaryKey: false
        }
      ],
      estimatedRowCount: 5000,
      estimatedSizeMb: 2.5
    },
    {
      name: 'comments',
      schema: 'public',
      description: 'Post comments',
      columns: [
        {
          name: 'id',
          type: databaseType === DatabaseType.PostgreSQL ? 'integer' : 
                databaseType === DatabaseType.MySQL ? 'int' : 
                databaseType === DatabaseType.SQLite ? 'INTEGER' : 
                databaseType === DatabaseType.SQLServer ? 'int' : 
                databaseType === DatabaseType.Oracle ? 'NUMBER' : 'integer',
          nullable: false,
          isPrimaryKey: true,
          position: 1,
          autoIncrement: true
        },
        {
          name: 'post_id',
          type: databaseType === DatabaseType.PostgreSQL ? 'integer' : 
                databaseType === DatabaseType.MySQL ? 'int' : 
                databaseType === DatabaseType.SQLite ? 'INTEGER' : 
                databaseType === DatabaseType.SQLServer ? 'int' : 
                databaseType === DatabaseType.Oracle ? 'NUMBER' : 'integer',
          nullable: false,
          isForeignKey: true,
          position: 2
        },
        {
          name: 'user_id',
          type: databaseType === DatabaseType.PostgreSQL ? 'integer' : 
                databaseType === DatabaseType.MySQL ? 'int' : 
                databaseType === DatabaseType.SQLite ? 'INTEGER' : 
                databaseType === DatabaseType.SQLServer ? 'int' : 
                databaseType === DatabaseType.Oracle ? 'NUMBER' : 'integer',
          nullable: false,
          isForeignKey: true,
          position: 3
        },
        {
          name: 'content',
          type: databaseType === DatabaseType.PostgreSQL ? 'text' : 
                databaseType === DatabaseType.MySQL ? 'text' : 
                databaseType === DatabaseType.SQLite ? 'TEXT' : 
                databaseType === DatabaseType.SQLServer ? 'text' : 
                databaseType === DatabaseType.Oracle ? 'CLOB' : 'string',
          nullable: false,
          position: 4
        },
        {
          name: 'created_at',
          type: databaseType === DatabaseType.PostgreSQL ? 'timestamp' : 
                databaseType === DatabaseType.MySQL ? 'datetime' : 
                databaseType === DatabaseType.SQLite ? 'TEXT' : 
                databaseType === DatabaseType.SQLServer ? 'datetime' : 
                databaseType === DatabaseType.Oracle ? 'TIMESTAMP' : 'date',
          nullable: false,
          defaultValue: databaseType === DatabaseType.PostgreSQL ? 'CURRENT_TIMESTAMP' :
                        databaseType === DatabaseType.MySQL ? 'CURRENT_TIMESTAMP' :
                        databaseType === DatabaseType.SQLite ? "datetime('now')" :
                        databaseType === DatabaseType.SQLServer ? 'GETDATE()' :
                        databaseType === DatabaseType.Oracle ? 'SYSTIMESTAMP' : '',
          position: 5
        }
      ],
      primaryKey: ['id'],
      foreignKeys: [
        {
          name: 'comments_post_id_fkey',
          columnNames: ['post_id'],
          referencedTableName: 'posts',
          referencedColumnNames: ['id'],
          updateRule: 'CASCADE',
          deleteRule: 'CASCADE'
        },
        {
          name: 'comments_user_id_fkey',
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          updateRule: 'CASCADE',
          deleteRule: 'CASCADE'
        }
      ],
      indexes: [
        {
          name: 'comments_post_id_idx',
          columnNames: ['post_id'],
          isUnique: false,
          isPrimaryKey: false
        },
        {
          name: 'comments_user_id_idx',
          columnNames: ['user_id'],
          isUnique: false,
          isPrimaryKey: false
        }
      ],
      estimatedRowCount: 25000,
      estimatedSizeMb: 10
    }
  ];
  
  // Add MongoDB-specific adjustments if needed
  if (databaseType === DatabaseType.MongoDB) {
    // Transform tables to collections
    tables.forEach(table => {
      // MongoDB doesn't have schemas
      delete table.schema;
      
      // Change primary key to _id
      table.columns.forEach(col => {
        if (col.isPrimaryKey) {
          col.name = '_id';
          col.type = 'ObjectId';
          col.autoIncrement = false;
        }
      });
      
      // Change foreign keys to references
      if (table.foreignKeys) {
        table.foreignKeys.forEach(fk => {
          fk.type = 'reference';
        });
      }
      
      // MongoDB doesn't have traditional indexes
      if (table.indexes) {
        table.indexes.forEach(idx => {
          idx.type = 'MongoDB';
          if (idx.isPrimaryKey) {
            idx.name = '_id_';
            idx.columnNames = ['_id'];
          }
        });
      }
    });
  }
  
  // Filter tables if needed
  let filteredTables = tables;
  if (options.tableFilter && options.tableFilter.length > 0) {
    filteredTables = tables.filter(table => options.tableFilter!.includes(table.name));
  }
  
  // Mock views
  let views = [];
  if (options.includeViews !== false) {
    views = [
      {
        name: 'active_users',
        schema: 'public',
        description: 'Users with at least one post',
        definition: `
          SELECT u.*
          FROM users u
          JOIN posts p ON u.id = p.user_id
          GROUP BY u.id
        `,
        columns: [
          {
            name: 'id',
            type: databaseType === DatabaseType.PostgreSQL ? 'integer' : 
                  databaseType === DatabaseType.MySQL ? 'int' : 
                  databaseType === DatabaseType.SQLite ? 'INTEGER' : 
                  databaseType === DatabaseType.SQLServer ? 'int' : 
                  databaseType === DatabaseType.Oracle ? 'NUMBER' : 'integer',
            nullable: false,
            position: 1
          },
          {
            name: 'email',
            type: databaseType === DatabaseType.PostgreSQL ? 'varchar' : 
                  databaseType === DatabaseType.MySQL ? 'varchar' : 
                  databaseType === DatabaseType.SQLite ? 'TEXT' : 
                  databaseType === DatabaseType.SQLServer ? 'varchar' : 
                  databaseType === DatabaseType.Oracle ? 'VARCHAR2' : 'string',
            nullable: false,
            position: 2
          }
        ],
        isMaterialized: false
      }
    ];
    
    // MongoDB doesn't support views in the same way
    if (databaseType === DatabaseType.MongoDB) {
      views = [];
    }
  }
  
  // Mock procedures, functions, triggers based on database type and options
  let procedures = [];
  let functions = [];
  let triggers = [];
  let constraints = [];
  
  // Calculate total estimated size
  const totalSizeMb = filteredTables.reduce((sum, table) => sum + (table.estimatedSizeMb || 0), 0);
  
  return {
    tables: filteredTables,
    views,
    procedures,
    functions,
    triggers,
    constraints,
    estimatedSizeMb: totalSizeMb,
    databaseInfo: {
      type: databaseType
    }
  };
}