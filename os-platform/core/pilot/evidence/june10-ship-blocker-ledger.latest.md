# June 10 Ship Blocker Ledger

Generated: 2026-05-15T16:56:53.510Z

Launch verdict: NO_GO
Readiness status: FAIL
Red-team verdict: RED

## Summary

- Blocker groups: 11
- Readiness blockers: 23
- Launch stop conditions: 4
- Critical red-team attacks: 3
- P0 groups: 6
- P1 groups: 5

## Blocker Groups

| Priority | Source | Count | Owner lane | Next command |
|---|---|---:|---|---|
P0 | productLoadLedger | 14 | Claude Code / Sync DB, audited by Codex | `pnpm run truth:terrafusion-db-product-load-ledger`
P0 | bentonPilotClosure | 7 | Codex after all Benton data gates are green | `pnpm run truth:benton-runtime-pilot-closure`
P0 | launchControl | 4 | Codex | `pnpm run truth:june10-launch-control`
P0 | redTeam:benton_realism | 1 | Codex / launch-control review | `pnpm run truth:june10-red-team`
P0 | redTeam:governance_posture | 1 | Codex / launch-control review | `pnpm run truth:june10-red-team`
P0 | redTeam:runtime_lineage | 1 | Codex / launch-control review | `pnpm run truth:june10-red-team`
P1 | crosswalk | 1 | Codex | `pnpm run truth:washington-39-county-data-crosswalk`
P1 | runtimeCandidateSet | 1 | Codex after runtime registration ledger refresh | `pnpm run truth:runtime-candidate-set`
P1 | redTeam:county_trust | 1 | Codex / launch-control review | `pnpm run truth:june10-red-team`
P1 | redTeam:overclaim_risk | 1 | Codex / launch-control review | `pnpm run truth:june10-red-team`
P1 | redTeam:uat_survivability | 1 | Codex / launch-control review | `pnpm run truth:june10-red-team`

## Details

### P0 productLoadLedger

Owner: Claude Code / Sync DB, audited by Codex

Required resolution: Emit/read product-load receipts proving TerraFusion DB table rows were loaded through the approved ingestion path.

- Artifact reports failed proof posture: top-level passed is false.
- Artifact reports failed proof posture: summary.lineageProven is false.
- receiptEvidence: ProductLoadReceipts table is missing.
- canonical_tf.tf_parcel: Table missing or unreadable.
- canonical_tf.tf_sale: Rows exist but no product load receipt proves lineage.
- CanonicalSaleQualifications: Rows exist but no product load receipt proves lineage.
- CamaCharacteristics: Rows exist but no product load receipt proves lineage.
- ImprovementDetails: Table exists but is empty.
- LandSegments: Table exists but is empty.
- GisParcelGeometries: Rows exist but no product load receipt proves lineage.
- DossierPackets: Table exists but is empty.
- CountyDownstreamClosureReceipts: Table exists but is empty.
- CountyApplyHandoffReceipts: Table exists but is empty.
- TerraFusion DB product load ledger is not lineage-proven.

### P0 bentonPilotClosure

Owner: Codex after all Benton data gates are green

Required resolution: Prove Benton runtime pilot closure only after DB identity, content, load receipts, parcel sanity, and sale qualification pass.

- Artifact reports failed proof posture: top-level status is FAIL.
- June 10 runtime scope is runtime_scope_requires_review, expected benton_only_runtime_pilot.
- Expected exactly one runtime-proven county; found 39.
- Expected 38 provenance-only counties; found 0.
- Benton ratio-study window has no final-decision qualified sales.
- Benton runtime pilot closure is not passing.
- Benton runtime pilot closure does not prove canonical sale qualification and Benton-only scope.

### P0 launchControl

Owner: Codex

Required resolution: Clear launch-control stop conditions.

- June 10 readiness packet is not passing.
- Credibility red-team verdict is RED.
- Launch claim guard is LOCKED.
- P0 burn-down is not clear.

### P0 redTeam:benton_realism

Owner: Codex / launch-control review

Required resolution: Clear or contain the credibility attack before public readiness claims.

- Benton full-corpus proof is an ATTEMPT, not a seal; six-lane completion and API readback are not proven.

### P0 redTeam:governance_posture

Owner: Codex / launch-control review

Required resolution: Clear or contain the credibility attack before public readiness claims.

- Final readiness packet is failing, so any production approval claim outruns the proof record.

### P0 redTeam:runtime_lineage

Owner: Codex / launch-control review

Required resolution: Clear or contain the credibility attack before public readiness claims.

- Rows may exist in TerraFusion DB, but product-load lineage is not proven enough for audit-grade trust.

### P1 crosswalk

Owner: Codex

Required resolution: Keep 39-county runtime claims prohibited unless every promoted county has TerraFusion DB runtime proof.

- Crosswalk runtime-proven count does not match runtime candidate set.

### P1 runtimeCandidateSet

Owner: Codex after runtime registration ledger refresh

Required resolution: Keep June 10 scope locked to Benton runtime pilot unless evidence-backed county promotion is deliberately completed.

- Runtime candidate set does not prove Benton-only June 10 scope.

### P1 redTeam:county_trust

Owner: Codex / launch-control review

Required resolution: Clear or contain the credibility attack before public readiness claims.

- The 38-county seed lane has work orders and templates but no actual source receipts yet.

### P1 redTeam:overclaim_risk

Owner: Codex / launch-control review

Required resolution: Clear or contain the credibility attack before public readiness claims.

- County-scope language is still easy to overread as statewide runtime readiness.

### P1 redTeam:uat_survivability

Owner: Codex / launch-control review

Required resolution: Clear or contain the credibility attack before public readiness claims.

- Benton pilot closure is not passing, so end-to-end UAT can fail even if individual data checks pass.

## Rules

- This ledger prioritizes blockers; it does not clear them.
- P0 blockers must clear before June 10 GO can be considered.
- Launch-control stop conditions and red-team critical attacks are ship blockers.
- Owner lanes describe execution responsibility; proof commands are the required verification surface.
