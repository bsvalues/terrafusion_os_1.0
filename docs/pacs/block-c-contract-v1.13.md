# Block-C Contract — v1.13 (G4 Pre-Conversion-Share Promotion Gate, Block G Close)

**Status:** binding doctrine. Version `v1.13`. Frozen 2026-05-03.
**Predecessor:** `docs/pacs/block-c-contract-v1.12.md` (v1.12, 2026-05-03).
**Layer:** 3.5 of the PACS doctrine stack.

```text
docs/pacs/block-c-contract-v1.md             (v1   — base freeze)
docs/pacs/block-c-contract-v1.1.md           (v1.1 — dict_neighborhood)
docs/pacs/block-c-contract-v1.2.md           (v1.2 — attribute_definition)
docs/pacs/block-c-contract-v1.3.md           (v1.3 — nullable AttributeId FKs)
docs/pacs/block-c-contract-v1.4.md           (v1.4 — QuarantineReasons closed vocab)
docs/pacs/block-c-contract-v1.5.md           (v1.5 — attribute resolution semantics)
docs/pacs/block-c-contract-v1.6.md           (v1.6 — two-layer quarantine vocabulary)
docs/pacs/block-c-contract-v1.7.md           (v1.7 — E4c documented deferral; Block E close)
docs/pacs/block-c-contract-v1.8.md           (v1.8 — Block-D D1+D2+D3 + legacy retirement)
docs/pacs/block-c-contract-v1.9.md           (v1.9 — F5 sales-ratio-study read-model)
docs/pacs/block-c-contract-v1.10.md          (v1.10 — G1 truth-layer ConversionEra)
docs/pacs/block-c-contract-v1.11.md          (v1.11 — G2 canonical-layer ConversionEra)
docs/pacs/block-c-contract-v1.12.md          (v1.12 — G3 eraFilter on read endpoints)
docs/pacs/block-c-contract-v1.13.md          (v1.13 — G4 pre-conversion-share gate; Block G close) ← this doc
```

## 0. What v1.13 is

A coordinated minor bump that records:

1. **G4** introduces a per-lane promotion gate that records what
   fraction of each truth-promotion batch is pre-conversion-era.
   The gate is informational (`WARN`/`PASS`, never `FAIL`) — era
   is provenance, not validation.
2. **Block G is closed** by this slice. The 4-slice arc (G1 truth,
   G2 canonical, G3 read filter, G4 promotion gate) is now in
   doctrine.
3. The gate threshold is a frozen code constant (`5%`). Future v1.x
   bumps may promote it to runtime configuration if operator
   field experience justifies it.

No schema change. No migration. v1.13 is gate + doctrine only.

## 0.5 Doctrine integrity disclosure (carry-forward)

v1.10 §6 promised a "promotion gate that warns when an inbound
batch exceeds a configurable threshold." v1.13 ships exactly that
with one refinement: the threshold is a **doctrine constant**, not
a runtime knob. Per the same rationale as the era vocabulary
itself (closed by design), introducing operator-tunable thresholds
opens a door to silent drift. If a county operator routinely sees
the gate trip, the conversation is "your data has unusual era
mix" — a doctrine-level discussion, not a knob-twiddle.

The gate is **never blocking**: a high pre-conversion share never
prevents promotion. It is recorded in
`sync_bridge.promotion_gate_result` for observability so the
operator dashboard can surface it.

## 1. The threshold

```csharp
public const decimal PreConversionShareWarnThreshold = 0.05m; // 5%
```

Lives on `TerraFusion.Data.Services.TruthPacs.ConversionEraGate`.
Frozen by doctrine test
`Contract_v1_13_ConversionEraGate_ThresholdIsFrozenAt5Percent`.

The 5% default reflects current-year promotion behavior: when an
operator syncs a typical year (e.g. PropValYr 2026), nearly every
row should be POST_CONVERSION. A non-zero pre-conversion share
indicates either legacy backfill data is present (operator's
intentional choice — they will acknowledge the WARN) or a data-
quality issue (operator should investigate).

The threshold is **strict greater-than**: a share of exactly 5%
passes; a share of 5.001% trips WARN. This matches typical gate
boundary semantics elsewhere in Block C.

## 2. The status semantics

```text
share <= threshold (5%)  →  PASS
share >  threshold (5%)  →  WARN
                        →  FAIL never raised by this gate
```

`PASS` is informational positive: the batch is effectively
modern-era data. `WARN` is informational negative: the batch is
backfill or anomalous; review recommended. `FAIL` is reserved for
gates that block promotion — era never blocks.

A batch with zero promoted rows resolves to 0% share and `PASS`
by construction. This matches the operator's mental model that
"empty batches are clean batches."

## 3. The gate naming

```text
truth-pacs-{lane}-pre-conversion-share
```

where `{lane}` is one of:

| Lane id | Truth entity |
|---|---|
| `sale` | `TruthPacsSale` |
| `owner` | `TruthPacsOwnerCurrent` |
| `wpov` | `TruthPacsWashPropOwnerVal` |
| `imprv` | `TruthPacsImprvCurrent` |
| `land` | `TruthPacsLandCurrent` |

Constants exposed as `ConversionEraGate.Lanes.{Sale|Owner|Wpov|Imprv|Land}`.
Helper: `ConversionEraGate.GateNameFor(lane)`. Both frozen by
doctrine tests
`Contract_v1_13_ConversionEraGate_GateNameTemplateIsFrozen` and
`Contract_v1_13_ConversionEraGate_LaneIdsMatchTheFiveTruthLanes`.

`GateStage` is `RAW_TO_TRUTH` per the existing convention
documented on `PromotionGateResult`.

## 4. The promoter wiring

Each of the five truth promoters now:

1. Maintains a `preConversionPromoted` counter alongside the
   existing `promoted` counter.
2. Computes the era inside the foreach loop and increments the
   counter when the era is `PRE_CONVERSION_2017`.
3. After the truth-row save, calls
   `ConversionEraGate.AddShareGate(_db, batch, lane, promoted, preConversionPromoted)`
   which queues the gate row into the same DbContext save the
   lane's existing `WriteRemainingGatesAsync` will perform.

The era column itself (G1) is unchanged in shape; only the
side-counter and the gate write are new.

Touched files:

```text
backend/src/TerraFusion.Data/Services/TruthPacs/
  ConversionEraGate.cs                              (NEW)
  PacsSaleTruthPromoter.cs                         (counter + AddShareGate call)
  PacsOwnerCurrentTruthPromoter.cs                 (counter + AddShareGate call)
  PacsWashPropOwnerValTruthPromoter.cs             (counter + AddShareGate call)
  PacsImprvCurrentTruthPromoter.cs                 (counter + AddShareGate call)
  PacsLandCurrentTruthPromoter.cs                  (counter + AddShareGate call)
```

The helper `AddShareGate` is intentionally synchronous (no
`SaveChangesAsync`) so the caller batches the gate row into its
existing end-of-promotion save for one round-trip.

## 5. Tests

### Per-promoter tests

Each of the five `Pacs*TruthPromoterTests` files gains:

- `PreConversionShareGate_Trips_WARN_OnPreConversionHeavyBatch` —
  seeds 1 pre-2018-year row + 1 post-2018-year row (50% share),
  asserts gate goes `WARN` with the expected detail.
- `PreConversionShareGate_Stays_PASS_OnAllPostConversionBatch` —
  seeds only post-2018-year rows (0% share), asserts gate is
  `PASS`.

The existing `AllFourGates_AreRecorded_OnSuccess` /
`AllFiveGates_AreRecorded_OnSuccess` count assertions are bumped
by 1 (4→5 for imprv/land/wpov; 5→6 for sale/owner) with an inline
comment naming v1.13 as the cause.

### Doctrine tests

New band in `BlockCContractV1Tests`:

- `Contract_v1_13_ConversionEraGate_ThresholdIsFrozenAt5Percent`
- `Contract_v1_13_ConversionEraGate_GateNameTemplateIsFrozen`
- `Contract_v1_13_ConversionEraGate_LaneIdsMatchTheFiveTruthLanes`

## 6. What v1.13 does NOT change

- Schema: zero changes. No new column, no new migration.
- Existing gates (`truth-pacs-{lane}-source-batches-completed`,
  `truth-pacs-{lane}-supp-aware-join`, etc.) — unchanged.
- The era column on `truth_pacs.*` and `canonical_tf.*` —
  unchanged shape, still nullable, vocabulary still frozen.
- Read endpoints (G3 `eraFilter`) — unchanged.
- All other v1.x-frozen shapes — untouched.

## 7. Block G summary (G1 → G4 close)

With v1.13 frozen, Block G is **complete**:

| Slice | What it shipped | Doctrine | PR |
|---|---|---|---|
| G1 | Nullable `ConversionEra` on 5 `truth_pacs.*` lanes; promoters stamp at promotion via `ConversionEras.FromYear` | v1.10 | #728 (merged) |
| G2 | Nullable `ConversionEra` on 6 `canonical_tf.*` lanes; projectors stamp via `MajorityOfTruth` (1:1 verbatim today, future-proofs N:1) | v1.11 | #729 (merged) |
| G3 | `era` query parameter on the 3 SalesRatioStudy read endpoints; default `POST_CONVERSION`; NULL falls back to year | v1.12 | #730 (merged) |
| G4 | Per-lane pre-conversion-share gate (`WARN` over 5%, `PASS` otherwise; never `FAIL`) | v1.13 | this PR |

The arc moves PACS conversion-era awareness end-to-end through
the doctrine stack: from year-derived stamping at promotion, to
majority-of-truth resolution at canonical projection, to operator-
visible filtering at the read surface, to operator-visible
warnings at promotion time.

## 8. Linked GitHub issues

- **G4** — closed by this slice (this doc).
- **Block G** — closed by this slice.
- **OPERATOR-SQL-IMPORT-1 (#726)** — unrelated to G4 but still
  blocking F1/F3/F4 per v1.9.
- **CI-HYGIENE-1 (#724)** — chronic main-state continues to
  require admin-merge through documented exception.
