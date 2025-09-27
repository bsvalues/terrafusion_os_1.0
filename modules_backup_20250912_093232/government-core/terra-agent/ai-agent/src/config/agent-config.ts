/**
 * TerraAgent AI Configuration
 * Day 3 - Configuration Management
 */

import { AgentConfig } from '../types/agent-types.js';

export const defaultConfig: AgentConfig = {
  model: {
    provider: 'openai',
    model: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
    systemPrompt: `You are TerraAgent, an expert AI real estate assistant with comprehensive knowledge of:
    - Property analysis and valuation
    - Market trends and comparative analysis
    - Investment advisory and ROI calculations
    - Real estate regulations and compliance
    - Client relationship management
    - Document analysis and contract review
    
    You provide accurate, helpful, and professional assistance while maintaining ethical standards.
    Always prioritize user safety and legal compliance in all recommendations.`,
  },
  memory: {
    enabled: process.env.MEMORY_ENABLED === 'true',
    vectorStore: 'local',
    embeddingModel: 'text-embedding-ada-002',
    maxMemories: parseInt(process.env.MEMORY_MAX_ENTRIES || '10000'),
    retrievalCount: parseInt(process.env.MEMORY_RETRIEVAL_COUNT || '5'),
  },
  knowledge: {
    enabled: process.env.KNOWLEDGE_ENABLED === 'true',
    sources: [],
    updateFrequency: process.env.KNOWLEDGE_UPDATE_FREQUENCY || 'daily',
  },
  tools: {
    mcpServer: process.env.MCP_SERVER_PATH || '../mcp-server/dist/index.js',
    availableTools: [
      'property-search',
      'property-analysis',
      'market-analysis',
      'property-valuation',
      'comparative-analysis',
      'investment-analysis',
      'document-analysis',
      'client-management',
    ],
    toolTimeout: parseInt(process.env.MCP_SERVER_TIMEOUT || '30000'),
  },
};

export const anthropicConfig: Partial<AgentConfig> = {
  model: {
    provider: 'anthropic',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '2000'),
    systemPrompt: defaultConfig.model.systemPrompt,
  },
};

export const productionConfig: Partial<AgentConfig> = {
  model: {
    ...defaultConfig.model,
    temperature: 0.5, // More conservative for production
    maxTokens: 1500,
  },
  memory: {
    ...defaultConfig.memory,
    vectorStore: 'chroma',
    maxMemories: 50000,
  },
};

export const developmentConfig: Partial<AgentConfig> = {
  model: {
    ...defaultConfig.model,
    temperature: 0.8, // More creative for development
    maxTokens: 3000,
  },
  memory: {
    ...defaultConfig.memory,
    maxMemories: 1000, // Smaller for faster development
  },
};

/**
 * Get configuration based on environment
 */
export function getConfig(): AgentConfig {
  const env = process.env.NODE_ENV || 'development';

  let config = { ...defaultConfig };

  switch (env) {
    case 'production':
      config = { ...config, ...productionConfig };
      break;
    case 'development':
      config = { ...config, ...developmentConfig };
      break;
    default:
      // Use default config
      break;
  }

  // Override with environment-specific model provider if specified
  if (process.env.AI_PROVIDER === 'anthropic') {
    config = { ...config, ...anthropicConfig };
  }

  return config;
}

/**
 * Validate configuration
 */
export function validateConfig(config: AgentConfig): boolean {
  const required = [
    'model.provider',
    'model.model',
    'memory.enabled',
    'knowledge.enabled',
    'tools.mcpServer',
  ];

  for (const path of required) {
    const keys = path.split('.');
    let current: any = config;

    for (const key of keys) {
      if (current[key] === undefined) {
        console.error(`Missing required configuration: ${path}`);
        return false;
      }
      current = current[key];
    }
  }

  return true;
}
