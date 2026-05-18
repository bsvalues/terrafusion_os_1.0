# June 10 Claim Guard

Generated: 2026-05-14T22:34:35.304Z

Guard status: LOCKED
Public claims allowed: false

## Summary

- Red-team verdict: RED
- Banned narratives: 6
- Proposed claim violations: 0
- Ship blockers: 23
- Seed receipts found: 0
- Benton corpus sealed: false

## Allowed Framing

TerraFusion is in controlled readiness execution. The governance gates are operating, Benton is the primary runtime pilot closure lane, and the 38-county seed lane is prepared but not promoted. Production and statewide runtime claims remain blocked until the proof gates pass.

## Blocked Claims

- 39 counties are runtime-ready: Blocked until required proof artifacts pass and red-team verdict clears.
- Benton full corpus is sealed: Blocked until required proof artifacts pass and red-team verdict clears.
- TerraFusion is production approved: Blocked until required proof artifacts pass and red-team verdict clears.
- All data flows end to end: Blocked until required proof artifacts pass and red-team verdict clears.
- Official county-certified valuation is ready: Blocked until required proof artifacts pass and red-team verdict clears.
- Seed templates prove county acquisition: Blocked until required proof artifacts pass and red-team verdict clears.

## Proposed Claim Findings

- None

## Required Proof Artifacts

- Passing June 10 readiness packet.
- Passing TerraFusion DB product-load ledger with ProductLoadReceipts evidence.
- Sealed Benton full-corpus verification, not ATTEMPT.
- Passing Benton runtime pilot closure.
- At least one real 38-county seed receipt passing the validator.
- API proof and UI smoke for every promoted non-Benton county.
- County-scope artifact showing no fake 39-county runtime claim.

## Required Containment Posture

- Treat the readiness packet failure as authoritative until it passes.
- Treat Benton corpus evidence as ATTEMPT only until sealed.
- Treat the 38-county lane as governed acquisition preparation until real receipts pass.
- Do not claim runtime readiness from source registry coverage, templates, or work orders.
- Require product-load receipts before making product data confidence claims.

## Rules

- The claim guard approves language only; it does not prove runtime readiness.
- Banned narratives remain blocked until the red-team verdict clears.
- Templates, work orders, and source registry coverage are not data-loaded proof.
- Public claims must stay inside the allowed framing while guardStatus is LOCKED or REVIEW_REQUIRED.
