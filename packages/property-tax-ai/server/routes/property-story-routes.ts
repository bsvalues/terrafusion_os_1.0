/**
 * Property Story Routes
 * 
 * This file defines routes for generating and retrieving property stories directly.
 * These endpoints offer streamlined access to the Property Story Generator without
 * requiring creation of permanent shares.
 */

import express from 'express';
import { z } from 'zod';
import { PropertyStoryGenerator, PropertyStoryOptions } from '../services/property-story-generator';
import { IStorage } from '../storage';

// Validation schema for property story generation options
const storyOptionsSchema = z.object({
  format: z.enum(['simple', 'detailed', 'summary']).optional(),
  includeValuation: z.boolean().optional(),
  includeImprovements: z.boolean().optional(),
  includeLandRecords: z.boolean().optional(),
  includeAppeals: z.boolean().optional(),
  yearBuiltRange: z.object({
    min: z.number(),
    max: z.number()
  }).optional(),
  valueRange: z.object({
    min: z.number(),
    max: z.number()
  }).optional(),
  propertyTypes: z.array(z.string()).optional(),
  focus: z.enum(['market', 'improvements', 'historical', 'appeals']).optional(),
  aiProvider: z.enum(['openai', 'anthropic', 'perplexity', 'template']).optional(),
  maxLength: z.number().optional()
});

// Validation schema for property comparison options
const comparisonOptionsSchema = storyOptionsSchema.extend({
  propertyIds: z.array(z.string()).min(2).max(5)
});

/**
 * Creates property story routes
 * @param storage Storage interface
 * @returns Express router with property story routes
 */
export function createPropertyStoryRoutes(storage: IStorage): express.Router {
  const router = express.Router();
  const propertyStoryGenerator = new PropertyStoryGenerator(storage);
  
  /**
   * Generate a comparison between multiple properties
   */
  router.post('/compare', async (req, res) => {
    try {
      // Validate comparison options
      let options: any;
      try {
        options = comparisonOptionsSchema.parse(req.body);
      } catch (validationError: any) {
        return res.status(400).json({
          error: 'Invalid comparison options provided',
          details: validationError.errors
        });
      }
      
      const { propertyIds, ...storyOptions } = options;
      
      // Verify all properties exist
      const properties = await Promise.all(
        propertyIds.map((id: string) => storage.getPropertyByPropertyId(id))
      );
      
      const missingProperties = propertyIds.filter((id: string, index: number) => !properties[index]);
      if (missingProperties.length > 0) {
        return res.status(404).json({
          error: 'One or more properties not found',
          missingProperties
        });
      }
      
      // Generate comparison
      const result = await propertyStoryGenerator.generatePropertyComparison(
        propertyIds,
        storyOptions as PropertyStoryOptions
      );
      
      // Create history record
      await storage.createSystemActivity({
        agentId: 2, // Analysis Agent
        activity: `Generated property comparison for ${propertyIds.join(', ')}`,
        entityType: 'propertyComparison',
        entityId: propertyIds.join('-')
      });
      
      res.json({
        propertyIds,
        comparison: result,
        options: storyOptions,
        generated: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error generating property comparison:', error);
      res.status(500).json({
        error: 'Failed to generate property comparison',
        message: error.message
      });
    }
  });
  
  /**
   * Generate multiple property stories in batch
   */
  router.post('/batch', async (req, res) => {
    try {
      const { propertyIds, options } = req.body;
      
      // Validate input
      if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
        return res.status(400).json({
          error: 'Invalid request format',
          message: 'propertyIds must be a non-empty array'
        });
      }
      
      // Validate options if provided
      let validatedOptions: PropertyStoryOptions = {};
      if (options) {
        try {
          validatedOptions = storyOptionsSchema.parse(options);
        } catch (validationError: any) {
          return res.status(400).json({
            error: 'Invalid options provided',
            details: validationError.errors
          });
        }
      }
      
      // Generate stories for all properties
      const results = await propertyStoryGenerator.generateMultiplePropertyStories(
        propertyIds,
        validatedOptions
      );
      
      // Create history record
      await storage.createSystemActivity({
        agentId: 2, // Analysis Agent
        activity: `Generated batch property stories for ${propertyIds.length} properties`,
        entityType: 'batchPropertyStories',
        entityId: propertyIds.join('-')
      });
      
      res.json({
        count: Object.keys(results).length,
        stories: results,
        options: validatedOptions,
        generated: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error generating batch property stories:', error);
      res.status(500).json({
        error: 'Failed to generate batch property stories',
        message: error.message
      });
    }
  });
  
  /**
   * Generate a property story (GET method)
   * 
   * Simple route for quickly generating a story with default options
   */
  router.get('/:propertyId', async (req, res) => {
    try {
      const propertyId = req.params.propertyId;
      
      // Verify property exists
      const property = await storage.getPropertyByPropertyId(propertyId);
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }
      
      // Generate using default options
      const result = await propertyStoryGenerator.generatePropertyStory(propertyId, {
        format: 'detailed',
        includeImprovements: true,
        includeLandRecords: true
      });
      
      // Create history record
      await storage.createSystemActivity({
        agentId: 2, // Analysis Agent
        activity: `Generated property story for ${propertyId}`,
        entityType: 'property',
        entityId: propertyId
      });
      
      res.json({
        propertyId,
        story: result,
        generated: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error generating property story:', error);
      res.status(500).json({
        error: 'Failed to generate property story',
        message: error.message
      });
    }
  });
  
  /**
   * Generate a property story with custom options (POST method)
   */
  router.post('/:propertyId', async (req, res) => {
    try {
      const propertyId = req.params.propertyId;
      
      // Validate options
      let options: PropertyStoryOptions = {};
      try {
        options = storyOptionsSchema.parse(req.body);
      } catch (validationError: any) {
        return res.status(400).json({
          error: 'Invalid options provided',
          details: validationError.errors
        });
      }
      
      // Verify property exists
      const property = await storage.getPropertyByPropertyId(propertyId);
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }
      
      // Generate the story with specified options
      const result = await propertyStoryGenerator.generatePropertyStory(propertyId, options);
      
      // Create history record
      await storage.createSystemActivity({
        agentId: 2, // Analysis Agent
        activity: `Generated custom property story for ${propertyId}`,
        entityType: 'property',
        entityId: propertyId
      });
      
      res.json({
        propertyId,
        story: result,
        options,
        generated: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error generating property story with custom options:', error);
      res.status(500).json({
        error: 'Failed to generate property story',
        message: error.message
      });
    }
  });
  
  return router;
}