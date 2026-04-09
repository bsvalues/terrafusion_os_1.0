/**
 * Agent Types
 * 
 * Types used for agent interactions, commands, and responses
 */

// Command types that an agent can process
export enum AgentCommandType {
  QUERY = 'QUERY',         // Request information
  TASK = 'TASK',           // Request a task be performed
  STATUS = 'STATUS',       // Check status
  ANALYZE = 'ANALYZE',     // Request analysis
  CREATE = 'CREATE',       // Create something
  UPDATE = 'UPDATE',       // Update something
  DELETE = 'DELETE',       // Delete something
  LIST = 'LIST',           // List items
  HELP = 'HELP',           // Request help
  UNKNOWN = 'UNKNOWN'      // Could not understand command
}

// Structure for a command to an agent
export interface AgentCommand {
  type: AgentCommandType;        // Type of command
  agentId?: string;              // Target agent ID (if applicable)
  subject?: string;              // Subject of command (if applicable)
  parameters?: Record<string, any>;  // Command parameters
  original: string;              // Original command text
}

// Response from an agent
export interface AgentResponse {
  success: boolean;              // Whether the command was successful
  message: string;               // Response message
  data?: any;                    // Optional data returned by the agent
  error?: string;                // Error message if unsuccessful
  timestamp: string;             // When the response was generated
}

// Agent capabilities
export interface AgentCapability {
  name: string;                  // Name of capability
  description: string;           // Description of what it does
  parameters?: {                 // Parameters it accepts
    name: string;
    type: string;
    description: string;
    required: boolean;
    defaultValue?: any;
  }[];
  returnType?: string;           // Type of data it returns
  examples?: string[];           // Example usages
}

// Agent status
export enum AgentStatus {
  ONLINE = 'ONLINE',             // Agent is online and ready
  OFFLINE = 'OFFLINE',           // Agent is offline
  BUSY = 'BUSY',                 // Agent is busy processing a task
  ERROR = 'ERROR',               // Agent is in an error state
  INITIALIZING = 'INITIALIZING'  // Agent is initializing
}

// Agent definition for the registry
export interface AgentDefinition {
  id: string;                    // Unique identifier
  name: string;                  // Human-readable name
  type: string;                  // Type of agent (e.g., 'data', 'frontend')
  description: string;           // Description of the agent
  capabilities: AgentCapability[]; // Available capabilities
  status: AgentStatus;           // Current status
  lastActiveTime?: Date;         // When the agent was last active
}

// Agent session for maintaining context
export interface AgentSession {
  id: string;                    // Session ID
  userId?: number;               // User ID if authenticated
  agentId: string;               // Agent ID
  startTime: Date;               // When the session started
  lastActiveTime: Date;          // When the session was last active
  context: Record<string, any>;  // Session context
}