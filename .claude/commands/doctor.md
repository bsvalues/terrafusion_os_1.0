# TerraFusion Workspace Doctor

Run a comprehensive health check on the TerraFusion OS workspace.

## DX Spine Integration

**This command follows the DX Spine Charter (docs/dev/DX_SPINE_CHARTER.md)**

| Property | Value |
|----------|-------|
| **Command Contract** | `tools/dx/command-contracts/doctor.contract.json` |
| **Risk Level** | `read` (no state changes) |
| **Owner Lane** | `dev` |
| **Emits Context Pack** | Yes |

### Execution Flow

1. **Read Context Pack**: Load `.terrafusion/context/latest.json` if it exists
2. **Execute Checks**: Run health diagnostics
3. **Update Context Pack**: Write results to `.terrafusion/context/latest.json`
4. **Emit Markdown**: Update `.terrafusion/context/latest.md`

### Generate Context Pack First
```bash
node tools/dx/context-pack/generate.mjs --generator claude
```

Then read the generated context for current state:
```bash
cat .terrafusion/context/latest.md
```

## Health Checks

1. **Node.js Version** - Verify Node.js 18+ is installed
2. **Package Manager** - Check pnpm is available
3. **Git Status** - Show current branch and uncommitted changes
4. **Backend Health** - Check if backend directory exists and has valid structure
5. **Frontend Health** - Check if frontend directory exists and has valid structure
6. **Database Config** - Verify database configuration files exist
7. **AI Swarm Status** - Check os-platform/ai-systems/ for agent definitions
8. **Port Conflicts** - Check if ports 3000, 3002, 3004, 5000 are available

## Output Format

For each check, report:
- Status (PASS/WARN/FAIL)
- Details of any issues found
- Recommended fixes for failures

## Quick Commands to Run
```bash
node --version
pnpm --version
git status --short
ls backend/TerraFusion.API/
ls frontend/apps/os-shell/
ls backend/src/TerraFusion.Data/
ls os-platform/ai-systems/
ss -tlnp 2>/dev/null | grep -E ':(3000|3002|3004|5000)'
```

## Output Contract

Must return JSON matching `tools/dx/command-contracts/doctor.contract.json`:

```json
{
  "status": "pass|warn|fail",
  "checks": [
    { "name": "check-name", "status": "pass|warn|fail", "message": "..." }
  ],
  "summary": { "passed": N, "warned": N, "failed": N, "total": N }
}
```

Provide a summary health score at the end (Excellent/Good/Warning/Critical).

**After completion**: Context Pack at `.terrafusion/context/latest.json` is updated.
