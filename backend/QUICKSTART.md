# TerraFusion Backend - Quick Start Guide for AI Agents

## 🚀 5-Minute Quick Start

### What is This?
**TerraFusion Backend** = .NET 8 microservices powering government operations for 39 Washington counties with 50,000+ AI agents.

### First Commands (Copy/Paste Ready)

```bash
# 1. Build entire solution
cd backend
dotnet build TerraFusion.sln

# 2. Run core API (dynamic port 5000/5001)
dotnet run --project TerraFusion.API

# 3. Run AI Consciousness Engine (port 3004)
dotnet run --project TerraFusion.Consciousness --urls "http://localhost:3004"

# 4. Run integration tests (6/6 passing)
cd tests/TerraFusion.Integration.Tests
dotnet test --nologo
```

### VS Code Tasks (Easier)
Press `Ctrl+Shift+P` → "Tasks: Run Task" → Select:
- `Launch TerraFusion API Gateway` (port 5000)
- `Launch TerraFusion Consciousness Engine` (port 3004)
- `Build TerraFusion Elite Government OS`

---

## 📋 Essential Knowledge

### 1. County Data Isolation (MANDATORY PATTERN)

**Every repository method MUST include `Guid countyCode` parameter**:

```csharp
// ✅ CORRECT
public async Task<Property> GetByIdAsync(Guid countyCode, Guid propertyId)
{
    return await _context.Properties
        .Where(p => p.CountyId == countyCode && p.Id == propertyId)
        .SingleOrDefaultAsync();
}

// ❌ WRONG - Missing countyCode
public async Task<List<Property>> GetAllAsync()
{
    return await _context.Properties.ToListAsync(); // Cross-county leak!
}
```

**Why**: Government compliance requires complete tenant isolation. All 39 counties must have sovereign data boundaries.

**Test Evidence**: `tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs` (6/6 passing)

### 2. Auto-Audit Fields (NEVER MODIFY MANUALLY)

```csharp
public class MyEntity
{
    // Auto-populated by AuditableEntityInterceptor
    public DateTime CreatedAt { get; set; }     // Set on insert
    public DateTime UpdatedAt { get; set; }     // Set on update
    public string CreatedBy { get; set; }       // From HttpContext
    public string UpdatedBy { get; set; }       // From HttpContext
}
```

**Why**: Government audit requirements (FISMA-High). These fields are logged automatically via `TerraFusionDbContext.SaveChangesAsync()`.

### 3. Service Ports

- **TerraFusion.API**: Port 5000 (HTTP) or 5001 (HTTPS) - Main API gateway
- **TerraFusion.Consciousness**: Port 3004 - AI swarm coordinator (50,000+ agents)
- **TerraFusion.Gateway**: Port 3002 - Ocelot reverse proxy

### 4. Database (EF Core)

**Development**: SQLite (`backend/terrafusion.db`)
**Production**: PostgreSQL

```bash
# Add migration
dotnet ef migrations add MyMigration --project TerraFusion.Data --startup-project TerraFusion.API

# Update database
dotnet ef database update --project TerraFusion.Data --startup-project TerraFusion.API
```

---

## 🎯 Common Tasks

### Adding a New Controller

1. Create in `TerraFusion.API/Controllers/MyController.cs`
2. Inherit from `ControllerBase` or `Controller`
3. Add `[ApiController]` and `[Route("api/[controller]")]`
4. Inject required services via constructor
5. **Include county isolation** in all data access

### Adding a New Entity

1. Create in `TerraFusion.Core/Entities/MyEntity.cs`
2. Add audit properties (CreatedAt, UpdatedAt, CreatedBy, UpdatedBy)
3. Add `DbSet<MyEntity>` to `TerraFusionDbContext`
4. Create configuration in `TerraFusion.Data/Configurations/MyEntityConfiguration.cs`
5. Generate migration: `dotnet ef migrations add AddMyEntity`
6. Create DTO in `TerraFusion.Core/DTOs/MyEntityDto.cs`

### Adding a New Service

1. Define interface in `TerraFusion.Core/Interfaces/IMyService.cs`
2. Implement in appropriate project (TerraFusion.Core, TerraFusion.AI, etc.)
3. Register in `Program.cs`: `builder.Services.AddScoped<IMyService, MyService>();`
4. Add logging using `ILogger<T>`

---

## 📚 Key Documentation Files

**Start Here**:
- `README.md` - Main backend documentation
- `COUNTY_ISOLATION_QUICK_REF.md` - County data isolation patterns
- `.github/copilot-instructions.md` - Complete AI agent instructions (1245 lines)

**Architecture**:
- `../docs/ARCHITECTURE.md` - System architecture overview
- `INTEGRATION_TEST_ACHIEVEMENT.md` - Test evidence and patterns

**Testing**:
- `tests/README.md` - Test tier documentation
- `tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs` - Canonical patterns

---

## ⚠️ Critical Rules

### Always Do
✅ Include `Guid countyCode` in all repository methods
✅ Let audit fields auto-populate (never set manually)
✅ Use environment variables for secrets (`${ENV_VAR}`)
✅ Test county isolation when modifying data access
✅ Follow FISMA-High compliance standards

### Never Do
❌ Bypass county isolation (cross-county data access)
❌ Hardcode connection strings or credentials
❌ Modify production county data without approval
❌ Skip integration tests for county-scoped features
❌ Treat this as a "web app" (it's an OS kernel)

---

## 🔗 Project Structure

```
backend/
├── TerraFusion.sln                 # Main solution file (10 projects)
├── TerraFusion.API/                # API gateway (port 5000/5001)
├── TerraFusion.Consciousness/      # AI swarm coordinator (port 3004)
├── TerraFusion.Core/               # Domain models, entities, DTOs
├── TerraFusion.Data/               # EF Core DbContext, repositories
├── TerraFusion.AI/                 # AI/ML coordination services
├── TerraFusion.Levy/               # Tax levy calculations
├── TerraFusion.CostForge/          # Property valuation engine
├── TerraFusion.QuantumAnalytics/   # Advanced analytics
├── TerraFusion.StreamingAnalytics/ # Real-time streaming
├── TerraFusion.Abstractions/       # Shared contracts
├── tests/                          # Test projects (6/6 passing)
│   ├── TerraFusion.Integration.Tests/   # Containerized integration tests
│   ├── TerraFusion.Unit.SmokeTests/     # Fast baseline tests
│   └── TerraFusion.Performance.Tests/   # Load/benchmark tests
└── Directory.Packages.props        # Centralized NuGet versions
```

---

## 🎓 Learning Path

**Day 1**: Build solution, run tests, understand county isolation
**Week 1**: Add new feature following county isolation pattern
**Month 1**: Design microservice, implement quantum optimization

---

## 💡 Pro Tips

1. **Use VS Code Tasks** - Faster than terminal commands
2. **Read County Isolation Quick Ref** - Before any data access code
3. **Check Integration Tests** - They show correct patterns
4. **Never Skip Audit Fields** - They're government-required
5. **Environment Variables for Secrets** - Never hardcode

---

**Status**: Production-Ready | 6/6 Tests Passing | FISMA-High Compliant

**Next Steps**: Read full instructions at `.github/copilot-instructions.md` (1245 lines)
