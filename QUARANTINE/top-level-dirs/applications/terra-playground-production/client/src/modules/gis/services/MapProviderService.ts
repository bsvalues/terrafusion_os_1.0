import { MapProviderOptions, MapProviderType } from '../utils/ol-ext-utils';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

/**
 * MapProviderService
 *
 * Handles different map providers including Mapbox, QGIS, and OpenStreetMap.
 * Abstracts away provider-specific implementation details.
 */
export class MapProviderService {
  private apiKey?: string;
  private providerType: MapProviderType;

  constructor(providerType: MapProviderType = 'osm', options?: MapProviderOptions) {
    this.providerType = providerType;
    this.apiKey = options?.apiKey;
  }

  /**
   * Get tile layer for the configured provider
   */
  getTileLayer(): TileLayer<any> {
    switch (this.providerType) {
      case 'mapbox':
        return this.getMapboxTileLayer();
      case 'qgis':
        return this.getQGISTileLayer();
      case 'google':
        return this.getGoogleTileLayer();
      case 'osm':
      default:
        return this.getOSMTileLayer();
    }
  }

  /**
   * Get Mapbox tile layer
   */
  private getMapboxTileLayer(): TileLayer<any> {
    if (!this.apiKey) {
      console.warn('No Mapbox API key provided, falling back to OpenStreetMap');
      return this.getOSMTileLayer();
    }

    return new TileLayer({
      source: new XYZ({
        url: `https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/tiles/{z}/{x}/{y}?access_token=${this.apiKey}`,
        maxZoom: 19,
        attributions: '© Mapbox, © OpenStreetMap',
      }),
    });
  }

  /**
   * Get QGIS tile layer
   * Note: This is a simplified implementation
   */
  private getQGISTileLayer(): TileLayer<any> {
    // In a real implementation, this would connect to a QGIS server
    // For now, we'll use a fallback to OSM
    console.info('QGIS integration is a work in progress, using fallback map');
    return this.getOSMTileLayer();
  }

  /**
   * Get Google tile layer
   */
  private getGoogleTileLayer(): TileLayer<any> {
    // Google Maps requires specific implementation
    // For now, we'll use a fallback to OSM
    console.info('Google Maps integration requires API key, using fallback map');
    return this.getOSMTileLayer();
  }

  /**
   * Get OpenStreetMap tile layer
   */
  private getOSMTileLayer(): TileLayer<any> {
    return new TileLayer({
      source: new XYZ({
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        maxZoom: 19,
        attributions: '© OpenStreetMap contributors',
      }),
    });
  }

  /**
   * Check if the current provider requires an API key
   */
  requiresApiKey(): boolean {
    return this.providerType === 'mapbox' || this.providerType === 'google';
  }

  /**
   * Set provider type
   */
  setProviderType(type: MapProviderType): void {
    this.providerType = type;
  }

  /**
   * Set API key
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Get provider type
   */
  getProviderType(): MapProviderType {
    return this.providerType;
  }
}
