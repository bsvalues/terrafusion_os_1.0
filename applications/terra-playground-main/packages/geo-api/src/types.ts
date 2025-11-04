/**
 * Geospatial API Type Definitions
 */

// Layer visibility settings
export type LayerVisibility = 'visible' | 'hidden' | 'none';

// Basic GeoJSON types
export type GeoJSONGeometryType =
  | 'Point'
  | 'MultiPoint'
  | 'LineString'
  | 'MultiLineString'
  | 'Polygon'
  | 'MultiPolygon'
  | 'GeometryCollection';

export interface GeoJSONGeometry {
  type: GeoJSONGeometryType;
  coordinates: any;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties: Record<string, any>;
  id?: string | number;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// Map layer definitions
export interface MapLayer {
  id: string;
  name: string;
  type: 'vector' | 'raster' | 'geojson' | 'point' | 'line' | 'polygon';
  source: string | GeoJSONFeatureCollection;
  sourceLayer?: string;
  minZoom?: number;
  maxZoom?: number;
  visibility: LayerVisibility;
  style?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Map viewport settings
export interface MapViewport {
  center: [number, number]; // [longitude, latitude]
  zoom: number;
  bearing?: number;
  pitch?: number;
  bounds?: [[number, number], [number, number]]; // [[sw_lng, sw_lat], [ne_lng, ne_lat]]
}

// Map click and hover event information
export interface MapFeatureEvent {
  lngLat: [number, number];
  features: GeoJSONFeature[];
  layerId?: string;
  point: [number, number]; // pixel coordinates
}

// Query result when fetching features from a layer
export interface FeatureQueryResult {
  features: GeoJSONFeature[];
  total: number;
  layer: string;
}
