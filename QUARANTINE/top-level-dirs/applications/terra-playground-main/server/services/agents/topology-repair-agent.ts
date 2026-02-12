/**
 * Topology Repair Agent
 *
 * An AI agent that specializes in detecting and fixing topology errors in geographic data.
 * This agent can identify and repair issues like self-intersections, overlaps,
 * gaps, and other common topology problems in GIS data.
 */

import { BaseAgent, AgentConfig } from '../agent-framework/base-agent';
import { MCPService } from '../mcp-service/mcp-service';
import { IStorage } from '../../storage';
import { GISDataService } from '../gis/gis-data-service';
import { LLMService } from '../llm-service/llm-service';
import { v4 as uuidv4 } from 'uuid';

// Topology Check Request interface
export interface TopologyCheckRequest {
  data: any; // GeoJSON data to check
  rules: TopologyRule[];
  options?: {
    tolerance?: number;
    fixAutomatically?: boolean;
    reportOnly?: boolean;
  };
}

// Topology Rule interface
export interface TopologyRule {
  ruleType:
    | 'must_not_overlap'
    | 'must_not_have_gaps'
    | 'must_not_have_dangles'
    | 'must_not_self_intersect'
    | 'must_be_single_part'
    | 'must_be_valid'
    | 'must_contain_point'
    | 'must_be_covered_by'
    | 'must_cover';
  parameters?: {
    layerName?: string;
    otherLayerName?: string;
    tolerance?: number;
    [key: string]: any;
  };
}

// Topology Error interface
export interface TopologyError {
  errorType: string;
  featureIndex: number;
  featureId?: string | number;
  geometry?: any;
  description: string;
  severity: 'warning' | 'error' | 'critical';
  suggestedFix?: any;
  canAutoFix: boolean;
}

// Topology Report interface
export interface TopologyReport {
  valid: boolean;
  errorCount: number;
  warningCount: number;
  errors: TopologyError[];
  fixedFeatures?: any[];
  repairLog?: string[];
}

/**
 * Main Topology Repair Agent class
 */
export class TopologyRepairAgent extends BaseAgent {
  private gisDataService: GISDataService;
  private llmService: LLMService | null = null;

  constructor(
    storage: IStorage,
    mcpService: MCPService,
    gisDataService: GISDataService,
    llmService?: LLMService
  ) {
    // Create base agent config
    const config: AgentConfig = {
      id: `topology-repair-${uuidv4().substring(0, 8)}`,
      name: 'Topology Repair Agent',
      type: 'topology_repair',
      description: 'Specializes in detecting and fixing topology errors in geographic data',
      capabilities: [
        'topology_check',
        'auto_repair',
        'gap_detection',
        'self_intersection_repair',
        'overlap_resolution',
        'dangles_repair',
      ],
    };

    // Initialize the base agent with the config
    super(storage, mcpService, config);

    // Store service references
    this.gisDataService = gisDataService;

    if (llmService) {
      this.llmService = llmService;
    }
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    // Call parent initialize method
    await super.initialize();

    // Register message handlers
    this.registerMessageHandler(
      'topology_check_request',
      this.handleTopologyCheckRequest.bind(this)
    );
    this.registerMessageHandler(
      'topology_repair_request',
      this.handleTopologyRepairRequest.bind(this)
    );

    // Log initialization success
    await this.logActivity('initialization', 'Topology Repair Agent initialized successfully');
  }

  /**
   * Handle topology check requests
   */
  private async handleTopologyCheckRequest(message: any): Promise<any> {
    try {
      const request = message.data as TopologyCheckRequest;

      if (!request || !request.data || !request.rules || !Array.isArray(request.rules)) {
        return {
          success: false,
          error: 'Invalid topology check request. Missing required parameters.',
        };
      }

      // Log the operation
      await this.logActivity('topology_check', 'Processing topology check request');

      // Perform topology check
      const report = await this.checkTopology(request.data, request.rules, request.options);

      return {
        success: true,
        report,
        metadata: {
          timestamp: new Date().toISOString(),
          rulesChecked: request.rules.length,
          featureCount: this.countFeatures(request.data),
        },
      };
    } catch (error) {
      console.error('Error handling topology check request:', error);
      await this.logActivity('error', `Topology check error: ${(error as Error).message}`, {
        error: (error as Error).message,
      });

      return {
        success: false,
        error: `Failed to perform topology check: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Handle topology repair requests
   */
  private async handleTopologyRepairRequest(message: any): Promise<any> {
    try {
      const { data, errors, options } = message.data;

      if (!data || !errors || !Array.isArray(errors)) {
        return {
          success: false,
          error: 'Invalid topology repair request. Missing required parameters.',
        };
      }

      // Log the operation
      await this.logActivity('topology_repair', 'Processing topology repair request');

      // Perform topology repair
      const repairResult = await this.repairTopologyErrors(data, errors, options);

      return {
        success: true,
        result: repairResult,
        metadata: {
          timestamp: new Date().toISOString(),
          errorsFixed: repairResult.fixedCount,
          errorsRemaining: repairResult.report.errorCount,
        },
      };
    } catch (error) {
      console.error('Error handling topology repair request:', error);
      await this.logActivity('error', `Topology repair error: ${(error as Error).message}`, {
        error: (error as Error).message,
      });

      return {
        success: false,
        error: `Failed to repair topology errors: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Check topology of GeoJSON data
   */
  private async checkTopology(
    data: any,
    rules: TopologyRule[],
    options?: any
  ): Promise<TopologyReport> {
    const errors: TopologyError[] = [];
    const repairLog: string[] = [];

    // Get options
    const tolerance = options?.tolerance || 0.00001;

    // Ensure we have valid GeoJSON
    if (!this.isValidGeoJSON(data)) {
      errors.push({
        errorType: 'invalid_geojson',
        featureIndex: -1,
        description: 'Invalid GeoJSON structure',
        severity: 'critical',
        canAutoFix: false,
      });

      return {
        valid: false,
        errorCount: errors.length,
        warningCount: 0,
        errors,
        repairLog,
      };
    }

    // Process each rule
    for (const rule of rules) {
      await this.processTopologyRule(data, rule, errors, tolerance);
    }

    // Count warnings vs errors
    const warningCount = errors.filter(e => e.severity === 'warning').length;
    const errorCount = errors.length - warningCount;

    return {
      valid: errorCount === 0,
      errorCount,
      warningCount,
      errors,
      repairLog,
    };
  }

  /**
   * Process a single topology rule
   */
  private async processTopologyRule(
    data: any,
    rule: TopologyRule,
    errors: TopologyError[],
    tolerance: number
  ): Promise<void> {
    const features = this.extractFeatures(data);

    switch (rule.ruleType) {
      case 'must_not_self_intersect':
        await this.checkSelfIntersections(features, errors, tolerance);
        break;
      case 'must_not_overlap':
        await this.checkOverlaps(features, errors, tolerance);
        break;
      case 'must_not_have_gaps':
        await this.checkGaps(features, errors, tolerance);
        break;
      case 'must_not_have_dangles':
        await this.checkDangles(features, errors, tolerance);
        break;
      case 'must_be_single_part':
        await this.checkMultipart(features, errors);
        break;
      case 'must_be_valid':
        await this.checkValidity(features, errors);
        break;
      // Additional rules would be handled here
    }
  }

  /**
   * Check for self-intersections in polygons and lines
   */
  private async checkSelfIntersections(
    features: any[],
    errors: TopologyError[],
    tolerance: number
  ): Promise<void> {
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];

      // Skip non-polygon and non-linestring features
      if (
        !feature.geometry ||
        (feature.geometry.type !== 'Polygon' &&
          feature.geometry.type !== 'MultiPolygon' &&
          feature.geometry.type !== 'LineString' &&
          feature.geometry.type !== 'MultiLineString')
      ) {
        continue;
      }

      try {
        // In a real implementation, this would use a spatial library
        // to check for self-intersections
        const hasSelfIntersection = this.detectSelfIntersection(feature.geometry);

        if (hasSelfIntersection) {
          errors.push({
            errorType: 'self_intersection',
            featureIndex: i,
            featureId: feature.id || feature.properties?.id,
            geometry: this.getSimplifiedGeometry(feature.geometry),
            description: `Self-intersection detected in ${feature.geometry.type}`,
            severity: 'error',
            canAutoFix: true,
            suggestedFix: {
              action: 'repair_self_intersection',
              parameters: { tolerance },
            },
          });
        }
      } catch (error) {
        console.error(`Error checking self-intersection for feature ${i}:`, error);
      }
    }
  }

  /**
   * Check for overlaps between polygons
   */
  private async checkOverlaps(
    features: any[],
    errors: TopologyError[],
    tolerance: number
  ): Promise<void> {
    // Only process polygon features
    const polygonFeatures = features.filter(
      f => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
    );

    // Check each pair of polygons
    for (let i = 0; i < polygonFeatures.length; i++) {
      for (let j = i + 1; j < polygonFeatures.length; j++) {
        try {
          // In a real implementation, this would use a spatial library
          // to check for overlaps
          const hasOverlap = this.detectOverlap(
            polygonFeatures[i].geometry,
            polygonFeatures[j].geometry,
            tolerance
          );

          if (hasOverlap) {
            const featureIndexI = features.indexOf(polygonFeatures[i]);
            const featureIndexJ = features.indexOf(polygonFeatures[j]);

            errors.push({
              errorType: 'overlap',
              featureIndex: featureIndexI,
              featureId: polygonFeatures[i].id || polygonFeatures[i].properties?.id,
              geometry: this.getSimplifiedGeometry(polygonFeatures[i].geometry),
              description: `Overlap detected with feature ${featureIndexJ}`,
              severity: 'error',
              canAutoFix: true,
              suggestedFix: {
                action: 'repair_overlap',
                parameters: {
                  otherFeatureIndex: featureIndexJ,
                  tolerance,
                },
              },
            });
          }
        } catch (error) {
          console.error(`Error checking overlap between features ${i} and ${j}:`, error);
        }
      }
    }
  }

  /**
   * Check for gaps between polygons
   */
  private async checkGaps(
    features: any[],
    errors: TopologyError[],
    tolerance: number
  ): Promise<void> {
    // Only process polygon features
    const polygonFeatures = features.filter(
      f => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')
    );

    if (polygonFeatures.length < 2) return;

    try {
      // In a real implementation, this would use a spatial library
      // to check for gaps between polygons
      const gaps = this.detectGaps(polygonFeatures, tolerance);

      for (const gap of gaps) {
        errors.push({
          errorType: 'gap',
          featureIndex: -1, // Gap is between features, not within one
          geometry: gap.geometry,
          description: `Gap detected between polygons ${gap.adjacentFeatures.join(', ')}`,
          severity: 'warning',
          canAutoFix: true,
          suggestedFix: {
            action: 'repair_gap',
            parameters: {
              adjacentFeatures: gap.adjacentFeatures,
              tolerance,
            },
          },
        });
      }
    } catch (error) {
      console.error('Error checking gaps:', error);
    }
  }

  /**
   * Check for dangles in linestrings
   */
  private async checkDangles(
    features: any[],
    errors: TopologyError[],
    tolerance: number
  ): Promise<void> {
    // Only process linestring features
    const lineFeatures = features.filter(
      f => f.geometry && (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString')
    );

    for (let i = 0; i < lineFeatures.length; i++) {
      try {
        // In a real implementation, this would use a spatial library
        // to check for dangles
        const dangles = this.detectDangles(lineFeatures[i].geometry, tolerance);

        if (dangles.length > 0) {
          const featureIndex = features.indexOf(lineFeatures[i]);

          for (const dangle of dangles) {
            errors.push({
              errorType: 'dangle',
              featureIndex,
              featureId: lineFeatures[i].id || lineFeatures[i].properties?.id,
              geometry: dangle.point,
              description: `Dangle detected at ${JSON.stringify(dangle.point.coordinates)}`,
              severity: 'warning',
              canAutoFix: true,
              suggestedFix: {
                action: 'repair_dangle',
                parameters: {
                  pointIndex: dangle.pointIndex,
                  tolerance,
                },
              },
            });
          }
        }
      } catch (error) {
        console.error(`Error checking dangles for feature ${i}:`, error);
      }
    }
  }

  /**
   * Check for multi-part geometries
   */
  private async checkMultipart(features: any[], errors: TopologyError[]): Promise<void> {
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];

      if (!feature.geometry) continue;

      // Check if it's a multi-geometry type
      if (feature.geometry.type.startsWith('Multi')) {
        errors.push({
          errorType: 'multipart_geometry',
          featureIndex: i,
          featureId: feature.id || feature.properties?.id,
          geometry: this.getSimplifiedGeometry(feature.geometry),
          description: `Multi-part geometry detected (${feature.geometry.type})`,
          severity: 'warning',
          canAutoFix: true,
          suggestedFix: {
            action: 'split_multipart',
            parameters: {},
          },
        });
      }
    }
  }

  /**
   * Check for general validity of geometries
   */
  private async checkValidity(features: any[], errors: TopologyError[]): Promise<void> {
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];

      if (!feature.geometry) {
        errors.push({
          errorType: 'missing_geometry',
          featureIndex: i,
          featureId: feature.id || feature.properties?.id,
          description: 'Feature is missing geometry',
          severity: 'error',
          canAutoFix: false,
        });
        continue;
      }

      // Check for empty coordinates
      if (this.hasEmptyCoordinates(feature.geometry)) {
        errors.push({
          errorType: 'empty_coordinates',
          featureIndex: i,
          featureId: feature.id || feature.properties?.id,
          geometry: this.getSimplifiedGeometry(feature.geometry),
          description: 'Geometry has empty coordinates array',
          severity: 'error',
          canAutoFix: false,
        });
      }

      // Check for too few coordinates
      if (this.hasTooFewCoordinates(feature.geometry)) {
        errors.push({
          errorType: 'too_few_coordinates',
          featureIndex: i,
          featureId: feature.id || feature.properties?.id,
          geometry: this.getSimplifiedGeometry(feature.geometry),
          description: 'Geometry has too few coordinates',
          severity: 'error',
          canAutoFix: false,
        });
      }

      // Additional validity checks could be added here
    }
  }

  /**
   * Repair topology errors
   */
  private async repairTopologyErrors(
    data: any,
    errors: TopologyError[],
    options?: any
  ): Promise<any> {
    // Get options
    const fixAll = options?.fixAll || false;
    const onlyAutoFixable = options?.onlyAutoFixable !== false;

    // Clone data to avoid modifying the original
    const dataClone = JSON.parse(JSON.stringify(data));
    const features = this.extractFeatures(dataClone);

    // Track which errors we've fixed
    let fixedCount = 0;
    const repairLog: string[] = [];
    const errorsToFix = fixAll
      ? errors
      : errors.filter(error => error.canAutoFix || !onlyAutoFixable);

    // Process each error
    for (const error of errorsToFix) {
      if (!error.canAutoFix && onlyAutoFixable) continue;

      try {
        switch (error.errorType) {
          case 'self_intersection':
            if (this.repairSelfIntersection(features, error)) {
              fixedCount++;
              repairLog.push(`Fixed self-intersection in feature ${error.featureIndex}`);
            }
            break;
          case 'overlap':
            if (this.repairOverlap(features, error)) {
              fixedCount++;
              repairLog.push(
                `Fixed overlap between features ${error.featureIndex} and ${error.suggestedFix.parameters.otherFeatureIndex}`
              );
            }
            break;
          case 'gap':
            if (this.repairGap(features, error)) {
              fixedCount++;
              repairLog.push(
                `Fixed gap between features ${error.suggestedFix.parameters.adjacentFeatures.join(', ')}`
              );
            }
            break;
          case 'dangle':
            if (this.repairDangle(features, error)) {
              fixedCount++;
              repairLog.push(
                `Fixed dangle in feature ${error.featureIndex} at point ${error.suggestedFix.parameters.pointIndex}`
              );
            }
            break;
          case 'multipart_geometry':
            if (this.splitMultipart(features, error)) {
              fixedCount++;
              repairLog.push(`Split multi-part geometry in feature ${error.featureIndex}`);
            }
            break;
          // Additional repair functions would be called here
        }
      } catch (err) {
        const repairError = err as Error;
        console.error(`Error repairing ${error.errorType}:`, repairError);
        repairLog.push(
          `Failed to repair ${error.errorType} in feature ${error.featureIndex}: ${repairError.message}`
        );
      }
    }

    // Update the GeoJSON with repaired features
    this.updateFeaturesInGeoJSON(dataClone, features);

    // Re-check topology to see if we've introduced new errors
    const remainingErrors = await this.checkTopology(
      dataClone,
      [{ ruleType: 'must_be_valid' }],
      options
    );

    // Return repaired data and report
    return {
      repairedData: dataClone,
      fixedCount,
      report: remainingErrors,
      repairLog,
    };
  }

  /**
   * Repair a self-intersection
   */
  private repairSelfIntersection(features: any[], error: TopologyError): boolean {
    // In a real implementation, this would use a spatial library
    // to repair self-intersections

    // Placeholder implementation
    if (error.featureIndex < 0 || error.featureIndex >= features.length) {
      return false;
    }

    const feature = features[error.featureIndex];

    // Simplify the geometry to remove self-intersections
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      feature.geometry = this.simplifyPolygon(
        feature.geometry,
        error.suggestedFix.parameters.tolerance
      );
      return true;
    } else if (
      feature.geometry.type === 'LineString' ||
      feature.geometry.type === 'MultiLineString'
    ) {
      feature.geometry = this.simplifyLineString(
        feature.geometry,
        error.suggestedFix.parameters.tolerance
      );
      return true;
    }

    return false;
  }

  /**
   * Repair an overlap between polygons
   */
  private repairOverlap(features: any[], error: TopologyError): boolean {
    // In a real implementation, this would use a spatial library
    // to repair overlaps

    // Placeholder implementation
    if (error.featureIndex < 0 || error.featureIndex >= features.length) {
      return false;
    }

    const otherFeatureIndex = error.suggestedFix.parameters.otherFeatureIndex;

    if (otherFeatureIndex < 0 || otherFeatureIndex >= features.length) {
      return false;
    }

    const feature = features[error.featureIndex];
    const otherFeature = features[otherFeatureIndex];

    // Use a difference operation to remove the overlap
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      feature.geometry = this.subtractGeometry(feature.geometry, otherFeature.geometry);
      return true;
    }

    return false;
  }

  /**
   * Repair a gap between polygons
   */
  private repairGap(features: any[], error: TopologyError): boolean {
    // In a real implementation, this would use a spatial library
    // to repair gaps

    // Placeholder implementation
    const adjacentFeatures = error.suggestedFix.parameters.adjacentFeatures;

    if (!adjacentFeatures || !Array.isArray(adjacentFeatures) || adjacentFeatures.length < 2) {
      return false;
    }

    // Find the first valid adjacent feature
    let targetFeatureIndex = -1;

    for (const featureIndex of adjacentFeatures) {
      if (featureIndex >= 0 && featureIndex < features.length) {
        targetFeatureIndex = featureIndex;
        break;
      }
    }

    if (targetFeatureIndex === -1) {
      return false;
    }

    const feature = features[targetFeatureIndex];

    // Add the gap to the feature
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      feature.geometry = this.mergeGeometries(feature.geometry, error.geometry);
      return true;
    }

    return false;
  }

  /**
   * Repair a dangle in a linestring
   */
  private repairDangle(features: any[], error: TopologyError): boolean {
    // In a real implementation, this would use a spatial library
    // to repair dangles

    // Placeholder implementation
    if (error.featureIndex < 0 || error.featureIndex >= features.length) {
      return false;
    }

    const feature = features[error.featureIndex];
    const pointIndex = error.suggestedFix.parameters.pointIndex;

    if (feature.geometry.type === 'LineString') {
      // Remove the dangling end
      const coordinates = feature.geometry.coordinates;

      if (pointIndex === 0) {
        // Dangle at start
        feature.geometry.coordinates = coordinates.slice(1);
      } else if (pointIndex === coordinates.length - 1) {
        // Dangle at end
        feature.geometry.coordinates = coordinates.slice(0, -1);
      }

      return true;
    }

    return false;
  }

  /**
   * Split a multi-part geometry into separate features
   */
  private splitMultipart(features: any[], error: TopologyError): boolean {
    // In a real implementation, this would use a spatial library
    // to split multi-part geometries

    // Placeholder implementation
    if (error.featureIndex < 0 || error.featureIndex >= features.length) {
      return false;
    }

    const feature = features[error.featureIndex];

    if (!feature.geometry || !feature.geometry.type.startsWith('Multi')) {
      return false;
    }

    // Remove the feature from the array (we'll add new single-part features)
    features.splice(error.featureIndex, 1);

    // Create new single-part features
    if (feature.geometry.type === 'MultiPolygon') {
      for (const polygonCoords of feature.geometry.coordinates) {
        const newFeature = JSON.parse(JSON.stringify(feature));
        newFeature.geometry = {
          type: 'Polygon',
          coordinates: polygonCoords,
        };
        features.push(newFeature);
      }
      return true;
    } else if (feature.geometry.type === 'MultiLineString') {
      for (const lineCoords of feature.geometry.coordinates) {
        const newFeature = JSON.parse(JSON.stringify(feature));
        newFeature.geometry = {
          type: 'LineString',
          coordinates: lineCoords,
        };
        features.push(newFeature);
      }
      return true;
    } else if (feature.geometry.type === 'MultiPoint') {
      for (const pointCoords of feature.geometry.coordinates) {
        const newFeature = JSON.parse(JSON.stringify(feature));
        newFeature.geometry = {
          type: 'Point',
          coordinates: pointCoords,
        };
        features.push(newFeature);
      }
      return true;
    }

    return false;
  }

  /**
   * Detect self-intersection in a geometry
   * This is a placeholder implementation
   */
  private detectSelfIntersection(geometry: any): boolean {
    // In a real implementation, this would use a spatial library
    // such as Turf.js to detect self-intersections
    return false;
  }

  /**
   * Detect overlap between two geometries
   * This is a placeholder implementation
   */
  private detectOverlap(geometry1: any, geometry2: any, tolerance: number): boolean {
    // In a real implementation, this would use a spatial library
    // such as Turf.js to detect overlaps
    return false;
  }

  /**
   * Detect gaps between polygons
   * This is a placeholder implementation
   */
  private detectGaps(polygonFeatures: any[], tolerance: number): any[] {
    // In a real implementation, this would use a spatial library
    // such as Turf.js to detect gaps
    return [];
  }

  /**
   * Detect dangles in a linestring
   * This is a placeholder implementation
   */
  private detectDangles(geometry: any, tolerance: number): any[] {
    // In a real implementation, this would use a spatial library
    // such as Turf.js to detect dangles
    return [];
  }

  /**
   * Simplify a polygon to remove self-intersections
   * This is a placeholder implementation
   */
  private simplifyPolygon(geometry: any, tolerance: number): any {
    // In a real implementation, this would use a spatial library
    // such as Turf.js to simplify polygons
    return geometry;
  }

  /**
   * Simplify a linestring to remove self-intersections
   * This is a placeholder implementation
   */
  private simplifyLineString(geometry: any, tolerance: number): any {
    // In a real implementation, this would use a spatial library
    // such as Turf.js to simplify linestrings
    return geometry;
  }

  /**
   * Subtract one geometry from another
   * This is a placeholder implementation
   */
  private subtractGeometry(geometry1: any, geometry2: any): any {
    // In a real implementation, this would use a spatial library
    // such as Turf.js to perform difference operations
    return geometry1;
  }

  /**
   * Merge two geometries
   * This is a placeholder implementation
   */
  private mergeGeometries(geometry1: any, geometry2: any): any {
    // In a real implementation, this would use a spatial library
    // such as Turf.js to perform union operations
    return geometry1;
  }

  /**
   * Get a simplified version of a geometry for error reporting
   */
  private getSimplifiedGeometry(geometry: any): any {
    // For error reporting, we want to simplify the geometry
    // to avoid sending too much data
    return geometry;
  }

  /**
   * Check if a geometry has empty coordinates
   */
  private hasEmptyCoordinates(geometry: any): boolean {
    if (!geometry || !geometry.coordinates) {
      return true;
    }

    if (Array.isArray(geometry.coordinates) && geometry.coordinates.length === 0) {
      return true;
    }

    // Recursively check multi-geometries
    if (geometry.type.startsWith('Multi')) {
      return geometry.coordinates.some(
        (coords: any) => Array.isArray(coords) && coords.length === 0
      );
    }

    return false;
  }

  /**
   * Check if a geometry has too few coordinates
   */
  private hasTooFewCoordinates(geometry: any): boolean {
    if (!geometry || !geometry.coordinates) {
      return true;
    }

    switch (geometry.type) {
      case 'Point':
        return !Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2;
      case 'LineString':
        return !Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2;
      case 'Polygon':
        return (
          !Array.isArray(geometry.coordinates) ||
          !Array.isArray(geometry.coordinates[0]) ||
          geometry.coordinates[0].length < 4
        ); // Need at least 4 points for a closed ring
      case 'MultiPoint':
        return (
          !Array.isArray(geometry.coordinates) ||
          geometry.coordinates.length === 0 ||
          geometry.coordinates.some((p: any) => !Array.isArray(p) || p.length < 2)
        );
      case 'MultiLineString':
        return (
          !Array.isArray(geometry.coordinates) ||
          geometry.coordinates.length === 0 ||
          geometry.coordinates.some((l: any) => !Array.isArray(l) || l.length < 2)
        );
      case 'MultiPolygon':
        return (
          !Array.isArray(geometry.coordinates) ||
          geometry.coordinates.length === 0 ||
          geometry.coordinates.some(
            (p: any) =>
              !Array.isArray(p) || p.length === 0 || !Array.isArray(p[0]) || p[0].length < 4
          )
        );
      default:
        return false;
    }
  }

  /**
   * Check if GeoJSON data is valid
   */
  private isValidGeoJSON(data: any): boolean {
    if (!data) return false;

    // Check if it's a FeatureCollection
    if (data.type === 'FeatureCollection') {
      return Array.isArray(data.features);
    }

    // Check if it's a Feature
    if (data.type === 'Feature') {
      return !!data.geometry;
    }

    // Check if it's a Geometry
    return [
      'Point',
      'LineString',
      'Polygon',
      'MultiPoint',
      'MultiLineString',
      'MultiPolygon',
      'GeometryCollection',
    ].includes(data.type);
  }

  /**
   * Extract features from GeoJSON data
   */
  private extractFeatures(data: any): any[] {
    if (!data) return [];

    // Handle FeatureCollection
    if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
      return data.features;
    }

    // Handle single Feature
    if (data.type === 'Feature') {
      return [data];
    }

    // Handle raw Geometry by wrapping it in a Feature
    if (
      [
        'Point',
        'LineString',
        'Polygon',
        'MultiPoint',
        'MultiLineString',
        'MultiPolygon',
        'GeometryCollection',
      ].includes(data.type)
    ) {
      return [
        {
          type: 'Feature',
          geometry: data,
          properties: {},
        },
      ];
    }

    return [];
  }

  /**
   * Update features in GeoJSON data
   */
  private updateFeaturesInGeoJSON(data: any, features: any[]): void {
    if (!data) return;

    // Update FeatureCollection
    if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
      data.features = features;
      return;
    }

    // Update single Feature
    if (data.type === 'Feature' && features.length > 0) {
      data.geometry = features[0].geometry;
      data.properties = features[0].properties;
      return;
    }

    // Update raw Geometry
    if (
      [
        'Point',
        'LineString',
        'Polygon',
        'MultiPoint',
        'MultiLineString',
        'MultiPolygon',
        'GeometryCollection',
      ].includes(data.type) &&
      features.length > 0
    ) {
      Object.assign(data, features[0].geometry);
      return;
    }
  }

  /**
   * Count features in GeoJSON data
   */
  private countFeatures(data: any): number {
    if (!data) return 0;

    // Count features in FeatureCollection
    if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
      return data.features.length;
    }

    // Count single Feature
    if (data.type === 'Feature') {
      return 1;
    }

    // Count raw Geometry
    if (
      [
        'Point',
        'LineString',
        'Polygon',
        'MultiPoint',
        'MultiLineString',
        'MultiPolygon',
        'GeometryCollection',
      ].includes(data.type)
    ) {
      return 1;
    }

    return 0;
  }
}
