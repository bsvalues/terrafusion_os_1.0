/**
 * Spatial Operations Service
 *
 * Provides client-side spatial analysis capabilities and server delegation
 * for more complex operations. Uses Turf.js for lightweight operations
 * and API calls for heavier processing.
 */

import * as turf from '@turf/turf';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

/**
 * Interface for spatial operation options
 */
export interface SpatialOperationOptions {
  units?: 'meters' | 'kilometers' | 'feet' | 'miles' | 'degrees';
  steps?: number;
  mutate?: boolean; // Whether to mutate the input (false = create a copy)
  properties?: Record<string, any>; // Properties to add to the result
}

/**
 * Interface for clustering options
 */
export interface ClusterOptions {
  distance: number;
  units?: 'meters' | 'kilometers' | 'feet' | 'miles' | 'degrees';
  minPoints?: number;
  maxPoints?: number;
  method?: 'dbscan' | 'kmeans';
}

/**
 * Interface for spatial query options
 */
export interface SpatialQueryOptions {
  relation: 'within' | 'contains' | 'intersects' | 'disjoint';
  buffer?: number;
  bufferUnits?: 'meters' | 'kilometers' | 'feet' | 'miles' | 'degrees';
}

/**
 * Client-side spatial operations using Turf.js
 */

/**
 * Calculate the buffer around a geometry
 */
export function bufferGeometry(
  geometry: GeoJSON.Geometry | GeoJSON.Feature,
  distance: number,
  options: SpatialOperationOptions = {}
): GeoJSON.Feature {
  return turf.buffer(geometry, distance, {
    units: options.units || 'kilometers',
    steps: options.steps || 64,
  });
}

/**
 * Calculate the centroid of a geometry
 */
export function centroid(
  geometry: GeoJSON.Geometry | GeoJSON.Feature,
  options: SpatialOperationOptions = {}
): GeoJSON.Feature {
  return turf.centroid(geometry, {
    properties: options.properties,
  });
}

/**
 * Calculate the area of a polygon
 */
export function area(geometry: GeoJSON.Geometry | GeoJSON.Feature): number {
  return turf.area(geometry);
}

/**
 * Calculate the length of a linestring
 */
export function length(
  geometry: GeoJSON.Geometry | GeoJSON.Feature,
  options: SpatialOperationOptions = {}
): number {
  return turf.length(geometry, {
    units: options.units || 'kilometers',
  });
}

/**
 * Simplify a geometry
 */
export function simplify(
  geometry: GeoJSON.Geometry | GeoJSON.Feature,
  tolerance: number,
  options: SpatialOperationOptions = {}
): GeoJSON.Feature {
  return turf.simplify(geometry, {
    tolerance,
    highQuality: true,
    mutate: options.mutate || false,
  });
}

/**
 * Calculate the intersection of two geometries
 */
export function intersection(
  geomA: GeoJSON.Geometry | GeoJSON.Feature,
  geomB: GeoJSON.Geometry | GeoJSON.Feature
): GeoJSON.Feature | null {
  return turf.intersect(geomA, geomB);
}

/**
 * Calculate the union of two geometries
 */
export function union(
  geomA: GeoJSON.Geometry | GeoJSON.Feature,
  geomB: GeoJSON.Geometry | GeoJSON.Feature
): GeoJSON.Feature {
  return turf.union(geomA, geomB);
}

/**
 * Calculate the convex hull of a geometry
 */
export function convexHull(
  geometry: GeoJSON.Geometry | GeoJSON.Feature,
  options: SpatialOperationOptions = {}
): GeoJSON.Feature {
  return turf.convex(geometry, {
    concavity: 1,
    properties: options.properties,
  });
}

/**
 * Calculate the bounding box of a geometry
 */
export function boundingBox(geometry: GeoJSON.Geometry | GeoJSON.Feature): GeoJSON.BBox {
  return turf.bbox(geometry);
}

/**
 * Create a bounding box polygon from a bounding box
 */
export function boundingBoxPolygon(bbox: GeoJSON.BBox): GeoJSON.Feature {
  return turf.bboxPolygon(bbox);
}

/**
 * Calculate whether a point is within a polygon
 */
export function pointInPolygon(
  point: GeoJSON.Position | GeoJSON.Point | GeoJSON.Feature<GeoJSON.Point>,
  polygon: GeoJSON.Polygon | GeoJSON.Feature<GeoJSON.Polygon>
): boolean {
  return turf.booleanPointInPolygon(point, polygon);
}

/**
 * Calculate the nearest point in a collection to a reference point
 */
export function nearest(
  targetPoint: GeoJSON.Feature<GeoJSON.Point>,
  points: GeoJSON.FeatureCollection<GeoJSON.Point>
): GeoJSON.Feature<GeoJSON.Point> {
  return turf.nearestPoint(targetPoint, points);
}

/**
 * Hook for complex spatial operations that require server-side processing
 */
export function useSpatialOperations() {
  /**
   * Perform a cluster analysis on a set of points
   */
  const clusterAnalysisMutation = useMutation({
    mutationFn: async (params: {
      points: GeoJSON.FeatureCollection<GeoJSON.Point>;
      options: ClusterOptions;
    }) => {
      const { points, options } = params;
      const response = await apiRequest('POST', '/api/spatial/cluster', { points, options });
      return await response.json();
    },
  });

  /**
   * Calculate a drive time isochrone from a point
   */
  const isochroneMutation = useMutation({
    mutationFn: async (params: {
      origin: GeoJSON.Point | GeoJSON.Feature<GeoJSON.Point>;
      minutes: number;
      mode?: 'driving' | 'walking' | 'cycling';
    }) => {
      const response = await apiRequest('POST', '/api/spatial/isochrone', params);
      return await response.json();
    },
  });

  /**
   * Perform a spatial query (within, contains, intersects, etc.)
   */
  const spatialQueryMutation = useMutation({
    mutationFn: async (params: {
      sourceLayer: string;
      targetLayer: string;
      geometry?: GeoJSON.Geometry | GeoJSON.Feature;
      options: SpatialQueryOptions;
    }) => {
      const response = await apiRequest('POST', '/api/spatial/query', params);
      return await response.json();
    },
  });

  /**
   * Perform a topological validation and repair
   */
  const validateTopologyMutation = useMutation({
    mutationFn: async (params: {
      geometry: GeoJSON.Geometry | GeoJSON.Feature;
      autoFix?: boolean;
    }) => {
      const response = await apiRequest('POST', '/api/spatial/validate-topology', params);
      return await response.json();
    },
  });

  /**
   * Generate a heatmap from point data
   */
  const generateHeatmapMutation = useMutation({
    mutationFn: async (params: {
      points: GeoJSON.FeatureCollection<GeoJSON.Point>;
      weight?: string;
      radius?: number;
      blur?: number;
      minOpacity?: number;
    }) => {
      const response = await apiRequest('POST', '/api/spatial/heatmap', params);
      return await response.json();
    },
  });

  /**
   * Perform geocoding (address to coordinates)
   */
  const geocodeMutation = useMutation({
    mutationFn: async (params: { address: string; country?: string; limit?: number }) => {
      const response = await apiRequest('POST', '/api/spatial/geocode', params);
      return await response.json();
    },
  });

  /**
   * Perform reverse geocoding (coordinates to address)
   */
  const reverseGeocodeMutation = useMutation({
    mutationFn: async (params: { coordinates: [number, number]; types?: string[] }) => {
      const response = await apiRequest('POST', '/api/spatial/reverse-geocode', params);
      return await response.json();
    },
  });

  return {
    // Server-side mutations
    clusterAnalysis: clusterAnalysisMutation,
    isochrone: isochroneMutation,
    spatialQuery: spatialQueryMutation,
    validateTopology: validateTopologyMutation,
    generateHeatmap: generateHeatmapMutation,
    geocode: geocodeMutation,
    reverseGeocode: reverseGeocodeMutation,

    // Client-side functions (re-exported for convenience)
    bufferGeometry,
    centroid,
    area,
    length,
    simplify,
    intersection,
    union,
    convexHull,
    boundingBox,
    boundingBoxPolygon,
    pointInPolygon,
    nearest,
  };
}

/**
 * Hook for querying available GIS layers
 */
export function useGISLayers(enabled = true) {
  return useQuery({
    queryKey: ['/api/gis/layers'],
    enabled,
  });
}

/**
 * Hook for querying layer metadata
 */
export function useLayerMetadata(layerId: string, enabled = true) {
  return useQuery({
    queryKey: ['/api/gis/layers', layerId],
    enabled: enabled && !!layerId,
  });
}

/**
 * Hook for querying layer features
 */
export function useLayerFeatures(layerId: string, bbox?: GeoJSON.BBox, enabled = true) {
  return useQuery({
    queryKey: ['/api/gis/layers', layerId, 'features', bbox ? JSON.stringify(bbox) : 'all'],
    enabled: enabled && !!layerId,
  });
}
