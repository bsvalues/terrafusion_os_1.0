# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**TerraFusion OS Backend** is the .NET 8 microservices architecture for a government operating system with AI-powered property assessment, tax processing, and public sector management. This is NOT a simple web application - it's a complete operating system with 1,008 AI agents, real Harris PACS integration, and FISMA-HIGH compliance.

**Critical Context**: Read `.github/copilot-instructions.md` first - it contains essential government compliance requirements and AI swarm coordination rules.

## Architecture

### Three-Tier Service Model

The system operates as a complete OS with three core layers:

1. **Kernel (TerraFusion.API)** - Port 5000: Core OS services, property management, authentication
2. **Shell (TerraFusion.Gateway)** - Port 3002: API gateway with Ocelot, service orchestration
3. **Consciousness (TerraFusion.Consciousness)** - Port 3004: AI agent coordination, swarm orchestration

### Solution Structure

```
TerraFusion.sln
├── TerraFusion.API          # Main API/Kernel layer
├── TerraFusion.Core         # Domain entities, DTOs, interfaces
├── TerraFusion.Data         # EF Core DbContext, repositories
├── TerraFusion.AI           # AI models, ML services, CostForge
├── TerraFusion.Consciousness # AI swarm orchestration microservice
├── TerraFusion.Gateway      # API Gateway with Ocelot
├── TerraFusion.Abstractions # Shared interfaces and contracts
├── TerraFusion.Security     # Security, audit, compliance services
└── TerraFusion.API.Tests    # Integration tests
```

### Key Projects

- **TerraFusion.Core**: Domain entities (Property, County, AIAgent), DTOs, service interfaces, validation
- **TerraFusion.Data**: `TerraFusionDbContext` with 20+ DbSets, EF migrations, repositories
- **TerraFusion.AI**: AI command service, CostForge, predictive analytics, model orchestration
- **TerraFusion.Consciousness**: Quantum consciousness layer, AI swarm coordination, SignalR hubs
- **TerraFusion.Gateway**: Reverse proxy, rate limiting, service discovery via Consul

## Common Development Commands

### Building and Running

```bash
# Build entire solution
dotnet build TerraFusion.sln

# Build specific project
dotnet build TerraFusion.API/TerraFusion.API.csproj

# Run API (Kernel) on default port 5000
dotnet run --project TerraFusion.API

# Run Consciousness microservice on port 3004
dotnet run --project TerraFusion.Consciousness

# Run Gateway on port 3002
dotnet run --project TerraFusion.Gateway

# Build with verbose output for debugging
dotnet build TerraFusion.sln -v detailed
```

### Testing

```bash
# Run all tests
dotnet test

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test project
dotnet test TerraFusion.API.Tests/TerraFusion.API.Tests.csproj

# Run tests with detailed output
dotnet test -v detailed
```

### Database Operations

The project uses Entity Framework Core with PostgreSQL (production) and SQLite (development).

```bash
# Add new migration
dotnet ef migrations add MigrationName --project TerraFusion.Data --startup-project TerraFusion.API

# Update database
dotnet ef database update --project TerraFusion.Data --startup-project TerraFusion.API

# Remove last migration
dotnet ef migrations remove --project TerraFusion.Data --startup-project TerraFusion.API

# Generate migration script
dotnet ef migrations script --project TerraFusion.Data --startup-project TerraFusion.API
```

### NuGet Package Management

The solution uses **Central Package Management** via `Directory.Packages.props`. All package versions are centrally defined.

```bash
# Restore packages
dotnet restore

# Add package to a project (version defined in Directory.Packages.props)
dotnet add TerraFusion.API package PackageName

# Update all packages
dotnet list package --outdated
dotnet restore
```

### Docker and Microservices

```bash
# Build and run all microservices
docker-compose -f docker-compose.microservices.yml up -d

# View logs
docker-compose -f docker-compose.microservices.yml logs -f

# Stop all services
docker-compose -f docker-compose.microservices.yml down

# Rebuild specific service
docker-compose -f docker-compose.microservices.yml up -d --build terrafusion-api

# Deploy using deployment script
./deploy-phase-beta.sh

# Validate deployment
./validate-deployment.sh
```

### Code Quality

```bash
# Format code (uses .editorconfig)
dotnet format TerraFusion.sln

# Analyze code
dotnet build -warnaserror

# Check for security vulnerabilities
dotnet list package --vulnerable
```

## Critical Architectural Patterns

### 1. Government Audit Requirements

**NEVER modify these auto-populated fields** - they're required for FISMA compliance:

```csharp
// ALL entities must have these audit fields
public class Entity
{
    public DateTime CreatedAt { get; set; }     // Auto-set on insert
    public DateTime UpdatedAt { get; set; }     // Auto-set on update
    public string CreatedBy { get; set; }       // Auto-set from HttpContext
    public string UpdatedBy { get; set; }       // Auto-set from HttpContext
}
```

These are automatically populated by `AuditableEntityInterceptor` in `TerraFusionDbContext.SaveChangesAsync()`.

### 2. Service Registration Pattern

New services follow this pattern in `Program.cs`:

```csharp
// Interface in TerraFusion.Core/Interfaces or TerraFusion.Abstractions
public interface IMyService
{
    Task<Result> DoWorkAsync();
}

// Implementation in specific project
public class MyService : IMyService
{
    public async Task<Result> DoWorkAsync() => // ...
}

// Registration in Program.cs
builder.Services.AddScoped<IMyService, MyService>();
```

### 3. Database Context Usage

The `TerraFusionDbContext` has 20+ DbSets for government operations:

```csharp
// Core Government: Properties, Counties, CountyDeployments, PropertyAssessments, TaxLevies
// Users & Security: GovernmentUsers, AuditLogs, SecurityEvents, UserSessions
// AI System: AIAgents, AIModels, PerformanceMetrics
// Modules: Modules, Valuations
// Marketplace: Plugins, PluginSubmissions, PluginInstallations, PluginRevenue
// Collaboration: CollaborationUsers, Teams, Projects, Tasks, Documents
```

Always use dependency injection to inject `TerraFusionDbContext` or `ITerraFusionDbContext`.

### 4. AI Swarm Coordination

**DO NOT interfere with production AI swarm** in `os-platform/ai-systems/ai-systems/ai-swarm/`. The swarm consists of:

- 1,008 production agents
- Coordinator agents (task management)
- Field General agents (specialized operations)
- Micro agents (rapid execution)

Use `AICommandService` to interact with swarm:

```csharp
var swarmStatus = await _aiCommandService.GetSwarmStatusAsync();
var agents = await _aiCommandService.GetActiveAgentsAsync();
var metrics = await _aiCommandService.GetSwarmMetricsAsync();
```

### 5. Configuration Management

Configuration is environment-aware:

- `appsettings.json` - Base configuration
- `appsettings.Development.json` - Development overrides
- `appsettings.Production.json` - Production settings
- `appsettings.BentonCounty.json` - County-specific settings

Access via `IConfiguration`:

```csharp
var connString = _configuration.GetConnectionString("DefaultConnection");
var jwtSecret = _configuration["JwtSettings:SecretKey"];
```

### 6. Health Checks

All services must implement health checks:

```csharp
public class MyService : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        // Check service health
        return HealthCheckResult.Healthy("Service is operational");
    }
}

// Register in Program.cs
builder.Services.AddHealthChecks()
    .AddCheck<MyService>("my-service");
```

### 7. SignalR Real-Time Communication

SignalR is used for real-time updates across the OS:

```csharp
// Hub definition
public class MyHub : Hub
{
    public async Task BroadcastMessage(string message)
    {
        await Clients.All.SendAsync("ReceiveMessage", message);
    }
}

// Registration
builder.Services.AddSignalR();
app.MapHub<MyHub>("/hubs/my-hub");
```

## Government Compliance

### Security Requirements

1. **Authentication**: JWT Bearer tokens (see `TerraFusion.Security/Services/ProductionAuthenticationService.cs`)
2. **Authorization**: Role-based access control (RBAC)
3. **Audit Logging**: All operations logged to `AuditLogs` table
4. **Encryption**: Data at rest and in transit
5. **Compliance**: FISMA-HIGH, NIST 800-53

### County Data Isolation

**Sovereign County Model**: Each county's data is completely isolated. Multi-county operations require explicit compliance approval.

```csharp
// Filter by county automatically
var properties = await _context.Properties
    .Where(p => p.CountyId == currentUser.CountyId)
    .ToListAsync();
```

### Harris PACS Integration

Real integration with Harris PACS v12.4.7, Tyler Technologies, and Aumentum Systems. Located in `terra-fusion-sync` module. **DO NOT modify** integration code without county approval.

## Testing Philosophy

- **716 real tests** with 91.9% pass rate
- Primary test location: `os-platform/development/testing-suite/` (not just `/tests/`)
- AI-powered self-healing tests
- Integration tests in `TerraFusion.API.Tests/`

Test pattern:

```csharp
[Fact]
public async Task MyService_Should_DoExpectedWork()
{
    // Arrange
    var service = new MyService(_mockContext.Object, _logger.Object);

    // Act
    var result = await service.DoWorkAsync();

    // Assert
    Assert.NotNull(result);
    Assert.True(result.IsSuccess);
}
```

## Port Allocation

Services use dynamic port allocation to avoid conflicts:

- **API (Kernel)**: Port 5000 (configurable)
- **Gateway (Shell)**: Port 3002 (configurable)
- **Consciousness**: Port 3004 (configurable)
- **Frontend**: Port 3000 (separate repo)

Ports are discovered via `ServiceRegistry.GetAvailablePort()` in development.

## Common Patterns to Avoid

1. **DON'T hardcode connection strings** - use IConfiguration
2. **DON'T bypass audit fields** - they're auto-populated and government-required
3. **DON'T modify AI swarm coordination** - use AICommandService API
4. **DON'T skip health checks** - required for microservices architecture
5. **DON'T ignore county isolation** - multi-county requires explicit approval
6. **DON'T commit sensitive data** - use User Secrets for development

## Observability and Monitoring

### Structured Logging

Uses Serilog with console and file sinks:

```csharp
_logger.LogInformation("Processing {Count} properties for county {CountyId}",
    count, countyId);
_logger.LogError(ex, "Failed to process property {PropertyId}", propertyId);
```

### OpenTelemetry

Distributed tracing configured in `TerraFusion.Consciousness`:

```csharp
builder.Services.AddOpenTelemetry()
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddEntityFrameworkCoreInstrumentation()
        .AddJaegerExporter())
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddPrometheusExporter());
```

### Prometheus Metrics

Metrics exposed at `/metrics` endpoint using `prometheus-net.AspNetCore`.

## Central Package Management

All package versions are defined in `Directory.Packages.props`:

- **Entity Framework Core**: 8.0.0
- **ASP.NET Core**: 8.0.0
- **.NET**: 8.0
- **AutoMapper**: 12.0.1
- **Serilog**: 4.2.0
- **ML.NET**: 3.0.1
- **SignalR**: 8.0.0
- **Ocelot**: 22.0.1 (Gateway)
- **OpenTelemetry**: 1.9.0

When adding packages, version is centrally managed - just add `PackageReference` without `Version` attribute.

## Quick Reference

### Adding a New Controller

1. Create controller in `TerraFusion.API/Controllers/`
2. Inherit from `ControllerBase` or `Controller`
3. Add `[ApiController]` and `[Route("api/[controller]")]` attributes
4. Inject required services via constructor
5. Add health check if needed
6. Add integration tests in `TerraFusion.API.Tests/`

### Adding a New Entity

1. Create entity in `TerraFusion.Core/Entities/`
2. Add audit properties (CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
3. Add `DbSet` to `TerraFusionDbContext`
4. Create configuration in `TerraFusion.Data/Configurations/`
5. Generate and apply migration
6. Create corresponding DTO in `TerraFusion.Core/DTOs/`
7. Add AutoMapper profile mapping

### Adding a New Service

1. Define interface in `TerraFusion.Core/Interfaces/` or `TerraFusion.Abstractions/Interfaces/`
2. Implement in appropriate project (TerraFusion.AI, TerraFusion.Core, etc.)
3. Register in `Program.cs` with appropriate lifetime (Scoped, Singleton, Transient)
4. Add health check if it's a critical service
5. Add logging using `ILogger<T>`
6. Add unit/integration tests

## Related Files

- `.github/copilot-instructions.md` - **MUST READ**: Government compliance, AI swarm rules, testing architecture
- `TerraFusion.API/README.md` - API endpoint documentation
- `docker-compose.microservices.yml` - Complete microservices orchestration
- `deploy-phase-beta.sh` - Production deployment script
- `validate-deployment.sh` - Deployment validation suite
- `Directory.Packages.props` - Central package version management
