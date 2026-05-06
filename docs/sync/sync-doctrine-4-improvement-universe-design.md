# SYNC-DOCTRINE-4 — Improvement Property-Universe Doctrine — Design

**Status:** approved 2026-05-06 · design only, no implementation code in this slice
**Approach:** C (single canonical table + per-universe dictionaries)
**Predecessors:** B1 (`SYNC-DOCTRINE-1`, PR #787, `07471455d`); B2 (`SYNC-DOCTRINE-2`, PR #788, `2a61f9ab7`); SYNC-DOCTRINE-3 live replay
**Successor (separate slice):** SYNC-DOCTRINE-4-IMPL — schema migration + seeders + promoter rewire + tests

## Problem

The improvement quarantine surfaced in SYNC-COMPLETE-3 reported 1,584
"unknown imprv_attr" rows. Two root causes were identified during
the operator-pushback exchange:

1. **Dictionary not loaded.** The in-memory imprv_attr dictionary
   starts empty at backend boot and is never refreshed unless an
   operator hits ATTR-DRAIN-1 or equivalent. Every imprv_attr row
   quarantines on a fresh-boot drain.

2. **Universe contamination.** PACS treats real-residential,
   real-commercial, mobile-home, ag/current-use, business personal
   property, and ProVal-conversion-legacy improvements as different
   valuation universes with different attribute schedules. A single
   global dictionary can't be right for all of them. Quarantining
   "unknown" globally collapses real classification failure into
   noise.

The audit (recorded in `reference_benton_sync_doctrine_corrections.md`)
showed live PACS distributions:

```
imprv_attr 2026/sup=0/sale_id=0:
  prop_type_cd × property_use_cd dominant cells:
    R  / 11    418,943
    R  / 18     96,004
    MH / 11     24,992
    R  / 14, 12, 83, 13, 81, 65, 63, 59…   long tail
  ag_apply × ag_use_cd:
    F  / NULL    66,895 parcels / 590,726 attr rows
    T  / AG       1,027 / 27,381
    T  / OSP          3 / 65
    T  / CNV          1 / 23
```

Plus PACS-native conventions confirmed by Harris support email:
`sale_id = 0` selects the active-roll panel rows; `sale_id != 0`
are Deeds-and-Sales-panel snapshots. SYNC-DOCTRINE-4 only
classifies `sale_id = 0` rows.

## Architectural choice — Approach C

**A — Universe as a tag (lightweight).** New doctrine table for
classification rules; tag improvements with `Universe` column;
single global imprv_attr dictionary stays. Doesn't fix the
dictionary-contamination problem; just labels.

**B — Universe-routed truth tables.** 5+ sub-universe truth +
canonical tables, per-universe dictionaries. Architecturally
cleanest but explodes schema (5×truth + 5×canonical + per-universe
gates/projectors/drains). Premature for a first slice.

**C — Single canonical table + per-universe dictionaries (chosen).**
Two doctrine tables. One canonical `tf_improvement` with a
`universe_code` column. Per-universe dictionary entries replace
the global in-memory dictionary. Quarantine semantics become
per-universe; "unknown" only fires when the code is missing from
THE row's universe.

## Locked universe set (six + UNKNOWN sentinel)

```
REAL_RESIDENTIAL
REAL_COMMERCIAL
MOBILE_HOME
AG_CURRENT_USE
PERSONAL_PROPERTY
CONVERSION_LEGACY
UNKNOWN          (sentinel: no rule matched; row classified but unrouted)
```

## Locked precedence (lower number = higher priority)

```
1. CONVERSION_LEGACY     (only fires with explicit legacy marker; conservative)
2. AG_CURRENT_USE        (ag_apply='T' wins over residential / commercial)
3. PERSONAL_PROPERTY     (prop_type_cd ∈ {P, B})
4. MOBILE_HOME           (prop_type_cd = 'MH')
5. REAL_COMMERCIAL       (prop_type_cd = 'R' AND non-residential property_use_cd)
6. REAL_RESIDENTIAL      (prop_type_cd = 'R', default real bucket after higher
                          precedence rules fail)
7. UNKNOWN               (sentinel for row that didn't match any rule)
```

## Doctrine guidance

- `AG_CURRENT_USE` wins over residential/commercial when `ag_apply = 'T'`.
- `MOBILE_HOME` wins when `prop_type_cd = 'MH'`.
- `PERSONAL_PROPERTY` wins for `prop_type_cd ∈ {'P', 'B'}`.
- `CONVERSION_LEGACY` is conservative: only when the row cannot be
  confidently classified by current PACS domain rules AND a legacy
  marker is present (created_dt-pre-2017 / source_system /
  import_batch).
- Do NOT overfit residential `property_use_cd` yet. Seed broad
  rules first, then tighten based on observed distributions.

## Schema design

### `doctrine_tf.tf_doctrine_property_universe`

Operator's reference SQL (SQL Server dialect; PostgreSQL equivalents
in parentheses):

```sql
CREATE TABLE doctrine_tf.tf_doctrine_property_universe (
    rule_id                    BIGINT IDENTITY(1,1) PRIMARY KEY,
                               -- (PG: bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY)
    county                     NVARCHAR(100) NOT NULL,           -- (PG: text)
    effective_start_year       INT NOT NULL,
    effective_end_year         INT NULL,

    precedence                 INT NOT NULL,
    universe_code              NVARCHAR(50) NOT NULL,
                               -- closed vocab matching the locked universe set above

    prop_type_cd_csv           NVARCHAR(200) NULL,
    property_use_cd_csv        NVARCHAR(MAX) NULL,
                               -- (PG: text); broad seed now, refine later
    property_use_mode          NVARCHAR(20) NOT NULL DEFAULT 'ANY',
                               -- ANY | INCLUDE | EXCLUDE
    ag_apply_value             NVARCHAR(10) NULL,
                               -- 'T' | 'F' | NULL (treat NULL as wildcard)
    ag_use_cd_csv              NVARCHAR(200) NULL,
                               -- AG, OSP, CNV — for future tightening only

    requires_legacy_marker     BIT NOT NULL DEFAULT 0,            -- (PG: boolean)
    legacy_marker_type         NVARCHAR(50) NULL,
                               -- CREATED_DT_PRE_2017 | SOURCE_SYSTEM | IMPORT_BATCH | …
    legacy_marker_value        NVARCHAR(200) NULL,

    reason                     NVARCHAR(500) NOT NULL,
    evidence_source            NVARCHAR(1000) NOT NULL,
    confidence                 NVARCHAR(20) NOT NULL,             -- HIGH | MED | LOW
    notes                      NVARCHAR(1000) NULL,

    active_flag                BIT NOT NULL DEFAULT 1,
    approved_by                NVARCHAR(100) NULL,
    approved_at                DATETIME2 NULL,                    -- (PG: timestamptz)

    created_at_utc             DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at_utc             DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
```

Indexes (deferred to impl slice; sketch):
- `(county, active_flag, precedence)` — primary lookup order.
- `(county, universe_code, effective_start_year)` — per-universe
  effective rule scan.

### `doctrine_tf.tf_doctrine_attribute_dictionary`

Replaces the single-bucket `RefreshableImprvAttrDictionary`. Each
imprv_attr code is registered per-universe, year-aware, evidence-
backed.

```sql
CREATE TABLE doctrine_tf.tf_doctrine_attribute_dictionary (
    dictionary_row_id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    county                     NVARCHAR(100) NOT NULL,
    effective_start_year       INT NOT NULL,
    effective_end_year         INT NULL,

    universe_code              NVARCHAR(50) NOT NULL,
    imprv_attr_id              NVARCHAR(100) NOT NULL,
    i_attr_val_cd              NVARCHAR(200) NOT NULL,

    attribute_description      NVARCHAR(500) NULL,
    attribute_group            NVARCHAR(100) NULL,
    source_table               NVARCHAR(200) NULL,
                               -- e.g. dbo.imprv_attr_val, dbo.imprv_attr (derived)
    source_key                 NVARCHAR(200) NULL,

    reason                     NVARCHAR(500) NOT NULL,
    evidence_source            NVARCHAR(1000) NOT NULL,
    confidence                 NVARCHAR(20) NOT NULL,
    notes                      NVARCHAR(1000) NULL,

    active_flag                BIT NOT NULL DEFAULT 1,
    approved_by                NVARCHAR(100) NULL,
    approved_at                DATETIME2 NULL,

    created_at_utc             DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at_utc             DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT UQ_tf_doctrine_attribute_dictionary
        UNIQUE (county, universe_code, imprv_attr_id, i_attr_val_cd, effective_start_year)
);
```

### Truth + canonical column additions

```sql
ALTER TABLE truth_pacs.improvement
ADD
    universe_code              NVARCHAR(50) NULL,
    universe_rule_id           BIGINT NULL,
    universe_confidence        NVARCHAR(20) NULL,
    universe_reason            NVARCHAR(500) NULL;

ALTER TABLE canonical_tf.tf_improvement
ADD
    universe_code              NVARCHAR(50) NULL,
    universe_rule_id           BIGINT NULL,
    universe_confidence        NVARCHAR(20) NULL,
    universe_reason            NVARCHAR(500) NULL;
```

(Schema names and singular/plural per actual TerraFusion conventions
to be reconciled at impl time. The TerraFusion entity is
`TruthPacsImprvCurrent` / `TfImprovement`; `improvement` here is
the operator's shorthand.)

### Optional quarantine-side metadata

If `truth_pacs.imprv_attr_quarantine` (or its TerraFusion
equivalent, `LegacyTfUnprovenImprvAttr`) carries discrete reason
codes today, extend with universe context:

```sql
ALTER TABLE truth_pacs.imprv_attr_quarantine
ADD
    universe_code              NVARCHAR(50) NULL,
    universe_rule_id           BIGINT NULL,
    quarantine_reason_detail   NVARCHAR(100) NULL;
```

## Initial seed-rule design

Broad first pass — no overfitting; tightens after live profiling.

```
Rule 10  CONVERSION_LEGACY
  precedence:               1
  prop_type_cd_csv:         NULL (any)
  property_use_mode:        ANY
  ag_apply_value:           NULL
  requires_legacy_marker:   true
  legacy_marker_type:       CREATED_DT_PRE_2017   (initial; may add SOURCE_SYSTEM/IMPORT_BATCH later)
  reason:                   Use only when current PACS domain signals cannot classify
                            confidently and a legacy marker is present.
  confidence:               MED

Rule 20  AG_CURRENT_USE
  precedence:               2
  prop_type_cd_csv:         NULL (any)
  property_use_mode:        ANY
  ag_apply_value:           T
  requires_legacy_marker:   false
  reason:                   ag/current-use/open-space/conversion valuation universe
                            overrides normal R/commercial splits.
  confidence:               HIGH
  evidence_source:          dbo.land_detail.ag_apply distributions audited 2026-05-06

Rule 30  PERSONAL_PROPERTY
  precedence:               3
  prop_type_cd_csv:         P,B
  property_use_mode:        ANY
  ag_apply_value:           NULL
  requires_legacy_marker:   false
  reason:                   BPP / business-personal schedules have distinct attribute semantics.
  confidence:               HIGH
  evidence_source:          Benton personal-property monitor (operator-supplied)

Rule 40  MOBILE_HOME
  precedence:               4
  prop_type_cd_csv:         MH
  property_use_mode:        ANY
  ag_apply_value:           NULL
  requires_legacy_marker:   false
  reason:                   Mobile home is real-but-not-stick-built and gets its own dictionary.
  confidence:               HIGH

Rule 50  REAL_COMMERCIAL
  precedence:               5
  prop_type_cd_csv:         R
  ag_apply_value:           F
  property_use_mode:        EXCLUDE
  property_use_cd_csv:      11,12,13,14,18    (residential codes excluded → commercial path)
  requires_legacy_marker:   false
  reason:                   Broad non-residential real-property bucket for initial seed.
  confidence:               MED
  notes:                    Tighten property_use_cd_csv against observed commercial distribution
                            in a follow-up after the first profiling drain.

Rule 60  REAL_RESIDENTIAL
  precedence:               6
  prop_type_cd_csv:         R
  ag_apply_value:           F
  property_use_mode:        ANY
  requires_legacy_marker:   false
  reason:                   Broad default real-property residential catch after higher-precedence
                            rules resolve.
  confidence:               MED
```

`UNKNOWN` is not a seeded rule; it's the sentinel value the
classifier returns when no rule matches. The promoter writes
`universe_code = 'UNKNOWN'`, `universe_rule_id = NULL`,
`universe_confidence = 'LOW'`, and a `universe_reason` like
`"no rule matched (prop_type=X, property_use=Y, ag_apply=Z)"`.

## Per-universe dictionary evaluation contract

```
Step 1: Classify the improvement row into a universe via
        tf_doctrine_property_universe.
Step 2: Evaluate the imprv_attr code against
        tf_doctrine_attribute_dictionary[universe_code, county, year].
Step 3: Quarantine ONLY when the code is missing from the dictionary
        FOR THAT UNIVERSE (not from any other universe's dictionary).
Step 4: Never quarantine globally just because a code is absent from
        a different universe's dictionary.
```

## Quarantine reason taxonomy

Replace the single muddy `UnknownIAttrValCd` with explicit reasons
that tell the operator WHICH stage of the pipeline failed:

```
UnknownUniverse                         classification failed; no rule matched
UnknownForUniverseDictionary            universe was classified, code is unknown for that dictionary
UniverseNotEvaluated                    classifier didn't run for this row (defensive)
DictionaryNotLoadedForUniverse          universe was classified but its dictionary has 0 rows
LegacyClassificationUncertain           CONVERSION_LEGACY rule fired but marker is weak evidence
```

This separates classification-failure from dictionary-load-failure
from actual unknown-code-within-known-universe. The operator can
remediate each one differently.

## Test plan

### A. Universe precedence tests

```csharp
[Fact] AG_CURRENT_USE_beats_REAL_RESIDENTIAL_when_ag_apply_is_T()
[Fact] MOBILE_HOME_beats_real_property_buckets_when_prop_type_is_MH()
[Fact] PERSONAL_PROPERTY_beats_real_property_buckets_for_P_and_B()
[Fact] CONVERSION_LEGACY_does_not_fire_without_explicit_legacy_marker()
[Fact] CONVERSION_LEGACY_beats_all_other_buckets_when_marker_is_present_and_current_rules_are_not_confident()
[Fact] REAL_COMMERCIAL_beats_REAL_RESIDENTIAL_when_broad_nonresidential_rule_matches()
[Fact] REAL_RESIDENTIAL_is_default_real_bucket_after_higher_precedence_rules_fail()
[Fact] UNKNOWN_is_returned_when_no_rule_matches()
```

### B. Dictionary evaluation tests

```csharp
[Fact] code_known_in_REAL_RESIDENTIAL_is_not_unknown_in_that_universe()
[Fact] same_code_missing_in_REAL_COMMERCIAL_is_quarantined_only_for_that_universe()
[Fact] code_known_in_MOBILE_HOME_does_not_require_presence_in_REAL_RESIDENTIAL()
[Fact] code_known_in_AG_CURRENT_USE_does_not_require_presence_in_PERSONAL_PROPERTY()
[Fact] dictionary_not_loaded_for_universe_yields_DictionaryNotLoadedForUniverse_not_unknown_code()
```

### C. False global quarantine regression tests

```csharp
[Fact] global_dictionary_absence_does_not_quarantine_when_universe_dictionary_contains_code()
[Fact] one_universe_missing_code_does_not_poison_other_universes()
[Fact] previously_reported_unknown_imprv_attr_can_resolve_when_universe_is_classified_correctly()
```

### D. Projection / persistence contract tests

```csharp
[Fact] truth_improvement_receives_universe_columns()
[Fact] canonical_improvement_receives_universe_columns()
[Fact] quarantine_row_receives_universe_and_reason_detail()
```

## Out of scope (explicitly NOT in SYNC-DOCTRINE-4)

- Splitting AG into `AG`, `OSP`, `CNV` sub-universes. Single
  `AG_CURRENT_USE` for now.
- Five parallel truth + canonical tables (Approach B). Single
  canonical table with `universe_code` column.
- Widening `PERSONAL_PROPERTY` beyond `prop_type_cd ∈ {P, B}` until
  Benton-specific evidence supports more types.
- Automatic legacy-marker inference. `CONVERSION_LEGACY` rule
  requires explicit marker presence; we don't try to deduce
  "this looks legacy."
- Full PACS attribute codebook extraction. Per-universe dictionary
  rows are seeded narrowly first; tightening waits on a profiling
  drain.

## Plan for the implementation slice (SYNC-DOCTRINE-4-IMPL)

When the operator authorizes implementation:

1. **Schema**
   - EF entities: `TfDoctrinePropertyUniverse`, `TfDoctrineAttributeDictionary`
   - EF configurations + DbSets + index design
   - `Universe*` columns on `TruthPacsImprvCurrent` and `TfImprovement`
   - `Universe*` + `QuarantineReasonDetail` on `LegacyTfUnprovenImprvAttr`
   - One EF migration

2. **Services**
   - `IPropertyUniverseClassifier` — input: prop_type_cd, property_use_cd,
     ag_apply, ag_use_cd, legacy markers; output: `(universe_code, rule_id, confidence, reason)`
   - `IPerUniverseAttributeDictionary` — replaces
     `RefreshableImprvAttrDictionary`; lookups are
     `(county, universe_code, year, code)`-keyed
   - Both Singleton with cache + `IServiceScopeFactory` for DB reads,
     same shape as B1's `RatioQualificationPolicy`

3. **Seeders**
   - `DoctrinePropertyUniverseSeeder` — six rules above, with
     evidence citations
   - `DoctrineAttributeDictionarySeeder` — initial seed deferred
     until a profiling drain produces per-universe code distributions
   - `HostedService` runs both at startup (idempotent)

4. **Promoter / projector rewires**
   - `PacsImprvLandingService` (or a new `PacsImprvCurrentTruthPromoter`
     hop) classifies each row's universe + writes universe columns
   - `PacsImprvAttrLandingService` consults
     `IPerUniverseAttributeDictionary[universe]` instead of the
     global dictionary
   - `PacsImprvCanonicalProjector` forwards universe columns
     verbatim from truth → canonical
   - New informational gates:
     - `truth-pacs-imprv-universe-distribution`
     - `truth-pacs-imprv-attr-per-universe-quarantine-summary`

5. **Tests** (per the test plan above)

6. **Endpoints** (admin / read)
   - `GET /api/sync/doctrine/policy/universe`
   - `GET /api/sync/doctrine/policy/universe/classify?prop_type_cd=…&property_use_cd=…&ag_apply=…`
   - `GET /api/sync/doctrine/policy/attribute-dictionary?universe=…`
   - `POST /api/sync/doctrine/policy/universe/seed`
   - `POST /api/sync/doctrine/policy/attribute-dictionary/refresh`
     (re-pulls from PACS audit query when tightening time comes)

7. **Documentation update**
   - `docs/sync/sync-doctrine-4-runbook.md` — operator runbook for
     drain + per-universe quarantine review

## Save state — design done, implementation pending

```
SYNC-DOCTRINE-4: design approved 2026-05-06.
  Approach C locked.
  Six universes + UNKNOWN sentinel locked.
  Precedence locked.
  Two doctrine tables specified.
  truth + canonical column adds specified.
  Six initial seed rules specified (broad; tighten after profiling).
  Quarantine reason taxonomy specified (5 named reasons).
  Test plan specified (A: precedence, B: dictionary, C: false-global-regression, D: persistence).

Next: SYNC-DOCTRINE-4-IMPL — operator-authorized implementation slice
      will translate this design into EF migration + services + seeders
      + tests. No code in this slice.
```

## One-line summary

**SYNC-DOCTRINE-4 design: six-universe improvement classifier +
per-universe attribute dictionary, replacing the single global
imprv_attr quarantine bucket with universe-aware classification and
five explicit quarantine reasons. The fireplace finally got the
right zip code.**
