/**
 * Database Adapters
 *
 * This module provides adapters for various database systems to query their schemas
 * in a standardized format.
 */

import { DatabaseType, ConnectionStatus } from './types';
import pg from 'pg';
const { Pool } = pg;
import * as mysql from 'mysql2/promise';
import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';

/**
 * Query a database schema using the appropriate adapter
 */
export async function queryDatabaseSchema(
  connectionString: string,
  databaseType: DatabaseType,
  options: {
    includeViews?: boolean;
    includeProcedures?: boolean;
    includeFunctions?: boolean;
    includeTriggers?: boolean;
    includeConstraints?: boolean;
    tableFilter?: string[];
    testConnectionOnly?: boolean;
  } = {}
) {
  try {
    let result: any;

    switch (databaseType) {
      case DatabaseType.PostgreSQL:
        result = await queryPostgresSchema(connectionString, options);
        break;
      case DatabaseType.MySQL:
        result = await queryMySQLSchema(connectionString, options);
        break;
      case DatabaseType.SQLite:
        result = await querySQLiteSchema(connectionString, options);
        break;
      case DatabaseType.SQLServer:
        // Not implemented yet, placeholder for future implementation
        throw new Error(`${databaseType} adapter not implemented yet`);
      case DatabaseType.MongoDB:
        // Not implemented yet, placeholder for future implementation
        throw new Error(`${databaseType} adapter not implemented yet`);
      default:
        throw new Error(`Unsupported database type: ${databaseType}`);
    }

    return result;
  } catch (error) {
    console.error(`Error querying ${databaseType} schema:`, error);
    throw error;
  }
}

/**
 * Query PostgreSQL schema
 */
async function queryPostgresSchema(connectionString: string, options: any = {}) {
  const pool = new Pool({ connectionString });

  try {
    // If we just want to test the connection, do a simple query
    if (options.testConnectionOnly) {
      const { rows } = await pool.query('SELECT version() as version, current_database() as name');

      return {
        databaseInfo: {
          name: rows[0].name,
          version: rows[0].version.split(' ')[1], // Extract version number
          type: DatabaseType.PostgreSQL,
        },
      };
    }

    // Get tables
    const tablesQuery = `
      SELECT 
        t.table_name as name,
        obj_description(pgc.oid, 'pg_class') as description,
        pg_total_relation_size(quote_ident(t.table_name)) as table_size
      FROM information_schema.tables t
      JOIN pg_catalog.pg_class pgc ON pgc.relname = t.table_name
      JOIN pg_catalog.pg_namespace pgn ON pgn.oid = pgc.relnamespace AND pgn.nspname = t.table_schema
      WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      ${options.tableFilter ? 'AND t.table_name = ANY($1)' : ''}
      ORDER BY t.table_name
    `;

    const tableParams = options.tableFilter ? [options.tableFilter] : [];
    const { rows: tableRows } = await pool.query(tablesQuery, tableParams);

    const tables = [];
    let totalSize = 0;

    // Process each table
    for (const table of tableRows) {
      totalSize += parseInt(table.table_size || 0);

      // Get columns
      const columnsQuery = `
        SELECT 
          c.column_name as name,
          c.data_type as type,
          c.is_nullable = 'YES' as nullable,
          c.column_default as default_value,
          c.character_maximum_length as max_length,
          c.numeric_precision as precision,
          c.numeric_scale as scale,
          (SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = c.table_name
            AND tc.constraint_type = 'PRIMARY KEY'
            AND ccu.column_name = c.column_name
          )) as is_primary_key,
          (SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.table_name = c.table_name
            AND tc.constraint_type = 'UNIQUE'
            AND ccu.column_name = c.column_name
          )) as is_unique,
          c.column_default LIKE 'nextval%' as is_auto_increment,
          col_description(pgc.oid, c.ordinal_position) as description
        FROM information_schema.columns c
        JOIN pg_catalog.pg_class pgc ON pgc.relname = c.table_name
        JOIN pg_catalog.pg_namespace pgn ON pgn.oid = pgc.relnamespace AND pgn.nspname = c.table_schema
        WHERE c.table_schema = 'public'
        AND c.table_name = $1
        ORDER BY c.ordinal_position
      `;

      const { rows: columnRows } = await pool.query(columnsQuery, [table.name]);

      const columns = columnRows.map(col => ({
        name: col.name,
        type: col.type,
        nullable: col.nullable,
        defaultValue: col.default_value,
        maxLength: col.max_length,
        precision: col.precision,
        scale: col.scale,
        isPrimaryKey: col.is_primary_key,
        isUnique: col.is_unique,
        autoIncrement: col.is_auto_increment,
        description: col.description,
      }));

      // Get primary key
      const pkQuery = `
        SELECT ccu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = $1
        AND tc.constraint_type = 'PRIMARY KEY'
        ORDER BY ccu.ordinal_position
      `;

      const { rows: pkRows } = await pool.query(pkQuery, [table.name]);
      const primaryKey = pkRows.map(pk => pk.column_name);

      // Get indexes
      const indexesQuery = `
        SELECT
          i.relname as name,
          am.amname as type,
          array_agg(a.attname ORDER BY x.indkey_subscript) as column_names,
          ix.indisunique as is_unique,
          ix.indisprimary as is_primary
        FROM pg_index ix
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_class t ON t.oid = ix.indrelid
        JOIN pg_am am ON am.oid = i.relam
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS x(attnum, indkey_subscript) ON TRUE
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = x.attnum
        WHERE t.relname = $1
        AND n.nspname = 'public'
        GROUP BY i.relname, am.amname, ix.indisunique, ix.indisprimary
        ORDER BY i.relname
      `;

      const { rows: indexRows } = await pool.query(indexesQuery, [table.name]);

      const indexes = indexRows.map(idx => ({
        name: idx.name,
        type: idx.type,
        columnNames: idx.column_names,
        isUnique: idx.is_unique,
        isPrimary: idx.is_primary,
      }));

      // Get foreign keys
      const fkQuery = `
        SELECT
          tc.constraint_name as name,
          kcu.column_name,
          ccu.table_name AS referenced_table,
          ccu.column_name AS referenced_column,
          rc.update_rule,
          rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
        WHERE tc.table_name = $1
        AND tc.constraint_type = 'FOREIGN KEY'
        ORDER BY kcu.ordinal_position
      `;

      const { rows: fkRows } = await pool.query(fkQuery, [table.name]);

      // Group foreign keys by constraint name
      const fkMap = new Map();
      for (const fk of fkRows) {
        if (!fkMap.has(fk.name)) {
          fkMap.set(fk.name, {
            name: fk.name,
            columnNames: [],
            referencedTableName: fk.referenced_table,
            referencedColumnNames: [],
            updateRule: fk.update_rule,
            deleteRule: fk.delete_rule,
          });
        }

        const fkObj = fkMap.get(fk.name);
        fkObj.columnNames.push(fk.column_name);
        fkObj.referencedColumnNames.push(fk.referenced_column);
      }

      const foreignKeys = Array.from(fkMap.values());

      // Add table to the result
      tables.push({
        name: table.name,
        description: table.description,
        columns,
        primaryKey,
        indexes,
        foreignKeys,
        estimatedRowCount: await estimateTableRowCount(pool, table.name),
        sizeBytes: parseInt(table.table_size || '0'),
      });
    }

    // Get views if requested
    let views = [];
    if (options.includeViews) {
      const viewsQuery = `
        SELECT
          v.table_name AS name,
          v.view_definition AS definition,
          obj_description(pgc.oid, 'pg_class') as description
        FROM information_schema.views v
        JOIN pg_catalog.pg_class pgc ON pgc.relname = v.table_name
        JOIN pg_catalog.pg_namespace pgn ON pgn.oid = pgc.relnamespace AND pgn.nspname = v.table_schema
        WHERE v.table_schema = 'public'
        ORDER BY v.table_name
      `;

      const { rows: viewRows } = await pool.query(viewsQuery);
      views = viewRows;
    }

    // Get procedures if requested
    let procedures = [];
    if (options.includeProcedures) {
      const proceduresQuery = `
        SELECT
          p.proname AS name,
          pg_get_functiondef(p.oid) AS definition,
          obj_description(p.oid, 'pg_proc') AS description
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prokind = 'p'
        ORDER BY p.proname
      `;

      const { rows: procRows } = await pool.query(proceduresQuery);
      procedures = procRows;
    }

    // Get functions if requested
    let functions = [];
    if (options.includeFunctions) {
      const functionsQuery = `
        SELECT
          p.proname AS name,
          pg_get_functiondef(p.oid) AS definition,
          obj_description(p.oid, 'pg_proc') AS description
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        ORDER BY p.proname
      `;

      const { rows: funcRows } = await pool.query(functionsQuery);
      functions = funcRows;
    }

    // Get triggers if requested
    let triggers = [];
    if (options.includeTriggers) {
      const triggersQuery = `
        SELECT
          t.tgname AS name,
          e.evtname AS event,
          pg_get_triggerdef(t.oid) AS definition,
          obj_description(t.oid, 'pg_trigger') AS description
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_event e ON t.tgtype & (1 << 16 * e.evtevent) > 0
        WHERE n.nspname = 'public'
        AND NOT t.tgisinternal
        ORDER BY t.tgname
      `;

      const { rows: trigRows } = await pool.query(triggersQuery);
      triggers = trigRows;
    }

    // Get database info
    const { rows: dbInfoRows } = await pool.query(
      'SELECT version() as version, current_database() as name'
    );

    return {
      tables,
      views,
      procedures,
      functions,
      triggers,
      estimatedSizeMb: Math.round(totalSize / (1024 * 1024)),
      databaseInfo: {
        name: dbInfoRows[0].name,
        version: dbInfoRows[0].version.split(' ')[1], // Extract version number
        type: DatabaseType.PostgreSQL,
      },
    };
  } finally {
    await pool.end();
  }
}

/**
 * Estimate table row count for PostgreSQL
 */
async function estimateTableRowCount(pool: Pool, tableName: string): Promise<number> {
  // Use the PostgreSQL statistics to get an estimate
  const query = `
    SELECT reltuples::bigint AS estimate
    FROM pg_class
    WHERE relname = $1
  `;

  const { rows } = await pool.query(query, [tableName]);
  return parseInt(rows[0]?.estimate || '0');
}

/**
 * Query MySQL schema
 */
async function queryMySQLSchema(connectionString: string, options: any = {}) {
  // Parse connection string
  const parseConnectionString = (connStr: string) => {
    // Remove mysql:// prefix if present
    const str = connStr.startsWith('mysql://') ? connStr.substring(8) : connStr;

    const atIndex = str.lastIndexOf('@');
    const slashIndex = str.indexOf('/', atIndex);

    const auth = str.substring(0, atIndex);
    const hostPort = str.substring(atIndex + 1, slashIndex);
    const dbName = str.substring(slashIndex + 1);

    const authParts = auth.split(':');
    const hostPortParts = hostPort.split(':');

    return {
      host: hostPortParts[0],
      port: hostPortParts[1] ? parseInt(hostPortParts[1]) : 3306,
      user: authParts[0],
      password: authParts[1],
      database: dbName,
    };
  };

  const config = parseConnectionString(connectionString);
  const connection = await mysql.createConnection(config);

  try {
    // If we just want to test the connection, do a simple query
    if (options.testConnectionOnly) {
      const [rows] = await connection.query('SELECT VERSION() as version, DATABASE() as name');

      return {
        databaseInfo: {
          name: rows[0].name,
          version: rows[0].version,
          type: DatabaseType.MySQL,
        },
      };
    }

    // Get tables
    const [tableRows] = await connection.query(
      `
      SELECT 
        table_name as name,
        table_comment as description,
        data_length + index_length as table_size
      FROM information_schema.tables
      WHERE table_schema = ?
      AND table_type = 'BASE TABLE'
      ${options.tableFilter ? 'AND table_name IN (?)' : ''}
      ORDER BY table_name
    `,
      [config.database, ...(options.tableFilter ? [options.tableFilter] : [])]
    );

    const tables = [];
    let totalSize = 0;

    // Process each table
    for (const table of tableRows) {
      totalSize += parseInt(table.table_size || 0);

      // Get columns
      const [columnRows] = await connection.query(
        `
        SELECT 
          column_name as name,
          data_type as type,
          is_nullable = 'YES' as nullable,
          column_default as default_value,
          character_maximum_length as max_length,
          numeric_precision as precision,
          numeric_scale as scale,
          column_key = 'PRI' as is_primary_key,
          column_key = 'UNI' as is_unique,
          extra = 'auto_increment' as is_auto_increment,
          column_comment as description
        FROM information_schema.columns
        WHERE table_schema = ?
        AND table_name = ?
        ORDER BY ordinal_position
      `,
        [config.database, table.name]
      );

      const columns = columnRows.map(col => ({
        name: col.name,
        type: col.type,
        nullable: !!col.nullable,
        defaultValue: col.default_value,
        maxLength: col.max_length,
        precision: col.precision,
        scale: col.scale,
        isPrimaryKey: !!col.is_primary_key,
        isUnique: !!col.is_unique,
        autoIncrement: !!col.is_auto_increment,
        description: col.description,
      }));

      // Get primary key
      const [pkRows] = await connection.query(
        `
        SELECT column_name
        FROM information_schema.key_column_usage
        WHERE table_schema = ?
        AND table_name = ?
        AND constraint_name = 'PRIMARY'
        ORDER BY ordinal_position
      `,
        [config.database, table.name]
      );

      const primaryKey = pkRows.map(pk => pk.column_name);

      // Get indexes
      const [indexRows] = await connection.query(
        `
        SELECT
          index_name as name,
          index_type as type,
          GROUP_CONCAT(column_name ORDER BY seq_in_index) as column_names,
          NOT non_unique as is_unique,
          index_name = 'PRIMARY' as is_primary
        FROM information_schema.statistics
        WHERE table_schema = ?
        AND table_name = ?
        GROUP BY index_name, index_type, non_unique
        ORDER BY index_name
      `,
        [config.database, table.name]
      );

      const indexes = indexRows.map(idx => ({
        name: idx.name,
        type: idx.type,
        columnNames: idx.column_names.split(','),
        isUnique: !!idx.is_unique,
        isPrimary: !!idx.is_primary,
      }));

      // Get foreign keys
      const [fkRows] = await connection.query(
        `
        SELECT
          constraint_name as name,
          column_name,
          referenced_table_name as referenced_table,
          referenced_column_name as referenced_column,
          (SELECT update_rule FROM information_schema.referential_constraints WHERE constraint_schema = ? AND constraint_name = k.constraint_name) as update_rule,
          (SELECT delete_rule FROM information_schema.referential_constraints WHERE constraint_schema = ? AND constraint_name = k.constraint_name) as delete_rule
        FROM information_schema.key_column_usage k
        WHERE table_schema = ?
        AND table_name = ?
        AND referenced_table_name IS NOT NULL
        ORDER BY constraint_name, ordinal_position
      `,
        [config.database, config.database, config.database, table.name]
      );

      // Group foreign keys by constraint name
      const fkMap = new Map();
      for (const fk of fkRows) {
        if (!fkMap.has(fk.name)) {
          fkMap.set(fk.name, {
            name: fk.name,
            columnNames: [],
            referencedTableName: fk.referenced_table,
            referencedColumnNames: [],
            updateRule: fk.update_rule,
            deleteRule: fk.delete_rule,
          });
        }

        const fkObj = fkMap.get(fk.name);
        fkObj.columnNames.push(fk.column_name);
        fkObj.referencedColumnNames.push(fk.referenced_column);
      }

      const foreignKeys = Array.from(fkMap.values());

      // Estimate row count
      const [rowCountResult] = await connection.query(
        `
        SELECT TABLE_ROWS as count
        FROM information_schema.tables
        WHERE table_schema = ?
        AND table_name = ?
      `,
        [config.database, table.name]
      );

      const estimatedRowCount = parseInt(rowCountResult[0]?.count || '0');

      // Add table to the result
      tables.push({
        name: table.name,
        description: table.description,
        columns,
        primaryKey,
        indexes,
        foreignKeys,
        estimatedRowCount,
        sizeBytes: parseInt(table.table_size || '0'),
      });
    }

    // Get views if requested
    let views = [];
    if (options.includeViews) {
      const [viewRows] = await connection.query(
        `
        SELECT
          table_name AS name,
          view_definition AS definition,
          '' as description
        FROM information_schema.views
        WHERE table_schema = ?
        ORDER BY table_name
      `,
        [config.database]
      );

      views = viewRows;
    }

    // Get procedures if requested
    let procedures = [];
    if (options.includeProcedures) {
      const [procRows] = await connection.query(
        `
        SELECT
          routine_name AS name,
          routine_definition AS definition,
          routine_comment AS description
        FROM information_schema.routines
        WHERE routine_schema = ?
        AND routine_type = 'PROCEDURE'
        ORDER BY routine_name
      `,
        [config.database]
      );

      procedures = procRows;
    }

    // Get functions if requested
    let functions = [];
    if (options.includeFunctions) {
      const [funcRows] = await connection.query(
        `
        SELECT
          routine_name AS name,
          routine_definition AS definition,
          routine_comment AS description
        FROM information_schema.routines
        WHERE routine_schema = ?
        AND routine_type = 'FUNCTION'
        ORDER BY routine_name
      `,
        [config.database]
      );

      functions = funcRows;
    }

    // Get triggers if requested
    let triggers = [];
    if (options.includeTriggers) {
      const [trigRows] = await connection.query(
        `
        SELECT
          trigger_name AS name,
          event_manipulation AS event,
          action_statement AS definition,
          '' AS description
        FROM information_schema.triggers
        WHERE trigger_schema = ?
        ORDER BY trigger_name
      `,
        [config.database]
      );

      triggers = trigRows;
    }

    // Get database info
    const [dbInfoRows] = await connection.query('SELECT VERSION() as version, DATABASE() as name');

    return {
      tables,
      views,
      procedures,
      functions,
      triggers,
      estimatedSizeMb: Math.round(totalSize / (1024 * 1024)),
      databaseInfo: {
        name: dbInfoRows[0].name,
        version: dbInfoRows[0].version,
        type: DatabaseType.MySQL,
      },
    };
  } finally {
    await connection.end();
  }
}

/**
 * Query SQLite schema
 */
async function querySQLiteSchema(connectionString: string, options: any = {}) {
  // Remove the file: prefix if present
  const dbPath = connectionString.startsWith('file:')
    ? connectionString.substring(5)
    : connectionString;

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  try {
    // If we just want to test the connection, do a simple query
    if (options.testConnectionOnly) {
      const version = await db.get('SELECT sqlite_version() as version');

      return {
        databaseInfo: {
          name: dbPath.split('/').pop(), // Extract filename from path
          version: version.version,
          type: DatabaseType.SQLite,
        },
      };
    }

    // Get list of tables
    let tableRows = await db.all(
      `
      SELECT 
        name,
        'table' as type
      FROM sqlite_master
      WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
      ${options.tableFilter ? 'AND name IN (' + options.tableFilter.map(() => '?').join(',') + ')' : ''}
      ORDER BY name
    `,
      options.tableFilter || []
    );

    const tables = [];
    let totalSize = 0;

    // Get database size
    const dbSizeResult = await db.get('PRAGMA page_count');
    const pageSize = await db.get('PRAGMA page_size');
    const dbSize = dbSizeResult['page_count'] * pageSize['page_size'];
    totalSize = dbSize;

    // Process each table
    for (const table of tableRows) {
      // Get columns
      const columnRows = await db.all(`PRAGMA table_info("${table.name}")`);

      const columns = columnRows.map(col => ({
        name: col.name,
        type: col.type,
        nullable: col.notnull === 0,
        defaultValue: col.dflt_value,
        isPrimaryKey: col.pk === 1,
        isUnique: false, // Will be updated with index info
        autoIncrement: false, // Will be updated with column info
      }));

      // Check for autoincrement
      const createTableSql = await db.get(
        `
        SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?
      `,
        [table.name]
      );

      if (createTableSql && createTableSql.sql) {
        const autoIncrementMatch = createTableSql.sql.match(
          /(\w+)\s+\w+\s+primary\s+key\s+autoincrement/i
        );
        if (autoIncrementMatch) {
          const autoIncrColumn = autoIncrementMatch[1];
          const column = columns.find(col => col.name === autoIncrColumn);
          if (column) {
            column.autoIncrement = true;
          }
        }
      }

      // Get primary key
      const primaryKey = columns.filter(col => col.isPrimaryKey).map(col => col.name);

      // Get foreign keys
      const fkRows = await db.all(`PRAGMA foreign_key_list("${table.name}")`);

      // Group foreign keys by constraint id
      const fkMap = new Map();
      for (const fk of fkRows) {
        if (!fkMap.has(fk.id)) {
          fkMap.set(fk.id, {
            name: `fk_${table.name}_${fk.id}`,
            columnNames: [],
            referencedTableName: fk.table,
            referencedColumnNames: [],
            updateRule: fk.on_update,
            deleteRule: fk.on_delete,
          });
        }

        const fkObj = fkMap.get(fk.id);
        fkObj.columnNames.push(fk.from);
        fkObj.referencedColumnNames.push(fk.to);
      }

      const foreignKeys = Array.from(fkMap.values());

      // Get indexes
      const indexRows = await db.all(`PRAGMA index_list("${table.name}")`);

      const indexes = [];
      for (const idx of indexRows) {
        const indexInfo = await db.all(`PRAGMA index_info("${idx.name}")`);
        const columnNames = indexInfo.map(info => {
          const column = columns.find(col => col.cid === info.cid);
          return column ? column.name : `unknown_${info.cid}`;
        });

        // Update unique flag on columns
        if (idx.unique) {
          for (const colName of columnNames) {
            const column = columns.find(col => col.name === colName);
            if (column) {
              column.isUnique = true;
            }
          }
        }

        indexes.push({
          name: idx.name,
          type: 'btree', // SQLite only has btree indexes
          columnNames,
          isUnique: idx.unique === 1,
          isPrimary: idx.origin === 'pk',
        });
      }

      // Estimate table size and row count
      const stats = await db.get(`SELECT count(*) as count FROM "${table.name}"`);
      const estimatedRowCount = stats.count;

      // Add table to the result
      tables.push({
        name: table.name,
        description: '',
        columns,
        primaryKey,
        indexes,
        foreignKeys,
        estimatedRowCount,
        sizeBytes: 0, // SQLite doesn't provide size info per table
      });
    }

    // Get views if requested
    let views = [];
    if (options.includeViews) {
      const viewRows = await db.all(`
        SELECT
          name,
          sql AS definition
        FROM sqlite_master
        WHERE type = 'view'
        ORDER BY name
      `);

      views = viewRows.map(view => ({
        name: view.name,
        definition: view.definition,
        description: '',
      }));
    }

    // Get triggers if requested
    let triggers = [];
    if (options.includeTriggers) {
      const triggerRows = await db.all(`
        SELECT
          name,
          sql AS definition
        FROM sqlite_master
        WHERE type = 'trigger'
        ORDER BY name
      `);

      triggers = triggerRows.map(trigger => ({
        name: trigger.name,
        definition: trigger.definition,
        description: '',
      }));
    }

    // SQLite doesn't have stored procedures or functions
    const procedures = [];
    const functions = [];

    // Get database info
    const version = await db.get('SELECT sqlite_version() as version');

    return {
      tables,
      views,
      procedures,
      functions,
      triggers,
      estimatedSizeMb: Math.round(totalSize / (1024 * 1024)),
      databaseInfo: {
        name: dbPath.split('/').pop(), // Extract filename from path
        version: version.version,
        type: DatabaseType.SQLite,
      },
    };
  } finally {
    await db.close();
  }
}
