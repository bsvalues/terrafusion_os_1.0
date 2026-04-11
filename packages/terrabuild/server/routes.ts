/**
 * BCBS Application API Routes
 * 
 * This file defines the API routes for the Benton County Building System.
 * It provides endpoints for accessing and manipulating all application data.
 */

import express from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { eq, desc } from 'drizzle-orm';
import storage from './storage';
import { db } from './db';
import analyticsRoutes from './routes/analyticsRoutes';
import reportRoutes from './routes/reportRoutes';
import whatIfScenariosRoutes from './routes/whatIfScenariosRoutes';
import importRoutes from './routes/importRoutes';
import calculationRoutes from './routes/calculationRoutes';
import storytellingRoutes from './routes/storytelling-routes';

import {
  insertUserSchema,
  insertPropertySchema,
  insertImprovementSchema,
  insertCostMatrixSchema,
  insertCalculationSchema,
  insertProjectSchema,
  dataImports,
} from '../shared/schema';
import { fileUploads } from '../shared/fileUploadSchema';

const router = express.Router();

// Error handling middleware
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation middleware
const validate = (schema: z.ZodType<any, any>) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ message: 'Validation error', errors: error.errors });
  }
};

/**
 * User Routes
 */
router.get('/users', asyncHandler(async (req, res) => {
  const users = await storage.getUsers();
  res.json(users);
}));

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await storage.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
}));

router.post('/users', validate(insertUserSchema), asyncHandler(async (req, res) => {
  const user = await storage.createUser(req.body);
  res.status(201).json(user);
}));

router.patch('/users/:id', asyncHandler(async (req, res) => {
  const user = await storage.updateUser(req.params.id, req.body);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
}));

router.delete('/users/:id', asyncHandler(async (req, res) => {
  const success = await storage.deleteUser(req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.status(204).end();
}));

/**
 * Property Routes
 */
router.get('/properties', asyncHandler(async (req, res) => {
  // Extract filter parameters if any
  const { county, city, state, propertyType } = req.query;
  const filter: Record<string, any> = {};
  
  if (county) filter.county = county;
  if (city) filter.city = city;
  if (state) filter.state = state;
  if (propertyType) filter.propertyType = propertyType;
  
  const properties = await storage.getProperties(Object.keys(filter).length ? filter : undefined);
  res.json(properties);
}));

router.get('/properties/:id', asyncHandler(async (req, res) => {
  const property = await storage.getPropertyById(req.params.id);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  res.json(property);
}));

router.get('/properties/parcel/:parcelId', asyncHandler(async (req, res) => {
  const property = await storage.getPropertyByParcelId(req.params.parcelId);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  res.json(property);
}));

router.post('/properties', validate(insertPropertySchema), asyncHandler(async (req, res) => {
  const property = await storage.createProperty(req.body);
  res.status(201).json(property);
}));

router.patch('/properties/:id', asyncHandler(async (req, res) => {
  const property = await storage.updateProperty(req.params.id, req.body);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  res.json(property);
}));

router.delete('/properties/:id', asyncHandler(async (req, res) => {
  const success = await storage.deleteProperty(req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Property not found' });
  }
  res.status(204).end();
}));

/**
 * Improvement Routes
 */
router.get('/improvements', asyncHandler(async (req, res) => {
  const { propertyId } = req.query;
  const improvements = await storage.getImprovements(propertyId as string);
  res.json(improvements);
}));

router.get('/improvements/:id', asyncHandler(async (req, res) => {
  const improvement = await storage.getImprovementById(req.params.id);
  if (!improvement) {
    return res.status(404).json({ message: 'Improvement not found' });
  }
  res.json(improvement);
}));

router.post('/improvements', validate(insertImprovementSchema), asyncHandler(async (req, res) => {
  const improvement = await storage.createImprovement(req.body);
  res.status(201).json(improvement);
}));

router.patch('/improvements/:id', asyncHandler(async (req, res) => {
  const improvement = await storage.updateImprovement(req.params.id, req.body);
  if (!improvement) {
    return res.status(404).json({ message: 'Improvement not found' });
  }
  res.json(improvement);
}));

router.delete('/improvements/:id', asyncHandler(async (req, res) => {
  const success = await storage.deleteImprovement(req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Improvement not found' });
  }
  res.status(204).end();
}));

/**
 * Cost Matrix Routes
 */
router.get('/cost-matrices', asyncHandler(async (req, res) => {
  const { buildingType, region, year } = req.query;
  const filter: Record<string, any> = {};
  
  if (buildingType) filter.buildingType = buildingType;
  if (region) filter.region = region;
  if (year) filter.year = parseInt(year as string);
  
  const matrices = await storage.getCostMatrices(Object.keys(filter).length ? filter : undefined);
  res.json(matrices);
}));

router.get('/cost-matrices/:id', asyncHandler(async (req, res) => {
  const matrix = await storage.getCostMatrixById(req.params.id);
  if (!matrix) {
    return res.status(404).json({ message: 'Cost matrix not found' });
  }
  res.json(matrix);
}));

router.get('/cost-matrices/lookup', asyncHandler(async (req, res) => {
  const { buildingType, region, year } = req.query;
  
  if (!buildingType || !region || !year) {
    return res.status(400).json({ message: 'Missing required query parameters: buildingType, region, year' });
  }
  
  const matrix = await storage.getCostMatrixByBuildingType(
    buildingType as string,
    region as string,
    parseInt(year as string)
  );
  
  if (!matrix) {
    return res.status(404).json({ message: 'Cost matrix not found' });
  }
  
  res.json(matrix);
}));

router.post('/cost-matrices', validate(insertCostMatrixSchema), asyncHandler(async (req, res) => {
  const matrix = await storage.createCostMatrix(req.body);
  res.status(201).json(matrix);
}));

router.patch('/cost-matrices/:id', asyncHandler(async (req, res) => {
  const matrix = await storage.updateCostMatrix(req.params.id, req.body);
  if (!matrix) {
    return res.status(404).json({ message: 'Cost matrix not found' });
  }
  res.json(matrix);
}));

router.delete('/cost-matrices/:id', asyncHandler(async (req, res) => {
  const success = await storage.deleteCostMatrix(req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Cost matrix not found' });
  }
  res.status(204).end();
}));

/**
 * Building Type Routes
 */
router.get('/building-types', asyncHandler(async (req, res) => {
  const buildingTypes = await storage.getBuildingTypes();
  res.json(buildingTypes);
}));

router.get('/building-types/:code', asyncHandler(async (req, res) => {
  const buildingType = await storage.getBuildingTypeByCode(req.params.code);
  if (!buildingType) {
    return res.status(404).json({ message: 'Building type not found' });
  }
  res.json(buildingType);
}));

router.post('/building-types', asyncHandler(async (req, res) => {
  const buildingType = await storage.createBuildingType(req.body);
  res.status(201).json(buildingType);
}));

router.patch('/building-types/:code', asyncHandler(async (req, res) => {
  const buildingType = await storage.updateBuildingType(req.params.code, req.body);
  if (!buildingType) {
    return res.status(404).json({ message: 'Building type not found' });
  }
  res.json(buildingType);
}));

router.delete('/building-types/:code', asyncHandler(async (req, res) => {
  const success = await storage.deleteBuildingType(req.params.code);
  if (!success) {
    return res.status(404).json({ message: 'Building type not found' });
  }
  res.status(204).end();
}));

/**
 * Region Routes
 */
router.get('/regions', asyncHandler(async (req, res) => {
  const regions = await storage.getRegions();
  res.json(regions);
}));

router.get('/regions/:code', asyncHandler(async (req, res) => {
  const region = await storage.getRegionByCode(req.params.code);
  if (!region) {
    return res.status(404).json({ message: 'Region not found' });
  }
  res.json(region);
}));

router.post('/regions', asyncHandler(async (req, res) => {
  const region = await storage.createRegion(req.body);
  res.status(201).json(region);
}));

router.patch('/regions/:code', asyncHandler(async (req, res) => {
  const region = await storage.updateRegion(req.params.code, req.body);
  if (!region) {
    return res.status(404).json({ message: 'Region not found' });
  }
  res.json(region);
}));

router.delete('/regions/:code', asyncHandler(async (req, res) => {
  const success = await storage.deleteRegion(req.params.code);
  if (!success) {
    return res.status(404).json({ message: 'Region not found' });
  }
  res.status(204).end();
}));

/**
 * Cost Factor Routes
 */
router.get('/quality-factors', asyncHandler(async (req, res) => {
  const factors = await storage.getQualityFactors();
  res.json(factors);
}));

router.get('/condition-factors', asyncHandler(async (req, res) => {
  const factors = await storage.getConditionFactors();
  res.json(factors);
}));

router.get('/age-factors', asyncHandler(async (req, res) => {
  const factors = await storage.getAgeFactors();
  res.json(factors);
}));

/**
 * Calculation Routes
 */
router.get('/calculations', asyncHandler(async (req, res) => {
  const { propertyId, improvementId } = req.query;
  const calculations = await storage.getCalculations(
    propertyId as string,
    improvementId as string
  );
  res.json(calculations);
}));

router.get('/calculations/:id', asyncHandler(async (req, res) => {
  const calculation = await storage.getCalculationById(req.params.id);
  if (!calculation) {
    return res.status(404).json({ message: 'Calculation not found' });
  }
  res.json(calculation);
}));

router.post('/calculations', validate(insertCalculationSchema), asyncHandler(async (req, res) => {
  const calculation = await storage.createCalculation(req.body);
  res.status(201).json(calculation);
}));

router.delete('/calculations/:id', asyncHandler(async (req, res) => {
  const success = await storage.deleteCalculation(req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Calculation not found' });
  }
  res.status(204).end();
}));

/**
 * Project Routes
 */
router.get('/projects', asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const projects = await storage.getProjects(userId as string);
  res.json(projects);
}));

router.get('/projects/:id', asyncHandler(async (req, res) => {
  const project = await storage.getProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  res.json(project);
}));

router.post('/projects', validate(insertProjectSchema), asyncHandler(async (req, res) => {
  const project = await storage.createProject(req.body);
  res.status(201).json(project);
}));

router.patch('/projects/:id', asyncHandler(async (req, res) => {
  const project = await storage.updateProject(req.params.id, req.body);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  res.json(project);
}));

router.delete('/projects/:id', asyncHandler(async (req, res) => {
  const success = await storage.deleteProject(req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Project not found' });
  }
  res.status(204).end();
}));

/**
 * Project Members Routes
 */
router.get('/projects/:projectId/members', asyncHandler(async (req, res) => {
  const members = await storage.getProjectMembers(req.params.projectId);
  res.json(members);
}));

router.post('/projects/:projectId/members/:userId', asyncHandler(async (req, res) => {
  const { role } = req.body;
  const success = await storage.addProjectMember(
    req.params.projectId,
    req.params.userId,
    role
  );
  
  if (!success) {
    return res.status(400).json({ message: 'Failed to add member to project' });
  }
  
  res.status(201).json({ message: 'Member added to project' });
}));

router.delete('/projects/:projectId/members/:userId', asyncHandler(async (req, res) => {
  const success = await storage.removeProjectMember(
    req.params.projectId,
    req.params.userId
  );
  
  if (!success) {
    return res.status(404).json({ message: 'Member not found in project' });
  }
  
  res.status(204).end();
}));

/**
 * Project Properties Routes
 */
router.get('/projects/:projectId/properties', asyncHandler(async (req, res) => {
  const properties = await storage.getProjectProperties(req.params.projectId);
  res.json(properties);
}));

router.post('/projects/:projectId/properties/:propertyId', asyncHandler(async (req, res) => {
  const success = await storage.addPropertyToProject(
    req.params.projectId,
    req.params.propertyId
  );
  
  if (!success) {
    return res.status(400).json({ message: 'Failed to add property to project' });
  }
  
  res.status(201).json({ message: 'Property added to project' });
}));

router.delete('/projects/:projectId/properties/:propertyId', asyncHandler(async (req, res) => {
  const success = await storage.removePropertyFromProject(
    req.params.projectId,
    req.params.propertyId
  );
  
  if (!success) {
    return res.status(404).json({ message: 'Property not found in project' });
  }
  
  res.status(204).end();
}));

/**
 * Settings Routes
 */
// Get all settings
router.get('/settings', asyncHandler(async (req, res) => {
  const settings = await storage.getSettings();
  res.json(settings);
}));

// Get a specific setting
router.get('/settings/:key', asyncHandler(async (req, res) => {
  const setting = await storage.getSetting(req.params.key);
  
  // Default values for known settings
  const defaultValues: Record<string, string> = {
    'SAAS_MODE': 'true',
    'DEV_AUTOLOGIN': 'true',
    'DEBUG_MODE': 'false',
    'API_RATE_LIMITING': 'true',
    'OPENAI_API_KEY_STATUS': 'missing',
    'DEV_AUTO_LOGIN_ENABLED': 'true'
  };
  
  // If setting doesn't exist but we have a default, return that
  if (!setting) {
    if (defaultValues[req.params.key]) {
      // Store the default value for future use
      await storage.setSetting(req.params.key, defaultValues[req.params.key]);
      return res.json({ key: req.params.key, value: defaultValues[req.params.key] });
    }
    
    return res.status(404).json({ message: 'Setting not found' });
  }
  
  // Return the key and value
  res.json({ key: req.params.key, value: setting.value });
}));

// Create or update a setting
router.put('/settings/:key', asyncHandler(async (req, res) => {
  const { value } = req.body;
  
  if (!value) {
    return res.status(400).json({ message: 'Value is required' });
  }
  
  // Ignore description parameter as it doesn't exist in the database
  const success = await storage.setSetting(req.params.key, value);
  
  if (!success) {
    return res.status(500).json({ message: 'Failed to set setting' });
  }
  
  res.json({ key: req.params.key, value });
}));

// Update a setting (PATCH variation for form compatibility)
router.patch('/settings/:key', asyncHandler(async (req, res) => {
  const { value } = req.body;
  
  if (!value) {
    return res.status(400).json({ message: 'Value is required' });
  }
  
  const success = await storage.setSetting(req.params.key, value);
  
  if (!success) {
    return res.status(500).json({ message: 'Failed to set setting' });
  }
  
  res.json({ key: req.params.key, value });
}));

/**
 * Analytics Routes
 */
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/what-if-scenarios', whatIfScenariosRoutes);
router.use('/stories', storytellingRoutes);
router.use('/', importRoutes);
router.use('/', calculationRoutes);

/**
 * System Routes
 */

// Health check endpoint with detailed system status
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await storage.checkDatabaseConnection();
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    
    // Check system uptime
    const uptime = process.uptime();
    
    // Service version
    const version = process.env.npm_package_version || '1.0.0';
    
    // Check agent health
    const agentStatuses = await storage.getAgentStatuses();
    
    // Return comprehensive health information
    res.json({
      status: dbStatus ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version,
      uptime,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB',
      },
      database: {
        connected: dbStatus,
      },
      agents: agentStatuses || { status: 'unknown' },
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'critical', 
      timestamp: new Date().toISOString(),
      error: 'Failed to perform health check'
    });
  }
});

// Prometheus metrics endpoint - exposes metrics in Prometheus format for scraping
router.get('/metrics', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await storage.checkDatabaseConnection();
    
    // Memory usage in bytes
    const memoryUsage = process.memoryUsage();
    
    // Get agent statuses
    const agentStatuses = await storage.getAgentStatuses();
    
    // Format metrics for Prometheus
    let prometheusMetrics = '';
    
    // System uptime
    prometheusMetrics += `# HELP app_uptime_seconds The uptime of the application in seconds\n`;
    prometheusMetrics += `# TYPE app_uptime_seconds gauge\n`;
    prometheusMetrics += `app_uptime_seconds ${process.uptime()}\n\n`;
    
    // Memory usage
    prometheusMetrics += `# HELP app_memory_usage_bytes Memory usage of the app in bytes\n`;
    prometheusMetrics += `# TYPE app_memory_usage_bytes gauge\n`;
    prometheusMetrics += `app_memory_usage_bytes{type="rss"} ${memoryUsage.rss}\n`;
    prometheusMetrics += `app_memory_usage_bytes{type="heapTotal"} ${memoryUsage.heapTotal}\n`;
    prometheusMetrics += `app_memory_usage_bytes{type="heapUsed"} ${memoryUsage.heapUsed}\n`;
    prometheusMetrics += `app_memory_usage_bytes{type="external"} ${memoryUsage.external}\n\n`;
    
    // Database status
    prometheusMetrics += `# HELP app_database_connected Database connection status (1 for connected, 0 for disconnected)\n`;
    prometheusMetrics += `# TYPE app_database_connected gauge\n`;
    prometheusMetrics += `app_database_connected ${dbStatus ? 1 : 0}\n\n`;
    
    // Agent health metrics
    prometheusMetrics += `# HELP app_agent_status AI Agent status (1 for healthy, 0 for unhealthy)\n`;
    prometheusMetrics += `# TYPE app_agent_status gauge\n`;
    
    // Convert agent statuses to Prometheus format
    Object.entries(agentStatuses).forEach(([agentId, status]) => {
      const isHealthy = status.status === 'healthy' ? 1 : 0;
      prometheusMetrics += `app_agent_status{agent="${agentId}"} ${isHealthy}\n`;
    });
    
    // Set content type for Prometheus metrics
    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
  } catch (error) {
    console.error('Metrics collection error:', error);
    res.status(500).send('# Error collecting metrics');
  }
});

// Agent status endpoints
router.get('/agents', asyncHandler(async (req, res) => {
  const agentStatuses = await storage.getAgentStatuses();
  res.json(agentStatuses);
}));

router.get('/agents/:agentId', asyncHandler(async (req, res) => {
  const agentStatus = await storage.getAgentStatus(req.params.agentId);
  if (!agentStatus) {
    return res.status(404).json({ message: 'Agent not found' });
  }
  res.json(agentStatus);
}));

router.post('/agents/:agentId/status', asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const { status, metadata, errorMessage } = req.body;
  
  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }
  
  const success = await storage.updateAgentStatus(
    agentId,
    status,
    metadata,
    errorMessage
  );
  
  if (!success) {
    return res.status(500).json({ message: 'Failed to update agent status' });
  }
  
  res.status(200).json({ message: 'Agent status updated successfully' });
}));

// Current authenticated user
router.get('/user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.json(req.user);
});

// ── File Upload & Data Import Routes ─────────────────────────────────────────
// Required by DataImportPage (/data-import) — primary MVP staff workflow surface
// Accepts .xlsx/.xls cost matrix files; tracks uploads + import history in DB.

const fileUploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});
const fileUploadMiddleware = multer({
  storage: fileUploadStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) cb(null, true);
    else cb(new Error('Only .xlsx, .xls, and .csv files are accepted'));
  },
});

// GET /api/files — list uploaded files (pending/processing/completed/failed)
router.get('/files', asyncHandler(async (_req, res) => {
  if (!db) {
    return res.json([]);
  }
  const rows = await db.select().from(fileUploads).orderBy(desc(fileUploads.uploadedAt));
  const files = rows.map(r => ({
    id: r.fileId,
    filename: r.fileName,
    uploadDate: r.uploadedAt?.toISOString() ?? new Date().toISOString(),
    fileSize: r.fileSize ?? 0,
    status: r.status ?? 'pending',
    message: r.errorCount && r.errorCount > 0 ? `${r.errorCount} error(s) during processing` : undefined,
    records: r.processedItems ?? undefined,
  }));
  res.json(files);
}));

// POST /api/upload — receive file, persist to disk + DB, return ImportFile record
router.post('/upload', fileUploadMiddleware.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const fileId = uuidv4();
  const record = {
    fileId,
    fileName: req.file.originalname,
    fileType: path.extname(req.file.originalname).toLowerCase().replace('.', ''),
    filePath: req.file.path,
    fileSize: req.file.size,
    uploadedBy: (req as any).user?.id ?? 0,
    uploadedAt: new Date(),
    status: 'pending' as const,
    processedItems: 0,
    totalItems: 0,
    errorCount: 0,
  };
  if (db) {
    await db.insert(fileUploads).values(record);
  }
  res.status(201).json({
    id: fileId,
    filename: req.file.originalname,
    uploadDate: record.uploadedAt.toISOString(),
    fileSize: req.file.size,
    status: 'pending',
  });
}));

// GET /api/preview-import/:fileId — parse first rows of uploaded xlsx, return ImportPreviewItem[]
router.get('/preview-import/:fileId', asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  if (!db) {
    return res.json([]);
  }
  const rows = await db.select().from(fileUploads).where(eq(fileUploads.fileId, fileId));
  if (!rows.length) {
    return res.status(404).json({ message: 'File not found' });
  }
  const filePath = rows[0].filePath;
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found on disk' });
  }
  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const preview = data.slice(0, 20).map((row, idx) => ({
      id: String(idx + 1),
      region: String(row['Region'] || row['region'] || row['REGION'] || ''),
      buildingType: String(row['BuildingType'] || row['building_type'] || row['Type'] || row['type'] || ''),
      year: Number(row['Year'] || row['year'] || row['YEAR'] || new Date().getFullYear()),
      baseCost: Number(row['BaseCost'] || row['base_cost'] || row['Cost'] || row['cost'] || 0),
      status: 'new' as const,
    }));
    res.json(preview);
  } catch (err) {
    res.status(422).json({ message: 'Could not parse file — ensure it is a valid .xlsx or .xls cost matrix' });
  }
}));

// GET /api/import-history — completed import records from dataImports table
router.get('/import-history', asyncHandler(async (_req, res) => {
  if (!db) {
    return res.json([]);
  }
  const rows = await db.select().from(dataImports).orderBy(desc(dataImports.importDate));
  const history = rows.map(r => ({
    id: String(r.id),
    fileId: r.importId ?? '',
    filename: r.fileName ?? '',
    importDate: r.importDate?.toISOString() ?? new Date().toISOString(),
    status: r.status === 'completed' ? 'success'
          : r.status === 'partial' ? 'partial'
          : 'failed',
    recordsProcessed: r.recordsProcessed ?? 0,
    recordsImported: r.recordsImported ?? 0,
    message: Array.isArray(r.errors) && r.errors.length ? r.errors[0] : undefined,
  }));
  res.json(history);
}));

// DELETE /api/files/:fileId — remove file record and disk file
router.delete('/files/:fileId', asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  if (!db) {
    return res.status(204).send();
  }
  const rows = await db.select().from(fileUploads).where(eq(fileUploads.fileId, fileId));
  if (rows.length && rows[0].filePath && fs.existsSync(rows[0].filePath)) {
    fs.unlinkSync(rows[0].filePath);
  }
  await db.delete(fileUploads).where(eq(fileUploads.fileId, fileId));
  res.status(204).send();
}));

// POST /api/import — process a staged file and record in dataImports
router.post('/import', asyncHandler(async (req, res) => {
  const { fileId } = req.body as { fileId?: string };
  if (!fileId) {
    return res.status(400).json({ message: 'fileId is required' });
  }
  if (!db) {
    return res.status(503).json({ message: 'Database unavailable' });
  }
  const rows = await db.select().from(fileUploads).where(eq(fileUploads.fileId, fileId));
  if (!rows.length) {
    return res.status(404).json({ message: 'File not found' });
  }
  const fileRow = rows[0];
  // Mark as processing
  await db.update(fileUploads).set({ status: 'processing' }).where(eq(fileUploads.fileId, fileId));

  let recordsProcessed = 0;
  let recordsImported = 0;
  let recordsFailed = 0;
  let errorMsg: string | null = null;

  try {
    if (fileRow.filePath && fs.existsSync(fileRow.filePath)) {
      const workbook = XLSX.readFile(fileRow.filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      recordsProcessed = data.length;
      recordsImported = data.length; // naive — no upsert logic yet; real merge is v1.1
    }
    await db.update(fileUploads)
      .set({ status: 'completed', processedItems: recordsImported, totalItems: recordsProcessed })
      .where(eq(fileUploads.fileId, fileId));
    await db.insert(dataImports).values({
      importId: fileId,
      importType: 'cost_matrix',
      fileName: fileRow.fileName,
      importDate: new Date(),
      status: 'completed',
      recordsProcessed,
      recordsImported,
      recordsFailed,
      source: 'file_upload',
    });
  } catch (err: any) {
    errorMsg = err?.message ?? 'Unknown error during import';
    recordsFailed = recordsProcessed;
    recordsImported = 0;
    await db.update(fileUploads)
      .set({ status: 'failed', errorCount: recordsFailed })
      .where(eq(fileUploads.fileId, fileId));
    await db.insert(dataImports).values({
      importId: fileId,
      importType: 'cost_matrix',
      fileName: fileRow.fileName,
      importDate: new Date(),
      status: 'failed',
      recordsProcessed,
      recordsImported: 0,
      recordsFailed,
      errors: [errorMsg],
      source: 'file_upload',
    });
    return res.status(500).json({ message: errorMsg });
  }

  res.json({
    fileId,
    status: 'completed',
    recordsProcessed,
    recordsImported,
    recordsFailed,
  });
}));

export default router;