/**
 * Agent Health Indicator
 *
 * Health indicator for monitoring agent system status.
 */

// Import declarations - for actual NestJS implementation use these
/*
import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
*/

// For now, create mock types (will be replaced with actual imports)
interface HealthIndicatorResult {
  [key: string]: {
    status: string;
    [key: string]: any;
  };
}

class HealthCheckError extends Error {
  constructor(
    message: string,
    public causes: any
  ) {
    super(message);
  }
}

abstract class HealthIndicator {
  protected getStatus(
    key: string,
    isHealthy: boolean,
    data: { [key: string]: any } = {}
  ): HealthIndicatorResult {
    return {
      [key]: {
        status: isHealthy ? 'up' : 'down',
        ...data,
      },
    };
  }
}

// Import from agent service
import { AgentService } from '../services/agent-service';

/**
 * Agent health indicator implementation
 */
export class AgentHealthIndicator extends HealthIndicator {
  constructor(private readonly agentService: AgentService) {
    super();
  }

  /**
   * Check if the agent system is healthy
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    let isHealthy = false;
    let error: string | undefined = undefined;

    try {
      // Check if all agents are in a good state
      const agents = this.agentService.getAllAgents();

      if (agents.length === 0) {
        error = 'No agents registered';
        isHealthy = false;
      } else {
        // Check if any agent is in error state
        const errorAgents = agents.filter(agent => agent.getStatus() === 'error');

        if (errorAgents.length > 0) {
          error = `${errorAgents.length} agents in error state`;
          isHealthy = false;
        } else {
          isHealthy = true;
        }
      }
    } catch (err: any) {
      error = err.message || 'Unknown error';
      isHealthy = false;
    }

    // Generate health status
    const result = this.getStatus(key, isHealthy, {
      lastChecked: new Date().toISOString(),
      agentCount: this.agentService.getAllAgents().length,
      error: error,
    });

    // Throw error if not healthy
    if (!isHealthy) {
      throw new HealthCheckError('Agent system health check failed', result);
    }

    return result;
  }

  /**
   * Ping agent service to check if it's responsive
   */
  async ping(): Promise<HealthIndicatorResult> {
    try {
      // Simple agent service ping
      const isReachable = this.agentService !== undefined;

      // Generate health status
      const result = this.getStatus('agent-ping', isReachable, {
        timestamp: new Date().toISOString(),
      });

      // Throw error if not reachable
      if (!isReachable) {
        throw new HealthCheckError('Agent service ping failed', result);
      }

      return result;
    } catch (error) {
      const result = this.getStatus('agent-ping', false, {
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      });

      throw new HealthCheckError('Agent service ping failed', result);
    }
  }
}
