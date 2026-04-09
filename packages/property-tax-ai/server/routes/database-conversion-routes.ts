/**
 * Database Conversion Routes
 * 
 * This file contains API routes for the Database Conversion System, which allows
 * users to convert databases between different systems and generate compatibility layers.
 */

import { Router } from 'express';
import { IStorage } from '../storage';
import { SchemaAnalyzerService } from '../services/database-conversion/schema-analyzer-service';
import { DataMigrationService } from '../services/database-conversion/data-migration-service';
import { DataTransformationService } from '../services/database-conversion/data-transformation-service';
import { CompatibilityService } from '../services/database-conversion/compatibility-service';
import { DatabaseConversionAgent } from '../agents/database-conversion-agent';
import { LLMService } from '../services/llm-service';
import { MCPService } from '../services/mcp-service';
import { 
  DatabaseType, 
  ConnectionStatus, 
  ConversionStatus 
} from '../services/database-conversion/types';
import { z } from 'zod';

// Validation schemas
const testConnectionSchema = z.object({
  connectionString: z.string().min(1, "Connection string is required"),
  databaseType: z.nativeEnum(DatabaseType)
});

const analyzeSchemaSchema = z.object({
  connectionString: z.string().min(1, "Connection string is required"),
  databaseType: z.nativeEnum(DatabaseType),
  options: z.object({
    depth: z.enum(['basic', 'standard', 'deep']).optional(),
    includeTables: z.array(z.string()).optional(),
    excludeTables: z.array(z.string()).optional(),
    includeViews: z.boolean().optional(),
    includeProcedures: z.boolean().optional(),
    includeFunctions: z.boolean().optional(),
    includeTriggers: z.boolean().optional(),
    includeConstraints: z.boolean().optional(),
    useAI: z.boolean().optional()
  }).optional()
});

const createProjectSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  sourceConnectionString: z.string().min(1, "Source connection string is required"),
  sourceType: z.nativeEnum(DatabaseType),
  targetConnectionString: z.string().min(1, "Target connection string is required"),
  targetType: z.nativeEnum(DatabaseType),
  status: z.nativeEnum(ConversionStatus),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

const startConversionSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  options: z.object({
    batchSize: z.number().positive().optional(),
    includeTables: z.array(z.string()).optional(),
    excludeTables: z.array(z.string()).optional(),
    skipDataMigration: z.boolean().optional(),
    customMappings: z.any().optional()
  }).optional()
});

const generateCompatibilitySchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  options: z.object({
    ormType: z.string().optional(),
    includeModels: z.boolean().optional(),
    includeMigrations: z.boolean().optional(),
    includeQueryHelpers: z.boolean().optional(),
    includeCRUDOperations: z.boolean().optional(),
    includeDataValidation: z.boolean().optional(),
    additionalFeatures: z.array(z.string()).optional(),
    language: z.string().optional(),
    apiStyle: z.string().optional()
  })
});

export function registerDatabaseConversionRoutes(
  router: Router,
  storage: IStorage,
  mcpService: MCPService,
  llmService?: LLMService
): void {
  // Create services
  const schemaAnalyzerService = new SchemaAnalyzerService(storage, llmService);
  const dataMigrationService = new DataMigrationService(storage);
  const dataTransformationService = new DataTransformationService(storage);
  const compatibilityService = new CompatibilityService(storage, llmService);
  
  // Create the database conversion agent
  const databaseConversionAgent = new DatabaseConversionAgent(
    storage,
    mcpService,
    schemaAnalyzerService,
    dataMigrationService,
    dataTransformationService,
    compatibilityService,
    llmService
  );
  
  // Initialize the agent
  databaseConversionAgent.initialize().catch(error => {
    console.error('Failed to initialize Database Conversion Agent:', error);
  });
  
  // Get supported database types
  router.get('/api/database-conversion/database-types', (req, res) => {
    const databaseTypes = Object.values(DatabaseType)
      .filter(type => type !== DatabaseType.Unknown)
      .map(type => ({
        id: type,
        name: type.charAt(0).toUpperCase() + type.slice(1),
        supported: [
          DatabaseType.PostgreSQL,
          DatabaseType.MySQL,
          DatabaseType.SQLite,
          DatabaseType.MongoDB
        ].includes(type)
      }));
    
    res.json(databaseTypes);
  });
  
  // Test connection
  router.post('/api/database-conversion/test-connection', async (req, res) => {
    try {
      // Validate request
      const validationResult = testConnectionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: validationResult.error.message });
      }
      
      const { connectionString, databaseType } = validationResult.data;
      
      // Test connection
      const result = await databaseConversionAgent.testConnection(connectionString, databaseType);
      
      res.json(result);
    } catch (error) {
      console.error('Error testing connection:', error);
      res.status(500).json({ 
        message: 'An error occurred while testing the connection',
        status: ConnectionStatus.Failed,
        details: error.message 
      });
    }
  });
  
  // Analyze schema
  router.post('/api/database-conversion/analyze-schema', async (req, res) => {
    try {
      // Validate request
      const validationResult = analyzeSchemaSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: validationResult.error.message });
      }
      
      const { connectionString, databaseType, options } = validationResult.data;
      
      // Analyze schema
      const result = await databaseConversionAgent.analyzeSchema(connectionString, databaseType, options);
      
      res.json(result);
    } catch (error) {
      console.error('Error analyzing schema:', error);
      res.status(500).json({ message: 'An error occurred while analyzing the schema', details: error.message });
    }
  });
  
  // Get all conversion projects
  router.get('/api/database-conversion/projects', async (req, res) => {
    try {
      // Get projects from storage
      const projects = await storage.getDatabaseConversionProjects();
      
      res.json(projects);
    } catch (error) {
      console.error('Error fetching conversion projects:', error);
      res.status(500).json({ message: 'An error occurred while fetching conversion projects', details: error.message });
    }
  });
  
  // Get a specific conversion project
  router.get('/api/database-conversion/projects/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      
      // Get project from storage
      const project = await storage.getDatabaseConversionProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: `Project with ID ${projectId} not found` });
      }
      
      res.json(project);
    } catch (error) {
      console.error('Error fetching conversion project:', error);
      res.status(500).json({ message: 'An error occurred while fetching the conversion project', details: error.message });
    }
  });
  
  // Create a new conversion project
  router.post('/api/database-conversion/projects', async (req, res) => {
    try {
      // Validate request
      const validationResult = createProjectSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: validationResult.error.message });
      }
      
      const projectData = validationResult.data;
      
      // Create project in storage
      const project = await storage.createDatabaseConversionProject(projectData);
      
      res.status(201).json(project);
    } catch (error) {
      console.error('Error creating conversion project:', error);
      res.status(500).json({ message: 'An error occurred while creating the conversion project', details: error.message });
    }
  });
  
  // Update a conversion project
  router.patch('/api/database-conversion/projects/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      
      // Get existing project
      const existingProject = await storage.getDatabaseConversionProject(projectId);
      if (!existingProject) {
        return res.status(404).json({ message: `Project with ID ${projectId} not found` });
      }
      
      // Update project in storage
      const updatedProject = await storage.updateDatabaseConversionProject(projectId, req.body);
      
      res.json(updatedProject);
    } catch (error) {
      console.error('Error updating conversion project:', error);
      res.status(500).json({ message: 'An error occurred while updating the conversion project', details: error.message });
    }
  });
  
  // Delete a conversion project
  router.delete('/api/database-conversion/projects/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      
      // Get existing project
      const existingProject = await storage.getDatabaseConversionProject(projectId);
      if (!existingProject) {
        return res.status(404).json({ message: `Project with ID ${projectId} not found` });
      }
      
      // Delete project from storage
      await storage.deleteDatabaseConversionProject(projectId);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting conversion project:', error);
      res.status(500).json({ message: 'An error occurred while deleting the conversion project', details: error.message });
    }
  });
  
  // Start a conversion
  router.post('/api/database-conversion/start', async (req, res) => {
    try {
      // Validate request
      const validationResult = startConversionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: validationResult.error.message });
      }
      
      const { projectId, options } = validationResult.data;
      
      // Get project from storage
      const project = await storage.getDatabaseConversionProject(projectId);
      if (!project) {
        return res.status(404).json({ message: `Project with ID ${projectId} not found` });
      }
      
      // Start conversion
      const result = await databaseConversionAgent.startConversion(
        projectId,
        project.sourceConnectionString,
        project.sourceType as DatabaseType,
        project.targetConnectionString,
        project.targetType as DatabaseType,
        options
      );
      
      // Update project status
      await storage.updateDatabaseConversionProject(projectId, {
        status: ConversionStatus.InProgress,
        updatedAt: new Date().toISOString()
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error starting conversion:', error);
      res.status(500).json({ message: 'An error occurred while starting the conversion', details: error.message });
    }
  });
  
  // Get conversion status
  router.get('/api/database-conversion/status/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      
      // Get conversion status from agent
      const status = await databaseConversionAgent.getConversionStatus(projectId);
      
      if (!status) {
        return res.status(404).json({ message: `No conversion found for project ${projectId}` });
      }
      
      res.json(status);
    } catch (error) {
      console.error('Error fetching conversion status:', error);
      res.status(500).json({ message: 'An error occurred while fetching the conversion status', details: error.message });
    }
  });
  
  // Cancel a conversion
  router.post('/api/database-conversion/cancel/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      
      // Get conversion status
      const status = await databaseConversionAgent.getConversionStatus(projectId);
      if (!status) {
        return res.status(404).json({ message: `No conversion found for project ${projectId}` });
      }
      
      // Check if conversion can be cancelled
      if (status.status !== ConversionStatus.InProgress && status.status !== ConversionStatus.Pending) {
        return res.status(400).json({ message: `Conversion with status ${status.status} cannot be cancelled` });
      }
      
      // Cancel conversion in agent (would need to implement this method)
      // await databaseConversionAgent.cancelConversion(projectId);
      
      // Update project status
      await storage.updateDatabaseConversionProject(projectId, {
        status: ConversionStatus.Cancelled,
        updatedAt: new Date().toISOString()
      });
      
      res.json({ message: 'Conversion cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling conversion:', error);
      res.status(500).json({ message: 'An error occurred while cancelling the conversion', details: error.message });
    }
  });
  
  // Generate compatibility layer
  router.post('/api/database-conversion/generate-compatibility', async (req, res) => {
    try {
      // Validate request
      const validationResult = generateCompatibilitySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: validationResult.error.message });
      }
      
      const { projectId, options } = validationResult.data;
      
      // Get project from storage
      const project = await storage.getDatabaseConversionProject(projectId);
      if (!project) {
        return res.status(404).json({ message: `Project with ID ${projectId} not found` });
      }
      
      // Check if conversion is completed
      const status = await databaseConversionAgent.getConversionStatus(projectId);
      if (!status || status.status !== ConversionStatus.Completed) {
        return res.status(400).json({ 
          message: 'Cannot generate compatibility layer: conversion is not completed',
          status: status ? status.status : 'unknown'
        });
      }
      
      // Generate compatibility layer
      const result = await databaseConversionAgent.generateCompatibilityLayer(projectId, options);
      
      res.json(result);
    } catch (error) {
      console.error('Error generating compatibility layer:', error);
      res.status(500).json({ message: 'An error occurred while generating the compatibility layer', details: error.message });
    }
  });
  
  // Get compatibility layer
  router.get('/api/database-conversion/compatibility/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      
      // Get compatibility layer from storage
      const compatibilityLayer = await storage.getDatabaseConversionCompatibilityLayer(projectId);
      
      if (!compatibilityLayer) {
        return res.status(404).json({ message: `No compatibility layer found for project ${projectId}` });
      }
      
      res.json(compatibilityLayer);
    } catch (error) {
      console.error('Error fetching compatibility layer:', error);
      res.status(500).json({ message: 'An error occurred while fetching the compatibility layer', details: error.message });
    }
  });
  
  // Get conversion logs
  router.get('/api/database-conversion/logs/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      
      // Get logs from storage
      const logs = await storage.getDatabaseConversionLogs(projectId);
      
      res.json(logs);
    } catch (error) {
      console.error('Error fetching conversion logs:', error);
      res.status(500).json({ message: 'An error occurred while fetching conversion logs', details: error.message });
    }
  });
  
  // Simulate conversion for testing
  router.post('/api/database-conversion/simulate', async (req, res) => {
    try {
      const { projectId, durationSeconds, finalStatus } = req.body;
      
      // Create a simulated conversion result
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (durationSeconds || 60) * 1000);
      
      const simulatedResult = {
        projectId,
        status: finalStatus || ConversionStatus.Completed,
        progress: 100,
        startTime,
        endTime,
        lastUpdated: endTime,
        summary: {
          tablesConverted: 10,
          totalTables: 10,
          recordsProcessed: 10000,
          estimatedTotalRecords: 10000,
          errors: 0,
          warnings: 2
        }
      };
      
      // Store the simulated result in the agent
      await storage.createDatabaseConversionSimulation(projectId, simulatedResult);
      
      res.json({
        message: 'Simulation created successfully',
        simulationDetails: simulatedResult
      });
    } catch (error) {
      console.error('Error creating simulation:', error);
      res.status(500).json({ message: 'An error occurred while creating the simulation', details: error.message });
    }
  });
}