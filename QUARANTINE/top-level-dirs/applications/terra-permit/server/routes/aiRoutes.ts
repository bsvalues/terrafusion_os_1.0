/**
 * AI Enhancement Routes
 * This file defines routes for the AI enhancement capabilities, including:
 * - Specialized AI Agent workflows
 * - Vector database search functionality
 * - Predictive analytics features
 * - Advanced permit classification
 */

import { Express, Request, Response } from "express";
import { isAuthenticated, hasRole } from "../middleware/auth";
import { UserRole, Permit } from "../../shared/schema";
import { storage } from "../storage";
import { vectorDatabaseService } from "../services/vectorDatabaseService";
import { predictiveAnalyticsService } from "../services/predictiveAnalyticsService";
import { specializedAgentService } from "../services/specializedAgentService";
import { dataValidationService } from "../services/dataValidationService";

// Helper function to validate OpenAI API key before making calls
async function validateApiKey(): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured.");
  }
  return true;
}

// Middleware to check for OpenAI API key for AI-related routes
const checkOpenAIApiKey = (req: Request, res: Response, next: Function) => {
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ 
      message: 'OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable.' 
    });
  }
  next();
};

// Register AI routes for the application
export function registerAIRoutes(app: Express) {
  console.log("Registering AI enhancement routes...");

  /**
   * Vector Database Routes
   */

  // Search for similar permits
  app.post('/api/ai/vector/search', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const { query, limit = 5, threshold = 0.7 } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      const results = await vectorDatabaseService.searchSimilarPermits(query, limit, threshold);
      
      return res.status(200).json({
        results,
        count: results.length,
        message: `Found ${results.length} similar permits`
      });
    } catch (error) {
      return res.status(500).json({ 
        message: `Error searching similar permits: ${(error as Error).message}` 
      });
    }
  });

  // Search for permits in a specific neighborhood
  app.get('/api/ai/vector/neighborhood/:code', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const { limit = 10 } = req.query;
      
      const results = await vectorDatabaseService.searchByNeighborhood(
        code, 
        typeof limit === 'string' ? parseInt(limit) : 10
      );
      
      return res.status(200).json({
        results,
        count: results.length,
        message: `Found ${results.length} permits in neighborhood ${code}`
      });
    } catch (error) {
      return res.status(500).json({ 
        message: `Error searching by neighborhood: ${(error as Error).message}` 
      });
    }
  });

  // Find nearest neighbors for a specific permit
  app.get('/api/ai/vector/neighbors/:permitId', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const { permitId } = req.params;
      const { limit = 5 } = req.query;
      
      const results = await vectorDatabaseService.findNearestNeighbors(
        parseInt(permitId), 
        typeof limit === 'string' ? parseInt(limit) : 5
      );
      
      return res.status(200).json({
        results,
        count: results.length,
        message: `Found ${results.length} similar permits`
      });
    } catch (error) {
      return res.status(500).json({ 
        message: `Error finding nearest neighbors: ${(error as Error).message}` 
      });
    }
  });

  // Vectorize a batch of permits
  app.post('/api/ai/vector/index', isAuthenticated, hasRole([UserRole.ADMIN]), checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const { uploadId } = req.body;
      
      if (!uploadId) {
        return res.status(400).json({ message: 'Upload ID is required' });
      }
      
      // Get permits for the upload
      const permits = await storage.getPermitsByUploadId(parseInt(uploadId));
      
      if (!permits || permits.length === 0) {
        return res.status(404).json({ message: 'No permits found for the specified upload ID' });
      }
      
      // Vectorize the permits
      await vectorDatabaseService.vectorizePermits(permits);
      
      // Get the current vector count
      const vectorCount = await vectorDatabaseService.getVectorCount();
      
      return res.status(200).json({
        message: `Successfully vectorized ${permits.length} permits`,
        permitCount: permits.length,
        totalVectorCount: vectorCount
      });
    } catch (error) {
      return res.status(500).json({ 
        message: `Error vectorizing permits: ${(error as Error).message}` 
      });
    }
  });

  /**
   * Predictive Analytics Routes
   */

  // Predict approval likelihood for a permit
  app.get('/api/ai/predict/approval/:permitId', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const { permitId } = req.params;
      
      const prediction = await predictiveAnalyticsService.predictApprovalLikelihood(parseInt(permitId));
      
      return res.status(200).json(prediction);
    } catch (error) {
      return res.status(500).json({ 
        message: `Error predicting approval likelihood: ${(error as Error).message}` 
      });
    }
  });

  // Analyze historical permit patterns
  app.get('/api/ai/predict/patterns', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const { uploadId } = req.query;
      
      const patterns = await predictiveAnalyticsService.analyzeHistoricalPatterns(
        uploadId ? parseInt(uploadId as string) : undefined
      );
      
      return res.status(200).json(patterns);
    } catch (error) {
      return res.status(500).json({ 
        message: `Error analyzing permit patterns: ${(error as Error).message}` 
      });
    }
  });

  // Get trend analysis for a specific neighborhood
  app.get('/api/ai/predict/trends/:neighborhood', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const { neighborhood } = req.params;
      
      const trends = await predictiveAnalyticsService.getNeighborhoodTrends(neighborhood);
      
      return res.status(200).json(trends);
    } catch (error) {
      return res.status(500).json({ 
        message: `Error getting neighborhood trends: ${(error as Error).message}` 
      });
    }
  });

  /**
   * Specialized Agent Routes
   */

  // Perform in-depth permit analysis
  app.get('/api/ai/agent/permit/:permitId', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const { permitId } = req.params;
      
      const analysis = await specializedAgentService.analyzePermitInDepth(parseInt(permitId));
      
      return res.status(200).json(analysis);
    } catch (error) {
      return res.status(500).json({ 
        message: `Error analyzing permit: ${(error as Error).message}` 
      });
    }
  });

  // Analyze neighborhood patterns
  app.get('/api/ai/agent/neighborhood/:code', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      
      const analysis = await specializedAgentService.analyzeNeighborhoodPatterns(code);
      
      return res.status(200).json(analysis);
    } catch (error) {
      return res.status(500).json({ 
        message: `Error analyzing neighborhood patterns: ${(error as Error).message}` 
      });
    }
  });

  // Answer a complex permit-related question
  app.post('/api/ai/agent/question', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const { question, permitId } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: 'Question is required' });
      }
      
      const answer = await specializedAgentService.answerComplexQuestion(
        question, 
        permitId ? parseInt(permitId) : undefined
      );
      
      return res.status(200).json(answer);
    } catch (error) {
      return res.status(500).json({ 
        message: `Error answering question: ${(error as Error).message}` 
      });
    }
  });

  /**
   * Data Validation Routes
   */

  // Validate a batch of permits
  app.post('/api/ai/validate/batch', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { uploadId } = req.body;
      
      if (!uploadId) {
        return res.status(400).json({ message: 'Upload ID is required' });
      }
      
      // Get permits for the upload
      const permits = await storage.getPermitsByUploadId(parseInt(uploadId));
      
      if (!permits || permits.length === 0) {
        return res.status(404).json({ message: 'No permits found for the specified upload ID' });
      }
      
      // Validate the permits
      const validationResults = await dataValidationService.validatePermitBatch(permits);
      
      // Generate a validation summary
      const summary = dataValidationService.generateValidationSummary(validationResults);
      
      return res.status(200).json({
        results: validationResults,
        summary,
        message: `Validated ${permits.length} permits`
      });
    } catch (error) {
      return res.status(500).json({ 
        message: `Error validating permits: ${(error as Error).message}` 
      });
    }
  });

  // Analyze data quality for a batch of permits
  app.get('/api/ai/validate/quality/:uploadId', isAuthenticated, checkOpenAIApiKey, async (req: Request, res: Response) => {
    try {
      const { uploadId } = req.params;
      
      // Get permits for the upload
      const permits = await storage.getPermitsByUploadId(parseInt(uploadId));
      
      if (!permits || permits.length === 0) {
        return res.status(404).json({ message: 'No permits found for the specified upload ID' });
      }
      
      // Analyze data quality
      const analysis = await dataValidationService.analyzeDataQuality(permits);
      
      return res.status(200).json(analysis);
    } catch (error) {
      return res.status(500).json({ 
        message: `Error analyzing data quality: ${(error as Error).message}` 
      });
    }
  });

  // Apply automatic fixes to validation issues
  app.post('/api/ai/validate/auto-fix', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MANAGER]), async (req: Request, res: Response) => {
    try {
      const { uploadId, onlyAutoFix = true } = req.body;
      
      if (!uploadId) {
        return res.status(400).json({ message: 'Upload ID is required' });
      }
      
      // Get permits for the upload
      const permits = await storage.getPermitsByUploadId(parseInt(uploadId));
      
      if (!permits || permits.length === 0) {
        return res.status(404).json({ message: 'No permits found for the specified upload ID' });
      }
      
      // Apply automatic fixes
      const { fixedPermits, report } = await dataValidationService.applyAutomaticFixes(permits, onlyAutoFix);
      
      // Update the fixed permits in the database
      for (const permit of fixedPermits) {
        if (permit.id) {
          await storage.updatePermit(permit.id, permit);
        }
      }
      
      return res.status(200).json({
        fixedCount: fixedPermits.length,
        report,
        message: `Applied automatic fixes to ${fixedPermits.length} permits`
      });
    } catch (error) {
      return res.status(500).json({ 
        message: `Error applying automatic fixes: ${(error as Error).message}` 
      });
    }
  });

  console.log("AI enhancement routes registered successfully");
}