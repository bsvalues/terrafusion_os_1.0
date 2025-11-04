/**
 * TrueAutomation/PACS Type Definitions
 * Elite Quantum AI Power User Interface Types
 */

// DTOs from PACS Service
export interface AccountDTO {
  id: number;
  firstName?: string;
  lastName?: string;
  fileAsName?: string;
  drivingLicenseNumber?: string;
  drivingLicenseState?: string;
  drivingLicenseExpiryDate?: Date;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phoneNumber?: string;
  emailAddress?: string;
  [key: string]: any;
}

export interface PropertyDTO {
  id: number;
  propertyNumber?: string;
  taxValue?: number;
  assessedValue?: number;
  ownerName?: string;
  ownerOverride?: boolean;
  agentOverride?: boolean;
  ownerUpdateDate?: Date;
  agentUpdateDate?: Date;
  [key: string]: any;
}

export interface PayImportedPaymentRunDTO {
  runID: number;
  acceptCount: number;
  fileType: string;
  recordCount: number;
  paymentSourceId: number;
  amountPaid: number;
}

export interface REETExportDTO {
  fullFileName: string;
  asOfDate: Date;
  exportErrorMessage?: string;
  isSuccess: boolean;
}

export interface PACSSearchDTO {
  fileAsName?: string;
  firstName?: string;
  lastName?: string;
  propertyNumber?: string;
  taxValueMin?: number;
  taxValueMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  [key: string]: any;
}

export interface TaskQueryMappingDTO {
  id: string;
  name: string;
  description?: string;
  query: string;
  mappedQuery?: string;
}

export interface TaskQueryDTO {
  id: string;
  name: string;
  description?: string;
  query: string;
}

export interface SqlQueryResult {
  columnNames: string[];
  resultRows: any[][];
}

export interface PacsUserDTO {
  id: number;
  pacsUserName: string;
  fullName: string;
  description?: string;
  userRoles: number[];
  mruPropId1?: number;
  mruPropId2?: number;
  mruPropId3?: number;
  mruPropId4?: number;
  mruPropId5?: number;
  mruPropId6?: number;
  mruPropId7?: number;
  mruPropId8?: number;
  mruAcctId1?: number;
  mruAcctId2?: number;
  mruAcctId3?: number;
  mruAcctId4?: number;
  mruAcctId5?: number;
  mruAcctId6?: number;
  mruAcctId7?: number;
  mruAcctId8?: number;
  mruBillId1?: number;
  mruBillId2?: number;
  mruBillId3?: number;
  mruBillId4?: number;
  mruBillId5?: number;
  mruBillId6?: number;
  mruBillId7?: number;
  mruBillId8?: number;
  searchRowCount?: number;
  logonStart?: Date;
  logonEnd?: Date;
}

// UI State Types
export interface DashboardState {
  selectedMetrics: string[];
  layout: DashboardLayout;
  refreshInterval: number;
  realTimeEnabled: boolean;
}

export interface DashboardLayout {
  panels: DashboardPanel[];
  compactMode?: boolean;
  showStatisticalBreakdown?: boolean;
  showCorrelationMatrix?: boolean;
  showLiveCharts?: boolean;
  autoRefresh?: boolean;
  showNotifications?: boolean;
}

export interface DashboardPanel {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'custom';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
}

export interface QueryBuilderState {
  tables: TableSchema[];
  selectedTables: string[];
  columns: ColumnSchema[];
  conditions: QueryCondition[];
  aggregations: QueryAggregation[];
  orderBy: OrderByClause[];
  limit?: number;
}

export interface TableSchema {
  name: string;
  alias?: string;
  columns: ColumnSchema[];
  relationships: Relationship[];
}

export interface ColumnSchema {
  table: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
}

export interface Relationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'inner' | 'left' | 'right' | 'full';
}

export interface QueryCondition {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'BETWEEN';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface QueryAggregation {
  column: string;
  function: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';
  alias?: string;
  groupBy?: boolean;
}

export interface OrderByClause {
  column: string;
  direction: 'ASC' | 'DESC';
}

export interface QueryTemplate {
  id: string;
  name: string;
  description?: string;
  sql: string;
  createdAt: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  workflowJson: string;
  createdAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  dashboardLayout: DashboardLayout;
  keyboardShortcuts: Record<string, string>;
  defaultRefreshInterval: number;
  customMetrics: CustomMetric[];
  savedQueries: SavedQuery[];
  queryTemplates?: QueryTemplate[];
  workflowTemplates?: WorkflowTemplate[];
  compactMode?: boolean;
  autoRefresh?: boolean;
  showNotifications?: boolean;
}

export interface CustomMetric {
  id: string;
  name: string;
  formula: string;
  description?: string;
  unit?: string;
  category?: string;
}

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  query: string;
  createdAt: Date;
  lastExecuted?: Date;
  executionCount: number;
}

export interface LiveMetrics {
  timestamp: Date;
  metrics: Record<string, number>;
  trends: Record<string, TrendData>;
  alerts: Alert[];
}

export interface TrendData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  direction: 'up' | 'down' | 'stable';
  confidence: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

// Statistical Analysis Types
export interface StatisticalAnalysis {
  mean: number;
  median: number;
  mode: number;
  standardDeviation: number;
  variance: number;
  min: number;
  max: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
  outliers: number[];
  distribution: DistributionData[];
}

export interface DistributionData {
  bin: string;
  count: number;
  frequency: number;
}

export interface CorrelationMatrix {
  variables: string[];
  correlations: number[][];
  significance: number[][];
}

export interface PredictiveModel {
  type: 'linear' | 'exponential' | 'arima' | 'custom';
  parameters: Record<string, number>;
  accuracy: number;
  forecast: ForecastData[];
}

export interface ForecastData {
  date: Date;
  predicted: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

