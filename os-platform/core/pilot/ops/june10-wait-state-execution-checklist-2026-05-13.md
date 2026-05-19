# June 10 Wait-State Execution Checklist

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` for independent implementation slices, or `superpowers:executing-plans` for inline execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep June 10 work moving while the TerraFusion Sync drain is active, without mutating runtime data or colliding with the Sync lane.

**Architecture:** Product runtime truth is TerraFusion DB -> TerraFusion API -> TerraFusion applications. Legacy/public systems are upstream acquisition sources only. While Sync is draining, Codex work is limited to static proofs, route-contract preparation, launch-control checklists, and non-runtime validation.

**Tech Stack:** .NET 8 API, PostgreSQL TerraFusion DB, React OS shell, Node truth gates, core governance scripts, generated evidence packets.

---

## Current Stop Condition

Runtime and DB readiness packets must not be regenerated until the active Sync drain has reached a terminal state.

Current observed state:

- Active process: `dotnet`, PID `56564`, responding.
- No API listener observed on `5046` or `5056`.
- Latest read-only drain observation: `os-platform/core/pilot/evidence/sync-drain-observation.latest.md`.
- Generated truth packets under `generated/truth/**` are stale relative to the active drain and the latest static source-decision corrections.

## Non-Negotiable Doctrine

- [ ] Product runtime uses TerraFusion DB only.
- [ ] Product runtime does not call upstream source systems directly.
- [ ] No generated readiness packet is trusted while Sync is mid-drain.
- [ ] No 39-county full workflow claim is made without product-load receipts and workflow-domain proof.
- [ ] Runtime-present rows do not count as lineage-proven without product-load receipt evidence.
- [ ] Redis and Rust remain post-launch unless a June 10 proof gate explicitly requires them.
- [ ] Stale/demo/package/archive surfaces are not promoted into the June 10 claim set.

## Work We Can Do While Waiting

### Lane A — Static Route-Contract Prep

Purpose: prepare exact implementation targets so the first post-drain route slice does not drift.

- [ ] Confirm every active County Studio frontend call in `frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts`.
- [ ] Confirm matching backend routes in `backend/src/TerraFusion.API/Controllers/CountyStudyController.cs`.
- [ ] List missing or mismatched routes as `route_missing`, `method_mismatch`, `payload_mismatch`, or `auth_mismatch`.
- [ ] Confirm `useCostForgeAPI` call sites under `frontend/apps/os-shell/src/hooks/useCostForgeAPI.ts`.
- [ ] Confirm matching backend routes in `backend/src/TerraFusion.API/Controllers/CostForgeController.cs`.
- [ ] Confirm OS shell API base convention so call sites do not create `/api/api/...`.
- [ ] Do not edit product code until the route-contract slice is explicitly opened.

Expected output:

- `os-platform/core/pilot/ops/june10-route-contract-gap-list-2026-05-13.md`

### Lane B — Post-Drain Command Readiness

Purpose: make the rerun sequence deterministic before touching runtime.

- [ ] Keep `scripts/truth/post-db-refresh-plan.mjs` as the canonical command list.
- [ ] Do not run `pnpm run truth:post-db-refresh-rerun` live until the API is cleanly started after Sync completion.
- [ ] Dry-run behavior is known: `TF_POST_DB_REFRESH_DRY_RUN=1 TF_POST_DB_REFRESH_SKIP_PREFLIGHT=1 pnpm run truth:post-db-refresh-rerun` writes plan artifacts and exits non-zero because no live proof was run.
- [ ] Remove dry-run artifacts if generated during wait-state checks.
- [ ] After Sync completes, run the live command only once the API is serving `GET /api/runtime/truth/db-identity`.

Post-drain command order:

```bash
pnpm run truth:post-db-refresh-rerun
pnpm run readiness:june10
pnpm run truth:june10-readiness-packet
```

### Lane C — UAT Script Prep

Purpose: define the exact user workflow before the browser/runtime pass.

- [ ] Open County Studio for Benton.
- [ ] Confirm TerraFusion DB identity badge or equivalent runtime-truth signal.
- [ ] Open or load Benton study.
- [ ] Derive/load county truth.
- [ ] Drill to city, neighborhood, and reval segment.
- [ ] Create a manual parcel-list cohort.
- [ ] Preview a scenario.
- [ ] Compare scenario posture.
- [ ] Promote approval state.
- [ ] Route to Dais.
- [ ] Reopen Dais draft and return downstream status.
- [ ] Route to Dossier.
- [ ] Reopen Dossier draft and return downstream status.
- [ ] Prepare apply handoff.
- [ ] Confirm apply-return state is backend-backed.
- [ ] Open Property Workbench with segment context.
- [ ] Verify Atlas tab context and geometry/trust posture.
- [ ] Export defense packet.

Expected screenshot set after runtime stabilizes:

- `county-studio-open-study.png`
- `county-studio-segment-drill.png`
- `county-studio-manual-cohort.png`
- `county-studio-scenario-compare.png`
- `county-studio-approval-apply-handoff.png`
- `county-studio-dais-return-receipt.png`
- `county-studio-dossier-return-receipt.png`
- `workbench-segment-context.png`
- `atlas-context-trust-posture.png`
- `defense-export-packet.png`

### Lane D — Launch-Command Hygiene

Purpose: prevent stale scripts from looking like supported launch paths.

- [ ] Inventory root `package.json` commands that reference missing compose/deploy paths.
- [ ] Classify each as `june10_canonical`, `post_launch`, `stale_needs_quarantine`, or `unknown_needs_owner`.
- [ ] Do not delete commands during wait-state; produce a gap list first.
- [ ] Confirm whether June 10 deployment uses Compose. If no, mark Compose proof as post-launch.
- [ ] If yes, open a dedicated Compose hygiene slice before deployment proof.

Expected output:

- `os-platform/core/pilot/ops/june10-command-hygiene-gap-list-2026-05-13.md`

### Lane E — Security/Secrets Hygiene Prep

Purpose: identify unsafe committed local configuration without blocking Sync.

- [ ] Locate appsettings and env files containing concrete local credentials.
- [ ] Classify each credential as `dev_local`, `test_fixture`, `secret_leak_candidate`, or `legacy_reference`.
- [ ] Do not rotate, rewrite, or delete credentials in this wait-state checklist.
- [ ] Open a dedicated secrets hygiene slice if any file is a real leak candidate.

Expected output:

- `os-platform/core/pilot/ops/june10-secrets-hygiene-gap-list-2026-05-13.md`

## Work That Must Wait

- [ ] Regenerate `generated/truth/**`.
- [ ] Run live `readiness:june10`.
- [ ] Start or restart the API.
- [ ] Kill or interrupt PID `56564`.
- [ ] Mutate TerraFusion DB.
- [ ] Run source-system ingestion.
- [ ] Claim Benton full-corpus verification.
- [ ] Capture final UI screenshots.

## Post-Drain Execution Gate

When Sync reaches completed, failed, or interrupted:

- [ ] Record terminal Sync status.
- [ ] Start a clean API from the intended build.
- [ ] Confirm `GET /health` or `/healthz/ready`.
- [ ] Confirm `GET /api/runtime/truth/db-identity`.
- [ ] Run `pnpm run truth:post-db-refresh-rerun`.
- [ ] Run `pnpm run readiness:june10`.
- [ ] If readiness fails, convert blockers into a narrow bug queue.
- [ ] If readiness passes, run UAT browser workflow and screenshot proof.

## Ship-Blocker Queue From Current Audit

These are the first slices after post-drain proof, unless the refreshed readiness packet changes the order:

1. `post-sync-readiness-rerun`
   - Owner: Codex
   - Gate: `pnpm run truth:post-db-refresh-rerun`
   - Stop if API is unavailable or DB identity is wrong.

2. `route-contract-parity`
   - Owner: Codex
   - Scope: County Studio routes, CostForge routes, runtime truth auth, `/api` prefix normalization.
   - Gate: route-contract unit tests plus focused frontend API tests.

3. `product-load-receipt-lineage`
   - Owner: Claude Code if schema/load receipts are still in Sync lane; Codex if only truth-gate interpretation remains.
   - Gate: `pnpm run truth:terrafusion-db-product-load-ledger`.

4. `benton-uat-screenshot-proof`
   - Owner: Codex
   - Gate: browser walk, screenshots, `pnpm run truth:june10-readiness-packet`.

5. `ui-polish-active-path-only`
   - Owner: Codex
   - Scope: active Benton workflow copy, apply-lane clarity, Dais certification placeholder posture.
   - Gate: screenshot review and targeted frontend tests.

## Cut Line

Do not spend June 10 time on:

- Rust/Tauri integration.
- Redis hard dependency.
- broad AI-swarm expansion.
- 39-county full workflow claims.
- Compose production proof unless Compose is the actual June 10 deploy path.
- archived package cleanup.
- broad source-system terminology rename.
