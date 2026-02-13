# TerraFusion Workspace Doctor

Run a comprehensive health check on the TerraFusion OS workspace.

## Check the following:

1. **Node.js Version** - Verify Node.js 18+ is installed
2. **Package Manager** - Check pnpm is available
3. **Git Status** - Show current branch and uncommitted changes
4. **Backend Health** - Check if backend directory exists and has valid structure
5. **Frontend Health** - Check if frontend directory exists and has valid structure
6. **Database Config** - Verify database configuration files exist
7. **AI Swarm Status** - Check os-platform/ai-systems/ for agent definitions
8. **Port Conflicts** - Check if ports 3000, 3002, 3004, 5000 are available

## Output Format:

For each check, report:
- Status (PASS/WARN/FAIL)
- Details of any issues found
- Recommended fixes for failures

## Quick Commands to Run:
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

Provide a summary health score at the end (Excellent/Good/Warning/Critical).
