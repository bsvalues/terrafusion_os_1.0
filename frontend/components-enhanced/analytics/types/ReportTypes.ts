export interface ReportConfiguration {
  id?: string;
  name: string;
  description: string;
  category: string;
  accessLevel: 'public' | 'internal' | 'restricted' | 'confidential';
  jurisdiction: string;
  elements: ReportElement[];
  schedule?: ReportSchedule;
  isTemplate: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  version: number;
}

export interface ReportElement {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'filter' | 'text' | 'map' | 'image';
  title: string;
  position: number;
  configuration: any;
  dataSource: string;
  filters: FilterConfiguration[];
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  time: string;
  timezone: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'html';
  startDate?: Date;
  endDate?: Date;
  weekdays?: number[];
  monthDay?: number;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'harris-pacs';
  connectionString?: string;
  apiEndpoint?: string;
  schema?: DataSourceSchema;
  refreshRate: number;
  lastUpdated: Date;
  isActive: boolean;
}

export interface DataSourceSchema {
  tables: TableSchema[];
  relationships: TableRelationship[];
}

export interface TableSchema {
  name: string;
  displayName: string;
  columns: ColumnSchema[];
  primaryKey: string[];
  description?: string;
}

export interface ColumnSchema {
  name: string;
  displayName: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage';
  nullable: boolean;
  description?: string;
  format?: string;
  aggregatable: boolean;
  filterable: boolean;
  sortable: boolean;
}

export interface TableRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface ChartConfiguration {
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'gauge' | 'funnel';
  xAxis: string;
  yAxis: string | string[];
  series?: SeriesConfiguration[];
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median';
  groupBy?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  limit?: number;
  showLegend: boolean;
  showDataLabels: boolean;
  colors: string[];
  customOptions?: any;
}

export interface SeriesConfiguration {
  name: string;
  field: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  color?: string;
  type?: 'bar' | 'line' | 'area';
}

export interface TableConfiguration {
  columns: TableColumnConfiguration[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  pageSize: number;
  showPagination: boolean;
  showSearch: boolean;
  showExport: boolean;
  conditionalFormatting?: ConditionalFormattingRule[];
}

export interface TableColumnConfiguration {
  field: string;
  displayName: string;
  width?: number;
  alignment: 'left' | 'center' | 'right';
  format?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  visible: boolean;
  sortable: boolean;
  filterable: boolean;
}

export interface ConditionalFormattingRule {
  field: string;
  condition: 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'contains' | 'between';
  value: any;
  secondValue?: any;
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold';
}

export interface MetricConfiguration {
  metric: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  format: 'number' | 'currency' | 'percentage' | 'duration';
  comparison: 'none' | 'previous-period' | 'previous-year' | 'target' | 'benchmark';
  comparisonValue?: number;
  showTrend: boolean;
  trendPeriod?: number;
  thresholds: {
    warning: number;
    critical: number;
  };
  prefix?: string;
  suffix?: string;
  decimalPlaces?: number;
}

export interface FilterConfiguration {
  id: string;
  field: string;
  displayName: string;
  filterType: 'dropdown' | 'multiselect' | 'daterange' | 'slider' | 'text' | 'checkbox';
  options?: FilterOption[];
  defaultValue?: any;
  multiSelect: boolean;
  required: boolean;
  dependsOn?: string[];
}

export interface FilterOption {
  value: any;
  label: string;
  count?: number;
}

export interface TextConfiguration {
  content: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  alignment: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  backgroundColor?: string;
  padding?: number;
  margin?: number;
}

export interface MapConfiguration {
  mapType: 'choropleth' | 'marker' | 'heatmap' | 'cluster';
  geoField: string;
  valueField: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  colorScale: string[];
  showLegend: boolean;
  showTooltip: boolean;
  zoomLevel?: number;
  centerLat?: number;
  centerLng?: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  configuration: ReportConfiguration;
  isPublic: boolean;
  usageCount: number;
  rating: number;
  tags: string[];
  createdBy: string;
  createdAt: Date;
}

export interface ReportExecution {
  id: string;
  reportId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  parameters?: Record<string, any>;
  outputFormat: 'pdf' | 'excel' | 'csv' | 'html' | 'json';
  outputUrl?: string;
  errorMessage?: string;
  executedBy: string;
  scheduledExecution: boolean;
}

export interface ReportData {
  datasets: Dataset[];
  metadata: ReportMetadata;
  executionTime: number;
  cacheKey?: string;
  cacheTTL?: number;
}

export interface Dataset {
  id: string;
  name: string;
  data: Record<string, any>[];
  schema: ColumnSchema[];
  totalRows: number;
  filteredRows: number;
  aggregations?: Record<string, any>;
}

export interface ReportMetadata {
  generatedAt: Date;
  jurisdiction: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters: AppliedFilter[];
  dataFreshness: Date;
  executionStats: {
    queryTime: number;
    renderTime: number;
    totalTime: number;
  };
}

export interface AppliedFilter {
  field: string;
  operator: string;
  value: any;
  displayName: string;
}

export interface ReportPermission {
  reportId: string;
  userId: string;
  role: string;
  permissions: ('view' | 'edit' | 'delete' | 'schedule' | 'share')[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface ReportAuditLog {
  id: string;
  reportId: string;
  action: 'created' | 'updated' | 'deleted' | 'executed' | 'scheduled' | 'shared';
  userId: string;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ReportAnalytics {
  reportId: string;
  period: 'day' | 'week' | 'month' | 'year';
  executions: number;
  uniqueUsers: number;
  averageExecutionTime: number;
  errorRate: number;
  popularFilters: Record<string, number>;
  exportFormats: Record<string, number>;
  peakUsageHours: number[];
}

export interface DashboardConfiguration {
  id: string;
  name: string;
  description: string;
  layout: DashboardLayout;
  reports: DashboardReport[];
  filters: GlobalFilter[];
  refreshInterval?: number;
  autoRefresh: boolean;
  isPublic: boolean;
  permissions: DashboardPermission[];
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
  responsive: boolean;
}

export interface DashboardReport {
  reportId: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  title?: string;
  showTitle: boolean;
  showFilters: boolean;
  refreshOnFilterChange: boolean;
}

export interface GlobalFilter {
  id: string;
  field: string;
  displayName: string;
  filterType: FilterConfiguration['filterType'];
  appliesTo: string[]; // Report IDs
  defaultValue?: any;
}

export interface DashboardPermission {
  userId: string;
  role: string;
  permissions: ('view' | 'edit' | 'delete' | 'share')[];
}

// Utility types
export type ReportElementType = ReportElement['type'];
export type ChartType = ChartConfiguration['chartType'];
export type FilterType = FilterConfiguration['filterType'];
export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median';
export type SortOrder = 'asc' | 'desc';
export type DataType = ColumnSchema['dataType'];
export type ReportStatus = ReportExecution['status'];
export type OutputFormat = ReportExecution['outputFormat'];

// API Response types
export interface ReportListResponse {
  reports: ReportConfiguration[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ReportExecutionResponse {
  executionId: string;
  status: ReportStatus;
  estimatedCompletionTime?: Date;
  progressPercentage?: number;
}

export interface ReportDataResponse {
  data: ReportData;
  execution: ReportExecution;
}

export interface DataSourceTestResponse {
  success: boolean;
  message: string;
  schema?: DataSourceSchema;
  sampleData?: Record<string, any>[];
}

// Hook types
export interface UseReportBuilderReturn {
  report: ReportConfiguration;
  setReport: (
    report: ReportConfiguration | ((prev: ReportConfiguration) => ReportConfiguration)
  ) => void;
  availableDataSources: DataSource[];
  availableMetrics: string[];
  availableTemplates: ReportTemplate[];
  isLoading: boolean;
  error: string | null;
  saveReport: (report: ReportConfiguration) => Promise<void>;
  scheduleReport: (report: ReportConfiguration) => Promise<void>;
  previewReport: (report: ReportConfiguration) => Promise<ReportData>;
  exportReport: (reportId: string, format: OutputFormat) => Promise<string>;
  duplicateReport: (reportId: string) => Promise<ReportConfiguration>;
  deleteReport: (reportId: string) => Promise<void>;
}
