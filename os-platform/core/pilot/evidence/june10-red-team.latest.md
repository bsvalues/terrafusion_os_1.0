# June 10 Credibility Attack Report

Generated: 2026-05-14T22:13:04.152Z

Verdict: RED

## Summary

- Attacks: 7
- Critical attacks: 3
- High attacks: 3
- Ship blockers: 23
- Seed receipts found: 0
- Benton corpus sealed: false
- Readiness status: FAIL

## Credibility Attacks

| Surface | Severity | Attack | Evidence |
|---|---|---|---|
governance_posture | CRITICAL | Final readiness packet is failing, so any production approval claim outruns the proof record. | 23 ship blocker(s); readiness status FAIL.
runtime_lineage | CRITICAL | Rows may exist in TerraFusion DB, but product-load lineage is not proven enough for audit-grade trust. | lineageProven=0; rowsExistLineageUnproven=4.
benton_realism | CRITICAL | Benton full-corpus proof is an ATTEMPT, not a seal; six-lane completion and API readback are not proven. | runStatus=Interrupted; lanesCompleted=0; sealed=false.
uat_survivability | HIGH | Benton pilot closure is not passing, so end-to-end UAT can fail even if individual data checks pass. | pilotClosureStatus=FAIL.
county_trust | HIGH | The 38-county seed lane has work orders and templates but no actual source receipts yet. | workOrders=5; receiptsFound=0.
overclaim_risk | HIGH | County-scope language is still easy to overread as statewide runtime readiness. | runtimeCandidateScope=runtime_scope_requires_review; runtimeCandidateProven=39.
source_inventory | MEDIUM | Coverage proof is registry/source-decision proof only, not ingestion, normalization, geometry, API, or UI proof. | All 39 counties now have a source-decision acquisition family in the registry control plane.

## Banned Narratives

- 39 counties are runtime-ready
- Benton full corpus is sealed
- TerraFusion is production approved
- All data flows end to end
- Official county-certified valuation is ready
- Seed templates prove county acquisition

## Required Containment Posture

- Treat the readiness packet failure as authoritative until it passes.
- Treat Benton corpus evidence as ATTEMPT only until sealed.
- Treat the 38-county lane as governed acquisition preparation until real receipts pass.
- Do not claim runtime readiness from source registry coverage, templates, or work orders.
- Require product-load receipts before making product data confidence claims.

## Required Proof Artifacts

- Passing June 10 readiness packet.
- Passing TerraFusion DB product-load ledger with ProductLoadReceipts evidence.
- Sealed Benton full-corpus verification, not ATTEMPT.
- Passing Benton runtime pilot closure.
- At least one real 38-county seed receipt passing the validator.
- API proof and UI smoke for every promoted non-Benton county.
- County-scope artifact showing no fake 39-county runtime claim.

## Safest Public Framing

TerraFusion is in controlled readiness execution. The governance gates are operating, Benton is the primary runtime pilot closure lane, and the 38-county seed lane is prepared but not promoted. Production and statewide runtime claims remain blocked until the proof gates pass.
