import {
  MapLayer,
  MapViewport,
  GeoJSONFeature,
  FeatureQueryResult,
  GeoJSONFeatureCollection,
  MapFeatureEvent,
} from '../types';

/**
 * Interface for map providers (Mapbox, OpenLayers, etc.)
 */
export interface MapProvider {
  /**
   * Initialize the map in a container
   * @param container DOM element or ID to contain the map
   * @param options Map initialization options
   */
  initialize(container: HTMLElement | string, options?: Partial<MapViewport>): Promise<void>;

  /**
   * Add a layer to the map
   * @param layer Layer configuration
   */
  addLayer(layer: MapLayer): Promise<void>;

  /**
   * Remove a layer from the map
   * @param layerId ID of the layer to remove
   */
  removeLayer(layerId: string): Promise<void>;

  /**
   * Set the visibility of a layer
   * @param layerId ID of the layer
   * @param visibility Visibility setting
   */
  setLayerVisibility(layerId: string, visibility: 'visible' | 'hidden' | 'none'): Promise<void>;

  /**
   * Update the map viewport
   * @param viewport New viewport settings
   * @param animate Whether to animate the transition
   */
  setViewport(viewport: Partial<MapViewport>, animate?: boolean): Promise<void>;

  /**
   * Query features at a point
   * @param point [x, y] pixel coordinates
   * @param layerIds Optional layer IDs to query
   */
  queryRenderedFeatures(point: [number, number], layerIds?: string[]): Promise<GeoJSONFeature[]>;

  /**
   * Query features in a bounding box
   * @param bounds [[sw_lng, sw_lat], [ne_lng, ne_lat]]
   * @param layerIds Optional layer IDs to query
   */
  queryFeaturesBounds(
    bounds: [[number, number], [number, number]],
    layerIds?: string[]
  ): Promise<FeatureQueryResult[]>;

  /**
   * Update features in a layer
   * @param layerId ID of the layer
   * @param featureCollection GeoJSON feature collection with updated features
   */
  updateLayerFeatures(layerId: string, featureCollection: GeoJSONFeatureCollection): Promise<void>;

  /**
   * Register an event handler for map events
   * @param event Event name
   * @param handler Event handler function
   */
  on(
    event: 'click' | 'mousemove' | 'moveend' | 'load',
    handler: (e: MapFeatureEvent) => void
  ): void;

  /**
   * Remove an event handler
   * @param event Event name
   * @param handler Event handler function
   */
  off(
    event: 'click' | 'mousemove' | 'moveend' | 'load',
    handler: (e: MapFeatureEvent) => void
  ): void;

  /**
   * Clean up resources when disposing of the map
   */
  dispose(): void;
}
