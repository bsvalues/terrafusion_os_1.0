# TerraFusion OS Workspace System

## Official Workspace List

These are the **official** TerraFusion OS workspaces for daily development. Each workspace is purpose-built for specific development scenarios.

### 🎯 Core Development Workspaces

| Workspace | Purpose | Folders Included | Primary Use Case |
|-----------|---------|------------------|------------------|
| **master.code-workspace** | Complete TerraFusion OS | All folders (backend, frontend, config, SDK, docs, etc.) | Full-system development, architecture decisions, cross-cutting features |
| **backend.code-workspace** | .NET 8 Microservices | backend/, config/, docs/, infrastructure/ | API development, service architecture, database work |
| **frontend.code-workspace** | React 18 Quantum UI | frontend/, platform/design-system/, SDK/, tests/frontend/ | UI/UX development, component library, PWA features |
| **government-core.code-workspace** | Government Applications | marketplace/government-edition/, SDK/, config/ | Government-specific functionality, compliance features |

### 🚀 Specialized Development Workspaces

| Workspace | Purpose | Folders Included | Primary Use Case |
|-----------|---------|------------------|------------------|
| **development.code-workspace** | Development Tools | os-platform/development/, ecosystem/intake/ | Tooling, automation, developer experience |
| **infrastructure.code-workspace** | Infrastructure & Ops | infrastructure/, monitoring/, ops/ | DevOps, deployment, monitoring, security |
| **marketplace.code-workspace** | Marketplace Modules | marketplace/, SDK/, tests/ | Module development, plugin architecture |

### 📊 Analysis & Specialized Workspaces

| Workspace | Purpose | Folders Included | Primary Use Case |
|-----------|---------|------------------|------------------|
| **property-workbench.code-workspace** | Property Assessment | marketplace/property-workbench/, backend/TerraFusion.Data/ | Property valuation, IAAO compliance, ML models |
| **consciousness.code-workspace** | AI Coordination | backend/TerraFusion.Consciousness/, config/ai-*.json | AI agent swarm management, consciousness optimization |
| **security.code-workspace** | Security & Compliance | backend/TerraFusion.Security/, config/security/ | Security features, FISMA compliance, audit logging |

## Workspace Selection Guide

### 🤔 Which workspace should I use?

**Starting a new feature?**
- Backend API → `backend.code-workspace`
- Frontend UI → `frontend.code-workspace`
- Government compliance → `government-core.code-workspace`
- Cross-cutting feature → `master.code-workspace`

**Working on specific areas?**
- Property assessment algorithms → `property-workbench.code-workspace`
- AI agent coordination → `consciousness.code-workspace`
- Infrastructure/deployment → `infrastructure.code-workspace`
- Developer tooling → `development.code-workspace`

**Debugging or architecture work?**
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
   ```

2. **Install Dependencies**
   ```bash
   # Backend (.NET 8)
   cd backend && dotnet restore

   # Frontend (React 18)
   cd frontend && npm install

   # Or use workspace explorer for batch install
   npm run workspace:install-all
   ```

3. **Run Development Environment**
   ```bash
   # Backend API (port 5000)
   Ctrl+Shift+P → "Tasks: Run Task" → "Launch TerraFusion API Gateway"

   # Frontend (port 3000)
   Ctrl+Shift+P → "Tasks: Run Task" → "Launch Frontend Dev Server"

   # Full system
   Ctrl+Shift+P → "Tasks: Run Task" → "Launch Core Services"
   ```

4. **Run Tests**
   ```bash
   # Backend tests
   Ctrl+Shift+P → "Tasks: Run Task" → "Run Unit Smoke Tests"

   # Frontend tests
   cd frontend && npm test

   # Integration tests
   Ctrl+Shift+P → "Tasks: Run Task" → "Run Integration Tests"
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

### 📋 Legacy Development Workflow Reference

```bash
# 1. Choose and open workspace
code workspaces/backend.code-workspace

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Install dependencies (workspace-specific)
dotnet restore  # for backend
# or
npm install     # for frontend

# 4. Run tests
dotnet test     # for backend
# or
npm test        # for frontend

# 5. Start development server
dotnet run      # for backend
# or
npm run dev     # for frontend

# 6. Develop, commit, push, PR
git add .
git commit -m "feat: implement my feature"
git push origin feature/my-feature
# Create PR in GitHub
```

## Workspace Health Monitoring

### 📊 Check Workspace Health
```bash
# Check workspace size and bloat
npm run check:workspace-size

# Validate all workspaces load properly
python validate_workspaces.py

# Run workspace deployment test
python test_workspace_deployment.py
```

### 🧹 Workspace Cleanup
```bash
# Clean up development artifacts
npm run workspace:cleanup

# Check for orphaned files
scripts/check-workspace-health.sh
```

---

**Government. Transcended.** - The TerraFusion workspace system provides championship-level developer experience across all development contexts.
