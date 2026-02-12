# CostForge AI Development Guide

## Project Overview

**CostForge AI** is a government property cost analysis platform for Benton
County built with React + Express + PostgreSQL, designed for professional
property assessors requiring high-accuracy building cost calculations (target:
99.7%+ accuracy).

### Elite User Personas

**Primary Power Users**:

1. **County Appraisers** (PhD-level analysts)
   - Mass appraisal workflows (1,000+ properties)
   - Batch processing of like properties
   - GIS-integrated location analysis
   - Statistical validation across neighborhoods
   - Comparative market analysis at scale

2. **Levy Clerks** (Government compliance officers)
   - Multi-jurisdiction tax calculations
   - Budget forecasting and projections
   - Audit trail verification
   - Regulatory reporting automation

3. **Department of Revenue** (State oversight)
   - County-wide assessment validation
   - Equalization ratio analysis
   - Appeal trend analysis
   - Statewide compliance monitoring

**User Experience Philosophy**: Immersive analytics environment for
professionals with Harvard Physics + MIT Statistics backgrounds who demand:

- **SEE**: Real-time data visualization with 3D property modeling
- **ANALYZE**: Advanced statistical tools (Bayesian inference, Monte Carlo,
  regression analysis)
- **BUILD**: Custom AI workflows and model fine-tuning interfaces
- **TOOLS**: Comprehensive analytical arsenal for property intelligence
- **SYNC**: Multi-device data synchronization and collaboration

## Critical Architecture Patterns

### 1. Dual-Port Development (NEVER Change This)

**DEV MODE**: Client (5002) + Server (5000) run concurrently via `npm run dev`
**PRODUCTION**: Single port 5000 serves everything

```bash
npm run dev          # Starts both: concurrently "npm run dev:server" "npm run dev:client"
npm run dev:client   # Vite dev server on port 5002
npm run dev:server   # Express API on port 5000 (tsx server/index.ts)
npm run build        # Vite build + esbuild server bundle
npm run start        # Production: node dist/index.js (serves client from dist/public)
```

**Why**: Vite dev server needs separate port for HMR. Production bundles
everything to dist/.

### 2. Monolithic Server Pattern

**ALL API routes go in `server/index.ts`** - no separate route files. This is
intentional for government simplicity.

```typescript
// server/index.ts - Add endpoints here directly
app.post('/api/your-endpoint', async (req, res) => {
  try {
    const result = await yourLogic(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 3. Database-First Development with Drizzle

**ALWAYS** modify schema first, then push:

```bash
# 1. Edit shared/schema.ts
# 2. Push changes (NO migrations - this project uses push workflow)
npm run db:push      # Applies schema changes directly to PostgreSQL
```

```typescript
// shared/schema.ts - Single source of truth
export const properties = pgTable('properties', {
  propertyId: uuid('property_id').defaultRandom().notNull().unique(),
  parcelId: text('parcel_id').notNull().unique(),
  // Always: camelCase in TypeScript, snake_case in DB
  aiConfidenceScore: real('ai_confidence_score'),
});
```

Import types from schema:
`import { properties, type Property } from '@shared/schema';`

### 4. Path Aliases (Critical for Imports)

```typescript
// tsconfig.json + vite.config.ts define these:
import { Button } from '@/components/ui/button'; // client/src/
import { properties } from '@shared/schema'; // shared/
import bentonData from '@assets/benton_cost_matrix.json'; // attached_assets/
```

### 5. Component Organization (25+ Domain Folders)

```
client/src/components/
├── ai/                      # AI-powered components (swarm, MCP agents)
├── cost-analysis/           # Cost calculators (BCBSCostCalculator, etc.)
├── dashboard/               # Dashboard widgets
├── data-connectors/         # FTP, import/export
├── quantum/                 # Quantum-themed UI components
├── swarm/                   # AI swarm intelligence (SwarmDashboard, SwarmAgentStatus)
├── ui/                      # shadcn/ui base components
└── visualizations/          # Data viz components
```

**Entry point**: `CostForgeAIApp.tsx` (not App.tsx - that's the wrapper)

### 6. Multi-Provider Context System

```tsx
// App.tsx - Provider hierarchy (order matters!)
<QueryClientProvider client={queryClient}>
  <ThemeProvider>
    <EnhancedSupabaseProvider>
      <WindowProvider>
        <AuthProvider>
          <DataFlowProvider>
            <SidebarProvider>{/* Application Routes */}</SidebarProvider>
          </DataFlowProvider>
        </AuthProvider>
      </WindowProvider>
    </EnhancedSupabaseProvider>
  </ThemeProvider>
</QueryClientProvider>
```

**DataFlowContext** tracks all CRUD operations with snapshots for audit trails:

```typescript
interface DataSnapshot {
  id: string;
  timestamp: number;
  data: Record<string, any>;
  source: string;
  operation:
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'calculate'
    | 'import'
    | 'export';
}
```

### 7. TanStack Query Patterns

```typescript
// Standard query pattern (5-minute cache, no window refetch)
const { data, isLoading } = useQuery({
  queryKey: ['properties', propertyId],
  queryFn: () => fetch(`/api/properties/${propertyId}`).then(r => r.json()),
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false,
  retry: 1,
});
```

### 8. Benton County Government Compliance

**All calculations must include**:

- Confidence metrics (target: >99.7%)
- Marshall Swift to CFT format conversion
- Multi-region support: East Benton, Richland, Kennewick
- Quality factors: Standard, Premium, Luxury

```typescript
// API response pattern with government compliance
res.json({
  success: true,
  data: result,
  terrafusion: {
    agent_id: 'COSTFORGE_AI_001',
    calculation_method: 'Neural quantum matrix analysis',
    confidence: 'Championship level', // >99.7%
  },
});
```

## Key Commands & Workflows

```bash
# Development
npm run dev          # Start dual-port dev environment
npm run check        # TypeScript type checking (strict mode)
npm run db:push      # Push schema changes to PostgreSQL

# Testing (multiple test runners for compatibility)
node run-core-tests.js       # Core functionality tests
node test-core.js            # TypeScript-compatible tests
node run-cost-tests.js       # Cost calculation tests
node run-ui-tests.js         # Frontend component tests

# Production
npm run build        # Vite build client + esbuild bundle server
npm run start        # Start production server (port 5000)
```

## Common Pitfalls & Solutions

### Port Issues

```powershell
# If ports stuck in use (PowerShell)
Get-Process -Name node | Stop-Process
```

### Database Connection

- Verify `DATABASE_URL` in `.env` (PostgreSQL format)
- System falls back to Supabase if PostgreSQL unavailable
- Always use Drizzle ORM - never raw SQL

### Import Errors

- Use path aliases (`@/`, `@shared/`) not relative paths
- Check `tsconfig.json` and `vite.config.ts` if imports fail
- Client code can't import from `server/` - use `shared/` for common types

### Build Errors

- Run `npm run check` for TypeScript issues before building
- Client build: `dist/public/`, Server build: `dist/index.js`
- Production serves from single port 5000 (dist/public static files)

## Data Import Pipeline (Government-Scale)

```python
# Python-based Benton County data extraction
python import_pipeline.py "attached_assets/Cost Matrix 2025.xlsx"
# → Parses Excel → Generates JSON → Imports to PostgreSQL
```

Chunked processing for large datasets (10K+ records):

```typescript
const CHUNK_SIZE = 50; // Optimized for PostgreSQL performance
const chunks = chunkArray(importData, CHUNK_SIZE);
for (const chunk of chunks) {
  await processBatch(chunk);
  await sleep(100); // Prevent database overload
}
```

## UI/UX Patterns

### Quantum Theme Colors

```css
/* Elite color palette */
--quantum-cyan: #00ffee --quantum-blue: #0099ff --quantum-green: #00ffaa
  /* Glassmorphism effects */ className=
  'quantum-header bg-gradient-to-r from-[#0b1020] via-[#1a2332] to-[#0b1020]';
```

### Routing (Wouter, not React Router)

```tsx
import { Route, Switch } from 'wouter';

<Switch>
  <Route path="/" component={DashboardPage} />
  <Route path="/calculator" component={EnhancedCalculatorPage} />
  <Route path="/legacy/*" component={LegacyRoutes} />
  <Route component={NotFound} />
</Switch>;
```

## Code Style Requirements

### File Headers (Government Standard)

```typescript
/**
 * [ComponentName] - [Purpose]
 * [Technical Description]
 *
 * TerraFusion OS - Government. Transcended.
 */
```

### Error Handling Pattern

```typescript
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation error:', error);
  return {
    success: false,
    error: 'Autonomous recovery initiated - System self-healing',
    recovery: 'QUANTUM_PROTOCOL_ACTIVE',
  };
}
```

### Naming Conventions

- Components: `QuantumAnalyticalDashboard.tsx` (PascalCase, descriptive)
- Contexts: `DataFlowContext.tsx` (purpose + Context suffix)
- Utils: `visualization-utils.ts` (kebab-case)
- Tests: `run-core-tests.js` (action + tests suffix)

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:port/dbname
NODE_ENV=development|production

# Optional (Supabase fallback)
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key

# Benton County Integration
BENTON_COUNTY_API_KEY=your-key
MARSHALL_SWIFT_TOKEN=your-token

# FTP Data Feeds
FTP_HOST=ftp.bentoncounty.gov
FTP_USERNAME=user
FTP_PASSWORD=pass
```

## Performance Standards

- API response: <100ms (government infrastructure requirement)
- UI interactions: <50ms (quantum-responsive)
- Database queries: <100ms
- Cost calculations: 99.7%+ accuracy with uncertainty quantification
- Memory usage: <512MB for efficient server deployment

## Testing Strategy

**Dual approach** for CommonJS + ES Module compatibility:

- `run-core-tests.js` - Core functionality
- `test-core.js` - Modern TypeScript support
- Domain-specific: `run-cost-tests.js`, `run-ui-tests.js`

Mock system with database operation fallbacks for offline testing.

## Quick Reference

### Adding API Endpoint

1. Add to `server/index.ts` (monolithic pattern)
2. Include confidence metrics in response
3. Follow government compliance standards

### Adding Database Table

1. Edit `shared/schema.ts`
2. Run `npm run db:push`
3. Import types: `import { newTable } from '@shared/schema';`

### Adding React Component

1. Place in appropriate domain folder (`client/src/components/`)
2. Use path alias:
   `import { YourComponent } from '@/components/domain/YourComponent';`
3. Wrap in error boundary if stateful
4. Follow quantum theme styling (#00ffee, #0099ff, #00ffaa)

### Debugging Workflow

```bash
npm run check              # TypeScript verification
npm run dev                # Start dual-port dev mode
# Check terminal output for both client (5002) and server (5000)
node run-core-tests.js     # Run test suite
```

---

## Advanced Patterns & Integration

### MCP Agent System (AI Swarm Intelligence)

**Not yet implemented** - Architecture planned for distributed AI coordination:

```typescript
// Planned: server/mcp/ - AI agent framework
// - orchestrator.ts: Multi-agent task routing
// - eventBus.ts: Inter-agent communication
// - agents/: Specialized agents (cost estimation, compliance, data quality)
```

**Current State**: Basic endpoints in `server/index.ts`. When implementing MCP:

- Create `server/mcp/` directory structure
- Extend base agent class pattern
- Implement event-driven coordination
- Add swarm status monitoring endpoints

### Data Pipeline Architecture

**Python-based Import System**:

```bash
# Located in root directory
python import_pipeline.py "attached_assets/Cost Matrix 2025.xlsx"
benton_cost_matrix_parser.py    # Excel extraction
import_to_database.js            # PostgreSQL integration
```

**FTP Data Connectors** (in `client/src/components/data-connectors/`):

- `FTPManagement.tsx` - Server configuration
- `FTPSyncScheduler.tsx` - Automated sync
- `DataConnectionTester.tsx` - Connection validation

### Context System Deep Dive

**DataFlowContext** (`client/src/contexts/DataFlowContext.tsx`):

- Tracks ALL CRUD operations with snapshots
- Creates audit trail for government compliance
- Session-based activity logging
- Use `useDataFlow()` hook to record operations

**Provider Order Matters**:

1. `QueryClientProvider` - Must wrap all data-fetching components
2. `ThemeProvider` - UI theme system
3. `EnhancedSupabaseProvider` - Database connection fallback
4. `WindowProvider` - Window state management
5. `AuthProvider` - Authentication (depends on Supabase)
6. `DataFlowProvider` - Operation tracking (depends on Auth)
7. `SidebarProvider` - UI state (innermost)

### Build System Details

**Vite Configuration** (`vite.config.ts`):

- Root: `client/` directory
- Aliases resolve from workspace root
- Build output: `dist/public/` (served in production)
- Dev server: Port 5002 with HMR

**Server Bundle** (`server/index.ts`):

- Built with esbuild (fast compilation)
- ESM format output to `dist/index.js`
- Serves static files from `dist/public/` in production
- Environment: `NODE_ENV=production`

### Testing Infrastructure Details

**Multiple Test Runners** (compatibility strategy):

```bash
run-core-tests.js    # CommonJS entry point
test-core.js         # ES Module compatible
run-cost-tests.js    # Cost calculation suite
run-ui-tests.js      # Component testing
```

**Why Multiple Runners**: Node.js module system compatibility across different
environments. Always run `run-core-tests.js` first as primary test suite.

### Database Schema Patterns

**Naming Convention** (strict):

- TypeScript: `camelCase` (e.g., `aiConfidenceScore`)
- PostgreSQL: `snake_case` (e.g., `ai_confidence_score`)
- Drizzle ORM handles conversion automatically

**Key Tables** (in `shared/schema.ts`):

- `properties` - Property records with AI confidence tracking
- `users` - Authentication and role management
- `sessions` - Secure session storage
- `costFactors` - Benton County cost calculation matrices

**Critical**: Use `$type<YourType>()` for JSON columns to maintain type safety.

### Government Compliance Implementation

**Benton County BCBS Headers**:

```typescript
// Add to ALL calculation responses
res.setHeader('X-Benton-County-BCBS', 'v2025');
res.setHeader('X-Calculation-Confidence', calculationMetrics.confidence);
```

**Audit Trail Requirements**:

- Every calculation must log to DataFlowContext
- Include timestamp, user, input parameters, results
- Store confidence metrics and uncertainty quantification
- Maintain 7-year retention for government compliance

**Marshall Swift Conversion**:

- Input: Marshall Swift cost standards
- Output: CFT (Cost Factor Table) format
- Validation: Cross-reference with Benton County matrices
- Regions: East Benton, Richland, Kennewick (different multipliers)

### Performance Optimization

**TanStack Query Caching Strategy**:

- `staleTime: 5 * 60 * 1000` (5 minutes) - default for property data
- `refetchOnWindowFocus: false` - prevents excessive refetching
- `retry: 1` - single retry for failed requests
- Use `queryClient.invalidateQueries()` after mutations

**Component Optimization**:

- Wrap expensive calculations in `useMemo`
- Use `React.memo` for pure components
- Lazy load routes with `React.lazy()`
- Error boundaries around major component trees

### Security & Authentication

**Auth System** (`client/src/contexts/auth-context.tsx`):

- Dual mode: County network SSO + local credentials
- Session management via PostgreSQL
- Role-based access control (analyst, researcher, admin)
- Clearance levels: standard, classified, quantum

**Environment Security**:

```bash
# NEVER commit these to git
DATABASE_URL=postgresql://...
SUPABASE_KEY=...
SESSION_SECRET=...  # Use crypto.randomBytes(32).toString('hex')
```

### Deployment Architecture

**Production Build Process**:

1. `npm run build` - Compiles client + server
2. Client → `dist/public/` (static assets with hashing)
3. Server → `dist/index.js` (ESM bundle)
4. Single Node.js process serves everything on port 5000

**Static File Serving** (production only):

```typescript
// server/index.ts production mode
app.use(express.static(join(__dirname, '..', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
});
```

### Troubleshooting Guide

**"Module not found" errors**:

1. Check path alias in `tsconfig.json` and `vite.config.ts` match
2. Verify import starts with `@/` or `@shared/`
3. Restart TypeScript server: Cmd+Shift+P → "Restart TS Server"

**Database connection failures**:

1. Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/dbname`
2. Check PostgreSQL is running: `Get-Service postgresql*` (Windows)
3. System falls back to Supabase (check `SUPABASE_URL` set)
4. Run `npm run db:push` to sync schema

**Port conflicts**:

```powershell
# Find what's using ports
Get-NetTCPConnection -LocalPort 5000,5002 | Select-Object State,OwningProcess
# Kill process by PID
Stop-Process -Id <PID> -Force
```

**Build failures**:

1. Clear cache: `rm -rf node_modules/.vite dist`
2. Reinstall: `npm install`
3. Type check: `npm run check`
4. Rebuild: `npm run build`

### File Structure Reference

```
costforge-ai-workspace/
├── .github/
│   └── copilot-instructions.md    # This file
├── attached_assets/                # Benton County data files
│   └── benton_cost_matrix.json
├── client/
│   ├── src/
│   │   ├── components/             # 25+ domain folders
│   │   ├── contexts/               # React context providers
│   │   ├── lib/                    # Utilities, hooks, types
│   │   ├── pages/                  # Route components
│   │   └── App.tsx                 # Provider wrapper
│   └── index.html
├── server/
│   └── index.ts                    # Monolithic API (ALL routes here)
├── shared/
│   └── schema.ts                   # Drizzle ORM schema (single source)
├── migrations/                     # Auto-generated (don't edit)
├── drizzle.config.ts               # Database configuration
├── tsconfig.json                   # TypeScript + path aliases
├── vite.config.ts                  # Build configuration
└── package.json                    # Scripts + dependencies
```

### Key Dependencies

**Core Stack**:

- `react@18` + `react-dom` - UI framework
- `express@4` - Server framework
- `drizzle-orm` + `pg` - Database ORM + PostgreSQL client
- `@tanstack/react-query@5` - Server state management
- `wouter@3` - Client-side routing
- `zod@3` - Schema validation

**UI Components**:

- `@radix-ui/*` - Unstyled accessible components
- `tailwindcss@3` - Utility-first CSS
- `lucide-react` - Icon system
- `recharts@2` - Data visualization

**Development**:

- `vite@5` - Build tool + dev server
- `tsx` - TypeScript execution
- `esbuild` - Server bundling
- `concurrently` - Run multiple commands

## Elite Development Workflows

### Feature Development Sequence

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Verify environment
npm run check                    # TypeScript verification
node run-core-tests.js          # Test suite baseline

# 3. Make changes following patterns above

# 4. Test changes
npm run dev                      # Verify in dual-port mode
node run-core-tests.js          # Run full test suite

# 5. Production verification
npm run build                    # Ensure build succeeds
npm run start                    # Test production bundle locally

# 6. Commit with government standards
git add .
git commit -m "feat: [Feature] - Government-grade implementation"
```

### API Endpoint Development Pattern

```typescript
// server/index.ts - Follow this exact pattern for new endpoints

// 1. Input validation with Zod
import { z } from 'zod';

const inputSchema = z.object({
  propertyId: z.string().uuid(),
  analysisType: z.enum(['standard', 'advanced', 'quantum']),
});

// 2. Endpoint implementation
app.post('/api/analysis/calculate', async (req, res) => {
  try {
    // Validate input
    const input = inputSchema.parse(req.body);

    // Execute business logic
    const result = await performAnalysis(input);

    // Government-grade response
    res.setHeader('X-Benton-County-BCBS', 'v2025');
    res.json({
      success: true,
      data: result,
      terrafusion: {
        agent_id: 'COSTFORGE_ANALYSIS_001',
        confidence: calculateConfidence(result),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: error.errors,
      });
    }
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Autonomous recovery initiated',
      recovery: 'QUANTUM_PROTOCOL_ACTIVE',
    });
  }
});
```

### Component Development Pattern

```tsx
// client/src/components/domain/YourComponent.tsx

/**
 * YourComponent - [Purpose]
 * [Technical description of functionality]
 *
 * TerraFusion OS - Government. Transcended.
 */

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { useDataFlow } from '@/contexts/DataFlowContext';

interface YourComponentProps {
  propertyId: string;
  onComplete?: (result: AnalysisResult) => void;
}

export default function YourComponent({
  propertyId,
  onComplete,
}: YourComponentProps) {
  const { recordOperation } = useDataFlow();

  // Standard query pattern
  const { data, isLoading, error } = useQuery({
    queryKey: ['analysis', propertyId],
    queryFn: async () => {
      const response = await fetch(`/api/analysis/${propertyId}`);
      if (!response.ok) throw new Error('Analysis failed');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Record operation for audit trail
  useEffect(() => {
    if (data) {
      recordOperation({
        operation: 'read',
        source: 'YourComponent',
        data: { propertyId, result: data },
      });
    }
  }, [data, propertyId, recordOperation]);

  if (isLoading) return <div>Loading government-grade analysis...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Card className="quantum-header bg-gradient-to-r from-[#0b1020] via-[#1a2332] to-[#0b1020]">
      {/* Component implementation */}
    </Card>
  );
}
```

### Database Schema Evolution

```typescript
// shared/schema.ts - Adding new table

export const yourNewTable = pgTable('your_new_table', {
  id: serial('id').primaryKey(),
  // Use uuid for external-facing IDs
  publicId: uuid('public_id').defaultRandom().notNull().unique(),

  // Always: camelCase in TypeScript, snake_case in DB
  propertyId: uuid('property_id').references(() => properties.propertyId),
  analysisType: text('analysis_type').notNull(),

  // JSON columns with type safety
  results: json('results').$type<{
    confidence: number;
    factors: Record<string, number>;
  }>(),

  // Audit fields (always include)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: text('created_by').references(() => users.id),
});

// After schema changes:
// 1. Run: npm run db:push
// 2. Verify in PostgreSQL
// 3. Test with real data
```

## Government-Grade Best Practices

### Error Handling Standards

**Never expose internal details to clients**:

```typescript
// ❌ BAD - Exposes stack traces
catch (error) {
  res.status(500).json({ error: error.stack });
}

// ✅ GOOD - Logs internally, returns safe message
catch (error) {
  console.error('Internal error:', error);
  res.status(500).json({
    success: false,
    error: 'Autonomous recovery initiated - System self-healing',
    recovery: 'QUANTUM_PROTOCOL_ACTIVE',
  });
}
```

### Type Safety Requirements

**Always validate external data**:

```typescript
// ✅ Use Zod for runtime validation
const propertySchema = z.object({
  parcelId: z.string().regex(/^\d{10}$/),
  address: z.string().min(5),
  assessedValue: z.number().positive(),
});

// ✅ Use TypeScript for compile-time safety
import { properties, type Property } from '@shared/schema';
type NewProperty = typeof properties.$inferInsert;
```

### Performance Guidelines

**Optimize database queries**:

```typescript
// ❌ BAD - N+1 query problem
for (const property of properties) {
  const owner = await db
    .select()
    .from(owners)
    .where(eq(owners.id, property.ownerId));
}

// ✅ GOOD - Single query with join
const propertiesWithOwners = await db
  .select()
  .from(properties)
  .leftJoin(owners, eq(properties.ownerId, owners.id));
```

**Component performance**:

```typescript
// ✅ Memoize expensive calculations
const expensiveResult = useMemo(() => calculateComplexMetrics(data), [data]);

// ✅ Memoize components
const MemoizedComponent = React.memo(YourComponent);

// ✅ Lazy load routes
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
```

### Security Checklist

- [ ] All environment variables use proper prefixes (`DATABASE_URL`, not
      `DB_URL`)
- [ ] Session secrets are cryptographically random (32+ bytes)
- [ ] User inputs are validated with Zod schemas
- [ ] SQL queries use parameterized queries (Drizzle handles this)
- [ ] Authentication checks on all protected routes
- [ ] Audit logs for all government data operations
- [ ] HTTPS enforced in production
- [ ] CORS configured for known origins only

## Quick Command Reference

```bash
# Development
npm run dev              # Start dual-port dev (client 5002, server 5000)
npm run dev:client       # Client only (Vite dev server)
npm run dev:server       # Server only (tsx watch mode)

# Database
npm run db:push          # Push schema changes to PostgreSQL
npm run check            # TypeScript type checking

# Testing
node run-core-tests.js   # Primary test suite (CommonJS)
node test-core.js        # Modern TypeScript tests
node run-cost-tests.js   # Cost calculation tests
node run-ui-tests.js     # Component tests

# Production
npm run build            # Build both client and server
npm run build:client     # Build client only
npm run build:server     # Build server only
npm run start            # Start production server (port 5000)

# Troubleshooting
Get-Process -Name node | Stop-Process    # Kill stuck Node processes
npm run check                             # Verify TypeScript
rm -rf node_modules/.vite dist            # Clean build artifacts
```

## AI Agent Behavioral Standards

### Code Generation Requirements

1. **Always use existing patterns**: Reference components/endpoints in this
   codebase
2. **Type safety first**: Use Zod for runtime, TypeScript for compile-time
3. **Government compliance**: Include confidence metrics, audit trails, BCBS
   headers
4. **Error handling**: Use autonomous recovery pattern
5. **Testing**: Write tests when adding complex logic
6. **Documentation**: Add JSDoc comments for complex functions

### Prohibited Actions

- ❌ **Never** create separate route files (monolithic server pattern)
- ❌ **Never** use migration files (push-based workflow)
- ❌ **Never** bypass Drizzle ORM for database operations
- ❌ **Never** use relative imports when path aliases exist
- ❌ **Never** expose sensitive data in error messages
- ❌ **Never** skip input validation on API endpoints

### Excellence Standards

- ✅ All calculations include confidence metrics (>99.7% target)
- ✅ All operations logged to DataFlowContext for audit
- ✅ All responses include terrafusion metadata block
- ✅ All imports use path aliases (`@/`, `@shared/`)
- ✅ All components wrapped in error boundaries
- ✅ All database queries optimized (no N+1 problems)

---

## Power User Workflows & Mass Appraisal

### Mass Appraisal Architecture (PhD-Level Analytics)

**Mass appraisal is the key capability** - professionals analyzing 1,000+
properties simultaneously with statistical validation across neighborhoods.

#### Batch Processing System

```typescript
// API pattern for batch operations
app.post('/api/batch/calculate', async (req, res) => {
  const { propertyIds, analysisType, neighborhood } = req.body;

  // Chunk processing for large datasets (10K+ properties)
  const CHUNK_SIZE = 50;
  const chunks = chunkArray(propertyIds, CHUNK_SIZE);
  const results = [];

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(id => performAnalysis(id, analysisType))
    );
    results.push(...chunkResults);
    await sleep(100); // Prevent PostgreSQL overload
  }

  // Statistical validation across batch
  const confidence = calculateBatchConfidence(results);
  const outliers = detectOutliers(results, neighborhood);

  res.json({
    success: true,
    batchSize: propertyIds.length,
    results,
    analytics: {
      meanValue: calculateMean(results),
      standardDeviation: calculateStdDev(results),
      confidenceInterval: confidence,
      outliers,
    },
    terrafusion: {
      agent_id: 'MASS_APPRAISAL_ENGINE',
      statistical_method: 'Bayesian neighborhood analysis',
      confidence: confidence > 99.7 ? 'Championship level' : 'Requires review',
    },
  });
});
```

#### Property Grouping Strategies

**Like-Property Analysis** - Group properties by characteristics for comparative
valuation:

```typescript
// Grouping algorithms for mass appraisal
interface PropertyGroup {
  groupId: string;
  criteria: {
    buildingType: string; // Residential, Commercial, Industrial
    qualityGrade: string; // Standard, Premium, Luxury
    yearBuilt: number[]; // Range: [1950, 1980]
    squareFeet: number[]; // Range: [1500, 2500]
    neighborhood: string;
  };
  properties: Property[];
  statisticalProfile: {
    medianValue: number;
    pricePerSqFt: number;
    confidence: number;
  };
}

// Use in components
const { data: propertyGroups } = useQuery({
  queryKey: ['property-groups', neighborhood, criteria],
  queryFn: () =>
    fetch('/api/groups/analyze', {
      method: 'POST',
      body: JSON.stringify({ neighborhood, criteria }),
    }).then(r => r.json()),
  staleTime: 10 * 60 * 1000, // 10 minutes for batch data
});
```

### GIS Integration Patterns

**Location is critical** - All appraisal workflows require geospatial context.

#### Spatial Analysis Architecture

```typescript
// GIS data integration
interface GISPropertyData {
  propertyId: string;
  coordinates: {
    latitude: number;
    longitude: number;
    projection: 'WGS84' | 'StatePlane_Washington_South';
  };
  parcel: {
    geometry: GeoJSON.Polygon;
    area: number; // Square feet
    frontage: number; // Linear feet
  };
  spatialFactors: {
    distanceToDowntown: number; // Miles
    proximityToAmenities: string[]; // ['school', 'park', 'shopping']
    floodZone: string; // FEMA designation
    zoning: string; // Benton County zoning code
  };
}

// API endpoint for spatial queries
app.post('/api/gis/proximity-analysis', async (req, res) => {
  const { centerPoint, radius, propertyType } = req.body;

  // PostGIS query via Drizzle
  const nearbyProperties = await db.select().from(properties).where(sql`
      ST_DWithin(
        geography(ST_MakePoint(longitude, latitude)),
        geography(ST_MakePoint(${centerPoint.lon}, ${centerPoint.lat})),
        ${radius * 1609.34} -- Convert miles to meters
      )
      AND building_type = ${propertyType}
    `);

  // Spatial statistics
  const spatialAnalysis = calculateSpatialAutocorrelation(nearbyProperties);

  res.json({
    success: true,
    properties: nearbyProperties,
    spatial: {
      moransI: spatialAnalysis.moransI, // Spatial clustering metric
      hotspots: spatialAnalysis.getisOrdGi, // Statistical hotspot analysis
    },
    terrafusion: {
      agent_id: 'GIS_SPATIAL_ENGINE',
      method: "Geospatial statistics with Moran's I",
    },
  });
});
```

#### Map-Based Property Selection

```tsx
// Components for GIS interaction
import { MapContainer, TileLayer, Polygon, Marker } from 'react-leaflet';

export function MassAppraisalMapSelector() {
  const [selectedParcels, setSelectedParcels] = useState<string[]>([]);
  const [drawingMode, setDrawingMode] = useState<
    'lasso' | 'polygon' | 'radius'
  >('lasso');

  const handleSelectionComplete = async (geometry: GeoJSON.Geometry) => {
    // Query properties within drawn boundary
    const response = await fetch('/api/gis/select-by-geometry', {
      method: 'POST',
      body: JSON.stringify({ geometry, analysisType: 'mass-appraisal' }),
    });

    const { properties } = await response.json();
    setSelectedParcels(properties.map(p => p.propertyId));

    // Record in DataFlowContext for audit trail
    recordOperation({
      operation: 'read',
      source: 'MassAppraisalMapSelector',
      data: { count: properties.length, geometry },
    });
  };

  return (
    <div className="h-screen quantum-header">
      <MapContainer center={[46.2804, -119.2752]} zoom={13}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="Benton County GIS"
        />
        <DrawControl mode={drawingMode} onComplete={handleSelectionComplete} />
        {/* Render property parcels with color-coded valuation */}
        {selectedParcels.map(parcel => (
          <Parcel key={parcel} data={parcel} />
        ))}
      </MapContainer>
    </div>
  );
}
```

### Immersive Analytics Environment

**SEE → ANALYZE → BUILD → TOOLS → SYNC** - The five pillars of elite user
experience.

#### 1. SEE: Real-Time Visualization

```tsx
// 3D Property Modeling Component
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Plane } from '@react-three/drei';

export function Property3DVisualization({
  propertyData,
}: {
  propertyData: Property;
}) {
  const buildingHeight = (propertyData.stories || 1) * 10; // 10 units per story
  const footprint = Math.sqrt(propertyData.squareFeet);

  return (
    <Card className="h-[600px] quantum-header">
      <Canvas camera={{ position: [50, 50, 50], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {/* Building structure */}
        <Box
          args={[footprint, buildingHeight, footprint]}
          position={[0, buildingHeight / 2, 0]}
        >
          <meshStandardMaterial
            color={getQualityColor(propertyData.qualityGrade)}
            metalness={0.6}
            roughness={0.3}
          />
        </Box>

        {/* Property lot */}
        <Plane
          args={[propertyData.lotSize, propertyData.lotSize]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial color="#1a4d2e" />
        </Plane>

        <OrbitControls enableZoom enableRotate />
      </Canvas>

      {/* Real-time data overlay */}
      <div className="absolute top-4 right-4 bg-black/70 p-4 rounded-lg">
        <h3 className="text-[#00ffee] font-bold">Live Analysis</h3>
        <div className="text-white space-y-2">
          <div>
            Assessed Value: ${propertyData.assessedValue.toLocaleString()}
          </div>
          <div>Confidence: {propertyData.aiConfidenceScore}%</div>
          <div className="text-[#00ffaa]">Status: ✓ Validated</div>
        </div>
      </div>
    </Card>
  );
}
```

#### 2. ANALYZE: Advanced Statistical Tools

```tsx
// Statistical Analysis Dashboard for PhD-level users
export function QuantumStatisticalWorkbench({
  dataset,
}: {
  dataset: Property[];
}) {
  const [analysisType, setAnalysisType] = useState<
    'bayesian' | 'monteCarlo' | 'regression' | 'spatialAutocorrelation'
  >('bayesian');

  const { data: analysisResults } = useQuery({
    queryKey: [
      'statistical-analysis',
      dataset.map(d => d.propertyId),
      analysisType,
    ],
    queryFn: async () => {
      const response = await fetch('/api/analytics/advanced', {
        method: 'POST',
        body: JSON.stringify({
          propertyIds: dataset.map(d => d.propertyId),
          method: analysisType,
        }),
      });
      return response.json();
    },
  });

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Analysis Type Selector */}
      <Card className="col-span-2">
        <Tabs value={analysisType} onValueChange={setAnalysisType}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="bayesian">Bayesian Inference</TabsTrigger>
            <TabsTrigger value="monteCarlo">Monte Carlo Simulation</TabsTrigger>
            <TabsTrigger value="regression">Regression Analysis</TabsTrigger>
            <TabsTrigger value="spatialAutocorrelation">
              Spatial Autocorrelation
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </Card>

      {/* Visualization Panel */}
      <Card className="p-6">
        <h3 className="text-[#00ffee] text-xl mb-4">Distribution Analysis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart data={analysisResults?.scatterData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
            <XAxis dataKey="predictedValue" stroke="#00ffee" />
            <YAxis dataKey="actualValue" stroke="#00ffee" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0b1020',
                border: '1px solid #00ffee',
              }}
            />
            <Scatter
              name="Properties"
              data={analysisResults?.scatterData}
              fill="#00ffaa"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>

      {/* Statistical Metrics */}
      <Card className="p-6">
        <h3 className="text-[#00ffee] text-xl mb-4">Model Performance</h3>
        <div className="space-y-4">
          <MetricRow
            label="R² (Coefficient of Determination)"
            value={analysisResults?.r2}
          />
          <MetricRow
            label="RMSE (Root Mean Square Error)"
            value={analysisResults?.rmse}
          />
          <MetricRow
            label="MAE (Mean Absolute Error)"
            value={analysisResults?.mae}
          />
          <MetricRow
            label="Confidence Interval (95%)"
            value={analysisResults?.ci95}
          />
        </div>
      </Card>

      {/* Bayesian Posterior Distribution */}
      {analysisType === 'bayesian' && (
        <Card className="col-span-2 p-6">
          <h3 className="text-[#00ffee] text-xl mb-4">
            Posterior Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={analysisResults?.posteriorDist || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
              <XAxis dataKey="value" stroke="#00ffee" />
              <YAxis stroke="#00ffee" />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="density"
                fill="#0099ff"
                stroke="#00ffee"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
```

#### 3. BUILD: Custom AI Workflows

```tsx
// Workflow Builder for Custom Analysis Pipelines
export function AIWorkflowBuilder() {
  const [workflow, setWorkflow] = useState<WorkflowNode[]>([]);

  const availableNodes: WorkflowNodeType[] = [
    { type: 'data-source', label: 'Property Selection', icon: Database },
    { type: 'filter', label: 'Filter Criteria', icon: Filter },
    { type: 'gis-analysis', label: 'Spatial Analysis', icon: MapPin },
    { type: 'cost-calculation', label: 'Cost Calculation', icon: Calculator },
    {
      type: 'statistical-validation',
      label: 'Statistical Validation',
      icon: BarChart3,
    },
    { type: 'export', label: 'Export Results', icon: Download },
  ];

  const handleExecuteWorkflow = async () => {
    const response = await fetch('/api/workflows/execute', {
      method: 'POST',
      body: JSON.stringify({ workflow }),
    });

    const results = await response.json();

    // Save workflow for reuse
    await fetch('/api/workflows/save', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Custom Mass Appraisal Pipeline',
        workflow,
        createdBy: user.id,
      }),
    });
  };

  return (
    <div className="flex h-screen">
      {/* Node Palette */}
      <div className="w-64 bg-[#0b1020] p-4 border-r border-[#1a2332]">
        <h3 className="text-[#00ffee] text-lg mb-4">Workflow Nodes</h3>
        <div className="space-y-2">
          {availableNodes.map(node => (
            <DraggableNode key={node.type} node={node} />
          ))}
        </div>
      </div>

      {/* Workflow Canvas */}
      <div className="flex-1 bg-gradient-to-br from-[#0b1020] via-[#1a2332] to-[#0b1020]">
        <ReactFlow
          nodes={workflow}
          onNodesChange={setWorkflow}
          className="quantum-flow"
        >
          <Background color="#00ffee" gap={16} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Execution Panel */}
      <div className="w-80 bg-[#0b1020] p-4 border-l border-[#1a2332]">
        <Button
          onClick={handleExecuteWorkflow}
          className="w-full bg-[#00ffee] text-black hover:bg-[#00ffaa]"
        >
          Execute Workflow
        </Button>
      </div>
    </div>
  );
}
```

#### 4. TOOLS: Comprehensive Analytical Arsenal

**Complete toolset for elite property intelligence**:

1. **Comparative Market Analysis (CMA) Engine**
   - Multi-regression hedonic pricing models
   - Time-series analysis for market trends
   - Automated comparable property selection with AI ranking

2. **Equalization Analysis Tools**
   - Coefficient of Dispersion (COD) calculation
   - Price-Related Differential (PRD) analysis
   - Sales ratio studies with IAAO compliance

3. **Appeal Management System**
   - Historical appeal trend analysis
   - Win/loss prediction models
   - Evidence package generation with comparable sales

4. **Budget Forecasting Models**
   - Levy calculation projections
   - Revenue impact analysis
   - Multi-year scenario planning

5. **Compliance Verification Dashboard**
   - USPAP adherence monitoring
   - IAAO Standard compliance checks
   - Audit trail generation for Department of Revenue

#### 5. SYNC: Multi-Device Collaboration

```typescript
// Real-time sync architecture with WebSockets
app.ws('/ws/collaboration', (ws, req) => {
  const userId = req.session.userId;
  const sessionId = req.query.sessionId;

  // Join collaboration session
  joinSession(sessionId, userId, ws);

  ws.on('message', msg => {
    const event = JSON.parse(msg);

    switch (event.type) {
      case 'property-select':
        // Broadcast to all analysts in session
        broadcastToSession(sessionId, {
          type: 'property-selected',
          userId,
          propertyId: event.propertyId,
          timestamp: Date.now(),
        });
        break;

      case 'analysis-update':
        // Sync analysis changes across devices
        syncAnalysisState(sessionId, event.data);
        break;

      case 'cursor-move':
        // Show cursor positions for collaborative map interaction
        broadcastCursorPosition(sessionId, userId, event.position);
        break;
    }
  });

  ws.on('close', () => {
    leaveSession(sessionId, userId);
  });
});
```

### Database Schema for Mass Appraisal

```typescript
// shared/schema.ts - Add mass appraisal tables

export const propertyGroups = pgTable('property_groups', {
  groupId: uuid('group_id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  criteria: json('criteria')
    .$type<{
      buildingType: string;
      qualityGrade: string;
      yearBuiltRange: number[];
      squareFeetRange: number[];
      neighborhood: string;
    }>()
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: text('created_by').references(() => users.id),
});

export const batchAnalyses = pgTable('batch_analyses', {
  batchId: uuid('batch_id').defaultRandom().primaryKey(),
  propertyCount: integer('property_count').notNull(),
  analysisType: text('analysis_type').notNull(),
  results: json('results').$type<{
    meanValue: number;
    standardDeviation: number;
    confidenceInterval: [number, number];
    outliers: string[];
  }>(),
  statisticalMethod: text('statistical_method').notNull(),
  confidence: real('confidence').notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
  executedBy: text('executed_by').references(() => users.id),
});

export const gisData = pgTable('gis_data', {
  propertyId: uuid('property_id').references(() => properties.propertyId),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  parcelGeometry: json('parcel_geometry').$type<GeoJSON.Polygon>(),
  spatialFactors: json('spatial_factors').$type<{
    distanceToDowntown: number;
    proximityToAmenities: string[];
    floodZone: string;
    zoning: string;
  }>(),
});

export const collaborationSessions = pgTable('collaboration_sessions', {
  sessionId: uuid('session_id').defaultRandom().primaryKey(),
  participants: json('participants').$type<string[]>(),
  activeAnalysis: uuid('active_analysis').references(
    () => batchAnalyses.batchId
  ),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastActivity: timestamp('last_activity').defaultNow(),
});
```

### Performance Optimization for Mass Appraisal

**Handling 10K+ property datasets**:

```typescript
// API endpoint with streaming response for large datasets
app.post('/api/batch/stream-results', async (req, res) => {
  const { propertyIds, analysisType } = req.body;

  res.setHeader('Content-Type', 'application/x-ndjson'); // Newline-delimited JSON
  res.setHeader('X-Benton-County-BCBS', 'v2025');

  const CHUNK_SIZE = 50;
  const chunks = chunkArray(propertyIds, CHUNK_SIZE);

  for (const chunk of chunks) {
    const results = await Promise.all(
      chunk.map(id => performAnalysis(id, analysisType))
    );

    // Stream each chunk as it completes
    for (const result of results) {
      res.write(JSON.stringify(result) + '\n');
    }

    await sleep(50); // Rate limiting
  }

  res.end();
});
```

**Client-side streaming consumption**:

```typescript
// React component for streaming results
export function StreamingBatchResults({ propertyIds }: { propertyIds: string[] }) {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const streamResults = async () => {
      const response = await fetch('/api/batch/stream-results', {
        method: 'POST',
        body: JSON.stringify({ propertyIds, analysisType: 'mass-appraisal' }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            const result = JSON.parse(line);
            setResults(prev => [...prev, result]);
            setProgress((results.length + 1) / propertyIds.length * 100);
          }
        }
      }
    };

    streamResults();
  }, [propertyIds]);

  return (
    <div>
      <Progress value={progress} className="mb-4" />
      <div className="text-[#00ffee]">
        Analyzed {results.length} of {propertyIds.length} properties
      </div>
      <BatchResultsTable data={results} />
    </div>
  );
}
```

---

**Critical**: This platform processes real property assessments for Benton
County citizens. Maintain 99.7%+ accuracy standards and complete audit trails
for all calculations.

**Government. Transcended.** Execute with championship-level precision for
PhD-level analysts performing mass appraisal workflows with GIS integration and
immersive analytics.
