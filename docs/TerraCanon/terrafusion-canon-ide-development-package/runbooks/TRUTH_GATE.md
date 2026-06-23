# Truth Gate Runbook

Run before development.

```bash
dotnet build backend/TerraFusion.sln
pnpm run type-check

rg -n "os-canon|os-pilot|os-trace|moduleComponents|activateModule|navigate\(" frontend/apps/os-shell/src
rg -n "AGENT_ENTRYPOINT|SEAL|hardcoded port|Trace Events|TerraTrace" .github os-platform frontend backend
rg -n "ARCHIVE|specialized" .github scripts os-platform frontend backend
```

## Decision rules

- If backend build is red, stop feature work and unblock build only.
- If frontend type-check is red, stop feature work and unblock type-check only.
- If `os-canon` is missing from module registration, Stage 1 is required.
- If OS feature icons use `navigate()`, patch to `activateModule(id)`.
- If Dock/Top Bar disappear on OS feature launch, launch contract gate fails.
- No "while I'm here" changes.
