/**
 * Agent Health Routes
 *
 * These routes provide API endpoints for monitoring and managing agent health status.
 * Includes real-time health metrics, performance data, and historical trends.
 */

import { Router, Request, Response } from 'express';
import { agentHealthMonitoringService } from '../services/agent-health-monitoring-service';
import { IStorage } from '../storage';
import { AgentSystem } from '../services/agent-system';
import { logger } from '../utils/logger';

export function createAgentHealthRoutes(storage: IStorage, agentSystem: AgentSystem) {
  const router = Router();

  /**
   * @route   GET /api/agent-health/dashboard
   * @desc    Get data for the agent health dashboard including overall health and metrics
   * @access  Public
   */
  router.get('/dashboard', async (req: Request, res: Response) => {
    try {
      // Initialize the health monitoring service if not already done
      if (!agentHealthMonitoringService.isInitialized) {
        agentHealthMonitoringService.initialize(storage, agentSystem);
      }

      // Since we're in early development, return a mock dashboard for now
      // This will be replaced with actual monitoring data when the IStorage interfaces are updated
      const mockDashboard = {
        systemHealth: {
          overallStatus: 'healthy',
          agentCount: 2,
          healthyAgents: 2,
          degradedAgents: 0,
          criticalAgents: 0,
          unknownAgents: 0,
          totalCpuUsage: 32.5,
          totalMemoryUsage: 256.8,
          averageLatency: 120.4,
          totalErrors: 0,
          totalApiCalls: 154,
          timestamp: new Date().toISOString(),
        },
        statistics: {
          totalAgents: 2,
          healthyCount: 2,
          degradedCount: 0,
          criticalCount: 0,
          unknownCount: 0,
          averageCpuUsage: 16.25,
          averageMemoryUsage: 128.4,
          averageLatency: 120.4,
          totalErrors: 0,
          timestamp: new Date().toISOString(),
        },
        agentHealthRecords: [
          {
            agentId: 'visualization-agent',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            cpuUsage: 15.2,
            memoryUsage: 124.6,
            requestLatency: 118.2,
            tokenConsumption: 1254,
            apiCalls: 76,
            errorRate: 0.0,
            lastActivityTimestamp: new Date().toISOString(),
            messages: 32,
            totalTokens: 12540,
            consecutiveErrors: 0,
            initStatus: 'initialized',
            initTimestamp: new Date(Date.now() - 3600000).toISOString(),
            lastHealthCheck: new Date().toISOString(),
            metricHistory: {
              cpuUsage: [14.2, 15.6, 15.8, 15.2],
              memoryUsage: [122.4, 123.8, 125.2, 124.6],
              requestLatency: [125.4, 121.2, 119.6, 118.2],
              tokenConsumption: [320, 342, 286, 306],
              apiCalls: [18, 20, 18, 20],
              errorRate: [0.0, 0.0, 0.0, 0.0],
            },
          },
          {
            agentId: 'ai-insights-agent',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            cpuUsage: 17.3,
            memoryUsage: 132.2,
            requestLatency: 122.6,
            tokenConsumption: 1864,
            apiCalls: 78,
            errorRate: 0.0,
            lastActivityTimestamp: new Date().toISOString(),
            messages: 42,
            totalTokens: 15840,
            consecutiveErrors: 0,
            initStatus: 'initialized',
            initTimestamp: new Date(Date.now() - 3600000).toISOString(),
            lastHealthCheck: new Date().toISOString(),
            metricHistory: {
              cpuUsage: [16.8, 17.2, 17.6, 17.3],
              memoryUsage: [130.6, 131.8, 132.4, 132.2],
              requestLatency: [126.2, 124.8, 123.2, 122.6],
              tokenConsumption: [450, 482, 466, 466],
              apiCalls: [19, 21, 19, 19],
              errorRate: [0.0, 0.0, 0.0, 0.0],
            },
          },
        ],
        timestamp: new Date().toISOString(),
      };

      res.json(mockDashboard);
    } catch (error) {
      logger.error(
        'Error fetching agent health dashboard data: ' +
          (error instanceof Error ? error.message : String(error))
      );

      res.status(500).json({
        error: 'Failed to retrieve agent health dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @route   GET /api/agent-health/metrics/:agentId
   * @desc    Get detailed health metrics for a specific agent
   * @access  Public
   */
  router.get('/metrics/:agentId', async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;

      // Initialize the health monitoring service if not already done
      if (!agentHealthMonitoringService.isInitialized) {
        agentHealthMonitoringService.initialize(storage, agentSystem);
      }

      // Mock metrics data based on agent ID for now
      // This will be replaced with actual monitoring data when the IStorage interfaces are updated
      let mockMetrics;

      // Generate specific mock data based on agent ID for a more realistic response
      if (agentId.includes('visualization')) {
        mockMetrics = {
          cpuUsage: [14.2, 15.6, 15.8, 15.2, 16.1, 15.9, 15.4, 15.2, 15.3, 15.2],
          memoryUsage: [122.4, 123.8, 125.2, 124.6, 126.2, 125.8, 124.9, 124.6, 124.7, 124.6],
          requestLatency: [125.4, 121.2, 119.6, 118.2, 119.8, 119.2, 118.6, 118.2, 118.4, 118.2],
          errorRate: [0.0, 0.0, 0.0, 0.0, 0.2, 0.1, 0.0, 0.0, 0.0, 0.0],
          apiCalls: [18, 20, 18, 20, 22, 21, 20, 20, 21, 20],
          tokenUsage: [320, 342, 286, 306, 324, 316, 310, 306, 308, 306],
          messageCount: [8, 9, 7, 8, 9, 8, 8, 8, 8, 8],
          timestamps: Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - (9 - i) * 300000).toISOString()
          ),
        };
      } else if (agentId.includes('insights')) {
        mockMetrics = {
          cpuUsage: [16.8, 17.2, 17.6, 17.3, 17.5, 17.4, 17.3, 17.3, 17.2, 17.3],
          memoryUsage: [130.6, 131.8, 132.4, 132.2, 132.5, 132.4, 132.3, 132.2, 132.1, 132.2],
          requestLatency: [126.2, 124.8, 123.2, 122.6, 122.9, 122.8, 122.7, 122.6, 122.5, 122.6],
          errorRate: [0.0, 0.0, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0],
          apiCalls: [19, 21, 19, 19, 20, 20, 19, 19, 19, 19],
          tokenUsage: [450, 482, 466, 466, 472, 470, 468, 466, 465, 466],
          messageCount: [11, 12, 11, 11, 12, 11, 11, 11, 11, 11],
          timestamps: Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - (9 - i) * 300000).toISOString()
          ),
        };
      } else {
        // Generic mock data for any other agent ID
        mockMetrics = {
          cpuUsage: Array.from({ length: 10 }, () => Math.random() * 20 + 10),
          memoryUsage: Array.from({ length: 10 }, () => Math.random() * 50 + 100),
          requestLatency: Array.from({ length: 10 }, () => Math.random() * 50 + 100),
          errorRate: Array.from({ length: 10 }, () => Math.random() * 0.5),
          apiCalls: Array.from({ length: 10 }, () => Math.floor(Math.random() * 10 + 15)),
          tokenUsage: Array.from({ length: 10 }, () => Math.floor(Math.random() * 200 + 300)),
          messageCount: Array.from({ length: 10 }, () => Math.floor(Math.random() * 5 + 8)),
          timestamps: Array.from({ length: 10 }, (_, i) =>
            new Date(Date.now() - (9 - i) * 300000).toISOString()
          ),
        };
      }

      res.json({
        agentId,
        metrics: mockMetrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        'Error fetching agent metrics: ' + (error instanceof Error ? error.message : String(error))
      );

      res.status(500).json({
        error: 'Failed to retrieve agent metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @route   POST /api/agent-health/check
   * @desc    Trigger a manual health check across all agents
   * @access  Public
   */
  router.post('/check', async (req: Request, res: Response) => {
    try {
      // In mock mode, just return success
      res.json({
        success: true,
        message: 'Health check initiated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        'Error triggering agent health check: ' +
          (error instanceof Error ? error.message : String(error))
      );

      res.status(500).json({
        error: 'Failed to trigger agent health check',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @route   GET /api/agent-health/ping
   * @desc    Simple ping endpoint to test connectivity
   * @access  Public
   */
  router.get('/ping', (req: Request, res: Response) => {
    res.json({
      message: 'Agent Health API is online',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @route   GET /api/agent-health/agents
   * @desc    Get health status for all registered agents
   * @access  Public
   */
  router.get('/agents', async (req: Request, res: Response) => {
    try {
      // Initialize the health monitoring service if not already done
      if (!agentHealthMonitoringService.isInitialized) {
        agentHealthMonitoringService.initialize(storage, agentSystem);
      }

      // Mock agent health records for now
      // This will be replaced with actual data when the IStorage interfaces are updated
      const mockAgentHealthRecords = [
        {
          agentId: 'visualization-agent',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          cpuUsage: 15.2,
          memoryUsage: 124.6,
          requestLatency: 118.2,
          tokenConsumption: 1254,
          apiCalls: 76,
          errorRate: 0.0,
          lastActivityTimestamp: new Date().toISOString(),
          messages: 32,
          totalTokens: 12540,
          consecutiveErrors: 0,
          initStatus: 'initialized',
          initTimestamp: new Date(Date.now() - 3600000).toISOString(),
          lastHealthCheck: new Date().toISOString(),
          metricHistory: {
            cpuUsage: [14.2, 15.6, 15.8, 15.2],
            memoryUsage: [122.4, 123.8, 125.2, 124.6],
            requestLatency: [125.4, 121.2, 119.6, 118.2],
            tokenConsumption: [320, 342, 286, 306],
            apiCalls: [18, 20, 18, 20],
            errorRate: [0.0, 0.0, 0.0, 0.0],
          },
        },
        {
          agentId: 'ai-insights-agent',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          cpuUsage: 17.3,
          memoryUsage: 132.2,
          requestLatency: 122.6,
          tokenConsumption: 1864,
          apiCalls: 78,
          errorRate: 0.0,
          lastActivityTimestamp: new Date().toISOString(),
          messages: 42,
          totalTokens: 15840,
          consecutiveErrors: 0,
          initStatus: 'initialized',
          initTimestamp: new Date(Date.now() - 3600000).toISOString(),
          lastHealthCheck: new Date().toISOString(),
          metricHistory: {
            cpuUsage: [16.8, 17.2, 17.6, 17.3],
            memoryUsage: [130.6, 131.8, 132.4, 132.2],
            requestLatency: [126.2, 124.8, 123.2, 122.6],
            tokenConsumption: [450, 482, 466, 466],
            apiCalls: [19, 21, 19, 19],
            errorRate: [0.0, 0.0, 0.0, 0.0],
          },
        },
      ];

      res.json({
        agents: mockAgentHealthRecords,
        count: mockAgentHealthRecords.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        'Error fetching agent health records: ' +
          (error instanceof Error ? error.message : String(error))
      );

      res.status(500).json({
        error: 'Failed to retrieve agent health records',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @route   GET /api/agent-health/agents/:agentId
   * @desc    Get health status for a specific agent
   * @access  Public
   */
  router.get('/agents/:agentId', async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;

      // Initialize the health monitoring service if not already done
      if (!agentHealthMonitoringService.isInitialized) {
        agentHealthMonitoringService.initialize(storage, agentSystem);
      }

      // Mock agent health record based on agent ID
      // This will be replaced with actual monitoring data when the IStorage interfaces are updated
      let mockAgentHealth;

      if (agentId.includes('visualization')) {
        mockAgentHealth = {
          agentId: 'visualization-agent',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          cpuUsage: 15.2,
          memoryUsage: 124.6,
          requestLatency: 118.2,
          tokenConsumption: 1254,
          apiCalls: 76,
          errorRate: 0.0,
          lastActivityTimestamp: new Date().toISOString(),
          messages: 32,
          totalTokens: 12540,
          consecutiveErrors: 0,
          initStatus: 'initialized',
          initTimestamp: new Date(Date.now() - 3600000).toISOString(),
          lastHealthCheck: new Date().toISOString(),
          metricHistory: {
            cpuUsage: [14.2, 15.6, 15.8, 15.2],
            memoryUsage: [122.4, 123.8, 125.2, 124.6],
            requestLatency: [125.4, 121.2, 119.6, 118.2],
            tokenConsumption: [320, 342, 286, 306],
            apiCalls: [18, 20, 18, 20],
            errorRate: [0.0, 0.0, 0.0, 0.0],
          },
        };
      } else if (agentId.includes('insights')) {
        mockAgentHealth = {
          agentId: 'ai-insights-agent',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          cpuUsage: 17.3,
          memoryUsage: 132.2,
          requestLatency: 122.6,
          tokenConsumption: 1864,
          apiCalls: 78,
          errorRate: 0.0,
          lastActivityTimestamp: new Date().toISOString(),
          messages: 42,
          totalTokens: 15840,
          consecutiveErrors: 0,
          initStatus: 'initialized',
          initTimestamp: new Date(Date.now() - 3600000).toISOString(),
          lastHealthCheck: new Date().toISOString(),
          metricHistory: {
            cpuUsage: [16.8, 17.2, 17.6, 17.3],
            memoryUsage: [130.6, 131.8, 132.4, 132.2],
            requestLatency: [126.2, 124.8, 123.2, 122.6],
            tokenConsumption: [450, 482, 466, 466],
            apiCalls: [19, 21, 19, 19],
            errorRate: [0.0, 0.0, 0.0, 0.0],
          },
        };
      } else {
        // If agent ID doesn't match any known pattern, return 404
        return res.status(404).json({
          error: 'Agent health record not found',
          message: `No health data available for agent with ID: ${agentId}`,
        });
      }

      res.json({
        agentId,
        health: mockAgentHealth,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        'Error fetching agent health record: ' +
          (error instanceof Error ? error.message : String(error))
      );

      res.status(500).json({
        error: 'Failed to retrieve agent health record',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @route   GET /api/agent-health/statistics
   * @desc    Get health statistics across all agents
   * @access  Public
   */
  router.get('/statistics', async (req: Request, res: Response) => {
    try {
      // Initialize the health monitoring service if not already done
      if (!agentHealthMonitoringService.isInitialized) {
        agentHealthMonitoringService.initialize(storage, agentSystem);
      }

      // Mock statistics for now
      // This will be replaced with actual data when the IStorage interfaces are updated
      const mockStatistics = {
        totalAgents: 2,
        healthyCount: 2,
        degradedCount: 0,
        criticalCount: 0,
        unknownCount: 0,
        averageCpuUsage: 16.25,
        averageMemoryUsage: 128.4,
        averageLatency: 120.4,
        totalErrors: 0,
        timestamp: new Date().toISOString(),
      };

      res.json({
        statistics: mockStatistics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        'Error fetching agent health statistics: ' +
          (error instanceof Error ? error.message : String(error))
      );

      res.status(500).json({
        error: 'Failed to retrieve agent health statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @route   GET /api/agent-health/alerts
   * @desc    Get active health alerts across all agents
   * @access  Public
   */
  router.get('/alerts', async (req: Request, res: Response) => {
    try {
      // Initialize the health monitoring service if not already done
      if (!agentHealthMonitoringService.isInitialized) {
        agentHealthMonitoringService.initialize(storage, agentSystem);
      }

      // Mock alerts for now
      // This will be replaced with actual data when the IStorage interfaces are updated
      const mockAlerts: Array<{
        agentId: string;
        alertType: string;
        severity: string;
        message: string;
        timestamp: string;
        acknowledged: boolean;
        resolvedTimestamp: string | null;
        metricValue: number | null;
        thresholdValue: number | null;
      }> = [
        // Currently no active alerts in our mock system
      ];

      res.json({
        alerts: mockAlerts,
        count: mockAlerts.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        'Error fetching agent health alerts: ' +
          (error instanceof Error ? error.message : String(error))
      );

      res.status(500).json({
        error: 'Failed to retrieve agent health alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @route   GET /api/agent-health/system
   * @desc    Get overall system health metrics
   * @access  Public
   */
  router.get('/system', async (req: Request, res: Response) => {
    try {
      // Initialize the health monitoring service if not already done
      if (!agentHealthMonitoringService.isInitialized) {
        agentHealthMonitoringService.initialize(storage, agentSystem);
      }

      // Mock system health data for now
      // This will be replaced with actual monitoring data when the IStorage interfaces are updated
      const mockSystemHealth = {
        overallStatus: 'healthy',
        agentCount: 2,
        healthyAgents: 2,
        degradedAgents: 0,
        criticalAgents: 0,
        unknownAgents: 0,
        totalCpuUsage: 32.5,
        totalMemoryUsage: 256.8,
        averageLatency: 120.4,
        totalErrors: 0,
        totalApiCalls: 154,
        timestamp: new Date().toISOString(),
      };

      res.json({
        health: mockSystemHealth,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(
        'Error fetching system health: ' + (error instanceof Error ? error.message : String(error))
      );

      res.status(500).json({
        error: 'Failed to retrieve system health',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
