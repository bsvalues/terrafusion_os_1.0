/**
 * Mock PostgreSQL Pool for Phase 12D E2E Testing
 *
 * Provides in-memory query execution with fixture-based responses.
 * Supports both read queries (SELECT) and write queries (INSERT/UPDATE/DELETE).
 */

export interface MockQueryResult {
  rows: any[];
  rowCount: number;
  command: string;
}

export interface MockPool {
  query(text: string, values?: any[]): Promise<MockQueryResult>;
  setMockData(tableName: string, rows: any[]): void;
  getMockData(tableName: string): any[];
  reset(): void;
}

/**
 * Create mock PostgreSQL pool for testing
 */
export function createMockPool(): MockPool {
  // In-memory tables
  const tables: Map<string, any[]> = new Map();

  // Initialize with empty properties table
  tables.set('properties', []);
  tables.set('tax_records', []);

  return {
    async query(text: string, values: any[] = []): Promise<MockQueryResult> {
      const normalizedQuery = text.trim().toUpperCase();

      // SELECT queries
      if (normalizedQuery.startsWith('SELECT')) {
        return handleSelect(text, values, tables);
      }

      // INSERT queries
      if (normalizedQuery.startsWith('INSERT')) {
        return handleInsert(text, values, tables);
      }

      // UPDATE queries
      if (normalizedQuery.startsWith('UPDATE')) {
        return handleUpdate(text, values, tables);
      }

      // DELETE queries
      if (normalizedQuery.startsWith('DELETE')) {
        return handleDelete(text, values, tables);
      }

      throw new Error(`Unsupported query type: ${normalizedQuery.substring(0, 50)}`);
    },

    setMockData(tableName: string, rows: any[]): void {
      tables.set(tableName, [...rows]);
    },

    getMockData(tableName: string): any[] {
      return tables.get(tableName) || [];
    },

    reset(): void {
      tables.clear();
      tables.set('properties', []);
      tables.set('tax_records', []);
    },
  };
}

/**
 * Handle SELECT queries
 */
function handleSelect(query: string, values: any[], tables: Map<string, any[]>): MockQueryResult {
  // Extract table name (simple regex - works for basic queries)
  const tableMatch = query.match(/FROM\s+(\w+)/i);
  const tableName = tableMatch ? tableMatch[1] : 'properties';

  let rows = tables.get(tableName) || [];

  // Simple WHERE clause handling (parcel_id = $1 AND county_id = $2)
  if (values.length > 0 && query.toUpperCase().includes('WHERE')) {
    rows = rows.filter(row => {
      // Check parcel_id match (first param)
      if (values[0] !== undefined && row.parcel_id !== values[0]) {
        return false;
      }
      // Check county_id match (second param)
      if (values[1] !== undefined && row.county_id !== values[1]) {
        return false;
      }
      return true;
    });
  }

  return {
    rows: [...rows],
    rowCount: rows.length,
    command: 'SELECT',
  };
}

/**
 * Handle INSERT queries
 */
function handleInsert(query: string, values: any[], tables: Map<string, any[]>): MockQueryResult {
  const tableMatch = query.match(/INSERT\s+INTO\s+(\w+)/i);
  const tableName = tableMatch ? tableMatch[1] : 'properties';

  const rows = tables.get(tableName) || [];

  // Extract column names from query
  const columnsMatch = query.match(/\(([^)]+)\)\s+VALUES/i);
  const columns = columnsMatch ? columnsMatch[1].split(',').map(c => c.trim()) : [];

  // Build new row object
  const newRow: any = {};
  columns.forEach((col, idx) => {
    if (values[idx] !== undefined) {
      newRow[col] = values[idx];
    }
  });

  // Add timestamp fields if missing
  if (!newRow.created_at) {
    newRow.created_at = new Date().toISOString();
  }

  rows.push(newRow);
  tables.set(tableName, rows);

  return {
    rows: [newRow],
    rowCount: 1,
    command: 'INSERT',
  };
}

/**
 * Handle UPDATE queries
 */
function handleUpdate(query: string, values: any[], tables: Map<string, any[]>): MockQueryResult {
  const tableMatch = query.match(/UPDATE\s+(\w+)/i);
  const tableName = tableMatch ? tableMatch[1] : 'properties';

  const rows = tables.get(tableName) || [];

  // Simple UPDATE logic: assessed_value = $1, tax_year = $2, updated_by = $3 WHERE parcel_id = $4 AND county_id = $5
  let updatedCount = 0;

  rows.forEach(row => {
    // Check WHERE clause matches (last 2 params: parcel_id, county_id)
    const parcelIdMatch = values[3] ? row.parcel_id === values[3] : true;
    const countyIdMatch = values[4] ? row.county_id === values[4] : true;

    if (parcelIdMatch && countyIdMatch) {
      // Apply updates (first 3 params: assessed_value, tax_year, updated_by)
      if (values[0] !== undefined) row.assessed_value = values[0];
      if (values[1] !== undefined) row.tax_year = values[1];
      if (values[2] !== undefined) row.updated_by = values[2];
      row.updated_at = new Date().toISOString();
      updatedCount++;
    }
  });

  tables.set(tableName, rows);

  return {
    rows: [],
    rowCount: updatedCount,
    command: 'UPDATE',
  };
}

/**
 * Handle DELETE queries
 */
function handleDelete(query: string, values: any[], tables: Map<string, any[]>): MockQueryResult {
  const tableMatch = query.match(/FROM\s+(\w+)/i);
  const tableName = tableMatch ? tableMatch[1] : 'properties';

  const rows = tables.get(tableName) || [];

  // Simple DELETE logic: WHERE parcel_id = $1 AND tax_year < $2 AND county_id = $3
  const filtered = rows.filter(row => {
    const parcelIdMatch = values[0] ? row.parcel_id === values[0] : false;
    const taxYearMatch = values[1] ? row.tax_year < values[1] : false;
    const countyIdMatch = values[2] ? row.county_id === values[2] : false;

    // Keep row if it does NOT match delete criteria
    return !(parcelIdMatch && taxYearMatch && countyIdMatch);
  });

  const deletedCount = rows.length - filtered.length;
  tables.set(tableName, filtered);

  return {
    rows: [],
    rowCount: deletedCount,
    command: 'DELETE',
  };
}
