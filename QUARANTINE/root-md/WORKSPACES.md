# TerraFusion OS Workspace System

**🚀 For daily development workflow, see: [`DAILY_DEV_RUNBOOK.md`](./DAILY_DEV_RUNBOOK.md)**

## Official Workspace List (**FROZEN v1.0**)

These are the **official** TerraFusion OS workspaces for daily development. This list is **frozen as of November 2025** to provide stability for teams. Each workspace is purpose-built for specific development scenarios.

### 🎯 Core Development Workspaces (PRIMARY)

| Workspace | Status | Purpose | Folders Included | Primary Use Case |
|-----------|--------|---------|------------------|------------------|
| **master.code-workspace** | 🟢 LIVE | Complete TerraFusion OS | backend/, frontend/, config/, SDK/, docs/, monitoring/, marketplace/, workspaces/ | Full-system development, architecture decisions, cross-cutting features |
| **backend.code-workspace** | 🟢 LIVE | .NET 8 Microservices | backend/, SDK/, tests/backend/, docs/backend/, config/ | API development, service architecture, database work |
| **frontend.code-workspace** | 🟢 LIVE | React 18 Quantum UI | frontend/, platform/design-system/, SDK/, tests/frontend/ | UI/UX development, component library, PWA features |
| **sdk.code-workspace** | 🟢 LIVE | Platform SDK | SDK/, modules/, tools/, scripts/ | Module development, SDK tooling, boilerplate creation |

### 🚀 Government & Enterprise Workspaces

| Workspace | Status | Purpose | Folders Included | Primary Use Case |
|-----------|--------|---------|------------------|------------------|
| **government-core.code-workspace** | 🟢 LIVE | Government Core Services | government-core/, config/, SDK/ | Core government functionality |
| **government-edition.code-workspace** | 🟢 LIVE | Government Applications | government-edition/, marketplace/government-edition/, SDK/ | Government-specific modules, compliance features |
| **government-apps.code-workspace** | 🟢 LIVE | Government Application Suite | applications/, government-apps/, SDK/ | Citizen services, public interfaces |

### 🏗️ Development & Infrastructure

| Workspace | Status | Purpose | Folders Included | Primary Use Case |
|-----------|--------|---------|------------------|------------------|
| **development.code-workspace** | 🟢 LIVE | Development Tools | os-platform/development/, ecosystem/intake/ | Tooling, automation, developer experience |
| **infrastructure.code-workspace** | 🟢 LIVE | Infrastructure & Ops | infrastructure/, monitoring/, ops/, deployment/ | DevOps, deployment, monitoring, security |
| **monitoring.code-workspace** | 🟢 LIVE | System Monitoring | monitoring/, infrastructure/, config/ | Performance monitoring, observability |
| **security.code-workspace** | 🟢 LIVE | Security & Compliance | security/, backend/TerraFusion.Security/, config/security/ | Security features, FISMA compliance, audit logging |

### 🏢 Marketplace & Modules

| Workspace | Status | Purpose | Folders Included | Primary Use Case |
|-----------|--------|---------|------------------|------------------|
| **marketplace.code-workspace** | 🟢 LIVE | Marketplace Platform | marketplace/, SDK/, tests/ | Module development, plugin architecture |
| **property-workbench.code-workspace** | 🟢 LIVE | Property Assessment | property-workbench/, backend/TerraFusion.Data/ | Property valuation, IAAO compliance, ML models |
| **terrabuild-modernization.code-workspace** | 🟢 LIVE | Property Assessment System | terrabuild-modernization/, property-workbench/ | Property assessment modernization |

### 🤖 AI & Advanced Systems

| Workspace | Status | Purpose | Folders Included | Primary Use Case |
|-----------|--------|---------|------------------|------------------|
| **consciousness.code-workspace** | 🟢 LIVE | AI Coordination | backend/TerraFusion.Consciousness/, config/ai-*.json | AI agent swarm management, consciousness optimization |
| **ai-systems.code-workspace** | 🟢 LIVE | AI Development | ai-systems/, backend/TerraFusion.AI/ | AI model development, ML pipelines |
| **costforge-ai.code-workspace** | 🟢 LIVE | CostForge AI Platform | costforge-ai/, backend/TerraFusion.CostForge/ | AI-powered cost estimation |

### 🏛️ Domain-Specific Workspaces

| Workspace | Status | Purpose | Folders Included | Primary Use Case |
|-----------|--------|---------|------------------|------------------|
| **terra-levy.code-workspace** | 🟢 LIVE | Tax Levy Management | terra-levy/, SDK/modules/terra-levy/ | Tax calculation, levy processing |
| **terra-levy-elite.code-workspace** | 🟢 LIVE | Elite Tax Processing | terra-levy/, terra-levy-elite/ | Advanced tax calculations |
| **terra-sync.code-workspace** | 🟢 LIVE | Data Synchronization | terra-sync/, backend/TerraFusion.Sync/ | County data integration, Harris PACS |
| **leafscope.code-workspace** | 🟢 LIVE | GIS & Mapping | LeafScope/, terra-flow/ | GIS operations, mapping services |
| **terra-bank.code-workspace** | 🟢 LIVE | Banking Integration | terra-bank/, financial/ | Banking services, payment processing |
| **terra-justice.code-workspace** | 🟢 LIVE | Justice System | terra-justice/, legal-judicial/ | Court management, legal workflows |
| **revenue.code-workspace** | 🟢 LIVE | Revenue Management | revenue/, terra-collections/ | Revenue tracking, collection management |

### 🔧 Specialized Tools & Templates

| Workspace | Status | Purpose | Folders Included | Primary Use Case |
|-----------|--------|---------|------------------|------------------|
| **design-system.code-workspace** | 🟢 LIVE | UI Design System | platform/design-system/, frontend/src/components/ | Component library, design tokens |
| **templates.code-workspace** | 🟢 LIVE | Project Templates | templates/, SDK/boilerplate/ | Scaffolding, project generation |
| **validation.code-workspace** | 🟢 LIVE | Testing & QA | tests/, validation/, compliance/ | Test suites, validation tools |
| **terrafusion-ide.code-workspace** | 🟢 LIVE | IDE Development | os-platform/development/tools/TerraFusionIDE/ | Custom IDE development |

### ⚠️ Experimental/Special Purpose Workspaces

| Workspace | Status | Purpose | Folders Included | Primary Use Case |
|-----------|--------|---------|------------------|------------------|
| **TerraFusion-OS-Platform-2.0.code-workspace** | 🟡 EXPERIMENTAL | Platform V2 | Future platform architecture | Next-generation platform development |
| **shock-and-awe.code-workspace** | 🟡 EXPERIMENTAL | Performance Testing | shock-and-awe/, performance/ | Load testing, benchmarking |
| **autonomous-research-engine.code-workspace** | 🟡 EXPERIMENTAL | Research Tools | autonomous-research-engine/ | AI research capabilities |
| **native-shell.code-workspace** | 🟡 EXPERIMENTAL | Native Apps | terrafusion-native-shell/ | Desktop/mobile applications |
| **ragpanel.code-workspace** | 🟡 EXPERIMENTAL | RAG Panel | RAGPanel/ | AI document processing |
| **unified-system.code-workspace** | 🟡 EXPERIMENTAL | System Integration | unified-system/ | Cross-system coordination |

### 🚨 Deprecated Workspaces (DO NOT USE)

| Workspace | Status | Reason | Replacement |
|-----------|--------|--------|-------------|
| **adk.code-workspace** | ❌ DEPRECATED | Replaced by SDK workspace | Use `sdk.code-workspace` |
| **engines.code-workspace** | ❌ DEPRECATED | Merged into AI systems | Use `ai-systems.code-workspace` |
| **services.code-workspace** | ❌ DEPRECATED | Replaced by backend workspace | Use `backend.code-workspace` |
| **agent-interfaces.code-workspace** | ❌ DEPRECATED | Merged into consciousness | Use `consciousness.code-workspace` |

## Workspace Selection Guide

### 🤔 Which workspace should I use?

**Starting a new feature?**
- Backend API → `backend.code-workspace`
- Frontend UI → `frontend.code-workspace`
- Government compliance → `government-edition.code-workspace`
- SDK/Module → `sdk.code-workspace`
- Cross-cutting feature → `master.code-workspace`

**Working on specific domains?**
- Property assessment → `property-workbench.code-workspace` or `terrabuild-modernization.code-workspace`
- Tax processing → `terra-levy.code-workspace` or `terra-levy-elite.code-workspace`
- AI coordination → `consciousness.code-workspace`
- Data sync → `terra-sync.code-workspace`
- GIS/Mapping → `leafscope.code-workspace`
- Infrastructure → `infrastructure.code-workspace`
- Monitoring → `monitoring.code-workspace`

**Architecture or debugging?**
- Use `master.code-workspace` for full system visibility

### 📁 Folder Coverage Philosophy

Each workspace follows the **principle of focused concern**:
- **Includes**: Folders directly relevant to the development task
- **Excludes**: Unrelated areas to reduce cognitive load
- **Read-only access**: Some folders marked as read-only for context without modification risk

### 🔧 Workspace Standards

Every official workspace must meet these criteria:
1. **Opens cleanly** - No red squiggle explosion, missing extensions handled gracefully
2. **Working run configuration** - At least one way to build/run/test the primary functionality
3. **Documentation accessible** - Key docs (README, BUILD instructions) easily findable
4. **Extension recommendations** - Appropriate VS Code extensions suggested for the development context
5. **Task definitions** - Common development tasks (build, test, run) available via VS Code tasks

## Getting Started in VS Code

### 🚀 Quick Start Development Flow

1. **Open TerraFusion Workspace**
   ```bash
   code workspaces/master.code-workspace          # Full system development
   code workspaces/backend.code-workspace         # Backend/API work
   code workspaces/frontend.code-workspace        # UI/UX development
   code workspaces/sdk.code-workspace             # SDK/module development
   ```

2. **Install Dependencies**
   ```bash
   # Backend (.NET 8)
   cd backend && dotnet restore

   # Frontend (React 18)
   cd frontend && npm install

   # SDK (if developing modules)
   cd SDK && npm install
   ```

3. **Run Development Environment**
   ```bash
   # Backend API (port 5000)
   Ctrl+Shift+P → "Tasks: Run Task" → "Launch TerraFusion API Gateway"

   # AI Consciousness Engine (port 3004)
   Ctrl+Shift+P → "Tasks: Run Task" → "Launch TerraFusion Consciousness Engine"

   # Frontend (varies by workspace)
   cd frontend && npm run dev

   # Full system
   Ctrl+Shift+P → "Tasks: Run Task" → "Launch Core Services (Degraded)"
   ```

4. **Run Tests**
   ```bash
   # Backend tests
   Ctrl+Shift+P → "Tasks: Run Task" → "Run Unit Smoke Tests"
   Ctrl+Shift+P → "Tasks: Run Task" → "Run Integration Tests"

   # Frontend tests (when applicable)
   cd frontend && npm test

   # Performance tests
   Ctrl+Shift+P → "Tasks: Run Task" → "Run Performance Tests"
   ```

5. **Development Workflow**
   ```bash
   git checkout -b feature/my-feature    # Create feature branch
   # Make changes...
   git add . && git commit -m "feat: description"
   git push origin feature/my-feature
   # Create PR via GitHub/VS Code
   ```

### 🎯 Pro Tips
- Use `Ctrl+Shift+P` → "Workspaces: Open Workspace" to switch between workspaces
- Each workspace has curated extensions - accept recommendations when prompted
- Use **Problems panel** (Ctrl+Shift+M) to see build/lint issues across workspace
- **Terminal → New Terminal** respects workspace folder context
- Use `Ctrl+Shift+P` → "Tasks: Run Task" to see available development tasks

### 📋 Team Development Workflow

```bash
# 1. Choose and open appropriate workspace
code workspaces/backend.code-workspace

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Install dependencies (workspace-specific)
dotnet restore  # for backend workspaces
# or
npm install     # for frontend workspaces

# 4. Run tests to ensure clean state
dotnet test     # for backend
# or
npm test        # for frontend

# 5. Start development server
dotnet run      # for backend
# or
npm run dev     # for frontend

# 6. Develop, test, commit, push, PR
git add .
git commit -m "feat: implement my feature"
git push origin feature/my-feature
# Create PR in GitHub
```

## Workspace Health & Maintenance

### 📊 Check Workspace Health
```bash
# Check workspace size and bloat
./scripts/check-workspace-size.sh --summary          # Quick size check
./scripts/check-workspace-size.sh --detailed         # Detailed analysis

# Clean up workspace artifacts
./scripts/workspace-cleanup.sh --dry-run             # Preview cleanup
./scripts/workspace-cleanup.sh                       # Execute cleanup

# Validate all workspaces load properly
python workspaces/validate_workspaces.py

# Run workspace deployment test
python test_workspace_deployment.py
```

**Size Guidelines:**
- 🟢 **Normal**: Individual workspaces < 1MB
- 🟡 **Watch**: Individual workspaces 1-10MB
- 🔴 **Action**: Individual workspaces > 10MB (consider cleanup)
- 🔴 **Critical**: Total workspace directory > 1GB

Regular monitoring helps identify build artifacts, temporary files, and bloated configurations that impact VS Code performance.

### 🧹 Workspace Cleanup
```bash
# Clean up development artifacts
./scripts/workspace-cleanup.sh --dry-run             # Preview what will be cleaned
./scripts/workspace-cleanup.sh                       # Execute cleanup

# Check for workspace issues
./scripts/check-workspace-size.sh --detailed         # Size analysis
find workspaces/ -name "*.code-workspace" -exec echo "Workspace: {}" \;   # List all workspaces
```
python workspaces/fix_workspace_json.py
```

### 📝 Workspace Audit Status

- **Total Workspaces**: 58 identified
- **Live/Active**: 36 workspaces
- **Experimental**: 6 workspaces
- **Deprecated**: 4 workspaces
- **Need Review**: 12 workspaces

---

**Government. Transcended.** - The TerraFusion workspace system provides championship-level developer experience across all development contexts.

*Last Updated: November 15, 2025*
*Version: 1.0 (FROZEN)*
