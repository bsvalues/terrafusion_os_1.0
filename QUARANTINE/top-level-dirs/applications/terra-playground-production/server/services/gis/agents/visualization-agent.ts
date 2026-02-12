/**
 * Visualization Agent
 *
 * This agent is responsible for dynamically generating and rendering layers,
 * managing the visualization stack, and ensuring smooth stacking and rendering
 * of multiple layers, including the Venn diagram effect.
 */

import { IStorage } from '../../../storage';
import { BaseGISAgent } from './base-gis-agent';
import { sql } from 'drizzle-orm';
import { db } from '../../../db';
import { AgentConfig, AgentCapability } from '../../agents/base-agent';

interface GISLayer {
  id: number;
  name: string;
  description: string | null;
  type: string;
  format: string | null;
  spatialReference: string | null;
  source: string | null;
  url: string | null;
  apiKey: string | null;
  metadata: unknown;
  table_name: string;
  feature_count: number;
  userId: number | null;
  createdAt: Date;
  updatedAt: Date;
  geometry_type: string;
  layer_type: string;
  style: unknown;
  visible: boolean;
  display_order: number;
  project_id: number;
}

interface MapProject {
  id: number;
  name: string;
  description: string | null;
  center_point: string | null;
  default_zoom: number | null;
  basemap: string | null;
  projection: string | null;
  bounds: string | null;
  background_color: string | null;
  settings: unknown;
  center: unknown;
  zoom: number;
  layers: unknown;
  isPublic: boolean | null;
  userId: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface VisualizationParams {
  projectId: number;
  options?: Record<string, unknown>;
}

interface StyleParams {
  layerId: number;
  style: Record<string, unknown>;
}

interface ThematicParams {
  layerId: number;
  attribute: string;
  method: 'categorized' | 'graduated' | 'heatmap' | 'choropleth';
  options?: Record<string, unknown>;
}

interface LayerGroupParams {
  layerIds: number[];
  groupOptions?: Record<string, unknown>;
}

interface VennDiagramParams {
  layerIds: number[];
  options?: Record<string, unknown>;
}

interface IStorage {
  getGISLayer(id: number): Promise<GISLayer | null>;
  getGISMapProject(id: number): Promise<MapProject | null>;
  getGISLayersByProject(projectId: number): Promise<GISLayer[]>;
  updateGISLayer(id: number, data: Partial<GISLayer>): Promise<GISLayer>;
  createGISLayer(data: Partial<GISLayer>): Promise<GISLayer>;
  createGISLayerGroup(data: { name: string; layers: number[]; options?: Record<string, unknown> }): Promise<{ id: number; name: string }>;
}

/**
 * Create a Visualization Agent
 * @param storage The storage implementation
 * @returns A new VisualizationAgent instance
 */
export function createVisualizationAgent(storage: IStorage) {
  const agentId = `visualization-agent-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  return new VisualizationAgent(storage, agentId);
}

class VisualizationAgent extends BaseGISAgent {
  private readonly DEFAULT_STYLES = {
    point: {
      radius: 6,
      fillColor: '#3388ff',
      color: '#fff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8,
    },
    line: {
      color: '#3388ff',
      weight: 3,
      opacity: 1,
    },
    polygon: {
      fillColor: '#3388ff',
      color: '#3388ff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.6,
    },
  };

  constructor(storage: IStorage, agentId: string) {
    const capabilities: AgentCapability[] = [
      {
        name: 'generateMapVisualization',
        description: 'Generate a complete map visualization with multiple layers',
        handler: async (params: VisualizationParams) => {
          return this.generateMapVisualization(params);
        }
      },
      {
        name: 'applyLayerStyle',
        description: 'Apply a style to a GIS layer',
        handler: async (params: StyleParams) => {
          return this.applyLayerStyle(params);
        }
      },
      {
        name: 'createThematicLayer',
        description: 'Create a thematic layer based on data attributes',
        handler: async (params: ThematicParams) => {
          return this.createThematicLayer(params);
        }
      },
      {
        name: 'createLayerGroup',
        description: 'Create a group of layers with synchronized visualization',
        handler: async (params: LayerGroupParams) => {
          return this.createLayerGroup(params);
        }
      },
      {
        name: 'generateVennDiagramLayers',
        description: 'Generate layers for a spatial Venn diagram visualization',
        handler: async (params: VennDiagramParams) => {
          return this.generateVennDiagramLayers(params);
        }
      }
    ];

    const config: AgentConfig = {
      id: agentId,
      name: 'Visualization Agent',
      description: 'Manages dynamic layer rendering and visualization effects',
      capabilities,
      permissions: ['gis:read', 'gis:write', 'gis:visualize']
    };

    super(storage, config);
  }

  public async initialize(): Promise<void> {
    try {
      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'INFO',
        subject: 'Agent Initialization',
        content: `Agent ${this.name} (${this.agentId}) initialized successfully`,
        status: 'completed'
      });

      await this.updateStatus('active', 100);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error initializing Visualization Agent:', errorMessage);
      
      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'ERROR',
        subject: 'Agent Initialization Failed',
        content: `Failed to initialize agent: ${errorMessage}`,
        status: 'error'
      });

      await this.updateStatus('error', 0);
      throw error;
    }
  }

  private async generateMapVisualization(params: VisualizationParams): Promise<Record<string, unknown>> {
    try {
      const { projectId, options = {} } = params;

      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const project = await this.storage.getGISMapProject(projectId);
      if (!project) {
        throw new Error(`Map project with ID ${projectId} not found`);
      }

      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'INFO',
        subject: 'Map Visualization',
        content: `Generating map visualization for project ${project.name}`,
        status: 'completed',
        metadata: { projectId, options }
      });

      const layers = await this.storage.getGISLayersByProject(projectId);
      if (!layers || layers.length === 0) {
        throw new Error(`No layers found for project ${projectId}`);
      }

      const visualizationLayers = await Promise.all(
        layers.map(async (layer: GISLayer) => {
          const style = layer.style || this.getDefaultStyle(layer.geometry_type);
          return {
            id: layer.id,
            name: layer.name,
            type: layer.layer_type,
            geometryType: layer.geometry_type,
            tableName: layer.table_name,
            visible: layer.visible,
            style,
            metadata: layer.metadata,
            order: layer.display_order,
          };
        })
      );

      visualizationLayers.sort((a, b) => (a.order || 0) - (b.order || 0));

      const visualizationSettings = {
        center: project.center_point ? JSON.parse(project.center_point) : [0, 0],
        zoom: project.default_zoom || 2,
        basemap: project.basemap || 'osm',
        projection: project.projection || 'EPSG:3857',
        maxBounds: project.bounds ? JSON.parse(project.bounds) : null,
        backgroundColor: options.backgroundColor || project.background_color || '#ffffff',
      };

      return {
        success: true,
        projectId,
        projectName: project.name,
        description: project.description,
        settings: visualizationSettings,
        layers: visualizationLayers,
        metadata: {
          layerCount: visualizationLayers.length,
          operation: 'generate_map_visualization',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error in generateMapVisualization:', errorMessage);
      
      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'ERROR',
        subject: 'Map Visualization Failed',
        content: `Failed to generate map visualization: ${errorMessage}`,
        status: 'error',
        metadata: { params }
      });

      throw error;
    }
  }

  private async applyLayerStyle(params: StyleParams): Promise<Record<string, unknown>> {
    try {
      const { layerId, style } = params;

      if (!layerId || !style) {
        throw new Error('Layer ID and style are required');
      }

      const layer = await this.storage.getGISLayer(layerId);
      if (!layer) {
        throw new Error(`Layer with ID ${layerId} not found`);
      }

      this.validateStyleForGeometryType(style, layer.geometry_type);

      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'INFO',
        subject: 'Layer Styling',
        content: `Applying style to layer ${layer.name}`,
        status: 'completed',
        metadata: { layerId, style }
      });

      await this.storage.updateGISLayer(layerId, { style });

      return {
        success: true,
        layerId,
        layerName: layer.name,
        style,
        metadata: {
          operation: 'apply_layer_style',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error in applyLayerStyle:', errorMessage);
      
      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'ERROR',
        subject: 'Layer Styling Failed',
        content: `Failed to apply layer style: ${errorMessage}`,
        status: 'error',
        metadata: { params }
      });

      throw error;
    }
  }

  private async createThematicLayer(params: ThematicParams): Promise<Record<string, unknown>> {
    try {
      const { layerId, attribute, method, options = {} } = params;

      if (!layerId || !attribute || !method) {
        throw new Error('Layer ID, attribute, and method are required');
      }

      const layer = await this.storage.getGISLayer(layerId);
      if (!layer) {
        throw new Error(`Layer with ID ${layerId} not found`);
      }

      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'INFO',
        subject: 'Thematic Layer Creation',
        content: `Creating thematic layer from ${layer.name} using ${method} method`,
        status: 'completed',
        metadata: { layerId, attribute, method, options }
      });

      const stats = await this.getAttributeStatistics(layer.table_name, attribute);
      let theme;

      switch (method) {
        case 'categorized':
          theme = this.generateCategorizedTheme(stats, options);
          break;
        case 'graduated':
          theme = this.generateGraduatedTheme(stats, options);
          break;
        case 'heatmap':
          theme = this.generateHeatmapTheme(stats, options);
          break;
        case 'choropleth':
          theme = this.generateChoroplethTheme(stats, options);
          break;
        default:
          throw new Error(`Unsupported thematic method: ${method}`);
      }

      const newLayer = await this.storage.createGISLayer({
        name: `${layer.name} (${method})`,
        type: 'thematic',
        geometry_type: layer.geometry_type,
        table_name: layer.table_name,
        style: theme,
        metadata: {
          baseLayerId: layerId,
          attribute,
          method,
          options
        }
      });

      return {
        success: true,
        layerId: newLayer.id,
        layerName: newLayer.name,
        theme,
        metadata: {
          operation: 'create_thematic_layer',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error in createThematicLayer:', errorMessage);
      
      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'ERROR',
        subject: 'Thematic Layer Creation Failed',
        content: `Failed to create thematic layer: ${errorMessage}`,
        status: 'error',
        metadata: { params }
      });

      throw error;
    }
  }

  private async createLayerGroup(params: LayerGroupParams): Promise<Record<string, unknown>> {
    try {
      const { layerIds, groupOptions = {} } = params;

      if (!layerIds || layerIds.length === 0) {
        throw new Error('At least one layer ID is required');
      }

      const layers = await Promise.all(
        layerIds.map(id => this.storage.getGISLayer(id))
      );

      if (layers.some(layer => !layer)) {
        throw new Error('One or more layers not found');
      }

      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'INFO',
        subject: 'Layer Group Creation',
        content: `Creating layer group with ${layers.length} layers`,
        status: 'completed',
        metadata: { layerIds, groupOptions }
      });

      const group = await this.storage.createGISLayerGroup({
        name: groupOptions.name || `Layer Group ${Date.now()}`,
        layers: layerIds,
        options: groupOptions
      });

      return {
        success: true,
        groupId: group.id,
        groupName: group.name,
        layers: layers.map(layer => ({
          id: layer.id,
          name: layer.name,
          type: layer.layer_type
        })),
        metadata: {
          operation: 'create_layer_group',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error in createLayerGroup:', errorMessage);
      
      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'ERROR',
        subject: 'Layer Group Creation Failed',
        content: `Failed to create layer group: ${errorMessage}`,
        status: 'error',
        metadata: { params }
      });

      throw error;
    }
  }

  private async generateVennDiagramLayers(params: VennDiagramParams): Promise<Record<string, unknown>> {
    try {
      const { layerIds, options = {} } = params;

      if (!layerIds || layerIds.length < 2 || layerIds.length > 3) {
        throw new Error('Venn diagram requires 2 or 3 layers');
      }

      const layers = await Promise.all(
        layerIds.map(id => this.storage.getGISLayer(id))
      );

      if (layers.some(layer => !layer)) {
        throw new Error('One or more layers not found');
      }

      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'INFO',
        subject: 'Venn Diagram Generation',
        content: `Generating Venn diagram with ${layers.length} layers`,
        status: 'completed',
        metadata: { layerIds, options }
      });

      const styles = this.generateVennDiagramStyles(layers.length);
      const intersectionLayers = [];

      if (layers.length === 2) {
        const intersectionLayer = await this.createIntersectionLayer(
          layers[0],
          layers[1],
          `${layers[0].name} ∩ ${layers[1].name}`,
          styles.intersection
        );
        intersectionLayers.push(intersectionLayer);
      } else {
        const tripleIntersectionLayer = await this.createTripleIntersectionLayer(
          layers[0],
          layers[1],
          layers[2],
          `${layers[0].name} ∩ ${layers[1].name} ∩ ${layers[2].name}`,
          styles.tripleIntersection
        );
        intersectionLayers.push(tripleIntersectionLayer);
      }

      return {
        success: true,
        layers: intersectionLayers.map(layer => ({
          id: layer.id,
          name: layer.name,
          type: layer.layer_type
        })),
        metadata: {
          operation: 'generate_venn_diagram',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error in generateVennDiagramLayers:', errorMessage);
      
      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'ERROR',
        subject: 'Venn Diagram Generation Failed',
        content: `Failed to generate Venn diagram: ${errorMessage}`,
        status: 'error',
        metadata: { params }
      });

      throw error;
    }
  }

  private getDefaultStyle(geometryType: string): Record<string, unknown> {
    switch (geometryType.toLowerCase()) {
      case 'point':
        return this.DEFAULT_STYLES.point;
      case 'linestring':
        return this.DEFAULT_STYLES.line;
      case 'polygon':
        return this.DEFAULT_STYLES.polygon;
      default:
        return this.DEFAULT_STYLES.point;
    }
  }

  private validateStyleForGeometryType(style: Record<string, unknown>, geometryType: string): void {
    const requiredProps = {
      point: ['radius', 'fillColor', 'color', 'weight', 'opacity', 'fillOpacity'],
      line: ['color', 'weight', 'opacity'],
      polygon: ['fillColor', 'color', 'weight', 'opacity', 'fillOpacity']
    };

    const props = requiredProps[geometryType.toLowerCase()] || requiredProps.point;
    const missingProps = props.filter(prop => !(prop in style));

    if (missingProps.length > 0) {
      throw new Error(`Missing required style properties for ${geometryType}: ${missingProps.join(', ')}`);
    }
  }

  private async getAttributeStatistics(tableName: string, attribute: string): Promise<Record<string, unknown>> {
    try {
      const result = await db.execute(sql`
        SELECT 
          MIN(${sql.identifier(attribute)}) as min_value,
          MAX(${sql.identifier(attribute)}) as max_value,
          AVG(${sql.identifier(attribute)}) as avg_value,
          COUNT(DISTINCT ${sql.identifier(attribute)}) as unique_values,
          COUNT(*) as total_count
        FROM 
          ${sql.identifier(tableName)}
        WHERE 
          ${sql.identifier(attribute)} IS NOT NULL
      `);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to get attribute statistics: ${error.message}`);
    }
  }

  private generateCategorizedTheme(stats: Record<string, unknown>, options: Record<string, unknown>): Record<string, unknown> {
    const colors = options.colors || ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
    const uniqueValues = stats.unique_values as number;
    const colorCount = Math.min(colors.length, uniqueValues);

    return {
      type: 'categorized',
      colors: colors.slice(0, colorCount),
      uniqueValues,
      ...options
    };
  }

  private generateGraduatedTheme(stats: Record<string, unknown>, options: Record<string, unknown>): Record<string, unknown> {
    const min = stats.min_value as number;
    const max = stats.max_value as number;
    const steps = options.steps || 5;
    const colors = options.colors || ['#ff0000', '#ffff00', '#00ff00'];

    const stepSize = (max - min) / steps;
    const breaks = Array.from({ length: steps + 1 }, (_, i) => min + i * stepSize);

    return {
      type: 'graduated',
      breaks,
      colors,
      min,
      max,
      ...options
    };
  }

  private generateHeatmapTheme(stats: Record<string, unknown>, options: Record<string, unknown>): Record<string, unknown> {
    return {
      type: 'heatmap',
      radius: options.radius || 10,
      blur: options.blur || 15,
      maxZoom: options.maxZoom || 18,
      max: options.max || 1,
      gradient: options.gradient || {
        0.4: '#ff0000',
        0.6: '#ffff00',
        0.8: '#00ff00',
        1.0: '#0000ff'
      }
    };
  }

  private generateChoroplethTheme(stats: Record<string, unknown>, options: Record<string, unknown>): Record<string, unknown> {
    const min = stats.min_value as number;
    const max = stats.max_value as number;
    const steps = options.steps || 5;
    const colors = options.colors || ['#ff0000', '#ffff00', '#00ff00'];

    const stepSize = (max - min) / steps;
    const breaks = Array.from({ length: steps + 1 }, (_, i) => min + i * stepSize);

    return {
      type: 'choropleth',
      breaks,
      colors,
      min,
      max,
      ...options
    };
  }

  private generateVennDiagramStyles(layerCount: number): Record<string, unknown> {
    const baseColors = ['#ff0000', '#00ff00', '#0000ff'];
    const colors = baseColors.slice(0, layerCount);

    return {
      intersection: {
        fillColor: '#ffff00',
        color: '#ff0000',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.6
      },
      tripleIntersection: {
        fillColor: '#ffffff',
        color: '#ff0000',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      },
      colors
    };
  }

  private async createIntersectionLayer(
    layerA: GISLayer,
    layerB: GISLayer,
    name: string,
    style: Record<string, unknown>
  ): Promise<GISLayer> {
    const result = await db.execute(sql`
      CREATE TABLE ${sql.identifier(`${name.toLowerCase().replace(/\s+/g, '_')}`)} AS
      SELECT 
        ST_Intersection(a.geometry, b.geometry) as geometry,
        a.properties as properties_a,
        b.properties as properties_b
      FROM 
        ${sql.identifier(layerA.table_name)} a,
        ${sql.identifier(layerB.table_name)} b
      WHERE 
        ST_Intersects(a.geometry, b.geometry)
    `);

    return this.storage.createGISLayer({
      name,
      type: 'intersection',
      geometry_type: layerA.geometry_type,
      table_name: `${name.toLowerCase().replace(/\s+/g, '_')}`,
      style,
      metadata: {
        sourceLayers: [layerA.id, layerB.id],
        operation: 'intersection'
      }
    });
  }

  private async createTripleIntersectionLayer(
    layerA: GISLayer,
    layerB: GISLayer,
    layerC: GISLayer,
    name: string,
    style: Record<string, unknown>
  ): Promise<GISLayer> {
    const result = await db.execute(sql`
      CREATE TABLE ${sql.identifier(`${name.toLowerCase().replace(/\s+/g, '_')}`)} AS
      SELECT 
        ST_Intersection(
          ST_Intersection(a.geometry, b.geometry),
          c.geometry
        ) as geometry,
        a.properties as properties_a,
        b.properties as properties_b,
        c.properties as properties_c
      FROM 
        ${sql.identifier(layerA.table_name)} a,
        ${sql.identifier(layerB.table_name)} b,
        ${sql.identifier(layerC.table_name)} c
      WHERE 
        ST_Intersects(a.geometry, b.geometry) AND
        ST_Intersects(ST_Intersection(a.geometry, b.geometry), c.geometry)
    `);

    return this.storage.createGISLayer({
      name,
      type: 'intersection',
      geometry_type: layerA.geometry_type,
      table_name: `${name.toLowerCase().replace(/\s+/g, '_')}`,
      style,
      metadata: {
        sourceLayers: [layerA.id, layerB.id, layerC.id],
        operation: 'triple_intersection'
      }
    });
  }

  public async shutdown(): Promise<void> {
    try {
      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'INFO',
        subject: 'Agent Shutdown',
        content: `Agent ${this.name} (${this.agentId}) shutting down`,
        status: 'completed'
      });

      await this.updateStatus('inactive', 0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error shutting down Visualization Agent:', errorMessage);
      throw error;
    }
  }
}
