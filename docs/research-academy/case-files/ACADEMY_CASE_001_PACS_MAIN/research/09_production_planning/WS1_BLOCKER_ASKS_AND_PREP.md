# WS-1 Gate Blockers — Explicit Asks + Ready Prep

**Case:** ACADEMY_CASE_001_PACS_MAIN · 2026-06-13 · Forge complete in shadow; step 4 (parity run)
blocked on 3 external inputs. Each ask below is a single decision/artifact, not a general request.

---

## Ask 1 — Sync owner: land `TfParcel.Neighborhood`
```
Subject: Narrow Sync-lane handoff needed for WS-1 parity run

Need one canonical addition only:
- Add nullable `TfParcel.Neighborhood`
- Project it in the C-series parcel projector
- Add migration
- Confirm canonical source for neighborhood

Why: Forge-side assembler is built and green in shadow. This is the only remaining canonical
input gap for faithful land-approach assembly. Neighborhood must live on `TfParcel`, not `TfLand`.

Scope: Sync/CanonicalTf lane only. No broader model changes.
Artifact: research/09_production_planning/SYNC_HANDOFF_TfParcel_Neighborhood.md
```

## Ask 2 — Assessor/county: set parity tolerances
```
Subject: Need Assessor parity tolerances to unlock WS-1 shadow validation

WS-1 deterministic Forge engine is built in shadow. To run PACS parity honestly we need
county-approved tolerances for the parity gates (RP-1/2/3/5/6):
- overall value parity, approach-level variance where applicable
- supplement round-trip acceptance (RP-5)
- class-specific tolerances + minimum sample pass rates

We will NOT invent tolerances — these must be county-approved inputs.
Reference: research/09_production_planning/WS1_PACS_SHADOW_PARITY_RUN_PLAN.md §3
```

## Ask 3 — PACS/data: read-only shadow access
```
Subject: Read-only PACS shadow access needed for WS-1 parity run

Need read-only access to the agreed PACS comparison dataset to execute the prepared run.
Use: comparison only — no writes, no authority swap, evidence capture only.
Reference: research/09_production_planning/WS1_PACS_SHADOW_PARITY_RUN_PLAN.md §2/§5
```

---

## Decision log (fill on response)
| # | Ask | Owner | Sent | Status | Response / value |
|---|-----|-------|------|--------|------------------|
| 1 | `TfParcel.Neighborhood` | Sync lane | TBD | OPEN | |
| 2 | Parity tolerances | Assessor/county | TBD | OPEN | |
| 3 | PACS read access | Data/IT | TBD | OPEN | |

Any one landing unblocks a concrete next action (below). All three → step 4 run.

---

## Ready prep (so unblocking is a fill-in, not new work)

### Tolerance config placeholder (slots Assessor numbers; nulls until approved)
Target: `appsettings` / `appsettings.BentonCounty.json`. `Forge:Engine` already parsed by
`ForgeEngineOptions.FromConfiguration` (default Shadow). Tolerances read by the future parity runner.
```jsonc
{
  "Forge": {
    "Engine": "Shadow",                  // stays Shadow until G1
    "Parity": {
      "Tolerances": {
        // fractions, e.g. 0.01 = ±1%. null = NOT YET APPROVED (run refuses to gate on a null).
        "RP1_Cost":        { "Residential": null, "Commercial": null },
        "RP2_Land":        { "Default": null },
        "RP3_Reconciled":  { "Residential": null, "Commercial": null, "Vacant": null },
        "RP6_Income":      { "Income": null }
      },
      "MinPassRate": { "Default": null },  // e.g. 0.90 = 90% of sample within tolerance
      "Rp5SupplementRoundTrip": "ExactLineage"   // not a tolerance; exact SourceXref match
    }
  }
}
```
> The runner must treat `null` as "ungated" and refuse to assert G1 pass — prevents an
> accidental honest-looking pass on un-set tolerances.

### Caller-swap one-liner (when Ask 1 lands)
The assembler already takes `Neighborhood`. The future integration caller changes one line:
```csharp
// before (today, injected placeholder dependency):
var neighborhood = injectedNeighborhood;        // supplied by caller
// after TfParcel.Neighborhood lands (Sync Ask 1):
var neighborhood = parcel.Neighborhood;          // direct canonical read — no assembler change
var assembled = new AssembledParcel(parcel, neighborhood, improvements, featuresByImprovement, lands, sales);
```
No `ParcelValuationAssembler` change is required — verified by tests A1–A6.

### Evidence output
Schema + directory prepared at `research/09_production_planning/evidence/parity/`
(`parity_evidence.schema.json` + `README.md`). The runner writes per-parcel rows + per-RP summary there.

### G1 decision
Checklist prepared at `research/09_production_planning/WS1_G1_DECISION_CHECKLIST.md`.
