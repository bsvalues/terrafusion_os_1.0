# WO-0014 — D-015: ServiceRegistry seed path fix (repo-root platform.json) + regression test

- **Risk:** R2 · **Suite:** OS kernel / Build · **Agent:** Claude Code
- **Surface:** `ServiceRegistry.EnsureSeededAsync` platform.json resolution + Stage3 tests
- **Goal:** Seeder finds the canonical repo-root `platform.json` (currently derives `backend/platform.json`, absent → warn-skip every boot → registry only ever holds self-registered `backend`). Smallest fix; existing behavior with an explicit `platformJsonPath` argument unchanged; existing tests stay green.

## Files likely touched
- `backend/src/TerraFusion.API/Services/ServiceRegistry.cs` — seed path resolution (walk-up or corrected relative path)
- `backend/tests/TerraFusion.Unit.Tests/Stage3/ServiceRegistryTests.cs` — regression: root-layout seed (platform.json NOT sibling of registry file)
- `docs/brain/memory/drift-ledger.md` — close D-015 with evidence
- `docs/brain/canon/next-queue.json` — advance queue

## Allowed files
- `backend/src/TerraFusion.API/Services/ServiceRegistry.cs`
- `backend/src/TerraFusion.API/Services/StartupOrchestrationService.cs`
- `backend/tests/TerraFusion.Unit.Tests/Stage3/ServiceRegistryTests.cs`
- `docs/brain/memory/**`
- `docs/brain/canon/**`
- `docs/brain/evidence/**`
- `wiki/**`

## Acceptance criteria
- [ ] With registry at `backend/service-registry.json` and platform.json at repo root, seeding populates all `ports` services (test-proven via temp dirs)
- [ ] Explicit-path overload behavior unchanged; idempotency unchanged (existing 8 facts green)
- [ ] No schema changes to platform.json or service-registry.json; no module-id renames (stop condition)
- [ ] Stage3 ServiceRegistryTests green incl. new regression fact

## Required proof
- `pnpm brain check`
- `pnpm brain review-diff --workorder WO-0014`
- `dotnet test --filter FullyQualifiedName~ServiceRegistryTests` (use --no-build only if fleet lock forces it; document)

## Rollback
- Revert the two backend files; registry falls back to current self-registration-only behavior (no data risk — file is regenerated).

## Stop conditions
- fix requires changing platform.json schema or shell module ids → escalate
- fleet build-lock prevents any test run → document, do not force
- a forbidden file must be touched

## Non-goals
- G2 module-id ↔ generatedModules alignment verification beyond static notes (needs live shell boot — note gaps honestly); G3 GetAvailablePort docs-honesty; controller changes.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
```json
{
  "id": "WO-0014",
  "task": "D-015 ServiceRegistry seed path fix: find repo-root platform.json + regression test",
  "risk": "R2",
  "suite": "OS kernel / Build",
  "allowed_files": [
    "backend/src/TerraFusion.API/Services/ServiceRegistry.cs",
    "backend/src/TerraFusion.API/Services/StartupOrchestrationService.cs",
    "backend/tests/TerraFusion.Unit.Tests/Stage3/ServiceRegistryTests.cs",
    "docs/brain/memory/**",
    "docs/brain/canon/**",
    "docs/brain/evidence/**",
    "wiki/**"
  ],
  "forbidden_patterns": [
    "**/ARCHIVE/**",
    "specialized/**",
    "applications/**",
    "os-platform/**",
    "frontend/**",
    "backend/src/TerraFusion.API/Controllers/**",
    "backend/src/TerraFusion.*/**/*Forge*",
    "backend/src/TerraFusion.*/**/*Atlas*",
    "backend/src/TerraFusion.*/**/*Dais*",
    "backend/src/TerraFusion.*/**/*Dossier*",
    ".github/AGENT_ENTRYPOINT.md",
    "docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md",
    "platform.json"
  ],
  "required_proof": [
    "pnpm brain check",
    "pnpm brain review-diff --workorder WO-0014",
    "dotnet test --filter FullyQualifiedName~ServiceRegistryTests"
  ]
}
```
