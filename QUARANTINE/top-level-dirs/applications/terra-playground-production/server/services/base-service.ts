/**
 * Base Service Class
 *
 * This serves as the foundation for all services in the TaxI_AI system.
 * It provides common functionality and consistent service patterns.
 */

import { IStorage } from '../storage';
import { MCPService } from './mcp';
import { LLMService } from './llm-service';

export interface ServiceContext {
  userId?: number;
  timestamp?: Date;
  requestId?: string;
  ipAddress?: string;
  source?: string;
  details?: Record<string, any>;
}

export abstract class BaseService {
  protected storage: IStorage;
  protected mcpService?: MCPService;
  protected llmService?: LLMService;

  constructor(storage: IStorage, mcpService?: MCPService, llmService?: LLMService) {
    this.storage = storage;
    this.mcpService = mcpService;
    this.llmService = llmService;
  }

  /**
   * Log an operation for auditing purposes
   */
  protected async logOperation(
    action: string,
    entityType: string,
    details?: any,
    context?: ServiceContext
  ): Promise<void> {
    try {
      await this.storage.createAuditLog({
        userId: context?.userId || null,
        action,
        entityType,
        entityId: details?.id?.toString() || null,
        details,
        ipAddress: context?.ipAddress || null,
      });
    } catch (error) {
      console.error(`Failed to log operation ${action} on ${entityType}:`, error);
    }
  }

  /**
   * Make a request to an AI model for assistance with a task
   */
  protected async getAIAssistance(
    prompt: string,
    systemPrompt?: string,
    options?: Record<string, any>
  ): Promise<string> {
    if (!this.llmService) {
      throw new Error('LLM service not initialized in this service instance');
    }

    try {
      // Using the generateText method which should be implemented in LLMService
      if (typeof this.llmService.generateText === 'function') {
        return await this.llmService.generateText(prompt, systemPrompt, options);
      } else {
        throw new Error('generateText method not available in LLMService');
      }
    } catch (error) {
      console.error('Error getting AI assistance:', error);
      throw new Error(`Failed to get AI assistance: ${error.message}`);
    }
  }

  /**
   * Execute an MCP command through the MCP service
   */
  protected async executeMCPCommand(
    command: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    if (!this.mcpService) {
      throw new Error('MCP service not initialized in this service instance');
    }

    try {
      return await this.mcpService.executeCommand(command, params);
    } catch (error) {
      console.error(`Error executing MCP command ${command}:`, error);
      throw new Error(`Failed to execute MCP command: ${error.message}`);
    }
  }
}
