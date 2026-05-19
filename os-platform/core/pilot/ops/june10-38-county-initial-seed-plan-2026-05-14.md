# June 10 38-County Initial Seed Plan

Date: 2026-05-14
Mode: wait-state data-lane plan while Benton Sync owns the active DB lane
Scope: plan and proof doctrine only; no source fetch, DB mutation, or runtime claim in this slice

## Why This Exists

The current June 10 evidence says two different things that must not be collapsed:

- all 39 Washington counties have source-decision registry coverage;
- the runtime registration/crosswalk artifacts show a small parcel seed signal for all 39 counties;
- those facts do not prove full county data, current parcel completeness, sales completeness, CostForge readiness, or end-to-end workflow readiness.

The 38 non-Benton counties still need a full initial seed lane. That lane can be planned and prepared while Benton Sync is running, but it must not mutate the active Benton runtime DB or interfere with the Sync drain.

## Operating Definition

Initial seed means:

```text
one controlled first load of county public data into TerraFusion-owned storage,
with receipts, row counts, source snapshot identity, county identity, API proof,
and explicit workflow limits.
```

Initial seed does not mean:

```text
continuous sync,
official county-certified cost data,
runtime readiness by county name,
sample/demo rows,
or five-row smoke data being treated as full county coverage.
```

## Current Evidence Baseline

From the current artifacts:

| Artifact | Current signal | Correct interpretation |
|---|---|---|
| `washington-39-county-coverage.latest.json` | 39 counties present; source families assigned; no not-started rows in latest proof | Registry/source-decision coverage only. |
| `washington-39-county-data-crosswalk.md` | 39 counties show runtime parcel seed and no data-acquisition blockers | Seed signal only; still requires receipts and full-row proof. |
| `county-runtime-registration-ledger.md` | 39 counties return 200 with 5 parcel rows | Endpoint registration/smoke proof only; not full county data. |
| `runtime-candidate-set.md` | runtime scope requires review and 39-county runtime claim is prohibited | Do not claim full runtime readiness. |

## Target End State

For each of the 38 non-Benton counties, the initial seed lane must produce:

1. county source snapshot receipt;
2. raw payload files or extract manifests;
3. normalized TerraFusion load manifest;
4. product-load receipt;
5. county identity proof;
6. parcel row count and distinct parcel count;
7. sales row count and date coverage, if sales source exists;
8. geometry or map availability status;
9. API proof through TerraFusion API;
10. UI smoke proof for the county switcher/basic inspection path;
11. workflow permission label: available, limited, blocked, or post-launch.

## Required Load Levels

| Level | Name | Meaning | Claim allowed |
|---|---|---|---|
| `L0_registry` | Source decision only | Assessor/source registry row exists | provenance inventory |
| `L1_snapshot` | Raw public snapshot captured | Raw public files/API responses captured with receipt | acquisition captured |
| `L2_normalized` | Normalized load artifact | Data transformed into TerraFusion load shape | load candidate |
| `L3_loaded` | TerraFusion DB initial seed loaded | Rows loaded to TerraFusion-owned storage with receipt | data loaded, not workflow-ready |
| `L4_api_proven` | API row path proven | TerraFusion API returns county rows with county identity and no fallback | API-proven seed |
| `L5_ui_smoked` | Basic UI smoke passed | User can select/open county and inspect at least one real parcel | limited pilot workflow |
| `L6_workflow_ready` | Domain workflow proof | parcel, sales, map, valuation labels, and limitations are all correct | scoped workflow claim |

No county reaches `L6_workflow_ready` from smoke rows alone.

## County Family Work Queue

Use acquisition family from the registry proof to group work. This keeps adapters/loaders repeatable without pretending every county is identical.

| Family | Count | Seed strategy |
|---|---:|---|
| Direct sales search | 25 | Build one direct-search acquisition recipe, then specialize only where query/forms differ. |
| Parcel transfer history | 8 | Start parcel-first; sales confidence depends on transfer history completeness and date/price availability. |
| Monthly sales report | 4 | Prefer file/report download receipts, parse reports into normalized sales rows, then attach parcel context. |
| Monthly report / parcel history | 1 | Treat as hybrid; require both report receipt and parcel transfer fallback receipt. |
| Parcel transfer history / open data export | 1 | Prefer open data export as primary if complete; parcel transfer history is fallback. |

## Initial Seed Database Strategy

Do not load the 38-county seed into the active Benton proof DB while Benton Sync is running.

Safe options:

| Option | Use when | Notes |
|---|---|---|
| Separate TerraFusion seed database | best default | Allows acquisition/load proof without touching Benton runtime proof DB. |
| Separate TerraFusion schema in staging DB | acceptable if isolated | Requires schema-level receipts and no cross-county fallback. |
| Local file-based normalized payloads only | acceptable during planning | Not runtime proof until loaded into TerraFusion DB. |

The preferred next implementation lane is:

```text
38-county public initial seed staging DB
```

This lane is separate from the active Benton Sync drain. It can proceed after authorization if it does not use the same DB/process and does not modify active Benton proof state.

## Required Receipt Model

Every county seed attempt needs a receipt with:

```text
county
state
source family
source URL/system
source snapshot timestamp
raw artifact paths
raw artifact hashes
normalized artifact path
normalized artifact hash
target TerraFusion DB identity
target table/schema
parcel rows loaded
distinct parcels loaded
sales rows loaded
date range
geometry rows loaded
warnings
blockers
operator claim label
```

The receipt status must be one of:

```text
ATTEMPT
LOADED_NEEDS_API_PROOF
API_PROVEN_NEEDS_UI_SMOKE
LIMITED_WORKFLOW_READY
BLOCKED
```

## Proof Gates Per County

### Gate A: Source Snapshot

Passes only if:

- source URL/system is recorded;
- raw payload exists;
- raw payload hash exists;
- acquisition timestamp exists;
- artifact is not sample/demo data.

### Gate B: Normalized Payload

Passes only if:

- normalized schema is TerraFusion-owned;
- county identity is explicit;
- parcel identifier exists;
- active/current semantics are recorded or marked unknown;
- sales fields are recorded or explicitly absent.

### Gate C: TerraFusion Load

Passes only if:

- target DB identity is recorded;
- product-load receipt exists;
- row count is greater than smoke minimum;
- distinct parcel count is plausible for that county;
- load does not fallback to Benton or any other county.

### Gate D: API Proof

Passes only if:

- `/api/counties/{countyToken}/parcels` returns real rows;
- payload county identity matches selected county;
- row count is from TerraFusion DB;
- no fallback is detected;
- endpoint response is not capped smoke data being used as full count.

### Gate E: UI Smoke

Passes only if:

- county can be selected/opened;
- at least one real parcel can be inspected;
- county label/trust label is visible;
- unsupported workflows are labeled or blocked;
- no full 39-county runtime claim appears.

## Minimum Row Sanity

Each county needs county-specific row sanity. Do not reuse Benton's expected range.

For every county, record:

```text
expected active parcel range source
loaded parcel rows
distinct parcel identifiers
active/current parcel identifiers
unknown status rows
duplicate/version rows
sales rows
sales date range
```

If expected range is unavailable, the county can be `L3_loaded` or `L4_api_proven`, but not `L6_workflow_ready`.

## Parallelization Plan

This lane can be parallelized by family after the receipt model exists.

| Workstream | Owner type | Independence |
|---|---|---|
| Direct-sales recipe | acquisition worker | independent from parcel-transfer recipe |
| Parcel-transfer recipe | acquisition worker | independent from monthly-report recipe |
| Monthly-report parser | acquisition worker | independent from direct-search recipe |
| Receipt schema/gate | platform worker | must finish before load claims |
| API proof runner | truth worker | depends on loaded staging DB |
| UI smoke checklist | UAT worker | depends on API proof |

Do not parallelize DB writes into the active Benton proof DB.

## Execution Order

1. Define receipt schema and artifact folder convention.
2. Create a separate TerraFusion seed DB or isolated staging schema.
3. Pick one county per acquisition family for a pilot seed.
4. Run Gate A and Gate B for those family representatives.
5. Load into staging TerraFusion DB with receipts.
6. Run API proof against staging.
7. Update the 39-county crosswalk from receipts, not names.
8. Expand family recipes across remaining counties.
9. Run UI smoke only for counties that reach `L4_api_proven`.
10. Decide June 10 claim boundary from proof.

## First Family Representatives

Recommended representatives:

| Family | Representative | Reason |
|---|---|---|
| Direct sales search | Yakima | Known user-supplied Spatialest lead and high operational value. |
| Parcel transfer history | Cowlitz | User supplied multiple GIS/property links and parcel-focused leads. |
| Monthly sales report | Klickitat or Mason | Report-family parsing exercises file-based path. |
| Open data export hybrid | Kitsap | Tests open-data export pattern. |
| Hybrid monthly/parcel | Douglas | Exercises report plus parcel fallback. |

This is not county prioritization for launch claims. It is adapter/recipe coverage.

## June 10 Claim Rules

Allowed:

```text
Benton runtime pilot, if Benton proof gates pass.
Washington 39-county source registry/provenance inventory.
38-county initial seed lane in progress, with per-county receipts.
Specific non-Benton counties may be described by their proven seed level only.
```

Forbidden:

```text
39-county full runtime readiness.
38 counties fully loaded without receipts.
Smoke rows described as full data.
CostForge official/certified claims for counties without calibration proof.
UI workflow readiness without API and UI smoke proof.
```

## Current Status

This slice is a plan only. It does not prove or load the 38 counties. It defines the execution ladder so the next implementation work can start with receipts and staging isolation instead of ad hoc scraping, sample rows, or runtime overclaims.
