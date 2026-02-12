# Terrafusion OS 1.0 - Production SDK

## Government AI Platform Developer Kit

**Version**: 1.0.0
**Release Date**: August 31, 2025
**Target Audience**: Mid to Senior-level Software Engineers
**Classification**: Production-Ready Government Platform SDK

---

## Overview

The Terrafusion OS SDK provides everything needed to develop, extend, and deploy government AI applications on the Terrafusion platform. This SDK includes boilerplate code, environment configurations, deployment scripts, test data, and comprehensive documentation.

### What's Included

```
SDK/
├── boilerplate/               # Starter templates and code generators
├── configs/                   # Environment and deployment configurations
├── scripts/                   # Automation and deployment scripts
├── test-data/                # Sample data for development and testing
├── docs/                     # Comprehensive documentation
├── examples/                 # Working example implementations
├── tools/                    # Development and debugging tools
└── templates/                # Infrastructure and application templates
```

---

## Quick Start

### Prerequisites

```bash
# Required software versions
node >= 18.0.0
npm >= 8.0.0
dotnet >= 8.0.0
docker >= 24.0.0
kubectl >= 1.28.0
terraform >= 1.6.0
```

### ⚠️ County Isolation Requirements (CRITICAL)

**Before developing any government module**, understand TerraFusion's strict county data isolation:

- ✅ **ALL county-scoped entities** MUST use `Guid CountyId` foreign keys (not `int`)
- ✅ **ALL repository methods** MUST include `Guid countyCode` parameter
- ✅ **ALL queries** MUST filter by `CountyId` in WHERE clauses
- ❌ **NEVER** query without county filtering (prevents cross-county data leaks)

**Essential Reading**:
- **[SDK County Isolation Guide](./COUNTY_ISOLATION_GUIDE.md)** - ⭐ Complete SDK-specific guide with examples
- [Backend County Isolation Quick Reference](../backend/COUNTY_ISOLATION_QUICK_REF.md) - Fast developer guide
- [CountyIsolationTests.cs](../backend/tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs) - Reference implementation

**Why This Matters**: TerraFusion manages data for 39 counties. Cross-county data leaks violate FISMA-High, FedRAMP, and government compliance requirements. **All modules MUST prove county isolation through automated tests.**

### Initialize New Terrafusion Module

```bash
# Create new government module
./SDK/scripts/create-module.sh --name="my-county-module" --type="government"

# Create new commercial plugin
./SDK/scripts/create-module.sh --name="my-plugin" --type="commercial"

# Create new AI agent
./SDK/scripts/create-ai-agent.sh --name="my-agent" --swarm="custom"
```

### Local Development Setup

```bash
# Initialize development environment
./SDK/scripts/dev-setup.sh

# Start Terrafusion OS with your module
./SDK/scripts/dev-start.sh --module="my-county-module"

# Run integration tests
./SDK/scripts/test-integration.sh
```

---

## Architecture Components

### 1. Module Development Framework

#### Module Manifest Structure

```json
{
  "name": "my-government-module",
  "version": "1.0.0",
  "displayName": "My County Government Module",
  "description": "Custom government functionality with county isolation",
  "type": "government-module",
  "tier": "tier2",
  "capabilities": [
    "property-management",
    "tax-processing",
    "citizen-services"
  ],
  "dependencies": ["government-edition", "ai-command-brain"],
  "countyIsolation": {
    "enabled": true,
    "required": true,
    "validation": "automated-tests"
  },
  "api": {
    "endpoints": [
      "/api/my-module/properties",
      "/api/my-module/taxes"
    ],
    "countyScoped": true
  },
  "security": {
    "authentication": "required",
    "authorization": "rbac",
    "dataIsolation": "county-tenant",
    "compliance": ["FISMA-High", "FedRAMP", "NIST-800-53"]
  },
  "testing": {
    "countyIsolationTests": "required",
    "integrationTests": "recommended"
  }
}
```

#### Component Architecture

```typescript
// Frontend Component (React 18 + TypeScript)
interface ModuleComponent {
  name: string;
  props: ModuleProps;
  state: ModuleState;
  services: ModuleServices;
}

// Backend Service (C# .NET 8)
public interface IModuleService {
  Task<ModuleResult> ProcessAsync(ModuleRequest request);
  Task<HealthStatus> GetHealthAsync();
  Task<MetricsData> GetMetricsAsync();
}
```

### 2. AI Agent Development

#### Agent Template

```javascript
class CustomAIAgent extends AIAgentBase {
  constructor(config) {
    super(config);
    this.type = 'CUSTOM_AGENT';
    this.capabilities = ['data-analysis', 'prediction'];
  }

  async executeTask(task) {
    // Custom AI logic implementation
    return await this.processWithAI(task);
  }

  async reportMetrics() {
    return {
      tasksCompleted: this.metrics.completed,
      efficiency: this.calculateEfficiency(),
      status: this.status
    };
  }
}
```

#### Swarm Integration

```javascript
// Register with Supreme Commander
SupremeCommanderClaude.registerAgent(customAgent);

// Deploy to swarm
const swarm = await deploySwarm('CUSTOM', 50);
await swarm.addAgent(customAgent);
```

### 3. Database Integration

#### Entity Definition with County Isolation

**CRITICAL**: All county-scoped entities MUST use `Guid` for foreign keys to ensure government-grade data isolation.

```csharp
public class CustomEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; }

    // ✅ REQUIRED: County isolation (MUST be Guid, not int)
    public Guid CountyId { get; set; }
    public County County { get; set; }

    // Optional: User ownership tracking
    public Guid? UserId { get; set; }
    public GovernmentUser User { get; set; }

    // Audit fields (automatically populated)
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreatedBy { get; set; }
    public string UpdatedBy { get; set; }
}
```

#### Repository Pattern with County Scoping

**ALL repository methods MUST include `countyCode` parameter for government compliance.**

```csharp
// Repository Interface
public interface ICustomEntityRepository
{
    // ✅ CORRECT: All methods include Guid countyCode parameter
    Task<CustomEntity> GetByIdAsync(Guid countyCode, Guid entityId);
    Task<List<CustomEntity>> GetByCountyAsync(Guid countyCode);
    Task<CustomEntity> CreateAsync(CustomEntity entity, Guid countyCode);
    Task<CustomEntity> UpdateAsync(CustomEntity entity, Guid countyCode);
    Task DeleteAsync(Guid entityId, Guid countyCode);

    // ❌ WRONG: Never create methods without county filtering
    // Task<List<CustomEntity>> GetAllAsync(); // Cross-county leak!
}

// Repository Implementation
public class CustomEntityRepository : ICustomEntityRepository
{
    private readonly ITerraFusionDbContext _context;

    public async Task<CustomEntity> GetByIdAsync(Guid countyCode, Guid entityId)
    {
        // ✅ ALWAYS filter by CountyId
        return await _context.CustomEntities
            .Where(e => e.CountyId == countyCode && e.Id == entityId)
            .SingleOrDefaultAsync();
    }

    public async Task<List<CustomEntity>> GetByCountyAsync(Guid countyCode)
    {
        // ✅ County-scoped query
        return await _context.CustomEntities
            .Where(e => e.CountyId == countyCode)
            .ToListAsync();
    }

    public async Task<CustomEntity> CreateAsync(CustomEntity entity, Guid countyCode)
    {
        // ✅ Enforce CountyId
        entity.CountyId = countyCode;
        entity.CreatedAt = DateTime.UtcNow;

        _context.CustomEntities.Add(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<CustomEntity> UpdateAsync(CustomEntity entity, Guid countyCode)
    {
        // ✅ Verify entity belongs to county before updating
        var existing = await GetByIdAsync(countyCode, entity.Id);
        if (existing == null)
            throw new InvalidOperationException($"Entity not found in county {countyCode}");

        existing.Name = entity.Name;
        existing.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return existing;
    }

    public async Task DeleteAsync(Guid entityId, Guid countyCode)
    {
        // ✅ Only delete within specified county
        var entity = await GetByIdAsync(countyCode, entityId);
        if (entity != null)
        {
            _context.CustomEntities.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }
}
```

#### Service Implementation with County Isolation

```csharp
public class CustomEntityService : ICustomEntityService
{
    private readonly ICustomEntityRepository _repository;
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;

    public CustomEntityService(
        ICustomEntityRepository repository,
        IMapper mapper,
        IConfiguration configuration)
    {
        _repository = repository;
        _mapper = mapper;
        _configuration = configuration;
    }

    public async Task<CustomEntityDto> CreateAsync(CreateCustomEntityDto dto)
    {
        // Get county code from configuration (tenant-scoped)
        var countyCode = Guid.Parse(_configuration["County:Code"]);

        var entity = _mapper.Map<CustomEntity>(dto);

        // Repository enforces CountyId
        var created = await _repository.CreateAsync(entity, countyCode);

        return _mapper.Map<CustomEntityDto>(created);
    }

    public async Task<List<CustomEntityDto>> GetAllForCountyAsync()
    {
        var countyCode = Guid.Parse(_configuration["County:Code"]);

        var entities = await _repository.GetByCountyAsync(countyCode);

        return _mapper.Map<List<CustomEntityDto>>(entities);
    }
}
```

#### Testing County Isolation

**Reference Implementation**: See `backend/tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs`

```csharp
public class CustomEntityTests
{
    private TerraFusionDbContext CreateContext(string countyCode)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var mockConfig = new Mock<IConfiguration>();
        mockConfig.Setup(c => c["County:Code"]).Returns(countyCode);

        return new TerraFusionDbContext(options, mockConfig.Object);
    }

    [Fact]
    public async Task GetByCounty_ReturnsOnlyCountyData()
    {
        // Arrange: Create entities in multiple counties
        using var context = CreateContext("test-king-wa");
        var kingCountyId = Guid.NewGuid();
        var pierceCountyId = Guid.NewGuid();

        context.CustomEntities.AddRange(
            new CustomEntity { Id = Guid.NewGuid(), CountyId = kingCountyId, Name = "King 1" },
            new CustomEntity { Id = Guid.NewGuid(), CountyId = kingCountyId, Name = "King 2" },
            new CustomEntity { Id = Guid.NewGuid(), CountyId = pierceCountyId, Name = "Pierce 1" }
        );
        await context.SaveChangesAsync();

        // Act: Query for King County only
        var repository = new CustomEntityRepository(context);
        var result = await repository.GetByCountyAsync(kingCountyId);

        // Assert: Only King County data returned
        result.Should().HaveCount(2);
        result.Should().OnlyContain(e => e.CountyId == kingCountyId);
    }

    [Fact]
    public async Task UpdateEntity_OnlyAffectsTargetCounty()
    {
        // Arrange
        using var context = CreateContext("test-king-wa");
        var kingCountyId = Guid.NewGuid();
        var pierceCountyId = Guid.NewGuid();

        var kingEntity = new CustomEntity { Id = Guid.NewGuid(), CountyId = kingCountyId, Name = "Original" };
        var pierceEntity = new CustomEntity { Id = Guid.NewGuid(), CountyId = pierceCountyId, Name = "Pierce" };

        context.CustomEntities.AddRange(kingEntity, pierceEntity);
        await context.SaveChangesAsync();

        // Act: Update King County entity
        var repository = new CustomEntityRepository(context);
        kingEntity.Name = "Updated";
        await repository.UpdateAsync(kingEntity, kingCountyId);

        // Assert: Pierce County entity unchanged
        var pierceResult = await repository.GetByIdAsync(pierceCountyId, pierceEntity.Id);
        pierceResult.Name.Should().Be("Pierce");
    }
}
```

**County Isolation Validation**: All module data access MUST pass similar tests proving zero cross-county leaks.

---

## Development Tools

### 1. Code Generators

```bash
# Generate complete module structure
./SDK/tools/generate-module.sh \
  --name="my-module" \
  --type="government" \
  --features="auth,audit,ai"

# Generate API controller
./SDK/tools/generate-controller.sh \
  --name="CustomController" \
  --entity="CustomEntity" \
  --crud=true

# Generate React component
./SDK/tools/generate-component.sh \
  --name="CustomComponent" \
  --type="page" \
  --mui=true
```

### 2. Testing Utilities

```bash
# Run module-specific tests
./SDK/tools/test-module.sh --module="my-module"

# Performance benchmarking
./SDK/tools/benchmark-module.sh --module="my-module"

# Security scanning
./SDK/tools/security-scan.sh --module="my-module"

# Integration testing with Terrafusion core
./SDK/tools/integration-test.sh --module="my-module"
```

### 3. Deployment Tools

```bash
# Local development deployment
./SDK/tools/deploy-local.sh --module="my-module"

# Staging environment deployment
./SDK/tools/deploy-staging.sh --module="my-module"

# Production deployment (with approvals)
./SDK/tools/deploy-production.sh --module="my-module" --county="my-county"
```

---

## Configuration Templates

### 1. Environment Configuration

```yaml
# development.yaml
environment: development
database:
  host: localhost
  port: 5432
  database: terrafusion_dev
  ssl: false
ai:
  swarmSize: 10
  debug: true
modules:
  loadAll: true
  hotReload: true
```

```yaml
# production.yaml
environment: production
database:
  host: ${{ secrets.DB_HOST }}
  port: 5432
  database: terrafusion_prod
  ssl: true
  poolSize: 100
ai:
  swarmSize: 1008
  optimization: quantum
modules:
  loadStrategy: selective
  healthChecks: true
compliance:
  fismaMode: true
  auditLevel: comprehensive
```

### 2. Kubernetes Configuration

```yaml
# Module deployment template
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ module-name }}
  labels:
    app.kubernetes.io/name: {{ module-name }}
    app.kubernetes.io/part-of: terrafusion-os
spec:
  replicas: 3
  selector:
    matchLabels:
      app: {{ module-name }}
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      containers:
      - name: {{ module-name }}
        image: terrafusion/{{ module-name }}:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: TERRAFUSION_MODULE_NAME
          value: "{{ module-name }}"
        - name: TERRAFUSION_AI_ENABLED
          value: "true"
```

---

## Sample Data & Examples

### 1. Government Property Data

```json
{
  "sampleProperties": [
    {
      "parcelNumber": "123456789",
      "address": "123 Government Way, County Seat, WA 99301",
      "ownerName": "Sample Property Owner",
      "assessedValue": 350000,
      "propertyType": "Residential",
      "squareFootage": 2100,
      "yearBuilt": 1995,
      "county": "Benton"
    }
  ],
  "sampleUsers": [
    {
      "email": "assessor@county.gov",
      "firstName": "John",
      "lastName": "Doe",
      "department": "Assessment",
      "role": "Assessor",
      "permissions": ["read:properties", "write:assessments"]
    }
  ]
}
```

### 2. AI Agent Examples

```javascript
// Property valuation AI agent
class PropertyValuationAgent extends AIAgentBase {
  async valuateProperty(property) {
    const marketData = await this.getMarketData(property.location);
    const comparables = await this.findComparables(property);
    const aiPrediction = await this.runMLModel(property, marketData, comparables);

    return {
      estimatedValue: aiPrediction.value,
      confidence: aiPrediction.confidence,
      factors: aiPrediction.contributingFactors,
      timestamp: new Date().toISOString()
    };
  }
}
```

---

## Best Practices

### 1. Module Development

**Architecture Guidelines**:

- Follow the Terrafusion module manifest specification
- **CRITICAL**: Implement county isolation for all data access (see Database Integration section)
- Use `Guid` foreign keys for all county-scoped entities (never `int`)
- Include `countyCode` parameter in ALL repository methods
- Implement health checks and metrics endpoints
- Use the provided authentication and authorization frameworks
- Ensure FISMA compliance for government modules
- Implement comprehensive audit logging

**Code Standards**:

- Use TypeScript for frontend development
- Follow C# coding conventions for backend services
- **County Isolation**: Reference `backend/tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs` as canonical pattern
- Implement proper error handling and logging
- Write comprehensive unit and integration tests (including county isolation tests)
- Document all public APIs

**County Isolation Checklist** (MANDATORY for all government modules):

- [ ] All county-scoped entities use `Guid CountyId` foreign key
- [ ] All repository methods include `Guid countyCode` parameter
- [ ] All queries filter by `CountyId` in WHERE clauses
- [ ] Create operations set `entity.CountyId = countyCode`
- [ ] Update operations validate `countyCode` matches existing entity
- [ ] Delete operations filter by `countyCode`
- [ ] Integration tests verify multi-county data isolation
- [ ] No direct `_context.Entities.ToListAsync()` calls (missing county filter)

### 2. AI Agent Development

**Agent Design Principles**:

- Inherit from AIAgentBase for swarm integration
- Implement proper task queuing and result reporting
- Use the provided metrics and monitoring framework
- Ensure thread safety for concurrent operations
- Handle failures gracefully with retry logic

### 3. Security Requirements

**Security Checklist**:

- [ ] All API endpoints require authentication
- [ ] Sensitive data is encrypted at rest and in transit
- [ ] Audit logging is implemented for all operations
- [ ] Input validation prevents injection attacks
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies are regularly updated and scanned

---

## Troubleshooting

### Common Issues

**Module Loading Failures**:

```bash
# Check module manifest validity
./SDK/tools/validate-manifest.sh --module="my-module"

# Verify dependencies
./SDK/tools/check-dependencies.sh --module="my-module"

# Debug module initialization
./SDK/tools/debug-module.sh --module="my-module" --verbose
```

**AI Agent Problems**:

```bash
# Check agent registration
./SDK/tools/check-agent-status.sh --agent="my-agent"

# Monitor swarm health
./SDK/tools/swarm-monitor.sh --agent="my-agent"

# Debug agent communication
./SDK/tools/debug-agent.sh --agent="my-agent" --trace
```

**Database Connection Issues**:

```bash
# Test database connectivity
./SDK/tools/test-db-connection.sh

# Validate migration status
./SDK/tools/check-migrations.sh

# Debug Entity Framework issues
./SDK/tools/debug-ef.sh --verbose
```

---

## Support & Resources

### Documentation

- **[API Reference](docs/api-reference.md)**: Complete API documentation
- **[Module Development Guide](docs/module-development.md)**: Step-by-step module creation
- **[AI Agent Guide](docs/ai-agent-development.md)**: AI agent development patterns
- **[Deployment Guide](docs/deployment.md)**: Production deployment procedures
- **[Security Guide](docs/security.md)**: Security best practices and compliance

### Backend Reference Documentation

- **[Backend README](../backend/README.md)**: Complete backend architecture overview
- **[County Isolation Quick Reference](../backend/COUNTY_ISOLATION_QUICK_REF.md)**: ⭐ **Essential reading** - Fast developer guide for county data patterns
- **[Integration Test Achievement](../backend/INTEGRATION_TEST_ACHIEVEMENT.md)**: Test evidence and validation patterns
- **[Schema Standardization Log](../backend/SCHEMA_STANDARDIZATION_LOG.md)**: Entity relationship standards
- **[Test README](../backend/tests/README.md)**: Test tiers and county isolation validation

### Canonical Implementations

- **[CountyIsolationTests.cs](../backend/tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs)**: ⭐ Reference implementation for county-scoped testing
- **[PostgresContainerTests.cs](../backend/tests/TerraFusion.Integration.Tests/PostgresContainerTests.cs)**: Testcontainers infrastructure example

### Community

- **GitHub Repository**: <https://github.com/terrafusion/terrafusion-os>
- **Developer Portal**: <https://developers.terrafusion.gov>
- **Documentation**: <https://docs.terrafusion.gov>
- **Support**: <support@terrafusion.com>

---

## County Isolation Standards (Government Compliance)

**TerraFusion enforces strict tenant data boundaries across 39 Washington State counties.**

### Quick Reference

**Schema Standards**:
- All county-scoped entities: `public Guid CountyId { get; set; }`
- All user-scoped entities: `public Guid UserId { get; set; }`
- Reference entities: `County.Id` and `GovernmentUser.Id` are both `Guid`

**Repository Pattern**:
```csharp
// ✅ CORRECT
Task<Entity> GetByIdAsync(Guid countyCode, Guid entityId);

// ❌ WRONG
Task<List<Entity>> GetAllAsync(); // Missing countyCode - cross-county leak!
```

**Validation**: 6/6 integration tests passing with zero cross-county leaks detected.

**For complete patterns and examples**, see:
- [County Isolation Quick Reference](../backend/COUNTY_ISOLATION_QUICK_REF.md) - Comprehensive guide
- [CountyIsolationTests.cs](../backend/tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs) - Working examples

---

**SDK Version**: 1.0.0
**Compatibility**: Terrafusion OS 1.0+
**Last Updated**: August 31, 2025
**License**: Proprietary - Government & Commercial Use

*Developed by the Terrafusion team for building the future of government AI platforms.*
