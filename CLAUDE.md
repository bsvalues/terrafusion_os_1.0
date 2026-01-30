# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**TerraFusion OS 1.0** is a complete government operating system - NOT a web application. It's a production platform with 1,008 operational AI agents, real county property data (89,247 Benton County parcels), and FISMA-HIGH compliance serving 39+ Washington State counties.

**CRITICAL**: Read `.github/copilot-instructions.md` FIRST - contains essential government compliance requirements, AI swarm coordination rules, and testing architecture.

## Canonical Instructions (Source of Truth)

Always follow these, in order:
1. `.github/copilot-instructions.md`
2. `CLAUDE.md`
3. `STANDARD.md` (repo root)

Anything under `agents/**` is optional implementation detail unless explicitly referenced here.

## Launcher Constitution (Dev OS)

`tools/dev/dev-os.mjs` MUST:
- Start only apps where `autostart === true` AND `start` is present.
- Never infer runtime from the filesystem.
- Treat missing `start` as a non-fatal skip.

`terrafusion.app.json` MUST:
- Declare `runtime` and `start` for any runnable app.
- Keep legacy apps `pinned: false` and either omit `start` or set `runnable: false`.
- Use `pinned` for UI visibility and `autostart` for launcher behavior.

## Architecture: Three-Tier OS Model

TerraFusion operates as a complete operating system with three core service tiers:

1. **Kernel (TerraFusion.API)** - Port 5000
   - .NET 8 ASP.NET Core with Entity Framework Core
   - Property management, authentication, core OS services
   - PostgreSQL (production) or SQLite (development)

2. **Shell (TerraFusion.Gateway)** - Port 3002
   - API gateway using Ocelot reverse proxy
   - Service discovery via Consul
   - Rate limiting and request routing

3. **Consciousness (TerraFusion.Consciousness)** - Port 3004
   - AI swarm orchestration (1,008 agents in production)
   - SignalR real-time coordination
   - Quantum consciousness layer for multi-agent coordination

4. **Frontend** - Port 3000
   - React 18.3 + TypeScript 5.3 with Vite 5
   - Builds to `native-shell/ui/dist` (NOT `dist/`) for Electron desktop deployment
   - SignalR client connects to backend hubs
   - Vite proxy routes `/api` requests to port 5000

## Solution Structure

```
terrafusion_os_1.0/
├── backend/                    # .NET 8 microservices
│   ├── TerraFusion.API         # Kernel (port 5000)
│   ├── TerraFusion.Core        # Domain entities, DTOs, interfaces
│   ├── TerraFusion.Data        # EF Core DbContext (20+ tables)
│   ├── TerraFusion.AI          # AI models, CostForge, ML services
│   ├── TerraFusion.Consciousness  # AI swarm (port 3004)
│   ├── TerraFusion.Gateway     # Ocelot gateway (port 3002)
│   ├── TerraFusion.Abstractions   # Shared interfaces
│   ├── TerraFusion.Security    # Security, audit, compliance
│   └── TerraFusion.API.Tests   # Integration tests
│
├── frontend/                   # React 18 + TypeScript
│   ├── src/components/ui/      # shadcn/ui + Radix primitives
│   ├── src/services/           # API clients + SignalR
│   ├── src/hooks/              # Custom React hooks (useBackendConnection)
│   ├── electron/               # Electron main process
│   └── vite.config.ts          # Builds to ../native-shell/ui/dist
│
├── native-shell/               # C# WPF desktop shell
│   └── ui/                     # Frontend build output (deployed here)
│
├── os-platform/                # AI systems + testing suite
│   ├── ai-systems/ai-systems/ai-swarm/  # 1,008 agent swarm (DO NOT MODIFY)
│   └── development/testing-suite/       # 716 real tests (91.9% pass rate)
│
├── marketplace/                # Plugin ecosystem modules
├── scripts/                    # Deployment automation
└── tests/                      # Root-level test infrastructure
```

## Common Development Commands

### Initial Setup
```bash
# Backend setup
cd backend
dotnet restore
dotnet build TerraFusion.sln

# Frontend setup
cd frontend
npm install

# Full stack development
npm run dev                    # Starts both backend + frontend
```

### Backend (.NET 8)
```bash
# Build and run
dotnet build TerraFusion.sln
dotnet run --project TerraFusion.API              # Kernel (port 5000)
dotnet run --project TerraFusion.Consciousness    # AI Swarm (port 3004)
dotnet run --project TerraFusion.Gateway          # Shell (port 3002)

# Testing
dotnet test                                       # All tests
dotnet test --collect:"XPlat Code Coverage"       # With coverage

# Database migrations (EF Core)
dotnet ef migrations add MigrationName --project TerraFusion.Data --startup-project TerraFusion.API
dotnet ef database update --project TerraFusion.Data --startup-project TerraFusion.API

# Code formatting
dotnet format TerraFusion.sln
```

### Frontend (React + TypeScript)
```bash
cd frontend

# Development
npm run dev                    # Vite dev server (port 3000)
npm run electron:dev           # Electron desktop app

# Building (outputs to ../native-shell/ui/dist)
npm run build
npm run build:analyze          # With bundle analysis

# Testing
npm test                       # Jest + React Testing Library
npm run test:e2e              # Playwright E2E tests
npm run test:coverage

# Code quality
npm run lint                   # ESLint
npm run format                 # Prettier
npm run government:compliance  # WCAG 2.1 AA + security checks
```

### Docker Microservices
```bash
cd backend
docker-compose -f docker-compose.microservices.yml up -d
./deploy-phase-beta.sh         # Production deployment
./validate-deployment.sh       # Validate deployment
```

### Root-Level Commands
```bash
# Full stack
npm run dev                    # Backend + Frontend
npm run build                  # Build all
npm run test:all              # All test suites

# Database
npm run db:seed
npm run db:reset

# Quality gates
npm run lint                   # Lint entire codebase
npm run format                 # Format all code
npm run gates                  # Verify coverage (97%+), LCP (<2500ms), a11y (0 errors)
```

## Critical Development Rules

### 1. Government Compliance (FISMA-HIGH)

**NEVER modify audit fields** - Auto-populated for FISMA compliance:

```csharp
// Backend entities - automatically set by AuditableEntityInterceptor
public DateTime CreatedAt { get; set; }  // Auto-set on insert
public DateTime UpdatedAt { get; set; }  // Auto-set on update
public string CreatedBy { get; set; }    // Auto-set from HttpContext
public string UpdatedBy { get; set; }    // Auto-set from HttpContext
```

**County data isolation** - Sovereign County model (multi-county operations require approval):

```csharp
// Always filter by county context
var properties = await context.Properties
    .Where(p => p.CountyId == currentUser.CountyId)
    .ToListAsync();
```

### 2. AI Swarm Coordination

**DO NOT modify production AI swarm** in `backend/TerraFusion.Consciousness/` or `os-platform/ai-systems/ai-systems/ai-swarm/`:
- 1,008 production agents in hierarchical coordination
- Coordinator agents, Field General agents, Micro agents
- Autonomous self-healing and quantum-ready architecture

**Use AICommandService API** to interact with swarm:

```csharp
var status = await _aiCommandService.GetSwarmStatusAsync();
var agents = await _aiCommandService.GetActiveAgentsAsync();
```

### 3. Harris PACS Integration

**NEVER modify** Harris PACS 9.0 integration without county approval:
- Real property data (89,247 Benton County parcels)
- Tyler Technologies Vision integration
- Aumentum Systems connectivity
- Located in `terra-fusion-sync` module

### 4. Frontend Build Architecture

**CRITICAL**: Frontend builds to `native-shell/ui/dist`, NOT `dist/`:

```typescript
// vite.config.ts
build: {
  outDir: '../native-shell/ui/dist',
  emptyOutDir: true,
}
```

This enables the native desktop shell to serve the built frontend directly.

### 5. Testing Requirements

- **716 real tests** with 91.9% pass rate
- Primary location: `os-platform/development/testing-suite/` (not just `/tests/`)
- Backend integration tests: `backend/TerraFusion.API.Tests/`
- Frontend tests: `frontend/tests/`
- AI-powered self-healing test architecture

## Key Architectural Patterns

### Backend Service Registration

```csharp
// 1. Define interface in TerraFusion.Abstractions or TerraFusion.Core/Interfaces
public interface IMyService
{
    Task<Result> DoWorkAsync();
}

// 2. Implement with health check
public class MyService : IMyService, IHealthCheck
{
    public async Task<Result> DoWorkAsync() { /* ... */ }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken ct)
    {
        return HealthCheckResult.Healthy("Service operational");
    }
}

// 3. Register in Program.cs
builder.Services.AddScoped<IMyService, MyService>();
builder.Services.AddHealthChecks().AddCheck<MyService>("my-service");
```

### Frontend Component Pattern

```tsx
// Use shadcn/ui + Radix primitives with path aliases
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBackendConnection } from '@/hooks/useBackendConnection';

export function MyComponent() {
  const { connected } = useBackendConnection();

  return (
    <Card className="bg-terra-midnight text-terra-cyan">
      <CardContent>
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### SignalR Real-Time Communication

```tsx
// Frontend
import * as signalR from '@microsoft/signalr';

const connection = new signalR.HubConnectionBuilder()
  .withUrl('/api/hubs/system')
  .withAutomaticReconnect()
  .build();

await connection.start();
connection.on('ReceiveUpdate', (data) => {
  // Handle real-time updates
});
```

```csharp
// Backend hub
public class SystemHub : Hub
{
    public async Task BroadcastUpdate(string message)
    {
        await Clients.All.SendAsync("ReceiveUpdate", message);
    }
}

// Registration in Program.cs
app.MapHub<SystemHub>("/hubs/system");
```

### Database Entity Pattern

```csharp
// 1. Create entity in backend/TerraFusion.Core/Entities/
public class MyEntity
{
    public int Id { get; set; }
    public string Name { get; set; }

    // REQUIRED: Audit fields (auto-populated)
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreatedBy { get; set; }
    public string UpdatedBy { get; set; }
}

// 2. Add DbSet to TerraFusionDbContext
public DbSet<MyEntity> MyEntities { get; set; }

// 3. Create EF configuration in TerraFusion.Data/Configurations/
public class MyEntityConfiguration : IEntityTypeConfiguration<MyEntity>
{
    public void Configure(EntityTypeBuilder<MyEntity> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).IsRequired().HasMaxLength(200);
    }
}

// 4. Generate migration
dotnet ef migrations add AddMyEntity --project TerraFusion.Data --startup-project TerraFusion.API
dotnet ef database update --project TerraFusion.Data --startup-project TerraFusion.API
```

## Environment Configuration

### Backend (appsettings.json)
- `appsettings.json` - Base configuration
- `appsettings.Development.json` - Dev overrides
- `appsettings.Production.json` - Production settings
- `appsettings.BentonCounty.json` - County-specific config

Access via `IConfiguration`:

```csharp
var connString = _configuration.GetConnectionString("DefaultConnection");
var jwtSecret = _configuration["JwtSettings:SecretKey"];
```

### Frontend (.env files)
- `.env.development` - Development variables
- `.env.production` - Production variables
- `.env.example` - Template (commit this)

Access in code:

```tsx
const apiUrl = import.meta.env.VITE_API_URL;
const isDev = import.meta.env.DEV;
```

## Port Allocation

Services use dynamic port allocation (configurable via environment):

- **Frontend**: 3000 (VITE_PORT)
- **API (Kernel)**: 5000
- **Gateway (Shell)**: 3002
- **Consciousness**: 3004
- **PostgreSQL**: 5432
- **Redis**: 6379
- **Consul**: 8500

## Technology Stack

**Backend:** .NET 8, Entity Framework Core 8, PostgreSQL/SQLite, SignalR 8, Ocelot 22, Serilog 4.2, ML.NET 3.0, OpenTelemetry 1.9

**Frontend:** React 18.3, TypeScript 5.3, Vite 5, Tailwind CSS 4.1, Radix UI, shadcn/ui, Zustand, Redux Toolkit, TanStack Query, Recharts, Three.js, SignalR Client, Electron 28

**Infrastructure:** Docker, Kubernetes, Consul (service discovery), Redis (caching), Jaeger (tracing), Prometheus (metrics), Grafana (dashboards)

**AI/ML:** 1,008 agent swarm, autonomous coordination, quantum-ready processing

## Central Package Management

Backend uses **Directory.Packages.props** for centralized version control:

```xml
<PackageVersion Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
<PackageVersion Include="Serilog.AspNetCore" Version="4.2.0" />
```

Add packages without version attribute:

```bash
dotnet add TerraFusion.API package PackageName
```

## TerraFusion Database Schema

`TerraFusionDbContext` has 20+ DbSets:

**Core Government:** Properties, Counties, CountyDeployments, PropertyAssessments, TaxLevies

**Users & Security:** GovernmentUsers, AuditLogs, SecurityEvents, UserSessions

**AI System:** AIAgents, AIModels, PerformanceMetrics

**Marketplace:** Plugins, PluginSubmissions, PluginInstallations, PluginRevenue

**Collaboration:** CollaborationUsers, Teams, Projects, Tasks, Documents

## Troubleshooting

### Port Conflicts
```bash
# Backend uses ServiceRegistry.GetAvailablePort() for dynamic allocation
# Frontend: Set VITE_PORT in .env.development
```

### Build Errors
```bash
# Backend
cd backend
dotnet clean && dotnet build

# Frontend
cd frontend
npm run clean && npm install
```

### Database Issues
```bash
# Reset database (CAUTION: destroys data)
npm run db:reset

# Check migrations
dotnet ef migrations list --project TerraFusion.Data --startup-project TerraFusion.API
```

### AI Swarm Issues
```bash
npm run monitor-agents
npm run ai-agent-briefing
```

## Documentation

**Essential Reading (in order):**

1. `.github/copilot-instructions.md` - Government compliance, AI swarm rules (REQUIRED)
2. `backend/CLAUDE.md` - Backend development guide
3. `frontend/CLAUDE.md` - Frontend development guide
4. `package.json` - Root coordination scripts
5. `README.md` - Project overview and quick start

## Development Philosophy

**THE TERRAFUSION WAY**: Execute with excellence. This is production government infrastructure serving real citizens with real property data. Quality, compliance, and reliability are non-negotiable. Every decision must consider:

1. **Government compliance** (FISMA-HIGH, NIST 800-53)
2. **Citizen data protection** (Sovereign County isolation)
3. **AI swarm coordination** (1,008 agents in production)
4. **Real-world integration** (Harris PACS, Tyler Technologies, Aumentum)
5. **Production readiness** (716 tests, 91.9% pass rate, 99.9% uptime target)

---

**Last Updated**: October 2025
**Version**: TerraFusion OS 1.0
**Classification**: Government Operating System Platform
**Compliance**: FISMA-HIGH, NIST 800-53, WCAG 2.1 AA
