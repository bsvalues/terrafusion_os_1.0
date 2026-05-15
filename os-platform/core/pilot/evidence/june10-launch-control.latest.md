# June 10 Launch Control

Generated: 2026-05-15T17:06:58.556Z

Launch verdict: NO_GO

## Summary

- Readiness status: FAIL
- Ship blockers: 23
- Red-team verdict: RED
- Critical attacks: 3
- Claim guard status: LOCKED
- Public claims allowed: false
- Seed lane passed: true
- Seed receipts found: 0
- Seed runtime claim allowed: false
- P0 items: 6
- Blocked P0 items: 5
- Ready-for-Codex P0 items: 0
- Sync evidence intake status: WAITING_SYNC_DB_EVIDENCE

## Approved External Framing

TerraFusion is in controlled readiness execution. The governance gates are operating, Benton is the primary runtime pilot closure lane, and the 38-county seed lane is prepared but not promoted. Production and statewide runtime claims remain blocked until the proof gates pass.

## Stop Conditions

- June 10 readiness packet is not passing.
- Credibility red-team verdict is RED.
- Launch claim guard is LOCKED.
- P0 burn-down is not clear.

## P0 Burn-down

First unblock command: `pnpm run truth:terrafusion-db-product-load-ledger`

## Next Commands

- `pnpm run truth:terrafusion-db-product-load-ledger`
- `pnpm run truth:benton-runtime-pilot-closure`
- `pnpm run truth:washington-39-county-data-crosswalk`
- `pnpm run truth:runtime-candidate-set`
- `pnpm run truth:june10-red-team`
- `pnpm run truth:june10-claim-guard`

## Required Proof Artifacts

- Passing June 10 readiness packet.
- Passing TerraFusion DB product-load ledger with ProductLoadReceipts evidence.
- Sealed Benton full-corpus verification, not ATTEMPT.
- Passing Benton runtime pilot closure.
- At least one real 38-county seed receipt passing the validator.
- API proof and UI smoke for every promoted non-Benton county.
- County-scope artifact showing no fake 39-county runtime claim.

## Rules

- Launch control is an executive control packet, not runtime proof.
- NO_GO means no production approval, public readiness claim, or statewide runtime claim.
- Claim guard language is the maximum allowed public framing while launchVerdict is not GO.
- A GO verdict requires passing readiness, non-RED red-team posture, unlocked claim guard, and seed-lane claim safety.
