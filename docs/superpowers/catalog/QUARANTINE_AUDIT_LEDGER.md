# QUARANTINE Audit Ledger

**Date**: 2026-03-28  
**Lane**: Codex-safe read-only audit + docs-only control-plane output  
**Scope**:
- `QUARANTINE/top-level-dirs`
- `QUARANTINE/root-md`
- `QUARANTINE/root-artifacts`
- `QUARANTINE/frontend-dead-shell`

## Purpose

Record what the literal `QUARANTINE/` folder contains, which parts are still referenced by living docs or runtime-adjacent maps, and which parts are archive noise versus plausible restore candidates.

This ledger does **not** authorize restore, move, delete, or runtime work.

## Inventory Snapshot

| Path | Files | Immediate dirs | Primary character |
|---|---:|---:|---|
| `QUARANTINE/top-level-dirs` | 86,667 | 164 | Mixed super-bucket: archive, backups, prototypes, restore-candidate islands |
| `QUARANTINE/root-md` | 428 | 0 | Root markdown dump / trophy-report archive |
| `QUARANTINE/root-artifacts` | 303 | 0 | Root non-markdown backup / duplicate-name artifact bucket |
| `QUARANTINE/frontend-dead-shell` | 35 | 4 | Legacy shell variants and dead style/test bundle |

## Key Findings

1. `frontend-dead-shell` is not part of the active shell. Its shell files are referenced by old frontend/governance docs, while the live shell sits under `frontend/apps/os-shell/src/shell/`.
2. `root-md` is archival narrative output, not runtime-adjacent source. No live app imports were found; the bucket itself is only referenced by quarantine governance docs and scripts.
3. `root-artifacts` is the highest confusion-risk bucket because it contains backup filenames that overlap live config and infra assets such as `service-registry.json`, `playwright.config.ts`, `jest.integration.config.ts`, `Dockerfile`, and `docker-compose.yml`.
4. `top-level-dirs` is not one thing. It contains both obvious archive/safety clusters and real-looking application islands that other docs still cite as candidate module sources.
5. `docs/module-integration-map.md` currently points several modules at root-level `QUARANTINE/...` paths that do not exist. The audited candidates are actually under `QUARANTINE/top-level-dirs/...`.

## Scoped Findings

### `QUARANTINE/top-level-dirs`

This bucket is still referenced by:
- `docs/governance/QUARANTINE_SOP.md`
- `scripts/quarantine/plan-core.mjs`
- `docs/module-integration-map.md`
- `docs/development/TERRAFUSION_POWER_SKIN_STRATEGY.md`

It contains three distinct classes:
- archive/safety buckets such as `_archive` and `_pre_restore_safety_20260108_144218`
- duplicate-name or fork clusters that overlap active concepts but are not current runtime truth
- restore-candidate islands still cited by source-of-truth docs

High-signal restore-candidate islands found in this pass:

| Path | Files | Why it matters |
|---|---:|---|
| `QUARANTINE/top-level-dirs/applications/terra-primeview-production` | 131 | Real app scaffold with `src/`, `supabase/`, `package.json`, and Vite/Tailwind config |
| `QUARANTINE/top-level-dirs/applications/terra-permit` | 312 | Full-stack app shape with `client/`, `server/`, `shared/`, Drizzle config, and deployment docs |
| `QUARANTINE/top-level-dirs/applications/terra-gama-production` | 103 | Mixed Python + Next/Electron app shape |
| `QUARANTINE/top-level-dirs/marketplace/government-core/gispro` | 385 | Large GIS candidate with app/server/shared/mcp/test structure |
| `QUARANTINE/top-level-dirs/SDK/modules/terra-pilt` | 27 | Compact module candidate still cited as a source location |

Additional high-signal overlap found:
- `QUARANTINE/top-level-dirs/applications/terra-levy` exists as a 29-file full-stack candidate, but the current module source map points to a non-existent root-level `QUARANTINE/terra-levy` path instead.
- `QUARANTINE/top-level-dirs/applications/os-shell` is not a real shell copy; it contains only `terrafusion.app.json` and is best treated as metadata residue, not a restore source.

### `QUARANTINE/root-md`

This bucket is a markdown archive. The sampled files are trophy reports, cleanup plans, status writeups, migration summaries, and ceremonial completion documents.

Observed pattern:
- heavy concentration of `*_REPORT.md`, `*_SUMMARY.md`, `MISSION_*`, `CHAMPIONSHIP_*`, `PHASE_*`, and `WORKSPACE_*`
- no evidence in this pass of live runtime code referencing these files
- bucket-level references exist only in quarantine governance docs and planner/applier tests

Operational reading:
- treat as archive / keep-reference
- do not mine this bucket for implementation truth without a separate compare-first pass

### `QUARANTINE/root-artifacts`

This bucket contains non-markdown root remnants: scripts, configs, JSON reports, compose files, Dockerfiles, test configs, launchers, screenshots, migration logs, and backup manifests.

High-confusion duplicate examples:

| Quarantined file | Active overlap outside `QUARANTINE/` |
|---|---|
| `QUARANTINE/root-artifacts/service-registry.json` | `backend/service-registry.json` |
| `QUARANTINE/root-artifacts/playwright.config.ts` | `frontend/playwright.config.ts`, `tests/playwright.config.ts` |
| `QUARANTINE/root-artifacts/jest.integration.config.ts` | `frontend/jest.integration.config.ts` |
| `QUARANTINE/root-artifacts/Dockerfile` | multiple active Dockerfiles under `docker/`, `frontend/`, `backend/`, and `os-platform/` |
| `QUARANTINE/root-artifacts/docker-compose.yml` | active compose files under `compose/`, `backend/`, `ops/`, and `os-platform/` |

Operational reading:
- default category is `backup`
- default disposition is `compare-first`
- especially avoid treating this bucket as a restore source for shared hot files

### `QUARANTINE/frontend-dead-shell`

This bucket is a concentrated dead-shell bundle:
- shell variants: `QuantumDesktopShell.tsx`, `SimplifiedQuantumDesktopShell.tsx`
- component residue: `WebGLTranscendence.tsx`
- style bundle: multiple quantum/advanced architecture CSS files
- legacy tests: `QuantumOSIntegration.test.tsx` and CSS leak guards

Evidence gathered in this pass:
- live shell files in the active app are `frontend/apps/os-shell/src/shell/DesktopShell.tsx`, `ShellLayout.tsx`, `WindowManager.tsx`, `ModuleLauncher.tsx`, `SystemTray.tsx`
- no active runtime imports were found for the dead-shell files
- references found were historical docs only:
  - `docs/governance/slice-7.5-visual-qa-audit/*`
  - old `frontend/*.md` summaries
  - `os-platform/core/governance/WAVE_LEDGER.md`

Operational reading:
- category = `dead-shell`
- disposition = `archive`
- do not hand Copilot this subtree as an implementation search space

## Path Drift Found in Adjacent Docs

The following path claims are stale relative to the audited filesystem:

| Doc | Stale claim | Actual audited path |
|---|---|---|
| `docs/module-integration-map.md` | `QUARANTINE/terra-primeview-production` | `QUARANTINE/top-level-dirs/applications/terra-primeview-production` |
| `docs/module-integration-map.md` | `QUARANTINE/terra-levy` | `QUARANTINE/top-level-dirs/applications/terra-levy` |
| `docs/module-integration-map.md` | `QUARANTINE/terra-miner-production` | `QUARANTINE/top-level-dirs/applications/terra-miner-production` |
| `docs/module-integration-map.md` | `QUARANTINE/terra-fusion-sync` | `QUARANTINE/top-level-dirs/terra-fusion-sync` |
| `docs/module-integration-map.md` | `QUARANTINE/terra-dossier` | `QUARANTINE/top-level-dirs/applications/terra-dossier` |
| `docs/module-integration-map.md` | `QUARANTINE/bs-income-valuation-production` | `QUARANTINE/top-level-dirs/applications/bs-income-valuation-production` |

This ledger records the drift but does not patch that external doc, because this tranche is confined to audit outputs only.

## Control-Plane Recommendations

1. Treat `frontend-dead-shell` as closed archaeology unless a future visual-effects comparison is explicitly approved.
2. Treat `root-artifacts` as a duplicate-name backup bucket; no restore should start from it without a file-by-file diff against live paths.
3. Use the disposition matrix to distinguish restore-candidate islands from general quarantine noise before any Copilot task opens.
4. If a restore candidate is approved, Copilot should receive one exact path only, not a broad search over `QUARANTINE/`.
5. Keep the quarantine sweep read-only until a founder-approved restore decision exists.
