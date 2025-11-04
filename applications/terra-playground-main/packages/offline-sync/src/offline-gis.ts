/**
 * Offline GIS Module
 *
 * Provides offline geospatial information system capabilities,
 * including map tile caching and offline vector data.
 */

import { EventEmitter } from 'events';
import { LocalStorageProvider } from './storage';

/**
 * Tile cache status enum
 */
export enum TileCacheStatus {
  /** Cache is empty */
  EMPTY = 'empty',
  /** Cache is loading */
  LOADING = 'loading',
  /** Cache is ready */
  READY = 'ready',
  /** Cache has error */
  ERROR = 'error',
}

/**
 * Cached tile interface
 */
export interface CachedTile {
  /** Z coordinate */
  z: number;
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Tile data */
  data: Blob;
  /** MIME type */
  mimeType: string;
  /** Creation timestamp */
  createdAt: number;
  /** Expiry timestamp */
  expiresAt?: number;
  /** ETag for conditional requests */
  etag?: string;
}

/**
 * Tile cache stats interface
 */
export interface TileCacheStats {
  /** Total number of cached tiles */
  totalTiles: number;
  /** Total size in bytes */
  totalSize: number;
  /** Oldest tile timestamp */
  oldestTile?: number;
  /** Newest tile timestamp */
  newestTile?: number;
  /** Number of tiles by zoom level */
  byZoom: Record<number, number>;
}

/**
 * Vector feature interface
 */
export interface VectorFeature {
  /** Feature ID */
  id: string;
  /** Geometry (GeoJSON) */
  geometry: any;
  /** Properties */
  properties: Record<string, any>;
  /** Layer ID */
  layerId: string;
  /** Last modified timestamp */
  lastModified: number;
  /** Sync status */
  synced: boolean;
}

/**
 * Bounds interface
 */
export interface Bounds {
  /** Minimum longitude */
  minLon: number;
  /** Minimum latitude */
  minLat: number;
  /** Maximum longitude */
  maxLon: number;
  /** Maximum latitude */
  maxLat: number;
}

/**
 * Offline GIS manager
 */
export class OfflineGISManager extends EventEmitter {
  private storageProvider: LocalStorageProvider;
  private tileCache: Map<string, CachedTile> = new Map();
  private vectorFeatures: Map<string, VectorFeature> = new Map();
  private cacheLimits: {
    maxTiles: number;
    maxSize: number;
    maxAge: number;
  };
  private cacheStatus: TileCacheStatus = TileCacheStatus.EMPTY;

  /**
   * Initialize a new offline GIS manager
   *
   * @param storageProvider Storage provider
   * @param options Options
   */
  constructor(
    storageProvider: LocalStorageProvider,
    options: {
      maxTiles?: number;
      maxSize?: number; // in bytes
      maxAge?: number; // in milliseconds
    } = {}
  ) {
    super();
    this.storageProvider = storageProvider;
    this.cacheLimits = {
      maxTiles: options.maxTiles || 1000,
      maxSize: options.maxSize || 50 * 1024 * 1024, // 50 MB
      maxAge: options.maxAge || 7 * 24 * 60 * 60 * 1000, // 7 days
    };
  }

  /**
   * Initialize the offline GIS manager
   */
  async initialize(): Promise<void> {
    try {
      this.cacheStatus = TileCacheStatus.LOADING;

      // Load tiles from storage
      const tileIds = await this.storageProvider.listDocuments();

      for (const tileId of tileIds) {
        if (tileId.startsWith('tile_')) {
          const metadata = await this.storageProvider.loadMetadata(tileId);

          if (metadata) {
            const data = await this.storageProvider.loadDocument(tileId);

            if (data) {
              const tile: CachedTile = {
                ...metadata,
                data: new Blob([data], { type: metadata.mimeType }),
              };

              this.tileCache.set(tileId, tile);
            }
          }
        }
      }

      // Load vector features from storage
      for (const featureId of tileIds) {
        if (featureId.startsWith('feature_')) {
          const data = await this.storageProvider.loadMetadata(featureId);

          if (data) {
            this.vectorFeatures.set(featureId, data);
          }
        }
      }

      this.cacheStatus = TileCacheStatus.READY;
      this.emit('initialized');
    } catch (error) {
      console.error('Error initializing offline GIS:', error);
      this.cacheStatus = TileCacheStatus.ERROR;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get cache status
   *
   * @returns Cache status
   */
  getCacheStatus(): TileCacheStatus {
    return this.cacheStatus;
  }

  /**
   * Get tile cache key
   *
   * @param z Z coordinate
   * @param x X coordinate
   * @param y Y coordinate
   * @returns Cache key
   */
  private getTileCacheKey(z: number, x: number, y: number): string {
    return `tile_${z}_${x}_${y}`;
  }

  /**
   * Cache a tile
   *
   * @param z Z coordinate
   * @param x X coordinate
   * @param y Y coordinate
   * @param data Tile data (Blob)
   * @param mimeType MIME type
   * @param expiresAt Expiry timestamp
   * @param etag ETag for conditional requests
   * @returns Whether the tile was cached
   */
  async cacheTile(
    z: number,
    x: number,
    y: number,
    data: Blob,
    mimeType: string,
    expiresAt?: number,
    etag?: string
  ): Promise<boolean> {
    // Check cache limits
    if (this.tileCache.size >= this.cacheLimits.maxTiles) {
      await this.evictOldestTiles(1);
    }

    // Check size limit
    const size = data.size;
    const stats = this.getCacheStats();

    if (stats.totalSize + size > this.cacheLimits.maxSize) {
      const tilesToEvict = Math.ceil(size / (stats.totalSize / stats.totalTiles));
      await this.evictOldestTiles(tilesToEvict);
    }

    // Cache tile
    const tileKey = this.getTileCacheKey(z, x, y);
    const createdAt = Date.now();

    const tile: CachedTile = {
      z,
      x,
      y,
      data,
      mimeType,
      createdAt,
      expiresAt,
      etag,
    };

    this.tileCache.set(tileKey, tile);

    // Store in storage
    const arrayBuffer = await data.arrayBuffer();
    await this.storageProvider.saveDocument(tileKey, new Uint8Array(arrayBuffer));

    // Store metadata
    const metadata = {
      z,
      x,
      y,
      mimeType,
      createdAt,
      expiresAt,
      etag,
    };

    await this.storageProvider.saveMetadata(tileKey, metadata);

    // Emit event
    this.emit('tile:cached', { z, x, y, size });

    return true;
  }

  /**
   * Get a cached tile
   *
   * @param z Z coordinate
   * @param x X coordinate
   * @param y Y coordinate
   * @returns Cached tile or null if not found
   */
  getCachedTile(z: number, x: number, y: number): CachedTile | null {
    const tileKey = this.getTileCacheKey(z, x, y);
    const tile = this.tileCache.get(tileKey);

    if (!tile) {
      return null;
    }

    // Check if expired
    if (tile.expiresAt && tile.expiresAt < Date.now()) {
      this.evictTile(z, x, y).catch(error => {
        console.error('Error evicting expired tile:', error);
      });

      return null;
    }

    return tile;
  }

  /**
   * Evict a tile from cache
   *
   * @param z Z coordinate
   * @param x X coordinate
   * @param y Y coordinate
   * @returns Whether the tile was evicted
   */
  async evictTile(z: number, x: number, y: number): Promise<boolean> {
    const tileKey = this.getTileCacheKey(z, x, y);

    if (!this.tileCache.has(tileKey)) {
      return false;
    }

    // Remove from cache
    this.tileCache.delete(tileKey);

    // Remove from storage
    await this.storageProvider.deleteDocument(tileKey);
    await this.storageProvider.deleteMetadata(tileKey);

    // Emit event
    this.emit('tile:evicted', { z, x, y });

    return true;
  }

  /**
   * Evict oldest tiles
   *
   * @param count Number of tiles to evict
   * @returns Number of tiles evicted
   */
  private async evictOldestTiles(count: number): Promise<number> {
    // Get tiles sorted by creation time
    const tiles = Array.from(this.tileCache.entries()).sort(
      ([, a], [, b]) => a.createdAt - b.createdAt
    );

    const tilesToEvict = tiles.slice(0, count);
    let evicted = 0;

    for (const [tileKey, tile] of tilesToEvict) {
      // Remove from cache
      this.tileCache.delete(tileKey);

      // Remove from storage
      await this.storageProvider.deleteDocument(tileKey);
      await this.storageProvider.deleteMetadata(tileKey);

      // Emit event
      this.emit('tile:evicted', { z: tile.z, x: tile.x, y: tile.y });

      evicted++;
    }

    return evicted;
  }

  /**
   * Clear tile cache
   */
  async clearTileCache(): Promise<void> {
    // Get all tile keys
    const tileKeys = Array.from(this.tileCache.keys());

    // Clear cache
    this.tileCache.clear();

    // Clear storage
    for (const tileKey of tileKeys) {
      await this.storageProvider.deleteDocument(tileKey);
      await this.storageProvider.deleteMetadata(tileKey);
    }

    // Emit event
    this.emit('tile-cache:cleared');
  }

  /**
   * Get cache stats
   *
   * @returns Cache stats
   */
  getCacheStats(): TileCacheStats {
    const stats: TileCacheStats = {
      totalTiles: this.tileCache.size,
      totalSize: 0,
      byZoom: {},
    };

    let oldestTile: number | undefined;
    let newestTile: number | undefined;

    for (const tile of this.tileCache.values()) {
      // Update total size
      stats.totalSize += tile.data.size;

      // Update zoom level stats
      stats.byZoom[tile.z] = (stats.byZoom[tile.z] || 0) + 1;

      // Update timestamps
      if (oldestTile === undefined || tile.createdAt < oldestTile) {
        oldestTile = tile.createdAt;
      }

      if (newestTile === undefined || tile.createdAt > newestTile) {
        newestTile = tile.createdAt;
      }
    }

    stats.oldestTile = oldestTile;
    stats.newestTile = newestTile;

    return stats;
  }

  /**
   * Get feature ID
   *
   * @param id Feature ID
   * @returns Full feature ID
   */
  private getFeatureId(id: string): string {
    return `feature_${id}`;
  }

  /**
   * Save vector feature
   *
   * @param feature Vector feature
   */
  async saveVectorFeature(feature: VectorFeature): Promise<void> {
    const featureId = this.getFeatureId(feature.id);

    // Update timestamp
    feature.lastModified = Date.now();

    // Save to cache
    this.vectorFeatures.set(featureId, feature);

    // Save to storage
    await this.storageProvider.saveMetadata(featureId, feature);

    // Emit event
    this.emit('feature:saved', { id: feature.id, layerId: feature.layerId });
  }

  /**
   * Get vector feature
   *
   * @param id Feature ID
   * @returns Vector feature or null if not found
   */
  getVectorFeature(id: string): VectorFeature | null {
    const featureId = this.getFeatureId(id);
    return this.vectorFeatures.get(featureId) || null;
  }

  /**
   * Delete vector feature
   *
   * @param id Feature ID
   * @returns Whether the feature was deleted
   */
  async deleteVectorFeature(id: string): Promise<boolean> {
    const featureId = this.getFeatureId(id);

    if (!this.vectorFeatures.has(featureId)) {
      return false;
    }

    // Remove from cache
    this.vectorFeatures.delete(featureId);

    // Remove from storage
    await this.storageProvider.deleteMetadata(featureId);

    // Emit event
    this.emit('feature:deleted', { id });

    return true;
  }

  /**
   * Get vector features by layer
   *
   * @param layerId Layer ID
   * @returns Array of vector features
   */
  getVectorFeaturesByLayer(layerId: string): VectorFeature[] {
    return Array.from(this.vectorFeatures.values()).filter(feature => feature.layerId === layerId);
  }

  /**
   * Get vector features in bounds
   *
   * @param bounds Bounds
   * @param layerId Optional layer ID filter
   * @returns Array of vector features
   */
  getVectorFeaturesInBounds(bounds: Bounds, layerId?: string): VectorFeature[] {
    return Array.from(this.vectorFeatures.values()).filter(feature => {
      // Filter by layer if specified
      if (layerId && feature.layerId !== layerId) {
        return false;
      }

      // Check if feature intersects bounds
      // This is a simple check that assumes point or bbox geometries
      // For complex geometries, a proper spatial index or turf.js would be better
      const geometry = feature.geometry;

      if (geometry.type === 'Point') {
        const [lon, lat] = geometry.coordinates;
        return (
          lon >= bounds.minLon &&
          lon <= bounds.maxLon &&
          lat >= bounds.minLat &&
          lat <= bounds.maxLat
        );
      } else if (geometry.bbox) {
        const [minLon, minLat, maxLon, maxLat] = geometry.bbox;
        return !(
          maxLon < bounds.minLon ||
          minLon > bounds.maxLon ||
          maxLat < bounds.minLat ||
          minLat > bounds.maxLat
        );
      }

      // For other geometry types, always include
      // (would need more complex intersection checking)
      return true;
    });
  }

  /**
   * Synchronize vector features
   *
   * @param layerId Layer ID
   * @param apiEndpoint API endpoint
   * @returns Synchronization result
   */
  async synchronizeVectorFeatures(
    layerId: string,
    apiEndpoint: string
  ): Promise<{ added: number; updated: number; deleted: number; failed: number }> {
    const result = { added: 0, updated: 0, deleted: 0, failed: 0 };

    try {
      // Get features to sync
      const features = this.getVectorFeaturesByLayer(layerId).filter(feature => !feature.synced);

      // Prepare features by ID for efficient lookup
      const featureMap = new Map<string, VectorFeature>();
      features.forEach(feature => featureMap.set(feature.id, feature));

      // Send features to server
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          layerId,
          features: features.map(feature => ({
            id: feature.id,
            geometry: feature.geometry,
            properties: feature.properties,
            lastModified: feature.lastModified,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      // Process response
      const data = await response.json();

      // Update local features
      for (const feature of data.features) {
        const featureId = this.getFeatureId(feature.id);

        if (featureMap.has(feature.id)) {
          // Update existing feature
          feature.synced = true;
          this.vectorFeatures.set(featureId, feature);
          await this.storageProvider.saveMetadata(featureId, feature);
          result.updated++;
        } else {
          // Add new feature
          feature.synced = true;
          this.vectorFeatures.set(featureId, feature);
          await this.storageProvider.saveMetadata(featureId, feature);
          result.added++;
        }
      }

      // Process deleted features
      for (const deletedId of data.deleted || []) {
        const featureId = this.getFeatureId(deletedId);

        if (this.vectorFeatures.has(featureId)) {
          this.vectorFeatures.delete(featureId);
          await this.storageProvider.deleteMetadata(featureId);
          result.deleted++;
        }
      }
    } catch (error) {
      console.error('Error synchronizing vector features:', error);
      result.failed = features.length;
    }

    // Emit event
    this.emit('features:synchronized', { layerId, ...result });

    return result;
  }

  /**
   * Mark all local vector features as unsynced
   *
   * @param layerId Optional layer ID filter
   * @returns Number of features marked as unsynced
   */
  markAllFeaturesAsUnsynced(layerId?: string): number {
    let count = 0;

    for (const [id, feature] of this.vectorFeatures.entries()) {
      if (!layerId || feature.layerId === layerId) {
        feature.synced = false;
        this.vectorFeatures.set(id, feature);

        // Update storage (async)
        this.storageProvider.saveMetadata(id, feature).catch(error => {
          console.error(`Error updating feature ${id}:`, error);
        });

        count++;
      }
    }

    return count;
  }
}

export default OfflineGISManager;
