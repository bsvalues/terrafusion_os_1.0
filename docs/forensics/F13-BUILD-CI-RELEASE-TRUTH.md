# F13 — Build / CI / Release-Path Truth Audit

*Loop 2 deliverable.* Status: **complete**. Confidence: **high** (medium on dormant-count).
Goal: distinguish real build/CI/release truth from decorative/broken automation.

## Scale
**~91 workflows / ~27,000 lines of YAML** in `.github/workflows/`. Per the repo's own
workflow policy: REQUIRED ~5, OPTIONAL ~22, SCHEDULED ~8, MANUAL ~12, **DEPRECATED/DORMANT ~44**.

## CI workflow truth table (significant)

| Workflow | Trigger | Enforces | Class |
|---|---|---|---|
| `seal-gate-fast.yml` | PR (main/develop), push | Classify + Frontend + Backend + Governance (aggregate) | **REQUIRED** (sole merge gate) |
| `ci.yml` | push/PR | Quality → Vitest → Frontend → Backend (legacy path) | ACTIVE |
| `dotnet-test.yml` | reusable | backend tests + Phase-4 security gates | REQUIRED (called) |
| `release-lane.yml` | workflow_dispatch | staging/prod deploy + SLA validation | REAL (manual) |
| `ci-cd.yml` | push | compliance/security/test matrix | DECORATIVE |
| `nightly.yml` | schedule 2am | E2E, container scan, SBOM | STALE |
| `autonomy-*`, `county-kit-parity`, `golden-corpus-compat` (~44) | various | — | DORMANT/DEPRECATED |

## Build entrypoint map
- **Backend:** `dotnet build backend/TerraFusion.sln -c Release /warnaserror` → `bin/Release/net8.0/`.
- **Frontend:** `pnpm -C frontend run build` → `native-shell/ui/dist/`.
- Orchestration: `Makefile` (`ci-build`, `ci-test`, Gate A–F `oneclick`), root `package.json` (77 scripts).

## Release-path map
- **Real:** `release-lane.yml` (manual dispatch; enforces env secrets, SLA, SHA pinning).
- **Mixed:** `scripts/deploy-production.sh`, `backend/deploy-phase-beta.sh`, Gate A–F bash.
- **Stale/decorative:** Benton demo (`make demo-benton`).

## False-confidence controls (the important part)

| # | Control | Location | Issue | Severity |
|---|---|---|---|---|
| 1 | **Seal Gate "cancelled-as-failed"** | `seal-gate-fast.yml` ~L676–764 (`case` on `needs.*.result`) | `*)` default treats `cancelled` (concurrency/supersession) as FAILED → false merge-block | 🔴 FOOT-GUN |
| 2 | **Lint escape hatch** | `seal-gate-fast.yml` ~L206–217 | lint non-blocking **until 2026-06-30** (auto-hardens in days) | 🟡 ticking |
| 3 | **Governance soft-fail** | `seal-gate-fast.yml` ~L538–597 | ~91 gov tests run `continue-on-error: true` until 2026-06-30 | 🟡 advisory |
| 4 | **Classifier drift risk** | `scripts/ci/changed_files_classifier.mjs` | hardcoded path patterns → new dirs could be misclassified docs_only and skip CI | 🟡 medium |

> **Control #1 directly explains the PR #1080 Seal Gate "failures":** my rapid successive
> pushes cancelled in-flight upstream jobs; the gate read `cancelled` as FAILED on the
> superseded commits. This is a repo-wide foot-gun, not specific to this PR.

## Verdict
Build + classification + release pipeline are **real and high-confidence**. Merge
enforcement is **thin** (effectively one gate), governance is **advisory until 2026-06-30**,
and ~44 dormant workflows create noise. The Seal Gate aggregation logic is a genuine
false-confidence hazard worth fixing (add an explicit `cancelled)` case) — recorded as a
Lane 10 / R-lane candidate, **not** actioned under recovery lock.
