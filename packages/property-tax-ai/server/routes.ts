import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertPropertySchema, 
  insertLandRecordSchema,
  insertImprovementSchema,
  insertFieldSchema,
  insertAppealSchema,
  insertAppealCommentSchema,
  insertAppealEvidenceSchema,
  insertAuditLogSchema,
  insertSystemActivitySchema,
  insertComparableSaleSchema,
  insertComparableSalesAnalysisSchema,
  insertComparableAnalysisEntrySchema,
  PacsModule
} from "@shared/schema";
import { createDataImportRoutes } from "./routes/data-import-routes";
import ftpRoutes from "./routes/ftp-routes";
import ftpDataProcessorRoutes from "./routes/ftp-data-processor-routes";
import { registerSupabaseRoutes } from "./routes/supabase-routes";
import voiceRoutes from "./routes/voice-routes";
import agentVoiceCommandRoutes from "./routes/agent-voice-routes";
import voiceCommandRoutes from "./routes/voice-command-routes";
import { createPropertyStoryRoutes } from "./routes/property-story-routes";
import { createPropertyRoutes } from "./routes/property-routes";
import { createAgentRoutes } from "./routes/agent-routes";
import { createAuthRoutes } from "./routes/auth-routes";
import { createMarketRoutes } from "./routes/market-routes";
import { createRiskRoutes } from "./routes/risk-routes";
import { createAnalyticsRoutes } from "./routes/analytics-routes";
import { createValidationRoutes } from "./routes/validation-routes";
import collaborationRoutes from "./routes/collaboration-routes";
import extensionRoutes from "./extensions/extension-routes";
import { registerTeamAgentRoutes } from "./routes/team-agent-routes";
import { registerDemoRoutes } from "./routes/demo-routes";
import aiAssistantRoutes from "./routes/ai-assistant-routes";
import databaseConversionRoutes from "./routes/database-conversion-routes";
import developmentPlatformRoutes from "./routes/development-platform-routes";
import assessmentModelWorkbenchRoutes from "./routes/assessment-model-workbench-routes";
import assistantPersonalityRoutes from "./routes/assistant-personality-routes";
import { registerDatabaseConversionRoutes } from "./routes/database-conversion-routes";
import { DatabaseConversionService } from "./services/database-conversion";
import { processNaturalLanguageQuery, getSummaryFromNaturalLanguage } from "./services/langchain";
import { processNaturalLanguageWithAnthropic, getSummaryWithAnthropic } from "./services/anthropic";
import { isEmailServiceConfigured, sendPropertyInsightShareEmail, createTestEmailAccount } from "./services/email-service";
// import { PacsIntegration } from "./services/pacs-integration"; // Not implemented yet
import { mappingIntegration } from "./services/mapping-integration";
import { notificationService, NotificationType } from "./services/notification-service";
import { agentWebSocketService } from "./services/agent-websocket-service";
import { agentSocketIOService } from "./services/agent-socketio-service";
import { collaborationWebSocketService, initializeCollaborationWebSocketService } from "./services/collaboration-websocket-service";
import { TeamCollaborationWebSocketService } from "./services/team-collaboration-ws-service";
import { perplexityService } from "./services/perplexity";
import { MCPService, MCPRequest } from "./services/mcp";
import { SecurityService } from "./services/security";
import { AuthService } from "./services/auth-service";
import { IPacsIntegrationService } from "./services/pacs-integration";
import { mockPacsIntegrationService } from "./services/mock-pacs-integration";
import { LLMService } from "./services/llm-service";
import { TeamAgentService } from "./services/team-agent-service";
import { EnhancedMarketPredictionModel } from "./services/enhanced-market-prediction-model";
import { EnhancedRiskAssessmentEngine } from "./services/enhanced-risk-assessment-engine";
import { errorHandler, notFoundHandler } from "./middleware/error-middleware";
import { initializeAgentVoiceCommandService } from "./services/agent-voice-command-service";

import { validateApiKey, verifyToken, requireScope, TokenScope } from "./middleware/auth-middleware";

// Create service instances
const securityService = new SecurityService(storage);
const authService = new AuthService(storage, securityService);
const mcpService = new MCPService(storage, mockPacsIntegrationService);

import { PropertyStoryGenerator, PropertyStoryOptions } from "./services/property-story-generator";
import { PropertyInsightSharingService } from "./services/property-insight-sharing-service";
import { sharingUtils, SharingUtilsService } from "./services/sharing-utils";
import { AgentSystem } from "./services/agent-system";
import { initializeExtensionSystem } from "./extensions";
import { ExtensionRegistry } from "./extensions/extension-registry";
import { AgentFactory } from "./services/agent-factory";
import { AgentCoordinator } from "./services/agent-coordinator";

// Initialize services that require other services
const propertyStoryGenerator = new PropertyStoryGenerator(storage);
const propertyInsightSharingService = new PropertyInsightSharingService(storage);
const agentSystem = new AgentSystem(storage);
// Initialize agent voice command service
const agentVoiceCommandService = initializeAgentVoiceCommandService(storage);

// Initialize database conversion service
const databaseConversionService = new DatabaseConversionService(storage, mcpService);

// Initialize agent coordinator and factory 
const agentCoordinator = AgentCoordinator.getInstance(storage);
const agentFactory = AgentFactory.getInstance(storage);

// Initialize extension system
const extensionRegistry = initializeExtensionSystem(storage);

// Import team agent initialization script
import { initializeTeamAgents } from "./scripts/initialize-team-agents";

// Import AI Code Assistant initialization script
import { initializeAICodeAssistant } from "./scripts/initialize-ai-code-assistant";

// Initialize agent systems
(async () => {
  try {
    console.log("Initializing Agent System...");
    await agentSystem.initialize();
    console.log("Agent System initialized successfully");
    
    console.log("Initializing Agent Factory...");
    await agentFactory.initialize();
    console.log("Agent Factory initialized successfully");
    
    // Initialize team agents (Frontend, Backend, Designer, QA, Assessor)
    console.log("Initializing Team Agents...");
    await initializeTeamAgents();
    console.log("Team Agents initialized successfully");
    
    // Initialize AI Code Assistant
    console.log("Initializing AI Code Assistant...");
    await initializeAICodeAssistant();
    console.log("AI Code Assistant initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Agent Systems:", error);
  }
})();

// Create dummy implementation for pacsIntegration
const pacsIntegration = {
  getPropertyFullDetails: async (propertyId: string) => ({}),
  getPropertiesByValueRange: async (min: number, max: number) => ([]),
  getPropertiesByType: async (type: string) => ([]),
  getPropertiesByStatus: async (status: string) => ([]),
  getLandRecordsByZone: async (zone: string) => ([]),
  getImprovementsByType: async (type: string) => ([]),
  getImprovementsByYearBuiltRange: async (min: number, max: number) => ([]),
  getActiveAppeals: async () => ([]),
  getRecentPropertyChanges: async () => ([])
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Define API routes
  const apiRouter = app.route("/api");
  
  // Register data import routes
  app.use('/api/data-import', createDataImportRoutes(storage));
  
  // Register FTP routes
  app.use('/api/ftp', ftpRoutes);
  
  // Register FTP data processor routes
  app.use('/api/ftp/data', ftpDataProcessorRoutes);
  
  // Register Supabase routes
  registerSupabaseRoutes(app, storage);
  
  // Register Property Story routes
  app.use('/api/property-stories', createPropertyStoryRoutes(storage));
  
  // Register Property routes
  createPropertyRoutes(app);
  
  // Register Agent routes
  app.use('/api/agents', createAgentRoutes(agentSystem));
  
  // Register Authentication routes
  app.use('/api/auth', createAuthRoutes());
  
  // Register Voice routes
  app.use('/api/voice', voiceRoutes);
  
  // Register Agent Voice Command routes
  app.use('/api/agent-voice', agentVoiceCommandRoutes);
  
  // Register Enhanced Voice Command routes
  app.use('/api/voice-command', voiceCommandRoutes);
  
  // Register Validation routes
  app.use('/api/validation', createValidationRoutes(storage));
  
  // Register Extension routes
  app.use('/api/extensions', extensionRoutes);
  
  // Register Collaborative Workflow routes
  app.use('/api/collaboration', collaborationRoutes);
  
  // Initialize team agent service
  const teamAgentService = new TeamAgentService(storage, mcpService);
  
  // Register Team Agent routes
  registerTeamAgentRoutes(app, storage);
  
  // Register Demo routes for the 24-hour PropertyTaxAI demo
  registerDemoRoutes(app, storage);
  
  // Register AI Assistant routes
  app.use('/api/ai-assistant', aiAssistantRoutes);
  
  // Register Development Platform routes
  app.use('/api/development', developmentPlatformRoutes);
  
  // Register Assessment Model Workbench routes
  app.use('/api/assessment-workbench', assessmentModelWorkbenchRoutes);
  
  // Register Assistant Personality routes
  app.use('/api/assistant-personalities', assistantPersonalityRoutes);
  
  // Register Database Conversion routes
  registerDatabaseConversionRoutes(app, databaseConversionService);

  /**
   * Data Lineage Routes
   * Track and retrieve history of data changes
   */
  app.get('/api/data-lineage/property/:propertyId', async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      
      if (!propertyId) {
        return res.status(400).json({ error: 'Property ID is required' });
      }
      
      const lineageRecords = await storage.getDataLineageByProperty(propertyId);
      
      // Group records by fieldName for better organization
      const groupedRecords: Record<string, any[]> = {};
      
      lineageRecords.forEach(record => {
        if (!groupedRecords[record.fieldName]) {
          groupedRecords[record.fieldName] = [];
        }
        groupedRecords[record.fieldName].push(record);
      });
      
      return res.status(200).json({ 
        propertyId,
        lineage: groupedRecords,
        totalRecords: lineageRecords.length
      });
    } catch (error) {
      console.error('Error retrieving data lineage:', error);
      return res.status(500).json({ error: 'Failed to retrieve data lineage history' });
    }
  });

  app.get('/api/data-lineage/property/:propertyId/field/:fieldName', async (req: Request, res: Response) => {
    try {
      const { propertyId, fieldName } = req.params;
      
      if (!propertyId || !fieldName) {
        return res.status(400).json({ error: 'Property ID and field name are required' });
      }
      
      const lineageRecords = await storage.getDataLineageByField(propertyId, fieldName);
      
      return res.status(200).json({ 
        propertyId,
        fieldName,
        lineage: lineageRecords,
        totalRecords: lineageRecords.length
      });
    } catch (error) {
      console.error('Error retrieving field data lineage:', error);
      return res.status(500).json({ error: 'Failed to retrieve field data lineage history' });
    }
  });

  app.get('/api/data-lineage/user/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Valid user ID is required' });
      }
      
      const lineageRecords = await storage.getDataLineageByUser(userId, limit);
      
      return res.status(200).json({ 
        userId,
        lineage: lineageRecords,
        totalRecords: lineageRecords.length
      });
    } catch (error) {
      console.error('Error retrieving user data lineage:', error);
      return res.status(500).json({ error: 'Failed to retrieve user data lineage history' });
    }
  });

  app.get('/api/data-lineage/source/:source', async (req: Request, res: Response) => {
    try {
      const { source } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      if (!source) {
        return res.status(400).json({ error: 'Source is required' });
      }
      
      const lineageRecords = await storage.getDataLineageBySource(source, limit);
      
      return res.status(200).json({
        source,
        lineage: lineageRecords,
        totalRecords: lineageRecords.length
      });
    } catch (error) {
      console.error('Error retrieving source data lineage:', error);
      return res.status(500).json({ error: 'Failed to retrieve source data lineage history' });
    }
  });

  app.get('/api/data-lineage/date-range', async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Both startDate and endDate are required' });
      }
      
      const startDateObj = new Date(startDate as string);
      const endDateObj = new Date(endDate as string);
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      
      const lineageRecords = await storage.getDataLineageByDateRange(startDateObj, endDateObj, limit);
      
      return res.status(200).json({
        startDate: startDateObj,
        endDate: endDateObj,
        lineage: lineageRecords,
        totalRecords: lineageRecords.length
      });
    } catch (error) {
      console.error('Error retrieving date range data lineage:', error);
      return res.status(500).json({ error: 'Failed to retrieve date range data lineage history' });
    }
  });

  // Register Market routes
  app.use('/api/market', createMarketRoutes(storage));
  
  // Register Risk routes
  app.use('/api/risk', createRiskRoutes(storage));
  
  // Register Analytics routes
  app.use('/api/analytics', createAnalyticsRoutes(storage));
  
  // Development Platform routes already registered
  
  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy" });
  });
  
  // Properties routes
  app.get("/api/properties", async (_req, res) => {
    try {
      const properties = await storage.getAllProperties();
      
      // Format properties for the PropertyStoryPage component
      const formattedProperties = properties.map(property => {
        // Extract values from extraFields or use defaults
        const extraFields = property.extraFields || {};
        const yearBuilt = extraFields.yearBuilt || null;
        
        return {
          propertyId: property.propertyId,
          address: property.address,
          propertyType: property.propertyType,
          assessedValue: parseFloat(property.value || '0'),
          acreage: parseFloat(property.acres || '0'),
          yearBuilt: yearBuilt
        };
      });
      
      res.json(formattedProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });
  
  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(parseInt(req.params.id));
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });
  
  app.post("/api/properties", async (req, res) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "CREATE",
        entityType: "property",
        entityId: property.propertyId,
        details: { property },
        ipAddress: req.ip || "unknown"
      });
      
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      console.error("Error creating property:", error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });
  
  app.patch("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertPropertySchema.partial().parse(req.body);
      const property = await storage.updateProperty(id, validatedData);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "UPDATE",
        entityType: "property",
        entityId: property.propertyId,
        details: { updatedFields: Object.keys(validatedData) },
        ipAddress: req.ip || "unknown"
      });
      
      res.json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      console.error("Error updating property:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });
  
  // Land Records routes
  app.get("/api/properties/:propertyId/land-records", async (req, res) => {
    try {
      const landRecords = await storage.getLandRecordsByPropertyId(req.params.propertyId);
      res.json(landRecords);
    } catch (error) {
      console.error("Error fetching land records:", error);
      res.status(500).json({ message: "Failed to fetch land records" });
    }
  });
  
  app.post("/api/land-records", async (req, res) => {
    try {
      const validatedData = insertLandRecordSchema.parse(req.body);
      const landRecord = await storage.createLandRecord(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "CREATE",
        entityType: "landRecord",
        entityId: landRecord.propertyId,
        details: { landRecord },
        ipAddress: req.ip || "unknown"
      });
      
      res.status(201).json(landRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid land record data", errors: error.errors });
      }
      console.error("Error creating land record:", error);
      res.status(500).json({ message: "Failed to create land record" });
    }
  });
  
  // Improvements routes
  app.get("/api/properties/:propertyId/improvements", async (req, res) => {
    try {
      const improvements = await storage.getImprovementsByPropertyId(req.params.propertyId);
      res.json(improvements);
    } catch (error) {
      console.error("Error fetching improvements:", error);
      res.status(500).json({ message: "Failed to fetch improvements" });
    }
  });
  
  app.post("/api/improvements", async (req, res) => {
    try {
      const validatedData = insertImprovementSchema.parse(req.body);
      const improvement = await storage.createImprovement(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "CREATE",
        entityType: "improvement",
        entityId: improvement.propertyId,
        details: { improvement },
        ipAddress: req.ip || "unknown"
      });
      
      res.status(201).json(improvement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid improvement data", errors: error.errors });
      }
      console.error("Error creating improvement:", error);
      res.status(500).json({ message: "Failed to create improvement" });
    }
  });
  
  // Fields routes
  app.get("/api/properties/:propertyId/fields", async (req, res) => {
    try {
      const fields = await storage.getFieldsByPropertyId(req.params.propertyId);
      res.json(fields);
    } catch (error) {
      console.error("Error fetching fields:", error);
      res.status(500).json({ message: "Failed to fetch fields" });
    }
  });
  
  app.post("/api/fields", async (req, res) => {
    try {
      const validatedData = insertFieldSchema.parse(req.body);
      const field = await storage.createField(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "CREATE",
        entityType: "field",
        entityId: field.propertyId,
        details: { field },
        ipAddress: req.ip || "unknown"
      });
      
      res.status(201).json(field);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid field data", errors: error.errors });
      }
      console.error("Error creating field:", error);
      res.status(500).json({ message: "Failed to create field" });
    }
  });
  
  app.get("/api/fields/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const field = await storage.getField(id);
      
      if (!field) {
        return res.status(404).json({ message: "Field not found" });
      }
      
      res.json(field);
    } catch (error) {
      console.error("Error fetching field:", error);
      res.status(500).json({ message: "Failed to fetch field" });
    }
  });
  
  app.patch("/api/fields/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertFieldSchema.partial().parse(req.body);
      const field = await storage.updateField(id, validatedData);
      
      if (!field) {
        return res.status(404).json({ message: "Field not found" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "UPDATE",
        entityType: "field",
        entityId: field.propertyId,
        details: { updatedFields: Object.keys(validatedData) },
        ipAddress: req.ip || "unknown"
      });
      
      res.json(field);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid field data", errors: error.errors });
      }
      console.error("Error updating field:", error);
      res.status(500).json({ message: "Failed to update field" });
    }
  });
  
  // Appeals Management routes
  app.get("/api/properties/:propertyId/appeals", async (req, res) => {
    try {
      const appeals = await storage.getAppealsByPropertyId(req.params.propertyId);
      res.json(appeals);
    } catch (error) {
      console.error("Error fetching appeals:", error);
      res.status(500).json({ message: "Failed to fetch appeals" });
    }
  });
  
  app.post("/api/appeals", async (req, res) => {
    try {
      const validatedData = insertAppealSchema.parse(req.body);
      const appeal = await storage.createAppeal(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: validatedData.userId,
        action: "CREATE",
        entityType: "appeal",
        entityId: appeal.propertyId,
        details: { appeal },
        ipAddress: req.ip || "unknown"
      });
      
      res.status(201).json(appeal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appeal data", errors: error.errors });
      }
      console.error("Error creating appeal:", error);
      res.status(500).json({ message: "Failed to create appeal" });
    }
  });
  
  app.patch("/api/appeals/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Status is required and must be a string" });
      }
      
      const appeal = await storage.updateAppealStatus(id, status);
      
      if (!appeal) {
        return res.status(404).json({ message: "Appeal not found" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "UPDATE",
        entityType: "appealStatus",
        entityId: appeal.propertyId,
        details: { appealId: id, newStatus: status },
        ipAddress: req.ip || "unknown"
      });
      
      res.json(appeal);
    } catch (error) {
      console.error("Error updating appeal status:", error);
      res.status(500).json({ message: "Failed to update appeal status" });
    }
  });
  
  // Appeal comments routes
  app.get("/api/appeals/:appealId/comments", async (req, res) => {
    try {
      const appealId = parseInt(req.params.appealId);
      const comments = await storage.getAppealCommentsByAppealId(appealId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching appeal comments:", error);
      res.status(500).json({ message: "Failed to fetch appeal comments" });
    }
  });
  
  app.post("/api/appeal-comments", async (req, res) => {
    try {
      const validatedData = insertAppealCommentSchema.parse(req.body);
      const comment = await storage.createAppealComment(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: validatedData.userId,
        action: "CREATE",
        entityType: "appealComment",
        entityId: comment.appealId.toString(),
        details: { comment },
        ipAddress: req.ip || "unknown"
      });
      
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appeal comment data", errors: error.errors });
      }
      console.error("Error creating appeal comment:", error);
      res.status(500).json({ message: "Failed to create appeal comment" });
    }
  });
  
  // Appeal evidence routes
  app.get("/api/appeals/:appealId/evidence", async (req, res) => {
    try {
      const appealId = parseInt(req.params.appealId);
      const evidence = await storage.getAppealEvidenceByAppealId(appealId);
      res.json(evidence);
    } catch (error) {
      console.error("Error fetching appeal evidence:", error);
      res.status(500).json({ message: "Failed to fetch appeal evidence" });
    }
  });
  
  app.post("/api/appeal-evidence", async (req, res) => {
    try {
      const validatedData = insertAppealEvidenceSchema.parse(req.body);
      const evidence = await storage.createAppealEvidence(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: validatedData.uploadedBy,
        action: "CREATE",
        entityType: "appealEvidence",
        entityId: evidence.appealId.toString(),
        details: { evidence },
        ipAddress: req.ip || "unknown"
      });
      
      res.status(201).json(evidence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appeal evidence data", errors: error.errors });
      }
      console.error("Error creating appeal evidence:", error);
      res.status(500).json({ message: "Failed to create appeal evidence" });
    }
  });
  
  // Audit Logs route
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const auditLogs = await storage.getAuditLogs(limit);
      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });
  
  // AI Agents routes
  app.get("/api/ai-agents", async (_req, res) => {
    try {
      const agents = await storage.getAllAiAgents();
      
      // Enhance agents with additional data for the frontend
      const enhancedAgents = agents.map(agent => ({
        ...agent,
        agentId: `agent_${agent.id}`,
        description: getAgentDescription(agent.type),
        capabilities: getAgentCapabilities(agent.type),
      }));
      
      res.json(enhancedAgents);
    } catch (error) {
      console.error("Error fetching AI agents:", error);
      res.status(500).json({ message: "Failed to fetch AI agents" });
    }
  });
  
  // Get agent tasks
  app.get("/api/tasks", async (_req, res) => {
    try {
      // Since we don't have a task table yet, we'll return mock data
      // In a production environment, this would fetch from storage.getTasks()
      const tasks = [
        {
          id: "task_1",
          name: "Property Data Analysis",
          status: "running",
          assignedTo: "agent_1",
          description: "Analyze property values in the north zone and generate report",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          priority: 3
        },
        {
          id: "task_2",
          name: "Data Import Validation",
          status: "pending",
          assignedTo: "agent_2",
          description: "Validate the latest CSV import from county records",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          priority: 2
        },
        {
          id: "task_3",
          name: "Market Trend Analysis",
          status: "completed",
          assignedTo: "agent_3",
          description: "Generate market trend analysis for commercial properties Q1 2025",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date().toISOString(),
          priority: 1
        }
      ];
      
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  
  // Helper functions for enhancing agent data
  function getAgentDescription(type: string): string {
    const descriptions: Record<string, string> = {
      'data': 'Manages data import, validation, and synchronization with external systems',
      'assessment': 'Performs property value assessments and generates valuation reports',
      'reporting': 'Creates and distributes customized reports and data visualizations',
      'coordination': 'Manages communication and task assignment between agents',
      'research': 'Analyzes market trends and provides predictive insights'
    };
    
    return descriptions[type.toLowerCase()] || `${type} agent for property assessment tasks`;
  }
  
  function getAgentCapabilities(type: string): string[] {
    const capabilities: Record<string, string[]> = {
      'data': ['import', 'export', 'validate', 'transform'],
      'assessment': ['analyze', 'valuate', 'compare', 'predict'],
      'reporting': ['generate', 'schedule', 'distribute', 'customize'],
      'coordination': ['assign', 'monitor', 'notify', 'optimize'],
      'research': ['analyze', 'predict', 'recommend', 'visualize']
    };
    
    return capabilities[type.toLowerCase()] || ['analyze', 'process', 'report'];
  }
  
  app.patch("/api/ai-agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, performance } = req.body;
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Status is required and must be a string" });
      }
      
      if (performance !== undefined && (typeof performance !== 'number' || performance < 0 || performance > 100)) {
        return res.status(400).json({ message: "Performance must be a number between 0 and 100" });
      }
      
      const agent = await storage.updateAiAgentStatus(id, status, performance || 0);
      
      if (!agent) {
        return res.status(404).json({ message: "AI Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      console.error("Error updating AI agent:", error);
      res.status(500).json({ message: "Failed to update AI agent" });
    }
  });
  
  // System Activities route
  app.get("/api/system-activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const activities = await storage.getSystemActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching system activities:", error);
      res.status(500).json({ message: "Failed to fetch system activities" });
    }
  });
  
  // PACS Modules routes
  app.get("/api/pacs-modules", async (_req, res) => {
    try {
      const modules = await storage.getAllPacsModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching PACS modules:", error);
      res.status(500).json({ message: "Failed to fetch PACS modules" });
    }
  });
  
  app.post("/api/pacs-modules", async (req, res) => {
    try {
      // Create a new PACS module
      const module = await storage.upsertPacsModule(req.body);
      res.status(200).json(module);
    } catch (error) {
      console.error("Error creating PACS module:", error);
      res.status(500).json({ message: "Failed to create PACS module" });
    }
  });
  
  // Initialize PACS modules from the Benton County Washington CSV
  app.post("/api/pacs-modules/initialize", async (_req, res) => {
    try {
      // This would typically read from a CSV file but we're hardcoding for now
      // Based on PACS_Agent_Module_Map.csv
      const pacsModules = [
        { moduleName: "Land", source: "PACS WA", integration: "active", description: "Land record management for Benton County" },
        { moduleName: "Improvements", source: "PACS WA", integration: "active", description: "Benton County property improvements tracking" },
        { moduleName: "Fields", source: "PACS WA", integration: "active", description: "Custom field definitions for Benton County properties" },
        { moduleName: "Destroyed Property", source: "PACS WA", integration: "active", description: "Tracking of destroyed properties in Benton County" },
        { moduleName: "Imports", source: "PACS WA", integration: "active", description: "Data import functionality for Benton County" },
        { moduleName: "GIS", source: "PACS WA", integration: "active", description: "Geographic Information System integration" },
        { moduleName: "Valuation Methods", source: "PACS WA", integration: "active", description: "Property valuation methodologies" },
        { moduleName: "Comparable Sales", source: "PACS WA", integration: "active", description: "Comparable property sales data" },
        { moduleName: "Land Schedules", source: "PACS WA", integration: "active", description: "Schedules for land valuation" },
        { moduleName: "Improvement Schedules", source: "PACS WA", integration: "active", description: "Schedules for improvement valuation" },
        { moduleName: "Income", source: "PACS WA", integration: "pending", description: "Income approach for commercial property assessment" },
        { moduleName: "Building Permits", source: "PACS WA", integration: "active", description: "Building permit tracking and integration" },
        { moduleName: "Appeal Processing", source: "PACS WA", integration: "active", description: "Processing property assessment appeals" },
        { moduleName: "Inquiry Processing", source: "PACS WA", integration: "active", description: "Processing taxpayer inquiries" },
        { moduleName: "Tax Statements", source: "PACS WA", integration: "active", description: "Generation of tax statements" },
        { moduleName: "DOR Reports", source: "PACS WA", integration: "active", description: "Washington Department of Revenue reports" },
        { moduleName: "Levy Certification", source: "PACS WA", integration: "active", description: "Certification of tax levies" },
        { moduleName: "Current Use Properties", source: "PACS WA", integration: "active", description: "Management of current use properties" },
        { moduleName: "Data Entry", source: "PACS WA", integration: "active", description: "Data entry interface and validation" },
        { moduleName: "Panel Information", source: "PACS WA", integration: "active", description: "Property panel information management" }
      ];
      
      for (const module of pacsModules) {
        await storage.upsertPacsModule(module);
      }
      
      res.status(200).json({ message: "PACS modules initialized successfully" });
    } catch (error) {
      console.error("Error initializing PACS modules:", error);
      res.status(500).json({ message: "Failed to initialize PACS modules" });
    }
  });
  
  // MCP routes - Enhanced with JWT authentication
  
  /**
   * Endpoint to get API token using an API key
   * This endpoint allows clients to exchange API keys for short-lived JWT tokens
   */
  app.post("/api/auth/token", async (req, res) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ message: "API key is required" });
      }
      
      // Generate token from API key
      const token = authService.generateToken(apiKey);
      
      if (!token) {
        return res.status(401).json({ message: "Invalid API key" });
      }
      
      // Return the token
      res.json({ token });
      
    } catch (error) {
      console.error("Error generating token:", error);
      res.status(500).json({ message: "Failed to generate token" });
    }
  });
  
  /**
   * Get available MCP tools - Read-only access required
   */
  app.get("/api/mcp/tools", validateApiKey, requireScope(TokenScope.READ_ONLY), async (req, res) => {
    try {
      const tools = mcpService.getAvailableTools().map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }));
      
      // Log the successful authenticated access
      if (req.user) {
        await securityService.logSecurityEvent(
          req.user.userId,
          "MCP_TOOLS_ACCESS",
          "mcp_tools",
          null,
          { username: req.user.username, role: req.user.role },
          req.ip || "unknown"
        );
      }
      
      res.json(tools);
    } catch (error) {
      console.error("Error fetching MCP tools:", error);
      res.status(500).json({ message: "Failed to fetch MCP tools" });
    }
  });
  
  /**
   * Execute MCP tools - Read-write access required for most operations
   */
  app.post("/api/mcp/execute", validateApiKey, requireScope(TokenScope.READ_WRITE), async (req, res) => {
    try {
      // Get client IP for rate limiting and security logging
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      
      // Apply rate limiting - protect against brute force and DoS attacks
      const rateLimitCheck = securityService.checkRateLimit(clientIp, 'mcp_execute');
      if (!rateLimitCheck.allowed) {
        console.warn(`Rate limit exceeded for IP: ${clientIp} on MCP execute endpoint`);
        
        // Log the rate limit violation
        await securityService.logSecurityEvent(
          req.user?.userId || 1, // Use authenticated user ID if available
          "RATE_LIMIT_EXCEEDED",
          "mcp_request",
          null,
          { endpoint: "/api/mcp/execute", ipAddress: clientIp },
          clientIp
        );
        
        return res.status(429).json({
          success: false,
          message: rateLimitCheck.message || "Too many requests. Please try again later."
        });
      }
      
      const mcpRequest: MCPRequest = req.body;
      
      if (!mcpRequest.toolName) {
        return res.status(400).json({ message: "Tool name is required" });
      }
      
      // Pre-execution security checks
      // 1. Check for basic structure - prevent malformed requests
      if (!mcpRequest.parameters || typeof mcpRequest.parameters !== 'object') {
        await securityService.logSecurityEvent(
          req.user?.userId || 1, // Use authenticated user ID  
          "MALFORMED_REQUEST",
          "mcp_request",
          null,
          { 
            mcpRequest,
            username: req.user?.username || "unknown"
          },
          clientIp
        );
        return res.status(400).json({ 
          message: "Invalid request format. 'parameters' must be an object"
        });
      }
      
      // 2. Check for suspicious toolName values (SQL Injection via toolName)
      if (securityService.containsSqlInjection(mcpRequest.toolName)) {
        await securityService.logSecurityEvent(
          req.user?.userId || 1, // Use authenticated user ID
          "SQL_INJECTION_ATTEMPT",
          "mcp_request",
          null,
          { 
            toolName: mcpRequest.toolName,
            remoteAddress: clientIp,
            username: req.user?.username || "unknown"
          },
          clientIp
        );
        
        // Don't reveal that we detected an injection attempt
        return res.status(404).json({ 
          message: "Tool not found" 
        });
      }
      
      // Execute the MCP request with enhanced security
      const result = await mcpService.executeRequest(mcpRequest);
      
      // If there was a security violation, log it and return an appropriate status code
      if (!result.success && result.securityViolation) {
        // Return a 403 Forbidden for security violations
        return res.status(403).json({
          message: result.error,
          toolName: mcpRequest.toolName,
          success: false
        });
      }
      
      // If validation error, return 400 Bad Request
      if (!result.success && result.validationError) {
        return res.status(400).json({
          message: result.error,
          toolName: mcpRequest.toolName,
          success: false,
          validation: result.validationError
        });
      }
      
      // Create audit log for successful MCP request
      if (result.success) {
        await storage.createAuditLog({
          userId: req.user?.userId || 1, // Use authenticated user ID
          action: "EXECUTE",
          entityType: "mcp_tool",
          entityId: null,
          details: { 
            toolName: mcpRequest.toolName,
            success: result.success,
            username: req.user?.username || "unknown"
          },
          ipAddress: clientIp
        });
        
        // Send notification if this is a significant event
        if (mcpRequest.toolName.includes("Property") || mcpRequest.toolName.includes("Appeal")) {
          // Ensure toolName is never undefined for notification context
          const toolContext = mcpRequest.toolName || "unknown";
          
          notificationService.sendUserNotification(
            req.user?.userId.toString() || "1", // Use authenticated user ID
            NotificationType.SYSTEM_ALERT,
            "MCP Tool Executed",
            `MCP tool ${mcpRequest.toolName} was executed by ${req.user?.username || "admin"}`,
            "mcp_tool",
            toolContext,
            'medium'
          );
        }
      }
      
      // Return the result
      res.json(result);
    } catch (error) {
      console.error("Error executing MCP request:", error);
      res.status(500).json({ message: "Failed to execute MCP request" });
    }
  });
  
  // Natural Language Query routes
  app.post("/api/natural-language/query", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required and must be a string" });
      }
      
      // Try Anthropic first (preferred), and fall back to OpenAI if it fails
      let result;
      try {
        // Check if Anthropic API key is available
        if (process.env.ANTHROPIC_API_KEY) {
          result = await processNaturalLanguageWithAnthropic(query);
        } else {
          // Fall back to OpenAI
          result = await processNaturalLanguageQuery(query);
        }
      } catch (error) {
        console.error("Error with primary NLP service, trying fallback:", error);
        
        // If the first attempt fails, try the other service
        if (process.env.ANTHROPIC_API_KEY) {
          result = await processNaturalLanguageQuery(query);
        } else {
          result = await processNaturalLanguageWithAnthropic(query);
        }
      }
      
      // Create audit log for the query
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "QUERY",
        entityType: "naturalLanguage",
        entityId: null,
        details: { query, resultCount: result.count },
        ipAddress: req.ip || "unknown"
      });
      
      // Create system activity for the NLP query
      await storage.createSystemActivity({
        agentId: 3, // Assuming NLP Agent ID
        activity: `Processed natural language query: "${query}"`,
        entityType: "query",
        entityId: null
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error processing natural language query:", error);
      res.status(500).json({ message: "Failed to process natural language query" });
    }
  });
  
  app.post("/api/natural-language/summary", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required and must be a string" });
      }
      
      // Try Anthropic first (preferred), and fall back to OpenAI if it fails
      let result;
      try {
        // Check if Anthropic API key is available
        if (process.env.ANTHROPIC_API_KEY) {
          result = await getSummaryWithAnthropic(query);
        } else {
          // Fall back to OpenAI
          result = await getSummaryFromNaturalLanguage(query);
        }
      } catch (error) {
        console.error("Error with primary NLP service for summary, trying fallback:", error);
        
        // If the first attempt fails, try the other service
        if (process.env.ANTHROPIC_API_KEY) {
          result = await getSummaryFromNaturalLanguage(query);
        } else {
          result = await getSummaryWithAnthropic(query);
        }
      }
      
      // Create audit log for the summary
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "SUMMARY",
        entityType: "naturalLanguage",
        entityId: null,
        details: { query, summary: result.summary },
        ipAddress: req.ip || "unknown"
      });
      
      // Create system activity for the summary
      await storage.createSystemActivity({
        agentId: 3, // Assuming NLP Agent ID
        activity: `Generated summary for query: "${query}"`,
        entityType: "summary",
        entityId: null
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error generating natural language summary:", error);
      res.status(500).json({ message: "Failed to generate natural language summary" });
    }
  });

  // Perplexity API routes
  app.post("/api/perplexity/query", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required and must be a string" });
      }
      
      const result = await perplexityService.textCompletion(query, {
        systemPrompt: "You are a Property Assessment Assistant for Benton County, Washington. Provide helpful, accurate information about property assessments, tax calculations, and related processes.",
        temperature: 0.2
      });
      
      // Create audit log for the query
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "QUERY",
        entityType: "perplexity",
        entityId: null,
        details: { query, result: result.substring(0, 100) + "..." },
        ipAddress: req.ip || "unknown"
      });
      
      res.json({ result });
    } catch (error) {
      console.error("Error processing Perplexity query:", error);
      res.status(500).json({ message: "Failed to process query with Perplexity API" });
    }
  });
  
  app.post("/api/perplexity/property-analysis", async (req, res) => {
    try {
      const { propertyId, analysisType } = req.body;
      
      if (!propertyId || !analysisType) {
        return res.status(400).json({ message: "Property ID and analysis type are required" });
      }
      
      // Get property data
      const property = await storage.getPropertyByPropertyId(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Get related data
      const landRecords = await storage.getLandRecordsByPropertyId(propertyId);
      const improvements = await storage.getImprovementsByPropertyId(propertyId);
      
      // Prepare complete property data for analysis
      const propertyData = {
        ...property,
        landRecords,
        improvements
      };
      
      const result = await perplexityService.analyzePropertyData(propertyData, analysisType);
      
      // Create audit log for the analysis
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "ANALYZE",
        entityType: "property",
        entityId: propertyId,
        details: { analysisType, result: result.substring(0, 100) + "..." },
        ipAddress: req.ip || "unknown"
      });
      
      res.json({ result });
    } catch (error) {
      console.error("Error analyzing property with Perplexity:", error);
      res.status(500).json({ message: "Failed to analyze property with Perplexity API" });
    }
  });
  
  app.post("/api/perplexity/valuation-insights", async (req, res) => {
    try {
      const { propertyId } = req.body;
      
      if (!propertyId) {
        return res.status(400).json({ message: "Property ID is required" });
      }
      
      // Get property data
      const property = await storage.getPropertyByPropertyId(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Get related data
      const landRecords = await storage.getLandRecordsByPropertyId(propertyId);
      const improvements = await storage.getImprovementsByPropertyId(propertyId);
      const fields = await storage.getFieldsByPropertyId(propertyId);
      
      // Prepare complete property data for valuation insights
      const propertyData = {
        ...property,
        landRecords,
        improvements,
        fields
      };
      
      const result = await perplexityService.getPropertyValuationInsights(propertyId, propertyData);
      
      // Create audit log for the valuation insights
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "VALUATION_INSIGHTS",
        entityType: "property",
        entityId: propertyId,
        details: { result: result.substring(0, 100) + "..." },
        ipAddress: req.ip || "unknown"
      });
      
      res.json({ result });
    } catch (error) {
      console.error("Error getting valuation insights with Perplexity:", error);
      res.status(500).json({ message: "Failed to get valuation insights with Perplexity API" });
    }
  });

  // Mapping integration routes
  app.get("/api/mapping/esri-config", (_req, res) => {
    try {
      const config = mappingIntegration.getEsriMapConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching ESRI map config:", error);
      res.status(500).json({ message: "Failed to fetch ESRI map config" });
    }
  });
  
  app.get("/api/mapping/google-config", (_req, res) => {
    try {
      const config = mappingIntegration.getGoogleMapConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching Google map config:", error);
      res.status(500).json({ message: "Failed to fetch Google map config" });
    }
  });
  
  app.get("/api/mapping/pictometry-config", (_req, res) => {
    try {
      const config = mappingIntegration.getPictometryConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching Pictometry config:", error);
      res.status(500).json({ message: "Failed to fetch Pictometry config" });
    }
  });
  
  app.get("/api/mapping/property/:propertyId", async (req, res) => {
    try {
      const property = await storage.getPropertyByPropertyId(req.params.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      const parcelInfo = await mappingIntegration.findParcelByPropertyId(req.params.propertyId);
      res.json(parcelInfo);
    } catch (error) {
      console.error("Error fetching property map data:", error);
      res.status(500).json({ message: "Failed to fetch property map data" });
    }
  });
  
  app.get("/api/mapping/google-url", (req, res) => {
    try {
      const { address } = req.query;
      if (!address || typeof address !== 'string') {
        return res.status(400).json({ message: "Address is required" });
      }
      
      const url = mappingIntegration.generateGoogleMapsUrl(address);
      res.json({ url });
    } catch (error) {
      console.error("Error generating Google Maps URL:", error);
      res.status(500).json({ message: "Failed to generate Google Maps URL" });
    }
  });
  
  app.get("/api/mapping/pictometry-url", (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: "Valid lat and lng coordinates are required" });
      }
      
      const url = mappingIntegration.generatePictometryUrl(lat, lng);
      res.json({ url });
    } catch (error) {
      console.error("Error generating Pictometry URL:", error);
      res.status(500).json({ message: "Failed to generate Pictometry URL" });
    }
  });
  
  // PACS Integration routes
  app.get("/api/pacs/property/:propertyId/details", async (req, res) => {
    try {
      const details = await pacsIntegration.getPropertyFullDetails(req.params.propertyId);
      if (!details) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(details);
    } catch (error) {
      console.error("Error fetching property full details:", error);
      res.status(500).json({ message: "Failed to fetch property full details" });
    }
  });
  
  app.get("/api/pacs/properties/value-range", async (req, res) => {
    try {
      const minValue = parseFloat(req.query.min as string);
      const maxValue = parseFloat(req.query.max as string);
      
      if (isNaN(minValue) || isNaN(maxValue)) {
        return res.status(400).json({ message: "Valid min and max values are required" });
      }
      
      const properties = await pacsIntegration.getPropertiesByValueRange(minValue, maxValue);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties by value range:", error);
      res.status(500).json({ message: "Failed to fetch properties by value range" });
    }
  });
  
  app.get("/api/pacs/properties/type/:type", async (req, res) => {
    try {
      const properties = await pacsIntegration.getPropertiesByType(req.params.type);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties by type:", error);
      res.status(500).json({ message: "Failed to fetch properties by type" });
    }
  });
  
  app.get("/api/pacs/properties/status/:status", async (req, res) => {
    try {
      const properties = await pacsIntegration.getPropertiesByStatus(req.params.status);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties by status:", error);
      res.status(500).json({ message: "Failed to fetch properties by status" });
    }
  });
  
  app.get("/api/pacs/land-records/zoning/:zoning", async (req, res) => {
    try {
      const landRecords = await pacsIntegration.getLandRecordsByZone(req.params.zoning);
      res.json(landRecords);
    } catch (error) {
      console.error("Error fetching land records by zoning:", error);
      res.status(500).json({ message: "Failed to fetch land records by zoning" });
    }
  });
  
  app.get("/api/pacs/improvements/type/:type", async (req, res) => {
    try {
      const improvements = await pacsIntegration.getImprovementsByType(req.params.type);
      res.json(improvements);
    } catch (error) {
      console.error("Error fetching improvements by type:", error);
      res.status(500).json({ message: "Failed to fetch improvements by type" });
    }
  });
  
  app.get("/api/pacs/improvements/year-built-range", async (req, res) => {
    try {
      const minYear = parseInt(req.query.min as string);
      const maxYear = parseInt(req.query.max as string);
      
      if (isNaN(minYear) || isNaN(maxYear)) {
        return res.status(400).json({ message: "Valid min and max years are required" });
      }
      
      const improvements = await pacsIntegration.getImprovementsByYearBuiltRange(minYear, maxYear);
      res.json(improvements);
    } catch (error) {
      console.error("Error fetching improvements by year built range:", error);
      res.status(500).json({ message: "Failed to fetch improvements by year built range" });
    }
  });
  
  app.get("/api/pacs/appeals/active", async (_req, res) => {
    try {
      const appeals = await pacsIntegration.getActiveAppeals();
      res.json(appeals);
    } catch (error) {
      console.error("Error fetching active appeals:", error);
      res.status(500).json({ message: "Failed to fetch active appeals" });
    }
  });
  
  app.get("/api/pacs/properties/recent-changes", async (_req, res) => {
    try {
      const properties = await pacsIntegration.getRecentPropertyChanges();
      res.json(properties);
    } catch (error) {
      console.error("Error fetching recent property changes:", error);
      res.status(500).json({ message: "Failed to fetch recent property changes" });
    }
  });
  
  // Notification routes
  app.get("/api/notifications/user/:userId", (req, res) => {
    try {
      const notifications = notificationService.getUserNotifications(req.params.userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching user notifications:", error);
      res.status(500).json({ message: "Failed to fetch user notifications" });
    }
  });
  
  app.get("/api/notifications/system", (_req, res) => {
    try {
      const notifications = notificationService.getSystemNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching system notifications:", error);
      res.status(500).json({ message: "Failed to fetch system notifications" });
    }
  });
  
  app.post("/api/notifications/mark-read", (req, res) => {
    try {
      const { userId, notificationId } = req.body;
      
      if (!userId || !notificationId) {
        return res.status(400).json({ message: "User ID and notification ID are required" });
      }
      
      const success = notificationService.markNotificationAsRead(userId, notificationId);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  
  // Create a system notification (for testing)
  app.post("/api/notifications/system", (req, res) => {
    try {
      const { title, message, type, entityType, entityId } = req.body;
      
      if (!title || !message || !type) {
        return res.status(400).json({ message: "Title, message, and type are required" });
      }
      
      // Validate notification type
      if (!Object.values(NotificationType).includes(type)) {
        return res.status(400).json({ 
          message: "Invalid notification type. Valid types: " + 
            Object.values(NotificationType).join(", ") 
        });
      }
      
      const notification = notificationService.broadcastSystemNotification(
        type as NotificationType,
        title,
        message,
        entityType,
        entityId,
        'medium'
      );
      
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating system notification:", error);
      res.status(500).json({ message: "Failed to create system notification" });
    }
  });
  
  // Initialize property story generator
  const propertyStoryGenerator = new PropertyStoryGenerator(storage);
  
  /**
   * Property Story Generator routes
   * AI-powered narrative descriptions of properties
   */
  
  // Generate a story for a single property (GET method)
  app.get("/api/property-stories/:propertyId", async (req, res) => {
    try {
      const { propertyId } = req.params;
      
      // Parse options from query parameters
      const options: PropertyStoryOptions = {
        focus: req.query.focus as any,
        includeImprovements: req.query.includeImprovements === 'true',
        includeLandRecords: req.query.includeLandRecords === 'true',
        includeAppeals: req.query.includeAppeals === 'true',
        maxLength: req.query.maxLength ? parseInt(req.query.maxLength as string) : undefined
      };
      
      // Generate the property story
      const result = await propertyStoryGenerator.generatePropertyStory(propertyId, options);
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "GENERATE",
        entityType: "propertyStory",
        entityId: propertyId,
        details: { options },
        ipAddress: req.ip || "unknown"
      });
      
      // Return the result
      res.json(result);
    } catch (error) {
      console.error('Error generating property story:', error);
      res.status(500).json({ 
        error: 'Failed to generate property story',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Generate a story for a single property (POST method)
  app.post("/api/property-stories", async (req, res) => {
    try {
      const { propertyId, options } = req.body;
      
      // Validate input
      if (!propertyId) {
        return res.status(400).json({ error: 'Property ID is required' });
      }
      
      // Generate the property story
      const result = await propertyStoryGenerator.generatePropertyStory(propertyId, options || {});
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "GENERATE",
        entityType: "propertyStory",
        entityId: propertyId,
        details: { options },
        ipAddress: req.ip || "unknown"
      });
      
      // Return the result
      res.json(result);
    } catch (error) {
      console.error('Error generating property story:', error);
      res.status(500).json({ 
        error: 'Failed to generate property story',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Generate stories for multiple properties
  app.post("/api/property-stories/multiple", async (req, res) => {
    try {
      const { propertyIds, options } = req.body;
      
      // Validate input
      if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
        return res.status(400).json({ error: 'Property IDs array is required' });
      }
      
      // Generate stories for multiple properties
      const results = await propertyStoryGenerator.generateMultiplePropertyStories(
        propertyIds,
        options || {}
      );
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "GENERATE_MULTIPLE",
        entityType: "propertyStory",
        entityId: propertyIds.join(','),
        details: { propertyIds, options },
        ipAddress: req.ip || "unknown"
      });
      
      // Return the results
      res.json(results);
    } catch (error) {
      console.error('Error generating multiple property stories:', error);
      res.status(500).json({ 
        error: 'Failed to generate multiple property stories',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Generate a comparison between multiple properties
  app.post("/api/property-stories/compare", async (req, res) => {
    try {
      const { propertyIds, options } = req.body;
      
      // Validate input
      if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length < 2) {
        return res.status(400).json({ error: 'At least two property IDs are required for comparison' });
      }
      
      // Generate comparison
      const result = await propertyStoryGenerator.generatePropertyComparison(
        propertyIds,
        options || {}
      );
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "GENERATE_COMPARISON",
        entityType: "propertyStory",
        entityId: propertyIds.join(','),
        details: { propertyIds, options },
        ipAddress: req.ip || "unknown"
      });
      
      // Return the result
      res.json(result);
    } catch (error) {
      console.error('Error generating property comparison:', error);
      res.status(500).json({ 
        error: 'Failed to generate property comparison',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Generate a story for a single property with property ID in URL (POST method)
  app.post("/api/property-stories/:propertyId", async (req, res) => {
    try {
      const { propertyId } = req.params;
      const options: PropertyStoryOptions = req.body || {};
      
      // Generate the property story
      const result = await propertyStoryGenerator.generatePropertyStory(propertyId, options);
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "GENERATE",
        entityType: "propertyStory",
        entityId: propertyId,
        details: { options },
        ipAddress: req.ip || "unknown"
      });
      
      // Return the result
      res.json(result);
    } catch (error) {
      console.error('Error generating property story with custom options:', error);
      res.status(500).json({ 
        error: 'Failed to generate property story',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  /**
   * Property Insight Sharing routes
   * Routes for creating, retrieving, and managing shareable property insights
   */
  
  // Get all property insight shares
  app.get("/api/property-insight-shares", async (req, res) => {
    try {
      const shares = await storage.getAllPropertyInsightShares();
      res.json(shares);
    } catch (error) {
      console.error("Error fetching property insight shares:", error);
      res.status(500).json({ message: "Failed to fetch property insight shares" });
    }
  });
  
  // Get property insight shares by property ID
  app.get("/api/property-insight-shares/property/:propertyId", async (req, res) => {
    try {
      const shares = await storage.getPropertyInsightSharesByPropertyId(req.params.propertyId);
      res.json(shares);
    } catch (error) {
      console.error("Error fetching property insight shares:", error);
      res.status(500).json({ message: "Failed to fetch property insight shares" });
    }
  });
  
  // Get a specific property insight share by ID
  app.get("/api/property-insight-shares/:shareId", async (req, res) => {
    try {
      const shareId = req.params.shareId;
      const password = req.query.password as string | undefined;
      
      const share = await propertyInsightSharingService.getPropertyInsightShare(shareId, password);
      
      if (!share) {
        return res.status(404).json({ message: "Property insight share not found or expired" });
      }
      
      // Increment access count and create audit log
      await propertyInsightSharingService.trackShareAccess(shareId);
      
      res.json(share);
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid password") {
        return res.status(403).json({ message: "Invalid password for protected share" });
      }
      console.error("Error fetching property insight share:", error);
      res.status(500).json({ message: "Failed to fetch property insight share" });
    }
  });
  
  // Create a new property insight share
  app.post("/api/property-insight-shares", async (req, res) => {
    try {
      const shareData = req.body;
      
      // Generate a unique UUID for the share
      if (!shareData.shareId) {
        shareData.shareId = randomUUID();
      }
      
      // Set default format if not provided
      if (!shareData.format) {
        shareData.format = "detailed";
      }
      
      // Convert expiresInDays to an actual date if provided
      if (shareData.expiresInDays) {
        const days = parseInt(shareData.expiresInDays.toString());
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        shareData.expiresAt = expiryDate;
        delete shareData.expiresInDays;
      }
      
      const share = await propertyInsightSharingService.createPropertyInsightShare(shareData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: shareData.createdBy || 1, // Default to admin user if not specified
        action: "CREATE",
        entityType: "propertyInsightShare",
        entityId: shareData.propertyId,
        details: { shareId: share.shareId, title: share.title },
        ipAddress: req.ip || "unknown"
      });
      
      res.status(201).json(share);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid share data", errors: error.errors });
      }
      console.error("Error creating property insight share:", error);
      res.status(500).json({ message: "Failed to create property insight share" });
    }
  });
  
  // Update a property insight share
  app.patch("/api/property-insight-shares/:shareId", async (req, res) => {
    try {
      const shareId = req.params.shareId;
      const updates = req.body;
      
      // Convert expiresInDays to an actual date if provided
      if (updates.expiresInDays) {
        const days = parseInt(updates.expiresInDays.toString());
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        updates.expiresAt = expiryDate;
        delete updates.expiresInDays;
      }
      
      const share = await propertyInsightSharingService.updatePropertyInsightShare(shareId, updates);
      
      if (!share) {
        return res.status(404).json({ message: "Property insight share not found" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: updates.createdBy || 1, // Default to admin user if not specified
        action: "UPDATE",
        entityType: "propertyInsightShare",
        entityId: share.propertyId,
        details: { shareId: share.shareId, updatedFields: Object.keys(updates) },
        ipAddress: req.ip || "unknown"
      });
      
      res.json(share);
    } catch (error) {
      console.error("Error updating property insight share:", error);
      res.status(500).json({ message: "Failed to update property insight share" });
    }
  });
  
  // Delete a property insight share
  app.delete("/api/property-insight-shares/:shareId", async (req, res) => {
    try {
      const shareId = req.params.shareId;
      const share = await storage.getPropertyInsightShareById(shareId);
      
      if (!share) {
        return res.status(404).json({ message: "Property insight share not found" });
      }
      
      const success = await propertyInsightSharingService.deletePropertyInsightShare(shareId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete property insight share" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Default to admin user
        action: "DELETE",
        entityType: "propertyInsightShare",
        entityId: share.propertyId,
        details: { shareId },
        ipAddress: req.ip || "unknown"
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting property insight share:", error);
      res.status(500).json({ message: "Failed to delete property insight share" });
    }
  });
  
  // Generate QR code for a property insight share
  app.get("/api/property-insight-shares/:shareId/qrcode", async (req, res) => {
    try {
      const shareId = req.params.shareId;
      const width = req.query.width ? parseInt(req.query.width as string) : undefined;
      const margin = req.query.margin ? parseInt(req.query.margin as string) : undefined;
      
      // Validate if share exists
      const share = await storage.getPropertyInsightShareById(shareId);
      
      if (!share) {
        return res.status(404).json({ message: "Property insight share not found or expired" });
      }
      
      // Generate QR code
      const qrOptions = {
        width,
        margin,
        color: {
          dark: req.query.darkColor as string || '#000000',
          light: req.query.lightColor as string || '#FFFFFF'
        }
      };
      
      const qrCodeDataUrl = await sharingUtils.generateQRCode(shareId, qrOptions);
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Default to admin user
        action: "READ",
        entityType: "propertyInsightShareQRCode",
        entityId: share.propertyId.toString(),
        details: { shareId },
        ipAddress: req.ip || "unknown"
      });
      
      // Set proper content type headers to ensure JSON response
      res.setHeader('Content-Type', 'application/json');
      res.json({ qrCode: qrCodeDataUrl });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });
  
  // Prepare PDF export data for a property insight share
  app.get("/api/property-insight-shares/:shareId/pdf-data", async (req, res) => {
    try {
      const shareId = req.params.shareId;
      
      // Validate if share exists
      const share = await storage.getPropertyInsightShareById(shareId);
      
      if (!share) {
        return res.status(404).json({ message: "Property insight share not found or expired" });
      }
      
      // Prepare PDF export data
      const pdfOptions = {
        title: req.query.title as string || undefined,
        author: req.query.author as string || undefined,
        includeImages: req.query.includeImages !== 'false',
        includeMetadata: req.query.includeMetadata !== 'false'
      };
      
      // Get the PDF data - this will include the QR code promise
      const pdfData = sharingUtils.preparePDFExportData(share, pdfOptions);
      
      // Resolve the QR code promise if included
      if (pdfData.qrCodePromise) {
        pdfData.qrCode = await pdfData.qrCodePromise;
        delete pdfData.qrCodePromise;
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Default to admin user
        action: "READ",
        entityType: "propertyInsightSharePDF",
        entityId: share.propertyId.toString(),
        details: { shareId },
        ipAddress: req.ip || "unknown"
      });
      
      // Set proper content type headers to ensure JSON response
      res.setHeader('Content-Type', 'application/json');
      res.json(pdfData);
    } catch (error) {
      console.error("Error preparing PDF export data:", error);
      res.status(500).json({ message: "Failed to prepare PDF export data" });
    }
  });
  
  // Email a property insight share
  // Debug endpoint to create test email account (only available in non-production)
  app.get("/api/debug/email/create-test-account", async (_req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        message: "This endpoint is not available in production mode"
      });
    }

    try {
      const testAccount = await createTestEmailAccount();
      res.json({
        success: true,
        message: "Test email account created successfully",
        account: {
          user: testAccount.user,
          host: testAccount.smtp.host,
          port: testAccount.smtp.port
        },
        testMailbox: {
          previewUrl: testAccount.previewUrl
        }
      });
    } catch (error) {
      console.error("Error creating test email account:", error);
      res.status(500).json({
        message: "Failed to create test email account"
      });
    }
  });
  
  // General purpose email sending endpoint for property insights
  app.post("/api/email/send", async (req, res) => {
    try {
      // Validate request body
      const { to, subject, message, propertyId, propertyName, propertyAddress } = req.body;
      
      if (!to || !subject || !message || !propertyId) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          requiredFields: ["to", "subject", "message", "propertyId"] 
        });
      }
      
      // Check if email service is configured
      const emailServiceConfigured = await isEmailServiceConfigured();
      if (!emailServiceConfigured) {
        return res.status(503).json({ 
          message: "Email service is not configured. The system is set up to use Nodemailer for email delivery."
        });
      }
      
      // Create a mock share URL since we don't have an actual share ID
      const shareUrl = `${req.protocol}://${req.get('host')}/property/${propertyId}`;
      
      // Send email
      const success = await sendPropertyInsightShareEmail(
        to,
        subject,
        message,
        shareUrl,
        propertyId,
        propertyName,
        propertyAddress
      );
      
      if (!success) {
        return res.status(500).json({ message: "Failed to send email" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Default to admin user
        action: "SEND_EMAIL",
        entityType: "property",
        entityId: propertyId,
        details: { 
          recipient: to,
          subject,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.ip || "unknown"
      });
      
      res.json({ 
        success: true, 
        message: "Email sent successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  app.post("/api/property-insight-shares/:shareId/email", async (req, res) => {
    try {
      const shareId = req.params.shareId;
      
      // Validate request body
      const { recipient, subject, message } = req.body;
      
      if (!recipient || !subject || !message) {
        return res.status(400).json({ 
          message: "Missing required fields", 
          requiredFields: ["recipient", "subject", "message"] 
        });
      }
      
      // Check if email service is configured
      const emailServiceConfigured = await isEmailServiceConfigured();
      if (!emailServiceConfigured) {
        return res.status(503).json({ 
          message: "Email service is not configured. The system is set up to use Nodemailer for email delivery."
        });
      }
      
      // Validate if share exists
      const share = await storage.getPropertyInsightShareById(shareId);
      
      if (!share) {
        return res.status(404).json({ message: "Property insight share not found or expired" });
      }
      
      // Generate shareable URL
      const shareableUrl = sharingUtils.generateShareableUrl(shareId);
      
      // Send email
      const success = await sendPropertyInsightShareEmail(
        recipient,
        subject,
        message,
        shareableUrl,
        share.propertyId,
        share.propertyName || undefined,
        share.propertyAddress || undefined
      );
      
      if (!success) {
        return res.status(500).json({ message: "Failed to send email" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Default to admin user
        action: "SHARE_EMAIL",
        entityType: "propertyInsightShare",
        entityId: shareId,
        details: { 
          shareId,
          recipient,
          subject,
          timestamp: new Date().toISOString()
        },
        ipAddress: req.ip || "unknown"
      });
      
      res.json({ 
        success: true, 
        message: "Email sent successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email" });
    }
  });
  
  /**
   * Comparable Sales Analysis routes
   * Routes for creating, retrieving, and managing comparable sales analysis data
   */
  
  // Get all comparable sales
  app.get("/api/comparable-sales", async (_req, res) => {
    try {
      const comparableSales = await storage.getAllComparableSales();
      res.json(comparableSales);
    } catch (error) {
      console.error("Error fetching comparable sales:", error);
      res.status(500).json({ message: "Failed to fetch comparable sales" });
    }
  });
  
  // Get comparable sales by property ID
  app.get("/api/properties/:propertyId/comparable-sales", async (req, res) => {
    try {
      const { propertyId } = req.params;
      const comparableSales = await storage.getComparableSalesByPropertyId(propertyId);
      res.json(comparableSales);
    } catch (error) {
      console.error("Error fetching comparable sales for property:", error);
      res.status(500).json({ message: "Failed to fetch comparable sales for property" });
    }
  });
  
  // Get a single comparable sale by ID
  app.get("/api/comparable-sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const comparableSale = await storage.getComparableSaleById(id);
      
      if (!comparableSale) {
        return res.status(404).json({ message: "Comparable sale not found" });
      }
      
      res.json(comparableSale);
    } catch (error) {
      console.error("Error fetching comparable sale:", error);
      res.status(500).json({ message: "Failed to fetch comparable sale" });
    }
  });
  
  // Create a new comparable sale
  app.post("/api/comparable-sales", async (req, res) => {
    try {
      const validatedData = insertComparableSaleSchema.parse(req.body);
      const comparableSale = await storage.createComparableSale(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: validatedData.createdBy,
        action: "CREATE",
        entityType: "comparableSale",
        entityId: comparableSale.id.toString(),
        details: { comparableSale },
        ipAddress: req.ip || "unknown"
      });
      
      res.status(201).json(comparableSale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comparable sale data", errors: error.errors });
      }
      console.error("Error creating comparable sale:", error);
      res.status(500).json({ message: "Failed to create comparable sale" });
    }
  });
  
  // Update a comparable sale
  app.patch("/api/comparable-sales/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertComparableSaleSchema.partial().parse(req.body);
      const comparableSale = await storage.updateComparableSale(id, validatedData);
      
      if (!comparableSale) {
        return res.status(404).json({ message: "Comparable sale not found" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: validatedData.createdBy || 1,
        action: "UPDATE",
        entityType: "comparableSale",
        entityId: comparableSale.id.toString(),
        details: { 
          comparableSaleId: id,
          updatedFields: Object.keys(validatedData) 
        },
        ipAddress: req.ip || "unknown"
      });
      
      res.json(comparableSale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comparable sale data", errors: error.errors });
      }
      console.error("Error updating comparable sale:", error);
      res.status(500).json({ message: "Failed to update comparable sale" });
    }
  });
  
  // Comparable Sales Analysis routes
  
  // Get all comparable sales analyses
  app.get("/api/comparable-sales-analyses", async (_req, res) => {
    try {
      const analyses = await storage.getAllComparableSalesAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching comparable sales analyses:", error);
      res.status(500).json({ message: "Failed to fetch comparable sales analyses" });
    }
  });
  
  // Get comparable sales analyses for a specific property
  app.get("/api/properties/:propertyId/comparable-sales-analyses", async (req, res) => {
    try {
      const { propertyId } = req.params;
      const analyses = await storage.getComparableSalesAnalysesByPropertyId(propertyId);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching comparable sales analyses for property:", error);
      res.status(500).json({ message: "Failed to fetch comparable sales analyses for property" });
    }
  });
  
  // Get a single comparable sales analysis by ID
  app.get("/api/comparable-sales-analyses/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const analysis = await storage.getComparableSalesAnalysisById(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Comparable sales analysis not found" });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching comparable sales analysis:", error);
      res.status(500).json({ message: "Failed to fetch comparable sales analysis" });
    }
  });
  
  // Create a new comparable sales analysis
  app.post("/api/comparable-sales-analyses", async (req, res) => {
    try {
      const validatedData = insertComparableSalesAnalysisSchema.parse(req.body);
      const analysis = await storage.createComparableSalesAnalysis(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: validatedData.createdBy,
        action: "CREATE",
        entityType: "comparableSalesAnalysis",
        entityId: analysis.id.toString(),
        details: { analysis },
        ipAddress: req.ip || "unknown"
      });
      
      res.status(201).json(analysis);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comparable sales analysis data", errors: error.errors });
      }
      console.error("Error creating comparable sales analysis:", error);
      res.status(500).json({ message: "Failed to create comparable sales analysis" });
    }
  });
  
  // Update a comparable sales analysis
  app.patch("/api/comparable-sales-analyses/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const validatedData = insertComparableSalesAnalysisSchema.partial().parse(req.body);
      const analysis = await storage.updateComparableSalesAnalysis(id, validatedData);
      
      if (!analysis) {
        return res.status(404).json({ message: "Comparable sales analysis not found" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: validatedData.createdBy || 1,
        action: "UPDATE",
        entityType: "comparableSalesAnalysis",
        entityId: analysis.id.toString(),
        details: { 
          analysisId: id,
          updatedFields: Object.keys(validatedData) 
        },
        ipAddress: req.ip || "unknown"
      });
      
      res.json(analysis);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comparable sales analysis data", errors: error.errors });
      }
      console.error("Error updating comparable sales analysis:", error);
      res.status(500).json({ message: "Failed to update comparable sales analysis" });
    }
  });
  
  // Comparable Analysis Entry routes
  
  // Get all comparable analysis entries for a specific analysis
  app.get("/api/comparable-sales-analyses/:analysisId/entries", async (req, res) => {
    try {
      const { analysisId } = req.params;
      const entries = await storage.getComparableAnalysisEntriesByAnalysisId(analysisId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching comparable analysis entries:", error);
      res.status(500).json({ message: "Failed to fetch comparable analysis entries" });
    }
  });
  
  // Get a single comparable analysis entry by ID
  app.get("/api/comparable-analysis-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await storage.getComparableAnalysisEntryById(id);
      
      if (!entry) {
        return res.status(404).json({ message: "Comparable analysis entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      console.error("Error fetching comparable analysis entry:", error);
      res.status(500).json({ message: "Failed to fetch comparable analysis entry" });
    }
  });
  
  // Create a new comparable analysis entry
  app.post("/api/comparable-analysis-entries", async (req, res) => {
    try {
      const validatedData = insertComparableAnalysisEntrySchema.parse(req.body);
      const entry = await storage.createComparableAnalysisEntry(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "CREATE",
        entityType: "comparableAnalysisEntry",
        entityId: entry.id.toString(),
        details: { entry },
        ipAddress: req.ip || "unknown"
      });
      
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comparable analysis entry data", errors: error.errors });
      }
      console.error("Error creating comparable analysis entry:", error);
      res.status(500).json({ message: "Failed to create comparable analysis entry" });
    }
  });
  
  // Update a comparable analysis entry
  app.patch("/api/comparable-analysis-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertComparableAnalysisEntrySchema.partial().parse(req.body);
      const entry = await storage.updateComparableAnalysisEntry(id, validatedData);
      
      if (!entry) {
        return res.status(404).json({ message: "Comparable analysis entry not found" });
      }
      
      // Create audit log
      await storage.createAuditLog({
        userId: 1, // Assuming admin user
        action: "UPDATE",
        entityType: "comparableAnalysisEntry",
        entityId: entry.id.toString(),
        details: { 
          entryId: id,
          updatedFields: Object.keys(validatedData) 
        },
        ipAddress: req.ip || "unknown"
      });
      
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comparable analysis entry data", errors: error.errors });
      }
      console.error("Error updating comparable analysis entry:", error);
      res.status(500).json({ message: "Failed to update comparable analysis entry" });
    }
  });
  
  // Register data import routes
  app.use("/api/data-import", createDataImportRoutes(storage));
  
  // Initialize services for advanced analytics
  const llmService = new LLMService();
  
  // Set the LLM configuration if API key is available
  if (process.env.OPENAI_API_KEY) {
    llmService.setConfig({
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  const marketPredictionModel = new EnhancedMarketPredictionModel(storage, llmService);
  const riskAssessmentEngine = new EnhancedRiskAssessmentEngine(storage, llmService);
  
  // Register market, risk, and analytics routes
  app.use('/api/market', createMarketRoutes(storage, llmService));
  app.use('/api/risk-assessment', createRiskRoutes(storage, llmService));
  app.use('/api/analytics', createAnalyticsRoutes(
    storage, 
    marketPredictionModel,
    riskAssessmentEngine,
    llmService
  ));
  
  // Register AI Assistant routes
  app.use('/api/ai-assistant', aiAssistantRoutes);
  
  // Add error handling middleware for API routes only
  // This will only catch errors for /api/* routes
  app.use('/api', errorHandler);
  
  // Create HTTP server and initialize WebSocket for real-time notifications
  const httpServer = createServer(app);
  
  // Initialize notification service with the HTTP server
  notificationService.initialize(httpServer);
  
  // Initialize agent WebSocket service with the HTTP server
  // Add detailed logging to catch WebSocket issues
  console.log('[WebSocket Debug] Setting up WebSocket server for agent system');
  
  // Debug upgrade requests before they're handled by the WebSocket server
  // This should come BEFORE initializing the WebSocket services to ensure 
  // we see all upgrade requests regardless of whether they're handled
  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
      
      // Log all WebSocket upgrade attempts for debugging
      console.log('[WebSocket Debug] Upgrade request for path:', pathname);
      
      // Only log detailed headers for our application paths (not Vite HMR)
      if (pathname === '/api/agents/ws' || pathname === '/api/collaboration/ws') {
        console.log('[WebSocket Debug] Headers:', JSON.stringify(request.headers, null, 2));
      }
    } catch (error) {
      console.error('[WebSocket Debug] Error parsing upgrade request:', error);
    }
  });
  
  // Initialize agent communication services
  console.log('Initializing Agent WebSocket service...');
  agentWebSocketService.initialize(httpServer);
  console.log('Agent WebSocket service initialized');
  
  // Initialize Socket.IO service (preferred method for better compatibility)
  console.log('Initializing Agent Socket.IO service...');
  agentSocketIOService.initialize(httpServer);
  console.log('Agent Socket.IO service initialized');
  
  // Register REST API routes for the Socket.IO service
  const socketIORoutes = agentSocketIOService.getRestRoutes();
  app.post('/api/agents/socketio/auth', socketIORoutes.auth);
  app.post('/api/agents/socketio/message', socketIORoutes.message);
  app.post('/api/agents/socketio/action', socketIORoutes.action);
  app.get('/api/agents/socketio/messages/pending', socketIORoutes.pendingMessages);
  
  // Initialize collaboration WebSocket service with the HTTP server
  console.log('Initializing Collaboration WebSocket service...');
  initializeCollaborationWebSocketService(storage);
  collaborationWebSocketService.initialize(httpServer);
  console.log('Collaboration WebSocket service initialized');

  // Initialize team collaboration WebSocket service with error handling
  try {
    const teamCollaborationWsService = new TeamCollaborationWebSocketService(httpServer, storage);
    console.log('Team Collaboration WebSocket service initialized');
  } catch (error) {
    console.error('Failed to initialize Team Collaboration WebSocket Service:', error);
  }
  
  return httpServer;
}
