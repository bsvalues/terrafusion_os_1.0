# TerraFusion Developer Console (TDC) - Quick Reference

**Version**: 1.0.0
**Location**: `/workspaces/terrafusion_os_1.0/tools/tdc`

## Installation & Usage

```bash
# From anywhere in the monorepo
cd /workspaces/terrafusion_os_1.0/tools/tdc

# Run TDC commands
npm run tdc -- <command>

# Or build once and use directly
npm run build
node cli/dist/index.js <command>
```

## Core Commands

### System Status
```bash
# Check all services health
npm run tdc status

# Show debug information
npm run tdc debug
```

### Launch Services
```bash
# Launch backend services (API + Consciousness)
npm run tdc launch:backend

# Launch only API
npm run tdc launch:backend --mode api

# Launch in degraded mode (skip health checks)
npm run tdc launch:backend --degraded
```

## Workspace Commands

```bash
# List all available workspaces
npm run tdc -- ws list

# Show current workspace context
npm run tdc -- ws context
```

**Note**: Use space, not colon: `ws list` not `ws:list`

## Portal Commands

```bash
# Check Portal status
npm run tdc -- portal status

# Launch Portal full-stack
npm run tdc -- portal launch

# View Portal logs
npm run tdc -- portal logs
npm run tdc -- portal logs --follow

# Stop Portal services
npm run tdc -- portal stop
```

## AI/Transparency Commands

```bash
# Trace recent AI agent activity
npm run tdc -- ai trace
npm run tdc -- ai trace --limit 50
npm run tdc -- ai trace --service dotnet-backend
npm run tdc -- ai trace --workspace backend
npm run tdc -- ai trace --json

# Live activity stream
npm run tdc -- ai activity
npm run tdc -- ai activity --json

# Agent statistics
npm run tdc -- ai stats
```

## Command Structure

TDC uses **Commander.js** subcommands:

```
tdc <command> [subcommand] [options]
    │         │            │
    │         │            └── Flags like --json, --limit
    │         └──────────────── Subcommand (space-separated)
    └────────────────────────── Main command
```

### Examples

✅ **Correct**:
```bash
npm run tdc -- ws list
npm run tdc -- portal status
npm run tdc -- ai trace --limit 10
```

❌ **Incorrect**:
```bash
npm run tdc ws:list        # Use space, not colon
npm run tdc portal:status  # Use space, not colon
```

## Integration with Transparency Engine

TDC integrates with `@terrafusion/transparency-engine` to track all agent activity:

- **Publishing**: Every TDC command publishes `AgentAction` events
- **Subscribing**: AI commands read from the `DefaultTransparencyBus`
- **Layers**: Surface → Hint → Depth → Expert (progressive disclosure)

### Example: Trace Your Own Actions

```bash
# Terminal 1: Run a command that publishes activity
npm run tdc status

# Terminal 2: Trace what just happened
npm run tdc -- ai trace --limit 5
```

## Development

### Project Structure

```
tools/tdc/
├── cli/                          # TDC CLI (Commander.js)
│   ├── src/
│   │   ├── index.ts             # Main CLI entrypoint
│   │   └── commands/            # Command implementations
│   │       ├── status.ts        # Service health checks
│   │       ├── launch-backend.ts # Launch .NET services
│   │       ├── workspace.ts     # Workspace management
│   │       ├── portal.ts        # Portal operations
│   │       ├── ai.ts           # AI/transparency commands
│   │       └── debug.ts        # Debug info
│   ├── package.json
│   └── tsconfig.json
├── packages/
│   └── transparency-engine/     # Shared transparency engine
│       ├── src/
│       │   ├── types.ts        # AgentAction, UserCapabilityModel
│       │   ├── bus.ts          # TransparencyBus (pub/sub)
│       │   └── engine.ts       # SwarmTransparencyEngine
│       └── tests/
└── package.json                 # Workspace root
```

### Build & Test

```bash
# Build everything (CLI + engine)
npm run build

# Test transparency engine
cd packages/transparency-engine
npm test

# Test CLI
cd cli
npm test
```

## VS Code Integration

### Workspace File

Open `portal.code-workspace` to work on TDC + Portal together:

```bash
code /workspaces/terrafusion_os_1.0/workspaces/portal.code-workspace
```

### Tasks

TDC integrates with VS Code tasks. From the workspace, run:

- **Tasks: Run Task** → `Launch TDC Status`
- **Tasks: Run Task** → `Launch TerraFusion Backend (TDC)`

## Troubleshooting

### "Module not found" errors

```bash
# Rebuild packages
cd /workspaces/terrafusion_os_1.0/tools/tdc
npm install
npm run build
```

### "workspace:" protocol errors

Ensure you're using npm 7+ (supports workspaces):

```bash
npm --version  # Should be 7+
```

### Services show as offline

```bash
# Check if services are actually running
npm run tdc status

# Try launching them
npm run tdc launch:backend

# Check debug info
npm run tdc debug
```

## Next Steps

### Phase 4: Portal UI Integration

1. Wire Portal frontend to Transparency Engine
2. Create `WorkspaceDashboard.tsx` component
3. Add real-time agent activity panel
4. Implement transparency layer widget

### Phase 5: VS Code Extension

1. Create TerraFusion activity bar icon
2. Add WebView for Portal embedding
3. Show transparency layer in status bar
4. Register custom tasks

## Related Documentation

- **PHASE_3_INTEGRATION_PLAN.md** - Full integration strategy
- **PHASE_3_COMPLETE.md** - Phase 3 completion report
- **WORKSPACE_AI_PROFILES.md** - AI companion definitions
- **WORKSPACE_COMPANIONS.md** - Navigator, Surgeon, Scribe
- **DAILY_DEV_RUNBOOK.md** - Daily workflow guide

---

**Government. Transcended.** - TerraFusion OS 1.0
