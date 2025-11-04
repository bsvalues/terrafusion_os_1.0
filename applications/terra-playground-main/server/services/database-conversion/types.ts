/**
 * Database Conversion Service Types
 *
 * This file contains type definitions used throughout the database conversion service
 */

// Enum types (exported for use in schema.ts)
export enum DatabaseType {
  PostgreSQL = 'postgresql',
  MySQL = 'mysql',
  SQLite = 'sqlite',
  SQLServer = 'sqlserver',
  Oracle = 'oracle',
  MongoDB = 'mongodb',
  DynamoDB = 'dynamodb',
  Cassandra = 'cassandra',
  Redis = 'redis',
  ElasticSearch = 'elasticsearch',
  Neo4j = 'neo4j',
  Firestore = 'firestore',
  CosmosDB = 'cosmosdb',
  Unknown = 'unknown',
}

export enum ConnectionStatus {
  Success = 'success',
  Failed = 'failed',
  Pending = 'pending',
}

export enum ConversionStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
  Paused = 'paused',
}

export enum FieldType {
  String = 'string',
  Integer = 'integer',
  Float = 'float',
  Boolean = 'boolean',
  Date = 'date',
  DateTime = 'datetime',
  UUID = 'uuid',
  JSON = 'json',
  Binary = 'binary',
  Array = 'array',
  Object = 'object',
  Enum = 'enum',
  Unknown = 'unknown',
}

// Database connection test result
export interface ConnectionTestResult {
  status: ConnectionStatus;
  message: string;
  timestamp: Date;
  details?: any;
  databaseInfo?: {
    name?: string;
    version?: string;
    type?: string;
  };
}

// Schema Analysis Results
export interface SchemaAnalysisResult {
  databaseType: DatabaseType;
  timestamp: Date;
  tables: TableSchema[];
  views: ViewSchema[];
  procedures: ProcedureSchema[];
  functions: FunctionSchema[];
  triggers: TriggerSchema[];
  constraints: ConstraintSchema[];
  statistics: {
    totalTables: number;
    totalViews: number;
    totalProcedures: number;
    totalFunctions: number;
    totalTriggers: number;
    totalConstraints: number;
    estimatedSizeMb?: number;
  };
}

// Table schema
export interface TableSchema {
  name: string;
  schema?: string;
  description?: string;
  columns: ColumnSchema[];
  primaryKey?: string[];
  foreignKeys?: ForeignKeySchema[];
  indexes?: IndexSchema[];
  constraints?: ConstraintSchema[];
  estimatedRowCount?: number;
  estimatedSizeMb?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Column schema
export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  autoIncrement?: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isUnique?: boolean;
  description?: string;
  position: number;
  length?: number;
  precision?: number;
  scale?: number;
  enumValues?: string[];
}

// Foreign key schema
export interface ForeignKeySchema {
  name: string;
  columnNames: string[];
  referencedTableName: string;
  referencedColumnNames: string[];
  updateRule?: string;
  deleteRule?: string;
}

// Index schema
export interface IndexSchema {
  name: string;
  columnNames: string[];
  isUnique: boolean;
  isPrimaryKey?: boolean;
  type?: string;
  method?: string;
}

// View schema
export interface ViewSchema {
  name: string;
  schema?: string;
  description?: string;
  definition: string;
  columns: ColumnSchema[];
  dependencies?: string[];
  isMaterialized?: boolean;
  updatedAt?: Date;
}

// Stored procedure schema
export interface ProcedureSchema {
  name: string;
  schema?: string;
  description?: string;
  parameters: ParameterSchema[];
  returnType?: string;
  definition: string;
  language?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Function schema
export interface FunctionSchema {
  name: string;
  schema?: string;
  description?: string;
  parameters: ParameterSchema[];
  returnType: string;
  definition: string;
  language?: string;
  deterministic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Parameter schema
export interface ParameterSchema {
  name: string;
  type: string;
  direction?: string;
  defaultValue?: any;
  position: number;
}

// Trigger schema
export interface TriggerSchema {
  name: string;
  schema?: string;
  description?: string;
  tableName: string;
  event: string;
  timing: string;
  definition: string;
  enabled: boolean;
  createdAt?: Date;
}

// Constraint schema
export interface ConstraintSchema {
  name: string;
  schema?: string;
  type: string;
  tableName: string;
  columnNames: string[];
  definition?: string;
  checkExpression?: string;
  referencedTableName?: string;
  referencedColumnNames?: string[];
}

// Conversion result
export interface ConversionResult {
  projectId: string;
  status: ConversionStatus;
  progress: number; // 0-100
  startTime?: Date;
  endTime?: Date;
  summary?: {
    tablesConverted: number;
    totalTables: number;
    recordsProcessed: number;
    estimatedTotalRecords: number;
    errors: number;
    warnings: number;
  };
  currentStage?: string;
  estimatedTimeRemaining?: number; // seconds
  lastUpdated: Date;
  errorMessage?: string;
}

// Compatibility layer options
export interface CompatibilityLayerOptions {
  ormType?: string; // e.g., "sequelize", "typeorm", "prisma", "drizzle", "mongoose"
  includeModels?: boolean;
  includeMigrations?: boolean;
  includeQueryHelpers?: boolean;
  includeCRUDOperations?: boolean;
  includeDataValidation?: boolean;
  additionalFeatures?: string[];
  language?: string; // e.g., "javascript", "typescript"
  apiStyle?: string; // e.g., "rest", "graphql"
}
