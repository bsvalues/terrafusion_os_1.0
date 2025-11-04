// Export all schemas and types from the shared package
import * as Schema from './schema';
import * as TerrainsightSchema from './terrainsight-schema';

// Export schemas as named exports
export const CoreSchema = Schema;
export const TerrainInsightSchema = TerrainsightSchema;

// Re-export common types
export type {
  User,
  InsertUser,
  Property,
  InsertProperty,
  Appraisal,
  InsertAppraisal,
  Comparable,
  InsertComparable,
  Adjustment,
  InsertAdjustment,
  Attachment,
  InsertAttachment,
  MarketData,
  InsertMarketData
} from './schema';

// Re-export TerraInsight specific types
export type {
  NeighborhoodTimelineDataPoint,
  NeighborhoodTimeline,
  Project,
  InsertProject,
  Script,
  InsertScript,
  ScriptGroup,
  InsertScriptGroup,
  RegressionModel,
  InsertRegressionModel,
  IncomeHotelMotel,
  InsertIncomeHotelMotel,
  IncomeHotelMotelDetail,
  InsertIncomeHotelMotelDetail,
  IncomeLeaseUp,
  InsertIncomeLeaseUp,
  IncomeLeaseUpMonthListing,
  InsertIncomeLeaseUpMonthListing,
  EtlDataSource,
  InsertEtlDataSource,
  EtlTransformationRule,
  InsertEtlTransformationRule,
  EtlJob,
  InsertEtlJob,
  EtlOptimizationSuggestion,
  InsertEtlOptimizationSuggestion,
  EtlBatchJob,
  InsertEtlBatchJob,
  EtlAlert,
  InsertEtlAlert,
  AuditRecord,
  InsertAuditRecord,
  PropertyHistoryRecord,
  InsertPropertyHistoryRecord
} from './terrainsight-schema';