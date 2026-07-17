# WO-PORTFOLIO-005 - Evidence Publisher Capacity Repair

## Result

`EVIDENCE_PUBLISHER_CAPACITY_REPAIRED`

## Live Failure Evidence

| Evidence | Observed truth |
|----------|----------------|
| Workflow | `Autonomy Evidence Publisher` |
| Failed run | `29553323267` for merged PR #1297 |
| Exact workflow SHA | `5049ed24eda651ac4896b2ccfcbf5ceed3ac04b6` |
| Completed proof | bundle generation, strict verification, keyless signing, signature-triplet parity, and custody checks |
| Failing step | `Create or Update Release` |
| GitHub response | `ReleaseAsset file_count limited to 1000 assets per release` |
| Saturated release | `autonomy-evidence/2026-07` |
| Live asset count | `1000` |

The incident is a publication-capacity defect. It does not invalidate the merged PR or the evidence
that completed before upload.

## Repair Decision

Each workflow run now uses a deterministic release shard named
`autonomy-evidence-shard-YYYY-MM-RUN_ID`. A retry of the same workflow run remains idempotent because
it targets the same shard; different runs cannot accumulate assets in one release.

No existing release, tag, asset, evidence bundle, signature, or custody record is deleted or changed.
The one-year release-retention contract is preserved and now documents the capacity rule and legacy
monthly-release posture.

## Scope and Non-Claims

- No product, backend, frontend, or OS runtime behavior changes.
- No county, PACS, SQL, credential, secret, or production resource access.
- No branch-protection or required-check bypass.
- This change prevents future shared-release saturation; it does not retroactively republish failed
  historical runs or delete the full July release.

## Validation Record

Local validation on the candidate branch:

- frozen `corepack pnpm install --frozen-lockfile`: PASS; `package.json` and `pnpm-lock.yaml` SHA-256
  hashes unchanged and no tracked bootstrap residue;
- evidence-publisher contract tests: PASS, 29 tests;
- Work Order query/report/wave-planner regressions: PASS, 42 tests;
- core type-check: PASS;
- phase83 tools: PASS, 56 tests;
- scoped Prettier check and `git diff --check`: PASS;
- `wo-query --json`: PASS; the completed WOE seed chain, LocalOps, and WO-PORTFOLIO-005 are not
  returned as executable;
- Brain review-diff: exact Work Order scope PASS for all 12 files; aggregate remains blocked only by
  the unchanged repository-wide `write-lanes` baseline, not this diff.

Remote required checks, exact-head assurance, and zero unresolved review threads remain protected
merge conditions.

STOP_TYPE: `EVIDENCE_PUBLISHER_CAPACITY_REPAIRED`
