# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**TerraFusion TerraBuild Modernization** is a Node.js/React property cost assessment platform for Benton County, Washington. It serves as the modernization layer for the TerraFusion OS platform, providing a web-based interface for building cost calculations, AI-powered analysis, and property data management.

**Key Architecture**: Single-port (5000) Express + Vite development environment with PostgreSQL backend and MCP-based AI agent coordination.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (port 5000)
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Apply database schema changes
npm run db:push

# Type check
npm run check
```

## Project Structure

```
terrabuild-modernization/
├── client/                  # React 18 + TypeScript frontend
│   └── src/
│       ├── components/      # UI components (AI, dashboard, data-connectors, etc.)
│       ├── pages/           # Route-level page components
│       ├── lib/             # Client utilities and helpers
│       └── types/           # TypeScript type definitions
├── server/                  # Express.js backend
│   ├── routes/              # API route handlers (~30 route modules)
│   ├── mcp/                 # AI agent system (MCP framework)
│   │   ├── agents/          # Individual agent implementations
│   │   ├── experience/      # Agent coordination and training
│   │   ├── functions/       # MCP function registry
│   │   └── monitoring/      # Agent monitoring dashboard
│   ├── services/            # Business logic services
│   ├── middleware/          # Express middleware
│   └── utils/               # Server utilities
├── shared/                  # Shared code between client and server
│   ├── schema.ts            # Drizzle ORM database schema
│   ├── mcp/                 # MCP shared types and validation
│   └── types.ts             # Shared TypeScript types
├── terraform/               # Infrastructure as Code
│   ├── environments/        # Environment-specific configs (dev/staging/prod)
│   └── modules/             # Terraform modules
└── scripts/                 # Utility scripts
```

## Architecture

### Single-Port Architecture (Port 5000)

The application runs on a single port with different behavior in dev vs production:

- **Development**: Vite dev server handles client requests, Express middleware handles `/api/*` routes
- **Production**: Express serves static client files from `dist/public/` and handles API routes
- **Never** run client and server on separate ports - this architecture is intentional

### Database Layer

- **ORM**: Drizzle ORM with PostgreSQL
- **Schema**: Defined in `shared/schema.ts` (camelCase TypeScript, snake_case DB columns)
- **Migrations**: Auto-applied via `npm run db:push` (uses `drizzle-kit push`)
- **Connection**: Initialized in `server/db.ts` via `initDatabase()` before MCP agents start

**Key Tables**:
- `properties` - Property records with geospatial data
- `improvements` - Building improvements linked to properties
- `costMatrix` - Cost calculation matrix data
- `users` / `sessions` - Authentication (Replit Auth + County Network Auth)
- `agentStatus` - MCP agent monitoring
- `calculationHistory` - User calculation records

### MCP Agent Framework

The Model Content Protocol (MCP) framework coordinates AI agents for specialized tasks:

**Agent Locations**: `server/mcp/agents/`

**Core Agents**:
- `conversionAgent.ts` - Benton County data conversion (Marshall Swift to CFT)
- `dataAnalysisAgent.ts` - Property data analysis
- `costEstimationAgent.ts` - Building cost estimation
- `dataQualityAgent.ts` - Data validation and quality checks
- `complianceAgent.ts` - Regulatory compliance verification
- `designAgent.ts` - Design recommendations
- `developmentAgent.ts` - Development workflow automation
- `documentProcessingAgent.ts` - Document processing and extraction
- `geospatialAnalysisAgent.ts` - Geospatial analysis

**Agent Coordination**:
- Initialized in `server/mcp/index.ts` via `initMCP(app)`
- Coordinated by `agentCoordinator` in `server/mcp/experience/agentCoordinator.ts`
- Routes exposed via `server/mcp/routes.ts` at `/mcp/*`
- Status tracked in database `agentStatus` table

### Authentication

Dual authentication system:
1. **Replit Auth** - OIDC-based (development/Replit environments)
2. **County Network Auth** - Custom county-based authentication

Configured in:
- `server/replitAuth_final.ts` - Replit authentication
- `server/county-auth.ts` - County network authentication
- Fallback logic in `server/index.ts` lines 64-80

## Development Commands

### Building and Running

```bash
# Development server (Vite + Express on port 5000)
npm run dev

# Production build
npm run build
# Output: dist/public/ (client) and dist/ (server bundle)

# Production server
npm start

# Type checking only (no build)
npm run check
```

### Database Operations

```bash
# Push schema changes to database (no migrations)
npm run db:push

# Note: This project uses drizzle-kit push, not migrations
# Schema is in shared/schema.ts
# Config is in drizzle.config.ts
```

### Testing

The project uses a dual testing approach:

```bash
# Core tests (CommonJS/ES Module compatible)
node run-core-tests.js

# Modern TypeScript tests (using tsx)
node test-core.js

# Test categories:
# - API endpoint tests (tests/core/api-endpoints.test.js)
# - Calculation engine tests (tests/core/calculation-engine.test.js)
# - Database integration tests (tests/core/database.test.js)
```

**Test Infrastructure**: Supports both CommonJS and ES Modules with fallback to mock implementations for robustness. See `test-documentation.md` for details.

## Key API Routes

### Cost Calculation
- `POST /api/calculate` - Basic building cost calculation
- `POST /api/costs/calculate-materials` - Cost with material breakdown
- `POST /api/building-cost/calculate` - Detailed cost with quality/complexity factors
- `GET /api/cost-matrix` - Retrieve cost matrix data

### Data Import/Export
- `POST /api/import/parcels` - Import property parcel data
- `POST /api/import/factors` - Import cost factors
- Various export routes in `server/routes/exportRoutes.ts`

### MCP Agents
- `POST /mcp/agent/{agentId}` - Interact with specific agent
- `GET /mcp/status` - Agent status overview
- `GET /mcp/dashboard` - Agent monitoring dashboard

### Property Management
- Routes in `server/routes/property-import.ts`
- FTP integration in `server/routes/ftpRoutes.ts`

### Full route listing**: See `API-ENDPOINTS.md` for comprehensive endpoint documentation

## Development Patterns

### Adding a New API Route

1. Create route file in `server/routes/yourRoute.ts`:
```typescript
import { Router, Request, Response } from 'express';
export const yourRouter = Router();

yourRouter.post('/your-endpoint', async (req: Request, res: Response) => {
  try {
    const result = await yourService(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

2. Register in `server/routes/index.ts`:
```typescript
import { yourRouter } from './yourRoute';
app.use('/api', yourRouter);
```

3. The route will be available at `/api/your-endpoint`

### Adding a Database Table

1. Define table in `shared/schema.ts`:
```typescript
export const yourTable = pgTable('your_table', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // Use camelCase in TypeScript, snake_case in DB
});
```

2. Define relations if needed:
```typescript
export const yourTableRelations = relations(yourTable, ({ one, many }) => ({
  relatedTable: one(otherTable, {
    fields: [yourTable.relatedId],
    references: [otherTable.id],
  }),
}));
```

3. Push schema changes:
```bash
npm run db:push
```

### Adding an MCP Agent

1. Create agent in `server/mcp/agents/yourAgent.ts`:
```typescript
import { BaseAgent } from './baseAgent';
import { MCPRequest, MCPResponse } from '../schemas/types';

export class YourAgent extends BaseAgent {
  constructor() {
    super('your-agent', 'Your Agent Description');
  }

  async initialize(): Promise<void> {
    // Initialization logic
    this.logger.info('Your Agent initialized');
  }

  async process(request: MCPRequest): Promise<MCPResponse> {
    // Processing logic
    return {
      status: 'success',
      data: { /* response data */ },
    };
  }
}

export const yourAgent = new YourAgent();
```

2. Register in `server/mcp/index.ts`:
```typescript
import { yourAgent } from './agents/yourAgent';

function initializeAgents(): void {
  // Agent is auto-registered through agent registry
  agentCoordinator.updateAgentRegistry();
}
```

3. Add routes in `server/mcp/routes.ts` if needed

### Adding a React Component

1. Create in appropriate category under `client/src/components/`:
```typescript
// client/src/components/dashboard/YourComponent.tsx
import { useQuery } from '@tanstack/react-query';

export function YourComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['your-data'],
    queryFn: () => fetch('/api/your-endpoint').then(r => r.json()),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

2. Use in pages or other components

**Component Categories**:
- `ai/` - AI-powered components
- `dashboard/` - Dashboard widgets
- `data-connectors/` - Data integration UI
- `layout/` - Layout components
- `ui/` - Base UI components (shadcn/ui)
- `collaboration/` - Project collaboration features
- `visualizations/` - Data visualization components

## Important Configuration Files

### Vite Configuration (`vite.config.ts`)
- Client root: `client/`
- Build output: `dist/public/`
- Path aliases: `@` → `client/src`, `@shared` → `shared`
- Plugins: React, shadcn theme, runtime error overlay

### Drizzle Configuration (`drizzle.config.ts`)
- Schema: `shared/schema.ts`
- Migrations output: `migrations/` (not used with push)
- Dialect: PostgreSQL
- Requires `DATABASE_URL` environment variable

### Environment Variables
Required in `.env`:
```bash
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=development
REPLIT_DOMAINS=your-replit-domain.com  # Optional, for Replit Auth
```

## Infrastructure & DevOps

### Terraform Deployment

Infrastructure is defined in `terraform/` with environment-specific configs:

```bash
# Development deployment
cd terraform/environments/dev
terraform init
terraform plan
terraform apply

# Production deployment
cd terraform/environments/prod
terraform init -backend-config=backend.tfvars
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

**Modules**: `terraform/modules/` contains reusable infrastructure components (compute, database, networking, security, ECS, monitoring)

### Docker Deployment

```bash
# Using dev-compose.yml
docker-compose -f dev-compose.yml up -d

# Application available at http://localhost:5000
```

### CI/CD Workflows

GitHub Actions in `.github/workflows/`:
- `ci.yml` - Continuous integration
- `deploy.yml` - Deployment pipeline
- `terraform.yml` - Infrastructure deployment

## Critical Development Rules

### Port Management
- **ALWAYS use port 5000** - this is the only exposed port
- Development: Vite + Express share port 5000
- Production: Express serves everything on port 5000
- Never try to run client on 3000 and server on 5000 separately

### Database Schema
- **ALWAYS** modify `shared/schema.ts` for schema changes
- **ALWAYS** run `npm run db:push` after schema modifications
- Use camelCase in TypeScript, snake_case gets auto-mapped to DB
- Import types from `shared/schema.ts` for consistency

### MCP Agent Guidelines
- Database must be initialized before MCP agents (`initDatabase()` before `initMCP()`)
- Agents auto-register through agent coordinator
- Update agent registry via `agentCoordinator.updateAgentRegistry()`
- Follow `BaseAgent` pattern for new agents
- Track agent status in `agentStatus` table

### Authentication
- Development without Replit: Falls back to county-only auth
- Production: Both Replit Auth and County Network Auth active
- Session storage: `sessions` table (OIDC standard format)
- User storage: `users` table

### TypeScript
- All new code should be TypeScript
- Client uses `@/` path alias for `client/src/`
- Server uses relative imports
- Shared code in `shared/` accessible to both client and server

### Benton County Data
- Cost matrix data in `benton_cost_matrix.json` and related files
- County-specific middleware in `server/middleware/bentonCountyFormatMiddleware.ts`
- Marshall Swift to CFT conversion via `conversionAgent`
- Property data must include Benton County format compliance

## Monitoring & Observability

### Agent Monitoring
- MCP dashboard at `/mcp/dashboard`
- Agent status tracked in `agentStatus` table
- Real-time monitoring in `server/mcp/monitoring/dashboard.ts`

### Health Checks
- Basic: `GET /api/health`
- Detailed: Available via monitoring routes

### Logging
- Server logging via `server/vite.ts` log function
- API requests logged with duration and response preview
- MCP agents use internal logger

## Related Documentation

- **API Documentation**: `API-ENDPOINTS.md` - Complete API endpoint reference
- **DevOps Guide**: `DEVOPS_README.md` - Infrastructure and deployment
- **Test Documentation**: `test-documentation.md` - Testing infrastructure
- **GitHub Copilot Instructions**: `.github/copilot-instructions.md` - AI-specific development patterns
- **Property Data Import**: `PROPERTY_DATA_IMPORT.md` - Property data import procedures

## Common Issues

### Database Connection Errors
- Verify `DATABASE_URL` is set in `.env`
- Database must be initialized before MCP agents
- Check PostgreSQL is running and accessible

### Port Already in Use
- Kill process on port 5000: `lsof -ti:5000 | xargs kill -9`
- Or change port in environment variable (not recommended)

### MCP Agent Initialization Failures
- Ensure database is initialized first
- Check agent code follows `BaseAgent` pattern
- Verify agent is imported in `server/mcp/index.ts`
- Check `agentStatus` table exists in database

### TypeScript Compilation Errors
- Run `npm run check` to see all type errors
- Ensure `shared/schema.ts` types are imported correctly
- Check Vite path aliases are configured correctly

### Test Failures
- Tests use mock implementations as fallback
- Some tests require database connection
- Run `node run-core-tests.js` for compatibility mode
- Run `node test-core.js` for TypeScript support

---

**Last Updated**: October 2025
**Version**: TerraFusion TerraBuild Modernization
**Primary Port**: 5000
**Database**: PostgreSQL via Drizzle ORM
**Framework**: Express + Vite + React 18 + MCP Agents
