/**
 * Mapping and GIS Agent
 *
 * This agent specializes in geospatial operations, mapping, and GIS functionality.
 * It can generate map visualizations, perform spatial analysis, and manage GIS layers.
 */

import { BaseAgent } from './base-agent';
import { AgentConfig, AgentCapability, AgentStatus } from '../models/agent-types';
import { IStorage } from '../services/storage-interface';
import { LLMService } from '../services/llm-service';

/**
 * Map generation options
 */
export interface MapGenerationOptions {
  /**
   * Map center coordinates [longitude, latitude]
   */
  center?: [number, number];

  /**
   * Map zoom level
   */
  zoom?: number;

  /**
   * Map style identifier
   */
  style?: string;

  /**
   * Whether to include base layers
   */
  includeBaseLayers?: boolean;

  /**
   * List of additional layer IDs to include
   */
  layers?: string[];

  /**
   * Map dimensions [width, height] in pixels
   */
  dimensions?: [number, number];
}

/**
 * Spatial query options
 */
export interface SpatialQueryOptions {
  /**
   * Query type
   */
  queryType: 'within' | 'contains' | 'intersects' | 'nearest';

  /**
   * Buffer distance in meters (for nearest queries)
   */
  buffer?: number;

  /**
   * Maximum results to return
   */
  limit?: number;
}

/**
 * Mapping and GIS Agent implementation
 */
export class MappingAgent extends BaseAgent {
  constructor(
    id: string,
    name: string,
    description: string,
    storage: IStorage,
    llmService: LLMService,
    config?: AgentConfig
  ) {
    super(id, name, description, config || {}, storage, llmService);
  }

  /**
   * Register agent capabilities
   */
  protected registerCapabilities(): void {
    this.registerCapability({
      id: 'generate-map',
      name: 'Generate Map',
      description: 'Generate a map visualization for a specific area or properties',
      parameterSchema: {
        areaId: { type: 'string', required: false },
        propertyIds: { type: 'array', required: false },
        options: { type: 'object', required: false },
      },
      handler: async params => this.generateMap(params.areaId, params.propertyIds, params.options),
    });

    this.registerCapability({
      id: 'manage-layers',
      name: 'Manage Map Layers',
      description: 'Create, update, delete, or list map layers',
      parameterSchema: {
        action: { type: 'string', required: true },
        layerId: { type: 'string', required: false },
        layerData: { type: 'object', required: false },
      },
      handler: async params => this.manageLayers(params.action, params.layerId, params.layerData),
    });

    this.registerCapability({
      id: 'spatial-query',
      name: 'Perform Spatial Query',
      description: 'Execute a spatial query on geographic data',
      parameterSchema: {
        geometry: { type: 'object', required: true },
        collectionName: { type: 'string', required: true },
        options: { type: 'object', required: false },
      },
      handler: async params =>
        this.spatialQuery(params.geometry, params.collectionName, params.options),
    });

    this.registerCapability({
      id: 'geocode',
      name: 'Geocode Address',
      description: 'Convert an address to geographic coordinates',
      parameterSchema: {
        address: { type: 'string', required: true },
        options: { type: 'object', required: false },
      },
      handler: async params => this.geocodeAddress(params.address, params.options),
    });

    this.registerCapability({
      id: 'reverse-geocode',
      name: 'Reverse Geocode',
      description: 'Convert geographic coordinates to an address',
      parameterSchema: {
        longitude: { type: 'number', required: true },
        latitude: { type: 'number', required: true },
        options: { type: 'object', required: false },
      },
      handler: async params =>
        this.reverseGeocode(params.longitude, params.latitude, params.options),
    });

    this.registerCapability({
      id: 'generate-heatmap',
      name: 'Generate Heatmap',
      description: 'Generate a heatmap visualization based on property values or other metrics',
      parameterSchema: {
        areaId: { type: 'string', required: true },
        metric: { type: 'string', required: true },
        options: { type: 'object', required: false },
      },
      handler: async params => this.generateHeatmap(params.areaId, params.metric, params.options),
    });

    this.registerCapability({
      id: 'export-map-data',
      name: 'Export Map Data',
      description: 'Export map data in various formats (GeoJSON, Shapefile, etc.)',
      parameterSchema: {
        layerIds: { type: 'array', required: true },
        format: { type: 'string', required: true },
        options: { type: 'object', required: false },
      },
      handler: async params => this.exportMapData(params.layerIds, params.format, params.options),
    });
  }

  /**
   * Generate a map visualization
   */
  private async generateMap(
    areaId?: string,
    propertyIds?: string[],
    options?: MapGenerationOptions
  ): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      const defaultOptions: MapGenerationOptions = {
        zoom: 12,
        style: 'streets',
        includeBaseLayers: true,
        dimensions: [800, 600],
      };

      const mapOptions = { ...defaultOptions, ...options };

      // Get area data if areaId is provided
      let area = null;
      if (areaId) {
        area = await this.storage.getItem('areas', areaId);
        if (!area) {
          throw new Error(`Area not found: ${areaId}`);
        }

        // Set map center from area if not provided in options
        if (!mapOptions.center && area.centroid) {
          mapOptions.center = area.centroid;
        }
      }

      // Get property data if propertyIds are provided
      let properties = [];
      if (propertyIds && propertyIds.length > 0) {
        for (const propId of propertyIds) {
          const property = await this.storage.getItem('properties', propId);
          if (property) {
            properties.push(property);
          }
        }

        // Set map center from first property if not provided
        if (!mapOptions.center && properties.length > 0 && properties[0].location) {
          mapOptions.center = properties[0].location;
        }
      }

      // Generate map visualization
      const mapData = {
        id: `map-${Date.now()}`,
        options: mapOptions,
        area: area,
        properties: properties,
        layers: mapOptions.layers || [],
        timestamp: new Date().toISOString(),
      };

      // Save map data
      await this.storage.setItem('maps', mapData.id, mapData);

      this.setStatus(AgentStatus.READY);
      return {
        mapId: mapData.id,
        mapUrl: `/maps/${mapData.id}`,
        mapData,
      };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Manage map layers
   */
  private async manageLayers(
    action: 'create' | 'update' | 'delete' | 'list',
    layerId?: string,
    layerData?: any
  ): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      switch (action) {
        case 'list':
          const layers = await this.storage.find('layers', {});
          this.setStatus(AgentStatus.READY);
          return { layers };

        case 'create':
          if (!layerData) {
            throw new Error('Layer data is required for create action');
          }

          const newLayer = {
            id: layerData.id || `layer-${Date.now()}`,
            name: layerData.name || 'New Layer',
            type: layerData.type || 'feature',
            source: layerData.source,
            style: layerData.style,
            visible: layerData.visible !== undefined ? layerData.visible : true,
            metadata: layerData.metadata || {},
            createdAt: new Date().toISOString(),
          };

          await this.storage.setItem('layers', newLayer.id, newLayer);
          this.setStatus(AgentStatus.READY);
          return { layer: newLayer };

        case 'update':
          if (!layerId) {
            throw new Error('Layer ID is required for update action');
          }

          const existingLayer = await this.storage.getItem('layers', layerId);
          if (!existingLayer) {
            throw new Error(`Layer not found: ${layerId}`);
          }

          const updatedLayer = {
            ...existingLayer,
            ...layerData,
            id: layerId, // Ensure ID doesn't change
            updatedAt: new Date().toISOString(),
          };

          await this.storage.setItem('layers', layerId, updatedLayer);
          this.setStatus(AgentStatus.READY);
          return { layer: updatedLayer };

        case 'delete':
          if (!layerId) {
            throw new Error('Layer ID is required for delete action');
          }

          const result = await this.storage.deleteItem('layers', layerId);
          this.setStatus(AgentStatus.READY);
          return { success: result };

        default:
          throw new Error(`Invalid action: ${action}`);
      }
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Perform a spatial query
   */
  private async spatialQuery(
    geometry: any,
    collectionName: string,
    options?: SpatialQueryOptions
  ): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      const defaultOptions: SpatialQueryOptions = {
        queryType: 'within',
        limit: 100,
      };

      const queryOptions = { ...defaultOptions, ...options };

      // For now, this is a simplified implementation that doesn't do actual spatial queries
      // In a real implementation, this would use a spatial database or library

      // Get all items from the collection
      const allItems = await this.storage.find(collectionName, {});

      // Mock filtering items based on geometry and query type
      // In reality, this would use proper spatial indexing and querying
      const results = allItems.slice(0, queryOptions.limit || 100);

      this.setStatus(AgentStatus.READY);
      return {
        queryType: queryOptions.queryType,
        results,
        count: results.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Geocode an address to coordinates
   */
  private async geocodeAddress(address: string, options?: any): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      // In a real implementation, this would call a geocoding service
      // For now, we'll return a mock result

      // Check if we have cached this address
      const cachedResult = await this.storage.getItem('geocode_cache', address);
      if (cachedResult) {
        this.setStatus(AgentStatus.READY);
        return cachedResult;
      }

      // Mock geocode result
      const result = {
        address,
        coordinates: [-122.4194, 37.7749], // Example coordinates: San Francisco
        accuracy: 'high',
        timestamp: new Date().toISOString(),
      };

      // Cache the result
      await this.storage.setItem('geocode_cache', address, result);

      this.setStatus(AgentStatus.READY);
      return result;
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to an address
   */
  private async reverseGeocode(longitude: number, latitude: number, options?: any): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      // In a real implementation, this would call a reverse geocoding service
      // For now, we'll return a mock result

      // Create a cache key from coordinates
      const cacheKey = `${longitude},${latitude}`;

      // Check if we have cached these coordinates
      const cachedResult = await this.storage.getItem('reverse_geocode_cache', cacheKey);
      if (cachedResult) {
        this.setStatus(AgentStatus.READY);
        return cachedResult;
      }

      // Mock reverse geocode result
      const result = {
        coordinates: [longitude, latitude],
        address: '123 Main St, Anytown, USA',
        components: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          country: 'USA',
          postalCode: '94105',
        },
        accuracy: 'high',
        timestamp: new Date().toISOString(),
      };

      // Cache the result
      await this.storage.setItem('reverse_geocode_cache', cacheKey, result);

      this.setStatus(AgentStatus.READY);
      return result;
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Generate a heatmap visualization
   */
  private async generateHeatmap(areaId: string, metric: string, options?: any): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      // Get area data
      const area = await this.storage.getItem('areas', areaId);
      if (!area) {
        throw new Error(`Area not found: ${areaId}`);
      }

      // Get properties in the area
      const properties = await this.storage.find('properties', { areaId });

      // Generate heatmap data based on the selected metric
      let heatmapData: any[] = [];

      switch (metric) {
        case 'property-value':
          heatmapData = properties.map(p => ({
            coordinates: p.location,
            intensity: p.landValue + p.improvementValue,
          }));
          break;
        case 'assessment-age':
          heatmapData = properties.map(p => ({
            coordinates: p.location,
            intensity: this.calculateDaysSinceAssessment(p.lastAssessmentDate),
          }));
          break;
        case 'improvements':
          heatmapData = properties.map(p => ({
            coordinates: p.location,
            intensity: (p.improvements || []).length,
          }));
          break;
        default:
          throw new Error(`Unsupported metric: ${metric}`);
      }

      // Create heatmap visualization
      const heatmap = {
        id: `heatmap-${Date.now()}`,
        areaId,
        metric,
        data: heatmapData,
        options: options || {},
        timestamp: new Date().toISOString(),
      };

      // Save heatmap data
      await this.storage.setItem('heatmaps', heatmap.id, heatmap);

      this.setStatus(AgentStatus.READY);
      return {
        heatmapId: heatmap.id,
        heatmapUrl: `/heatmaps/${heatmap.id}`,
        pointCount: heatmapData.length,
        heatmap,
      };
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Export map data in various formats
   */
  private async exportMapData(
    layerIds: string[],
    format: 'geojson' | 'shapefile' | 'csv',
    options?: any
  ): Promise<any> {
    this.setStatus(AgentStatus.WORKING);

    try {
      // Validate export format
      const validFormats = ['geojson', 'shapefile', 'csv'];
      if (!validFormats.includes(format)) {
        throw new Error(
          `Invalid export format: ${format}. Must be one of: ${validFormats.join(', ')}`
        );
      }

      // Get layers data
      const layers = [];
      for (const layerId of layerIds) {
        const layer = await this.storage.getItem('layers', layerId);
        if (layer) {
          layers.push(layer);
        } else {
          throw new Error(`Layer not found: ${layerId}`);
        }
      }

      // Create export job
      const exportJob = {
        id: `export-${Date.now()}`,
        layers: layers.map(l => l.id),
        format,
        options: options || {},
        status: 'completed',
        timestamp: new Date().toISOString(),
        url: `/exports/export-${Date.now()}.${format === 'shapefile' ? 'zip' : format}`,
      };

      // Save export job
      await this.storage.setItem('exports', exportJob.id, exportJob);

      this.setStatus(AgentStatus.READY);
      return exportJob;
    } catch (error) {
      this.setStatus(AgentStatus.ERROR);
      throw error;
    }
  }

  /**
   * Helper: Calculate days since assessment
   */
  private calculateDaysSinceAssessment(assessmentDate: string): number {
    if (!assessmentDate) {
      return 365; // Default to one year if no date
    }

    const assessment = new Date(assessmentDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - assessment.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}
