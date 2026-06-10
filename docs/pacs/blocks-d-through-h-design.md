# TerraFusion Post-Block-C Execution Spine — Blocks H → E → D → F → G

**Status:** binding execution plan. Frozen 2026-05-02. Layer 4 of the
PACS doctrine stack:

```text
docs/pacs/pacs-knowledge-baseline.md         (Layer 1 — what PACS is)
docs/pacs/pacs-ingestion-spine.md            (Layer 2 — how to ingest)
docs/pacs/pacs-source-provenance-doctrine.md (Layer 2.5 — lineage law)
docs/pacs/pacs-sync-bridge-v1-spec.md        (Layer 3 — control tower)
docs/pacs/block-c-contract-v1.md             (Layer 3.5 — Block-C freeze)
docs/pacs/blocks-d-through-h-design.md       (Layer 4 — next 90 days) ← this doc
```

## 0. Framing — Block C closed; drift is the new risk

Block C landed the four canonical lanes (sales, valuation,
improvement, land) on top of the Sync Bridge control tower. The
doctrine band is green. PACS Sync Service is live. Operator
dashboard SQL exists. The 2017 conversion lineage gap is known.
ArcGIS is the chosen GIS path; custom shapefile parsing is closed.

The next 90-day risk is **doctrine drift**, not missing features.
Every block below either freezes the existing contract or builds
mechanically on top of it.

---

## 1. Block order (locked)

```text
H → E → D → F → G
```

**No parallelism.** One block, one merge, regression band green,
next block. H is not background; H is the keyboard frog.

### H — Block-C contract freeze (FIRST)

Lock the Block-A/B/C shape as versioned doctrine before any agent
touches it. Without H, drift is inevitable in week 2 and invisible
until week 6.

Slices:

- **H1** Block-C contract doc (`docs/pacs/block-c-contract-v1.md`).
  Records: 5-schema contract, `source_xref` shape, `parcel_xref`
  shape, `promotion_gate_result` shape, quarantine semantics, the
  four landed canonical lane shapes. Versioned `v1`.
- **H2** Schema-shape regression: snapshot the EF model + migration
  list; fail the build if either drifts without a doctrine version
  bump.
- **H3** Replay harness: given a `LoadBatchId`, re-run promotion +
  projection deterministically and diff against baseline.

Exit gate: doctrine doc committed; regression test fails on any
schema mutation that does not bump `block-c-contract-vN.md`.

### E — Dictionary lock + i_attr_id mapping

Highest-leverage solo move. Every panel built before the
dictionaries are locked is rework.

Slices:

- **E1** `canonical_tf.dict_*` for: land use code, land state code,
  neighborhood (`hood_cd`), improvement type, improvement state,
  exemption type, situs/legal codes.
- **E2** `canonical_tf.attribute_definition` — the `i_attr_id`
  mapping table. One row per PACS attribute that flows into TF.
- **E3** Convert `tf_improvement_feature.AttributeId` and
  `tf_land.AttributeId` from raw codes to FKs onto
  `attribute_definition`.
- **E4** Promotion gate: unknown attribute IDs quarantine to
  `legacy_tf_unproven.*` with reason `UNKNOWN_ATTRIBUTE`.

Source of truth: live PACS dictionary tables (already pulled) +
operator `hood_cd` domain truth.

### D — ArcGIS-only GIS lane

ArcGIS REST API only. **No** custom shapefile parser. **No**
custom topology. **No** custom projection math. Slices mirror
Block C exactly.

Slices:

- **D1** `legacy_arcgis_raw.parcel_geom` — paginated FeatureService
  landing with deterministic batch hashing. SourceFamily =
  `ARCGIS_REST`.
- **D2** `truth_arcgis.parcel_geom_current` — supp-aware truth
  (latest valid polygon per parcel, geometry validity gate).
- **D3** `canonical_tf.tf_parcel_geom` — projection keyed off
  `prop_id` ↔ `TfParcelId` xref, county-isolated, SRID locked,
  WKT/WKB serialized. Quarantine on no-parcel-xref into
  `legacy_tf_unproven.parcel_geom_current` (mirrors C3/L3 exactly).
- **D4** Read-models: parcel polygon endpoint, bbox query, neighbor
  lookup.

### F — Operator dashboard parity

Each query in the morning dashboard SQL becomes one read-model +
one endpoint + one panel. First block where the assessor uses
TerraFusion against canonical data on a live Tuesday.

Slices (one query → one endpoint → one panel each):

- **F1** Open work / pending appraisal queue.
- **F2** Sales review queue (uses Block-C sales canonical).
- **F3** Improvement field-check queue (uses Block-C improvement
  canonical).
- **F4** Land segment exception list (uses Block-C land canonical).
- **F5** Neighborhood ratio study skeleton (uses E1 `hood_cd` lock).

**Forbidden:** any panel before its underlying dictionary (E) is
locked.

### G — ConversionEra provenance hardening

Make the pre-2017 lineage gap a first-class concept. Enum, not
bool.

Slices:

- **G1** `ConversionEra` enum on `truth_pacs.*`:
  `PreConversion2017`, `PostConversion`, `Unknown`. Backfill from
  supplement-year heuristic.
- **G2** Propagate `ConversionEra` to `canonical_tf.*` (majority of
  underlying truth rows; mixed → `Unknown`).
- **G3** Every read endpoint accepts an `eraFilter` query param,
  default `PostConversion`.
- **G4** Promotion gate `pre-conversion-row-share`: WARN >X%, FAIL
  >Y% (thresholds in operator config, not hardcoded).

---

## 2. Doctrine constraints (locked)

```text
- No custom shapefile parser. ArcGIS REST only.
- ConversionEra is an enum, not a bool. Unknown is a real state.
- Dictionary lock (E) precedes dashboard panels (F). Always.
- Dashboard SQL becomes endpoint + panel only after dictionary
  contract exists.
- One block at a time. No parallelism. No background governance.
- Every projector mirrors the Block-C 5-gate pattern exactly:
  source-batch-completed, parcel-xref-coverage, source-xref-coverage,
  county-isolation, plus one domain-specific gate.
- Every quarantine mirrors the Block-C pattern: legacy_tf_unproven
  schema, QuarantineReason string, full lineage retained.
- Every commit ends green: full doctrine band passes before merge.
```

---

## 3. What is **not** in this plan

```text
- Custom GIS stack (parsing, topology, projection math).
- Multi-county anything until Benton runs a live Tuesday on TF.
- Plugin marketplace work.
- AI swarm tuning.
- Federal compliance theater.
- "Multi-track" parallel block execution.
- Pre-Block-C rework. Block C is locked by H.
```

---

## 4. Acceptance — when is each block "closed"?

A block is closed when **all** of the following hold:

1. Every slice committed to `main`.
2. Full doctrine band green (no test removed, only added).
3. Doctrine doc updated if any contract changed (and the version
   bumped per H2).
4. Co-founder status report filed.
5. Next block's first slice queued, not started.

---

## 5. Execution start

```text
H1 — write block-c-contract-v1.md  ← starting now
H2 — schema-shape regression       ← next
H3 — replay harness                ← then
E1 — first dictionary table        ← after H closes
```
