/**
 * Initialize GIS Agents
 *
 * This module initializes and registers GIS agents with the orchestration service.
 */

import { IStorage } from '../../storage';
import { GISAgentOrchestrationService } from './agent-orchestration-service';
import { createSchemaConversionAgent } from './agents/schema-conversion-agent';
import { createDataNormalizationAgent } from './agents/data-normalization-agent';
import { createSpatialQueryAgent } from './agents/spatial-query-agent';
import { createDataConversionAgent } from './agents/data-conversion-agent';
import { createVisualizationAgent } from './agents/visualization-agent';
import { createAIInsightsAgent } from './agents/ai-insights-agent';

/**
 * Initialize GIS agents and register them with the orchestration service
 * @param storage The storage implementation
 * @param orchestrationService The GIS agent orchestration service
 */
export async function initializeGISAgents(
  storage: IStorage,
  orchestrationService: GISAgentOrchestrationService
): Promise<void> {
  try {
    // Initialize orchestration service first
    await orchestrationService.initialize();

    // Create and register schema conversion agent
    const schemaConversionAgent = createSchemaConversionAgent(storage);
    await schemaConversionAgent.initialize();
    orchestrationService.registerAgent(schemaConversionAgent);

    // Create and register data normalization agent
    const dataNormalizationAgent = createDataNormalizationAgent(storage);
    await dataNormalizationAgent.initialize();
    orchestrationService.registerAgent(dataNormalizationAgent);

    // Create and register spatial query agent
    const spatialQueryAgent = createSpatialQueryAgent(storage);
    await spatialQueryAgent.initialize();
    orchestrationService.registerAgent(spatialQueryAgent);

    // Create and register data conversion agent
    const dataConversionAgent = createDataConversionAgent(storage);
    await dataConversionAgent.initialize();
    orchestrationService.registerAgent(dataConversionAgent);

    // Create and register visualization agent
    const visualizationAgent = createVisualizationAgent(storage);
    await visualizationAgent.initialize();
    orchestrationService.registerAgent(visualizationAgent);

    // Create and register AI insights agent
    const aiInsightsAgent = createAIInsightsAgent(storage);
    await aiInsightsAgent.initialize();
    orchestrationService.registerAgent(aiInsightsAgent);
  } catch (error) {
    console.error('Failed to initialize GIS agents:', error);
    throw error;
  }
}

/**
 * Initialize GIS agents with a new orchestration service instance
 * @param storage The storage implementation
 * @returns The initialized GIS agent orchestration service
 */
export async function initializeGISAgentsWithService(
  storage: IStorage
): Promise<GISAgentOrchestrationService> {
  const orchestrationService = GISAgentOrchestrationService.getInstance(storage);
  await initializeGISAgents(storage, orchestrationService);
  return orchestrationService;
}
