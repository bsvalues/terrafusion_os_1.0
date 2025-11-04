# TerraFusion OS 1.0 - Multi-Workspace AI Platform

## 🎯 Project Context

**TerraFusion OS** is a production-grade government AI operating system coordinating **50,000+ AI agents** across **39 Washington State counties**. This is the root workspace containing multiple specialized subsystems:

- **Backend Services** (`/backend/`) - .NET 8 microservices (TerraFusion.API, TerraFusion.AI, TerraFusion.Consciousness)
- **SDK** (`/SDK/`) - Development toolkit for extending the platform (read-only in most workflows)
- **Config** (`/config/`) - Centralized configuration hub (county configs, AI prompts, brand guidelines)
- **Marketplace Modules** - Specialized services like "shock-and-awe" emergency response placeholders

**Critical Understanding**: This is **NOT a web app**. It's an OS-level platform with services that run as background processes. Don't suggest Docker/Kubernetes deployments unless explicitly deploying to cloud environments.

## 🏗️ Architecture Overview

### Backend Microservices (.NET 8)

Primary solution file: `backend/TerraFusion.sln`

**Core Services**:
- `TerraFusion.API` - Main API gateway (port 5000/5001)
- `TerraFusion.Consciousness` - AI swarm orchestration (port 3004)
- `TerraFusion.AI` - ML/AI coordination with CostForge integration
- `TerraFusion.Data` - EF Core data layer (PostgreSQL/SQLite)
- `TerraFusion.Core` - Shared domain models and interfaces
- `TerraFusion.Operations` - Government operations and emergency response coordination

**Specialized Services**:
- `TerraFusion.Levy` - Tax levy calculations (dedicated PostgreSQL)
- `TerraFusion.CostForge` - Property valuation engine
- `TerraFusion.QuantumAnalytics` - Advanced analytics processing
- `TerraFusion.StreamingAnalytics` - Real-time metric streaming

### SDK Structure (`/SDK/`)

**Purpose**: Development toolkit for extending TerraFusion modules

``
SDK/
├── modules/              # Pre-built government modules (read-only)
│   ├── terra-levy/      # Tax levy system
│   ├── terra-agent/     # AI agent framework
│   ├── costforge-ai/    # Property valuation
│   └── bcbs-webhub/     # County integrations
├── scripts/             # Automation scripts
│   ├── create-module.sh
│   └── dev-setup.sh
├── tools/               # Validation and testing tools
│   ├── validate-*.py    # Module validators
│   └── quantum_dashboard.py
└── README.md            # Comprehensive SDK documentation
``

**SDK Rule**: Modules in `/SDK/modules/` are typically **read-only**. Development happens by referencing them, not modifying them directly.

### Configuration Hub (`/config/`)

**Purpose**: Centralized configuration management for all services

- **County Configs**: `tenant.{county}.yaml` files with isolated county settings
- **AI Configuration**: `ai/ai-system-prompts.json`, `ai/claude-code-workflows.js`
- **Brand Guidelines**: `terrafusion-brand-context.json`, `brand-implementation-roadmap.json`
- **Compliance**: FISMA-High, NIST, FedRAMP settings

**Config Pattern**: Each county has sovereign data isolation via tenant-based configuration.

## 🛠️ Development Workflows

### Starting Backend Services

``powershell
# Build entire solution
cd backend
dotnet build TerraFusion.sln

# Start main API (uses dynamic port or 5000)
dotnet run --project TerraFusion.API

# Start Consciousness Engine (AI swarm coordinator)
dotnet run --project TerraFusion.Consciousness --urls "http://localhost:3004"

# Run specific service
dotnet run --project TerraFusion.{ServiceName}
``

**Port Management**: Services use dynamic port allocation by default. Check console output for actual port.

### Task-Based Workflows (VS Code)

**Available Tasks** (access via `Ctrl+Shift+P` → "Tasks: Run Task"):
- `Build TerraFusion Elite Government OS` - Full backend build
- `Launch TerraFusion API Gateway` - Start main API
- `Launch TerraFusion Consciousness Engine` - Start AI coordination
- `Emergency Build` - Quick compilation for marketplace modules
- `Emergency Compliance Check` - Government standards validation

### SDK Operations

``bash
# Validate existing modules
python SDK/tools/validate-terra-levy.py
python SDK/tools/validate-bcbs-webhub.py

# Create new government module (not for shock-and-awe placeholders)
./SDK/scripts/create-module.sh --name="my-module" --type="government"

# Run quantum performance dashboard
python SDK/tools/quantum_dashboard.py
``

### Database Workflows

**Development**: Uses SQLite (`backend/terrafusion.db`)
**Production**: PostgreSQL with connection strings in environment variables

``powershell
# Entity Framework migrations
cd backend/TerraFusion.Data
dotnet ef migrations add MigrationName
dotnet ef database update

# TerraLevy has separate database
cd backend/TerraFusion.Levy
dotnet ef database update --context TerraLevyDbContext
``

**Environment Variables**:
- `LEVY_DATABASE_URL` - TerraLevy PostgreSQL connection
- `TF_ELITE_MODE` - Enable championship performance features
- `TF_CONSCIOUSNESS_PORT` - Consciousness engine port (default 3004)

## 🎯 Key Conventions

### County Data Isolation

**CRITICAL**: Never mix county data. Each county is a separate tenant:

``csharp
// CORRECT: Always include countyCode parameter
public async Task<PropertyData> GetPropertyAsync(string countyCode, string parcelId)
{
    var context = await GetCountyContextAsync(countyCode);
    return await context.Properties
        .Where(p => p.CountyId == countyCode && p.ParcelId == parcelId)
        .SingleOrDefaultAsync();
}

// INCORRECT: Direct queries without county isolation
var allProperties = await _context.Properties.ToListAsync(); // ❌ NEVER DO THIS
``

### AI Agent Coordination

50,000+ agents managed through `TerraFusion.Consciousness`:

``csharp
// AI swarm coordination pattern
public async Task<SwarmResult> CoordinateAIAnalysisAsync(Property property, int swarmSize)
{
    var swarmConfig = new SwarmConfiguration 
    { 
        TargetAgentCount = swarmSize,
        ConsciousnessLevel = ConsciousnessLevel.Elite 
    };
    
    return await _consciousnessEngine.CoordinateSwarmAsync(swarmConfig);
}
``

### Performance Targets

- **API Latency**: <10ms P95, <1ms P50 (championship mode)
- **Availability**: 99.999% uptime for production
- **Accuracy**: 99.9% for property valuations (IAAO standards)
- **Batch Processing**: 1M+ parcels/second with quantum optimization

### Configuration Loading

``csharp
// Load county-specific config
var config = await _configService.GetCountyConfigAsync(countyCode);
var syncInterval = config.Harris_PACS.SyncInterval;
var aiEnabled = config.AISwarmEnabled;
``

## 🚫 Critical Constraints

### What NOT to Do

1. **Don't suggest containerization** unless explicitly deploying to Azure/cloud
2. **Don't modify SDK modules directly** - they're reference implementations
3. **Don't bypass county isolation** - all data access must include `countyCode`
4. **Don't hardcode ports** - use configuration or dynamic allocation
5. **Don't suggest web deployment strategies** - this is an OS-level platform

### Testing Strategy

``powershell
# Unit tests with xUnit
cd backend/tests
dotnet test

# Integration tests with county isolation
dotnet test --filter "Category=Integration"

# Government compliance validation
./SDK/tools/compliance-check.sh --service=all --fisma-high
``

### Compliance Requirements

All code must meet:
- **FISMA-High** security standards
- **NIST 800-53** controls
- **FedRAMP High** authorization levels
- **Section 508** accessibility
- **SOC 2 Type II** operational standards

## 📁 Key File Locations

**Backend Entry Points**:
- Main API: `backend/TerraFusion.API/Program.cs`
- Consciousness: `backend/TerraFusion.Consciousness/Program.cs`
- Database: `backend/TerraFusion.Data/TerraFusionDbContext.cs`

**Configuration**:
- County Configs: `config/tenant.*.yaml`
- AI Prompts: `config/ai/ai-system-prompts.json`
- Brand: `config/terrafusion-brand-context.json`

**SDK References**:
- Main SDK: `SDK/terrafusion-os-sdk.ts`
- Module Examples: `SDK/modules/*/README.md`

**Emergency Response Placeholders**:
- Shock-and-Awe modules in `marketplace/shock-and-awe/` - currently organizational placeholders with VS Code task definitions

## 🔧 Debugging & Troubleshooting

### Port Conflicts
``powershell
# Find process using port
netstat -ano | findstr :5000

# Kill process by PID
taskkill /PID <pid> /F
``

### Database Connection Issues
``powershell
# Check SQLite database
sqlite3 backend/terrafusion.db ".tables"

# Verify PostgreSQL connection
$env:LEVY_DATABASE_URL = "your-connection-string"
dotnet ef database validate --project backend/TerraFusion.Levy
``

### AI Swarm Debugging
``powershell
# Enable consciousness debugging
$env:TF_CONSCIOUSNESS_DEBUG = "true"
dotnet run --project backend/TerraFusion.Consciousness
``

### Performance Monitoring
``csharp
// Use built-in performance monitoring
using var activity = _performanceMonitor.StartActivity("Operation.Name", countyId);
// ... your code
// Activity auto-completes on dispose
``

## 📚 Additional Resources

- Backend API Docs: `backend/TerraFusion.API/.github/copilot-instructions.md`
- Property Assessment Guide: `backend/.github/copilot-instructions.md` (comprehensive)
- SDK Documentation: `SDK/README.md`
- Config Management: `config/README.md`

---

**Remember**: This is a government OS platform with AI agent coordination, not a traditional web application. Development focuses on service coordination, data isolation, and compliance rather than deployment/hosting.
