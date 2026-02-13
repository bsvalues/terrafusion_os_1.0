# TerraFusion Power Skin Strategy

## Vision: Don't Build an IDE — Skin the Best Ones

Instead of building TerraFusion IDE from scratch, we **inject TerraFusion power** into existing world-class tools:

| Layer | Tool | Role | Status |
|-------|------|------|--------|
| **Shell** | VS Code | Primary editor, file management, debugging | Extension exists |
| **Intelligence** | Claude Code | AI reasoning, code generation, analysis | Slash commands created |
| **Orchestration** | TDC CLI | Service management, workspace switching | Active in tools/tdc/ |
| **Dashboard** | Command Portal | Web-based monitoring, real-time metrics | QUARANTINE (Rust) |
| **Tools** | MCP Servers | AI tool providers for specialized tasks | Configured |
| **Companion** | Workspace Agent | Context-aware development assistance | QUARANTINE |

---

## Architecture: The TerraFusion Power Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        SOLO DEV INTERFACE                        │
├─────────────────────────────────────────────────────────────────┤
│  VS Code (Shell)           │  Claude Code (Intelligence)        │
│  ├── TerraFusion Extension │  ├── /doctor                       │
│  │   ├── Workspaces View   │  ├── /ai-swarm                     │
│  │   ├── Services View     │  ├── /todo-scan                    │
│  │   ├── AI Agents View    │  ├── /pr-scorecard                 │
│  │   └── Portal Embed      │  ├── /compliance                   │
│  └── Quantum Extension     │  └── /deploy-check                 │
│      └── Consciousness     │                                     │
├─────────────────────────────────────────────────────────────────┤
│                     ORCHESTRATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  TDC CLI (tools/tdc/)      │  Command Portal (localhost:5174)   │
│  ├── tdc ws list           │  ├── Real-time Metrics             │
│  ├── tdc launch:backend    │  ├── AI Swarm Dashboard            │
│  ├── tdc ai trace          │  ├── Compliance Status             │
│  └── tdc status            │  └── County Federation View        │
├─────────────────────────────────────────────────────────────────┤
│                      SERVICES LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Transparency Engine (:8788)  │  IDE Gateway (:5176)            │
│  ├── 4-Layer Disclosure       │  ├── Code Completion API        │
│  ├── Agent Activity Stream    │  ├── Project Templates          │
│  └── Layer Switching          │  └── Compliance Validation      │
├─────────────────────────────────────────────────────────────────┤
│                       MCP SERVERS                                │
├─────────────────────────────────────────────────────────────────┤
│  harris-pacs-connector     │  revenue-discovery-tools           │
│  property-assessment-suite │  compliance-monitoring-kit         │
│  terrafusion-government    │  document-server                   │
├─────────────────────────────────────────────────────────────────┤
│                      BACKEND SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  TerraFusion.API (:5000)   │  Consciousness (:3004)             │
│  └── Kernel                │  └── 1,008 AI Agents               │
│  Gateway (:3002)           │  AI Command Brain                  │
│  └── Ocelot Proxy          │  └── 147 Models, 892 Rules        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Enhance VS Code Extension (Immediate)

### Current State (tools/vscode-extension/)
- ✅ Activity bar with TerraFusion icon
- ✅ 3 tree views (Workspaces, Services, AI Agents)
- ✅ Portal WebView embed
- ✅ WebSocket to Transparency Engine
- ✅ Status bar with layer indicator
- ✅ 8 commands registered

### Enhancements Needed

#### 1A. Add Claude Code Integration View
```typescript
// New: ClaudeCodeProvider.ts
// Shows available slash commands and recent usage
{
  "id": "terrafusion.claudeCode",
  "name": "Claude Code",
  "icon": "resources/claude-icon.svg"
}
```

#### 1B. Add AI Swarm Control Panel
```typescript
// New: SwarmControlProvider.ts
// Real-time swarm status with action buttons
// - Start/Stop agent groups
// - View agent metrics
// - Trigger specific agent capabilities
```

#### 1C. Add Governance Dashboard
```typescript
// New: GovernanceProvider.ts
// Shows DoD compliance, TODO status, PR scores
// Links directly to governance docs
```

#### 1D. Enhanced Commands
```json
{
  "commands": [
    {"command": "terrafusion.runDoctor", "title": "Run Workspace Doctor"},
    {"command": "terrafusion.scanTodos", "title": "Scan TODOs"},
    {"command": "terrafusion.scoreCurrentPR", "title": "Score Current PR"},
    {"command": "terrafusion.checkCompliance", "title": "Check Compliance"},
    {"command": "terrafusion.deployCheck", "title": "Pre-Deploy Validation"},
    {"command": "terrafusion.resurrectCompanion", "title": "Activate Workspace Companion"}
  ]
}
```

---

## Phase 2: Claude Code Skill Injection (Week 1)

### New Skills to Create

| Skill | Activation | Injects |
|-------|-----------|---------|
| `terrafusion-dev` | Working on TerraFusion code | Architecture rules, DO NOT MODIFY zones, port allocation |
| `governance` | Touching Tier-1 UI | DoD checklist, evidence requirements, A-F rubric |
| `harris-pacs` | Touching property data | Integration rules, parcel context, sync patterns |
| `ai-swarm-safety` | Modifying AI agents | Swarm coordination rules, hierarchy awareness |
| `county-deploy` | Deploying to county | Sovereign County model, isolation requirements |

### Skill File Structure
```
.claude/
├── commands/          # Slash commands (created)
│   ├── doctor.md
│   ├── ai-swarm.md
│   ├── todo-scan.md
│   ├── pr-scorecard.md
│   ├── compliance.md
│   └── deploy-check.md
├── skills/            # Context injections (to create)
│   ├── terrafusion-dev.md
│   ├── governance.md
│   ├── harris-pacs.md
│   ├── ai-swarm-safety.md
│   └── county-deploy.md
└── settings.local.json  # Permissions (exists)
```

---

## Phase 3: Resurrect Command Portal (Week 2)

### Location
```
QUARANTINE/top-level-dirs/TerraFusion_Command_Portal_Starter/
└── terrafusion-command-portal/
    ├── backend/ (Rust Axum)
    └── frontend/ (React)
```

### Resurrection Steps

1. **Move to Active**
   ```bash
   mv QUARANTINE/top-level-dirs/TerraFusion_Command_Portal_Starter \
      tools/command-portal
   ```

2. **Update Rust Dependencies**
   ```bash
   cd tools/command-portal/backend
   cargo update
   cargo build
   ```

3. **Configure for Localhost**
   - Port: 5174 (matches VS Code extension config)
   - WebSocket: 8788 (Transparency Engine)

4. **Wire to VS Code Extension**
   - Portal embeds in VS Code sidebar
   - Shares WebSocket connection with extension

### Portal Features to Activate
- 7-County Federation Dashboard
- Real-time AI Agent Monitoring
- Property Data Browser (89,447 Benton parcels)
- Compliance Status Board
- Deployment Pipeline View

---

## Phase 4: Resurrect Workspace Companion (Week 2-3)

### Location
```
QUARANTINE/top-level-dirs/ai-workspace-companion/
├── WorkspaceCompanionAgent.ts (1,509 lines)
├── TerrafusionAIService.ts
├── InteractiveCommandInterface.ts
└── launch-companion.ts
```

### Resurrection Steps

1. **Move to Active**
   ```bash
   mv QUARANTINE/top-level-dirs/ai-workspace-companion \
      tools/ai-workspace-companion
   ```

2. **Compile TypeScript**
   ```bash
   cd tools/ai-workspace-companion
   npm install
   npm run build
   ```

3. **Wire to TDC**
   ```bash
   tdc companion activate
   tdc companion status
   tdc companion ai-generate "..."
   ```

4. **Wire to VS Code Extension**
   - Add "Companion" view to activity bar
   - Show companion status in status bar
   - Forward commands to companion agent

### Companion Capabilities (15 total)
| Capability | Category |
|------------|----------|
| Workspace Context Detection | monitoring |
| Codebase Intelligence | assistance |
| Development Task Assistance | development |
| System Health Monitoring | monitoring |
| Performance Optimization | optimization |
| Compliance Validation | assistance |
| Testing Coordination | development |
| Documentation Assistant | assistance |
| AI Code Generation | ai-tools |
| AI Code Review | ai-tools |
| AI Testing Assistant | ai-tools |
| AI Refactoring | ai-tools |
| AI Problem Solver | ai-tools |
| AI Architecture Advisor | ai-tools |
| AI Compliance Validator | ai-tools |

---

## Phase 5: MCP Server Activation (Week 3)

### Configured Servers (7)

| Server | Location | Port | Purpose |
|--------|----------|------|---------|
| harris-pacs-connector | backend/mcp-servers/harris-pacs-server | 8081 | Property data sync |
| revenue-discovery-tools | backend/mcp-servers/revenue-server | 8082 | Revenue hunting AI |
| property-assessment-suite | backend/mcp-servers/property-server | 8083 | Valuation tools |
| compliance-monitoring-kit | backend/mcp-servers/compliance-server | 8084 | FISMA/NIST checks |
| terrafusion-government | backend/mcp-servers/government-server | 8085 | Gov workflow tools |
| document-server | backend/mcp-servers/document-server | 8080 | OCR, document processing |
| claude-flow | npx claude-flow@alpha | N/A | Session hooks |

### Activation Script
```bash
#!/bin/bash
# Start all MCP servers
cd backend/mcp-servers

echo "Starting MCP Servers..."
node document-server/index.js &
node harris-pacs-server/index.js &
node revenue-server/index.js &
node property-server/index.js &
node compliance-server/index.js &
node government-server/index.js &

echo "MCP Servers started on ports 8080-8085"
```

---

## Phase 6: Domain Companions Resurrection (Week 4+)

### Priority Order

1. **Core Development** (Immediate)
   - development-ai-companion.mjs
   - consciousness-ai-companion.mjs

2. **Marketplace** (Week 4)
   - costforge-ai-ai-companion.mjs
   - property-workbench-ai-companion.mjs
   - terra-levy-ai-companion.mjs

3. **Government** (Week 5)
   - government-core-ai-companion.mjs
   - government-edition-ai-companion.mjs
   - compliance-ai-companion.mjs

4. **Specialized** (Week 6+)
   - Remaining 45 companions as needed

---

## Final Architecture: The TerraFusion-Skinned VS Code

```
┌────────────────────────────────────────────────────────────────┐
│                     VS CODE + TERRAFUSION                       │
├────────────────────────────────────────────────────────────────┤
│ Activity Bar │ Sidebar          │ Editor Area                  │
│              │                  │                              │
│ [TF Icon]    │ ┌──────────────┐ │ ┌──────────────────────────┐ │
│ [Explorer]   │ │ Workspaces   │ │ │                          │ │
│ [Search]     │ │ ├── backend  │ │ │  Your Code Here          │ │
│ [Git]        │ │ ├── frontend │ │ │                          │ │
│ [Debug]      │ │ └── modules  │ │ │  With TerraFusion power: │ │
│ [Extensions] │ ├──────────────┤ │ │  - AI code generation    │ │
│              │ │ Services     │ │ │  - Compliance validation │ │
│              │ │ ├── API ✓    │ │ │  - Test generation       │ │
│              │ │ ├── Gateway ✓│ │ │  - Architecture advice   │ │
│              │ │ └── AI ✓     │ │ │                          │ │
│              │ ├──────────────┤ │ └──────────────────────────┘ │
│              │ │ AI Agents    │ │                              │
│              │ │ └── 1,008 ✓  │ │ ┌──────────────────────────┐ │
│              │ ├──────────────┤ │ │ Claude Code Terminal      │ │
│              │ │ Claude Code  │ │ │ > /doctor                 │ │
│              │ │ ├── /doctor  │ │ │ > /ai-swarm               │ │
│              │ │ ├── /swarm   │ │ │ > /pr-scorecard           │ │
│              │ │ └── /comply  │ │ └──────────────────────────┘ │
│              │ ├──────────────┤ │                              │
│              │ │ Companion    │ │ ┌──────────────────────────┐ │
│              │ │ └── Active ✓ │ │ │ Command Portal (Embed)   │ │
│              │ └──────────────┘ │ │ Real-time metrics...      │ │
├──────────────┴──────────────────┴─┴──────────────────────────┘ │
│ Status Bar: [TF 🟢 HINT] [AI: 1,008] [Companion: Active]       │
└────────────────────────────────────────────────────────────────┘
```

---

## Summary: What Gets Resurrected

| Asset | Lines | From | To | Priority |
|-------|-------|------|-----|----------|
| WorkspaceCompanionAgent | 1,509 | QUARANTINE | tools/ai-workspace-companion | HIGH |
| Command Portal (Rust) | ~5,000+ | QUARANTINE | tools/command-portal | HIGH |
| Domain Companions (51) | ~10,000+ | QUARANTINE | tools/domain-companions | MEDIUM |
| TerraFusionIDE Components | ~3,000+ | os-platform | Integrate to VS Code | LOW |

---

## Solo Dev Daily Workflow (After Resurrection)

```bash
# Morning startup
code .                      # Opens VS Code with TerraFusion extension
/doctor                     # Claude Code health check

# Development
/ai-swarm                   # Check agent status
/todo-scan                  # See prioritized work
tdc companion ai-generate   # Generate code with companion

# Pre-commit
/compliance                 # Check FISMA compliance
/deploy-check              # Run quality gates

# PR Creation
/pr-scorecard              # Score against DoD

# Monitoring (Portal embed or browser)
# Real-time metrics, agent activity, county federation
```

---

**Government. Transcended. Skinned.**
