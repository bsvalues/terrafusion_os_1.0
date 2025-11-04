/**
 * Spatial Query Agent
 *
 * This agent handles spatial operations like intersections, buffering, and overlays.
 * It receives requests from the frontend, processes them using PostGIS functions,
 * and returns results in GeoJSON or vector tile formats.
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
}

interface IntersectionParams {
  sourceLayerId: number;
  targetLayerId: number;
  options?: Record<string, unknown>;
}

interface BufferParams {
  layerId: number;
  distance: number;
  options?: Record<string, unknown>;
}

interface SpatialOverlayParams {
  sourceLayerId: number;
  targetLayerId: number;
  operation: 'union' | 'difference' | 'symmetric_difference';
  options?: Record<string, unknown>;
}

interface NearestNeighborParams {
  layerId: number;
  targetLayerId?: number;
  maxDistance?: number;
  maxResults?: number;
}

interface GeoJSONConversionParams {
  geoJSON: Record<string, unknown>;
  tableName: string;
  options?: Record<string, unknown>;
}

/**
 * Create a Spatial Query Agent
 * @param storage The storage implementation
 * @returns A new SpatialQueryAgent instance
 */
export function createSpatialQueryAgent(storage: IStorage) {
  const agentId = `spatial-query-agent-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  return new SpatialQueryAgent(storage, agentId);
}

class SpatialQueryAgent extends BaseGISAgent {
  constructor(storage: IStorage, agentId: string) {
    const capabilities: AgentCapability[] = [
      {
        name: 'performIntersection',
        description: 'Find the intersection between two geometries or layers',
        handler: async (params: IntersectionParams) => {
          return this.performIntersection(params);
        }
      },
      {
        name: 'createBuffer',
        description: 'Create a buffer around geometries',
        handler: async (params: BufferParams) => {
          return this.createBuffer(params);
        }
      },
      {
        name: 'performSpatialOverlay',
        description: 'Perform a spatial overlay operation (union, difference, etc.)',
        handler: async (params: SpatialOverlayParams) => {
          return this.performSpatialOverlay(params);
        }
      },
      {
        name: 'nearestNeighborAnalysis',
        description: 'Find nearest neighbors for points in a layer',
        handler: async (params: NearestNeighborParams) => {
          return this.nearestNeighborAnalysis(params);
        }
      },
      {
        name: 'convertGeoJSONToSQL',
        description: 'Convert GeoJSON to PostGIS SQL queries',
        handler: async (params: GeoJSONConversionParams) => {
          return this.convertGeoJSONToSQL(params);
        }
      }
    ];

    const config: AgentConfig = {
      id: agentId,
      name: 'Spatial Query Agent',
      description: 'Processes spatial operations like intersections, buffering, and overlays using PostGIS',
      capabilities,
      permissions: ['gis:read', 'gis:write', 'gis:analyze']
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
      console.error('Error initializing Spatial Query Agent:', errorMessage);
      
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

  private async performIntersection(params: IntersectionParams): Promise<Record<string, unknown>> {
    try {
      const { sourceLayerId, targetLayerId, options = {} } = params;

      if (!sourceLayerId || !targetLayerId) {
        throw new Error('Source and target layer IDs are required');
      }

      const sourceLayer = await this.storage.getGISLayer(sourceLayerId);
      const targetLayer = await this.storage.getGISLayer(targetLayerId);

      if (!sourceLayer || !targetLayer) {
        throw new Error('One or both layers do not exist');
      }

      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'INFO',
        subject: 'Spatial Operation',
        content: `Performing intersection between layers ${sourceLayer.name} and ${targetLayer.name}`,
        status: 'completed',
        metadata: { sourceLayerId, targetLayerId, options }
      });

      const result = await db.execute(sql`
        SELECT 
          source.id as source_id, 
          target.id as target_id,
          ST_AsGeoJSON(ST_Intersection(source.geometry, target.geometry)) as intersection_geom
        FROM 
          ${sql.identifier(sourceLayer.table_name)} source,
          ${sql.identifier(targetLayer.table_name)} target
        WHERE 
          ST_Intersects(source.geometry, target.geometry)
      `);

      return {
        success: true,
        message: `Successfully performed intersection between layers ${sourceLayer.name} and ${targetLayer.name}`,
        sourceLayer: sourceLayer.name,
        targetLayer: targetLayer.name,
        results: result.rows,
        metadata: {
          count: result.rows.length,
          operation: 'intersection',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error in performIntersection:', errorMessage);
      
      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'ERROR',
        subject: 'Spatial Operation Failed',
        content: `Intersection operation failed: ${errorMessage}`,
        status: 'error',
        metadata: { params }
      });

      throw error;
    }
  }

  private async createBuffer(params: BufferParams): Promise<Record<string, unknown>> {
    try {
      const { layerId, distance, options = {} } = params;

      if (!layerId || distance === undefined) {
        throw new Error('Layer ID and distance are required');
      }

      const layer = await this.storage.getGISLayer(layerId);
      if (!layer) {
        throw new Error('Layer does not exist');
      }

      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'INFO',
        subject: 'Spatial Operation',
        content: `Creating buffer of distance ${distance} around layer ${layer.name}`,
        status: 'completed',
        metadata: { layerId, distance, options }
      });

      const result = await db.execute(sql`
        SELECT 
          id,
          ST_AsGeoJSON(ST_Buffer(geometry, ${distance})) as buffered_geom
        FROM 
          ${sql.identifier(layer.table_name)}
      `);

      return {
        success: true,
        message: `Successfully created buffer around layer ${layer.name}`,
        layer: layer.name,
        results: result.rows,
        metadata: {
          count: result.rows.length,
          operation: 'buffer',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error in createBuffer:', errorMessage);
      
      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'ERROR',
        subject: 'Spatial Operation Failed',
        content: `Buffer operation failed: ${errorMessage}`,
        status: 'error',
        metadata: { params }
      });

      throw error;
    }
  }

  private async performSpatialOverlay(params: SpatialOverlayParams): Promise<Record<string, unknown>> {
    try {
      const { sourceLayerId, targetLayerId, operation, options = {} } = params;

      if (!sourceLayerId || !targetLayerId || !operation) {
        throw new Error('Source layer ID, target layer ID, and operation are required');
      }

      const sourceLayer = await this.storage.getGISLayer(sourceLayerId);
      const targetLayer = await this.storage.getGISLayer(targetLayerId);

      if (!sourceLayer || !targetLayer) {
        throw new Error('One or both layers do not exist');
      }

      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'INFO',
        subject: 'Spatial Operation',
        content: `Performing ${operation} between layers ${sourceLayer.name} and ${targetLayer.name}`,
        status: 'completed',
        metadata: { sourceLayerId, targetLayerId, operation, options }
      });

      let overlayFunction;
      switch (operation) {
        case 'union':
          overlayFunction = 'ST_Union';
          break;
        case 'difference':
          overlayFunction = 'ST_Difference';
          break;
        case 'symmetric_difference':
          overlayFunction = 'ST_SymDifference';
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      const result = await db.execute(sql`
        SELECT 
          source.id as source_id,
          target.id as target_id,
          ST_AsGeoJSON(${sql.identifier(overlayFunction)}(source.geometry, target.geometry)) as overlay_geom
        FROM 
          ${sql.identifier(sourceLayer.table_name)} source,
          ${sql.identifier(targetLayer.table_name)} target
        WHERE 
          ST_Intersects(source.geometry, target.geometry)
      `);

      return {
        success: true,
        message: `Successfully performed ${operation} between layers ${sourceLayer.name} and ${targetLayer.name}`,
        sourceLayer: sourceLayer.name,
        targetLayer: targetLayer.name,
        results: result.rows,
        metadata: {
          count: result.rows.length,
          operation,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error in performSpatialOverlay:', errorMessage);
      
      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'ERROR',
        subject: 'Spatial Operation Failed',
        content: `Overlay operation failed: ${errorMessage}`,
        status: 'error',
        metadata: { params }
      });

      throw error;
    }
  }

  private async nearestNeighborAnalysis(params: NearestNeighborParams): Promise<Record<string, unknown>> {
    try {
      const { layerId, targetLayerId, maxDistance, maxResults = 1 } = params;

      if (!layerId) {
        throw new Error('Layer ID is required');
      }

      const layer = await this.storage.getGISLayer(layerId);
      if (!layer) {
        throw new Error('Layer does not exist');
      }

      const targetLayer = targetLayerId ? await this.storage.getGISLayer(targetLayerId) : layer;
      if (!targetLayer) {
        throw new Error('Target layer does not exist');
      }

      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'INFO',
        subject: 'Spatial Analysis',
        content: `Performing nearest neighbor analysis on layer ${layer.name}`,
        status: 'completed',
        metadata: { layerId, targetLayerId, maxDistance, maxResults }
      });

      const distanceClause = maxDistance ? sql`AND ST_DWithin(source.geometry, target.geometry, ${maxDistance})` : sql``;
      const limitClause = sql`LIMIT ${maxResults}`;

      const result = await db.execute(sql`
        WITH ranked_neighbors AS (
          SELECT 
            source.id as source_id,
            target.id as target_id,
            ST_Distance(source.geometry, target.geometry) as distance,
            ROW_NUMBER() OVER (PARTITION BY source.id ORDER BY ST_Distance(source.geometry, target.geometry)) as rank
          FROM 
            ${sql.identifier(layer.table_name)} source,
            ${sql.identifier(targetLayer.table_name)} target
          WHERE 
            source.id != target.id
            ${distanceClause}
        )
        SELECT 
          source_id,
          target_id,
          distance
        FROM 
          ranked_neighbors
        WHERE 
          rank <= ${maxResults}
        ORDER BY 
          source_id, distance
      `);

      return {
        success: true,
        message: `Successfully performed nearest neighbor analysis on layer ${layer.name}`,
        layer: layer.name,
        targetLayer: targetLayer.name,
        results: result.rows,
        metadata: {
          count: result.rows.length,
          operation: 'nearest_neighbor',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error in nearestNeighborAnalysis:', errorMessage);
      
      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'ERROR',
        subject: 'Spatial Analysis Failed',
        content: `Nearest neighbor analysis failed: ${errorMessage}`,
        status: 'error',
        metadata: { params }
      });

      throw error;
    }
  }

  private async convertGeoJSONToSQL(params: GeoJSONConversionParams): Promise<Record<string, unknown>> {
    try {
      const { geoJSON, tableName, options = {} } = params;

      if (!geoJSON || !tableName) {
        throw new Error('GeoJSON and table name are required');
      }

      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'INFO',
        subject: 'Data Conversion',
        content: `Converting GeoJSON to SQL for table ${tableName}`,
        status: 'completed',
        metadata: { tableName, options }
      });

      // This is a simplified implementation
      // In a real implementation, you would need to handle different geometry types,
      // coordinate systems, and other GeoJSON properties
      const sql = `
        INSERT INTO ${tableName} (geometry, properties)
        VALUES (
          ST_GeomFromGeoJSON(${JSON.stringify(geoJSON.geometry)}),
          ${JSON.stringify(geoJSON.properties)}
        )
      `;

      return {
        success: true,
        message: `Successfully converted GeoJSON to SQL for table ${tableName}`,
        sql,
        metadata: {
          operation: 'geojson_to_sql',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error in convertGeoJSONToSQL:', errorMessage);
      
      await this.createAgentMessage({
        messageId: crypto.randomUUID(),
        senderAgentId: this.agentId,
        messageType: 'ERROR',
        subject: 'Data Conversion Failed',
        content: `GeoJSON to SQL conversion failed: ${errorMessage}`,
        status: 'error',
        metadata: { params }
      });

      throw error;
    }
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
      console.error('Error shutting down Spatial Query Agent:', errorMessage);
      throw error;
    }
  }
}
