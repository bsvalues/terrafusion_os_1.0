# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

The **Marketplace API** module provides REST API endpoints and integration services for the TerraFusion Government AI Plugin Marketplace. This is a Node.js/TypeScript microservice that bridges the .NET backend (`TerraFusion.AI/Services/MarketplaceService.cs`) with frontend marketplace applications, plugin developers, and external integrations.

**CRITICAL CONTEXT**: This module is part of TerraFusion OS 1.0, a complete government operating system with 1,008 AI agents and FISMA-HIGH compliance. Read `../../CLAUDE.md` and `../../.github/copilot-instructions.md` for essential system architecture and compliance requirements.

## Architecture Context

### Marketplace Ecosystem

```
TerraFusion Marketplace Architecture
├── Backend (.NET 8)
│   └── TerraFusion.AI/Services/MarketplaceService.cs  # Core marketplace logic
├── marketplace/api/ (THIS MODULE)                      # REST API + Integration
├── marketplace/marketplace-frontend/                   # React marketplace UI
├── marketplace/plugins/                                # Plugin modules
└── marketplace/store/                                  # App store interface
```

### Service Integration Points

- **Backend Service**: `TerraFusion.AI/Services/MarketplaceService.cs` (port 5000)
  - Plugin submission processing with consensus signature verification
  - WASM sandbox execution for plugin validation
  - Plugin metadata management and approval workflow

- **Frontend Applications**: React 18 + TypeScript marketplace interfaces
- **Plugin Developers**: API endpoints for plugin submission, validation, publishing
- **AI Swarm**: Integration with 1,008-agent consciousness layer (port 3004)

## Development Setup

### Prerequisites

- **Node.js 20+** and **npm** or **yarn**
- **.NET 8 SDK** (for backend integration)
- **PostgreSQL** (production) or **SQLite** (development)
- **Docker** (optional, for containerized deployment)

### Initial Setup

```bash
# From marketplace/api directory
npm init -y
npm install express typescript @types/express @types/node
npm install dotenv cors helmet express-rate-limit
npm install axios axios-retry zod
npm install --save-dev ts-node nodemon @types/cors

# Create TypeScript configuration
npx tsc --init

# Create directory structure
mkdir -p src/{routes,controllers,middleware,services,types,utils}
mkdir -p tests/{unit,integration}
```

### Recommended package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  }
}
```

## API Architecture Patterns

### REST Endpoints Structure

```typescript
// src/routes/plugins.ts
/**
 * Plugin Marketplace API Routes
 * Base: /api/v1/plugins
 */
router.post('/submit', pluginController.submitPlugin);      // Plugin submission
router.get('/:id', pluginController.getPlugin);             // Get plugin details
router.get('/', pluginController.listPlugins);              // List/search plugins
router.post('/:id/install', pluginController.installPlugin); // Install plugin
router.post('/:id/publish', pluginController.publishPlugin); // Publish approved plugin
router.get('/:id/metrics', pluginController.getMetrics);    // Plugin usage metrics

// Government compliance endpoints
router.post('/:id/compliance/validate', complianceController.validateCompliance);
router.get('/:id/audit-log', auditController.getAuditLog);
```

### Integration with .NET Backend

```typescript
// src/services/backendIntegration.ts
import axios from 'axios';

/**
 * Integration with TerraFusion.AI MarketplaceService
 * Backend endpoint: http://localhost:5000
 */
export class BackendMarketplaceClient {
  private baseUrl = process.env.BACKEND_API_URL || 'http://localhost:5000';

  async submitPluginToBackend(submissionData: PluginSubmissionDto) {
    // POST to /api/marketplace/submit
    // Backend performs: signature verification, manifest validation, WASM sandbox execution
    return await axios.post(`${this.baseUrl}/api/marketplace/submit`, submissionData);
  }

  async publishPlugin(publishData: PluginPublishDto) {
    // POST to /api/marketplace/publish
    // Backend performs: re-verification, approval workflow, storage coordination
    return await axios.post(`${this.baseUrl}/api/marketplace/publish`, publishData);
  }

  async getPluginStatus(pluginId: string) {
    return await axios.get(`${this.baseUrl}/api/marketplace/plugins/${pluginId}`);
  }
}
```

### Plugin Submission Workflow

```typescript
// src/controllers/pluginController.ts
export class PluginController {
  async submitPlugin(req: Request, res: Response) {
    /**
     * WORKFLOW:
     * 1. Validate incoming request (Zod schema validation)
     * 2. Extract plugin package, manifest, signature
     * 3. Call backend MarketplaceService for:
     *    - Consensus signature verification (CrossPlatformVerifier)
     *    - Manifest validation (Node.js script execution)
     *    - WASM sandbox execution (IPluginSandboxService)
     * 4. Store metadata in database (via backend)
     * 5. Return submission status to developer
     */

    const submissionDto = {
      name: req.body.name,
      version: req.body.version,
      description: req.body.description,
      category: req.body.category,
      authorId: req.user.id,  // From JWT authentication
      packageData: req.body.packageB64,  // Base64-encoded WASM module
      manifestJson: req.body.manifest,
      signature: req.body.signature,     // Hex-encoded signature
      publicKeyPem: req.body.publicKey
    };

    // Delegate to backend for security-critical operations
    const result = await this.backendClient.submitPluginToBackend(submissionDto);

    // Log to audit trail (FISMA compliance)
    await this.auditService.logPluginSubmission(submissionDto, result);

    res.json(result);
  }
}
```

## Government Compliance Requirements

### FISMA-HIGH Compliance

```typescript
// src/middleware/compliance.ts
/**
 * CRITICAL: All API operations must maintain FISMA-HIGH compliance
 */
export const complianceMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // 1. JWT Authentication (required)
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // 2. Audit logging (all operations logged)
  await auditLogger.log({
    timestamp: new Date(),
    userId: req.user.id,
    action: req.method,
    resource: req.path,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // 3. Rate limiting (prevent abuse)
  // Applied via express-rate-limit middleware

  next();
};
```

### Security Headers

```typescript
// src/middleware/security.ts
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});
```

## Plugin Marketplace Features

### Featured Plugins Integration

The API should expose endpoints for featured plugins defined in `../plugin-marketplace.json`:

```typescript
// src/services/featuredPlugins.ts
/**
 * Featured plugins from plugin-marketplace.json:
 * - CostForge AI Pro ($199/month)
 * - AI Agent Training System ($499/month)
 * - TerraFlow Pro ($129/month)
 * - TerraLevy Advanced ($149/month)
 * - AI Swarm Orchestrator Pro ($299/month)
 * - Consciousness Service Gateway ($199/month)
 * - Quantum Analytics Engine ($249/month)
 * - AI Companion Workspace Pro ($179/month)
 * - Marketplace Intelligence Hub ($349/month)
 * - TerraForge AI Empire Builder ($499/month)
 */
export class FeaturedPluginsService {
  async getFeaturedPlugins() {
    // Load from plugin-marketplace.json
    // Return with revenue_model: "subscription_plus_commission"
  }
}
```

### Revenue Tracking

```typescript
// src/services/revenueTracking.ts
/**
 * Commission tracking for marketplace revenue model:
 * - Monthly/annual subscriptions
 * - Commission rates: 25-45% depending on plugin tier
 * - Target: $852,000 annual plugin revenue
 */
export class RevenueTrackingService {
  async trackPluginRevenue(pluginId: string, subscriptionType: 'monthly' | 'annual') {
    // Calculate TerraFusion commission
    // Store in database via backend
    // Generate revenue reports
  }
}
```

## Testing Requirements

### Integration with Backend Tests

```typescript
// tests/integration/backendIntegration.test.ts
/**
 * IMPORTANT: This API must align with backend tests
 * Reference: backend/TerraFusion.API.Tests/
 * Test pass rate target: 91.9%
 */
describe('Backend Integration', () => {
  test('should submit plugin to backend MarketplaceService', async () => {
    const submission = createMockSubmission();
    const response = await request(app)
      .post('/api/v1/plugins/submit')
      .send(submission)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('pending review');
  });

  test('should validate signature with consensus', async () => {
    // Backend performs CrossPlatformVerifier.VerifyWithConsensusAsync
    // API should receive and forward properly
  });
});
```

## Environment Configuration

```bash
# .env.development
NODE_ENV=development
PORT=3001
BACKEND_API_URL=http://localhost:5000
DATABASE_URL=postgresql://user:pass@localhost:5432/terrafusion
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Plugin storage
PLUGIN_STORAGE_PATH=/var/terrafusion/plugins
PLUGIN_CDN_URL=https://cdn.terrafusion.ai/plugins
```

## Key Technologies to Use

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Zod** - Schema validation
- **Axios** - HTTP client for backend integration
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **jsonwebtoken** - JWT authentication
- **winston** or **pino** - Structured logging for FISMA compliance

## Critical Development Rules

### 1. Backend Delegation
**ALWAYS delegate security-critical operations to the .NET backend**:
- Signature verification → `MarketplaceService.ProcessPluginSubmissionAsync`
- WASM sandbox execution → `IPluginSandboxService`
- Plugin approval workflow → `MarketplaceService.PublishPluginAsync`

### 2. Audit Logging
**REQUIRED**: Log all operations for FISMA compliance:
```typescript
await auditLogger.log({
  timestamp: new Date(),
  userId: req.user.id,
  action: 'PLUGIN_SUBMIT',
  resourceId: pluginId,
  result: 'SUCCESS',
  metadata: { version: plugin.version }
});
```

### 3. County Sovereignty
If plugins are county-specific, respect county data isolation (Sovereign County model).

### 4. Performance SLAs
- API response time: <100ms (p95)
- Backend integration: <200ms (p95)
- Database queries: <50ms (p95)

## Common Development Tasks

### Adding a New Plugin Endpoint

1. Create route in `src/routes/plugins.ts`
2. Implement controller in `src/controllers/pluginController.ts`
3. Add service logic in `src/services/pluginService.ts`
4. If backend integration needed, update `src/services/backendIntegration.ts`
5. Add tests in `tests/integration/`
6. Update API documentation

### Integrating a New Plugin Category

1. Update Zod schema to include new category
2. Add category-specific validation rules
3. Update featured plugins service if applicable
4. Coordinate with backend for database schema updates

### Adding Government Compliance Checks

1. Create compliance validator in `src/middleware/compliance.ts`
2. Integrate with backend compliance services
3. Add audit logging
4. Document compliance requirements in API docs

## Troubleshooting

### Backend Connection Issues
```bash
# Verify backend is running
curl http://localhost:5000/health

# Check backend marketplace endpoint
curl http://localhost:5000/api/marketplace/health
```

### Plugin Submission Failures
Check backend logs at `backend/TerraFusion.AI/` for:
- Signature verification failures
- Manifest validation errors
- WASM sandbox execution issues

### Database Connection Issues
```bash
# Test database connectivity
psql -h localhost -U terrafusion -d terrafusion_db

# Or use backend database validation
python ../../test-database-connections.py
```

## Related Documentation

- **Main System**: `../../CLAUDE.md` - TerraFusion OS architecture
- **Backend Service**: `../../backend/CLAUDE.md` - .NET backend development
- **Marketplace Frontend**: `../marketplace-frontend/` - React marketplace UI
- **Plugin Development**: `../plugins/` - Plugin module patterns
- **Government Compliance**: `../../.github/copilot-instructions.md` - FISMA requirements

## Port Allocation

- **This API**: 3001 (configurable via PORT env var)
- **Backend API**: 5000 (TerraFusion.API)
- **Frontend**: 3000 (marketplace-frontend)
- **Gateway**: 3002 (TerraFusion.Gateway)
- **Consciousness**: 3004 (AI swarm)

## Deployment Considerations

### Docker Deployment
```dockerfile
# Future Dockerfile structure
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### Health Checks
```typescript
// src/routes/health.ts
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'marketplace-api',
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    backendConnected: await checkBackendConnection()
  });
});
```

---

**Last Updated**: October 2025
**Module**: Marketplace API
**Classification**: TerraFusion Marketplace Component
**Compliance**: FISMA-HIGH, NIST 800-53
