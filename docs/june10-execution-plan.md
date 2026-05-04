# June 10 TerraForge Execution Plan

Status: locked execution plan
Updated: 2026-05-04

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
