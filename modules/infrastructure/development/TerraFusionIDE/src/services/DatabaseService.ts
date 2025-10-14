/**
 * TerraFusion Database Service
 * Connects to IDE Gateway backend for database operations
 */

const IDE_GATEWAY_URL = 'http://localhost:5001';

export interface DatabaseInfo {
  Name: string;
  Type: string;
  Path: string;
  SizeMB: number;
}

export interface QueryRequest {
  DatabaseName: string;
  Query: string;
  MaxRows?: number;
}

export interface QueryResult {
  Success: boolean;
  Rows: Record<string, any>[];
  RowCount: number;
  ExecutionTimeMs: number;
  Error?: string;
  Message?: string;
}

export class DatabaseService {
  private static baseUrl = IDE_GATEWAY_URL;

  /**
   * Get list of available databases
   */
  static async getDatabases(): Promise<DatabaseInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/databases`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.Databases || [];
    } catch (error) {
      console.error('Failed to fetch databases:', error);
      // Return demo data on error
      return [
        { Name: 'benton_county_parcels', Type: 'SQLite', Path: 'Demo', SizeMB: 25.5 },
        { Name: 'property_valuations', Type: 'SQLite', Path: 'Demo', SizeMB: 12.3 },
        { Name: 'tax_levies', Type: 'SQLite', Path: 'Demo', SizeMB: 5.7 }
      ];
    }
  }

  /**
   * Execute SQL query against specified database
   */
  static async executeQuery(request: QueryRequest): Promise<QueryResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          DatabaseName: request.DatabaseName,
          Query: request.Query,
          MaxRows: request.MaxRows || 1000
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: QueryResult = await response.json();
      return result;
    } catch (error) {
      console.error('Query execution failed:', error);
      return {
        Success: false,
        Rows: [],
        RowCount: 0,
        ExecutionTimeMs: 0,
        Error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get Benton County parcel data (convenience method)
   */
  static async getBentonCountyParcels(limit: number = 100): Promise<QueryResult> {
    return this.executeQuery({
      DatabaseName: 'benton_county_parcels',
      Query: `SELECT * FROM parcels LIMIT ${limit}`,
      MaxRows: limit
    });
  }

  /**
   * Search parcels by address (convenience method)
   */
  static async searchParcelsByAddress(address: string): Promise<QueryResult> {
    return this.executeQuery({
      DatabaseName: 'benton_county_parcels',
      Query: `SELECT * FROM parcels WHERE Address LIKE '%${address}%' LIMIT 50`,
      MaxRows: 50
    });
  }

  /**
   * Get database table schema (convenience method)
   */
  static async getTableSchema(databaseName: string, tableName: string): Promise<QueryResult> {
    return this.executeQuery({
      DatabaseName: databaseName,
      Query: `PRAGMA table_info(${tableName})`,
      MaxRows: 1000
    });
  }

  /**
   * List all tables in a database (convenience method)
   */
  static async listTables(databaseName: string): Promise<QueryResult> {
    return this.executeQuery({
      DatabaseName: databaseName,
      Query: `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
      MaxRows: 1000
    });
  }

  /**
   * Check IDE Gateway health
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('IDE Gateway health check failed:', error);
      return false;
    }
  }

  /**
   * Get IDE status
   */
  static async getIDEStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ide/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get IDE status:', error);
      return {
        IDE: 'TerraFusion Ultimate IDE',
        Version: '1.0.0',
        Status: 'Offline',
        Capabilities: []
      };
    }
  }
}

export default DatabaseService;
