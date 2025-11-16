# TerraFusion Phase 3: Workspace Orchestration Integration Plan

**Date**: November 16, 2025
**Status**: 🚀 Ready to Execute
**Goal**: Integrate TDC CLI + Command Portal + Transparency Engine into unified workspace cockpit

---

## 🎯 Strategic Overview

We have **three powerful systems** that need to become **one coherent platform**:

1. **TDC CLI** (`tools/tdc/`) - TypeScript command-line interface ✅ Built
2. **Command Portal** (`TerraFusion_Command_Portal_Starter/`) - Rust IDE backend + React UI ✅ Exists
3. **Transparency Engine** - Not yet built ⏳ **Next Step**

**Integration Goal**: Create a unified developer experience where:
- VS Code workspaces provide the coding environment
- TDC CLI provides the command orchestration
- Command Portal provides the visual interface
- Transparency Engine provides the "Elegant Transparency" layer

---

## 📋 Execution Phases

### Phase 1: Transparency Engine Foundation 🔧

**Goal**: Build the core transparency infrastructure that all systems use

#### 1.1 Create Transparency Engine Package Structure

```bash
tools/tdc/packages/transparency-engine/
├── package.json
├── tsconfig.json
├── src/
│   ├── types.ts          # Core types (AgentAction, TransparencyLayer, etc.)
│   ├── bus.ts            # TransparencyBus (pub/sub system)
│   ├── engine.ts         # SwarmTransparencyEngine (main orchestrator)
│   ├── plugins.ts        # TransparencyPlugin API
│   └── index.ts          # Public exports
└── tests/
    ├── bus.test.ts
    └── engine.test.ts
```

**Deliverables**:
- [ ] `types.ts` - TransparencyLayer, AgentAction, UserCapabilityModel, OperationalContext
- [ ] `bus.ts` - In-memory pub/sub system (upgradeable to Redis/WebSocket later)
- [ ] `engine.ts` - Core transparency logic with surface/hint/depth/expert layers
- [ ] Tests for bus and engine

**Time Estimate**: 2-3 hours
**Dependencies**: None

---

### Phase 2: TDC Portal Commands 🎮

**Goal**: Wire TDC CLI to control the Command Portal

#### 2.1 Move Command Portal into Monorepo Structure

```bash
# Current location:
TerraFusion_Command_Portal_Starter/terrafusion-command-portal/

# New location:
tools/command-portal/
├── backend/              # Rust IDE backend (from starter)
├── frontend/             # React UI (from starter)
├── docker-compose.full-stack.yml
└── start-full-stack.ps1
```

**Tasks**:
- [ ] Copy portal to `tools/command-portal/`
- [ ] Update paths in `start-full-stack.ps1`
- [ ] Create `portal.code-workspace`
- [ ] Add to `WORKSPACES.md`

#### 2.2 Add Portal Commands to TDC

Extend `tools/tdc/cli/src/commands/portal.ts`:

```typescript
export async function portalLaunch() {
  // Run start-full-stack.ps1 in tools/command-portal
}

export async function portalStatus() {
  // Check http://localhost:5173 (frontend)
  // Check http://localhost:8787/api/health (backend)
}

export async function portalLogs() {
  // Tail docker compose logs
}
```

Wire into CLI:

```typescript
program
  .command("portal:launch")
  .description("Launch Command Portal full-stack environment")
  .action(portalLaunch);

program
  .command("portal:status")
  .description("Show Command Portal + Rust IDE status")
  .action(portalStatus);

program
  .command("portal:logs")
  .description("Tail Command Portal logs")
  .action(portalLogs);
```

**Deliverables**:
- [ ] Portal relocated to `tools/command-portal/`
- [ ] `portal.code-workspace` created
- [ ] TDC portal commands implemented
- [ ] Commands tested and working

**Time Estimate**: 1-2 hours
**Dependencies**: Phase 1 structure complete

---

### Phase 3: Portal UI Integration 🎨

**Goal**: Connect Portal frontend to Transparency Engine

#### 3.1 Create Transparency Engine Client

```bash
tools/tdc/packages/adapters/portal-ui/
├── package.json
├── src/
│   └── client.ts         # WebSocket/HTTP client for portal
└── tests/
    └── client.test.ts
```

**Purpose**: Portal frontend uses this to subscribe to agent activity

#### 3.2 Add Transparency Hooks to Portal Frontend

```bash
tools/command-portal/frontend/src/hooks/
├── useTransparencyEngine.ts    # Subscribe to engine updates
└── useWorkspaceContext.ts      # Get current workspace info
```

#### 3.3 Create Portal UI Components

```bash
tools/command-portal/frontend/src/components/
├── WorkspaceDashboard/
│   ├── WorkspaceDashboard.tsx          # Main dashboard
│   ├── AgentActivityPanel.tsx          # Live agent feed
│   ├── TransparencyLayerWidget.tsx     # Surface/Hint/Depth/Expert toggle
│   ├── ServiceHealthStrip.tsx          # .NET, Rust, Portal health
│   └── SwarmLatticeCanvas.tsx          # 3D visualization (optional)
```

**Layout Design**:

```
┌──────────────────────────────────────────────────────────────┐
│ Top Bar: Workspace Selector · Environment · Layer · AI       │
├────────────┬──────────────────────────────┬──────────────────┤
│ Files &    │ Center Panel                 │ Agents & Health  │
│ Workspaces │ (Code/Swarm/Views)          │ (Live Feed)      │
├────────────┴──────────────────────────────┴──────────────────┤
│ Bottom: Terminal · Logs · Tasks · Status                      │
└──────────────────────────────────────────────────────────────┘
```

**Deliverables**:
- [ ] Portal frontend hooks for transparency engine
- [ ] Workspace dashboard components
- [ ] Agent activity panel showing live feed
- [ ] Transparency layer widget
- [ ] Service health strip

**Time Estimate**: 4-6 hours
**Dependencies**: Phase 1 engine complete, Phase 2 portal relocated

---

### Phase 4: Workspace System Unification 📚

**Goal**: Make workspaces + TDC + Portal work as one system

#### 4.1 Create Master Workspace Configuration

```bash
workspaces/
├── tdc.code-workspace          # TDC CLI + transparency engine
├── portal.code-workspace       # Command Portal UI + Rust backend
├── backend.code-workspace      # .NET services (existing)
├── frontend.code-workspace     # React apps (existing)
└── master.code-workspace       # Everything (existing)
```

**Each workspace gets**:
- `.vscode/extensions.json` - Recommended extensions
- `.vscode/tasks.json` - Workspace-specific tasks
- Reference to relevant folders

#### 4.2 Wire TDC into Backend Publishers

Add transparency publishers to .NET backend:

```csharp
// backend/TerraFusion.API/Middleware/TransparencyMiddleware.cs
public class TransparencyMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        var action = new AgentAction
        {
            Timestamp = DateTime.UtcNow,
            AgentId = "api-gateway",
            Service = "dotnet-backend",
            Phase = "executing",
            Summary = $"{context.Request.Method} {context.Request.Path}"
        };

        await _bus.PublishAsync(action);
        await _next(context);
    }
}
```

**Deliverables**:
- [ ] Workspace configurations updated
- [ ] .NET backend publishes to TransparencyBus
- [ ] Rust backend publishes to TransparencyBus
- [ ] TDC CLI publishes its own actions

**Time Estimate**: 2-3 hours
**Dependencies**: Phase 1 engine, Phase 2 portal commands

---

### Phase 5: Documentation & Runbook Updates 📖

**Goal**: Update all docs to reflect unified system

#### 5.1 Update DAILY_DEV_RUNBOOK.md

Add section:

```markdown
## 🚀 Daily Startup: The TerraFusion Way

### Option A: Visual Cockpit (Portal)
```bash
cd /workspaces/terrafusion_os_1.0
tdc launch backend --mode both --degraded
tdc portal:launch
# Open http://localhost:5173
```

### Option B: CLI-First (Terminal Warriors)
```bash
cd /workspaces/terrafusion_os_1.0
tdc status                    # Check what's running
tdc launch backend           # Start .NET services
tdc workspace:context        # See where you are
tdc ai:trace                 # View agent activity
```
```

#### 5.2 Update WORKSPACES.md

Add:

```markdown
## New Workspaces

### `tdc.code-workspace`
**Purpose**: TerraFusion Developer Console development
**Folders**: `tools/tdc/`, `tools/transparency-engine/`
**Use When**: Building CLI tools, transparency engine

### `portal.code-workspace`
**Purpose**: Command Portal UI and Rust IDE backend
**Folders**: `tools/command-portal/`
**Use When**: Working on visual dashboard, Rust backend
```

#### 5.3 Create TRANSPARENCY_ENGINE.md

New doc explaining:
- What Elegant Transparency means
- How to use the engine
- Plugin API for extending
- Examples of Surface/Hint/Depth/Expert layers

**Deliverables**:
- [ ] DAILY_DEV_RUNBOOK.md updated
- [ ] WORKSPACES.md updated
- [ ] TRANSPARENCY_ENGINE.md created
- [ ] README.md updated with new workflows

**Time Estimate**: 1-2 hours
**Dependencies**: All phases complete

---

## 🎯 Success Criteria

The integration is complete when:

✅ **TDC CLI can control everything**:
```bash
tdc status                # Shows .NET + Rust + Portal health
tdc launch backend       # Starts .NET services
tdc portal:launch        # Starts Portal
tdc ai:trace             # Shows agent activity
```

✅ **Portal UI shows live transparency**:
- Agent activity feed updates in real-time
- Transparency layer can be toggled (Surface → Expert)
- Service health indicators show actual status
- Workspace context is displayed

✅ **Workspaces are organized**:
- Each has clear purpose documented
- Tasks are wired to TDC commands
- Extensions are recommended

✅ **Docs are updated**:
- DAILY_DEV_RUNBOOK has new workflows
- WORKSPACES.md explains new workspaces
- TRANSPARENCY_ENGINE.md provides guide

---

## 🚀 Next Action

**Immediate next step**: Start Phase 1, Task 1.1

```bash
cd /workspaces/terrafusion_os_1.0/tools/tdc
mkdir -p packages/transparency-engine/src
mkdir -p packages/transparency-engine/tests
```

Then create `package.json` and `types.ts`.

---

## 📊 Progress Tracking

Track completion in main todo list:
- [ ] Phase 1: Transparency Engine Foundation
- [ ] Phase 2: TDC Portal Commands
- [ ] Phase 3: Portal UI Integration
- [ ] Phase 4: Workspace System Unification
- [ ] Phase 5: Documentation & Runbook Updates

**Government. Transcended.** 🏛️
