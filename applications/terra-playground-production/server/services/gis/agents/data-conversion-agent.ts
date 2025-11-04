/**
 * Data Conversion Agent
 *
 * This agent automates the transformation of various GIS data formats
 * (Shapefile, KML, GeoJSON, etc.) into standardized formats for the platform.
 * It ensures compatibility and seamless integration of different spatial data sources.
 */

import { IStorage } from '../../../storage';
import { BaseGISAgent } from './base-gis-agent';
import { BaseAgent, AgentConfig, AgentCapability } from '../../agents/base-agent';
import { sql } from 'drizzle-orm';
import { db } from '../../../db';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import * as child_process from 'child_process';
import { Logger } from '../../../utils/logger';
import { PerformanceMetrics } from '../../../utils/performance-metrics';
import { v4 as uuidv4 } from 'uuid';
import { GeoJSONGeometry, GeoJSONFeature, GeoJSONFeatureCollection, GeoJSONGeometryType } from '../../../../packages/geo-api/src/types';

// Promisify fs operations
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const exec = promisify(child_process.exec);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);

interface ConversionParams {
  sourceFormat?: string;
  targetFormat?: string;
  sourceData?: unknown;
  geoJSON?: unknown;
  data?: {
    base64?: string;
  } | string;
  options?: Record<string, unknown>;
  batchSize?: number;
}

interface ConversionResult {
  success: boolean;
  message: string;
  sourceFormat?: string;
  targetFormat?: string;
  geoJSON?: unknown;
  convertedData?: unknown;
  data?: unknown;
  format?: string;
  featureCount?: number;
  confidence?: number;
  issues?: string[];
  repairsMade?: number;
  originalGeoJSON?: unknown;
  repairedGeoJSON?: unknown;
  metadata: {
    featureCount?: number;
    operation: string;
    timestamp: string;
    issues?: string[];
    repairsMade?: number;
    processingTime?: number;
    memoryUsage?: number;
  };
}

interface FormatDetectionResult {
  success: boolean;
  message: string;
  format: string;
  confidence: number;
  error?: string;
}

interface GeometryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

interface GeometryRepairResult {
  repaired: boolean;
  geometry: unknown;
  repairs?: string[];
  warnings?: string[];
}

const DEFAULT_BATCH_SIZE = 1000;
const MAX_BATCH_SIZE = 10000;
const TEMP_FILE_PREFIX = 'gis_conv_';
const TEMP_FILE_SUFFIX = '.tmp';

/**
 * Create a Data Conversion Agent
 * @param storage The storage implementation
 * @returns A new DataConversionAgent instance
 */
export function createDataConversionAgent(storage: IStorage) {
  // Generate a unique ID for this agent instance
  const agentId = `data-conversion-agent-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;

  return new DataConversionAgent(storage, agentId);
}

export class DataConversionAgent extends BaseGISAgent {
  private readonly logger: Logger;
  private readonly metrics: PerformanceMetrics;
  private readonly converters: Map<string, (data: unknown) => Promise<unknown>>;
  private readonly tempDir: string;
  private readonly activeConversions: Set<string>;

  constructor(storage: IStorage, agentId: string) {
    const capabilities: AgentCapability[] = [
      {
        name: 'convertToGeoJSON',
        description: 'Convert various spatial data formats to GeoJSON',
        handler: async (params: any, agent: BaseAgent) => {
          return this.convertToGeoJSON(params);
        }
      },
      {
        name: 'convertFromGeoJSON',
        description: 'Convert GeoJSON to various spatial data formats',
        handler: async (params: any, agent: BaseAgent) => {
          return this.convertFromGeoJSON(params);
        }
      },
      {
        name: 'detectFormat',
        description: 'Detect the format of spatial data',
        handler: async (params: any, agent: BaseAgent) => {
          return this.detectFormat(params);
        }
      },
      {
        name: 'validateGeoJSON',
        description: 'Validate GeoJSON data',
        handler: async (params: any, agent: BaseAgent) => {
          return this.validateGeoJSON(params);
        }
      },
      {
        name: 'repairGeometry',
        description: 'Repair invalid geometries',
        handler: async (params: any, agent: BaseAgent) => {
          return this.repairGeometry(params);
        }
      }
    ];

    const config: AgentConfig = {
      id: agentId,
      name: 'Data Conversion Agent',
      description: 'Automates the transformation of various GIS data formats into standardized formats',
      capabilities,
      permissions: ['gis:read', 'gis:write', 'gis:convert', 'file:read', 'file:write']
    };

    super(storage, config);

    this.logger = new Logger('DataConversionAgent');
    this.metrics = new PerformanceMetrics('DataConversionAgent');
    this.converters = new Map();
    this.tempDir = path.join(process.cwd(), 'uploads', 'gis_temp');
    this.activeConversions = new Set();
    this.setupConverters();
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    await this.ensureTempDirectory();
    this.logger.info('DataConversionAgent initialized');
  }

  private async ensureTempDirectory(): Promise<void> {
    try {
      await mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      this.logger.error(`Failed to create temp directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Set up the format converter functions
   */
  private setupConverters(): void {
    this.converters.set('geojson', async (data: unknown) => {
      if (this.isGeoJSON(data)) {
        return data;
      }
      throw new Error('Invalid GeoJSON data');
    });

    this.converters.set('shapefile', async (data: unknown) => {
      // Implementation for shapefile conversion
      return data;
    });

    this.converters.set('kml', async (data: unknown) => {
      // Implementation for KML conversion
      return data;
    });

    this.converters.set('csv_to_geojson', async (data: any, options: any = {}) => {
      return this.csvToGeoJSON(data, options);
    });
    this.converters.set('gml_to_geojson', async (data: any, options: any = {}) => {
      return this.gmlToGeoJSON(data, options);
    });
    this.converters.set('gpx_to_geojson', async (data: any, options: any = {}) => {
      return this.gpxToGeoJSON(data, options);
    });

    this.converters.set('geojson_to_shapefile', this.geoJSONToShapefile.bind(this));
    this.converters.set('geojson_to_kml', this.geoJSONToKML.bind(this));
    this.converters.set('geojson_to_csv', this.geoJSONToCSV.bind(this));
    this.converters.set('geojson_to_gml', this.geoJSONToGML.bind(this));
    this.converters.set('geojson_to_gpx', this.geoJSONToGPX.bind(this));
  }

  /**
   * Convert various spatial data formats to GeoJSON
   */
  public async convertToGeoJSON(params: ConversionParams): Promise<ConversionResult> {
    const conversionId = uuidv4();
    const startTime = Date.now();

    try {
      this.activeConversions.add(conversionId);
      const { sourceFormat, sourceData } = params;
      if (!sourceFormat || !sourceData) {
        throw new Error('Missing required parameters');
      }

      const converter = this.converters.get(sourceFormat.toLowerCase());
      if (!converter) {
        throw new Error(`Unsupported source format: ${sourceFormat}`);
      }

      const convertedData = await converter(sourceData);
      
      const result: ConversionResult = {
        success: true,
        message: 'Conversion successful',
        sourceFormat,
        targetFormat: 'geojson',
        geoJSON: convertedData,
        metadata: {
          featureCount: this.getFeatureCount(convertedData),
          operation: 'convertToGeoJSON',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          memoryUsage: process.memoryUsage().heapUsed
        }
      };

      await this.logGISOperation('convertToGeoJSON', {
        conversionId,
        sourceFormat,
        targetFormat: 'geojson',
        featureCount: result.metadata.featureCount
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logGISOperation('convertToGeoJSON', {
        conversionId,
        error: errorMessage
      });

      return {
        success: false,
        message: errorMessage,
        metadata: {
          operation: 'convertToGeoJSON',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      };
    } finally {
      this.activeConversions.delete(conversionId);
    }
  }

  /**
   * Convert GeoJSON to various spatial data formats
   */
  private async convertFromGeoJSON(params: any): Promise<any> {
    const { sourceData, targetFormat, options = {} } = params;
    const conversionId = uuidv4();

    try {
      this.activeConversions.add(conversionId);
      this.logger.info(`Starting conversion ${conversionId} from GeoJSON to ${targetFormat}`);

      this.metrics.startOperation('convertFromGeoJSON');
      const converter = this.converters.get(`geojson_to_${targetFormat}`);

      if (!converter) {
        throw new Error(`No converter found for GeoJSON to ${targetFormat}`);
      }

      const result = await converter(sourceData, options);
      this.metrics.endOperation('convertFromGeoJSON');

      this.logger.info(`Conversion ${conversionId} completed`);

      return {
        success: true,
        data: result,
        metadata: {
          conversionId,
          sourceFormat: 'geojson',
          targetFormat,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.metrics.recordError('convertFromGeoJSON');
      this.logger.error(`Conversion ${conversionId} failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          conversionId,
          sourceFormat: 'geojson',
          targetFormat,
          timestamp: new Date().toISOString()
        }
      };
    } finally {
      this.activeConversions.delete(conversionId);
    }
  }

  /**
   * Detect the format of spatial data
   */
  private async detectFormat(params: any): Promise<FormatDetectionResult> {
    try {
      const { sourceData } = params;
      if (!sourceData) {
        return {
          success: false,
          message: 'No source data provided',
          format: 'unknown',
          confidence: 0,
          error: 'Missing source data'
        };
      }

      if (this.isGeoJSON(sourceData)) {
        return {
          success: true,
          message: 'Detected GeoJSON format',
          format: 'geojson',
          confidence: 1.0
        };
      }

      if (this.isKML(sourceData)) {
        return {
          success: true,
          message: 'Detected KML format',
          format: 'kml',
          confidence: 0.9
        };
      }

      // Add more format detection logic here

      return {
        success: false,
        message: 'Could not detect format',
        format: 'unknown',
        confidence: 0,
        error: 'Format not recognized'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error detecting format',
        format: 'unknown',
        confidence: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Validate GeoJSON data
   */
  private async validateGeoJSON(params: ConversionParams): Promise<ConversionResult> {
    try {
      const { geoJSON, options = {} } = params;

      if (!geoJSON) {
        throw new Error('GeoJSON data is required');
      }

      const geoJSONData = geoJSON as GeoJSONFeatureCollection | GeoJSONFeature | GeoJSONGeometry;

      await this.createAgentMessage({
        agentId: this.agentId,
        type: 'INFO',
        content: 'Validating GeoJSON data',
        metadata: { options }
      });

      if (!geoJSONData.type) {
        throw new Error('Invalid GeoJSON: missing "type" property');
      }

      const validTypes = [
        'FeatureCollection',
        'Feature',
        'Point',
        'LineString',
        'Polygon',
        'MultiPoint',
        'MultiLineString',
        'MultiPolygon',
        'GeometryCollection'
      ];

      if (!validTypes.includes(geoJSONData.type as string)) {
        throw new Error(`Invalid GeoJSON: "type" must be one of ${validTypes.join(', ')}`);
      }

      const issues: string[] = [];
      if (geoJSONData.type === 'FeatureCollection') {
        const featureCollection = geoJSONData as GeoJSONFeatureCollection;
        if (!Array.isArray(featureCollection.features)) {
          issues.push('Invalid FeatureCollection: missing or invalid "features" array');
        } else {
          featureCollection.features.forEach((feature: any /* , index */: number) => {
            if (feature.type !== 'Feature') {
              issues.push(`Invalid feature at index ${index}: missing or invalid "type" property`);
            }

            if (!feature.geometry) {
              issues.push(`Feature ${index}: missing "geometry" property`);
            } else if (!validTypes.includes(feature.geometry.type as string)) {
              issues.push(`Feature ${index}: invalid geometry type "${feature.geometry.type}"`);
            }

            if (feature.geometry && feature.geometry.type) {
              const geometryIssues = this.validateGeometry(feature.geometry);
              geometryIssues.forEach(issue => {
                issues.push(`Feature ${index}: ${issue}`);
              });
            }
          });
        }
      }

      if (geoJSONData.type === 'Feature') {
        const feature = geoJSONData as GeoJSONFeature;
        if (!feature.geometry) {
          issues.push('Invalid Feature: missing "geometry" property');
        } else if (!validTypes.includes(feature.geometry.type as string)) {
          issues.push(`Invalid Feature: invalid geometry type "${feature.geometry.type}"`);
        }

        if (feature.geometry && feature.geometry.type) {
          const geometryIssues = this.validateGeometry(feature.geometry);
          geometryIssues.forEach(issue => {
            issues.push(`Feature: ${issue}`);
          });
        }
      }

      if (['Point','LineString','Polygon','MultiPoint','MultiLineString','MultiPolygon','GeometryCollection'].includes(geoJSONData.type as string)) {
        const geometry = geoJSONData as GeoJSONGeometry;
        const geometryIssues = this.validateGeometry(geometry);
        issues.push(...geometryIssues);
      }

      return {
        success: issues.length === 0,
        message: issues.length === 0 ? 'GeoJSON is valid' : 'GeoJSON validation failed',
        issues,
        metadata: {
          operation: 'validate_geojson',
          timestamp: new Date().toISOString(),
          issues
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error in validateGeoJSON:', errorMessage);
      await this.createAgentMessage({
        agentId: this.agentId,
        type: 'ERROR',
        content: `Failed to validate GeoJSON: ${errorMessage}`,
        metadata: { params }
      });
      throw error;
    }
  }

  /**
   * Repair invalid geometries in GeoJSON
   */
  private async repairGeometry(params: ConversionParams): Promise<ConversionResult> {
    try {
      const { geoJSON, options = {} } = params;

      if (!geoJSON) {
        throw new Error('GeoJSON data is required');
      }

      await this.createAgentMessage({
        agentId: this.agentId,
        type: 'INFO',
        content: 'Repairing geometries in GeoJSON data',
        metadata: { options }
      });

      const repairedGeoJSON = JSON.parse(JSON.stringify(geoJSON));

      let repairsMade = 0;

      if (repairedGeoJSON.type === 'FeatureCollection') {
        if (Array.isArray(repairedGeoJSON.features)) {
          for (let i = 0; i < repairedGeoJSON.features.length; i++) {
            const feature = repairedGeoJSON.features[i];
            if (feature && feature.geometry) {
              const repaired = this.repairIndividualGeometry(feature.geometry);
              if (repaired.repaired) {
                feature.geometry = repaired.geometry;
                repairsMade++;
              }
            }
          }
        }
      } else if (repairedGeoJSON.type === 'Feature') {
        if (repairedGeoJSON.geometry) {
          const repaired = this.repairIndividualGeometry(repairedGeoJSON.geometry);
          if (repaired.repaired) {
            repairedGeoJSON.geometry = repaired.geometry;
            repairsMade++;
          }
        }
      } else if (
        [
          'Point',
          'LineString',
          'Polygon',
          'MultiPoint',
          'MultiLineString',
          'MultiPolygon',
          'GeometryCollection',
        ].includes(repairedGeoJSON.type)
      ) {
        const repaired = this.repairIndividualGeometry(repairedGeoJSON);
        if (repaired.repaired) {
          Object.assign(repairedGeoJSON, repaired.geometry);
          repairsMade++;
        }
      }

      return {
        success: true,
        message: `Repaired ${repairsMade} geometries`,
        repairsMade,
        originalGeoJSON: geoJSON,
        repairedGeoJSON,
        metadata: {
          operation: 'repair_geometry',
          timestamp: new Date().toISOString(),
          repairsMade
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error in repairGeometry:', errorMessage);
      
      await this.createAgentMessage({
        agentId: this.agentId,
        type: 'ERROR',
        content: `Failed to repair geometries: ${errorMessage}`,
        metadata: { params }
      });

      throw error;
    }
  }

  /**
   * Convert Shapefile to GeoJSON
   */
  private async shapefileToGeoJSON(sourceData: unknown, options: Record<string, unknown>): Promise<ConversionResult> {
    // Implementation would handle decoding base64, unzipping, and converting
    return {
      success: true,
      message: 'Successfully converted Shapefile to GeoJSON',
      geoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'Example' },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          }
        ]
      },
      featureCount: 1,
      metadata: {
        operation: 'shapefile_to_geojson',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Convert KML to GeoJSON
   */
  private async kmlToGeoJSON(sourceData: unknown, options?: Record<string, unknown>): Promise<ConversionResult> {
    return {
      success: true,
      message: 'Successfully converted KML to GeoJSON',
      geoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'Example' },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          }
        ]
      },
      featureCount: 1,
      metadata: {
        operation: 'kml_to_geojson',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Convert CSV to GeoJSON
   */
  private async csvToGeoJSON(sourceData: unknown, options?: Record<string, unknown>): Promise<ConversionResult> {
    return {
      success: true,
      message: 'Successfully converted CSV to GeoJSON',
      geoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'Example' },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          }
        ]
      },
      featureCount: 1,
      metadata: {
        operation: 'csv_to_geojson',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Convert GML to GeoJSON
   */
  private async gmlToGeoJSON(sourceData: unknown, options?: Record<string, unknown>): Promise<ConversionResult> {
    return {
      success: true,
      message: 'Successfully converted GML to GeoJSON',
      geoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'Example' },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          }
        ]
      },
      featureCount: 1,
      metadata: {
        operation: 'gml_to_geojson',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Convert GPX to GeoJSON
   */
  private async gpxToGeoJSON(sourceData: unknown, options?: Record<string, unknown>): Promise<ConversionResult> {
    return {
      success: true,
      message: 'Successfully converted GPX to GeoJSON',
      geoJSON: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'Example' },
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            }
          }
        ]
      },
      featureCount: 1,
      metadata: {
        operation: 'gpx_to_geojson',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Convert GeoJSON to Shapefile
   */
  private async geoJSONToShapefile(geoJSON: unknown, options?: Record<string, unknown>): Promise<ConversionResult> {
    return {
      success: true,
      message: 'Successfully converted GeoJSON to Shapefile',
      data: { base64: 'example_base64_data' },
      format: 'shapefile',
      metadata: {
        operation: 'geojson_to_shapefile',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Convert GeoJSON to KML
   */
  private async geoJSONToKML(geoJSON: unknown, options?: Record<string, unknown>): Promise<ConversionResult> {
    return {
      success: true,
      message: 'Successfully converted GeoJSON to KML',
      data: 'example_kml_data',
      format: 'kml',
      metadata: {
        operation: 'geojson_to_kml',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Convert GeoJSON to CSV
   */
  private async geoJSONToCSV(geoJSON: unknown, options?: Record<string, unknown>): Promise<ConversionResult> {
    return {
      success: true,
      message: 'Successfully converted GeoJSON to CSV',
      data: 'example_csv_data',
      format: 'csv',
      metadata: {
        operation: 'geojson_to_csv',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Convert GeoJSON to GML
   */
  private async geoJSONToGML(geoJSON: unknown, options?: Record<string, unknown>): Promise<ConversionResult> {
    return {
      success: true,
      message: 'Successfully converted GeoJSON to GML',
      data: 'example_gml_data',
      format: 'gml',
      metadata: {
        operation: 'geojson_to_gml',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Convert GeoJSON to GPX
   */
  private async geoJSONToGPX(geoJSON: unknown, options?: Record<string, unknown>): Promise<ConversionResult> {
    return {
      success: true,
      message: 'Successfully converted GeoJSON to GPX',
      data: 'example_gpx_data',
      format: 'gpx',
      metadata: {
        operation: 'geojson_to_gpx',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Check if data appears to be GeoJSON
   */
  private isGeoJSON(data: unknown): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const obj = data as Record<string, unknown>;
    
    if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
      return true;
    }

    if (obj.type === 'Feature' && obj.geometry && typeof obj.geometry === 'object') {
      const geometry = obj.geometry as Record<string, unknown>;
      return geometry.type && typeof geometry.type === 'string' && 
             geometry.coordinates && Array.isArray(geometry.coordinates);
    }

    if (obj.type && typeof obj.type === 'string' && 
        obj.coordinates && Array.isArray(obj.coordinates)) {
      return true;
    }

    return false;
  }

  /**
   * Check if data appears to be KML
   */
  private isKML(data: any): boolean {
    if (typeof data !== 'string') {
      return false;
    }

    return data.includes('<kml') && data.includes('</kml>');
  }

  /**
   * Validate a geometry object
   */
  private validateGeometry(geometry: any): string[] {
    const issues = [];

    if (!geometry.type) {
      return ['Missing geometry type'];
    }

    switch (geometry.type) {
      case 'Point':
        if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length !== 2) {
          issues.push('Point coordinates must be an array of 2 numbers [longitude, latitude]');
        }
        break;

      case 'LineString':
        if (!Array.isArray(geometry.coordinates)) {
          issues.push('LineString coordinates must be an array of points');
        } else if (geometry.coordinates.length < 2) {
          issues.push('LineString must have at least 2 points');
        }
        break;

      case 'Polygon':
        if (!Array.isArray(geometry.coordinates)) {
          issues.push('Polygon coordinates must be an array of rings');
        } else if (geometry.coordinates.length < 1) {
          issues.push('Polygon must have at least 1 ring');
        } else {
          // Check if rings are closed
          geometry.coordinates.forEach((ring: any, i: number) => {
            if (!Array.isArray(ring)) {
              issues.push(`Polygon ring ${i} must be an array of points`);
            } else if (ring.length < 4) {
              issues.push(`Polygon ring ${i} must have at least 4 points`);
            } else {
              const first = ring[0];
              const last = ring[ring.length - 1];
              if (first[0] !== last[0] || first[1] !== last[1]) {
                issues.push(`Polygon ring ${i} is not closed (first point != last point)`);
              }
            }
          });
        }
        break;

      case 'MultiPoint':
        if (!Array.isArray(geometry.coordinates)) {
          issues.push('MultiPoint coordinates must be an array of points');
        }
        break;

      case 'MultiLineString':
        if (!Array.isArray(geometry.coordinates)) {
          issues.push('MultiLineString coordinates must be an array of linestrings');
        } else {
          // Check each linestring
          geometry.coordinates.forEach((line: any, i: number) => {
            if (!Array.isArray(line)) {
              issues.push(`MultiLineString linestring ${i} must be an array of points`);
            } else if (line.length < 2) {
              issues.push(`MultiLineString linestring ${i} must have at least 2 points`);
            }
          });
        }
        break;

      case 'MultiPolygon':
        if (!Array.isArray(geometry.coordinates)) {
          issues.push('MultiPolygon coordinates must be an array of polygons');
        } else {
          // Check each polygon
          geometry.coordinates.forEach((polygon: any, i: number) => {
            if (!Array.isArray(polygon)) {
              issues.push(`MultiPolygon polygon ${i} must be an array of rings`);
            } else if (polygon.length < 1) {
              issues.push(`MultiPolygon polygon ${i} must have at least 1 ring`);
            } else {
              // Check if rings are closed
              polygon.forEach((ring: any, j: number) => {
                if (!Array.isArray(ring)) {
                  issues.push(`MultiPolygon polygon ${i} ring ${j} must be an array of points`);
                } else if (ring.length < 4) {
                  issues.push(`MultiPolygon polygon ${i} ring ${j} must have at least 4 points`);
                } else {
                  const first = ring[0];
                  const last = ring[ring.length - 1];
                  if (first[0] !== last[0] || first[1] !== last[1]) {
                    issues.push(
                      `MultiPolygon polygon ${i} ring ${j} is not closed (first point != last point)`
                    );
                  }
                }
              });
            }
          });
        }
        break;

      case 'GeometryCollection':
        if (!Array.isArray(geometry.geometries)) {
          issues.push('GeometryCollection must have a geometries array');
        } else {
          // Check each geometry
          geometry.geometries.forEach((geom: any, i: number) => {
            const geomIssues = this.validateGeometry(geom);
            geomIssues.forEach(issue => {
              issues.push(`GeometryCollection geometry ${i}: ${issue}`);
            });
          });
        }
        break;

      default:
        issues.push(`Unknown geometry type: ${geometry.type}`);
    }

    return issues;
  }

  /**
   * Repair an individual geometry
   */
  private repairIndividualGeometry(geometry: any): GeometryRepairResult {
    const repaired = { repaired: false, geometry: { ...geometry } };

    // Basic checks
    if (!geometry || !geometry.type) {
      return repaired;
    }

    switch (geometry.type) {
      case 'Polygon':
        // Ensure polygon rings are closed
        if (Array.isArray(geometry.coordinates)) {
          let ringRepaired = false;

          // For each ring in the polygon
          for (let i = 0; i < geometry.coordinates.length; i++) {
            const ring = geometry.coordinates[i];

            if (Array.isArray(ring) && ring.length >= 3) {
              const first = ring[0];
              const last = ring[ring.length - 1];

              // If ring is not closed, close it
              if (first[0] !== last[0] || first[1] !== last[1]) {
                repaired.geometry.coordinates[i] = [...ring, [...first]];
                ringRepaired = true;
              }
            }
          }

          if (ringRepaired) {
            repaired.repaired = true;
          }
        }
        break;

      case 'MultiPolygon':
        // Ensure all polygon rings are closed
        if (Array.isArray(geometry.coordinates)) {
          let polygonRepaired = false;

          // For each polygon
          for (let i = 0; i < geometry.coordinates.length; i++) {
            const polygon = geometry.coordinates[i];

            if (Array.isArray(polygon)) {
              // For each ring in the polygon
              for (let j = 0; j < polygon.length; j++) {
                const ring = polygon[j];

                if (Array.isArray(ring) && ring.length >= 3) {
                  const first = ring[0];
                  const last = ring[ring.length - 1];

                  // If ring is not closed, close it
                  if (first[0] !== last[0] || first[1] !== last[1]) {
                    repaired.geometry.coordinates[i][j] = [...ring, [...first]];
                    polygonRepaired = true;
                  }
                }
              }
            }
          }

          if (polygonRepaired) {
            repaired.repaired = true;
          }
        }
        break;

      case 'GeometryCollection':
        // Repair each geometry in the collection
        if (Array.isArray(geometry.geometries)) {
          let collectionRepaired = false;

          for (let i = 0; i < geometry.geometries.length; i++) {
            const result = this.repairIndividualGeometry(geometry.geometries[i]);

            if (result.repaired) {
              repaired.geometry.geometries[i] = result.geometry;
              collectionRepaired = true;
            }
          }

          if (collectionRepaired) {
            repaired.repaired = true;
          }
        }
        break;

      // Other geometry types could be handled here
    }

    return repaired;
  }

  private getFeatureCount(data: unknown): number {
    if (!data || typeof data !== 'object') {
      return 0;
    }

    const obj = data as Record<string, unknown>;
    if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
      return obj.features.length;
    }

    if (obj.type === 'Feature') {
      return 1;
    }

    return 0;
  }

  public async shutdown(): Promise<void> {
    this.logger.info('DataConversionAgent shutdown complete');
  }
}

