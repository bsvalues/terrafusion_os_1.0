# WO-105 child: bounded WACO Canon runtime repair

Authority: owner's active WACO product-correctness/final-assurance instruction and
standing TerraFusion delivery authorization. This child does not close WO-105 or
the release until deployed final-candidate proof. Independent Benton and editor
reservations remain separate. Parent owns OMEN deployment and protected PR lifecycle.

Risk R3: authenticated local command adapter. No county-source activation,
production mutation, Wi-Fi control, external-drive work, broad Pilot exposure,
CI-policy change, or statewide-launch claim.

Required proof: boundary negatives, authenticated transport, API tests, actual
local CLI/HTTP ping, core typecheck/Phase83, independent review, protected checks,
then exact deployed image proof. Existing local-hook drift #1562 stays outside
this repair; no protection bypass is authorized.

```json
{
  "id": "WO-105-WACO-CANON-RUNTIME",
  "task": "Repair bounded authenticated TerraCanon conference runtime transport",
  "risk": "R3",
  "suite": "OS",
  "allowed_files": [
    "backend/src/TerraFusion.API/Controllers/CanonRuntimeController.cs",
    "backend/src/TerraFusion.API/Services/SpecLock/SpecLockServiceCollectionExtensions.cs",
    "backend/tests/TerraFusion.Unit.Tests/Controllers/CanonRuntimeControllerTests.cs",
    "frontend/apps/os-shell/src/api/canonConferenceTransport.ts",
    "frontend/apps/os-shell/src/api/__tests__/canonConferenceTransport.test.ts",
    "frontend/apps/os-shell/src/api/canonPing.ts",
    "frontend/apps/os-shell/src/api/canonDoctor.ts",
    "frontend/apps/os-shell/src/api/canonGateFast.ts",
    "frontend/apps/os-shell/src/api/canonFs.ts",
    "frontend/apps/os-shell/src/canon/GateRunnerPanel.tsx",
    "os-platform/core/pilot/canon-conference-boundary.mjs",
    "os-platform/core/pilot/dev-pilot-runtime.mjs",
    "os-platform/core/tests/canon-conference-boundary.test.mjs",
    "os-platform/core/tests/canon-conference-runtime.test.mjs",
    "tools/canon/canon.mjs",
    "tools/canon/ping-live.test.mjs",
    "scripts/waco-conference/Dockerfile.canon-runtime",
    "scripts/waco-conference/Dockerfile.canon-runtime.dockerignore",
    "docs/TerraCanon/WACO_CANON_RUNTIME_BOUNDARY.md",
    "docs/brain/workorders/active/WO-105-WACO-CANON-RUNTIME.md"
  ],
  "forbidden_patterns": [".github/**", "config/counties/**", "**/ARCHIVE/**"],
  "required_proof": ["Canon boundary, CLI, transport and API tests", "core typecheck", "Phase83", "independent assurance", "protected PR checks"]
}
```
