# Benton Current-Year Production Readback — Results

_Date: 2026-06-08 · Acceptance readback of the six-parcel set against the sealed current-year
substrate. Evidence layer: direct canonical query (data-seal + cross-lane join). County Studio UI
pixel layer NOT exercised (frontend `:3000` not running); see §Limits._

**Verdict (original 2026-06-08): NOT ACCEPTED (partial)** — value / jurisdiction / revenue passed
per-parcel; land / improvement / geometry did not join to the same parcel identity (gating defect F1).

> **UPDATE 2026-06-08 — F1 REPAIRED (canonical identity re-key).** The parcel-identity fork was
> repaired by a set-based re-key (evidence `evidence/2026-06-08-f1-set-based-rekey-repair.md`):
> `tf_land` 87,767 = truth / 100% live / 0 orphan (588 rows lost to projector aborts restored from
> truth); `tf_improvement` 99,694 / 100% live / 0 orphan; `tf_parcel_geom` 79,105 live / 0 dangling /
> 970 known NULL-APN residual preserved. Unaffected lanes unchanged. Post-repair 6-parcel readback:
> all surfaces resolve where truth has them (the two zero-land parcels, 321209 & 87621, genuinely
> lack land/geom in truth — verified, not a defect). **Substrate now joins end-to-end on the live
> parcel spine.** Source seals remained valid throughout; only canonical parcel FKs were re-keyed.

### Post-F1 re-run readback — PASS (data-seal + cross-lane join layer, 2026-06-08)

| Parcel | own | assmt | land | improv | geom | exmpt | txarea | levy | A-bill | due/paid/bal | |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---|:-:|
| 1·321209 resid | 2 | 1 | 0¹ | 1 | 0¹ | 0 | 1 | 11 | 0 | 1309.58/0/1309.58 | ✅ |
| 2·10009 exmpt | 9 | 1 | 1 | 0 | 1 | 1 | 1 | 12 | 0 | 0/0/0 | ✅ |
| 3·87621 supp | 9 | 1 | 0¹ | 0¹ | 0¹ | 0 | 1 | 15 | 0 | 4260.25/0/4260.25 | ✅ |
| 4·23199 spec | 9 | 1 | 1 | 0 | 1 | 0 | 1 | 14 | 6 | 606.77/0/606.77 | ✅ |
| 5·10881 paid | 9 | 1 | 1 | 3 | 1 | 0 | 1 | 11 | 3 | 1841.02/1132.26/708.76 | ✅ |
| 6·56444 dist | 9 | 1 | 1 | 1 | 1 | 0 | 1 | 15 | 4 | 3453.38/0/3453.38 | ✅ |

¹ truth-verified absent (land_truth=0 / geom_truth=0 / imprv_truth=0 for that parcel) — legitimate,
not a defect. Pre-repair, all six showed land/improv/geom = 0 (the fork); now they resolve wherever
truth has the segment. **Remaining human step:** the County Studio **UI-pixel layer** was not exercised
here (frontend `:3000` not running) — re-run these six in the live UI to confirm the cards render. The
canonical substrate beneath them is now joined end-to-end on the live parcel spine.

---

## Per-parcel surface matrix (canonical, by source_xref parcel identity)

| profile | prop_id | parcel(xref) | owner | assessment | exemption | tax area | levy lines | A-bill lines | due / paid / balance | land | improv | geom |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 residential | 321209 | ✅ | 2 | ✅ | 0 ✓ | ✅ | 11 | 0 | 1309.58 / 0 / 1309.58 | **0 ✗** | **0 ✗** | **0 ✗** |
| 2 exemption | 10009 | ✅ | 9 | ✅ | 1 ✅ | ✅ | 12 | 0 | 0 / 0 / 0 | **0 ✗** | **0 ✗** | **0 ✗** |
| 3 nonzero supp | 87621 | ✅ | 9 | ✅ | 0 | ✅ | 15 | 0 | 4260.25 / 0 / 4260.25 | **0 ✗** | **0 ✗** | **0 ✗** |
| 4 special-assmt | 23199 | ✅ | 9 | ✅ | 0 | ✅ | 14 | 6 ✅ | 606.77 / 0 / 606.77 | **0 ✗** | **0 ✗** | **0 ✗** |
| 5 paid > 0 | 10881 | ✅ | 9 | ✅ | 0 | ✅ | 11 | 3 | 1841.02 / **1132.26** / 708.76 ✅ | **0 ✗** | **0 ✗** | **0 ✗** |
| 6 complex dist | 56444 | ✅ | 9 | ✅ | 0 | ✅ | 15 | 4 | 3453.38 / 0 / 3453.38 | **0 ✗** | **0 ✗** | **0 ✗** |

✓ = correct presence/absence for the profile. ✗ = surface did not resolve.

**Passing surfaces (all six):** parcel identity (via `source_xref`), owner, assessment value,
exemption (correctly present only on #2), tax area + districts, levy bill lines, special-assessment
bill lines (present on #4/#5/#6 as expected), and due/paid/balance rollup. Net-paid on #5 reconciles
(balance = due − paid = 1841.02 − 1132.26 = 708.76).

**Failing surfaces (all six):** land, improvement, geometry — zero rows under the parcel identity the
other surfaces use.

---

## Findings

### F1 — Land / improvement / geometry keyed to a disjoint parcel identity (HIGH · projection/identity-wiring)

**Proven, not assumed:**
- `tf_land` (82,012 parcels), `tf_improvement` (99,694 rows), `tf_parcel_geom` (80,075) exist and
  were each sealed — the data is present.
- But **0** of `tf_land`'s distinct `TfParcelId`s appear in `sync_bridge.source_xref`
  (`land_ids_in_xref = 0`) **and 0** appear in `canonical_tf.tf_parcel`
  (`land_parcels_in_tf_parcel = 0`).
- Geometry is **not** reachable by APN either: for all six parcels, `tf_parcel_geom.ArcGisApn` =
  parcel `ParcelNumber` yields 0 matches (with and without dashes).
- Meanwhile owner / assessment / exemption / tax-area / bills all resolve under the
  `source_xref → tf_parcel` identity (e.g. prop 321209 → `0477f06a-…`, `ParcelNumber` = APN
  `834083000001046`).

**Classification:** Projection / identity-wiring failure — canonical truth for each lane is right and
sealed within its own identity space, but land/improvement/geometry are keyed to a `TfParcelId`
population disjoint from the identity that owner/assessment/exemption/jurisdiction/revenue use. A
unified County Studio parcel page resolving by `source_xref` will surface value/jurisdiction/revenue
but **not** land/improvement/geometry.

**Hypothesis (UNPROVEN — do not promote):** an identity-repair / renumber event re-keyed `tf_parcel`
after land/improvement/geometry were projected, orphaning them (`tf_parcel` carries an
`IdentityRepairReceiptId` column). Root cause must be traced before any repair.

### F2 — `tf_parcel` identity inflation (HIGH · identity integrity · observation)

`canonical_tf.tf_parcel` holds **3,198,979 rows / 3,198,949 distinct `ParcelNumber`s** — roughly 36×
Benton's ~89K real parcels. The `source_xref` resolution still lands on the correct single parcel per
`prop_id` (with the right APN), so current-session lanes are unaffected, but the parcel identity table
itself is heavily inflated and needs its own investigation. Cause not yet diagnosed.

---

## Failure classification (per the three-bucket rule)

| Finding | Data seal failure? | Projection/identity wiring? | Out-of-scope expectation? |
|---|---|---|---|
| F1 land/improv/geom not joining | **No** — each lane's data exists & was sealed | **Yes** — disjoint parcel identity | No |
| F2 tf_parcel inflation | **No** (resolution still correct) | **Yes** — identity-layer integrity | No |

No data-seal failures. No out-of-scope expectations triggered (no receipt/delinquency/distribution
surfaces were expected or claimed).

---

## Acceptance decision

**Not accepted for unified production readback.** The value, jurisdiction, and revenue surfaces are
per-parcel readable and correct; but land, improvement, and geometry do not resolve under the same
parcel identity, so an end-to-end County Studio parcel page is not yet whole. This is a **gating
integration defect**, not a re-opening of any sealed lane.

**Recommended next (scoped, requires explicit go — NOT auto-executed):**
1. Trace the parcel-identity fork root cause (F1) — prove how land/improvement/geometry `TfParcelId`
   relates (or fails to relate) to `tf_parcel` / `source_xref`; confirm or reject the identity-repair
   hypothesis. Read-only.
2. Investigate `tf_parcel` inflation (F2) — establish the true real-parcel identity count and the
   source of the 3.2M-row population. Read-only.
3. Only then: a parcel-identity **crosswalk/projection repair** so land/improvement/geometry resolve
   to the same identity as the other surfaces — without altering the sealed drains' underlying data.

Do **not** reopen the sealed drains, build new canonical models, or touch the revenue lanes for this.
It is an identity/projection repair, to be scoped as its own mission.

---

## Limits of this readback

- **County Studio UI pixel layer not exercised** — the frontend (`:3000`) is not running in this
  environment; no aggregating parcel-profile API was located (AtlasController exposes
  `parcels/{parcelId}` family but was not driven here). This readback evidences the **canonical
  data-seal + cross-lane join** layer only. The UI render + API projection layer remains a human
  County Studio acceptance step, now informed by F1 (expect land/improvement/geometry cards to be
  empty until the identity crosswalk is repaired).
- Evidence is read-only canonical query; nothing was mutated, no schema changed, no drain run.
