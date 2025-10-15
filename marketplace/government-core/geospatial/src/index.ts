/**
 * 🌍 TERRAFUSION OS - GEOSPATIAL ENGINE
 * 
 * MIT PhD-Level Geospatial Analysis & Mapping System
 * Elite Systems Engineering Implementation
 * 
 * @author MIT PhD Systems Design Engineer
 * @date September 3, 2025
 * @classification TerraFusion Government AI Operating System
 * @compliance FISMA, NIST-800-53, Enterprise Security Standards
 */

import { TerraFusionGeospatialEngine } from './core/TerraFusionGeospatialEngine';
import { SpatialAnalysisService } from './services/SpatialAnalysisService';
import { GeospatialVisualizationEngine } from './services/GeospatialVisualizationEngine';
import { GeoprocessingService } from './services/GeoprocessingService';
import { SpatialDataManagementService } from './services/SpatialDataManagementService';

// Core Types
export * from './types/GeospatialTypes';
export * from './types/SpatialOperations';
export * from './types/CoordinateSystems';
export * from './types/LayerManagement';

// Core Engine
export { TerraFusionGeospatialEngine };

// Services
export { SpatialAnalysisService };
export { GeospatialVisualizationEngine };
export { GeoprocessingService };
export { SpatialDataManagementService };

// Utilities
export * from './utils/CoordinateTransformations';
export * from './utils/SpatialQueries';
export * from './utils/GeometryOperations';

// Configuration
export * from './config/GeospatialConfig';

/**
 * 🏗️ TERRAFUSION GEOSPATIAL MODULE INITIALIZATION
 * 
 * Provides enterprise-grade geospatial capabilities for government operations:
 * - Advanced spatial analysis and modeling
 * - High-performance geospatial data processing
 * - Multi-scale mapping and visualization
 * - Real-time spatial query optimization
 * - Government-compliant coordinate system management
 * - AI-enhanced spatial pattern recognition
 */

// Default export for TerraFusion OS integration
export default TerraFusionGeospatialEngine;

// Module metadata for TerraFusion OS
export const GEOSPATIAL_MODULE_INFO = {
  name: 'geospatial',
  version: '1.0.0',
  tier: 'Tier 2 (Essential Operations)',
  category: 'geospatial',
  description: 'Enterprise-grade geospatial analysis and mapping system',
  capabilities: [
    'Advanced spatial analysis',
    'Multi-layer map visualization',
    'Real-time geoprocessing',
    'Coordinate system transformations',
    'Spatial query optimization',
    'AI-enhanced pattern recognition',
    'Government-compliant data management'
  ],
  compliance: ['FISMA', 'NIST-800-53', 'Enterprise Security'],
  integrations: ['government-edition', 'ai-command-brain', 'gispro'],
  performance: {
    maxConcurrentOperations: 10000,
    spatialQueryOptimization: 'Advanced R-tree indexing',
    memoryManagement: 'Intelligent caching with LRU eviction',
    realTimeProcessing: true
  }
} as const;
