# WS1_PARITY_CONFIG_PROPOSAL — WO-WS1-PARITY-THRESHOLD-EXTRACTION

Proposed config, split exactly into **(A) extracted from current practice**, **(B) inferred but
review-needed**, **(C) unresolved / null**. Maps to `CalibrationThresholds` (RP-4 QC) and
`ParityGateConfig` (RP-1/2/3/6 gating) + `ParityComparer` (RP-5 exact). Nulls keep the run **ungated**.

## (A) Extracted from current practice — directly usable
- **RP-5 = exact lineage** (not a tolerance). `ParityComparer`/`ParityEvaluator` already gate RP-5 on
  `Rp5LineageExact`. No value needed. ✅
- **IAAO ratio statistics are the office method** (FR-3) → the engine's `SalesRatioCalculator`
  (median/COD/PRD) and `CalibrationGate` are the correct, in-practice mechanisms. ✅

## (B) Inferred from documented IAAO-aligned practice — REVIEW before adopt
`CalibrationThresholds` (RP-4 QC / informational). Defaults already encoded; confirm county adoption:
```jsonc
"Calibration": {
  "MedianMin": 0.90, "MedianMax": 1.10,   // IAAO level of assessment
  "CodMax": 15.0,                          // IAAO uniformity (consider 10 for homogeneous residential)
  "PrdMin": 0.98, "PrdMax": 1.03,          // IAAO vertical equity
  "MinSampleSize": 5
}
```
> Source: IAAO Standard on Ratio Studies (office basis evidenced in corpus). Status: **review/confirm**,
> not county-approved. Class-specific COD (e.g. residential ≤ 10) is a county refinement.

## (C) Unresolved / null — cannot be filled without signoff (DO NOT invent)
`ParityGateConfig` for the **gating** proofs. Null = ungated; `ParityEvaluator` returns `GatePass=null`
and a G1 pass is impossible until set:
```jsonc
"Forge": {
  "Engine": "Shadow",
  "Parity": {
    "Tolerances": {                         // fractions, e.g. 0.01 = ±1% — ALL null pending signoff
      "RP1_Cost":       { "Residential": null, "Commercial": null },
      "RP2_Land":       { "Default": null },
      "RP3_Reconciled": { "Residential": null, "Commercial": null, "Vacant": null },
      "RP6_Income":     { "Income": null }
    },
    "MinPassRate": { "Default": null },     // e.g. 0.90 — pending signoff
    "Rp5SupplementRoundTrip": "ExactLineage"
  }
}
```

## Minimum config to run honestly
- **Shadow evidence run (now, ungated):** **no config required.** `ParityEvaluator.Evaluate(comparisons,
  new ParityGateConfig())` emits deltas + per-RP summaries with `GatePass=null`. This is honest and
  produces the comparison evidence today (once neighborhood + baseline sample are in hand).
- **To GATE (G1):** fill section (C) from signoff + adopt section (B). Then `GatePass` resolves.

## Wiring note
Section (B) → `appsettings` `Forge:Calibration` consumed by `CalibrationThresholds`. Section (C) →
`Forge:Parity` consumed by `ParityGateConfig`/`ParityEvaluator`. Both default safe (Shadow; nulls
ungated). No Forge logic change required to populate.
