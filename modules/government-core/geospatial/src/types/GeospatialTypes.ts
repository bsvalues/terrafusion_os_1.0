/**
 * 🌍 TERRAFUSION GEOSPATIAL TYPES
 * 
 * Comprehensive Type System for Enterprise Geospatial Operations
 * MIT PhD-Level Geospatial Architecture
 * 
 * @author MIT PhD Systems Design Engineer
 * @classification TerraFusion Government AI Operating System
 */

// =============================================================================
// CORE GEOSPATIAL INTERFACES
// =============================================================================

/**
 * Base coordinate interface supporting multiple coordinate systems
 */
export interface Coordinate {
  x: number;
  y: number;
  z?: number; // Elevation/depth
  crs: string; // Coordinate Reference System (e.g., 'EPSG:4326', 'EPSG:3857')
  accuracy?: number; // Accuracy in meters
  timestamp?: Date;
}

/**
 * Geographic bounds definition
 */
export interface GeographicBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  crs: string;
}

/**
 * Spatial geometry types following OGC standards
 */
export type GeometryType = 
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection';

/**
 * Base geometry interface
 */
export interface Geometry {
  type: GeometryType;
  coordinates: any; // Specific to geometry type
  crs?: string;
  bbox?: [number, number, number, number]; // Bounding box [minX, minY, maxX, maxY]
}

/**
 * GeoJSON Feature with enhanced metadata
 */
export interface GeoFeature {
  type: 'Feature';
  id?: string | number;
  geometry: Geometry;
  properties: Record<string, any>;
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    source: string;
    accuracy: number;
    classification: 'PUBLIC' | 'CONFIDENTIAL' | 'SECRET';
  };
}

/**
 * Feature collection with spatial indexing metadata
 */
export interface GeoFeatureCollection {
  type: 'FeatureCollection';
  features: GeoFeature[];
  metadata: {
    totalFeatures: number;
    bounds: GeographicBounds;
    spatialIndex: SpatialIndexMetadata;
    lastUpdated: Date;
  };
}

// =============================================================================
// SPATIAL ANALYSIS TYPES
// =============================================================================

/**
 * Spatial analysis operation types
 */
export type SpatialOperationType =
  | 'buffer'
  | 'intersection'
  | 'union'
  | 'difference'
  | 'contains'
  | 'within'
  | 'overlaps'
  | 'touches'
  | 'crosses'
  | 'disjoint'
  | 'distance'
  | 'area'
  | 'length'
  | 'centroid'
  | 'convexHull'
  | 'simplify'
  | 'densify';

/**
 * Spatial analysis request
 */
export interface SpatialAnalysisRequest {
  operation: SpatialOperationType;
  inputGeometries: Geometry[];
  parameters: Record<string, any>;
  outputCRS?: string;
  precision?: number;
}

/**
 * Spatial analysis result
 */
export interface SpatialAnalysisResult {
  success: boolean;
  result: Geometry | number | boolean;
  metadata: {
    executionTime: number;
    algorithm: string;
    precision: number;
    warnings?: string[];
  };
  error?: string;
}

// =============================================================================
// LAYER MANAGEMENT TYPES
// =============================================================================

/**
 * Map layer types
 */
export type LayerType =
  | 'vector'
  | 'raster'
  | 'tile'
  | 'wms'
  | 'wmts'
  | 'geojson'
  | 'shapefile'
  | 'kml'
  | 'gpx'
  | 'realtime';

/**
 * Layer rendering style
 */
export interface LayerStyle {
  fill?: {
    color: string;
    opacity: number;
  };
  stroke?: {
    color: string;
    width: number;
    opacity: number;
    dashArray?: number[];
  };
  marker?: {
    symbol: string;
    size: number;
    color: string;
    anchor: [number, number];
  };
  label?: {
    field: string;
    font: string;
    size: number;
    color: string;
    offset: [number, number];
  };
}

/**
 * Map layer definition
 */
export interface MapLayer {
  id: string;
  name: string;
  type: LayerType;
  source: string | GeoFeatureCollection;
  style: LayerStyle;
  visible: boolean;
  opacity: number;
  minZoom: number;
  maxZoom: number;
  metadata: {
    description: string;
    attribution: string;
    license: string;
    lastUpdated: Date;
    featureCount?: number;
  };
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    share: boolean;
  };
}

// =============================================================================
// SPATIAL INDEXING TYPES
// =============================================================================

/**
 * Spatial index types for performance optimization
 */
export type SpatialIndexType = 'rtree' | 'quadtree' | 'kdtree' | 'grid';

/**
 * Spatial index metadata
 */
export interface SpatialIndexMetadata {
  type: SpatialIndexType;
  depth: number;
  nodeCount: number;
  leafCount: number;
  efficiency: number; // Query performance metric (0-1)
  memoryUsage: number; // In bytes
  lastOptimized: Date;
}

/**
 * Spatial query interface
 */
export interface SpatialQuery {
  type: 'bbox' | 'contains' | 'intersects' | 'within' | 'nearby';
  geometry: Geometry;
  distance?: number; // For nearby queries
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

// =============================================================================
// PERFORMANCE AND MONITORING TYPES
// =============================================================================

/**
 * Geospatial performance metrics
 */
export interface GeospatialPerformanceMetrics {
  queryExecutionTime: number;
  indexHitRate: number;
  memoryUsage: number;
  cacheHitRate: number;
  concurrentOperations: number;
  dataTransferRate: number; // MB/s
  spatialAccuracy: number;
  renderingFPS: number;
}

/**
 * Real-time monitoring data
 */
export interface GeospatialMonitoringData {
  timestamp: Date;
  metrics: GeospatialPerformanceMetrics;
  activeQueries: number;
  loadedLayers: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  warnings: string[];
  errors: string[];
}

// =============================================================================
// GOVERNMENT SPECIFIC TYPES
// =============================================================================

/**
 * Government spatial data classification
 */
export type GovernmentDataClassification = 
  | 'UNCLASSIFIED'
  | 'CONFIDENTIAL'
  | 'SECRET'
  | 'TOP_SECRET'
  | 'FOR_OFFICIAL_USE_ONLY';

/**
 * Government geospatial requirements
 */
export interface GovernmentGeospatialConfig {
  classification: GovernmentDataClassification;
  complianceStandards: string[]; // e.g., ['FISMA', 'NIST-800-53']
  auditLogging: boolean;
  encryptionRequired: boolean;
  accessControlEnabled: boolean;
  dataRetentionPeriod: number; // In days
  backupFrequency: string; // CRON expression
}

// =============================================================================
// TERRAFUSION INTEGRATION TYPES
// =============================================================================

/**
 * TerraFusion OS integration interface
 */
export interface TerraFusionGeospatialIntegration {
  aiCommandBrainConnection: boolean;
  swarmCoordination: boolean;
  realTimeDataStreaming: boolean;
  governmentComplianceMode: boolean;
  marketplaceIntegration: boolean;
  quantumOptimization: boolean;
}

/**
 * Module status and health monitoring
 */
export interface GeospatialModuleStatus {
  status: 'initializing' | 'running' | 'warning' | 'error' | 'stopped';
  uptime: number; // In milliseconds
  version: string;
  loadedComponents: string[];
  activeConnections: number;
  lastHealthCheck: Date;
  performanceMetrics: GeospatialPerformanceMetrics;
  integrationStatus: TerraFusionGeospatialIntegration;
}
