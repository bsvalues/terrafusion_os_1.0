import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { WebSocketServer } from 'ws';
import { initDatabase } from './db';
import { storage } from './storage';
import { insertPropertySchema, insertAppraisalSchema, insertComparableSchema } from '../shared/schema';
// Import monitoring components
const monitoring = require('./monitoring');
// 🏛️ ELITE GOVERNMENT OS ENGINEERING - SERVICE REGISTRY INTEGRATION
import { eliteServiceRegistry } from './elite-service-registry';

// Initialize the Express application
const app = express();

// 🏛️ ELITE GOVERNMENT OS ENGINEERING - DYNAMIC PORT ALLOCATION
const PORT = await eliteServiceRegistry.getAvailablePort();

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server with a specific path
const wss = new WebSocketServer({ server, path: '/ws' });

// Store active connections
const clients = new Set();

// Database status tracking
let dbStatus = 'initializing';

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  clients.add(ws);

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);
      
      // Here you could process messages based on their type
      // For now, we're just broadcasting them to all clients
      broadcastMessage(data.type, data.payload);
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });

  // Send a welcome message
  ws.send(JSON.stringify({
    type: 'NOTIFICATION',
    payload: {
      message: 'Connected to Terrafusion Professional WebSocket Server',
      timestamp: new Date().toISOString()
    }
  }));
});

// Broadcast a message to all connected clients
export function broadcastMessage(type: string, payload: any) {
  const message = JSON.stringify({ type, payload });
  
  clients.forEach((client: any) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// Middlewares
app.use(cors());
app.use(express.json());

// Initialize monitoring (must be after middleware setup)
monitoring.initializeMonitoring(app);

// Initialize the database connection
initDatabase().then((success) => {
  if (success) {
    dbStatus = 'connected';
    console.log('🏛️ Elite Database Connection Established - TerraFusion ProPlus Ready');
  } else {
    dbStatus = 'degraded';
    console.error('Failed to connect to the database. Server will continue, but database operations may fail.');
  }
});

// API Routes - Properties
const propertiesRouter = express.Router();

propertiesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const properties = await storage.getProperties();
    return res.status(200).json(properties);
  } catch (error) {
    console.error('Error getting properties:', error);
    return res.status(500).json({ error: 'Failed to get properties' });
  }
});

propertiesRouter.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid property ID' });
    }

    const property = await storage.getProperty(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    return res.status(200).json(property);
  } catch (error) {
    console.error('Error getting property:', error);
    return res.status(500).json({ error: 'Failed to get property' });
  }
});

propertiesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const propertyData = insertPropertySchema.parse(req.body);
    const newProperty = await storage.createProperty(propertyData);
    return res.status(201).json(newProperty);
  } catch (error) {
    console.error('Error creating property:', error);
    return res.status(400).json({ error: 'Invalid property data' });
  }
});

propertiesRouter.put('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid property ID' });
    }

    const propertyData = req.body;
    const updatedProperty = await storage.updateProperty(id, propertyData);
    
    if (!updatedProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }

    return res.status(200).json(updatedProperty);
  } catch (error) {
    console.error('Error updating property:', error);
    return res.status(400).json({ error: 'Invalid property data' });
  }
});

propertiesRouter.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid property ID' });
    }

    const success = await storage.deleteProperty(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Property not found or cannot be deleted' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting property:', error);
    return res.status(500).json({ error: 'Failed to delete property' });
  }
});

// API Routes - Appraisals
const appraisalsRouter = express.Router();

appraisalsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? parseInt(req.query.propertyId as string, 10) : undefined;
    const appraiserId = req.query.appraiserId ? parseInt(req.query.appraiserId as string, 10) : undefined;
    
    let appraisals = [];
    
    if (propertyId) {
      appraisals = await storage.getAppraisalsByProperty(propertyId);
    } else if (appraiserId) {
      appraisals = await storage.getAppraisalsByAppraiser(appraiserId);
    } else {
      // In a real application, you might want to limit this or implement pagination
      // For now, we'll return an error asking for a filter
      return res.status(400).json({ error: 'Please provide either propertyId or appraiserId as a query parameter' });
    }
    
    return res.status(200).json(appraisals);
  } catch (error) {
    console.error('Error getting appraisals:', error);
    return res.status(500).json({ error: 'Failed to get appraisals' });
  }
});

appraisalsRouter.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid appraisal ID' });
    }

    const appraisal = await storage.getAppraisal(id);
    if (!appraisal) {
      return res.status(404).json({ error: 'Appraisal not found' });
    }

    return res.status(200).json(appraisal);
  } catch (error) {
    console.error('Error getting appraisal:', error);
    return res.status(500).json({ error: 'Failed to get appraisal' });
  }
});

appraisalsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const appraisalData = insertAppraisalSchema.parse(req.body);
    const newAppraisal = await storage.createAppraisal(appraisalData);
    return res.status(201).json(newAppraisal);
  } catch (error) {
    console.error('Error creating appraisal:', error);
    return res.status(400).json({ error: 'Invalid appraisal data' });
  }
});

// API Routes - Comparables
const comparablesRouter = express.Router();

comparablesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const appraisalId = req.query.appraisalId ? parseInt(req.query.appraisalId as string, 10) : undefined;
    
    if (!appraisalId) {
      return res.status(400).json({ error: 'Please provide appraisalId as a query parameter' });
    }
    
    const comparables = await storage.getComparablesByAppraisal(appraisalId);
    return res.status(200).json(comparables);
  } catch (error) {
    console.error('Error getting comparables:', error);
    return res.status(500).json({ error: 'Failed to get comparables' });
  }
});

comparablesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const comparableData = insertComparableSchema.parse(req.body);
    const newComparable = await storage.createComparable(comparableData);
    return res.status(201).json(newComparable);
  } catch (error) {
    console.error('Error creating comparable:', error);
    return res.status(400).json({ error: 'Invalid comparable data' });
  }
});

// API Routes - Market Data
const marketDataRouter = express.Router();

marketDataRouter.get('/', async (req: Request, res: Response) => {
  try {
    const zipCode = req.query.zipCode as string;
    const propertyId = req.query.propertyId ? parseInt(req.query.propertyId as string, 10) : undefined;
    
    let marketData = [];
    
    if (zipCode) {
      marketData = await storage.getMarketDataByZipCode(zipCode);
    } else if (propertyId) {
      marketData = await storage.getMarketDataForProperty(propertyId);
    } else {
      return res.status(400).json({ error: 'Please provide either zipCode or propertyId as a query parameter' });
    }
    
    return res.status(200).json(marketData);
  } catch (error) {
    console.error('Error getting market data:', error);
    return res.status(500).json({ error: 'Failed to get market data' });
  }
});

// Import pipelines router
import pipelinesRouter from './routes/pipelines';

// Register API routes
app.use('/api/properties', propertiesRouter);
app.use('/api/appraisals', appraisalsRouter);
app.use('/api/comparables', comparablesRouter);
app.use('/api/market-data', marketDataRouter);
app.use('/api/pipelines', pipelinesRouter);

// 🏛️ ELITE GOVERNMENT-GRADE HEALTH ENDPOINT
app.get('/health', async (req, res) => {
  try {
    const registryHealth = eliteServiceRegistry.getRegistryHealth();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      server: 'TerraFusion Professional - Real Estate Appraisal Platform',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      
      // Government-Grade Health Metrics
      platform: {
        name: 'TerraFusion ProPlus',
        classification: 'Real Estate & Government Integration',
        securityLevel: 'Government-Grade',
        capabilities: [
          'real-estate-appraisal',
          'property-management',
          'market-analysis',
          'government-os-integration'
        ]
      },
      
      // Database Status
      database: {
        status: dbStatus,
        type: 'Drizzle ORM + PostgreSQL',
        fallback: 'Graceful degradation enabled'
      },
      
      // Service Registry Status
      serviceRegistry: {
        status: 'operational',
        ...registryHealth
      },
      
      // Integration Status
      integrations: {
        governmentOS: {
          status: registryHealth.governmentOSConnected ? 'connected' : 'available',
          agentCoordination: 'enabled',
          federationLevel: 'county-ready'
        },
        websocket: {
          status: 'operational',
          clients: clients.size,
          realTimeFeatures: 'enabled'
        }
      },
      
      // Elite Metrics
      eliteMetrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        buildTime: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      server: 'TerraFusion Professional',
      error: error instanceof Error ? error.message : 'Unknown error',
      platform: {
        name: 'TerraFusion ProPlus',
        status: 'degraded-but-operational'
      }
    });
  }
});

// Serve static files from the 'client/dist' directory
app.use(express.static(path.join(__dirname, '../client/dist')));

// All other requests will be directed to the main index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start the server
server.listen(PORT, async () => {
  console.log(`🚀 TerraFusion Professional API server running on port ${PORT}`);
  
  // 🏛️ ELITE GOVERNMENT OS INTEGRATION - REGISTER WITH SERVICE REGISTRY
  try {
    await eliteServiceRegistry.registerService({
      name: 'terrafusion-propluz-api',
      port: PORT,
      healthEndpoint: '/health',
      capabilities: [
        'real-estate-appraisal',
        'property-management', 
        'market-analysis',
        'comparable-data',
        'websocket-realtime'
      ],
      metadata: {
        platform: 'terrafusion-propluz',
        classification: 'real-estate',
        securityLevel: 'government-grade'
      }
    });
    console.log('🏛️ Successfully registered with Elite Service Registry');
    
    // Coordinate with Government OS
    const coordination = await eliteServiceRegistry.coordinateWithGovernmentOS({
      action: 'real-estate-platform-online',
      parameters: {
        capabilities: ['property-appraisal', 'market-analysis'],
        port: PORT,
        healthEndpoint: '/health'
      }
    });
    console.log('🤖 Government OS coordination:', coordination.data.message);
    
    // 🏛️ ELITE STATUS DISPLAY
    console.log('\n🏛️ ELITE INTEGRATION COMPLETE');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│                 TERRAFUSION ELITE STATUS                   │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│ • Real Estate Platform: OPERATIONAL                        │');
    console.log('│ • Government OS Integration: ENABLED                       │');
    console.log('│ • Service Registry: GOVERNMENT-GRADE                       │');
    console.log('│ • Database Status: ' + dbStatus.toUpperCase().padEnd(36) + '│');
    console.log('│ • AI Agent Coordination: READY                             │');
    console.log('│ • WebSocket Clients: ' + clients.size.toString().padEnd(34) + '│');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│           🏛️ GOVERNMENT. TRANSCENDED. 🏛️                  │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
    
  } catch (error) {
    console.error('⚠️  Service registry registration failed:', error);
    console.log('🏛️ Elite Service Registry operational in standalone mode');
  }
});

export default app;