/**
 * Validation Routes
 * 
 * API endpoints for property data validation operations
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { IStorage } from '../storage';
import { PropertyValidationEngine } from '../services/data-quality/property-validation-engine';
import { WashingtonValidationEngine } from '../services/data-quality/validation-engine-extensions';
import { EnhancedValidationRunner } from '../services/data-quality/enhanced-validation-runner';
import { verifyToken, requireScope, TokenScope } from '../middleware/auth-middleware';
import { logger } from '../utils/logger';

export function createValidationRoutes(storage: IStorage): Router {
  const router = Router();
  
  // Create services
  const validationEngine = new WashingtonValidationEngine(storage);
  const validationRunner = new EnhancedValidationRunner(storage, validationEngine);
  
  // Initialize Washington rules on startup
  (async () => {
    try {
      await validationEngine.initializeWashingtonRules(1); // Admin user ID
      logger.info('Washington validation rules initialized', {
        component: 'ValidationRoutes'
      });
    } catch (error) {
      logger.error('Failed to initialize Washington validation rules', {
        component: 'ValidationRoutes',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  })();
  
  /**
   * Get all validation rules
   * GET /api/validation/rules
   */
  router.get('/rules', verifyToken, async (req: Request, res: Response) => {
    try {
      const rules = await validationEngine.getAllValidationRules();
      res.json(rules);
    } catch (error) {
      logger.error('Error fetching validation rules', {
        component: 'ValidationRoutes',
        error: error instanceof Error ? error.message : String(error)
      });
      
      res.status(500).json({ 
        message: 'Failed to fetch validation rules',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  /**
   * Get rule by ID
   * GET /api/validation/rules/:ruleId
   */
  router.get('/rules/:ruleId', verifyToken, async (req: Request, res: Response) => {
    try {
      const { ruleId } = req.params;
      const rule = await validationEngine.getValidationRuleByRuleId(ruleId);
      
      if (!rule) {
        return res.status(404).json({ message: 'Validation rule not found' });
      }
      
      res.json(rule);
    } catch (error) {
      logger.error('Error fetching validation rule', {
        component: 'ValidationRoutes',
        error: error instanceof Error ? error.message : String(error)
      });
      
      res.status(500).json({ 
        message: 'Failed to fetch validation rule',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  /**
   * Create a new validation rule
   * POST /api/validation/rules
   */
  router.post(
    '/rules', 
    verifyToken, 
    requireScope(TokenScope.ADMIN), 
    async (req: Request, res: Response) => {
      try {
        const ruleSchema = z.object({
          ruleId: z.string(),
          name: z.string(),
          description: z.string(),
          category: z.string(),
          level: z.string(),
          entityType: z.string(),
          implementation: z.string(),
          reference: z.string().optional(),
          isActive: z.boolean().optional()
        });
        
        const validatedData = ruleSchema.parse(req.body);
        const rule = await validationEngine.createValidationRule({
          ...validatedData,
          createdBy: req.user?.userId
        });
        
        res.status(201).json(rule);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: 'Invalid rule data', 
            errors: error.errors 
          });
        }
        
        logger.error('Error creating validation rule', {
          component: 'ValidationRoutes',
          error: error instanceof Error ? error.message : String(error)
        });
        
        res.status(500).json({ 
          message: 'Failed to create validation rule',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );
  
  /**
   * Update a validation rule
   * PUT /api/validation/rules/:ruleId
   */
  router.put(
    '/rules/:ruleId', 
    verifyToken, 
    requireScope(TokenScope.ADMIN), 
    async (req: Request, res: Response) => {
      try {
        const { ruleId } = req.params;
        
        const ruleSchema = z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          level: z.string().optional(),
          entityType: z.string().optional(),
          implementation: z.string().optional(),
          reference: z.string().optional(),
          isActive: z.boolean().optional()
        });
        
        const validatedData = ruleSchema.parse(req.body);
        const rule = await validationEngine.updateValidationRule(ruleId, validatedData);
        
        if (!rule) {
          return res.status(404).json({ message: 'Validation rule not found' });
        }
        
        res.json(rule);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: 'Invalid rule data', 
            errors: error.errors 
          });
        }
        
        logger.error('Error updating validation rule', {
          component: 'ValidationRoutes',
          error: error instanceof Error ? error.message : String(error)
        });
        
        res.status(500).json({ 
          message: 'Failed to update validation rule',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );
  
  /**
   * Validate a single property
   * POST /api/validation/properties/:propertyId
   */
  router.post(
    '/properties/:propertyId', 
    verifyToken, 
    async (req: Request, res: Response) => {
      try {
        const { propertyId } = req.params;
        
        // Get property from storage
        const property = await storage.getPropertyByPropertyId(propertyId);
        
        if (!property) {
          return res.status(404).json({ message: 'Property not found' });
        }
        
        // Validate property
        const issues = await validationEngine.validateProperty(property);
        
        // Update property validation status
        await storage.updateProperty(property.id, {
          extraFields: {
            ...property.extraFields,
            validationStatus: issues.length > 0 ? 'invalid' : 'validated',
            lastValidated: new Date().toISOString(),
            validationIssueCount: issues.length
          }
        });
        
        res.json({
          propertyId,
          isValid: issues.length === 0,
          issueCount: issues.length,
          issues
        });
      } catch (error) {
        logger.error('Error validating property', {
          component: 'ValidationRoutes',
          propertyId: req.params.propertyId,
          error: error instanceof Error ? error.message : String(error)
        });
        
        res.status(500).json({ 
          message: 'Failed to validate property',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );
  
  /**
   * Validate a batch of properties
   * POST /api/validation/batch
   */
  router.post(
    '/batch', 
    verifyToken, 
    requireScope([TokenScope.ADMIN, TokenScope.READ_WRITE]), 
    async (req: Request, res: Response) => {
      try {
        const batchSchema = z.object({
          propertyIds: z.array(z.string()),
          batchSize: z.number().optional(),
          skipValidated: z.boolean().optional(),
          validateFields: z.array(z.string()).optional()
        });
        
        const validatedData = batchSchema.parse(req.body);
        
        // Get properties from storage
        const properties = [];
        for (const id of validatedData.propertyIds) {
          const property = await storage.getPropertyByPropertyId(id);
          if (property) {
            properties.push(property);
          }
        }
        
        if (properties.length === 0) {
          return res.status(404).json({ 
            message: 'No valid properties found for the provided IDs' 
          });
        }
        
        // Run validation
        const result = await validationRunner.validateProperties(properties, {
          batchSize: validatedData.batchSize,
          skipValidated: validatedData.skipValidated,
          validateFields: validatedData.validateFields
        });
        
        res.json({
          total: result.total,
          valid: result.valid,
          invalid: result.invalid,
          issueCount: result.issues.length,
          processingTime: result.processingTime,
          validationDate: result.validationDate
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: 'Invalid batch validation data', 
            errors: error.errors 
          });
        }
        
        logger.error('Error validating property batch', {
          component: 'ValidationRoutes',
          error: error instanceof Error ? error.message : String(error)
        });
        
        res.status(500).json({ 
          message: 'Failed to validate property batch',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );
  
  /**
   * Get validation issues for a property
   * GET /api/validation/properties/:propertyId/issues
   */
  router.get(
    '/properties/:propertyId/issues', 
    verifyToken, 
    async (req: Request, res: Response) => {
      try {
        const { propertyId } = req.params;
        const issues = await validationEngine.getValidationIssuesByPropertyId(propertyId);
        
        res.json(issues);
      } catch (error) {
        logger.error('Error fetching property validation issues', {
          component: 'ValidationRoutes',
          propertyId: req.params.propertyId,
          error: error instanceof Error ? error.message : String(error)
        });
        
        res.status(500).json({ 
          message: 'Failed to fetch property validation issues',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );
  
  /**
   * Update validation issue status
   * PATCH /api/validation/issues/:issueId
   */
  router.patch(
    '/issues/:issueId', 
    verifyToken, 
    requireScope([TokenScope.ADMIN, TokenScope.READ_WRITE]), 
    async (req: Request, res: Response) => {
      try {
        const { issueId } = req.params;
        
        const issueSchema = z.object({
          status: z.string(),
          resolution: z.string().optional()
        });
        
        const validatedData = issueSchema.parse(req.body);
        const issue = await validationEngine.updateValidationIssueStatus(
          issueId, 
          validatedData.status as any, 
          validatedData.resolution
        );
        
        if (!issue) {
          return res.status(404).json({ message: 'Validation issue not found' });
        }
        
        res.json(issue);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: 'Invalid issue data', 
            errors: error.errors 
          });
        }
        
        logger.error('Error updating validation issue', {
          component: 'ValidationRoutes',
          issueId: req.params.issueId,
          error: error instanceof Error ? error.message : String(error)
        });
        
        res.status(500).json({ 
          message: 'Failed to update validation issue',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );
  
  /**
   * Start validation of all properties (background job)
   * POST /api/validation/all
   */
  router.post(
    '/all', 
    verifyToken, 
    requireScope(TokenScope.ADMIN), 
    async (req: Request, res: Response) => {
      try {
        const options = z.object({
          batchSize: z.number().optional(),
          skipValidated: z.boolean().optional()
        }).parse(req.body);
        
        // Start validation job in background
        const jobId = `validation_job_${Date.now()}`;
        
        // Send immediate response
        res.json({ 
          jobId, 
          message: 'Validation job started', 
          status: 'running' 
        });
        
        // Run validation in background
        (async () => {
          try {
            logger.info('Starting full validation job', {
              component: 'ValidationRoutes',
              jobId
            });
            
            await validationRunner.validateAllProperties({
              batchSize: options.batchSize,
              skipValidated: options.skipValidated,
              statusCallback: (progress, total) => {
                logger.info(`Validation progress: ${progress}/${total}`, {
                  component: 'ValidationRoutes',
                  jobId,
                  progress,
                  total,
                  percentage: Math.round((progress / total) * 100)
                });
              }
            });
            
            logger.info('Validation job completed successfully', {
              component: 'ValidationRoutes',
              jobId
            });
          } catch (error) {
            logger.error('Validation job failed', {
              component: 'ValidationRoutes',
              jobId,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        })();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: 'Invalid options', 
            errors: error.errors 
          });
        }
        
        logger.error('Error starting validation job', {
          component: 'ValidationRoutes',
          error: error instanceof Error ? error.message : String(error)
        });
        
        res.status(500).json({ 
          message: 'Failed to start validation job',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  );
  
  return router;
}