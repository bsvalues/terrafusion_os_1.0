/**
 * TerraFusion Dashboard - TypeScript Type Definitions
 * Government. Transcended. - Championship Analytics System
 * 
 * Quantum Factor: 949 | Terra-Cyan: #00FFFF | Golden Ratio: φ=1.618
 */

// === CORE DASHBOARD TYPES ===

export interface DashboardConfig {
  id: string;
  title: string;
  description?: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  refreshInterval?: number; // milliseconds
  theme?: 'quantum' | 'government' | 'terra-cyan';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
  responsive: boolean;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
  dataSource: DataSource;
  refreshInterval?: number;
  isVisible: boolean;
}

export type WidgetType = 
  | 'metric'
  | 'chart-line'
  | 'chart-bar' 
  | 'chart-pie'
  | 'chart-area'
  | 'table'
  | 'map'
  | 'gauge'
  | 'progress'
  | 'status'
  | 'ai-insights'
  | 'system-health'
  | 'performance-monitor';

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
}

export interface WidgetConfig {
  [key: string]: any;
  colors?: string[];
  quantumOptimization?: boolean;
  governmentCompliance?: boolean;
  terraFusionTheme?: boolean;
}

// === DATA SOURCE TYPES ===

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  endpoint?: string;
  query?: string;
  parameters?: Record<string, any>;
  authentication?: AuthConfig;
  caching?: CacheConfig;
}

export type DataSourceType =
  | 'api'
  | 'database'
  | 'websocket'
  | 'mock'
  | 'terrafusion-api'
  | 'terra-pilt'
  | 'terra-playground'
  | 'terra-agent'
  | 'system-metrics';

export interface AuthConfig {
  type: 'bearer' | 'api-key' | 'basic' | 'oauth';
  credentials: Record<string, string>;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // seconds
  key?: string;
}

// === ANALYTICS & METRICS TYPES ===

export interface SystemMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: NetworkMetrics;
  activeUsers: number;
  responseTime: number;
  uptime: number;
  quantumOptimizationFactor: number;
}

export interface NetworkMetrics {
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  latency: number;
}

export interface TerraFusionModuleStats {
  moduleId: string;
  moduleName: string;
  version: string;
  status: ModuleStatus;
  metrics: {
    requestCount: number;
    errorRate: number;
    avgResponseTime: number;
    lastHeartbeat: string;
  };
  capabilities: string[];
  quantumReadiness: number;
}

export type ModuleStatus = 'active' | 'inactive' | 'error' | 'maintenance' | 'deploying';

// === GOVERNMENT SPECIFIC TYPES ===

export interface GovernmentServiceMetrics {
  serviceId: string;
  serviceName: string;
  countyId: string;
  citizenInteractions: number;
  completedTransactions: number;
  avgProcessingTime: number;
  satisfactionScore: number;
  complianceStatus: ComplianceStatus;
  fiscalImpact: FiscalImpact;
}

export interface ComplianceStatus {
  fismaLevel: 'Low' | 'Moderate' | 'High';
  nist800_53: boolean;
  pii_protection: boolean;
  audit_trail: boolean;
  lastAudit: string;
  score: number;
}

export interface FiscalImpact {
  revenueGenerated: number;
  costSavings: number;
  efficiency_gain: number;
  roi: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
}

// === FILTER & QUERY TYPES ===

export interface DashboardFilter {
  id: string;
  name: string;
  type: FilterType;
  options?: FilterOption[];
  value: any;
  isRequired: boolean;
}

export type FilterType = 
  | 'select'
  | 'multi-select'
  | 'date-range'
  | 'text'
  | 'number'
  | 'boolean'
  | 'county-selector'
  | 'module-selector';

export interface FilterOption {
  label: string;
  value: any;
  icon?: string;
}

export interface QueryParams {
  dateRange?: {
    start: string;
    end: string;
  };
  counties?: string[];
  modules?: string[];
  metrics?: string[];
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  quantumOptimization?: boolean;
}

// === CHART & VISUALIZATION TYPES ===

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  metadata?: ChartMetadata;
}

export interface ChartDataset {
  label: string;
  data: (number | null)[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartMetadata {
  title?: string;
  subtitle?: string;
  units?: string;
  quantumEnhanced?: boolean;
  governmentContext?: string;
}

// === AI & AUTOMATION TYPES ===

export interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number;
  impact: ImpactLevel;
  recommendations: string[];
  data: any;
  createdAt: string;
  expiresAt?: string;
}

export type InsightType = 
  | 'performance-optimization'
  | 'cost-reduction'
  | 'compliance-alert'
  | 'citizen-satisfaction'
  | 'predictive-maintenance'
  | 'quantum-enhancement';

export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

// === USER & PERMISSION TYPES ===

export interface DashboardUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  counties: string[];
  lastLogin: string;
  preferences: UserPreferences;
}

export type UserRole = 
  | 'citizen'
  | 'county-staff'
  | 'county-admin'
  | 'system-admin'
  | 'quantum-engineer';

export interface Permission {
  resource: string;
  actions: string[];
  scope?: string; // 'county', 'module', 'global'
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'quantum';
  defaultDashboard?: string;
  refreshRate: number;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  browser: boolean;
  mobile: boolean;
  criticalOnly: boolean;
}

// === API RESPONSE TYPES ===

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  quantumFactor?: number;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// === ERROR & STATUS TYPES ===

export interface DashboardError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  quantumCorrelationId?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  overallScore: number;
  lastCheck: string;
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastCheck: string;
  details?: Record<string, any>;
}

// === REAL-TIME & WEBSOCKET TYPES ===

export interface WebSocketMessage {
  type: MessageType;
  payload: any;
  timestamp: string;
  source: string;
  quantumSignature?: string;
}

export type MessageType = 
  | 'metric-update'
  | 'alert'
  | 'system-status'
  | 'user-action'
  | 'ai-insight'
  | 'quantum-optimization';

// === EXPORT TYPES ===

export interface ExportConfig {
  format: 'pdf' | 'xlsx' | 'csv' | 'json' | 'png';
  includeCharts: boolean;
  includeData: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  template?: string;
  governmentWatermark?: boolean;
}