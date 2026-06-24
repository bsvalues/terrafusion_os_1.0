# Root Containment Table (Lane 4 — Root Topology Audit)

*Deliverable #5.* Status: **complete**. Confidence: **high**.
Method: `ls -la`, `du -sh`, residue agent inventory.

Root inventory: **25 directories**, **86 loose files** at repo root.

## 1. Root directories — category assignment

| Directory | Category | Source-bearing? | Note |
|---|---|---|---|
| `backend/` | runtime/source (.NET) | yes | kernel, AI, consciousness(stubs), gateway, security |
| `frontend/` | runtime/source (React) | yes | `apps/os-shell` is canonical shell |
| `os-platform/` | source + AI islands + tests | yes | live core + quarantined ai-systems |
| `packages/` | source (domain pkgs) | yes | forge/sync/levy/permit/gis; incl. `government-edition` (excluded from workspace) |
| `native-shell/` | source (WPF) + build target | partial | `ui/dist` is frontend build output |
| `docs/` | documentation (canonical) | yes | this register lives here |
| `ops/`, `.governance/`, `.terrafusion/` | governance/runtime state | yes | load-bearing control manifests |
| `tests/`, `golden/` | tests/fixtures | yes | |
| `scripts/`, `tools/`, `Makefile` | tooling/CI | yes | `tools/dev/dev-os.mjs` launcher |
| `compose/`, `docker/`, `infrastructure/`, `grafana/`, `azure-pipelines/` | infra/CI | yes | |
| `config/`, `configs/`, `database/`, `data/`, `policy/`, `brain/` | config/data/reference | mixed | `config/` vs `configs/` is a confusion pair (Lane 10) |
| `apps/` | source | yes | pnpm workspace member |
| `dev-audit/`, `.ci_artifacts_local/`, `.ci_test_results/` | CI artifacts | no | minimal, organized |
| **`QUARANTINE/`** | **residue (isolated)** | no | **2.3 GB / 161 dirs** — dead replicas, scaffolds; correctly contained |

## 2. Root loose files — flags

| Item | Category | Disposition |
|---|---|---|
| `phase4b.manifest.json` (1.1M), `phase4c.readiness.manifest.json` (528K), `phase4d…4n.*.json` | evidence/governance manifests | **KEEP**, but root-cluttering — candidate to relocate under `docs/governance/phase4/` (Lane 13) |
| `shell-defect-ledger.json`, `ui-token-*.json`, `tdc.config.json`, `sovereign.yaml`, `platform.json` | live config/contracts | KEEP at root |
| `_validator_proof.log.err` (3.8K) | **residue** (port-5000 bind error log) | **QUARANTINE** — only true residue in live tree |
| `TerraFusion.sln`, `global.json`, `pnpm-*.yaml`, `tsconfig*.json`, `package.json`, `renovate.json`, `vitest*.config.ts` | build/workspace roots | KEEP |
| Canon docs: `CLAUDE.md`, `STANDARD.md`, `AGENTS.md`, `AGENT_OPERATING_MODEL.md`, `REPO_MAP.md`, `SEALED.md`, `SPRINT.md`, `SUSTAINMENT.md`, `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `FOUNDER_QUICKSTART.md` | canonical docs | KEEP |

## 3. Containment verdict

- **No build outputs** (`dist/`, `node_modules/`) committed at root. ✅
- **Source is cleanly separated** from residue; the 2.3 GB of dead material is already
  fenced inside `QUARANTINE/`.
- **Root clutter** is the phase4*.json manifest cluster (≥13 files, ~3 MB) + the one
  stray `.err` log. These are *tidiness*, not *containment failure*.
- **Confusion pair**: `config/` vs `configs/` at root — flag for Lane 10.

> Per doctrine, **no relocation/quarantine action is taken now** (recovery lock active).
> These are recorded as Lane 13 candidates only.
