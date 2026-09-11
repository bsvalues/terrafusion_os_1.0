# WO-TUOP-005 — Launcher Reconciliation to the Platform Contract

| Field | Value |
| --- | --- |
| Status | `READY` |
| Program | TerraFusion Owner-Usable Product V1 |
| Goal | `GOAL-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` |
| Loop | `LOOP-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` |
| Owner authority source | Issue #1589; owner review 2026-09-11 |
| Risk | R3 — launch scripts + docs; no product runtime code |

## Objective

`scripts/deployment/LAUNCH_TERRAFUSION_OS.ps1` contradicts `platform.json` — the platform's own
declared single source of truth:

| Defect | Contract truth |
| --- | --- |
| Hardcodes `localhost:5000` | 5000 is in `platform.json deprecated.ports`; API default is 5046 via `TF_API_PORT` |
| Targets `backend/TerraFusion.API` | Contract `paths.backend.apiProject` = `backend/src/TerraFusion.API` |
| Hardcodes `C:\Users\bsval\terrafusion_os_1.0\...` | Paths must resolve from the environment/repo, not a foreign home |
| `Get-Process dotnet \| Stop-Process -Force` | Blanket-kills every dotnet process on the machine — including unrelated live lanes. Must kill only processes it started, or ones provably belonging to TerraFusion |

This is not cosmetic: an agent that trusts this script gets a deprecated-port, wrong-path launch and
may destroy another lane's dotnet processes.

## Required outcome

Retire or repair the launcher (and sweep sibling `scripts/deployment/LAUNCH_*.ps1` for the same
defects): consume `platform.json`/env contract for ports and paths; correct API project path; no
hardcoded home paths; scoped process handling. Record which choice (retire vs repair) and why.

## Walls

If a live production consumer of the current launcher semantics is discovered, coordinate before
change. Workflow-file edits are token-scope-blocked for this estate — keep the fix in scripts/docs.

## Validation

- No hardcoded 5000 / home paths / wrong API path remains in scope
- Launcher resolves port + paths from `platform.json`/env
- Scoped process handling proven (dry-run transcript)
- Required checks green; exact-head merge
