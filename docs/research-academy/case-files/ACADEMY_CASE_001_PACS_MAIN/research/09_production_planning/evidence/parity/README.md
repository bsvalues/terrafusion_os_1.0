# Parity Evidence — Output Directory

Destination for WS-1 PACS shadow parity-run evidence. Empty until the run executes (blocked on
Sync `TfParcel.Neighborhood`, Assessor tolerances, and PACS read access).

- **Schema:** `parity_evidence.schema.json` (per-parcel rows + per-RP summaries).
- **Naming:** `parity_<county>_<runId>.json` (one file per run), validated against the schema.
- **Rules:** comparison-only; `engineMode` MUST be `Shadow`; `withinTolerance`/`gatePass` are `null`
  when the relevant Assessor tolerance/pass-rate is unset (an ungated run cannot claim a G1 pass).
- **RP-5:** records `rp5LineageExact` (exact SourceXref active-supplement match, no history loss) —
  not a tolerance.
- Each run also records command + environment + the exact `parcelIds` for reproducibility.

Procedure: `WS1_PACS_SHADOW_PARITY_RUN_PLAN.md` §5. G1 evaluation: `WS1_G1_DECISION_CHECKLIST.md`.
