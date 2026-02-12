/**
 * Database Conversion Routes
 *
 * API routes for the database conversion system
 */

import { Router, Express } from 'express';
import { DatabaseConversionService } from '../services/database-conversion';
import { DatabaseType, ConnectionStatus } from '../services/database-conversion/types';

export function registerDatabaseConversionRoutes(
  app: Express,
  dbConversionService: DatabaseConversionService
) {
  const router = Router();

  // GET /api/database-conversion/supported-databases
  router.get('/supported-databases', (req, res) => {
    try {
      const supportedDatabases = dbConversionService.getSupportedDatabaseTypes();
      res.json(supportedDatabases);
    } catch (error) {
      console.error('Error fetching supported databases:', error);
      res.status(500).json({ error: 'Failed to fetch supported databases' });
    }
  });

  // GET /api/database-conversion/database-type-info
  router.get('/database-type-info', (req, res) => {
    try {
      const { type } = req.query;

      if (!type || typeof type !== 'string') {
        return res.status(400).json({ error: 'Database type is required' });
      }

      const dbTypeInfo = dbConversionService.getDatabaseTypeInfo(type as DatabaseType);
      res.json(dbTypeInfo);
    } catch (error) {
      console.error('Error fetching database type info:', error);
      res.status(500).json({ error: 'Failed to fetch database type information' });
    }
  });

  // POST /api/database-conversion/test-connection
  router.post('/test-connection', async (req, res) => {
    try {
      const { connectionString, databaseType } = req.body;

      if (!connectionString) {
        return res.status(400).json({ error: 'Connection string is required' });
      }

      if (!databaseType) {
        return res.status(400).json({ error: 'Database type is required' });
      }

      const result = await dbConversionService.testConnection(connectionString, databaseType);

      if (result.status === ConnectionStatus.Success) {
        res.json({ success: true, result });
      } else {
        res.json({ success: false, result });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to test database connection',
        result: {
          status: ConnectionStatus.Failed,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });

  // POST /api/database-conversion/analyze-schema
  router.post('/analyze-schema', async (req, res) => {
    try {
      const { connectionString, databaseType, name, description, options } = req.body;

      if (!connectionString) {
        return res.status(400).json({ error: 'Connection string is required' });
      }

      if (!databaseType) {
        return res.status(400).json({ error: 'Database type is required' });
      }

      const analysisOptions = {
        projectName: name,
        projectDescription: description,
        ...options,
      };

      const result = await dbConversionService.analyzeSchema(
        connectionString,
        databaseType,
        analysisOptions
      );

      res.json({ success: true, result });
    } catch (error) {
      console.error('Error analyzing schema:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to analyze database schema',
      });
    }
  });

  // GET /api/database-conversion/projects
  router.get('/projects', async (req, res) => {
    try {
      const projects = await dbConversionService.getProjects();
      res.json(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Failed to fetch conversion projects' });
    }
  });

  // GET /api/database-conversion/project/:id
  router.get('/project/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const project = await dbConversionService.getProject(id);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ error: 'Failed to fetch conversion project' });
    }
  });

  // POST /api/database-conversion/start-conversion
  router.post('/start-conversion', async (req, res) => {
    try {
      const {
        projectId,
        sourceConnectionString,
        sourceType,
        targetConnectionString,
        targetType,
        options,
      } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      if (!sourceConnectionString) {
        return res.status(400).json({ error: 'Source connection string is required' });
      }

      if (!sourceType) {
        return res.status(400).json({ error: 'Source database type is required' });
      }

      if (!targetConnectionString) {
        return res.status(400).json({ error: 'Target connection string is required' });
      }

      if (!targetType) {
        return res.status(400).json({ error: 'Target database type is required' });
      }

      // Create a conversion project record if it doesn't exist
      let project = await dbConversionService.getProject(projectId);

      if (!project) {
        project = await dbConversionService.createProject({
          id: projectId,
          name: projectId,
          sourceType,
          targetType,
          status: 'pending',
          createdAt: new Date(),
        });
      }

      // Start the conversion process
      const result = await dbConversionService.startConversion(projectId);

      res.json({ success: true, result, projectId });
    } catch (error) {
      console.error('Error starting conversion:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to start database conversion',
      });
    }
  });

  // GET /api/database-conversion/conversion-status
  router.get('/conversion-status', async (req, res) => {
    try {
      const { projectId } = req.query;

      if (!projectId || typeof projectId !== 'string') {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const status = await dbConversionService.getConversionStatus(projectId);

      res.json({ success: true, result: status });
    } catch (error) {
      console.error('Error fetching conversion status:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch conversion status',
      });
    }
  });

  // POST /api/database-conversion/generate-compatibility-layer
  router.post('/generate-compatibility-layer', async (req, res) => {
    try {
      const { projectId, ormType, includeExamples, generateMigrations, targetDirectory } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const options = {
        ormType,
        includeExamples,
        generateMigrations,
        targetDirectory,
      };

      const result = await dbConversionService.generateCompatibilityLayer(projectId, options);

      res.json({ success: true, result });
    } catch (error) {
      console.error('Error generating compatibility layer:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate compatibility layer',
      });
    }
  });

  // Register the router with the app
  app.use('/api/database-conversion', router);
}

export default registerDatabaseConversionRoutes;
