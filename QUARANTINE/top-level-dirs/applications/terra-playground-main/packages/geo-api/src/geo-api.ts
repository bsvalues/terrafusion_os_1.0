import {
  MapLayer,
  MapViewport,
  GeoJSONFeature,
  FeatureQueryResult,
  GeoJSONFeatureCollection,
  MapFeatureEvent,
} from './types';
import { MapProvider } from './providers/provider-interface';
import { MapboxProvider } from './providers/mapbox-provider';
import { OpenLayersProvider } from './providers/openlayers-provider';

export type GeoAPIOptions = {
  /** Preferred map provider ('mapbox' or 'openlayers') */
  preferredProvider?: 'mapbox' | 'openlayers';
  /** Mapbox API token */
  mapboxToken?: string;
  /** Default viewport configuration */
  defaultViewport?: Partial<MapViewport>;
};

/**
 * GeoAPI - Unified geospatial API for Terrafusion
 *
 * Provides a consistent interface for geospatial operations regardless of
 * the underlying map provider.
 */
export class GeoAPI {
  private provider: MapProvider | null = null;
  private preferredProvider: 'mapbox' | 'openlayers';
  private mapboxToken?: string;
  private defaultViewport: Partial<MapViewport>;
  private initialized = false;

  /**
   * Create a new GeoAPI instance
   * @param options Configuration options
   */
  constructor(options: GeoAPIOptions = {}) {
    this.preferredProvider = options.preferredProvider || 'mapbox';
    this.mapboxToken = options.mapboxToken;
    this.defaultViewport = options.defaultViewport || { zoom: 12 };
  }

  /**
   * Initialize the GeoAPI with a map container
   * @param container DOM element or ID to contain the map
   * @param options Map initialization options
   */
  async initialize(
    container: HTMLElement | string,
    options: Partial<MapViewport> = {}
  ): Promise<void> {
    if (this.initialized) {
      throw new Error('GeoAPI is already initialized');
    }

    // Create the appropriate provider
    if (this.preferredProvider === 'mapbox' && this.mapboxToken) {
      this.provider = new MapboxProvider(this.mapboxToken);
    } else {
      // Fall back to OpenLayers if no Mapbox token or if OpenLayers is preferred
      this.provider = new OpenLayersProvider();
    }

    // Merge default viewport with provided options
    const viewport = { ...this.defaultViewport, ...options };

    // Initialize the provider
    await this.provider.initialize(container, viewport);
    this.initialized = true;
  }

  /**
   * Add a layer to the map
   * @param layer Layer configuration
   */
  async addLayer(layer: MapLayer): Promise<void> {
    this.ensureInitialized();
    return this.provider!.addLayer(layer);
  }

  /**
   * Remove a layer from the map
   * @param layerId ID of the layer to remove
   */
  async removeLayer(layerId: string): Promise<void> {
    this.ensureInitialized();
    return this.provider!.removeLayer(layerId);
  }

  /**
   * Set the visibility of a layer
   * @param layerId ID of the layer
   * @param visibility Visibility setting
   */
  async setLayerVisibility(
    layerId: string,
    visibility: 'visible' | 'hidden' | 'none'
  ): Promise<void> {
    this.ensureInitialized();
    return this.provider!.setLayerVisibility(layerId, visibility);
  }

  /**
   * Update the map viewport
   * @param viewport New viewport settings
   * @param animate Whether to animate the transition
   */
  async setViewport(viewport: Partial<MapViewport>, animate: boolean = true): Promise<void> {
    this.ensureInitialized();
    return this.provider!.setViewport(viewport, animate);
  }

  /**
   * Query features at a point
   * @param point [x, y] pixel coordinates
   * @param layerIds Optional layer IDs to query
   */
  async queryRenderedFeatures(
    point: [number, number],
    layerIds?: string[]
  ): Promise<GeoJSONFeature[]> {
    this.ensureInitialized();
    return this.provider!.queryRenderedFeatures(point, layerIds);
  }

  /**
   * Query features in a bounding box
   * @param bounds [[sw_lng, sw_lat], [ne_lng, ne_lat]]
   * @param layerIds Optional layer IDs to query
   */
  async queryFeaturesBounds(
    bounds: [[number, number], [number, number]],
    layerIds?: string[]
  ): Promise<FeatureQueryResult[]> {
    this.ensureInitialized();
    return this.provider!.queryFeaturesBounds(bounds, layerIds);
  }

  /**
   * Update features in a layer
   * @param layerId ID of the layer
   * @param featureCollection GeoJSON feature collection with updated features
   */
  async updateLayerFeatures(
    layerId: string,
    featureCollection: GeoJSONFeatureCollection
  ): Promise<void> {
    this.ensureInitialized();
    return this.provider!.updateLayerFeatures(layerId, featureCollection);
  }

  /**
   * Register an event handler for map events
   * @param event Event name
   * @param handler Event handler function
   */
  on(
    event: 'click' | 'mousemove' | 'moveend' | 'load',
    handler: (e: MapFeatureEvent) => void
  ): void {
    this.ensureInitialized();
    this.provider!.on(event, handler);
  }

  /**
   * Remove an event handler
   * @param event Event name
   * @param handler Event handler function
   */
  off(
    event: 'click' | 'mousemove' | 'moveend' | 'load',
    handler: (e: MapFeatureEvent) => void
  ): void {
    this.ensureInitialized();
    this.provider!.off(event, handler);
  }

  /**
   * Get the active map provider
   */
  getProvider(): MapProvider | null {
    return this.provider;
  }

  /**
   * Clean up resources when disposing of the map
   */
  dispose(): void {
    if (this.provider) {
      this.provider.dispose();
      this.provider = null;
      this.initialized = false;
    }
  }

  /**
   * Ensure the GeoAPI is initialized before use
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.provider) {
      throw new Error('GeoAPI is not initialized. Call initialize() first.');
    }
  }
}
