/**
 * Data Normalization Agent
 *
 * This agent is responsible for normalizing and cleaning GIS data.
 * It can detect and fix common data quality issues in spatial datasets.
 */

import { v4 as uuidv4 } from 'uuid';
import { IStorage } from '../../../storage';
import { BaseGISAgent } from './base-gis-agent';
import { GISTaskType } from '../agent-orchestration-service';
import { AgentConfig, AgentCapability } from '../../agents/base-agent';

// Core data types
interface Dataset {
  features: {
    properties: Record<string, unknown>;
    geometry: {
      type: string;
      coordinates: number[][];
    };
  }[];
  type: string;
  coordinates?: number[][];
  attributes?: Record<string, unknown>;
  geometry?: Record<string, unknown>;
}

interface CleaningOptions {
  fixCoordinates?: boolean;
  fixAttributes?: boolean;
  fixGeometry?: boolean;
}

interface CleaningResult {
  cleanedDataset: Dataset;
  changes: Record<string, unknown>;
  cleanedAt: Date;
  summary: {
    totalChanges: number;
    changesByType: Record<string, number>;
  };
}

// Type guards
function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(item => typeof item === 'number');
}

function isNumberArray2D(value: unknown): value is number[][] {
  return Array.isArray(value) && value.every(item => isNumberArray(item));
}

export class DataNormalizationAgent extends BaseGISAgent {
  private isInitialized: boolean;

  constructor(storage: IStorage) {
    const capabilities: AgentCapability[] = [
      {
        name: 'detect-data-anomalies',
        description: 'Detect anomalies in GIS data',
        handler: async (params: any) => {
          // Implementation will be added later
          return { success: true };
        }
      },
      {
        name: 'fix-coordinate-issues',
        description: 'Fix coordinate-related issues in GIS data',
        handler: async (params: any) => {
          // Implementation will be added later
          return { success: true };
        }
      },
      {
        name: 'normalize-attribute-names',
        description: 'Normalize attribute names in GIS data',
        handler: async (params: any) => {
          // Implementation will be added later
          return { success: true };
        }
      },
      {
        name: 'standardize-data-types',
        description: 'Standardize data types in GIS data',
        handler: async (params: any) => {
          // Implementation will be added later
          return { success: true };
        }
      },
      {
        name: 'remove-duplicates',
        description: 'Remove duplicate features from GIS data',
        handler: async (params: any) => {
          // Implementation will be added later
          return { success: true };
        }
      },
      {
        name: 'fill-missing-values',
        description: 'Fill missing values in GIS data',
        handler: async (params: any) => {
          // Implementation will be added later
          return { success: true };
        }
      }
    ];

    const config: AgentConfig = {
      id: uuidv4(),
      name: 'Data Normalization Agent',
      description: 'Normalizes and cleans GIS data to ensure quality and consistency',
      capabilities,
      permissions: ['read:gis', 'write:gis']
    };
    super(storage, config);
    this.isInitialized = false;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.createAgentMessage({
        messageId: uuidv4(),
        senderAgentId: this.agentId,
        messageType: 'INFO',
        subject: 'Agent Initialization',
        content: `Agent ${this.name} (${this.agentId}) initialized`,
        status: 'completed'
      });

      await this.updateStatus('active', 100);
      this.isInitialized = true;
      console.log(`Data Normalization Agent ${this.agentId} initialized successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Failed to initialize ${this.name} (${this.agentId}): ${errorMessage}`);
      await this.updateStatus('error', 0);
      throw error;
    }
  }

  public async processTask(task: { id: string; taskType: GISTaskType; data: unknown }): Promise<Record<string, unknown>> {
    console.log(`Processing task ${task.id}...`);

    try {
      await this.logMessage('INFO', `Processing task ${task.id}: ${task.taskType}`);

      if (!task.data) {
        throw new Error('Task data is required');
      }

      let result: Record<string, unknown>;

      switch (task.taskType) {
        case GISTaskType.DATA_CLEANING:
          const cleaningResult = await this.cleanData(task.data as { dataset: Dataset; options?: Partial<CleaningOptions> });
          result = {
            cleanedDataset: cleaningResult.cleanedDataset,
            changes: cleaningResult.changes,
            cleanedAt: cleaningResult.cleanedAt,
            summary: cleaningResult.summary
          };
          break;
        default:
          throw new Error(`Unsupported task type: ${task.taskType}`);
      }

      await this.logMessage('INFO', `Task ${task.id} completed successfully`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await this.logMessage('ERROR', `Task ${task.id} failed: ${errorMessage}`);
      throw error;
    }
  }

  private async cleanData(data: { dataset: Dataset; options?: Partial<CleaningOptions> }): Promise<CleaningResult> {
    const { dataset, options = {} } = data;
    const changes: Record<string, unknown> = {};
    const cleanedDataset = { ...dataset };

    try {
      if (options.fixCoordinates && dataset.coordinates) {
        const coordinates = dataset.coordinates;
        if (isNumberArray2D(coordinates)) {
          const fixedCoordinates = coordinates.map(coord => coord.map(val => Number(val)));
          cleanedDataset.coordinates = fixedCoordinates;
          changes.coordinates = {
            original: dataset.coordinates,
            fixed: fixedCoordinates
          };
        }
      }

      if (options.fixAttributes && dataset.attributes) {
        const attributes = dataset.attributes;
        const fixedAttributes = Object.entries(attributes).reduce((acc, [key, value]) => {
          if (typeof value === 'number') {
            acc[key] = [value];
          } else if (isNumberArray(value)) {
            acc[key] = value.map(v => Number(v));
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, unknown>);
        cleanedDataset.attributes = fixedAttributes;
        changes.attributes = {
          original: dataset.attributes,
          fixed: fixedAttributes
        };
      }

      if (options.fixGeometry && dataset.geometry) {
        const geometry = dataset.geometry;
        const fixedGeometry = Object.entries(geometry).reduce((acc, [key, value]) => {
          if (isNumberArray(value)) {
            acc[key] = value.map(v => Number(v));
          } else if (typeof value === 'number') {
            acc[key] = [value];
          } else {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, unknown>);
        cleanedDataset.geometry = fixedGeometry;
        changes.geometry = {
          original: dataset.geometry,
          fixed: fixedGeometry
        };
      }

      const summary = {
        totalChanges: Object.keys(changes).length,
        changesByType: Object.keys(changes).reduce((acc, key) => {
          const change = changes[key] as Record<string, unknown>;
          acc[key] = Object.keys(change).length;
          return acc;
        }, {} as Record<string, number>)
      };

      return {
        cleanedDataset,
        changes,
        cleanedAt: new Date(),
        summary
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to clean data: ${errorMessage}`);
    }
  }

  private async logMessage(type: string, content: string): Promise<void> {
    try {
      await this.createAgentMessage({
        messageId: uuidv4(),
        senderAgentId: this.agentId,
        messageType: type,
        subject: 'Agent Message',
        content,
        status: 'completed'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Failed to log message: ${errorMessage}`);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      await this.logMessage('INFO', `Agent ${this.name} (${this.agentId}) shutting down`);
      await this.updateStatus('inactive', 0);
      this.isInitialized = false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Failed to shutdown agent: ${errorMessage}`);
      throw error;
    }
  }
}

/**
 * Create a new Data Normalization Agent
 * @param storage The storage implementation
 * @returns A new Data Normalization Agent
 */
export function createDataNormalizationAgent(storage: IStorage): DataNormalizationAgent {
  return new DataNormalizationAgent(storage);
}

