/**
 * Master Control Program Configuration
 * 
 * This module defines the configuration settings for the Master Control Program (MCP)
 * which is the central coordination component of the multi-agent system.
 */

/**
 * MCP Configuration
 */
export const MCP_CONFIG = {
  // Basic settings
  maxAgents: 20,
  messageTimeout: 30000, // 30 seconds
  maxRetries: 3,
  logMessages: true,
  
  // Throttling to prevent overload
  throttleRequests: false,
  throttleLimit: 10, // Max requests per source per second
  
  // System health monitoring
  healthCheckInterval: 60000, // 1 minute
  
  // Agent management
  defaultAgentTimeout: 5000, // 5 seconds
  
  // Experience collection
  experienceCollectionEnabled: true,
  maxExperiencesPerAgent: 1000,
  
  // Messaging
  priorityLevels: {
    high: 1,
    medium: 2,
    low: 3
  },
  
  // Performance optimization
  useWorkerThreads: false, // Enable for production
  inMemoryBufferSize: 100, // Number of messages to keep in memory
  
  // Default agent-specific settings
  valuationAgentSettings: {
    confidenceThreshold: 0.7,
    maxPropertyComps: 5,
    detailLevel: 'high'
  },
  
  dataCleanerAgentSettings: {
    validationLevel: 'strict',
    automaticCorrection: true,
    outlierDetectionEnabled: true
  },
  
  reportingAgentSettings: {
    maxReportLength: 2000,
    includeCharts: true,
    summaryLength: 'medium'
  }
};

/**
 * Get the MCP configuration
 * @returns The MCP configuration
 */
export function getMCPConfig(): typeof MCP_CONFIG {
  return MCP_CONFIG;
}

/**
 * Valuation Agent Configuration
 */
export const VALUATION_AGENT_CONFIG = {
  confidenceThreshold: 0.7,
  learningRate: 0.05,
  multiplierRange: { min: 2.0, max: 5.0 },
  bentonCountyFactors: {
    residentialBaseMultiplier: 3.5,
    commercialBaseMultiplier: 3.2,
    agriculturalBaseMultiplier: 2.8
  },
  ...MCP_CONFIG.valuationAgentSettings
};

/**
 * Data Cleaner Agent Configuration
 */
export const DATA_CLEANER_AGENT_CONFIG = {
  validationThreshold: 0.8,
  autoCorrectConfidenceThreshold: 0.9,
  learningRate: 0.03,
  outlierDetectionSensitivity: 0.7,
  ...MCP_CONFIG.dataCleanerAgentSettings
};

/**
 * Reporting Agent Configuration
 */
export const REPORTING_AGENT_CONFIG = {
  confidenceThreshold: 0.7,
  learningRate: 0.04,
  maxReportLength: 2000,
  defaultFormatting: 'professional',
  maxCharts: 5,
  ...MCP_CONFIG.reportingAgentSettings
};