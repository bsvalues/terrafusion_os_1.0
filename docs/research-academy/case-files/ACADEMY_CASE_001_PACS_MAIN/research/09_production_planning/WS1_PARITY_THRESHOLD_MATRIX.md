# WS1_PARITY_THRESHOLD_MATRIX — WO-WS1-PARITY-THRESHOLD-EXTRACTION

Per-gate threshold mapping. **Type:** exact / statistical / value-parity. **Status:** extracted /
inferred-review / unresolved. No invented numbers — inferred rows cite a real standard; unresolved
rows are left for signoff.

| Gate | What it compares | Threshold type | Proposed anchor | Source | Confidence | Status |
|------|------------------|----------------|-----------------|--------|------------|--------|
| **RP-1 Cost** | TF RCNLD vs `TruthPacsImprvCurrent.ImprvVal` | value-parity (± %, per class) | — | none in corpus (migration decision) | n/a | **UNRESOLVED — signoff** |
| **RP-2 Land** | TF land vs `TruthPacsLandCurrent` mkt/ag | value-parity (± %, per class) | — | none in corpus | n/a | **UNRESOLVED — signoff** |
| **RP-3 Reconciled** | TF `IndicatedValue` vs `TruthPacsAssessmentCurrent`/`WashPropOwnerVal` | value-parity (± %, per class) | — | none in corpus | n/a | **UNRESOLVED — signoff** |
| **RP-5 Supplement** | active-supplement TF value via `SourceXref` | **exact lineage** (no tolerance) | exact match; no history loss | PR-1 / RK-3 / SourceXref design | High | **RESOLVED by design** |
| **RP-6 Income** | TF income value vs county income study | value-parity (± %) + external baseline | — | study is external (`E:\`); no number in corpus | n/a | **UNRESOLVED — signoff (+ external study)** |
| **RP-4 Ratio study (info)** — **level of assessment** | TF median ratio | statistical band | **0.90–1.10** | IAAO Standard on Ratio Studies (office basis: FR-3, IAAO glossary) | Medium-High | **INFERRED — confirm county adoption** |
| **RP-4 — uniformity (COD)** | TF COD | statistical max | **≤ 15** (≤ 10 newer/homogeneous residential; ≤ 20 income/vacant) | IAAO Standard on Ratio Studies | Medium-High | **INFERRED — confirm county adoption** |
| **RP-4 — vertical equity (PRD)** | TF PRD | statistical band | **0.98–1.03** | IAAO Standard on Ratio Studies | Medium-High | **INFERRED — confirm county adoption** |
| **Sample size** | qualified sales per stratum | minimum | **≥ 5** (engine floor); study N per county | IAAO guidance / county sign-off | Medium | **INFERRED floor; per-RP N unresolved** |

## Notes
- **Inferred ≠ invented:** the COD/PRD/level anchors are the *published IAAO standard ranges* that the
  office's own methodology is documented to follow (FR-3 + IAAO glossary in the corpus). They are
  proposed for **county adoption confirmation**, not asserted as county-approved.
- The **value-parity ± % (RP-1/2/3/6)** has no standard and no corpus value — it is the genuine
  migration-acceptance decision. It can be *anchored* later by parsing achieved COD/level from the
  county's existing ratio studies (`E:\` read-only source) to propose defensible ranges; not done in
  this WO (read-only source not parsed).
- RP-4 is **informational** (non-gating) per the run plan; its IAAO anchors feed `CalibrationGate`,
  which is QC, not a value change.
