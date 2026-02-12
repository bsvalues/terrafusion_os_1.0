/**
 * Geospatial Analysis Service
 * 
 * This service provides advanced geospatial analysis capabilities for the
 * Benton County Assessor's Office GIS system.
 */

import { Feature, FeatureCollection, Polygon, LineString, Point, MultiPolygon } from 'geojson';
import * as turf from '@turf/turf';

/**
 * Types of geospatial operations supported by the analysis service
 */
export enum GeospatialOperationType {
  BUFFER = 'buffer',
  INTERSECTION = 'intersection',
  UNION = 'union',
  DIFFERENCE = 'difference',
  AREA = 'area',
  CENTROID = 'centroid',
  DISTANCE = 'distance',
  MERGE = 'merge',
  SPLIT = 'split',
  SIMPLIFY = 'simplify'
}

/**
 * Types of measurement units for distance and area calculations
 */
export enum MeasurementUnit {
  METERS = 'meters',
  KILOMETERS = 'kilometers',
  FEET = 'feet',
  YARDS = 'yards',
  MILES = 'miles',
  ACRES = 'acres',
  HECTARES = 'hectares',
  SQUARE_FEET = 'square_feet',
  SQUARE_MILES = 'square_miles'
}

/**
 * Parameters for different geospatial operations
 */
export interface OperationParams {
  // Buffer operation
  bufferDistance?: number;
  bufferUnit?: MeasurementUnit;
  
  // Simplify operation
  toleranceDistance?: number;
  
  // Common parameters
  preserveProperties?: boolean;
}

/**
 * Result of a geospatial analysis operation
 */
export interface GeospatialAnalysisResult {
  type: GeospatialOperationType;
  result: Feature | FeatureCollection | number | null;
  metadata?: {
    area?: number;
    length?: number;
    distance?: number;
    unit?: MeasurementUnit;
    featureCount?: number;
    parcelsAffected?: number;
    originalArea?: number;
    computationTimeMs?: number;
  };
  error?: string;
}

/**
 * Creates a buffer around a feature
 */
export function bufferFeature(
  feature: Feature | FeatureCollection,
  distance: number,
  unit: MeasurementUnit = MeasurementUnit.FEET
): Feature {
  try {
    // Convert unit to one of Turf's supported units
    const turfUnit = convertToTurfUnit(unit);
    
    // Create buffer
    return turf.buffer(feature, distance, { units: turfUnit });
  } catch (error) {
    console.error('Error in bufferFeature:', error);
    throw new Error(`Failed to create buffer: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculates the intersection of two features
 */
export function computeIntersection(
  feature1: Feature<Polygon | MultiPolygon>,
  feature2: Feature<Polygon | MultiPolygon>
): Feature | null {
  try {
    return turf.intersect(feature1, feature2);
  } catch (error) {
    console.error('Error in computeIntersection:', error);
    throw new Error(`Failed to compute intersection: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Computes the union of multiple polygon features
 */
export function computeUnion(features: Feature<Polygon | MultiPolygon>[]): Feature<Polygon | MultiPolygon> {
  try {
    if (features.length === 0) {
      throw new Error('No features provided for union operation');
    }
    
    if (features.length === 1) {
      return features[0];
    }
    
    // Initial result is the first feature
    let result = features[0];
    
    // Union with each subsequent feature
    for (let i = 1; i < features.length; i++) {
      result = turf.union(result, features[i]);
    }
    
    return result;
  } catch (error) {
    console.error('Error in computeUnion:', error);
    throw new Error(`Failed to compute union: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Computes the difference between two polygon features (feature1 - feature2)
 */
export function computeDifference(
  feature1: Feature<Polygon | MultiPolygon>,
  feature2: Feature<Polygon | MultiPolygon>
): Feature<Polygon | MultiPolygon> {
  try {
    return turf.difference(feature1, feature2);
  } catch (error) {
    console.error('Error in computeDifference:', error);
    throw new Error(`Failed to compute difference: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculates the area of a polygon feature
 */
export function calculateArea(
  feature: Feature<Polygon | MultiPolygon>,
  unit: MeasurementUnit = MeasurementUnit.ACRES
): number {
  try {
    const area = turf.area(feature);
    
    // Convert from square meters to requested unit
    switch (unit) {
      case MeasurementUnit.ACRES:
        return area * 0.000247105; // sq meters to acres
      case MeasurementUnit.HECTARES:
        return area * 0.0001; // sq meters to hectares
      case MeasurementUnit.SQUARE_FEET:
        return area * 10.7639; // sq meters to sq feet
      case MeasurementUnit.SQUARE_MILES:
        return area * 0.000000386102; // sq meters to sq miles
      default:
        return area; // Default is square meters
    }
  } catch (error) {
    console.error('Error in calculateArea:', error);
    throw new Error(`Failed to calculate area: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Finds the centroid of a feature
 */
export function findCentroid(feature: Feature): Feature<Point> {
  try {
    return turf.centroid(feature);
  } catch (error) {
    console.error('Error in findCentroid:', error);
    throw new Error(`Failed to find centroid: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Calculates the distance between two points
 */
export function calculateDistance(
  point1: Feature<Point>,
  point2: Feature<Point>,
  unit: MeasurementUnit = MeasurementUnit.FEET
): number {
  try {
    const turfUnit = convertToTurfUnit(unit);
    return turf.distance(point1, point2, { units: turfUnit });
  } catch (error) {
    console.error('Error in calculateDistance:', error);
    throw new Error(`Failed to calculate distance: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Simplifies a polygon or line feature using the Douglas-Peucker algorithm
 */
export function simplifyFeature(
  feature: Feature<Polygon | LineString | MultiPolygon>,
  tolerance: number = 0.01
): Feature {
  try {
    return turf.simplify(feature, { tolerance });
  } catch (error) {
    console.error('Error in simplifyFeature:', error);
    throw new Error(`Failed to simplify feature: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Merges multiple parcel features into a single feature
 * (This is a more parcel-specific union operation that preserves relevant properties)
 */
export function mergeParcels(
  parcels: Feature<Polygon | MultiPolygon>[],
  newParcelId?: string
): GeospatialAnalysisResult {
  try {
    const startTime = Date.now();
    
    // Union all the parcels
    const mergedGeometry = computeUnion(parcels);
    
    // Calculate the original area
    const originalAreaTotal = parcels.reduce((sum, parcel) => {
      return sum + calculateArea(parcel);
    }, 0);
    
    // Calculate the new area
    const newArea = calculateArea(mergedGeometry);
    
    // Prepare the result with preserved properties
    const result: Feature<Polygon | MultiPolygon> = {
      ...mergedGeometry,
      properties: {
        parcelId: newParcelId || 'merged_parcel',
        originalParcels: parcels.map(p => p.properties?.parcelId || 'unknown'),
        mergedArea: newArea,
        originalArea: originalAreaTotal,
        mergedDate: new Date().toISOString(),
        ...mergedGeometry.properties
      }
    };
    
    return {
      type: GeospatialOperationType.MERGE,
      result,
      metadata: {
        area: newArea,
        unit: MeasurementUnit.ACRES,
        featureCount: 1,
        parcelsAffected: parcels.length,
        originalArea: originalAreaTotal,
        computationTimeMs: Date.now() - startTime
      }
    };
  } catch (error) {
    console.error('Error in mergeParcels:', error);
    return {
      type: GeospatialOperationType.MERGE,
      result: null,
      error: `Failed to merge parcels: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Splits a parcel feature using a line feature
 */
export function splitParcel(
  parcel: Feature<Polygon | MultiPolygon>,
  splitLine: Feature<LineString>,
  newParcelIds?: string[]
): GeospatialAnalysisResult {
  try {
    const startTime = Date.now();
    
    // Use Turf.js to split the polygon with the line
    // This operation is complex and in a real implementation would use a more robust approach
    // Here we'll use a simplified approach with turf.lineIntersect and turf.difference
    
    // First calculate the original area
    const originalArea = calculateArea(parcel);
    
    // Create a buffer around the line to perform the split
    const splitBuffer = bufferFeature(splitLine, 1, MeasurementUnit.FEET);
    
    // Split the parcel using difference operations
    const parcel1 = computeDifference(parcel, splitBuffer as Feature<Polygon | MultiPolygon>);
    
    // Ideally we would get both split parts, but for this demo we'll just create a second part
    // by subtracting the first part from the original with some buffer to avoid topology errors
    const parcel1Buffered = bufferFeature(parcel1, 0.5, MeasurementUnit.FEET);
    const parcel2 = computeDifference(parcel, parcel1Buffered as Feature<Polygon | MultiPolygon>);
    
    // Calculate the new areas
    const area1 = calculateArea(parcel1);
    const area2 = calculateArea(parcel2);
    
    // Assign new parcel IDs if provided, otherwise generate placeholder IDs
    const parcel1Id = newParcelIds && newParcelIds.length > 0 ? newParcelIds[0] : `${parcel.properties?.parcelId}_1`;
    const parcel2Id = newParcelIds && newParcelIds.length > 1 ? newParcelIds[1] : `${parcel.properties?.parcelId}_2`;
    
    // Create the result features with properties
    const resultFeatures: Feature<Polygon | MultiPolygon>[] = [
      {
        ...parcel1,
        properties: {
          ...parcel.properties,
          parcelId: parcel1Id,
          originalParcelId: parcel.properties?.parcelId,
          splitArea: area1,
          originalArea,
          splitDate: new Date().toISOString()
        }
      },
      {
        ...parcel2,
        properties: {
          ...parcel.properties,
          parcelId: parcel2Id,
          originalParcelId: parcel.properties?.parcelId,
          splitArea: area2,
          originalArea,
          splitDate: new Date().toISOString()
        }
      }
    ];
    
    const featureCollection: FeatureCollection<Polygon | MultiPolygon> = {
      type: 'FeatureCollection',
      features: resultFeatures
    };
    
    return {
      type: GeospatialOperationType.SPLIT,
      result: featureCollection,
      metadata: {
        area: area1 + area2, // Total area after split
        unit: MeasurementUnit.ACRES,
        featureCount: 2, // Number of new parcels
        parcelsAffected: 1, // Original parcel count
        originalArea,
        computationTimeMs: Date.now() - startTime
      }
    };
  } catch (error) {
    console.error('Error in splitParcel:', error);
    return {
      type: GeospatialOperationType.SPLIT,
      result: null,
      error: `Failed to split parcel: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Helper function to convert our measurement units to turf.js units
 */
function convertToTurfUnit(unit: MeasurementUnit): string {
  switch (unit) {
    case MeasurementUnit.METERS:
      return 'meters';
    case MeasurementUnit.KILOMETERS:
      return 'kilometers';
    case MeasurementUnit.FEET:
      return 'feet';
    case MeasurementUnit.YARDS:
      return 'yards';
    case MeasurementUnit.MILES:
      return 'miles';
    default:
      return 'meters'; // Default to meters if unit not supported by turf
  }
}

/**
 * Runs a geospatial analysis operation based on operation type and parameters
 */
export function runGeospatialAnalysis(
  operation: GeospatialOperationType,
  features: Feature[] | FeatureCollection,
  params: OperationParams = {}
): GeospatialAnalysisResult {
  const inputFeatures = Array.isArray(features) 
    ? features 
    : features.type === 'FeatureCollection' 
      ? features.features 
      : [features];
  
  try {
    switch (operation) {
      case GeospatialOperationType.BUFFER:
        if (inputFeatures.length === 0) {
          throw new Error('No features provided for buffer operation');
        }
        
        const bufferResult = bufferFeature(
          inputFeatures[0],
          params.bufferDistance || 100,
          params.bufferUnit || MeasurementUnit.FEET
        );
        
        return {
          type: operation,
          result: bufferResult,
          metadata: {
            unit: params.bufferUnit || MeasurementUnit.FEET,
            distance: params.bufferDistance || 100
          }
        };
      
      case GeospatialOperationType.INTERSECTION:
        if (inputFeatures.length < 2) {
          throw new Error('At least two features are required for intersection operation');
        }
        
        const intersectionResult = computeIntersection(
          inputFeatures[0] as Feature<Polygon | MultiPolygon>,
          inputFeatures[1] as Feature<Polygon | MultiPolygon>
        );
        
        return {
          type: operation,
          result: intersectionResult,
          metadata: {
            area: intersectionResult ? calculateArea(intersectionResult as Feature<Polygon | MultiPolygon>) : 0,
            unit: MeasurementUnit.ACRES
          }
        };
      
      case GeospatialOperationType.UNION:
        if (inputFeatures.length < 2) {
          throw new Error('At least two features are required for union operation');
        }
        
        const unionResult = computeUnion(
          inputFeatures as Feature<Polygon | MultiPolygon>[]
        );
        
        return {
          type: operation,
          result: unionResult,
          metadata: {
            area: calculateArea(unionResult),
            unit: MeasurementUnit.ACRES,
            featureCount: 1,
            parcelsAffected: inputFeatures.length
          }
        };
      
      case GeospatialOperationType.DIFFERENCE:
        if (inputFeatures.length < 2) {
          throw new Error('Two features are required for difference operation');
        }
        
        const differenceResult = computeDifference(
          inputFeatures[0] as Feature<Polygon | MultiPolygon>,
          inputFeatures[1] as Feature<Polygon | MultiPolygon>
        );
        
        return {
          type: operation,
          result: differenceResult,
          metadata: {
            area: calculateArea(differenceResult),
            unit: MeasurementUnit.ACRES
          }
        };
      
      case GeospatialOperationType.AREA:
        if (inputFeatures.length === 0) {
          throw new Error('No features provided for area calculation');
        }
        
        const areaResult = calculateArea(
          inputFeatures[0] as Feature<Polygon | MultiPolygon>,
          params.bufferUnit as MeasurementUnit || MeasurementUnit.ACRES
        );
        
        return {
          type: operation,
          result: areaResult,
          metadata: {
            area: areaResult,
            unit: params.bufferUnit as MeasurementUnit || MeasurementUnit.ACRES
          }
        };
      
      case GeospatialOperationType.CENTROID:
        if (inputFeatures.length === 0) {
          throw new Error('No features provided for centroid calculation');
        }
        
        const centroidResult = findCentroid(inputFeatures[0]);
        
        return {
          type: operation,
          result: centroidResult
        };
      
      case GeospatialOperationType.DISTANCE:
        if (inputFeatures.length < 2) {
          throw new Error('Two point features are required for distance calculation');
        }
        
        const distanceResult = calculateDistance(
          inputFeatures[0] as Feature<Point>,
          inputFeatures[1] as Feature<Point>,
          params.bufferUnit as MeasurementUnit || MeasurementUnit.FEET
        );
        
        return {
          type: operation,
          result: distanceResult,
          metadata: {
            distance: distanceResult,
            unit: params.bufferUnit as MeasurementUnit || MeasurementUnit.FEET
          }
        };
      
      case GeospatialOperationType.SIMPLIFY:
        if (inputFeatures.length === 0) {
          throw new Error('No features provided for simplify operation');
        }
        
        const simplifyResult = simplifyFeature(
          inputFeatures[0] as Feature<Polygon | LineString | MultiPolygon>,
          params.toleranceDistance || 0.01
        );
        
        return {
          type: operation,
          result: simplifyResult,
          metadata: {
            tolerance: params.toleranceDistance || 0.01
          }
        };
      
      case GeospatialOperationType.MERGE:
        if (inputFeatures.length < 2) {
          throw new Error('At least two features are required for merge operation');
        }
        
        return mergeParcels(inputFeatures as Feature<Polygon | MultiPolygon>[]);
      
      case GeospatialOperationType.SPLIT:
        if (inputFeatures.length < 2) {
          throw new Error('A polygon feature and a line feature are required for split operation');
        }
        
        return splitParcel(
          inputFeatures[0] as Feature<Polygon | MultiPolygon>,
          inputFeatures[1] as Feature<LineString>
        );
      
      default:
        throw new Error(`Unsupported operation type: ${operation}`);
    }
  } catch (error) {
    console.error(`Error in runGeospatialAnalysis [${operation}]:`, error);
    return {
      type: operation,
      result: null,
      error: `Failed to run ${operation} operation: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}