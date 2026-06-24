# System Duplication Map (Lane 5)

*Deliverable #6.* Status: **complete**. Confidence: **high** (file-path-backed).
Method: Explore agent inventory of entrypoints, shells, workbench, Dais, registries, workspaces.

## Hypothesis verdict

The "3 different full systems" hypothesis is **refined, not literally true**:
TerraFusion is **one canonical live system + experimental layers + a large graveyard of
ghosts**, *not* three co-equal running systems.

## Duplication counts

| Category | Count | Live / canonical | Ghosts & duplicates |
|---|---|---|---|
| **Backend `.sln`** | 3 | root `TerraFusion.sln`, `backend/TerraFusion.sln` (same `TerraFusion.API/Program.cs` entry) | `packages/government-edition/TerraFusion.sln` (excluded from workspace → dead) |
| **Shell** | 3 | `frontend/apps/os-shell/src/shell/DesktopShell.tsx` (React, LIVE); `backend/TerraFusion.Gateway` (API shell, LIVE) | `native-shell/` (WPF, partial/experiment); ≥4 QUARANTINE shells (`QuantumDesktopShell.tsx`, `_CLEAN_BUILD_ZONE`, `terrafusion-native-shell/`, `applications/os-shell/`) |
| **Property Workbench** | 1 live + ~15 dead | `frontend/apps/os-shell/src/pages/workbench/` (contract tests prove it) | ~15 QUARANTINE copies under `deployment/`, `marketplace/`, `workspaces/`, BentonCounty packages |
| **TerraDais** | 1 | `frontend/apps/os-shell/src/components/dais/` + `pages/dais/` (40+ contract tests) | `brain/packs/dais/` (reference only) |
| **Registries** | ~4 (distinct, not dupes) | `tools/registry/generate-modules.ts` (build-time), `os-platform/core/ToolRegistry.js` (runtime JS), backend C# DI, `os-platform/core/handlers.js` (events) | — layering, not duplication |
| **Workspace/package systems** | 4 | root pnpm (`pnpm-workspace.yaml`), backend .NET (`Directory.Packages.props`), `frontend/electron` subworkspace, `os-platform/core` standalone CommonJS | — |

## Ghost system register (present-but-dead)

Inside `QUARANTINE/top-level-dirs/` (2.3 GB, 161 dirs):
- **Near-complete replicas**: `TERRAFUSION_OS_CORE/`, `TerraFusion_OS/`,
  `TERRAFUSION_ULTIMATE_STANDALONE_PACKAGE/`, `_CLEAN_BUILD_ZONE/_CLEAN_BUILD_ZONE/`.
- **Deployment bundles**: `deployment/production/modules/*`, `BentonCounty_COMPLETE_WhiteGlove_Package/`.
- **Marketplace variants**: `shock-and-awe/`, `commercial/marketplace-champion/`.
- **AI framework versions**: `ai-agent-framework/`, `AI_AGENT_DEVELOPMENT_ENVIRONMENT/`.

## Overlap matrix (live-tree only)

| A | B | Overlap | Severity |
|---|---|---|---|
| `frontend/apps/os-shell` | `native-shell/` | both claim "the shell" | HIGH — needs intent ruling |
| `TerraFusion.API` | `TerraFusion.Gateway` | gateway proxies API (intended) | LOW |
| root pnpm | `os-platform/core` (CommonJS, not in workspace) | semi-orphan module system | MEDIUM |
| `packages/government-edition/*.sln` | `backend/*.sln` | duplicate solution, excluded | dead |

## Unresolved
- Is `native-shell/` a retired experiment or an intended parallel desktop target?
  (Owner ruling needed.) Recorded as Lane 14 input.
