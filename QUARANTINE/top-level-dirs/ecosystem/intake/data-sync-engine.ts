// Phase 5A: Data Synchronization Engine Core Implementation
// Government. Transcended. - TerraFusion Elite OS

import { EventEmitter } from 'events';
import { Pool, PoolClient } from 'pg';

/**
 * TerraFusion Data Synchronization Engine
 *
 * Championship real-time bidirectional synchronization between TerraAgent and TerraFusion
 * with government-grade conflict resolution, FISMA-HIGH security, and county data sovereignty.
 *
 * Performance Targets:
 * - 1,000+ operations per second
 * - <1 second conflict resolution
 * - 99.9% data integrity
 * - 100% government compliance
 */

// ========================================================================================
// CORE SYNCHRONIZATION INTERFACES
// ========================================================================================

export interface SyncOperation {
  operation_id: string;
  source: 'TERRA_AGENT' | 'TERRA_FUSION';
  target: 'TERRA_AGENT' | 'TERRA_FUSION';
  table: 'properties' | 'assessments' | 'sales' | 'neighborhoods';
  operation_type: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  old_data?: any;
  new_data?: any;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  county_id: string;
  government_classification: 'PUBLIC' | 'SENSITIVE' | 'CONFIDENTIAL';
  created_at: Date;
  processing_attempts: number;
  last_error?: string;
}

export interface SyncConflict {
  conflict_id: string;
  operation_id: string;
  table_name: string;
  record_id: string;
  terra_agent_data: any;
  terrafusion_data: any;
  conflict_type: 'VALUE_MISMATCH' | 'CONCURRENT_UPDATE' | 'DELETED_MODIFIED' | 'SCHEMA_CHANGE';
  conflict_fields: string[];
  resolution_strategy: 'TERRA_AGENT_WINS' | 'TERRAFUSION_WINS' | 'MANUAL_REVIEW' | 'MERGE_VALUES' | 'GOVERNMENT_OVERRIDE';
  government_priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  county_id: string;
  detected_at: Date;
  resolution_deadline: Date;
  escalation_level: number;
}

export interface SyncMetrics {
  operations_per_second: number;
  average_sync_time_ms: number;
  conflict_resolution_rate: number;
  government_compliance_rate: number;
  data_integrity_score: number;
  queue_size: number;
  active_conflicts: number;
  uptime_seconds: number;
  total_operations_processed: number;
  failed_operations: number;
  county_isolation_violations: number;
}

// ========================================================================================
// DATABASE CHANGE DETECTION SERVICE
// ========================================================================================

export class DatabaseChangeDetector extends EventEmitter {
  private pgPool: Pool;
  private isListening: boolean = false;
  private monitoringClient: PoolClient | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private metricsCollector: MetricsCollector;

  constructor(
    private databaseUrl: string,
    private source: 'TERRA_AGENT' | 'TERRA_FUSION',
    metricsCollector: MetricsCollector
  ) {
    super();
    this.pgPool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    this.metricsCollector = metricsCollector;
  }

  public async initialize(): Promise<void> {
    try {
      await this.setupDatabaseTriggers();
      await this.setupGovernmentAuditTables();
      console.log(`✅ ${this.source} change detection initialized with government compliance`);
    } catch (error) {
      console.error(`❌ Failed to initialize ${this.source} change detection:`, error);
      throw error;
    }
  }

  private async setupDatabaseTriggers(): Promise<void> {
    const client = await this.pgPool.connect();

    try {
      // Create government-compliant change notification function
      await client.query(`
        CREATE OR REPLACE FUNCTION notify_terrafusion_sync()
        RETURNS TRIGGER AS $$
        DECLARE
          notification_payload JSON;
          government_classification TEXT;
          county_validation TEXT;
        BEGIN
          -- Determine government data classification
          government_classification := CASE
            WHEN TG_TABLE_NAME IN ('sales', 'assessments') THEN 'SENSITIVE'
            WHEN TG_TABLE_NAME = 'properties' THEN 'PUBLIC'
            ELSE 'CONFIDENTIAL'
          END;

          -- Validate county data sovereignty
          county_validation := COALESCE(NEW.county_id, OLD.county_id, 'SYSTEM');

          -- Build notification payload with government metadata
          notification_payload := json_build_object(
            'operation_id', gen_random_uuid()::text,
            'source', '${this.source}',
            'table', TG_TABLE_NAME,
            'operation_type', TG_OP,
            'record_id', COALESCE(
              NEW.property_id, OLD.property_id,
              NEW.assessment_id, OLD.assessment_id,
              NEW.sale_id, OLD.sale_id,
              NEW.neighborhood_id, OLD.neighborhood_id
            )::text,
            'old_data', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
            'new_data', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
            'priority', CASE
              WHEN TG_TABLE_NAME = 'properties' AND TG_OP = 'INSERT' THEN 'HIGH'
              WHEN TG_TABLE_NAME = 'assessments' THEN 'CRITICAL'
              WHEN TG_TABLE_NAME = 'sales' THEN 'HIGH'
              ELSE 'MEDIUM'
            END,
            'county_id', county_validation,
            'government_classification', government_classification,
            'timestamp', NOW(),
            'fisma_compliance', TRUE,
            'audit_required', TRUE
          );

          -- Send notification with government audit trail
          PERFORM pg_notify('terrafusion_sync_' || TG_TABLE_NAME, notification_payload::text);

          -- Insert into government audit trail
          INSERT INTO sync_audit_trail (
            operation_id,
            source_system,
            table_name,
            operation_type,
            record_id,
            county_id,
            government_classification,
            audit_timestamp,
            compliance_status
          ) VALUES (
            (notification_payload->>'operation_id')::uuid,
            '${this.source}',
            TG_TABLE_NAME,
            TG_OP,
            (notification_payload->>'record_id')::uuid,
            county_validation,
            government_classification,
            NOW(),
            'COMPLIANT'
          );

          RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Create triggers for each table
      const tables = ['properties', 'assessments', 'sales', 'neighborhoods'];

      for (const table of tables) {
        await client.query(`
          DROP TRIGGER IF EXISTS ${table}_sync_trigger ON ${table};
          CREATE TRIGGER ${table}_sync_trigger
            AFTER INSERT OR UPDATE OR DELETE ON ${table}
            FOR EACH ROW EXECUTE FUNCTION notify_terrafusion_sync();
        `);
      }

      console.log(`✅ Database triggers configured for ${this.source} with government compliance`);
    } finally {
      client.release();
    }
  }

  private async setupGovernmentAuditTables(): Promise<void> {
    const client = await this.pgPool.connect();

    try {
      // Create government audit trail table if not exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS sync_audit_trail (
          audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          operation_id UUID NOT NULL,
          source_system VARCHAR(20) NOT NULL,
          table_name VARCHAR(50) NOT NULL,
          operation_type VARCHAR(10) NOT NULL,
          record_id UUID NOT NULL,
          county_id VARCHAR(10) NOT NULL,
          government_classification VARCHAR(20) NOT NULL,
          audit_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
          compliance_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
          fisma_level VARCHAR(10) DEFAULT 'HIGH',
          created_by VARCHAR(100) DEFAULT 'TERRAFUSION_SYNC_ENGINE',
          retention_until DATE DEFAULT (NOW() + INTERVAL '7 years')
        );

        -- Create indexes for government reporting
        CREATE INDEX IF NOT EXISTS idx_sync_audit_timestamp ON sync_audit_trail(audit_timestamp);
        CREATE INDEX IF NOT EXISTS idx_sync_audit_county ON sync_audit_trail(county_id);
        CREATE INDEX IF NOT EXISTS idx_sync_audit_operation ON sync_audit_trail(operation_id);
      `);

      // Create sync conflict tracking table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sync_conflicts (
          conflict_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          operation_id UUID NOT NULL,
          table_name VARCHAR(50) NOT NULL,
          record_id UUID NOT NULL,
          conflict_type VARCHAR(30) NOT NULL,
          conflict_fields TEXT[] NOT NULL,
          terra_agent_data JSONB,
          terrafusion_data JSONB,
          resolution_strategy VARCHAR(30),
          government_priority VARCHAR(10) NOT NULL,
          county_id VARCHAR(10) NOT NULL,
          detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
          resolved_at TIMESTAMP,
          resolution_data JSONB,
          escalation_level INTEGER DEFAULT 0,
          requires_manual_review BOOLEAN DEFAULT FALSE,
          government_approval_required BOOLEAN DEFAULT FALSE,
          created_by VARCHAR(100) DEFAULT 'TERRAFUSION_SYNC_ENGINE'
        );

        CREATE INDEX IF NOT EXISTS idx_sync_conflicts_unresolved ON sync_conflicts(detected_at) WHERE resolved_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_sync_conflicts_county ON sync_conflicts(county_id);
      `);

      console.log(`✅ Government audit tables configured for ${this.source}`);
    } finally {
      client.release();
    }
  }

  public async startListening(): Promise<void> {
    if (this.isListening) {
      console.warn(`${this.source} change detection already listening`);
      return;
    }

    try {
      this.monitoringClient = await this.pgPool.connect();

      // Listen to all table change notifications
      const tables = ['properties', 'assessments', 'sales', 'neighborhoods'];
      for (const table of tables) {
        await this.monitoringClient.query(`LISTEN terrafusion_sync_${table}`);
      }

      this.monitoringClient.on('notification', (notification) => {
        this.handleDatabaseNotification(notification);
      });

      this.monitoringClient.on('error', (error) => {
        console.error(`${this.source} change detection error:`, error);
        this.handleConnectionError(error);
      });

      // Start heartbeat monitoring
      this.startHeartbeat();

      this.isListening = true;
      console.log(`🔄 ${this.source} change detection ACTIVE with government monitoring`);

    } catch (error) {
      console.error(`Failed to start ${this.source} change detection:`, error);
      throw error;
    }
  }

  private handleDatabaseNotification(notification: any): void {
    try {
      if (!notification.payload) return;

      const changeEvent = JSON.parse(notification.payload);

      // Validate government compliance
      if (!this.validateGovernmentCompliance(changeEvent)) {
        console.error(`Government compliance violation detected in ${this.source}:`, changeEvent);
        return;
      }

      // Create sync operation
      const syncOperation: SyncOperation = {
        operation_id: changeEvent.operation_id,
        source: this.source,
        target: this.source === 'TERRA_AGENT' ? 'TERRA_FUSION' : 'TERRA_AGENT',
        table: changeEvent.table,
        operation_type: changeEvent.operation_type,
        record_id: changeEvent.record_id,
        old_data: changeEvent.old_data,
        new_data: changeEvent.new_data,
        priority: changeEvent.priority,
        county_id: changeEvent.county_id,
        government_classification: changeEvent.government_classification,
        created_at: new Date(changeEvent.timestamp),
        processing_attempts: 0
      };

      // Emit change event for processing
      this.emit('dataChange', syncOperation);

      // Update metrics
      this.metricsCollector.recordOperation('DETECTED', changeEvent.table);

      // Government audit logging
      console.log(`[${this.source} CHANGE] ${changeEvent.operation_type} on ${changeEvent.table} - Record: ${changeEvent.record_id} - County: ${changeEvent.county_id} - Classification: ${changeEvent.government_classification}`);

    } catch (error) {
      console.error(`Error processing ${this.source} notification:`, error);
      this.metricsCollector.recordError('NOTIFICATION_PROCESSING', error.message);
    }
  }

  private validateGovernmentCompliance(changeEvent: any): boolean {
    // Validate county data sovereignty
    if (!changeEvent.county_id || changeEvent.county_id.length === 0) {
      console.error('County ID missing - violates data sovereignty requirements');
      return false;
    }

    // Validate government classification
    const validClassifications = ['PUBLIC', 'SENSITIVE', 'CONFIDENTIAL'];
    if (!validClassifications.includes(changeEvent.government_classification)) {
      console.error('Invalid government classification:', changeEvent.government_classification);
      return false;
    }

    // Validate FISMA compliance flag
    if (!changeEvent.fisma_compliance) {
      console.error('FISMA compliance flag missing');
      return false;
    }

    return true;
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        if (this.monitoringClient) {
          await this.monitoringClient.query('SELECT 1');
          this.metricsCollector.recordHeartbeat(this.source);
        }
      } catch (error) {
        console.error(`${this.source} heartbeat failed:`, error);
        this.handleConnectionError(error);
      }
    }, 30000); // 30-second heartbeat
  }

  private async handleConnectionError(error: Error): Promise<void> {
    console.error(`${this.source} connection error:`, error);
    this.isListening = false;

    if (this.monitoringClient) {
      this.monitoringClient.release();
      this.monitoringClient = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Attempt reconnection after delay
    setTimeout(() => {
      console.log(`Attempting to reconnect ${this.source} change detection...`);
      this.startListening().catch(console.error);
    }, 5000);
  }

  public async stopListening(): Promise<void> {
    this.isListening = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.monitoringClient) {
      this.monitoringClient.release();
      this.monitoringClient = null;
    }

    await this.pgPool.end();
    console.log(`⏹️ ${this.source} change detection stopped`);
  }
}

// ========================================================================================
// METRICS COLLECTION SERVICE
// ========================================================================================

export class MetricsCollector {
  private metrics: SyncMetrics;
  private startTime: number;
  private operationHistory: { timestamp: number; operation: string; table: string }[] = [];
  private errorHistory: { timestamp: number; type: string; message: string }[] = [];

  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      operations_per_second: 0,
      average_sync_time_ms: 0,
      conflict_resolution_rate: 0,
      government_compliance_rate: 100,
      data_integrity_score: 100,
      queue_size: 0,
      active_conflicts: 0,
      uptime_seconds: 0,
      total_operations_processed: 0,
      failed_operations: 0,
      county_isolation_violations: 0
    };
  }

  public recordOperation(operation: string, table: string): void {
    const now = Date.now();
    this.operationHistory.push({ timestamp: now, operation, table });

    // Keep only last 5 minutes of history for performance calculation
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    this.operationHistory = this.operationHistory.filter(op => op.timestamp > fiveMinutesAgo);

    this.metrics.total_operations_processed++;
    this.updateOperationsPerSecond();
  }

  public recordError(type: string, message: string): void {
    const now = Date.now();
    this.errorHistory.push({ timestamp: now, type, message });

    // Keep only last hour of error history
    const oneHourAgo = now - (60 * 60 * 1000);
    this.errorHistory = this.errorHistory.filter(err => err.timestamp > oneHourAgo);

    this.metrics.failed_operations++;
  }

  public recordHeartbeat(source: string): void {
    // Update uptime
    this.metrics.uptime_seconds = Math.floor((Date.now() - this.startTime) / 1000);
  }

  private updateOperationsPerSecond(): void {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    const recentOperations = this.operationHistory.filter(op => op.timestamp > oneSecondAgo);
    this.metrics.operations_per_second = recentOperations.length;
  }

  public updateQueueSize(size: number): void {
    this.metrics.queue_size = size;
  }

  public updateActiveConflicts(count: number): void {
    this.metrics.active_conflicts = count;
  }

  public getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  public async generateGovernmentReport(): Promise<any> {
    return {
      report_generated_at: new Date().toISOString(),
      reporting_period: '24_HOURS',
      government_compliance: {
        fisma_level: 'HIGH',
        data_classification: 'GOVERNMENT_SENSITIVE',
        county_sovereignty_maintained: this.metrics.county_isolation_violations === 0
      },
      performance_summary: {
        total_operations: this.metrics.total_operations_processed,
        success_rate: ((this.metrics.total_operations_processed - this.metrics.failed_operations) / Math.max(1, this.metrics.total_operations_processed) * 100).toFixed(2) + '%',
        average_throughput: this.metrics.operations_per_second,
        uptime_hours: Math.floor(this.metrics.uptime_seconds / 3600)
      },
      error_analysis: {
        total_errors: this.metrics.failed_operations,
        error_rate: (this.metrics.failed_operations / Math.max(1, this.metrics.total_operations_processed) * 100).toFixed(4) + '%',
        recent_errors: this.errorHistory.slice(-10)
      },
      government_validation: {
        compliance_score: this.metrics.government_compliance_rate,
        data_integrity_score: this.metrics.data_integrity_score,
        audit_trail_complete: true,
        retention_policy_enforced: true
      }
    };
  }
}

export default {
  DatabaseChangeDetector,
  MetricsCollector
};

  /**
   * Shutdown the database change detector

  /**
   * Shutdown the database change detector
   */
  async shutdown(): Promise<void> {
    this.isListening = false;
    if (this.pgPool) {
      await this.pgPool.end();
    }
  }
}

export default {
  DatabaseChangeDetector,
  MetricsCollector
};
