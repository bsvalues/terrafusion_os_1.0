# TerraFusion OS – Copilot Working Rules

Scope: This repo is an OS of cooperating services (not a web app). Prefer VS Code tasks and service entry points over ad‑hoc scripts or containers.

Operate Services via Tasks (VS Code → Tasks: Run Task):
- Build: "Build TerraFusion Elite Government OS"
- Run API: "Launch TerraFusion API Gateway" (http://localhost:5000)
- Run Consciousness: "Launch TerraFusion Consciousness Engine" (http://localhost:3004)
- Degraded smoke: "Launch Core Services (Degraded)" (skips noncritical health checks)

Critical Guardrails:
- County data is sovereign. Never modify production tenant configs without explicit approval.
- Tenant config: `config/tenant.{county}.yaml` (secrets via `${ENV_VAR}`; audit logging required).
- Do not propose containers or generic hosting. These are OS services run locally via tasks.

Backend Patterns (/.NET 8):
- Services live in `backend/` (e.g., `TerraFusion.API`, `TerraFusion.Consciousness`, `TerraFusion.Data`).
- Data: use EF Core patterns in `TerraFusion.Data`; keep schema changes minimal and scoped.
- Keep diffs surgical: don’t reformat or rename broadly; don’t add license headers.

Terrabuild Modernization (Node/TS):
- Dual‑port dev (client 5002, server dynamic), production single port 5000.
- Use Drizzle “push” flow; schema in `terrabuild-modernization/shared/schema.ts`.
- Respect Vite aliases: `@/` (client), `@shared/` (shared). Don’t hardcode ports.

AI/Agents:
- MCP agents extend the BaseAgent pattern (see `terrabuild-modernization/server/mcp/agents/`).
- Use the agent registry/event bus provided; don’t invent custom orchestration.

Marketplace Notes:
- API scaffolding lives under `marketplace/` (foundation phase). If asked to add routes: Express+TS, JWT, helmet, rate limits; gateway route via `backend/TerraFusion.Gateway/ocelot.json` → `/api/marketplace/*` → port 3001.

Compliance & Testing:
- Meet FISMA‑High expectations: auth required, audit trails, rate limiting where applicable.
- Prefer running the provided tasks; for backend, build `backend/TerraFusion.sln` and run services above.

Useful References:
- `backend/TerraFusion.API/`, `backend/TerraFusion.Consciousness/`
- `config/tenant.{county}.yaml`
- `terrabuild-modernization/shared/schema.ts`
- `marketplace/testing/e2e/` (Playwright patterns)
- `backend/TerraFusion.Gateway/ocelot.json`

Default stance: keep changes minimal, respect tenant isolation, and align with existing service/task workflows.# TerraFusion OS 1.0 - AI Agent Development Guide

## System Overview

**TerraFusion OS** is a production government AI operating system deployed for Washington State counties. This is NOT a web application—it's an **operating system layer** with multi-tenant county isolation, 50,000+ AI agent swarm coordination, and government-grade compliance (FISMA-High, FedRAMP, NIST 800-53).

**Mission**: "Government. Transcended." - Championship-level automation, quantum optimization, 99.9% SLA targets.

---

## 🎯 Critical Context: Multi-Workspace Government OS

**Before starting any work**: Read the workspace-specific `.github/copilot-instructions.md` in your target folder. This file provides the "big picture" that ties workspaces together.

### Current Workspace Structure

**TerraFusion uses VS Code multi-root workspaces** for orchestration. The `workspaces/` folder contains 50+ `.code-workspace` files that load different combinations of the physical directories below:

```
terrafusion_os_1.0/
├── os-platform/development/tools/
│   └── TerraFusionIDE/           # 🎯 Monaco-based IDE with 1,008 AI agents
│       ├── .claude/CLAUDE.md      # Comprehensive IDE development guide
│       ├── package.json           # Basic IDE (port 5173)
│       ├── package-ultimate.json  # Full AI swarm version
│       └── src/components/        # React 18 + Monaco Editor
│
├── SDK/                           # 🎯 Module development kit
│   ├── .github/copilot-instructions.md  ⭐ SDK-specific guide
│   ├── COUNTY_ISOLATION_GUIDE.md  🚨 CRITICAL: Read before any dev
│   ├── README.md                  # Production SDK documentation
│   ├── scripts/                   # Module generators and automation
│   ├── modules/                   # Government modules (terra-levy, terra-pilt, etc.)
│   └── tools/                     # Development and testing utilities
│
├── config/                        # 🎯 Tenant-specific county configs
│   ├── .github/copilot-instructions.md  ⭐ Configuration guide
│   ├── tenant.{county}.yaml       # Per-county configurations (benton, yakima, etc.)
│   ├── ai-consciousness-deployment.json  # 50,000 agent swarm config
│   ├── ai-system-prompts.json     # Government AI decision prompts
│   └── terrafusion-brand-context.json    # "Government. Transcended." voice
│
├── docs/                          # 🎯 Documentation hub
│   ├── .github/copilot-instructions.md  ⭐ Documentation standards
│   ├── README.md                  # Benton County delivery package
│   ├── ARCHITECTURE.md            # System architecture
│   ├── API_REFERENCE.md           # API documentation
│   └── testing/                   # Test documentation
│
└── workspaces/                    # 🎯 VS Code workspace orchestration
    ├── master.code-workspace      # Complete TerraFusion OS
    ├── backend.code-workspace     # Backend microservices focus
    ├── frontend.code-workspace    # React 18 + Quantum UI focus
    ├── sdk.code-workspace         # Module development focus
    ├── terrabuild-modernization.code-workspace  # Property assessment
    ├── government-edition.code-workspace        # Government apps suite
    └── ... (50+ specialized workspaces)
```

**VS Code Workspace Pattern**: Open `workspaces/{name}.code-workspace` to load relevant folders with proper context. For example:
- `backend.code-workspace` → Loads backend/, config/, docs/
- `frontend.code-workspace` → Loads frontend/, config/, docs/
- `master.code-workspace` → Loads all directories for full-system work

**Important**: Frontend (`../frontend/`), Backend (`../backend/`), and TerraBuild (`../terrabuild-modernization/`) (`../frontend/`), Backend (`../backend/`), and TerraBuild (`../terrabuild-modernization/`) are separate repositories integrated via SDK patterns.



### Key VS Code Workspaces (workspaces/)

**Specialized Development Contexts** (50+ workspace files for different focus areas):

- **master.code-workspace** - Complete TerraFusion OS (all folders)
- **backend.code-workspace** - .NET 8 microservices development
- **frontend.code-workspace** - React 18 + Quantum UI development
- **sdk.code-workspace** - Module and plugin development
- **terrabuild-modernization.code-workspace** - Property assessment system
- **government-edition.code-workspace** - Government application suite
- **leafscope.code-workspace** - GIS and geospatial services
- **consciousness.code-workspace** - AI agent swarm coordination
- **security.code-workspace** - FISMA-High security focus
- **infrastructure.code-workspace** - DevOps and deployment
- **development.code-workspace** - Core development tools (TerraFusionIDE)

**Usage**: `code workspaces/{name}.code-workspace` loads the appropriate folder combination with task definitions, debugging configs, and extensions for that context.

------

## 🚨 County Data Isolation (MANDATORY)

**Government Compliance Requirement**: TerraFusion manages 39 counties with sovereign data boundaries.

### Non-Negotiable Rules

```csharp
// ✅ CORRECT: All county-scoped entities use Guid foreign keys
public class PropertyAssessment {
    public Guid Id { get; set; }
    public Guid CountyId { get; set; }  // MUST be Guid, never int
    public County County { get; set; }
    
    // Audit fields (auto-populated by AuditableEntityInterceptor)
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreatedBy { get; set; }
    public string UpdatedBy { get; set; }
}

// ✅ CORRECT: All repository methods include countyCode parameter
public interface IPropertyRepository {
    Task<Property> GetByIdAsync(Guid countyCode, Guid propertyId);
    Task<List<Property>> GetByCountyAsync(Guid countyCode);
    // ❌ NEVER: Task<List<Property>> GetAllAsync(); // Cross-county leak!
}

// ✅ CORRECT: All queries filter by CountyId
return await _context.Properties
    .Where(p => p.CountyId == countyCode && p.Id == propertyId)
    .SingleOrDefaultAsync();
```

**Reference Implementation**: 
- `SDK/COUNTY_ISOLATION_GUIDE.md` - Complete patterns and testing
- `backend/tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs` - Working examples

---

## 🔧 Technology Stack

### TerraFusion IDE (os-platform/development/tools/TerraFusionIDE)
- **React 18.2.0** + **TypeScript 5.2.2** + **Monaco Editor 0.45.0**
- **Vite 5.0.8** (dev server), **Tailwind CSS 4.1.14** (styling)
- **1,008 AI agents** for government development assistance
- **County-aware autocomplete** with Benton County functions

### SDK Modules
- **React 18** + **TypeScript** for frontend components
- **C# .NET 8.0** for backend services
- **Module manifest** pattern for government compliance
- **County isolation** enforced at SDK level

### Backend Integration (external repositories)
- **.NET 8.0** microservices (ports: 5000 API, 3002 Gateway, 3004 AI)
- **PostgreSQL 15+** with **PostGIS** for geospatial
- **Redis 7+** caching, **Prometheus/Grafana** monitoring

### AI Infrastructure
- **50,000 agent swarm** (Supreme Commander coordination)
- **Claude-4-Opus-Supreme** (strategic), **1,008 specialized agents** (tactical)
- **Quantum optimization factor**: 949 (performance multiplier)

---

## 🚀 Development Workflows

### Run TerraFusion IDE

```bash
cd os-platform/development/tools/TerraFusionIDE/
npm install
npm run dev  # Basic IDE at http://localhost:5173

# Ultimate Power version (full AI swarm integration)
npm run build:ultimate && npm run dev:ultimate
```

**Features**:
- Full Monaco Editor with TypeScript support
- County-aware autocomplete (Benton County functions)
- AI Assistant with RAG services integration
- Real-time county data context panel

### Create New Government Module

```bash
cd SDK/
./scripts/create-module.sh --name="my-county-module" --type="government"

# ALWAYS include county isolation in manifest.json
{
  "name": "my-government-module",
  "type": "government-module",
  "countyIsolation": { "enabled": true, "required": true },
  "security": { 
    "authentication": "required",
    "authorization": "rbac",
    "compliance": ["FISMA-High", "NIST-800-53"]
  }
}
```

**SDK Tools**:
```bash
SDK/tools/validate-manifest.sh --module="my-module"
SDK/tools/test-module.sh --module="my-module"
SDK/tools/deploy-local.sh --module="my-module"
```

### Configuration Management

```bash
cd config/

# Validate tenant configuration
python validate_tenant_config.py --county=benton

# Check security compliance
python security_audit_config.py --fisma-high

# Test environment configs
npm run config:validate --env=development
```

---

## 📁 Configuration Patterns

### County-Specific Configs (config/tenant.{county}.yaml)

```yaml
countyId: "benton"
displayName: "Benton County, WA"
harris_pacs:
  connection_string: "${HARRIS_PACS_CONNECTION}"  # ${ENV_VAR} placeholder
  sync_interval_minutes: 15
sla_targets:
  availability: 0.999              # 99.9% minimum
  response_time_p95_ms: 150
  accuracy_target: 0.999
feature_flags:
  ai_swarm_enabled: true
  quantum_optimization: true
  real_time_sync: true
security:
  sso_provider: "AzureAD"
  mfa_required: true
  audit_logging: true
```

### AI System Configuration (config/)

- **ai-consciousness-deployment.json**: 50,000 agent swarm settings
- **ai-integration-enhancement.json**: County-specific AI allocation
- **ai-specialization-enhancement.json**: Specialized capabilities per service
- **ai-system-prompts.json**: Government decision-making prompts

**Rule**: NEVER hardcode secrets. Use `${ENV_VAR}` placeholders or Azure Key Vault.

---

## 🏛️ Government Compliance Standards

### FISMA-High Requirements (All Workspaces)

1. **County Data Isolation**: ALL queries filter by `CountyId` (Guid)
2. **Audit Trail**: Auto-populated fields (`CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy`)
3. **Authentication**: JWT Bearer tokens, multi-factor authentication
4. **Authorization**: Role-based access control (RBAC)
5. **Encryption**: TLS 1.2+ transit, AES-256 at rest
6. **Secrets**: User Secrets (dev), Azure Key Vault (prod)

### County SLA Targets

- **Availability**: 99.9% minimum (4.3 hours/year downtime budget)
- **Performance**: P95 response time <150ms for citizen operations
- **Accuracy**: 99.9% for property assessment AI agents
- **Data Sync**: 15-minute intervals for Harris PACS integration

### Testing Requirements

**ALL new features MUST include**:
- County isolation tests (0 cross-county leaks)
- Security validation (FISMA compliance)
- Performance benchmarks (SLA targets)
- Accessibility checks (Section 508)

**Reference**: `backend/tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs`

---

## 🎨 TerraFusion Design System

### Brand Voice (config/terrafusion-brand-context.json)

- **Tagline**: "Government. Transcended."
- **Mission**: Infrastructure Intelligence, Infinite Scale
- **Tone**: Championship excellence, quantum optimization
- **Quality Bar**: 99.5% accuracy, <10ms API response, 99.99% uptime

### Core Colors (Terra-Cyan Quantum Theme)

```css
/* config/ui-brand-guidelines.json */
--terra-cyan: #00FFFF;           /* Primary quantum accent */
--terra-midnight: #0A0E1A;       /* Background void */
--terra-blue: #0080FF;           /* Secondary network */
--terra-transcend: #00FFEE;      /* Transcendent highlight */
```

**Rule**: New UI components MUST follow TerraFusion design tokens.

---

## 🤖 AI Agent Integration

### Agent Development Template (SDK/scripts/create-ai-agent.sh)

```typescript
class CustomAIAgent extends AIAgentBase {
  constructor(config) {
    super(config);
    this.type = 'CUSTOM_AGENT';
    this.capabilities = ['data-analysis', 'prediction'];
  }
  
  async executeTask(task) {
    // Custom AI logic
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

// Register with Supreme Commander
SupremeCommanderClaude.registerAgent(customAgent);
```

### AI System Architecture

- **Supreme Commander**: Claude-4-Opus-Supreme (orchestration)
- **Field Generals**: 32 tactical coordinators
- **Specialist Workers**: 500 task execution agents
- **Property Assessment**: 200 Benton County expertise agents
- **Compliance Validation**: 150 government regulation agents

---

## 🔍 Common Pitfalls

### ❌ WRONG: Cross-County Data Access

```csharp
// Missing county filter - FORBIDDEN
var allProperties = await _context.Properties.ToListAsync();
```

### ✅ CORRECT: County-Scoped Access

```csharp
// Always filter by CountyId
var properties = await _context.Properties
    .Where(p => p.CountyId == countyCode)
    .ToListAsync();
```

### ❌ WRONG: Hardcoded Secrets

```json
{
  "database": "Server=prod.db.com;Password=secret123"
}
```

### ✅ CORRECT: Environment Variable Placeholders

```json
{
  "database": "${DB_CONNECTION_STRING}"
}
```

### ❌ WRONG: Manual Audit Fields

```csharp
entity.CreatedAt = DateTime.UtcNow;  // Auto-populated, don't set manually
```

### ✅ CORRECT: Let Interceptor Handle It

```csharp
// AuditableEntityInterceptor auto-sets CreatedAt/UpdatedAt/CreatedBy/UpdatedBy
await _context.SaveChangesAsync();
```

---

## 📚 Essential Documentation

### By Workspace

**SDK** (`SDK/`):
1. `.github/copilot-instructions.md` - SDK development guide
2. `README.md` - Production SDK documentation
3. `COUNTY_ISOLATION_GUIDE.md` 🚨 CRITICAL before data work

**Config** (`config/`):
1. `.github/copilot-instructions.md` - Configuration management
2. `terrafusion-brand-context.json` - Brand voice and standards
3. Validation scripts for tenant configs

**Docs** (`docs/`):
1. `.github/copilot-instructions.md` - Documentation standards
2. `README.md` - Benton County delivery overview
3. `ARCHITECTURE.md`, `API_REFERENCE.md` - Technical specs

**TerraFusionIDE** (`os-platform/development/tools/TerraFusionIDE/`):
1. `.claude/CLAUDE.md` - Comprehensive IDE guide
2. `README.md` - Quick start and features
3. `START_HERE_TERRAFUSION_WAY.md` - Getting started

---

## 🚀 Quick Reference Commands

```bash
# TerraFusion IDE development
cd os-platform/development/tools/TerraFusionIDE/
npm run dev                        # Basic IDE
npm run build:ultimate             # Full AI swarm

# SDK module development
cd SDK/
./scripts/create-module.sh --name="module" --type="government"
./tools/validate-manifest.sh --module="module"
./tools/test-module.sh --module="module"

# Configuration validation
cd config/
python validate_tenant_config.py --county=benton
npm run config:validate --env=development

# Documentation
cd docs/
# All new docs go here (never in root)
```

---

## ⚠️ Critical Rules (Never Violate)

1. **County Isolation**: ALL data queries MUST filter by `CountyId` (Guid)
2. **Audit Fields**: NEVER manually set `CreatedAt/UpdatedAt/CreatedBy/UpdatedBy`
3. **Secrets**: NEVER commit connection strings, API keys, credentials
4. **Testing**: ALL new features require county isolation tests (0 cross-county leaks)
5. **Configuration**: Use `${ENV_VAR}` placeholders, never hardcode
6. **Documentation**: ALL docs go in `docs/` directory (not root)

---

## 🎯 Pre-Merge Checklist

Before submitting any PR:

- [ ] Read workspace-specific `.github/copilot-instructions.md`
- [ ] County isolation tests pass (0 cross-county leaks)
- [ ] All entities use `Guid CountyId` foreign keys
- [ ] All repository methods include `countyCode` parameter
- [ ] No hardcoded secrets (use `${ENV_VAR}` placeholders)
- [ ] FISMA-High security requirements met
- [ ] Audit logging implemented for all operations
- [ ] Section 508 accessibility validated
- [ ] Performance benchmarks meet SLA targets

---

## 🏆 Integration Points

- **Backend Services**: `../backend/` (.NET 8 microservices - see backend-specific copilot-instructions)
- **Frontend**: `../frontend/` (React 18 + Quantum UI - see frontend-specific copilot-instructions)
- **TerraBuild**: `../terrabuild-modernization/` (property assessment - see terrabuild-specific copilot-instructions)
- **Ecosystem**: `../ecosystem/intake/` (legacy app modernization - see intake-specific copilot-instructions)

**Note**: These are external repositories integrated via SDK patterns. Refer to their respective `.github/copilot-instructions.md` when working across boundaries.

---

**Execute with championship excellence. Government. Transcended.**


