import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertPropertySchema, insertAgentJobSchema, insertInfrastructureAssetSchema, insertThreatAssessmentSchema, insertSimulationRequestSchema } from "@shared/schema";
import { taskOrchestrator } from "./orchestrator/task-orchestrator";
import * as propertyApi from "./api/property-api";
import { agentRegistry } from "./agents/agent-registry";
import { setupTerraFusionAgents } from "./terrafusion-agents";
import { monitoring } from "./monitoring";
import { propertyAnalytics } from "./analytics/property-analytics";
import { arcgisEnrichmentService } from "./services/arcgis-enrichment";
import { aiPropertyAnalyzer } from "./services/ai-property-analyzer";
import { bentonGISService } from "./services/benton-gis-service";
import { z } from "zod";

// Async function to process agent jobs
async function processAgentJob(jobId: string, agentId: string, propertyId: string) {
  try {
    // Update job status to running
    await storage.updateJobStatus(jobId, "running");
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create mock result based on agent type
    const agent = await storage.getAgent(agentId);
    const property = await storage.getProperty(propertyId);
    
    if (!agent || !property) {
      await storage.updateJobStatus(jobId, "failed", null, "Agent or property not found");
      return;
    }

    let result = {};
    switch (agent.type) {
      case 'cost-analysis':
        result = {
          rcnValue: parseFloat(property.assessedValue || "0") * 1.15,
          depreciation: 12,
          finalCost: parseFloat(property.assessedValue || "0") * 1.01,
          confidence: 0.92
        };
        break;
      case 'exemption-analysis':
        result = {
          eligibleExemptions: property.propertyType === 'agricultural' ? ['agricultural'] : [],
          taxSavings: property.propertyType === 'agricultural' ? 5000 : 0,
          qualificationScore: 0.85
        };
        break;
      case 'explanation-generation':
        result = {
          explanation: `Assessment completed for ${property.address}`,
          appealRisk: "low"
        };
        break;
      default:
        result = { processed: true, confidence: 0.9 };
    }

    await storage.updateJobStatus(jobId, "completed", result);
  } catch (error) {
    await storage.updateJobStatus(jobId, "failed", null, `Processing error: ${error}`);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Properties endpoints
  app.get("/api/properties", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const properties = await storage.getProperties(limit);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      const properties = await storage.searchProperties(query);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: "Failed to search properties" });
    }
  });

  // AI Agent processing endpoint for real-time analysis
  app.post("/api/properties/:id/analyze", async (req, res) => {
    try {
      const propertyId = req.params.id;
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      // Use AI-powered property analysis
      const analysisResult = await aiPropertyAnalyzer.analyzeProperty(property);
      res.json(analysisResult);
    } catch (error) {
      console.error('Property analysis error:', error);
      res.status(500).json({ error: "Failed to analyze property" });
    }
  });

  // QA Check endpoint for comprehensive property review
  app.post("/api/properties/:id/qa-check", async (req, res) => {
    try {
      const propertyId = req.params.id;
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      // Use AI-powered quality assurance analysis
      const qaResult = await aiPropertyAnalyzer.performQualityAssurance(property);
      res.json(qaResult);
    } catch (error) {
      console.error('QA check error:', error);
      res.status(500).json({ error: "Failed to perform QA check" });
    }
  });

  // Continue with other endpoints...
  const httpServer = createServer(app);
  return httpServer;
}