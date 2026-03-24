# CP-R3 Gate Rerun Results

Date: 2026-03-19
Phase: Phase 4 — PR #656 Integrity Verification (post-Phase-3)
Gate: R3 Integrity Gate

## Note

This artifact documents the rerun gate results captured during Phase -1 execution on 2026-03-19.
A full Phase 3 post-merge rerun is required once Phase 3 (CP-16) is complete.

## Phase -1 Truth Gate Rerun (2026-03-19) — Confirmed Green

| Gate | Command | Result | Count |
|---|---|---|---|
| dotnet build | `dotnet build TerraFusion.sln --configuration Release` | 0 errors | — |
| TypeScript typecheck | `pnpm run type-check` (tsconfig.core.json) | 0 errors | — |
| Phase83 tools | `node --test os-platform/core/tests/phase83-tools.test.mjs` | PASS | 56/56 |
| Phase85 tools | `node --test os-platform/core/tests/phase85-tools.test.mjs` | PASS | 22/22 |
| Phase86 toolrunner | `node --test os-platform/core/tests/phase86-toolrunner.test.mjs` | PASS | 9/9 |
| Auth suite | vitest auth | PASS | 532/532 |
| Generated JS headers | `node tools/registry/check-generated-js.mjs` | PASS | headers verified |

Full run evidence: `.governance/workflow/TRUTH_GATE_2026-03-19.md`

## PR #656 Integrity (confirmed)

| Item | Value |
|---|---|
| State | MERGED |
| Merged at | 2026-03-10T13:55:35Z |
| Merge commit | 24531f37a9ea785a99c1b7e4e1dd70c294af1a0c |
| R1 signed SHA | eef087493343d292efa2681bddc217b76e0ee6b3 |
| SHA object type | commit (confirmed `git cat-file -t`) |

Full integrity proof: `docs/superpowers/artifacts/cp-r3/pr656-integrity-proof.md`

## Post-Phase-3 Full Rerun (PENDING)

Once Phase 3 (CP-16) is complete and all upstream phases are green:

```bash
dotnet build TerraFusion.sln --configuration Release
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
node --test os-platform/core/tests/phase85-tools.test.mjs
node --test os-platform/core/tests/phase86-toolrunner.test.mjs
pnpm vitest run src/__tests__/auth/
```

Target: 0 errors, 56/56, 22/22, 9/9, 532/532 — matching Phase 20 baseline.

## Evidence Fields (to fill after Phase 3 completion)

| Gate | Pre-Phase-3 | Post-Phase-3 | Status |
|---|---|---|---|
| dotnet build errors | 0 | — | PENDING |
| tsc errors | 0 | — | PENDING |
| phase83 | 56/56 | — | PENDING |
| phase85 | 22/22 | — | PENDING |
| phase86 | 9/9 | — | PENDING |
| auth | 532/532 | — | PENDING |
