# F11 — Workspace / Code-Space Truth Audit

*Loop 2 deliverable.* Status: **complete**. Confidence: **high**.
Goal: classify every workspace/IDE/launcher/devcontainer layer as AUTHORITATIVE / AUXILIARY / MISLEADING.

## Inventory & classification

| Path | Type | Declared roots | Class | Evidence |
|---|---|---|---|---|
| `platform.json` | schema/contract | backend/, frontend/, os-platform/core | **AUTHORITATIVE** | SSOT for ports/SDKs/CI; `dotnet.defaultSolution: backend/TerraFusion.sln` |
| `pnpm-workspace.yaml` | workspace | packages/*, frontend, agents/*, tools/*, apps/* | **AUTHORITATIVE** | matches live tree; explicitly excludes 6 broken/moved pkgs |
| `packages/*/terrafusion.app.json` (11) | app manifest | per-app pinned/runnable/entry | **AUTHORITATIVE** | live gen2 module registry (terra-levy, terra-miner, terra-pilt…) |
| `.devcontainer/devcontainer.json` | Codespaces | `${localWorkspaceFolderBasename}` | AUXILIARY | workspace-relative, no stale paths |
| `.vscode/settings.json` | IDE | — | AUXILIARY | minimal formatting rules |
| `.claude/launch.json` | debugger | backend/frontend/etc. | AUXILIARY | hardcodes Windows `dotnet.exe`; works on Linux only if dotnet in PATH |
| **`.workspace-map.json`** (20K) | metadata | `ai-workspace-companion/`, `src/`, `SDK/`, `applications/`, `terrafusion-shared/` | **MISLEADING** | declares **non-existent dirs**; root hardcoded `c:\Users\bsval\…` (Windows); stale 2025-10-10 |
| **`tools/dev/dev-os.mjs`** | launcher | scans `applications/` + `apps/` | **MISLEADING (partial)** | scans `applications/` which **does not exist** → silently finds no autostart apps there; only `apps/` works |
| **QUARANTINE/** `*.code-workspace` (92+) | dead workspaces | point to missing `./SDK/`, `./os-platform/development/tools/TerraFusionIDE`, dead app dirs | **MISLEADING** | archived; broken folder links |

## Ghost-workspace register
`ai-workspace-companion/`, `src/` (6 "production-ready" apps), `SDK/`, `applications/`,
`terrafusion-shared/` — all declared in `.workspace-map.json` but **absent from disk**.

## Workspace-induced confusion map (alternate implied roots)
- `.workspace-map.json` implies Windows root `c:\Users\bsval\terrafusion_os_1.0` — **CRITICAL** if any script parses it.
- `dev-os.mjs` implies an `applications/` root that doesn't exist — **HIGH** (launcher silently skips).
- QUARANTINE workspaces imply `./SDK/`, `./os-platform/development/…` roots — broken.

## Verdict
Real structure is **7-tier** (backend, frontend, os-platform, packages, apps, config, tools) + QUARANTINE — **not** the 5-tier (ai-systems/modules/src/shared) claimed by `.workspace-map.json`. The authoritative truth layer is `platform.json` + `pnpm-workspace.yaml` + `terrafusion.app.json`.
