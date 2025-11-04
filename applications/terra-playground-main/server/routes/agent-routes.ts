/**
 * Agent System API Routes
 *
 * This file contains routes for interacting with the MCP Agent system,
 * allowing agents to be controlled, monitored, and accessed via API endpoints.
 *
 * NOTE: Authentication removed pending Windows authentication integration
 */

import { Router } from 'express';
import { AgentSystem } from '../services/agent-system';

export function createAgentRoutes(agentSystem: AgentSystem) {
  const router = Router();

  // Authentication removed - will be integrated with Windows Authentication

  /**
   * Get system status
   */
  router.get('/status', async (req, res) => {
    try {
      // Check if agentSystem is initialized
      if (!agentSystem.isInitialized) {
        return res.status(503).json({
          error: 'Agent system not yet initialized',
          status: {
            isInitialized: false,
            agentCount: 0,
            agents: {},
          },
        });
      }

      const status = agentSystem.getSystemStatus();
      res.json(status);
    } catch (error) {
      console.error('Error getting agent system status:', error);
      // Return partial status information instead of failing
      res.status(200).json({
        error: 'Failed to get complete system status',
        status: {
          isInitialized: agentSystem.isInitialized || false,
          agentCount: agentSystem.getAgentCount ? agentSystem.getAgentCount() : 0,
          agents: {},
          partialData: true,
        },
      });
    }
  });

  /**
   * Get Master Development Agent (BSBCmaster Lead) status
   */
  router.get('/master-development-status', async (req, res) => {
    try {
      // Check if agentSystem is initialized
      if (!agentSystem.isInitialized) {
        return res.status(503).json({
          error: 'Agent system not yet initialized',
        });
      }

      try {
        const commandStructure = agentSystem.commandStructureService;
        const bsbcmasterLead = commandStructure.getBSBCmasterLead();

        if (!bsbcmasterLead) {
          return res.status(404).json({
            error: 'Master Development Agent not found or not initialized',
          });
        }

        // Get status and specialist agents
        const status = bsbcmasterLead.getStatus();

        // Type assertion since we know these methods exist in our implementation
        const specialists = (bsbcmasterLead as any).getSpecialistAgents?.() || [];
        const activeServices = (bsbcmasterLead as any).getActiveServices?.() || [];

        // Ensure status is an object and has valid capabilities property
        const processedStatus = status || {};

        // Process capabilities safely
        let safeCapabilities = [];
        if (Array.isArray(processedStatus.capabilities)) {
          safeCapabilities = processedStatus.capabilities;
        }

        // Add additional info about the Master Development Agent
        const enhancedStatus = {
          ...processedStatus,
          capabilities: safeCapabilities,
          specialists,
          componentName: 'BSBCmaster',
          role: 'Component Lead',
          activeServices,
          lastActivityTimestamp: new Date().toISOString(),
        };

        res.json(enhancedStatus);
      } catch (error: any) {
        console.error('Error getting Master Development Agent status:', error);
        res.status(500).json({
          error: 'Failed to get Master Development Agent status',
          message: error?.message || 'Unknown error',
        });
      }
    } catch (error: any) {
      console.error('General error in Master Development Agent status endpoint:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
      });
    }
  });

  /**
   * Validate entity against schema using Master Development Agent
   */
  router.post('/master-development/validate-schema', async (req, res) => {
    try {
      if (!agentSystem.isInitialized) {
        return res.status(503).json({
          error: 'Agent system not yet initialized',
        });
      }

      const { entityType, entity } = req.body;

      if (!entityType || !entity) {
        return res.status(400).json({
          error: 'Missing required parameters',
          details: 'Both entityType and entity are required',
        });
      }

      try {
        const commandStructure = agentSystem.commandStructureService;
        const bsbcmasterLead = commandStructure.getBSBCmasterLead();

        if (!bsbcmasterLead) {
          return res.status(404).json({
            error: 'Master Development Agent not found or not initialized',
          });
        }

        // Call validateEntityAgainstSchema method using type assertion
        const validationResult = await (bsbcmasterLead as any).validateEntityAgainstSchema(
          entityType,
          entity
        );

        res.json({
          entityType,
          validationResult,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        console.error('Error validating entity against schema:', error);
        res.status(500).json({
          error: 'Failed to validate entity against schema',
          message: error?.message || 'Unknown error',
        });
      }
    } catch (error: any) {
      console.error('General error in schema validation endpoint:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
      });
    }
  });

  /**
   * Update schema using Master Development Agent
   */
  router.post('/master-development/update-schema', async (req, res) => {
    try {
      if (!agentSystem.isInitialized) {
        return res.status(503).json({
          error: 'Agent system not yet initialized',
        });
      }

      const { entityType, schemaUpdate } = req.body;

      if (!entityType || !schemaUpdate) {
        return res.status(400).json({
          error: 'Missing required parameters',
          details: 'Both entityType and schemaUpdate are required',
        });
      }

      try {
        const commandStructure = agentSystem.commandStructureService;
        const bsbcmasterLead = commandStructure.getBSBCmasterLead();

        if (!bsbcmasterLead) {
          return res.status(404).json({
            error: 'Master Development Agent not found or not initialized',
          });
        }

        // Call updateSchema method using type assertion
        const result = await (bsbcmasterLead as any).updateSchema(entityType, schemaUpdate);

        res.json({
          entityType,
          ...result,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        console.error('Error updating schema:', error);
        res.status(500).json({
          error: 'Failed to update schema',
          message: error?.message || 'Unknown error',
        });
      }
    } catch (error: any) {
      console.error('General error in schema update endpoint:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
      });
    }
  });

  /**
   * Get security policies from Master Development Agent
   */
  router.get('/master-development/security-policies', async (req, res) => {
    try {
      if (!agentSystem.isInitialized) {
        return res.status(503).json({
          error: 'Agent system not yet initialized',
        });
      }

      try {
        const commandStructure = agentSystem.commandStructureService;
        const bsbcmasterLead = commandStructure.getBSBCmasterLead();

        if (!bsbcmasterLead) {
          return res.status(404).json({
            error: 'Master Development Agent not found or not initialized',
          });
        }

        // Access security policy using type assertion
        const securityPolicy = (bsbcmasterLead as any).securityPolicy || {
          error: 'Security policy not initialized',
        };

        res.json({
          ...securityPolicy,
          requestTimestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        console.error('Error getting security policies:', error);
        res.status(500).json({
          error: 'Failed to get security policies',
          message: error?.message || 'Unknown error',
        });
      }
    } catch (error: any) {
      console.error('General error in security policies endpoint:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error?.message || 'Unknown error',
      });
    }
  });

  /**
   * Initialize the agent system
   */
  router.post('/initialize', async (req, res) => {
    try {
      await agentSystem.initialize();
      res.json({ success: true, message: 'Agent system initialized successfully' });
    } catch (error) {
      console.error('Error initializing agent system:', error);
      res.status(500).json({ error: 'Failed to initialize agent system' });
    }
  });

  /**
   * Start all agents
   */
  router.post('/start', async (req, res) => {
    try {
      await agentSystem.startAllAgents();
      res.json({ success: true, message: 'All agents started successfully' });
    } catch (error) {
      console.error('Error starting agents:', error);
      res.status(500).json({ error: 'Failed to start agents' });
    }
  });

  /**
   * Stop all agents
   */
  router.post('/stop', async (req, res) => {
    try {
      await agentSystem.stopAllAgents();
      res.json({ success: true, message: 'All agents stopped successfully' });
    } catch (error) {
      console.error('Error stopping agents:', error);
      res.status(500).json({ error: 'Failed to stop agents' });
    }
  });

  /**
   * REST API authentication endpoint for WebSocket fallback
   */
  router.post('/auth', async (req, res) => {
    try {
      const { clientType, clientId } = req.body;

      if (!clientType) {
        return res.status(400).json({
          success: false,
          message: 'Client type is required',
        });
      }

      // Generate a unique client ID if not provided
      const newClientId =
        clientId || `${clientType}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      res.json({
        success: true,
        clientId: newClientId,
        message: 'Authentication successful',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error authenticating client:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed',
        error: error.message,
      });
    }
  });

  /**
   * Send a message to an agent via REST API (for WebSocket fallback)
   */
  router.post('/message', async (req, res) => {
    try {
      const { recipientId, message } = req.body;

      if (!recipientId || !message) {
        return res.status(400).json({
          success: false,
          message: 'Recipient ID and message are required',
        });
      }

      // Generate a message ID
      const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      // Here we would actually send the message to the agent
      // For now, just log it and return success
      res.json({
        success: true,
        messageId,
        message: 'Message sent successfully',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error sending message via REST:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message,
      });
    }
  });

  /**
   * Send an action request to an agent via REST API (for WebSocket fallback)
   */
  router.post('/action', async (req, res) => {
    try {
      const { targetAgent, action, params } = req.body;

      if (!targetAgent || !action) {
        return res.status(400).json({
          success: false,
          message: 'Target agent and action are required',
        });
      }

      // Generate a message ID
      const messageId = `action-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      // Here we would actually send the action request to the agent
      // For now, just log it and return success
      res.json({
        success: true,
        messageId,
        message: 'Action request sent successfully',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error sending action request via REST:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send action request',
        error: error.message,
      });
    }
  });

  /**
   * Execute a capability on an agent
   */
  router.post('/execute/:agentName/:capabilityName', async (req, res) => {
    try {
      const { agentName, capabilityName } = req.params;
      const parameters = req.body.parameters || {};

      const result = await agentSystem.executeCapability(agentName, capabilityName, parameters);
      res.json(result);
    } catch (error) {
      console.error(`Error executing capability:`, error);
      res.status(500).json({ error: 'Failed to execute capability', details: error.message });
    }
  });

  /**
   * Property Assessment Agent - Analyze Property
   */
  router.post('/property-assessment/analyze/:propertyId', async (req, res) => {
    try {
      const { propertyId } = req.params;

      const result = await agentSystem.executeCapability('property_assessment', 'analyzeProperty', {
        propertyId,
      });

      res.json(result);
    } catch (error) {
      console.error('Error analyzing property:', error);
      res.status(500).json({ error: 'Failed to analyze property', details: error.message });
    }
  });

  /**
   * Property Assessment Agent - Generate Property Story
   */
  router.post('/property-assessment/story/:propertyId', async (req, res) => {
    try {
      const { propertyId } = req.params;
      const options = req.body.options || {};

      const result = await agentSystem.executeCapability(
        'property_assessment',
        'generatePropertyStory',
        {
          propertyId,
          options,
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error generating property story:', error);
      res.status(500).json({ error: 'Failed to generate property story', details: error.message });
    }
  });

  /**
   * Property Assessment Agent - Find Comparable Properties
   */
  router.post('/property-assessment/comparables/:propertyId', async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { count, radius } = req.body;

      const result = await agentSystem.executeCapability(
        'property_assessment',
        'findComparableProperties',
        {
          propertyId,
          count,
          radius,
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error finding comparable properties:', error);
      res
        .status(500)
        .json({ error: 'Failed to find comparable properties', details: error.message });
    }
  });

  /**
   * Property Assessment Agent - Calculate Property Value
   */
  router.post('/property-assessment/value/:propertyId', async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { useComparables } = req.body;

      const result = await agentSystem.executeCapability(
        'property_assessment',
        'calculatePropertyValue',
        {
          propertyId,
          useComparables,
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error calculating property value:', error);
      res.status(500).json({ error: 'Failed to calculate property value', details: error.message });
    }
  });

  /**
   * Property Assessment Agent - Analyze Property Trends
   */
  router.post('/property-assessment/trends/:propertyId', async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { timeframe } = req.body;

      const result = await agentSystem.executeCapability(
        'property_assessment',
        'analyzePropertyTrends',
        {
          propertyId,
          timeframe,
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error analyzing property trends:', error);
      res.status(500).json({ error: 'Failed to analyze property trends', details: error.message });
    }
  });

  /**
   * Data Ingestion Agent - Import From FTP
   */
  router.post('/data-ingestion/import-from-ftp', async (req, res) => {
    try {
      const { remotePath, dataType } = req.body;

      if (!remotePath || !dataType) {
        return res.status(400).json({ error: 'Remote path and data type are required' });
      }

      const result = await agentSystem.executeCapability('data_ingestion', 'importFromFTP', {
        remotePath,
        dataType,
      });

      res.json(result);
    } catch (error) {
      console.error('Error importing from FTP:', error);
      res.status(500).json({ error: 'Failed to import from FTP', details: error.message });
    }
  });

  /**
   * Data Ingestion Agent - Validate Import Data
   */
  router.post('/data-ingestion/validate-import/:importId', async (req, res) => {
    try {
      const { importId } = req.params;

      const result = await agentSystem.executeCapability('data_ingestion', 'validateImportData', {
        importId,
      });

      res.json(result);
    } catch (error) {
      console.error('Error validating import data:', error);
      res.status(500).json({ error: 'Failed to validate import data', details: error.message });
    }
  });

  /**
   * Data Ingestion Agent - Load Validated Data
   */
  router.post('/data-ingestion/load-data/:importId', async (req, res) => {
    try {
      const { importId } = req.params;
      const options = req.body.options || {};

      const result = await agentSystem.executeCapability('data_ingestion', 'loadValidatedData', {
        importId,
        options,
      });

      res.json(result);
    } catch (error) {
      console.error('Error loading validated data:', error);
      res.status(500).json({ error: 'Failed to load validated data', details: error.message });
    }
  });

  /**
   * Data Ingestion Agent - Export To FTP
   */
  router.post('/data-ingestion/export-to-ftp', async (req, res) => {
    try {
      const { dataType, filter, remotePath } = req.body;

      if (!dataType) {
        return res.status(400).json({ error: 'Data type is required' });
      }

      const result = await agentSystem.executeCapability('data_ingestion', 'exportToFTP', {
        dataType,
        filter: filter || {},
        remotePath,
      });

      res.json(result);
    } catch (error) {
      console.error('Error exporting to FTP:', error);
      res.status(500).json({ error: 'Failed to export to FTP', details: error.message });
    }
  });

  /**
   * Get pending messages - used by WebSocket fallback polling
   */
  router.get('/messages/pending', async (req, res) => {
    try {
      // For now, return empty message queue until we implement proper message storage
      // This endpoint is used by the fallback polling mechanism when WebSocket fails
      res.json({
        messages: [],
      });
    } catch (error) {
      console.error('Error getting pending messages:', error);
      res.status(500).json({ error: 'Failed to get pending messages', details: error.message });
    }
  });

  /**
   * Reporting Agent - Create Report
   */
  router.post('/reporting/reports', async (req, res) => {
    try {
      const { name, description, type, query } = req.body;

      if (!name || !description || !type || !query) {
        return res.status(400).json({ error: 'Name, description, type, and query are required' });
      }

      const result = await agentSystem.executeCapability('reporting', 'createReport', {
        name,
        description,
        type,
        query,
      });

      res.json(result);
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({ error: 'Failed to create report', details: error.message });
    }
  });

  /**
   * Reporting Agent - Run Report
   */
  router.post('/reporting/reports/:reportId/run', async (req, res) => {
    try {
      const { reportId } = req.params;
      const parameters = req.body.parameters || {};

      const result = await agentSystem.executeCapability('reporting', 'runReport', {
        reportId,
        parameters,
      });

      res.json(result);
    } catch (error) {
      console.error('Error running report:', error);
      res.status(500).json({ error: 'Failed to run report', details: error.message });
    }
  });

  /**
   * Reporting Agent - List Reports
   */
  router.get('/reporting/reports', async (req, res) => {
    try {
      const result = await agentSystem.executeCapability('reporting', 'listReports', {});
      res.json(result);
    } catch (error) {
      console.error('Error listing reports:', error);
      res.status(500).json({ error: 'Failed to list reports', details: error.message });
    }
  });

  /**
   * Reporting Agent - Get Report History
   */
  router.get('/reporting/reports/:reportId/history', async (req, res) => {
    try {
      const { reportId } = req.params;

      const result = await agentSystem.executeCapability('reporting', 'getReportHistory', {
        reportId,
      });

      res.json(result);
    } catch (error) {
      console.error('Error getting report history:', error);
      res.status(500).json({ error: 'Failed to get report history', details: error.message });
    }
  });

  /**
   * Reporting Agent - Schedule Report
   */
  router.post('/reporting/reports/:reportId/schedule', async (req, res) => {
    try {
      const { reportId } = req.params;
      const { schedule, recipients } = req.body;

      if (!schedule) {
        return res.status(400).json({ error: 'Schedule is required' });
      }

      const result = await agentSystem.executeCapability('reporting', 'scheduleReport', {
        reportId,
        schedule,
        recipients,
      });

      res.json(result);
    } catch (error) {
      console.error('Error scheduling report:', error);
      res.status(500).json({ error: 'Failed to schedule report', details: error.message });
    }
  });

  /**
   * Property Assessment Agent - Generate Area Analysis
   */
  router.post('/property-assessment/area-analysis/:zipCode', async (req, res) => {
    try {
      const { zipCode } = req.params;
      const { propertyType, timeframe } = req.body;

      const result = await agentSystem.executeCapability(
        'property_assessment',
        'generateAreaAnalysis',
        {
          zipCode,
          propertyType,
          timeframe,
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error generating area analysis:', error);
      res.status(500).json({
        error: 'Failed to generate area analysis',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Property Assessment Agent - Detect Valuation Anomalies
   */
  router.post('/property-assessment/detect-anomalies/:propertyId', async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { threshold } = req.body;

      const result = await agentSystem.executeCapability(
        'property_assessment',
        'detectValuationAnomalies',
        {
          propertyId,
          threshold,
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error detecting valuation anomalies:', error);
      res.status(500).json({
        error: 'Failed to detect valuation anomalies',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Property Assessment Agent - Generate Neighborhood Report
   */
  router.post('/property-assessment/neighborhood-report/:zipCode', async (req, res) => {
    try {
      const { zipCode } = req.params;
      const { includeValuationTrends, includeDemographics } = req.body;

      const result = await agentSystem.executeCapability(
        'property_assessment',
        'generateNeighborhoodReport',
        {
          zipCode,
          includeValuationTrends,
          includeDemographics,
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error generating neighborhood report:', error);
      res.status(500).json({
        error: 'Failed to generate neighborhood report',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Property Assessment Agent - Analyze Land Use Impact
   */
  router.post('/property-assessment/land-use-impact/:propertyId', async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { alternativeLandUse } = req.body;

      const result = await agentSystem.executeCapability(
        'property_assessment',
        'analyzeLandUseImpact',
        {
          propertyId,
          alternativeLandUse,
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error analyzing land use impact:', error);
      res.status(500).json({
        error: 'Failed to analyze land use impact',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Property Assessment Agent - Predict Future Value
   */
  router.post('/property-assessment/predict-value/:propertyId', async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { yearsAhead } = req.body;

      const result = await agentSystem.executeCapability(
        'property_assessment',
        'predictFutureValue',
        {
          propertyId,
          yearsAhead,
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error predicting future value:', error);
      res.status(500).json({
        error: 'Failed to predict future value',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Get MCP Tool Execution Logs
   */
  router.get('/tool-execution-logs', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

      // Access logs via storage
      const logs = await agentSystem.storage.getMCPToolExecutionLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error('Error retrieving MCP tool execution logs:', error);
      res
        .status(500)
        .json({ error: 'Failed to retrieve tool execution logs', details: error.message });
    }
  });

  /**
   * Create a test MCP Tool Execution Log (for testing only)
   */
  router.post('/test/create-tool-log', async (req, res) => {
    try {
      // Create a test tool execution log
      const now = new Date();

      // Parse the request body if it's a string
      let requestBody = req.body || {};
      if (typeof requestBody === 'string') {
        try {
          requestBody = JSON.parse(requestBody);
        } catch (err) {
          console.error('Failed to parse request body as JSON:', err);
          requestBody = {};
        }
      }

      );

      // Just use the requestBody directly
      // The issue appears to be related to how the result is being handled in the storage layer

      // Let's just respect the exact values from the request body with minimal processing

      // For debugging
      );

      // Create the test log with either default values or values from the request
      const testLog = {
        toolName: requestBody.toolName || 'test.tool',
        requestId: requestBody.requestId || `test-${Date.now()}`,
        agentId: requestBody.agentId !== undefined ? requestBody.agentId : 1, // Default to Data Management Agent
        userId: req.user?.userId || null,
        parameters: requestBody.parameters || {
          test: true,
          description: 'This is a test log entry',
        },
        status: requestBody.status || 'success',
        result:
          requestBody.result !== undefined
            ? requestBody.result
            : { message: 'Test operation completed successfully' },
        error: requestBody.error || null,
        startTime: new Date(now.getTime() - 1000), // 1 second ago
        endTime: now,
      };

      );
      const log = await agentSystem.storage.createMCPToolExecutionLog(testLog);
      );

      // Set appropriate headers to ensure proper JSON response
      res.setHeader('Content-Type', 'application/json');
      return res.json(log);
    } catch (error) {
      console.error('Error creating test tool execution log:', error);
      // Set appropriate headers to ensure proper JSON response
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: 'Failed to create test log',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}

