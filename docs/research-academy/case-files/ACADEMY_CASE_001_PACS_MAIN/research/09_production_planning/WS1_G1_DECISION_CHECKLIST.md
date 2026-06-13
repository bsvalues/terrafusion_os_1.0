# WS-1 G1 Decision Checklist

**Gate:** G1 (WS-1 cutover candidacy) · `Forge:Engine` stays **Shadow** until every box is checked.
G1 measures parity; the engine it measures is built, deterministic, explainable, audited, vendor-free.

## Preconditions (must all be true before evaluating)
- [ ] Sync `TfParcel.Neighborhood` landed + projected (Ask 1).
- [ ] Assessor tolerances + min pass rates approved and recorded (Ask 2; run-plan §3 filled, no nulls).
- [ ] PACS read access granted for the agreed comparison dataset (Ask 3).
- [ ] Shadow sample selected deterministically (run-plan §1); `parcelIds` recorded.

## Engine-integrity (already green; re-confirm on the sample)
- [ ] EI-1 determinism — repeated runs identical.
- [ ] EI-2 no vendor doctrine — TF provenance; `IsVendorDependent==false`.
- [ ] EI-3 explainability — every sampled value has a complete explanation.
- [ ] EI-4 auditability — every persisted `ParcelValuation` is audit-stamped (WS-3).

## Gating parity proofs (at Assessor-agreed tolerances + pass rate)
- [ ] RP-1 Cost parity passes at agreed rate per class.
- [ ] RP-2 Land parity passes at agreed rate.
- [ ] RP-3 Reconciled assessed parity passes at agreed rate per class.
- [ ] RP-5 Supplement round-trip — **exact** active-supplement match via SourceXref; no history loss.
- [ ] RP-6 Income parity passes at agreed rate.

## Informational (recorded, non-gating)
- [ ] RP-4 ratio study (median/COD/PRD) + `CalibrationGate` recorded; material divergence noted.

## Decision
- [ ] **All gating boxes checked → G1 candidate.** Proceed to discuss authoritative cutover —
      class-by-class, shadow → limited enablement (one class/neighborhood that passed) → expand.
- [ ] **Any gating box fails → open a narrow correction slice only** (re-run the affected stratum).
      Do NOT broaden, do NOT flip `Forge:Engine` to authoritative, do NOT jump to WS-2.

## Sign-off
| Role | Name | Date | G1 decision |
|------|------|------|-------------|
| Engineering lead | | | |
| Assessor/county | | | |

Only after G1 passes + sign-off: **WS-2** (levy certification + statutory limits).
