/**
 * TFR-095: TypeScript type definitions for the canon-sync subsystem.
 * canon-sync = synchronization, connectors, orchestration. No appraisal math.
 */

// --- Sync Jobs ---

export type SyncMode = 'full' | 'delta';
export type SyncStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type SyncDirection = 'inbound' | 'outbound' | 'bidirectional';

export interface SyncJob {
  id: string;
  name: string;
  connectorName: string;
  status: SyncStatus;
  mode: SyncMode;
  direction: SyncDirection;
  progress: number; // 0-100
  recordsProcessed: number;
  recordsTotal: number;
  recordsFailed: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  createdBy: string;
  errorMessage: string | null;
}

export interface SyncResult {
  jobId: string;
  status: SyncStatus;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  errors: SyncError[];
  duration: number; // milliseconds
  completedAt: string;
}

export interface SyncError {
  recordId: string | null;
  field: string | null;
  message: string;
  severity: 'warning' | 'error' | 'critical';
}

// --- Connectors ---

export type ConnectorType = 'sql-server' | 'odbc' | 'csv' | 'excel' | 'api' | 'pacs';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface ConnectorStatus {
  name: string;
  type: ConnectorType;
  displayName: string;
  connected: boolean;
  lastPingAt: string | null;
  latencyMs: number | null;
  version: string | null;
}

export interface ConnectorHealth {
  name: string;
  status: HealthStatus;
  uptime: number; // percentage 0-100
  lastCheckAt: string;
  consecutiveFailures: number;
  errorMessage: string | null;
  metrics: ConnectorMetrics;
}

export interface ConnectorMetrics {
  avgLatencyMs: number;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastSyncAt: string | null;
  recordsSyncedTotal: number;
}

export interface ConnectorSchema {
  name: string;
  tables: ConnectorTable[];
}

export interface ConnectorTable {
  tableName: string;
  columns: ConnectorColumn[];
  rowCount: number | null;
}

export interface ConnectorColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  isPrimaryKey: boolean;
}

// --- Scheduling ---

export type ScheduleFrequency = 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface SyncSchedule {
  id: string;
  connectorName: string;
  frequency: ScheduleFrequency;
  cronExpression: string | null;
  mode: SyncMode;
  enabled: boolean;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastRunStatus: SyncStatus | null;
}

// --- Data Sources & Import ---

export interface DataSource {
  id: string;
  name: string;
  type: ConnectorType;
  connectionString: string | null;
  filePath: string | null;
  description: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FieldMapping {
  id: string;
  sourceField: string;
  targetField: string;
  transformExpression: string | null;
  required: boolean;
  defaultValue: string | null;
}

export interface ImportConfig {
  sourceId: string;
  sourceName: string;
  sourceType: ConnectorType;
  tableName: string | null;
  fieldMappings: FieldMapping[];
  mode: SyncMode;
  validateOnly: boolean;
  skipErrors: boolean;
  batchSize: number;
}

// --- Validation ---

export type ValidationSeverity = 'info' | 'warning' | 'error';

export interface ValidationResult {
  field: string;
  rule: string;
  severity: ValidationSeverity;
  message: string;
}

// --- API Response Wrappers ---

export interface SyncApiResponse<T> {
  data: T;
  success: boolean;
  error: string | null;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
