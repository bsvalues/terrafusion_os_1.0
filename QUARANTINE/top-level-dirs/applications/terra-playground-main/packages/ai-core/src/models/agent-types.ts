/**
 * Agent Type Definitions
 */

/**
 * Agent status enum
 */
export enum AgentStatus {
  INITIALIZING = 'initializing',
  READY = 'ready',
  WORKING = 'working',
  ERROR = 'error',
  STOPPED = 'stopped',
}

/**
 * Agent configuration interface
 */
export interface AgentConfig {
  /**
   * Maximum number of concurrent operations
   */
  maxConcurrentOperations?: number;

  /**
   * LLM model identifier to use for this agent
   */
  modelName?: string;

  /**
   * Temperature setting for LLM operations
   */
  temperature?: number;

  /**
   * Maximum tokens to generate in LLM responses
   */
  maxTokens?: number;

  /**
   * Whether to cache agent responses
   */
  enableCache?: boolean;

  /**
   * Cache time-to-live in seconds
   */
  cacheTTL?: number;

  /**
   * Additional agent-specific configuration
   */
  [key: string]: any;
}

/**
 * Agent capability interface
 */
export interface AgentCapability {
  /**
   * Unique capability identifier
   */
  id: string;

  /**
   * Human-readable capability name
   */
  name: string;

  /**
   * Capability description
   */
  description: string;

  /**
   * Parameter schema for this capability
   */
  parameterSchema?: Record<string, any>;

  /**
   * Function that implements this capability
   */
  handler?: (params: Record<string, any>) => Promise<any>;
}

/**
 * Agent factory options
 */
export interface AgentFactoryOptions {
  /**
   * Storage provider
   */
  storage: any;

  /**
   * LLM service provider
   */
  llmService: any;

  /**
   * Default agent configuration
   */
  defaultConfig?: AgentConfig;
}

/**
 * Agent creation options
 */
export interface AgentCreationOptions {
  /**
   * Agent type identifier
   */
  type: string;

  /**
   * Agent identifier
   */
  id: string;

  /**
   * Agent name
   */
  name: string;

  /**
   * Agent description
   */
  description: string;

  /**
   * Agent configuration
   */
  config?: AgentConfig;
}
