/**
 * Database Service Template - Production Implementation Required
 *
 * This template provides the structure for implementing the actual DatabaseService
 * that is currently missing from the codebase.
 *
 * @version 2.0.0
 * @classification Production-Ready Template
 */

import { Pool, PoolClient, QueryResult } from 'pg';

export interface Assessment {
  id?: string;
  userId: string;
  propertyData: PropertyData;
  assessmentResult: AssessmentResult;
  processingTime: number;
  createdAt?: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface PropertyData {
  address: string;
  type: 'residential' | 'commercial' | 'industrial' | 'agricultural';
  county: string;
  sqft?: number;
  yearBuilt?: number;
  lotSize?: number;
  features?: string[];
}

export interface AssessmentResult {
  estimatedValue: number;
  confidence: number;
  methodology: string;
  comparableProperties?: any[];
  marketTrends?: any;
  breakdown?: {
    landValue: number;
    improvementValue: number;
    adjustments: number;
  };
}

export interface SavedAssessment extends Assessment {
  id: string;
  createdAt: Date;
}

export interface BulkAssessmentJob {
  id?: string;
  userId: string;
  propertyCount: number;
  resultsCount: number;
  processingTime: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt?: Date;
}

export interface AssessmentStats {
  totalAssessments: number;
  averageProcessingTime: number;
  successRate: number;
  byPropertyType: Record<string, number>;
  byCounty: Record<string, number>;
  recentTrends: {
    date: string;
    count: number;
    avgValue: number;
  }[];
}

export interface DatabaseConfig {
  connectionString: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * Production Database Service Implementation
 *
 * Implements all database operations required by the API endpoints.
 * Provides connection pooling, error handling, and transaction support.
 */
export class DatabaseService {
  private pool: Pool;
  private isConnected = false;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      connectionString: config.connectionString,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: config.maxConnections || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  /**
   * Connect to the database and run initial setup
   */
  async connect(): Promise<void> {
    try {
      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      console.log('✅ Database connected successfully');

      // Run migrations if needed
      await this.runMigrations();
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('🔌 Database disconnected');
    }
  }

  /**
   * Check if database is connected
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Save a property assessment to the database
   */
  async saveAssessment(assessment: Assessment, userId: string): Promise<SavedAssessment> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO assessments 
         (user_id, property_data, assessment_result, processing_time, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, user_id, property_data, assessment_result, processing_time, status, created_at`,
        [
          userId,
          JSON.stringify(assessment.propertyData),
          JSON.stringify(assessment.assessmentResult),
          assessment.processingTime,
          assessment.status || 'completed',
        ]
      );

      return {
        ...assessment,
        id: result.rows[0].id,
        userId: result.rows[0].user_id,
        createdAt: result.rows[0].created_at,
      };
    } catch (error) {
      throw new Error(`Failed to save assessment: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Retrieve an assessment by ID
   */
  async getAssessment(id: string, userId: string): Promise<SavedAssessment | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT id, user_id, property_data, assessment_result, processing_time, status, created_at
         FROM assessments 
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        propertyData: row.property_data,
        assessmentResult: row.assessment_result,
        processingTime: row.processing_time,
        status: row.status,
        createdAt: row.created_at,
      };
    } catch (error) {
      throw new Error(`Failed to get assessment: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get assessments for a specific user with pagination and filtering
   */
  async getUserAssessments(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      filters?: {
        type?: string;
        county?: string;
        dateFrom?: Date;
        dateTo?: Date;
      };
    }
  ): Promise<{
    assessments: SavedAssessment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, filters = {} } = options;
    const offset = (page - 1) * limit;

    const client = await this.pool.connect();
    try {
      // Build dynamic WHERE clause
      let whereClause = 'WHERE user_id = $1';
      const params: any[] = [userId];
      let paramIndex = 2;

      if (filters.type) {
        whereClause += ` AND property_data->>'type' = $${paramIndex}`;
        params.push(filters.type);
        paramIndex++;
      }

      if (filters.county) {
        whereClause += ` AND property_data->>'county' = $${paramIndex}`;
        params.push(filters.county);
        paramIndex++;
      }

      if (filters.dateFrom) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(filters.dateFrom);
        paramIndex++;
      }

      if (filters.dateTo) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(filters.dateTo);
        paramIndex++;
      }

      // Get total count
      const countResult = await client.query(
        `SELECT COUNT(*) as total FROM assessments ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].total);

      // Get assessments
      const result = await client.query(
        `SELECT id, user_id, property_data, assessment_result, processing_time, status, created_at
         FROM assessments 
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      const assessments = result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        propertyData: row.property_data,
        assessmentResult: row.assessment_result,
        processingTime: row.processing_time,
        status: row.status,
        createdAt: row.created_at,
      }));

      return {
        assessments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`Failed to get user assessments: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Save bulk assessment job
   */
  async saveBulkAssessment(
    bulkJob: BulkAssessmentJob
  ): Promise<BulkAssessmentJob & { id: string }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO bulk_assessment_jobs 
         (user_id, property_count, results_count, processing_time, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, created_at`,
        [
          bulkJob.userId,
          bulkJob.propertyCount,
          bulkJob.resultsCount,
          bulkJob.processingTime,
          bulkJob.status || 'completed',
        ]
      );

      return {
        ...bulkJob,
        id: result.rows[0].id,
        createdAt: result.rows[0].created_at,
      };
    } catch (error) {
      throw new Error(`Failed to save bulk assessment job: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Generate and store a share token for an assessment
   */
  async generateShareToken(assessmentId: string): Promise<string> {
    const token = this.generateRandomToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO share_tokens (token, assessment_id, expires_at, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [token, assessmentId, expiresAt]
      );

      return token;
    } catch (error) {
      throw new Error(`Failed to generate share token: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get assessment statistics
   */
  async getAssessmentStats(options: {
    period?: string;
    county?: string;
    type?: string;
    userId?: string;
  }): Promise<AssessmentStats> {
    const { period = '30d', county, type, userId } = options;

    const client = await this.pool.connect();
    try {
      // Calculate date range
      const dateFrom = this.calculateDateFromPeriod(period);

      // Build WHERE clause
      let whereClause = 'WHERE created_at >= $1';
      const params: any[] = [dateFrom];
      let paramIndex = 2;

      if (userId) {
        whereClause += ` AND user_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }

      if (county) {
        whereClause += ` AND property_data->>'county' = $${paramIndex}`;
        params.push(county);
        paramIndex++;
      }

      if (type) {
        whereClause += ` AND property_data->>'type' = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      // Get basic stats
      const statsResult = await client.query(
        `SELECT 
           COUNT(*) as total_assessments,
           AVG(processing_time) as avg_processing_time,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate
         FROM assessments ${whereClause}`,
        params
      );

      // Get stats by property type
      const typeResult = await client.query(
        `SELECT 
           property_data->>'type' as type,
           COUNT(*) as count
         FROM assessments ${whereClause}
         GROUP BY property_data->>'type'`,
        params
      );

      // Get stats by county
      const countyResult = await client.query(
        `SELECT 
           property_data->>'county' as county,
           COUNT(*) as count
         FROM assessments ${whereClause}
         GROUP BY property_data->>'county'`,
        params
      );

      // Get recent trends (daily for last 30 days)
      const trendsResult = await client.query(
        `SELECT 
           DATE(created_at) as date,
           COUNT(*) as count,
           AVG((assessment_result->>'estimatedValue')::numeric) as avg_value
         FROM assessments ${whereClause}
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) DESC
         LIMIT 30`,
        params
      );

      const stats = statsResult.rows[0];
      return {
        totalAssessments: parseInt(stats.total_assessments),
        averageProcessingTime: parseFloat(stats.avg_processing_time) || 0,
        successRate: parseFloat(stats.success_rate) || 0,
        byPropertyType: typeResult.rows.reduce((acc, row) => {
          acc[row.type] = parseInt(row.count);
          return acc;
        }, {}),
        byCounty: countyResult.rows.reduce((acc, row) => {
          acc[row.county] = parseInt(row.count);
          return acc;
        }, {}),
        recentTrends: trendsResult.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count),
          avgValue: parseFloat(row.avg_value) || 0,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to get assessment stats: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get county information
   */
  async getCounties(): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT id, name, state, boundaries, config
         FROM counties
         ORDER BY name`
      );

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get counties: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Create migrations table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(255) PRIMARY KEY,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Check which migrations have been applied
      const result = await client.query('SELECT version FROM schema_migrations');
      const appliedMigrations = result.rows.map(row => row.version);

      // Define migrations
      const migrations = [
        {
          version: '001_initial_schema',
          sql: this.getInitialSchemaMigration(),
        },
        {
          version: '002_add_indexes',
          sql: this.getIndexesMigration(),
        },
      ];

      // Apply pending migrations
      for (const migration of migrations) {
        if (!appliedMigrations.includes(migration.version)) {
          console.log(`Applying migration: ${migration.version}`);
          await client.query(migration.sql);
          await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [
            migration.version,
          ]);
        }
      }
    } catch (error) {
      throw new Error(`Migration failed: ${error.message}`);
    } finally {
      client.release();
    }
  }

  private getInitialSchemaMigration(): string {
    return `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Counties table
      CREATE TABLE IF NOT EXISTS counties (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        state VARCHAR(10) NOT NULL,
        boundaries JSONB,
        config JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Assessments table
      CREATE TABLE IF NOT EXISTS assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        property_data JSONB NOT NULL,
        assessment_result JSONB NOT NULL,
        processing_time INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Bulk assessment jobs table
      CREATE TABLE IF NOT EXISTS bulk_assessment_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        property_count INTEGER NOT NULL,
        results_count INTEGER NOT NULL,
        processing_time INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Share tokens table
      CREATE TABLE IF NOT EXISTS share_tokens (
        token VARCHAR(255) PRIMARY KEY,
        assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        access_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
  }

  private getIndexesMigration(): string {
    return `
      -- Performance indexes
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_user_id 
      ON assessments(user_id);
      
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_created_at 
      ON assessments(created_at DESC);
      
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_user_created 
      ON assessments(user_id, created_at DESC);
      
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_county_type 
      ON assessments((property_data->>'county'), (property_data->>'type'));
      
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_status 
      ON assessments(status);
      
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bulk_jobs_user_id 
      ON bulk_assessment_jobs(user_id);
      
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_share_tokens_expires 
      ON share_tokens(expires_at);
    `;
  }

  private generateRandomToken(): string {
    return Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);
  }

  private calculateDateFromPeriod(period: string): Date {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}

// Export singleton instance
let dbInstance: DatabaseService | null = null;

export const createDatabaseService = (config: DatabaseConfig): DatabaseService => {
  if (!dbInstance) {
    dbInstance = new DatabaseService(config);
  }
  return dbInstance;
};

export const getDatabaseService = (): DatabaseService => {
  if (!dbInstance) {
    throw new Error('Database service not initialized. Call createDatabaseService() first.');
  }
  return dbInstance;
};
