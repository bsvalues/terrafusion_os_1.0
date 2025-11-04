/**
 * GIS Storage Implementation
 *
 * This file contains the database implementation for GIS-related storage operations.
 * It uses Drizzle ORM to interact with the PostgreSQL database.
 */

import {
  db,
  gisLayersTable,
  gisFeatureCollectionsTable,
  gisMapProjectsTable,
  etlJobsTable,
  gisAgentTasksTable,
  agentMessagesTable,
  spatialEventsTable,
} from './db';
import { IStorage } from './storage';
import { eq, and, like, desc, asc } from 'drizzle-orm';
import {
  GISLayer,
  InsertGISLayer,
  GISFeatureCollection,
  InsertGISFeatureCollection,
  GISMapProject,
  InsertGISMapProject,
  ETLJob,
  InsertETLJob,
  GISAgentTask,
  InsertGISAgentTask,
  AgentMessage,
  InsertAgentMessage,
  SpatialEvent,
  InsertSpatialEvent,
} from '@shared/gis-schema';

/**
 * Implements GIS-related storage methods using Drizzle ORM and PostgreSQL
 * @param storage - The existing storage implementation
 */
export async function implementGISStorage(storage: IStorage): Promise<void> {
  // GIS Layer methods
  storage.createGISLayer = async (layer: InsertGISLayer): Promise<GISLayer> => {
    const [result] = await db.insert(gisLayersTable).values(layer).returning();
    return result;
  };

  storage.getGISLayer = async (id: number): Promise<GISLayer | undefined> => {
    const [result] = await db.select().from(gisLayersTable).where(eq(gisLayersTable.id, id));
    return result;
  };

  storage.getGISLayers = async (filters?: {
    type?: string;
    userId?: number;
  }): Promise<GISLayer[]> => {
    let query = db.select().from(gisLayersTable);

    if (filters) {
      const conditions = [];

      if (filters.type) {
        conditions.push(eq(gisLayersTable.type, filters.type));
      }

      if (filters.userId) {
        conditions.push(eq(gisLayersTable.userId, filters.userId));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }

    return await query.orderBy(desc(gisLayersTable.createdAt));
  };

  storage.updateGISLayer = async (
    id: number,
    updates: Partial<InsertGISLayer>
  ): Promise<GISLayer | undefined> => {
    const [result] = await db
      .update(gisLayersTable)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(gisLayersTable.id, id))
      .returning();
    return result;
  };

  storage.deleteGISLayer = async (id: number): Promise<boolean> => {
    const result = await db.delete(gisLayersTable).where(eq(gisLayersTable.id, id));
    return result.rowCount > 0;
  };

  // GIS Feature Collection methods
  storage.createGISFeatureCollection = async (
    collection: InsertGISFeatureCollection
  ): Promise<GISFeatureCollection> => {
    const [result] = await db.insert(gisFeatureCollectionsTable).values(collection).returning();
    return result;
  };

  storage.getGISFeatureCollection = async (
    id: number
  ): Promise<GISFeatureCollection | undefined> => {
    const [result] = await db
      .select()
      .from(gisFeatureCollectionsTable)
      .where(eq(gisFeatureCollectionsTable.id, id));
    return result;
  };

  storage.getGISFeatureCollectionsByLayer = async (
    layerId: number
  ): Promise<GISFeatureCollection[]> => {
    return await db
      .select()
      .from(gisFeatureCollectionsTable)
      .where(eq(gisFeatureCollectionsTable.layerId, layerId));
  };

  storage.updateGISFeatureCollection = async (
    id: number,
    updates: Partial<InsertGISFeatureCollection>
  ): Promise<GISFeatureCollection | undefined> => {
    const [result] = await db
      .update(gisFeatureCollectionsTable)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(gisFeatureCollectionsTable.id, id))
      .returning();
    return result;
  };

  storage.deleteGISFeatureCollection = async (id: number): Promise<boolean> => {
    const result = await db
      .delete(gisFeatureCollectionsTable)
      .where(eq(gisFeatureCollectionsTable.id, id));
    return result.rowCount > 0;
  };

  // GIS Map Project methods
  storage.createGISMapProject = async (project: InsertGISMapProject): Promise<GISMapProject> => {
    const [result] = await db.insert(gisMapProjectsTable).values(project).returning();
    return result;
  };

  storage.getGISMapProject = async (id: number): Promise<GISMapProject | undefined> => {
    const [result] = await db
      .select()
      .from(gisMapProjectsTable)
      .where(eq(gisMapProjectsTable.id, id));
    return result;
  };

  storage.getGISMapProjects = async (userId?: number): Promise<GISMapProject[]> => {
    let query = db.select().from(gisMapProjectsTable);

    if (userId) {
      query = query.where(eq(gisMapProjectsTable.userId, userId));
    }

    return await query.orderBy(desc(gisMapProjectsTable.updatedAt));
  };

  storage.getPublicGISMapProjects = async (): Promise<GISMapProject[]> => {
    return await db
      .select()
      .from(gisMapProjectsTable)
      .where(eq(gisMapProjectsTable.isPublic, true))
      .orderBy(desc(gisMapProjectsTable.updatedAt));
  };

  storage.updateGISMapProject = async (
    id: number,
    updates: Partial<InsertGISMapProject>
  ): Promise<GISMapProject | undefined> => {
    const [result] = await db
      .update(gisMapProjectsTable)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(gisMapProjectsTable.id, id))
      .returning();
    return result;
  };

  storage.deleteGISMapProject = async (id: number): Promise<boolean> => {
    const result = await db.delete(gisMapProjectsTable).where(eq(gisMapProjectsTable.id, id));
    return result.rowCount > 0;
  };

  // ETL Job methods
  storage.createETLJob = async (job: InsertETLJob): Promise<ETLJob> => {
    const [result] = await db.insert(etlJobsTable).values(job).returning();
    return result;
  };

  storage.getETLJob = async (id: number): Promise<ETLJob | undefined> => {
    const [result] = await db.select().from(etlJobsTable).where(eq(etlJobsTable.id, id));
    return result;
  };

  storage.getETLJobs = async (userId?: number): Promise<ETLJob[]> => {
    let query = db.select().from(etlJobsTable);

    if (userId) {
      query = query.where(eq(etlJobsTable.userId, userId));
    }

    return await query.orderBy(desc(etlJobsTable.createdAt));
  };

  storage.updateETLJob = async (
    id: number,
    updates: Partial<ETLJob>
  ): Promise<ETLJob | undefined> => {
    const [result] = await db
      .update(etlJobsTable)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(etlJobsTable.id, id))
      .returning();
    return result;
  };

  // GIS Agent Task methods
  storage.createGISAgentTask = async (task: InsertGISAgentTask): Promise<GISAgentTask> => {
    const [result] = await db.insert(gisAgentTasksTable).values(task).returning();
    return result;
  };

  storage.getGISAgentTask = async (id: number): Promise<GISAgentTask | undefined> => {
    const [result] = await db
      .select()
      .from(gisAgentTasksTable)
      .where(eq(gisAgentTasksTable.id, id));
    return result;
  };

  storage.getGISAgentTasks = async (agentId?: string, status?: string): Promise<GISAgentTask[]> => {
    let query = db.select().from(gisAgentTasksTable);
    const conditions = [];

    if (agentId) {
      conditions.push(eq(gisAgentTasksTable.agentId, agentId));
    }

    if (status) {
      conditions.push(eq(gisAgentTasksTable.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(gisAgentTasksTable.startTime));
  };

  storage.updateGISAgentTask = async (
    id: number,
    updates: Partial<GISAgentTask>
  ): Promise<GISAgentTask | undefined> => {
    const [result] = await db
      .update(gisAgentTasksTable)
      .set({
        ...updates,
        ...(updates.status === 'COMPLETED' || updates.status === 'FAILED'
          ? { endTime: new Date() }
          : {}),
      })
      .where(eq(gisAgentTasksTable.id, id))
      .returning();
    return result;
  };

  // Agent Message methods
  storage.createAgentMessage = async (message: any): Promise<AgentMessage> => {
    try {
      // Generate a fallback ID immediately to ensure it's never null
      const fallbackId = `system_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      );

      // Check which schema format the message is in
      if ('senderAgentId' in message || 'messageType' in message) {
        // Convert from main schema format to GIS schema format
        // Enhanced logic to ensure agent_id is never null
        // Use string check to catch empty strings as well
        let agentId = message.senderAgentId || message.agentId || message.agent_id || '';

        // If agentId is empty, null, undefined, or an invalid string, use fallback
        if (!agentId || agentId === 'null' || agentId === 'undefined' || agentId.trim() === '') {
          agentId = fallbackId;
          }

        // Extra validation - ensure agent_id is a valid string
        if (typeof agentId !== 'string') {
          agentId = String(agentId);
        }

        // Log the message and agent ID to help with debugging
        // Create a fresh object to avoid any reference issues
        const adaptedMessage = {
          agent_id: agentId, // This is guaranteed to be a non-empty string now
          type: message.messageType || 'INFO',
          content:
            typeof message.content === 'object'
              ? JSON.stringify(message.content)
              : message.content || message.subject || 'No content provided',
          metadata: {
            messageId: message.messageId || `msg-${Date.now()}`,
            conversationId: message.conversationId,
            receiverAgentId: message.receiverAgentId,
            priority: message.priority || 'NORMAL',
            status: message.status || 'pending',
            subject: message.subject || 'No subject',
            contextData: message.contextData || {},
            entityType: message.entityType || 'UNKNOWN',
            entityId: message.entityId || `entity-${Date.now()}`,
          },
        };

        );

        // Double-check before insert that agent_id is present
        if (!adaptedMessage.agent_id) {
          adaptedMessage.agent_id = `emergency_${Date.now()}`;
        }

        const [result] = await db.insert(agentMessagesTable).values(adaptedMessage).returning();
        return result;
      } else {
        // Standard GIS schema format
        // Also ensure agent_id is never null in this format
        const fallbackId = `system_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

        // Apply the same agent_id validation and fallback here
        let agentId = message.agent_id || message.agentId || '';

        // If agentId is empty, null, undefined, or an invalid string, use fallback
        if (!agentId || agentId === 'null' || agentId === 'undefined' || agentId.trim() === '') {
          agentId = fallbackId;
          }

        // Create a fresh object to avoid any reference issues
        const messageWithAgentId = {
          ...message,
          agent_id: agentId,
        };

        );

        // Double-check before insert that agent_id is present
        if (!messageWithAgentId.agent_id) {
          messageWithAgentId.agent_id = `emergency_${Date.now()}`;
        }

        const [result] = await db.insert(agentMessagesTable).values(messageWithAgentId).returning();
        return result;
      }
    } catch (error) {
      console.error('Error creating agent message:', error);
      throw error;
    }
  };

  storage.getAgentMessage = async (id: number): Promise<AgentMessage | undefined> => {
    const [result] = await db
      .select()
      .from(agentMessagesTable)
      .where(eq(agentMessagesTable.id, id));
    return result;
  };

  storage.getAgentMessagesByParent = async (parentId: number): Promise<AgentMessage[]> => {
    return await db
      .select()
      .from(agentMessagesTable)
      .where(eq(agentMessagesTable.parentId, parentId))
      .orderBy(asc(agentMessagesTable.createdAt));
  };

  storage.getAgentMessagesByAgent = async (agentId: string): Promise<AgentMessage[]> => {
    return await db
      .select()
      .from(agentMessagesTable)
      .where(eq(agentMessagesTable.agentId, agentId))
      .orderBy(desc(agentMessagesTable.createdAt));
  };

  // Spatial Event methods
  storage.createSpatialEvent = async (event: InsertSpatialEvent): Promise<SpatialEvent> => {
    const [result] = await db.insert(spatialEventsTable).values(event).returning();
    return result;
  };

  storage.getSpatialEvents = async (
    layerId?: number,
    type?: string,
    userId?: number
  ): Promise<SpatialEvent[]> => {
    let query = db.select().from(spatialEventsTable);
    const conditions = [];

    if (layerId) {
      conditions.push(eq(spatialEventsTable.layerId, layerId));
    }

    if (type) {
      conditions.push(eq(spatialEventsTable.type, type));
    }

    if (userId) {
      conditions.push(eq(spatialEventsTable.userId, userId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(spatialEventsTable.createdAt));
  };
}

