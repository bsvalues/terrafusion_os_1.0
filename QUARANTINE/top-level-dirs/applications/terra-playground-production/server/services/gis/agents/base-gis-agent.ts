/**
 * Base GIS Agent
 *
 * This abstract class serves as the foundation for all GIS agents in the system.
 * It extends the BaseAgent class with GIS-specific functionality.
 */

import { BaseAgent, AgentConfig } from '../../agents/base-agent';
import { IStorage } from '../../../storage';
import { MCPService } from '../../mcp';
import { InsertAgentMessage, InsertSpatialEvent } from '../../../../shared/gis-schema';

/**
 * Interface for agent messages
 */
export interface AgentMessage {
  messageId: string;
  senderAgentId: string;
  messageType: string;
  subject?: string;
  content: string;
  status?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Interface for GIS operation log
 */
export interface GISOperationLog {
  operation: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Interface for spatial events
 */
export interface SpatialEvent {
  type: string;
  agent_id: string;
  geometry: string;
  details: string;
  timestamp: string;
}

/**
 * Abstract base class for GIS agents
 */
export abstract class BaseGISAgent extends BaseAgent {
  constructor(storage: IStorage, config: AgentConfig) {
    // Create a minimal mock MCPService if it's not needed for GIS agents
    const mcpService = new MCPService(storage);

    super(storage, mcpService, config);
  }

  /**
   * Initialize the agent
   */
  public abstract initialize(): Promise<void>;

  /**
   * Create an agent message in the storage system
   * @param message AgentMessage object
   */
  protected async createAgentMessage(message: Partial<InsertAgentMessage>): Promise<any> {
    try {
      const fullMessage: InsertAgentMessage = {
        agentId: message.agentId || this.agentId,
        type: message.type || 'INFO',
        content: typeof message.content === 'string' ? message.content : (message.content ? String(message.content) : ''),
        parentId: message.parentId,
        metadata: message.metadata && typeof message.metadata === 'object' ? message.metadata : undefined,
      };
      return await this.storage.createAgentMessage(fullMessage);
    } catch (error) {
      console.error(`Error creating agent message for ${this.name}:`, error);
      return null;
    }
  }

  /**
   * Log GIS operation
   * @param operation Operation name
   * @param details Optional details
   */
  protected async logGISOperation(operation: string, details: Record<string, unknown> = {}): Promise<void> {
    try {
      await this.createAgentMessage({
        agentId: this.agentId,
        type: 'INFO',
        content: `GIS Operation: ${operation}`,
        metadata: details,
      });
    } catch (error) {
      console.error(`Error logging GIS operation for ${this.name}:`, error);
    }
  }

  /**
   * Record a spatial event
   * @param eventType Event type
   * @param geometry Geometry object
   * @param details Optional details
   */
  protected async recordSpatialEvent(
    eventType: string,
    geometry: unknown,
    details: Record<string, unknown> = {}
  ): Promise<any> {
    try {
      const event: InsertSpatialEvent = {
        type: eventType,
        details: { agentName: this.name, ...details },
        metadata: { geometry },
      };
      if (typeof this.storage.createSpatialEvent === 'function') {
        return await this.storage.createSpatialEvent(event);
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Error recording spatial event for ${this.name}:`, error);
      return null;
    }
  }

  /**
   * Get recent agent messages
   * @param limit Number of messages to retrieve
   */
  protected async getRecentMessages(limit: number = 10): Promise<any[]> {
    try {
      // Get recent messages for this agent
      if (typeof this.storage.getAgentMessagesByAgent === 'function') {
        return await this.storage.getAgentMessagesByAgent(this.agentId);
      } else {
        return [];
      }
    } catch (error) {
      console.error(`Error getting recent messages for ${this.name}:`, error);
      return [];
    }
  }
}
