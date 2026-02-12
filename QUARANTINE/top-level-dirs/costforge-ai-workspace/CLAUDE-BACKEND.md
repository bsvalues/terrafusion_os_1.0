# CLAUDE Backend Development Guide

This file provides detailed guidance for backend development in the TerraFusion TerraBuild Modernization platform.

## Backend Architecture

### Server Structure (`server/`)

```
server/
├── index.ts                    # Application entry point, middleware setup
├── routes.ts                   # Main route aggregator
├── db.ts                       # Database initialization and client export
├── auth.ts                     # Core authentication logic
├── calculationEngine.ts        # Building cost calculation engine
├── vite.ts                     # Vite integration for development
│
├── routes/                     # API route modules (~30 modules)
│   ├── index.ts                # Route aggregator and registration
│   ├── calculationRoutes.ts    # Cost calculation endpoints
│   ├── costCalculationRoutes.ts
│   ├── importRoutes.ts         # Data import endpoints
│   ├── exportRoutes.ts         # Data export endpoints
│   ├── ftpRoutes.ts            # FTP integration
│   ├── supabaseRoutes.ts       # Supabase integration
│   ├── collaborationRoutes.ts  # Project collaboration
│   ├── analyticsRoutes.ts      # Analytics and reporting
│   ├── swarmRoutes.ts          # AI swarm coordination
│   └── health.ts               # Health check endpoints
│
├── mcp/                        # Model Content Protocol AI framework
│   ├── index.ts                # MCP initialization
│   ├── routes.ts               # MCP API routes
│   ├── orchestrator.ts         # Agent orchestration
│   ├── anthropic.ts            # Anthropic API integration
│   ├── agents/                 # Individual AI agents
│   ├── experience/             # Agent learning and coordination
│   ├── functions/              # MCP function registry
│   ├── monitoring/             # Agent monitoring dashboard
│   └── schemas/                # MCP type definitions
│
├── services/                   # Business logic layer
│   ├── aiService.ts            # AI/ML services
│   ├── arcgisService.ts        # ArcGIS integration
│   ├── bentonConversionService.ts  # Marshall Swift → CFT conversion
│   ├── exportService.ts        # Data export handling
│   ├── ftpService.ts           # FTP operations
│   ├── nlp-service.ts          # Natural language processing
│   ├── schedulerService.ts     # Task scheduling
│   ├── costEngine/             # Cost calculation services
│   │   ├── marshallSwift.ts
│   │   └── CostFactorTables.ts
│   └── storytelling/           # AI storytelling services
│
├── middleware/                 # Express middleware
│   └── bentonCountyFormatMiddleware.ts
│
├── controllers/                # Request controllers
│   ├── analyticsController.ts
│   ├── reportController.ts
│   └── storytelling-controller.ts
│
├── storage/                    # Storage adapters
│   ├── advancedAnalyticsStorage.ts
│   ├── benchmarkingStorage.ts
│   ├── collaborationStorage.ts
│   └── externalApiStorage.ts
│
├── data-quality/               # Data validation framework
│   ├── framework.ts            # Core validation framework
│   ├── cost-matrix-rules.ts   # Cost matrix validation rules
│   ├── property-rules.ts      # Property data validation
│   └── types.ts                # Validation types
│
└── utils/                      # Utility modules
    ├── logger.ts               # Logging utilities
    ├── cache.ts                # Caching layer
    ├── errorHandler.ts         # Error handling
    └── supabaseClient.ts       # Supabase client setup
```

## Application Initialization Sequence

**Order matters!** The `server/index.ts` initialization follows this sequence:

```typescript
// 1. Setup Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 2. Initialize database connection
await initDatabase();  // MUST happen before MCP

// 3. Initialize MCP framework
initMCP(app);  // Requires database to be initialized

// 4. Setup authentication
await setupAuth(app);
setupCountyNetworkAuth(app);

// 5. Apply Benton County middleware
app.use(bentonCountyFormatMiddleware());
app.use(bentonCountyHeadersMiddleware());

// 6. Create HTTP server
const server = createServer(app);

// 7. Register monitoring routes (priority routes)
app.use('/api', monitoringRoutes);

// 8. Setup Vite in development
if (app.get("env") === "development") {
  await setupVite(app, server);
}

// 9. Register API routes
app.use(routes);

// 10. Serve static files in production
if (app.get("env") === "production") {
  serveStatic(app);
}
```

**Critical**: Database initialization MUST complete before MCP agents initialize. MCP agents may query the database during initialization.

## Database Layer

### Database Client (`server/db.ts`)

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Connection is re-initialized with proper connection string
export async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable not provided");
  }

  connectionString = process.env.DATABASE_URL;
  client = postgres(connectionString);
  db = drizzle(client, { schema });

  // Test connection
  await client`SELECT 1`;

  return true;
}

export { db };
```

### Using the Database Client

```typescript
import { db } from './db';
import { properties, improvements } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

// Insert
await db.insert(properties).values({
  parcelId: 'BEN-123-456',
  address: '123 Main St',
  city: 'Richland',
  state: 'WA',
  zip: '99352',
  county: 'Benton',
  propertyType: 'RESIDENTIAL',
});

// Select
const property = await db.query.properties.findFirst({
  where: eq(properties.parcelId, 'BEN-123-456'),
  with: {
    improvements: true,  // Include related improvements
  },
});

// Update
await db.update(properties)
  .set({ assessedValue: 350000 })
  .where(eq(properties.parcelId, 'BEN-123-456'));

// Delete
await db.delete(properties)
  .where(eq(properties.id, propertyId));

// Complex queries
const results = await db.query.properties.findMany({
  where: and(
    eq(properties.county, 'Benton'),
    eq(properties.propertyType, 'RESIDENTIAL')
  ),
  limit: 100,
  offset: 0,
  orderBy: (properties, { desc }) => [desc(properties.createdAt)],
});
```

### Schema Types

All table types are exported from `shared/schema.ts`:

```typescript
import { properties, improvements, users } from '../shared/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Type for selecting (reading from DB)
type Property = InferSelectModel<typeof properties>;

// Type for inserting (writing to DB)
type NewProperty = InferInsertModel<typeof properties>;

// Use in function signatures
async function getProperty(id: number): Promise<Property | undefined> {
  return await db.query.properties.findFirst({
    where: eq(properties.id, id),
  });
}

async function createProperty(data: NewProperty): Promise<Property> {
  const [property] = await db.insert(properties)
    .values(data)
    .returning();
  return property;
}
```

## Route Development Patterns

### Basic Route Structure

```typescript
// server/routes/yourRoutes.ts
import { Router, Request, Response } from 'express';
import { db } from '../db';
import { yourTable } from '../../shared/schema';

export const yourRouter = Router();

// GET endpoint
yourRouter.get('/items', async (req: Request, res: Response) => {
  try {
    const items = await db.query.yourTable.findMany({
      limit: parseInt(req.query.limit as string) || 100,
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      error: 'Failed to fetch items',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST endpoint with validation
yourRouter.post('/items', async (req: Request, res: Response) => {
  try {
    const { name, value } = req.body;

    // Validation
    if (!name || !value) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'name and value are required',
      });
    }

    // Insert
    const [item] = await db.insert(yourTable)
      .values({ name, value })
      .returning();

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({
      error: 'Failed to create item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
```

### Route Registration

```typescript
// server/routes/index.ts
import { Express } from 'express';
import { yourRouter } from './yourRoutes';
import { calculationRouter } from './calculationRoutes';
// ... other imports

export function registerRoutes(app: Express) {
  // Register with /api prefix
  app.use('/api', yourRouter);
  app.use('/api', calculationRouter);
  // ... other routes
}

export default registerRoutes;
```

### Authentication Middleware

```typescript
import { Request, Response, NextFunction } from 'express';

// Check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this resource',
    });
  }
  next();
}

// Check for specific role
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.session.user.role !== role) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Requires ${role} role`,
      });
    }

    next();
  };
}

// Usage in routes
yourRouter.post('/admin/items', requireAuth, requireRole('admin'), async (req, res) => {
  // Only authenticated admins can access
});
```

## Cost Calculation Engine

### Core Calculation Service (`server/calculationEngine.ts`)

```typescript
export interface CostCalculationParams {
  region: string;
  buildingType: string;
  squareFootage: number;
  complexityFactor?: number;
  yearBuilt?: number;
  quality?: string;
}

export interface CostCalculationResult {
  region: string;
  buildingType: string;
  squareFootage: number;
  baseCost: number;
  adjustedCost: number;
  totalCost: number;
  depreciationAdjustment: number;
  complexityFactor: number;
  conditionFactor: number;
  materialCosts?: {
    concrete: number;
    framing: number;
    roofing: number;
    electrical: number;
    plumbing: number;
    finishes: number;
    other: number;
  };
}

export async function calculateBuildingCost(
  params: CostCalculationParams
): Promise<CostCalculationResult> {
  // Fetch base cost from cost matrix
  const costFactor = await db.query.costMatrix.findFirst({
    where: and(
      eq(costMatrix.region, params.region),
      eq(costMatrix.buildingType, params.buildingType)
    ),
  });

  if (!costFactor) {
    throw new Error(`No cost factor found for ${params.region} - ${params.buildingType}`);
  }

  // Calculate adjustments
  const complexity = params.complexityFactor || 1.0;
  const depreciation = calculateDepreciation(params.yearBuilt);
  const condition = calculateConditionFactor(params.quality);

  // Calculate costs
  const baseCost = parseFloat(costFactor.baseCost);
  const adjustedCost = baseCost * complexity * depreciation * condition;
  const totalCost = adjustedCost * params.squareFootage;

  // Calculate material breakdown
  const materialCosts = calculateMaterialCosts(adjustedCost, params.squareFootage);

  return {
    region: params.region,
    buildingType: params.buildingType,
    squareFootage: params.squareFootage,
    baseCost,
    adjustedCost,
    totalCost,
    depreciationAdjustment: depreciation,
    complexityFactor: complexity,
    conditionFactor: condition,
    materialCosts,
  };
}
```

### Benton County Conversion Service

Marshall Swift to Cost per Square Foot conversion:

```typescript
// server/services/bentonConversionService.ts
export interface BentonConversionParams {
  marshallSwiftCode: string;
  squareFootage: number;
  yearBuilt: number;
  quality: 'LOW' | 'STANDARD' | 'HIGH';
  condition: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
}

export async function convertMarshallSwiftToCFT(
  params: BentonConversionParams
): Promise<number> {
  // Lookup Marshall Swift base cost
  const msData = await lookupMarshallSwift(params.marshallSwiftCode);

  // Apply quality adjustment
  const qualityFactor = getQualityFactor(params.quality);

  // Apply condition adjustment
  const conditionFactor = getConditionFactor(params.condition);

  // Apply depreciation
  const depreciation = calculateDepreciation(params.yearBuilt);

  // Calculate CFT (Cost per Square Foot)
  const cft = msData.baseCost * qualityFactor * conditionFactor * depreciation;

  return cft;
}
```

## MCP Agent Development

### Agent Base Pattern

All agents extend `BaseAgent`:

```typescript
// server/mcp/agents/yourAgent.ts
import { BaseAgent } from './baseAgent';
import { MCPRequest, MCPResponse } from '../schemas/types';

export class YourAgent extends BaseAgent {
  constructor() {
    super('your-agent', 'Description of what your agent does');
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Your Agent');

    // Initialize any required resources
    // Connect to external services
    // Load configuration

    this.logger.info('Your Agent initialized successfully');
  }

  async process(request: MCPRequest): Promise<MCPResponse> {
    this.logger.info('Processing request', { request });

    try {
      // Validate request
      this.validateRequest(request);

      // Process the request
      const result = await this.performTask(request.data);

      // Return response
      return {
        status: 'success',
        data: result,
        metadata: {
          agentId: this.agentId,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Error processing request', { error });

      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          agentId: this.agentId,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  private validateRequest(request: MCPRequest): void {
    if (!request.data) {
      throw new Error('Request data is required');
    }
    // Additional validation
  }

  private async performTask(data: any): Promise<any> {
    // Agent-specific logic here
    return { processed: true };
  }
}

// Export singleton instance
export const yourAgent = new YourAgent();
```

### Agent Registration

```typescript
// server/mcp/index.ts
import { yourAgent } from './agents/yourAgent';

export function initMCP(app: Express): void {
  console.log('Initializing MCP framework...');

  try {
    // Register MCP routes
    app.use('/mcp', mcpRouter);

    // Initialize agents
    initializeAgents();

    // Initialize orchestrator
    mcpOrchestrator.initialize();

    console.log('MCP framework initialized successfully');
  } catch (error) {
    console.error('Error initializing MCP framework:', error);
    throw error;
  }
}

function initializeAgents(): void {
  // Agents auto-register through the coordinator
  agentCoordinator.updateAgentRegistry();

  // Additional agent initialization if needed
  console.log('All agents registered');
}
```

### Agent Coordination

```typescript
// Using the orchestrator to coordinate multiple agents
import { mcpOrchestrator } from '../mcp/orchestrator';

async function processComplexTask(data: any) {
  // Request goes through orchestrator
  const result = await mcpOrchestrator.routeRequest({
    agentId: 'data-analysis-agent',
    operation: 'analyze',
    data: data,
  });

  // Orchestrator handles agent selection, load balancing, and error handling
  return result;
}
```

## Service Layer Patterns

### Service Structure

```typescript
// server/services/yourService.ts
import { db } from '../db';
import { yourTable } from '../../shared/schema';

export class YourService {
  async getData(filters: any) {
    // Service-level business logic
    const results = await db.query.yourTable.findMany({
      where: this.buildWhereClause(filters),
    });

    return this.transformResults(results);
  }

  private buildWhereClause(filters: any) {
    // Build dynamic where clause
    return eq(yourTable.id, filters.id);
  }

  private transformResults(results: any[]) {
    // Transform/enrich results
    return results.map(r => ({
      ...r,
      enrichedField: this.calculateEnrichment(r),
    }));
  }

  private calculateEnrichment(record: any) {
    // Business logic calculations
    return record.value * 1.1;
  }
}

export const yourService = new YourService();
```

## Error Handling Patterns

### Centralized Error Handler

```typescript
// server/utils/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}

// Usage in routes
import { AppError } from '../utils/errorHandler';

yourRouter.get('/item/:id', async (req, res, next) => {
  try {
    const item = await db.query.yourTable.findFirst({
      where: eq(yourTable.id, parseInt(req.params.id)),
    });

    if (!item) {
      throw new AppError(404, 'Item not found', 'NOT_FOUND');
    }

    res.json(item);
  } catch (error) {
    next(error);  // Pass to error handler
  }
});
```

## Testing Backend Code

### API Endpoint Tests

```typescript
// tests/core/api-endpoints.test.js
import { describe, it, expect } from '@jest/globals';
import supertest from 'supertest';
import app from '../../server/index';

const request = supertest(app);

describe('Your API Endpoints', () => {
  it('should fetch items', async () => {
    const response = await request.get('/api/items');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should create item', async () => {
    const response = await request
      .post('/api/items')
      .send({ name: 'Test Item', value: 100 });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Item');
  });
});
```

## Performance Optimization

### Database Query Optimization

```typescript
// Use select() to limit returned fields
const properties = await db.select({
  id: properties.id,
  parcelId: properties.parcelId,
  address: properties.address,
}).from(properties);

// Use prepared statements for repeated queries
const getPropertyByParcel = db.query.properties.findFirst({
  where: eq(properties.parcelId, sql.placeholder('parcelId')),
}).prepare();

const property = await getPropertyByParcel.execute({ parcelId: 'BEN-123' });
```

### Caching Layer

```typescript
// server/utils/cache.ts
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 600,  // 10 minutes default
  checkperiod: 120,
});

export async function getCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const value = await fetchFn();
  cache.set(key, value, ttl);
  return value;
}

// Usage
const costMatrix = await getCached(
  'cost-matrix-all',
  () => db.query.costMatrix.findMany(),
  3600  // 1 hour
);
```

---

**Last Updated**: October 2025
**Related**: CLAUDE.md, CLAUDE-FRONTEND.md, API-ENDPOINTS.md
