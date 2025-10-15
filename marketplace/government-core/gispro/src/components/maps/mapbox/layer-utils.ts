import mapboxgl, { LngLatBounds } from 'mapbox-gl';
import { v4 as uuidv4 } from 'uuid';

/**
 * Basic layer configuration interface
 */
export interface LayerConfig {
  id: string;
  visible?: boolean;
  opacity?: number;
  metadata?: Record<string, any>;
}

/**
 * Data source interface for GeoJSON data
 */
export interface GeoJSONSourceConfig extends LayerConfig {
  type: 'geojson';
  data: GeoJSON.GeoJSON;
}

/**
 * Data source interface for vector tile data
 */
export interface VectorSourceConfig extends LayerConfig {
  type: 'vector';
  url: string;
  tiles?: string[];
}

/**
 * Data source interface for raster tile data
 */
export interface RasterSourceConfig extends LayerConfig {
  type: 'raster';
  url?: string;
  tiles?: string[];
  tileSize?: number;
}

/**
 * Union type for all supported source configurations
 */
export type SourceConfig = GeoJSONSourceConfig | VectorSourceConfig | RasterSourceConfig;

/**
 * Adds a source to the map if it doesn't already exist
 */
export function addSourceIfNotExists(map: mapboxgl.Map, config: SourceConfig): void {
  if (!map.getSource(config.id)) {
    const sourceConfig: any = {
      type: config.type
    };

    // Add appropriate properties based on source type
    if (config.type === 'geojson') {
      sourceConfig.data = (config as GeoJSONSourceConfig).data;
    } else if (config.type === 'vector') {
      const vectorConfig = config as VectorSourceConfig;
      if (vectorConfig.url) sourceConfig.url = vectorConfig.url;
      if (vectorConfig.tiles) sourceConfig.tiles = vectorConfig.tiles;
    } else if (config.type === 'raster') {
      const rasterConfig = config as RasterSourceConfig;
      if (rasterConfig.url) sourceConfig.url = rasterConfig.url;
      if (rasterConfig.tiles) sourceConfig.tiles = rasterConfig.tiles;
      if (rasterConfig.tileSize) sourceConfig.tileSize = rasterConfig.tileSize;
    }

    map.addSource(config.id, sourceConfig);
  }
}

/**
 * Updates a GeoJSON source with new data
 */
export function updateGeoJSONSource(map: mapboxgl.Map, sourceId: string, data: GeoJSON.GeoJSON): void {
  const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
  if (source) {
    source.setData(data);
  }
}

/**
 * Adds a layer to the map with the given configuration
 */
export function addLayer(
  map: mapboxgl.Map, 
  layerConfig: mapboxgl.AnyLayer, 
  beforeId?: string
): void {
  if (!map.getLayer(layerConfig.id)) {
    try {
      map.addLayer(layerConfig, beforeId);
    } catch (error) {
      console.error(`Error adding layer ${layerConfig.id}:`, error);
    }
  }
}

/**
 * Creates a GeoJSON feature collection from an array of features
 */
export function createFeatureCollection(features: GeoJSON.Feature[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: features
  };
}

/**
 * Creates a unique ID for new layers or sources
 */
export function createUniqueId(prefix = 'layer'): string {
  return `${prefix}-${uuidv4().slice(0, 8)}`;
}

/**
 * Sets the layer visibility
 */
export function setLayerVisibility(map: mapboxgl.Map, layerId: string, visible: boolean): void {
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }
}

/**
 * Sets the layer opacity
 */
export function setLayerOpacity(
  map: mapboxgl.Map, 
  layerId: string, 
  opacity: number, 
  property = 'opacity'
): void {
  if (map.getLayer(layerId)) {
    const layerType = map.getLayer(layerId).type;
    
    // Different layer types use different opacity properties
    switch (layerType) {
      case 'line':
        map.setPaintProperty(layerId, 'line-opacity', opacity);
        break;
      case 'fill':
        map.setPaintProperty(layerId, 'fill-opacity', opacity);
        break;
      case 'circle':
        map.setPaintProperty(layerId, 'circle-opacity', opacity);
        break;
      case 'symbol':
        map.setPaintProperty(layerId, 'icon-opacity', opacity);
        map.setPaintProperty(layerId, 'text-opacity', opacity);
        break;
      case 'raster':
        map.setPaintProperty(layerId, 'raster-opacity', opacity);
        break;
      default:
        // For custom layers or other types, use the provided property
        map.setPaintProperty(layerId, property, opacity);
    }
  }
}

/**
 * Fits the map to the bounds of a GeoJSON object with padding
 */
export function fitMapToBounds(
  map: mapboxgl.Map, 
  data: GeoJSON.GeoJSON, 
  padding: number | mapboxgl.PaddingOptions = 50
): void {
  const bounds = new LngLatBounds();
  
  // Handle different GeoJSON types
  if (data.type === 'FeatureCollection') {
    (data as GeoJSON.FeatureCollection).features.forEach(feature => {
      if (feature.geometry) {
        extendBoundsWithGeometry(bounds, feature.geometry);
      }
    });
  } else if (data.type === 'Feature') {
    if ((data as GeoJSON.Feature).geometry) {
      extendBoundsWithGeometry(bounds, (data as GeoJSON.Feature).geometry);
    }
  } else {
    // Directly handle geometry objects
    extendBoundsWithGeometry(bounds, data as GeoJSON.Geometry);
  }
  
  // Only fit bounds if we have a valid bounds object
  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, { padding });
  }
}

/**
 * Helper function to extend bounds with a geometry object
 */
function extendBoundsWithGeometry(bounds: LngLatBounds, geometry: GeoJSON.Geometry): void {
  if (geometry.type === 'Point') {
    const coords = (geometry as GeoJSON.Point).coordinates;
    bounds.extend([coords[0], coords[1]]);
  } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
    const coords = (geometry as GeoJSON.LineString | GeoJSON.MultiPoint).coordinates;
    coords.forEach(coord => {
      bounds.extend([coord[0], coord[1]]);
    });
  } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
    const coordsArray = (geometry as GeoJSON.Polygon | GeoJSON.MultiLineString).coordinates;
    coordsArray.forEach(coords => {
      coords.forEach(coord => {
        bounds.extend([coord[0], coord[1]]);
      });
    });
  } else if (geometry.type === 'MultiPolygon') {
    const coordsArrays = (geometry as GeoJSON.MultiPolygon).coordinates;
    coordsArrays.forEach(coordsArray => {
      coordsArray.forEach(coords => {
        coords.forEach(coord => {
          bounds.extend([coord[0], coord[1]]);
        });
      });
    });
  } else if (geometry.type === 'GeometryCollection') {
    const geometries = (geometry as GeoJSON.GeometryCollection).geometries;
    geometries.forEach(geom => {
      extendBoundsWithGeometry(bounds, geom);
    });
  }
}