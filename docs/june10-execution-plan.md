# June 10 TerraForge Execution Plan

Status: locked execution plan
Updated: 2026-05-04

## Operations Prompt Layer

Use `.github/ai-prompts/june10-command-pack.md` as the June 10 launch-control prompt suite. Its `/j10-war-room`, `/j10-truth-gate`, `/j10-ship-blocker`, `/j10-benton-uat`, `/j10-executive-reality`, `/j10-cut-line`, and `/j10-final-readiness` prompts are the operator prompt layer for applying this execution doctrine without feature drift.

## Source-Of-Truth Vocabulary

This plan uses these terms exactly:

| Term | Meaning |
|---|---|
| TerraFusion DB | The application/product source of truth. TerraForge Suite runtime reads from this database through TerraFusion API. |
| TerraFusion API | The only product runtime access layer for County Studio, CostForge, SalesForge, Atlas, Workbench, Dais, and Dossier. |
| TerraFusion Sync | The ingestion/validation bridge that moves upstream data into TerraFusion DB. |
| Legacy/public source systems | Upstream inputs only. They may be used by Sync, admin diagnostics, reconciliation, and proof, but not by product runtime workflows. |

Correct runtime path:

```text
Legacy/public source systems
  -> TerraFusion Sync / ingestion / validation
  -> TerraFusion DB
  -> TerraFusion API
  -> TerraForge Suite applications
```

Forbidden runtime path:

```text
TerraForge Suite application or product API
  -> legacy DB / source connection / source scraper
```

## Non-Negotiable Runtime Boundary

TerraFusion DB is the source for the application.

County Studio, CostForge, SalesForge, Atlas, Workbench, Dais, and Dossier must consume TerraFusion API responses backed by TerraFusion DB canonical/runtime tables. Legacy/public sources are not product runtime dependencies.

## June 10 Claim Shape

Do not claim 39-county runtime readiness unless every county has runtime lineage proof from TerraFusion DB.

Current launch posture is:

| Scope | Claim |
|---|---|
| Benton | Runtime pilot only after TerraFusion DB identity, load receipts, active/current parcel sanity, sales qualification, and live UAT pass. |
| Washington 39 counties | Provenance/acquisition inventory until crosswalk and runtime contract prove more. |
| CostForge outside Benton | Public-source/model-derived only where TerraFusion DB inputs support it; no official county-certified claim. |

## Execution Tracks

| Track | Owner | Purpose | Required Proof |
|---|---|---|---|
| A. TerraFusion DB / Sync Closure | Claude Code | Land validated upstream data into TerraFusion DB and emit product-load receipts. Product runtime remains TerraFusion DB only. | `truth:terrafusion-db-product-load-ledger`, `truth:benton-parcel-count-sanity`, `truth:runtime-db-content`, `truth:runtime-db-identity` |
| B. 39-County Data Crosswalk | Codex | Prove what data exists for every WA county and why each county is or is not runtime-ready. | `truth:washington-39-county-data-crosswalk` |
| C. County Runtime Contract | Codex | Make runtime promotion county-neutral, not Benton-special. | county identity, active/current semantics, load receipt, no fallback, no PII projection |
| D. Benton Runtime Pilot Closure | Codex after Track A | Prove Benton can support the June 10 runtime pilot from TerraFusion DB. | `truth:benton-runtime-pilot-closure`, `truth:runtime-sale-qualification` |
| E. Live County Studio UAT | Codex | Prove the full user workflow with real TerraFusion DB data and screenshots. | browser/screenshots, evidence packet, downstream receipts |
| F. Deployment Hardening | Codex | Make readiness enforceable and deploy-safe. | `readiness:june10`, CI artifact, Rust kernel smoke, release smoke |

## Parallel Execution Contract

Work can proceed in parallel, but only across these lanes:

| Lane | Allowed Work | Must Not Do |
|---|---|---|
| Claude Code / Sync DB | Load TerraFusion DB, emit product-load receipts, prove DB identity/content. | Product UI work, direct product runtime source-system access, readiness claim changes. |
| Codex / Readiness Gates | Build truth gates, packet blockers, county-neutral runtime contract, UAT proof. | Mutate source data, bypass TerraFusion DB, invent rows, touch ingestion implementation without explicit handoff. |
| Codex / Product UAT | Run County Studio workflow after data gates pass, capture screenshots and defects. | Start UAT from provisional row counts or unproven DB identity. |
| Deployment Hardening | Package, smoke, deployment config, CI artifact capture after readiness gates are green. | Add features after the cut line. |

The operator source of truth is:

```bash
pnpm run truth:june10-readiness-packet
```

That packet must list every open blocker with an owner lane and next command. If the packet is red, June 10 readiness is red.

## Ship Blockers

- Running API TerraFusion DB identity is not proven.
- Product load receipts are missing or not read by the ledger.
- Benton active/current parcel count sanity is not proven.
- Benton qualified-sales lineage is not green.
- 39-county runtime claim is prohibited until TerraFusion DB runtime proof exists per county.
- No single live Benton end-to-end UAT packet exists yet.
- Rust kernel deployment packaging must be proven, not just local-build proven.
- June 10 readiness must be captured as a final artifact before deployment.

## Immediate Order

1. Keep Claude focused on TerraFusion Sync / TerraFusion DB load closure.
2. Build and run the Washington 39-county data crosswalk in parallel.
3. Convert county runtime proof from Benton-special to county-neutral.
4. Rerun TerraFusion DB identity, content, load-ledger, and parcel sanity gates after Claude lands DB work.
5. Run Benton pilot closure only after DB/load/parcel/sales gates are clean.
6. Run live Benton County Studio UAT with screenshots and packet proof.
7. Freeze feature work and run deployment hardening only.

## Cut Line

Every remaining task is one of:

- `SHIP_BLOCKER`
- `POST_LAUNCH`
- `CUT`

There is no fourth category.

## Active Execution Checklist

This checklist is the working control board. Any June 10 slice must update this section before work starts and after proof gates run. No work proceeds from memory or momentum.

Status values:

- `DONE`: implemented and proof artifact exists.
- `ACTIVE`: currently being executed.
- `WAITING`: blocked by another lane.
- `NEXT`: next executable task when prerequisites are met.
- `BLOCKED`: cannot progress until the blocker is removed.
- `POST_LAUNCH`: explicitly not June 10 work.

### Control Rules

| Status | Item | Owner | Proof / Exit Gate |
|---|---|---|---|
| DONE | Source-of-truth vocabulary locked: TerraFusion DB is product truth; upstream systems are ingestion/proof only. | Codex | This document. |
| DONE | No 39-county runtime claim unless every county has TerraFusion DB runtime proof. | Codex | `generated/truth/runtime-candidate-set.*`, `generated/truth/washington-39-county-data-crosswalk.*` |
| ACTIVE | Keep readiness work in the June 10 Codex worktree, separate from Claude Sync/DB work. | Codex | `git status --short --branch` before edits. |
| ACTIVE | Do not duplicate existing ledgers. Extend existing truth gates only when they are missing a required decision. | Codex | Existing script/artifact checked before creating new script. |
| DONE | Settle generated truth artifact governance: `generated/truth/**` is local/CI output, not tracked source. | Codex | `node scripts/repo-shape-guard.mjs` |

### Track A - TerraFusion DB / Sync Closure

| Status | Item | Owner | Proof / Exit Gate | Notes |
|---|---|---|---|---|
| WAITING | Finish TerraFusion DB load/Sync repair. | Claude Code | Product tables populated in TerraFusion DB with receipts. | Codex does not mutate source data or run upstream credentials. |
| WAITING | Emit or expose product-load receipts for runtime tables. | Claude Code | `pnpm run truth:terrafusion-db-product-load-ledger` can mark required rows `lineage_proven`. | Rows without receipts stay untrusted. |
| WAITING | Resolve Benton parcel count shape. | Claude Code | Active/current distinct parcel count falls inside expected range and has proof. | Raw `Properties` count is not accepted as active parcel truth. |

### Track B - Washington 39-County Data Crosswalk

| Status | Item | Owner | Proof / Exit Gate | Notes |
|---|---|---|---|---|
| DONE | Create 39-county evidence crosswalk. | Codex | `scripts/truth/washington-39-county-data-crosswalk.mjs` and test exist. | Do not rebuild as a duplicate ledger. |
| DONE | Generate current 39-county crosswalk artifact locally. | Codex | `pnpm run truth:washington-39-county-data-crosswalk` | Generated reports are local/CI artifacts under ignored `generated/truth/**`. |
| NEXT | Re-run crosswalk after Claude DB work lands. | Codex | `pnpm run truth:washington-39-county-data-crosswalk` | Only promote counties with TerraFusion DB runtime proof and receipts. |
| DONE | Add per-county activation status, next action, and owner inside the existing crosswalk. | Codex | `node --test scripts/truth/washington-39-county-data-crosswalk.test.mjs` | Use existing crosswalk, not a second ledger. |

### Track C - County-Neutral Runtime Contract

| Status | Item | Owner | Proof / Exit Gate | Notes |
|---|---|---|---|---|
| DONE | Runtime candidate set blocks 39-county claim. | Codex | `pnpm run truth:runtime-candidate-set` | Current scope is not a 39-county runtime claim. |
| DONE | County runtime contract gate exists. | Codex | `scripts/truth/county-runtime-contract.mjs` and test exist. | Validate current behavior before extending. |
| DONE | Verify contract is county-neutral and not Benton-special. | Codex | Contract test includes non-Benton runtime-proven fixture/case. | No county name hardcoding for promotion. |
| DONE | Ensure contract requires TerraFusion DB load receipt, county identity echo, active/current semantics, no fallback, and product API consumption. | Codex | `node --test scripts/truth/county-runtime-contract.test.mjs` | This becomes promotion law for all counties; live gate remains red until DB proofs exist. |

### Track D - Benton Runtime Pilot Closure

| Status | Item | Owner | Proof / Exit Gate | Notes |
|---|---|---|---|---|
| BLOCKED | Trust Benton parcel row count. | Codex after Claude DB | DB identity, content audit, parcel sanity, and load ledger pass. | Current raw count is not accepted as active/current proof. |
| BLOCKED | Prove Benton qualified-sales lineage. | Codex after Claude DB | `pnpm run truth:runtime-sale-qualification` and pilot closure pass. | No manual row mutation. |
| BLOCKED | Mark Benton runtime pilot ready. | Codex | `pnpm run truth:benton-runtime-pilot-closure` passes. | Only after DB and sales gates are green. |

### Track E - Live County Studio UAT

| Status | Item | Owner | Proof / Exit Gate | Notes |
|---|---|---|---|---|
| WAITING | Run full Benton workflow with real TerraFusion DB data. | Codex | Screenshots plus UAT evidence packet. | Do not run from provisional row counts. |
| WAITING | Confirm County Studio can load, inspect, compare, approve, route, receive, prepare apply handoff, and export defense packet. | Codex | Browser smoke and evidence packet. | Failures become ship blockers, not new feature drift. |
| WAITING | Confirm 38 counties do not display runtime-ready claims. | Codex | Browser proof or readiness artifact. | They may show provenance/acquisition status only unless promoted by proof. |

### Track F - Deployment Hardening

| Status | Item | Owner | Proof / Exit Gate | Notes |
|---|---|---|---|---|
| BLOCKED | Final June 10 readiness packet. | Codex | `pnpm run truth:june10-readiness-packet` passes. | Must include DB identity, content, load receipts, crosswalk, contract, Benton pilot closure, and UAT. |
| NEXT | CI/governance mergeability. | Codex | Required PR checks green. | Root generated truth artifacts are no longer tracked; remaining CI must be rechecked after push. |
| BLOCKED | Deployment smoke. | Codex | Runtime smoke against packaged app. | No feature work after readiness packet is green. |

## Next Work Queue

Do these in order, unless Claude's DB work lands and changes the blockers:

1. `NEXT`: Recheck PR CI/governance after removing tracked generated truth artifacts.
2. `WAITING`: After Claude DB work lands, rerun DB identity/content/load-ledger/parcel sanity/sales qualification gates.
3. `WAITING`: Rerun 39-county crosswalk and runtime contract against the updated TerraFusion DB.
4. `WAITING`: Run Benton UAT only after data gates are green.
