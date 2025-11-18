# TerraFusion OS - Complete Workspace Guide

**"Your Map to Government. Transcended."**

---

## 🎯 Overview

TerraFusion OS is a multi-workspace government AI operating system with **6 specialized workspaces**, each with dedicated instructions and development workflows. This guide helps AI agents and developers navigate the entire ecosystem.

**Architecture**: OS Kernel + Specialized Modules (NOT a traditional web application)

**Scale**: 50,000+ AI agents serving 39 Washington State counties

---

## 📁 Workspace Structure

### 1. Backend Services (`backend/`)

**What**: .NET 8 microservices - OS kernel layer
**Primary Service**: Core government operations API

**Key Files**:
- `.github/copilot-instructions.md` - **PRIMARY INSTRUCTIONS** (1245 lines)
- `QUICKSTART.md` - 5-minute quick start for new developers
- `COUNTY_ISOLATION_QUICK_REF.md` - Mandatory data isolation patterns
- `README.md` - Comprehensive documentation

**Ports**:
- `5000/5001` - TerraFusion.API (main gateway)
- `3004` - TerraFusion.Consciousness (AI swarm coordinator)
- `3002` - TerraFusion.Gateway (Ocelot reverse proxy)

**Quick Start**:
```bash
cd backend
dotnet build TerraFusion.sln
dotnet run --project TerraFusion.API
```

**VS Code Tasks**: ✅ Available
- `Launch TerraFusion API Gateway`
- `Launch TerraFusion Consciousness Engine`
- `Build TerraFusion Elite Government OS`

**When to Use**: Backend API development, microservice architecture, county data operations, AI agent coordination

---

### 2. Portal Web (`workspaces/portal/apps/terrafusion-web`)

**What**: Next.js 14+ React 18 citizen portal
**Primary Service**: Real-time visualization and monitoring

**Key Files**:

- `.github/copilot-instructions.md` - Portal development guide
- `src/lib/api/client.ts` - Type-safe API client
- `src/lib/websocket/WebSocketProvider.tsx` - Real-time updates

**Ports**:

- `3000` - Next.js development server
- `8787` - Rust backend API (external)

**Quick Start**:
```bash
cd workspaces/portal/apps/terrafusion-web
npm install
npm run dev
# OR use TDC Console: npm run tdc portal:launch
```

**VS Code Tasks**: ✅ Available (TDC Console Integration)

- `🚀 Launch Portal Full Stack`
- `📊 Portal Status`
- `⚡ Launch Backend Services`

**When to Use**: Frontend development, real-time dashboards, 3D visualization, citizen-facing features

---

### 3. Configuration (`config/`)

**What**: Tenant-specific county configurations
**Primary Service**: Multi-tenant settings management

**Key Files**:

- `.github/copilot-instructions.md` - Configuration management guide
- `tenant.{county}.yaml` - 39 county configs (e.g., `tenant.benton.yaml`)
- `ai-consciousness-deployment.json` - AI swarm configuration
- `advanced-government-services.json` - Service definitions

**Quick Reference**:
```yaml
# Pattern: config/tenant.{county}.yaml
countyId: "benton"
harris_pacs:
  connection_string: "${HARRIS_PACS_CONNECTION}"
  sync_interval_minutes: 15
sla_targets:
  availability: 0.999
  response_time_p95_ms: 150
feature_flags:
  ai_swarm_enabled: true
```

**VS Code Tasks**: ❌ None (command-line validation)

**When to Use**: County onboarding, feature flag changes, SLA configuration, security settings

---

### 4. Documentation (`docs/`)

**What**: System architecture and guides
**Primary Service**: Knowledge base and documentation

**Key Files**:
- `.github/copilot-instructions.md` - Documentation standards
- `ARCHITECTURE.md` - High-level system design
- `AI_AGENT_COMMAND_REFERENCE.md` - AI agent commands
- 33+ specialized guides (API, DevOps, Security, etc.)

**Quick Reference**:
- Start with `ARCHITECTURE.md` for system overview
- Reference `AI_AGENT_COMMAND_REFERENCE.md` for agent coordination
- See workspace-specific docs for detailed patterns

**VS Code Tasks**: ❌ None

**When to Use**: Understanding architecture, AI agent coordination, compliance standards, API documentation

---

### 5. Portal Frontend (`workspaces/portal/frontend`)

**What**: Modular frontend components
**Primary Service**: Reusable UI components

**Status**: Related to `apps/terrafusion-web`, may contain shared components

**When to Use**: Shared component development, UI library, design system components

---

### 6. Portal Backend (`workspaces/portal/backend`)

**What**: Portal-specific backend services
**Primary Service**: Portal API layer

**Status**: Related to `apps/terrafusion-web`, integrates with main backend

**When to Use**: Portal-specific API endpoints, data transformation, middleware

---

## 🚀 Common Workflows

### New Developer Onboarding

**Day 1: Orientation**
1. Read this file (`WORKSPACE_GUIDE.md`)
2. Review `backend/QUICKSTART.md` (5 minutes)
3. Read `backend/.github/copilot-instructions.md` (essential patterns)
4. Build backend: `cd backend && dotnet build TerraFusion.sln`

**Week 1: First Feature**
1. Review county isolation pattern (`backend/COUNTY_ISOLATION_QUICK_REF.md`)
2. Run integration tests: `cd backend/tests/TerraFusion.Integration.Tests && dotnet test`
3. Create feature following repository pattern
4. Add integration test for county isolation

**Month 1: Advanced Development**
1. Understand AI swarm coordination (`docs/AI_AGENT_COMMAND_REFERENCE.md`)
2. Work with portal real-time features (`workspaces/portal/apps/terrafusion-web/.github/copilot-instructions.md`)
3. Deploy to staging environment
4. Contribute to documentation

---

### Backend Development Workflow

```bash
# 1. Navigate to backend
cd backend

# 2. Create feature branch
git checkout -b feature/property-assessment-enhancement

# 3. Build and test
dotnet build TerraFusion.sln
cd tests/TerraFusion.Integration.Tests
dotnet test --nologo

# 4. Run services (VS Code Task or terminal)
dotnet run --project TerraFusion.API
dotnet run --project TerraFusion.Consciousness --urls "http://localhost:3004"

# 5. Add migration (if data changes)
dotnet ef migrations add MyFeature --project TerraFusion.Data --startup-project TerraFusion.API
dotnet ef database update --project TerraFusion.Data --startup-project TerraFusion.API

# 6. Validate county isolation
# Add integration test in tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs

# 7. Commit with evidence
git add .
git commit -m "feat: Add property assessment enhancement

- Implements county-isolated property valuation
- Adds integration test for county isolation
- Updates IAAO compliance validation
- Test evidence: 7/7 integration tests passing"
```

---

### Portal Development Workflow

```bash
# 1. Navigate to portal
cd workspaces/portal/apps/terrafusion-web

# 2. Install dependencies (first time)
npm install

# 3. Start development (with backend)
npm run tdc portal:launch
# OR manually:
npm run dev  # Portal on port 3000

# 4. In separate terminal, start backend services
cd ../../../backend
dotnet run --project TerraFusion.API

# 5. Test real-time features
# Open browser: http://localhost:3000
# Check WebSocket: Browser DevTools -> Network -> WS

# 6. Build for production
npm run build
npm run start

# 7. Commit changes
git add .
git commit -m "feat: Add real-time county health dashboard

- Implements WebSocket integration
- Adds Material-UI dashboard components
- Type-safe API client usage
- Tested with 39-county federation data"
```

---

### Configuration Management Workflow

```bash
# 1. Navigate to config
cd config

# 2. Create new county configuration
cp tenant.benton.yaml tenant.newcounty.yaml

# 3. Edit county settings
code tenant.newcounty.yaml
# Update: countyId, displayName, harris_pacs, sla_targets

# 4. Validate configuration
python validate_tenant_config.py --county=newcounty

# 5. Security audit
python security_audit_config.py --fisma-high

# 6. Commit with approval evidence
git add tenant.newcounty.yaml
git commit -m "config: Add New County configuration

- County ID: newcounty
- Harris PACS jurisdiction: NEWCOUNTY_WA
- SLA targets: 99.9% availability, <150ms P95
- Validation: Passed FISMA-High security audit
- Approval: County Administrator (Date: 2025-11-18)"
```

---

## 🎯 Critical Cross-Workspace Patterns

### 1. County Data Isolation (Backend ↔ Portal)

**Backend Pattern** (`backend/`):
```csharp
// Every repository method MUST include countyCode
public async Task<Property> GetByIdAsync(Guid countyCode, Guid propertyId)
{
    return await _context.Properties
        .Where(p => p.CountyId == countyCode && p.Id == propertyId)
        .SingleOrDefaultAsync();
}
```

**Portal Pattern** (`workspaces/portal/apps/terrafusion-web/`):
```typescript
// County-scoped API calls
const workspaceAnalytics = await terrafusionApi.getWorkspaceAnalytics(
  'workspace-id',
  '24h'
);

// County federation visualization
import { countyFederationData } from '@/lib/data/real-county-federation-data';
const countyNodes = countyFederationData.nodes; // 39 counties
```

### 2. Real-Time Coordination (Backend ↔ Portal)

**Backend WebSocket** (External Rust backend, port 8787):
```typescript
// Portal connects to backend WebSocket
ws://localhost:8787/ws/telemetry
ws://localhost:8787/ws/security
ws://localhost:8787/ws/deployments
```

**Portal WebSocket Consumer**:
```typescript
import { useWebSocketMessages } from '@/lib/websocket/WebSocketProvider';

// Listen to specific message types
const performanceMessages = useWebSocketMessages('performance');
```

### 3. Configuration-Driven Features (Config ↔ Backend)

**Configuration File** (`config/tenant.benton.yaml`):
```yaml
feature_flags:
  ai_swarm_enabled: true
  quantum_optimization: true
  real_time_sync: true
```

**Backend Feature Check** (`backend/TerraFusion.API/`):
```csharp
var config = await _configService.GetCountyConfigAsync("benton");
if (config.FeatureFlags.AiSwarmEnabled)
{
    await _aiOrchestrator.CoordinateSwarmAnalysisAsync(property);
}
```

---

## 📋 Quick Reference Matrix

| Workspace | Language | Primary Port | VS Code Tasks | Quick Start Command |
|-----------|----------|--------------|---------------|---------------------|
| `backend/` | C# (.NET 8) | 5000/5001 | ✅ Yes | `dotnet build TerraFusion.sln` |
| `workspaces/portal/apps/terrafusion-web` | TypeScript (Next.js) | 3000 | ✅ Yes (TDC) | `npm run tdc portal:launch` |
| `config/` | YAML/JSON | N/A | ❌ No | `python validate_tenant_config.py` |
| `docs/` | Markdown | N/A | ❌ No | `code docs/ARCHITECTURE.md` |
| `workspaces/portal/frontend` | TypeScript | N/A | ❌ No | (Component library) |
| `workspaces/portal/backend` | Various | TBD | ❌ No | (Portal API layer) |

---

## 🔧 VS Code Task Reference

### Backend Tasks
```json
{
  "Build TerraFusion Elite Government OS": "dotnet build TerraFusion.sln",
  "Launch TerraFusion API Gateway": "dotnet run --project TerraFusion.API",
  "Launch TerraFusion Consciousness Engine": "dotnet run --project TerraFusion.Consciousness --urls http://localhost:3004",
  "Launch Core Services (Degraded, No Build)": "Both API + Consciousness without DB"
}
```

### Portal Tasks (TDC Console)
```json
{
  "🚀 Launch Portal Full Stack": "npm run tdc portal:launch",
  "📊 Portal Status": "npm run tdc portal:status",
  "⚡ Launch Backend Services": "npm run tdc launch:backend -- --degraded",
  "🤖 AI Activity Trace": "npm run tdc ai:trace",
  "🔧 Build TDC": "npm run build (in TDC Console)"
}
```

---

## 📚 Documentation Hierarchy

### Start Here (Top Priority)
1. **This File** (`WORKSPACE_GUIDE.md`) - Complete workspace navigation
2. **Backend Quick Start** (`backend/QUICKSTART.md`) - 5-minute backend onboarding
3. **Backend Full Guide** (`backend/.github/copilot-instructions.md`) - Complete backend patterns
4. **Portal Guide** (`workspaces/portal/apps/terrafusion-web/.github/copilot-instructions.md`) - Portal development

### Deep Dive (By Topic)
- **Architecture**: `docs/ARCHITECTURE.md`
- **County Isolation**: `backend/COUNTY_ISOLATION_QUICK_REF.md`
- **AI Agents**: `docs/AI_AGENT_COMMAND_REFERENCE.md`
- **Configuration**: `config/.github/copilot-instructions.md`
- **Testing**: `backend/tests/README.md`

### Reference (As Needed)
- **Integration Tests**: `backend/INTEGRATION_TEST_ACHIEVEMENT.md`
- **Schema Standards**: `backend/SCHEMA_STANDARDIZATION_LOG.md`
- **API Documentation**: `docs/API_DOCUMENTATION.md`

---

## ⚠️ Critical Rules (Apply Everywhere)

### Always Do
✅ **Read workspace-specific `.github/copilot-instructions.md`** before coding
✅ **Follow county isolation pattern** in all backend data access
✅ **Use environment variables** for secrets (never hardcode)
✅ **Test with backend services running** when developing portal
✅ **Add integration tests** for county-scoped features
✅ **Validate configurations** before committing to `config/`
✅ **Document new patterns** in workspace-specific instructions

### Never Do
❌ **Skip county isolation** - Government compliance requirement
❌ **Modify production county data** without approval
❌ **Bypass type safety** in TypeScript (no `any`)
❌ **Hardcode backend URLs** in portal (use env vars)
❌ **Commit secrets** to Git (use Azure Key Vault)
❌ **Deploy without testing** backend integration
❌ **Ignore audit fields** in entities (auto-populated)

---

## 🚀 Getting Started Paths

### I'm New to TerraFusion
1. Read `WORKSPACE_GUIDE.md` (this file) ← **You are here**
2. Review `backend/QUICKSTART.md` (5 minutes)
3. Build backend: `cd backend && dotnet build TerraFusion.sln`
4. Read `backend/.github/copilot-instructions.md` (essential patterns)
5. Try portal: `cd workspaces/portal/apps/terrafusion-web && npm run tdc portal:launch`

### I'm Working on Backend
1. `backend/QUICKSTART.md` - Quick start
2. `backend/.github/copilot-instructions.md` - Full guide
3. `backend/COUNTY_ISOLATION_QUICK_REF.md` - Data isolation
4. `backend/tests/TerraFusion.Integration.Tests/CountyIsolationTests.cs` - Test patterns

### I'm Working on Portal
1. `workspaces/portal/apps/terrafusion-web/.github/copilot-instructions.md` - Portal guide
2. `src/lib/api/client.ts` - API integration patterns
3. `src/lib/websocket/WebSocketProvider.tsx` - Real-time patterns
4. Start backend: `cd backend && dotnet run --project TerraFusion.API`

### I'm Configuring Counties
1. `config/.github/copilot-instructions.md` - Configuration guide
2. Example: `config/tenant.benton.yaml`
3. Validation: `python validate_tenant_config.py`
4. Security: `python security_audit_config.py --fisma-high`

---

## 💡 Pro Tips

**For AI Agents**:
- Start with workspace-specific instructions (`.github/copilot-instructions.md`)
- County isolation is MANDATORY for all backend data access
- Use VS Code tasks when available (faster than terminal)
- WebSocket connections auto-reconnect (handle gracefully in portal)

**For Human Developers**:
- Use `QUICKSTART.md` files for rapid onboarding
- Integration tests show correct patterns (copy them!)
- TDC Console simplifies portal workflows
- Backend "degraded mode" works without database

**For DevOps**:
- Each workspace has independent build/deploy
- County configs drive multi-tenant behavior
- Health checks at `/api/portal/health`
- Monitor AI swarm at port 3004

---

## 🔗 External Resources

- **Next.js**: https://nextjs.org/docs
- **ASP.NET Core**: https://docs.microsoft.com/aspnet/core
- **Material-UI**: https://mui.com/material-ui/getting-started/
- **Entity Framework Core**: https://docs.microsoft.com/ef/core

---

**Brand Voice**: "Government. Transcended."

**Repository**: `github.com/bsvalues/terrafusion_os_1.0`

**Status**: Production-Ready | Multi-Workspace | Government-Grade

**Last Updated**: November 18, 2025

---

**Navigate confidently. Build systematically. Deliver excellence.**
