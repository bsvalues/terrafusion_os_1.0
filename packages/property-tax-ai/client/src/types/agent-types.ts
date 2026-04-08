/**
 * Agent System Type Definitions
 * 
 * This file contains TypeScript interfaces for the agent system.
 * These types are shared between frontend and backend code to ensure
 * consistent data structures.
 */

/**
 * Agent object as returned by the backend
 */
export interface Agent {
  id: string | number;
  name: string;
  isActive: boolean;
  lastActivity: string | null;
  performanceScore: number;
  type?: string;
  status?: string;
  description?: string;
  displayName?: string;
  capabilities?: AgentCapability[];
}

/**
 * Agent system status response
 */
export interface AgentSystemStatus {
  isInitialized: boolean;
  agentCount: number;
  agents: Record<string, Agent> | Agent[];
  lastUpdated?: string;
}

/**
 * Agent capability definition
 */
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  agentId: string | number;
  parameters: AgentCapabilityParameter[];
  displayName?: string;
}

/**
 * Agent capability parameter
 */
export interface AgentCapabilityParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: any;
  displayName?: string;
}

/**
 * Agent capability execution request
 */
export interface ExecuteCapabilityRequest {
  agentId: string | number;
  capabilityId: string;
  parameters: Record<string, any>;
}

/**
 * Agent capability execution response
 */
export interface ExecuteCapabilityResponse {
  success: boolean;
  result?: any;
  error?: string;
  executionId?: string;
  timestamp: string;
}