# F12 — Dependency / Package-Manager Truth Audit

*Loop 2 deliverable.* Status: **complete**. Confidence: **high**.
Goal: which dependency systems are real/active vs conflicting/historical/dead.

## Package-manager inventory

| Ecosystem | Active? | Authoritative file | Scale |
|---|---|---|---|
| **JS — pnpm** | YES | `pnpm-lock.yaml` (1.2M, v9.0) + `pnpm-workspace.yaml` | 188 package.json |
| **.NET — NuGet (central)** | YES | `backend/Directory.Packages.props` (`ManagePackageVersionsCentrally`) | 43 `.csproj` |
| **Python — pip/poetry** | minimal/isolated | per-package `pyproject.toml`/`requirements.txt` | 4 pkgs |
| **Rust — cargo** | minimal/isolated | per-tool `Cargo.toml` (`.cargo/` at root) | 2 tools |
| **npm (legacy)** | DEAD (gated) | `QUARANTINE/.../harness/package-lock.json` | gitignore-excepted for CI cache |
| Yarn / Go | ABSENT | — | 0 |

## Authoritative determination
- **JS:** single authoritative `pnpm-lock.yaml` (v9.0); no competing JS lockfile in the live tree.
- **.NET:** central package management via `Directory.Packages.props`; all 43 projects inherit versions.

## Conflicting / duplicate lockfiles
**None unintended.** The only stray `package-lock.json` is inside QUARANTINE and is an explicit, governed `.gitignore` exception for CI npm caching.

## Dead / vendored / excluded surface
- 5 packages **explicitly excluded** in `pnpm-workspace.yaml` with documented reasons:
  `gis-pro` (@turf/sweepline gap), `legislative-pulse` (bogus `@radix-ui/react-badge`),
  `property-tax-ai` (js-tiktoken gap), `terra-permit` (ibm-cloud-sdk gap),
  `government-edition-enhanced-MARKED-FOR-REVIEW`.
- **No committed `node_modules`**; no duplicated dependency trees in the live tree.
- `os-platform/core` is a standalone CommonJS package not in the workspace (legacy bridge).

## Verdict
**This is the cleanest lane.** Dependency/package management is **REAL, ACTIVE, and CLEAN** — two well-layered ecosystems (pnpm + NuGet), single authoritative lockfiles, excluded packages explicitly accounted for. No hidden conflicts or dead weight in the active workspace. (Contrast sharply with the git-history and schema lanes.)
