# King Correction Plan

Generated: 2026-05-26T16:02:23.600Z

## Verdict

- Scope: King only
- Database mutation allowed: no
- Production binding allowed: no
- Certification allowed: no
- Source-only PINs: 1173
- Canonical-only ParcelNumbers: 463
- Case-only edges: 12
- True source-only PINs after case policy: 1161
- True canonical-only rows after case policy: 451

## Case Policy

- Selected policy: preserve_source_pin_case_exactly
- Rationale: ParcelNumber is source-native. King source PIN values include mixed-case tract/unknown suffixes; silently uppercasing them would reintroduce an unapproved transform.
- Correction rule: For the case-only pairs, update the existing canonical row ParcelNumber and TerraFusionParcelKey to the exact source PIN spelling, preserve the previous value in LegacyImportedParcelKey, and emit a correction receipt.
- Rejected alternative: Uppercase normalization remains possible only if a future identity contract explicitly approves uppercase as a canonical transform and records the transform receipt.

## 463 Canonical-Only Rows

- Classification: canonical_stale_or_unproven_seed_rows
- DB inspection available: yes
- DB rows inspected: 463
- Expected rows: 463
- Correction rule: Do not delete canonical-only rows. For rows still absent from source after exact source recapture/probe, mark them superseded/inactive in a transaction and preserve lineage/rollback evidence.

### DB Status Counts

| ParcelStatus | Count |
| --- | ---: |
| ACTIVE | 463 |

### DB Property Type Counts

| PropertyType | Count |
| --- | ---: |
| 11 | 234 |
| 91 | 81 |
| 14 | 68 |
| 18 | 24 |
| 33-0 | 23 |
| 12 | 11 |
| 13 | 8 |
| 33-159 | 3 |
| 69 | 3 |
| 51 | 2 |
| 16 | 1 |
| 33-157 | 1 |
| 49 | 1 |
| 54 | 1 |
| 59 | 1 |
| 63 | 1 |

## 1,173 Source-Only PINs

- Classification: current_source_pins_missing_from_canonical
- Source capture complete: yes
- Should be loaded: Presumptively yes for source PINs that represent tax parcels. Tract/place-holder/unknown patterns require explicit load/exclusion policy because King source documents placeholder polygons.

## Correction Sequence

- Freeze King source artifact and current canonical export used by this plan.
- Apply source-exact case policy to the 12 case-only edge rows in dry-run first.
- Run DB detail export and live source absence probe for the 451 true canonical-only rows.
- Build a no-op staging artifact for the 1161 true source-only PINs with duplicate and placeholder classification.
- Generate a transaction plan that supersedes proven stale canonical rows and inserts/updates valid staged source-only rows.
- Run the correction in a single authorized King-only transaction after backup approval.
- Rerun King adjudication, post-repair closure, WA_INITIAL_SEED receipt reconciliation, and production DB binding plan.

## Stop Conditions

- STOP if DB detail row count does not match the canonical-only list.
- STOP if source-only staging lacks required source payload beyond PIN.
- STOP if proposed correction creates duplicate active CountyId + ParcelNumber.
- STOP if rollback snapshot cannot be written.
- STOP if production binding is attempted before King receipt conversion passes.

## Receipt Requirements

- source URL and access timestamp
- raw artifact path and sha256
- normalized staging artifact path and sha256
- source PIN field name
- duplicate PIN normalization summary
- placeholder/tract inclusion policy
- insert/update/supersede counts
- rollback receipt

## Blockers

- King cannot convert to WA_INITIAL_SEED receipt-backed posture until identity parity is restored.
- No production binding while King correction remains planned-only.
- No DB mutation in this slice.
- 1161 true source-only King PINs require staged load or documented exclusion.
- 451 true canonical-only King rows require source absence proof and supersede/exclusion decision.
- 12 case-only King identifier edges require source-exact correction policy.
