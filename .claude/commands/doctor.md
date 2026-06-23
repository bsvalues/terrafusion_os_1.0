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
8. **Port Conflicts** - Check configured service ports are available

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
ls backend/src/TerraFusion.API/
ls frontend/apps/os-shell/
ls backend/src/TerraFusion.Data/
ls os-platform/ai-systems/
TF_FRONTEND_PORT="${TF_FRONTEND_PORT:-5174}"
TF_API_PORT="${TF_API_PORT:-5000}"
ss -tlnp 2>/dev/null | grep -E ":(${TF_FRONTEND_PORT}|${TF_API_PORT})\b" || echo "ports free"
```

PowerShell port check:
```powershell
$frontendPort = if ($env:TF_FRONTEND_PORT) { [int]$env:TF_FRONTEND_PORT } else { 5174 }
$apiPort = if ($env:TF_API_PORT) { [int]$env:TF_API_PORT } else { 5000 }
Get-NetTCPConnection -State Listen -LocalPort $frontendPort,$apiPort -ErrorAction SilentlyContinue
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
