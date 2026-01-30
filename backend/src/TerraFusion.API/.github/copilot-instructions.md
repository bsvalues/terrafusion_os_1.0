# TerraFusion OS 1.0 - AI Coding Agent Instructions

## Project Overview
TerraFusion OS is an enterprise-grade property assessment and AI-powered valuation system for government counties, built with .NET 8.0 and React. The system manages 50,000+ AI agents across 39 Washington State counties, providing real-time property valuations, tax levy calculations, and government compliance monitoring.

## Architecture & Core Components

### Backend Structure (C# .NET 8.0)
- **Main API**: `TerraFusion.API` - Central ASP.NET Core Web API
- **Core Domain**: `TerraFusion.Core` - Entities, interfaces, services
- **Data Layer**: `TerraFusion.Data` - Entity Framework with PostgreSQL/SQLite
- **AI Engine**: `TerraFusion.AI` - ML.NET models, AI orchestration
- **Specialized Modules**: 
  - `TerraFusion.Levy` - Tax levy calculations (PostgreSQL)
  - `TerraFusion.CostForge` - Property valuation engine
  - `TerraFusion.Operations` - Government operations

### Frontend Structure (React/TypeScript)
- **React 18** with Material-UI components
- **Government Dashboard**: `frontend/src/components/government/PropertyAssessmentDashboard.tsx`
- **County-specific configurations**: `config/counties/{county}-config.json`

### Database Strategy
- **Development**: SQLite (`terrafusion.db`)
- **Production**: PostgreSQL (`LEVY_DATABASE_URL` for TerraLevy)
- **Legacy Integration**: Harris PACS system integration

## Development Workflows

### Elite Environment Setup
```powershell
# Complete development environment setup
./Setup-Environment.ps1

# Validate configuration and compliance
./Test-Configuration.ps1

# Start the elite API system
./start_api.ps1
```

### Starting the API
```powershell
# Use the elite startup script with diagnostics
./start_api.ps1

# Or manually with dynamic port allocation
dotnet run --urls "http://localhost:0"  # 0 = OS picks available port

# Elite mode with environment variables
$env:TF_ELITE_MODE = "true"
$env:TF_GOVERNMENT_GRADE = "FISMA_MODERATE"
dotnet run --configuration Release
```

### Database Management
```bash
# Add migrations
dotnet ef migrations add MigrationName

# Update database (handles SQLite/PostgreSQL automatically)
dotnet ef database update

# Elite database validation
./Test-Configuration.ps1
```

## Key Patterns & Conventions

### Service Registration Pattern
Services use hierarchical dependency injection with scoped lifetimes:
```csharp
// ✅ Correct pattern for DbContext-dependent services
builder.Services.AddScoped<IServiceInterface, ServiceImplementation>();

// ⚠️ Avoid singletons for DB-dependent services
builder.Services.AddSingleton<IDbService, DbService>(); // Wrong!
```

### Module System Architecture
- **Dynamic Module Loading**: `ModuleLoaderService` discovers modules from file system
- **Module Manifests**: JSON files define module metadata and capabilities
- **Hot Reload**: SignalR hubs (`/hubs/oscore`) for real-time module updates
- **Tier System**: Core (Tier 1) → Government (Tier 3) → AI (Tier 4+) → Quantum (Tier 5+)

### Controller Patterns
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "OSCoreAccess")] // Government-grade authorization
public class ExampleController : ControllerBase
{
    // Always include audit logging for government compliance
    private readonly IAuditLogger _auditLogger;
    
    // Standard response pattern with timestamp and server info
    return Ok(new {
        data = result,
        timestamp = DateTime.UtcNow,
        server = "TerraFusion OS 1.0"
    });
}
```

### AI Swarm Integration
- **Supreme Commander**: Claude-3.5-Sonnet coordination system
- **Specialized Agents**: 50,000+ agents across 39 Washington State counties
- **Elite Modules**: Command Brain (1,008 agents), Swarm Orchestrator, Revenue Hunter (47,231% ROI)
- **Service Communication**: HTTP client calls to `localhost:3001` (Command Brain), `localhost:3002` (Swarm), `localhost:3003` (Revenue Hunter)
- **API Endpoints**: `/api/aimodules/status`, `/api/aimodules/execute`, `/api/aimodules/revenue/hunt`

### Government Compliance Requirements
- **FISMA Moderate**: All data handling must include audit trails
- **Encryption**: At-rest and in-transit (see county configs)
- **Retention**: 2555-day audit log retention (7 years)
- **Authentication**: JWT with role-based authorization

## Configuration Management

### Environment-Specific Settings
- `appsettings.json` - Base configuration
- `appsettings.Development.json` - Local development
- `appsettings.BentonCounty.json` - County-specific overrides
- Environment variables override JSON settings

### County Multi-Tenancy
Each county has a configuration file in `config/counties/`:
```json
{
  "county": "benton",
  "legacy_integration": {
    "system": "HARRIS_PACS",
    "sync_interval_minutes": 15
  },
  "ai_processing": {
    "property_valuation_enabled": true
  }
}
```

## Testing & Quality

### Test Structure
- Integration tests for controllers (`Tests/Controllers/AIModulesControllerTests.cs`)
- Unit tests for services and business logic
- Government compliance validation tests
- Elite AI swarm testing with 50,000+ agent simulation

### Health Monitoring
- `/health` - Basic health with module status
- `/api/test` - API connectivity test
- Prometheus metrics via `/metrics`
- Module consistency checks

## Common Tasks

### Adding New Controllers
1. Create controller in `Controllers/` with `[ApiController]` and audit logging
2. Register related services in `Program.cs`
3. Add authorization policies if government-sensitive
4. Include integration tests
5. Follow elite response pattern with timestamp and server info

### Module Development
1. Create module manifest JSON in modules directory
2. Implement module interface with proper tier classification
3. Register in `ModuleLoaderService` discovery system
4. Test hot-reload via SignalR hub

### AI Modules Integration
- **Controllers**: `AIModulesController` orchestrates 50,000+ agents across 39 counties
- **Service Layer**: `AIModuleOrchestrator` manages module communication
- **Health Checks**: Real-time monitoring with timeout handling
- **Commands**: Execute via `ai-command-brain`, `ai-swarm`, `ai-advanced` modules

### Government Feature Development
1. Review county configuration requirements
2. Implement audit logging for all operations
3. Ensure FISMA compliance patterns
4. Add role-based authorization as needed

## Performance Considerations
- **Dynamic Port Allocation**: Prevents port conflicts on developer machines
- **Module Caching**: In-memory caching with background refresh
- **Database Connection Pooling**: Automatic via Entity Framework
- **AI Agent Coordination**: Distributed across multiple services for scalability

## Security & Compliance
- JWT authentication with 60-minute expiration
- CORS configured for specific origins only
- Input validation via FluentValidation
- SQL injection protection via Entity Framework
- Government-grade audit logging for all operations
