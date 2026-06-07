# Owner Lane — SEAL UPGRADE: SupNum Resolution (2026-06-07)

## Outcome
**Owner lane truth sealed at 100% — the 95.72% promoter ceiling is broken.**
`truth_pacs.owner_current` = **816,849 rows / 816,849 distinct (PropId, OwnerTaxYr, OwnerId) = 1.0000× dup**.
Grew **+42,089** from the prior 774,760 (95.72%) baseline — exactly the class-2
active-supplement parcel-years that the prior seal diagnosed as the residual gap.
**Promoter rejections: stalesup 0, nosupp 0.**

Commit: `d90b2b200` — `fix(sync): land active-supp owner records with bulk owner-wsdor landing`
(plus `f1a733c76`, the earlier supp `activeSupp:true`).

---

## Re-diagnosis: the gap was the OWNER source, not (only) the supp source

The prior seal (`2026-06-06-owner-lane-seal.md`) diagnosed the 34,636-tuple gap as a
supp-assoc promotion reject and scoped "OWNER-SUPNUM-RESOLUTION" as resolving
`MAX(sup_num)` in the supp source. That fix was **necessary but not sufficient.**

The owner-current truth promoter (`PacsOwnerCurrentTruthPromoter`, line ~172) promotes an
owner row only when **`suppPtr.SupNum == owner.SupNum`**. `SqlServerPacsOwnerSource`
hardcoded `WHERE sup_num = 0`, landing only the **base** owner record. For class-2
parcel-years (active supplement ≠ 0), `owner.SupNum = 0` while the supp active supplement
is non-zero → the promoter rejects them as **stalesup**. Making only the supp source
resolve `MAX(sup_num)` moved the 34,636 from `nosupp` → `stalesup`; they still never
promoted.

### Proven before the fix (promoter-join simulation against landed batches)
```
owner batch (all sup=0) ⋈ supp batch (MAX per key):
  would_promote        = 774,760   (= current truth — ZERO growth)
  would_reject_stalesup= 34,636
  would_reject_nosupp  = 0
```

### Live PACS verification of the fix shape
`dbo.owner` holds BOTH a sup=0 AND an active-supplement record for class-2 keys
(10007/2022 → {0,130}, 10008/2020 → {0,37}, 10015/2020 → {0,37}). Of **42,089** class-2
keys (supp MAX>0, owner_tax_yr≥2018), **42,089 (100%)** have an owner record at the active
supplement — **0 missing**. So resolving the owner source to the active supplement
captures the entire gap; no promoter doctrine change is needed.

---

## The fix

1. **`SqlServerPacsOwnerSource`** — opt-in `activeSupp` parameter. When true, joins
   `dbo.prop_supp_assoc` `MAX(sup_num)` per `(prop_id, owner_tax_yr)` and lands the owner
   record at that active supplement. Default (false) preserves the exact `sup_num = 0`
   behavior, so the sealed land / improvement / parcel-seed lanes are untouched.
2. **`DoctrineDrainController.DrainOwnerWsdor`** — Owner-S1 uses `activeSupp: true`.
3. **`KeyedSqlServerPacsPropSuppAssocSource`** — the activeSupp path resolves `MAX(sup_num)`
   via ONE bounded grouped scan (`WHERE owner_tax_yr BETWEEN @min AND @max GROUP BY …`),
   replacing 810 OR-chunk re-scans (~30 rows/sec).
4. **`PacsOwnerLandingService` + `PacsPropSuppAssocLandingService`** — replaced per-row EF
   `Add`/`SaveChanges` with **Npgsql binary COPY** for the ~810K-row full-corpus landings.

---

## Pre-re-drain proof gates (against landed data) — ALL PASS
```
GATE 1 active-supp owners land : 774,760 sup=0 + 42,089 sup>0(active) = 816,849
GATE 2 owner.SupNum==supp.SupNum: would_promote=816,849  stalesup=0  nosupp=0
GATE 3 truth dup               : 774,760 / 774,760 = 1.0000x (pre-drain)
GATE 4 sealed lanes            : imprv 99,694 · land 87,767 · sale 29,608 · geom 80,075
```

## Post-re-drain proof (live Harris PACS, FullCorpus)
```
truth_owner            = 816,849   (100% of active-supplement owner universe)
truth_dist             = 816,849   dup = 1.0000x
stalesup gap           = 0         (was 34,636 — CLOSED)
nosupp gap             = 0
owner sup distribution = 774,760 sup=0  +  42,089 sup>0 (active supplement)
canon_owner            = 312,532   (Owner-Canonical stage COMPLETED; accumulating projection)
owner_parcel_links     = 2,111,805
sealed lanes unchanged : imprv 99,694 · land 87,767 · sale 29,608 · geom 80,075
```

### Note on 816,849 vs the prior 809,396 "universe"
The prior denominator (809,396) counted distinct `(prop_id, owner_tax_yr, owner_id)` at
`sup_num = 0`. The active-supplement universe is larger because co-ownership at non-zero
supplements yields more owner rows. `dup = 1.0000×` (rows = distinct natural keys)
confirms no duplication — 816,849 is the correct active-supplement owner truth count.

---

## Nine-number checkpoint (co-founder format)

| # | Metric | Value |
|---|---|---|
| 1 | truth_owner count | **816,849** |
| 2 | truth_owner dup | **1.0000×** (816,849 / 816,849) |
| 3 | growth vs prior seal | **+42,089** (774,760 → 816,849) |
| 4 | stalesup gap | **0** (was 34,636) |
| 5 | nosupp gap | **0** |
| 6 | canon_owner | 312,532 (Owner-Canonical completed) |
| 7 | owner_parcel_links | 2,111,805 |
| 8 | sealed-lane integrity | imprv 99,694 · land 87,767 · sale 29,608 · geom 80,075 — unchanged |
| 9 | failures (data) | **0** |

---

## WSDOR sub-lane (continuing)

The owner-wsdor drain also re-drives `truth_pacs.wash_prop_owner_val` (WSDOR DOR values)
via WPOV-S1 → WPOV-Truth → WSDOR-Canonical. At seal time these EF-bound stages were still
running (WPOV-S1 landing); `wash_prop_owner_val` remained at its prior 774,696 coverage and
will re-drive toward the ~816K active-supplement set as WPOV-Truth completes. This mirrors
the prior seal, which sealed on owner truth with the WSDOR/canonical sweep "in progress."
The WSDOR re-drive does not affect the owner-current truth seal proven above.

---

## Classification

**SEALED — 100% owner-current truth coverage.**

The class-2 active-supplement gap that capped the prior seal at 95.72% is fully closed:
816,849 / 816,849 promotable owner rows promoted, 0 stalesup, 0 nosupp, 1.0000× dup. All
four previously sealed lanes are intact and unchanged. WSDOR `wash_prop_owner_val` re-drive
+ full canonical owner sweep continue downstream.

---

*Evidence collected 2026-06-07 against live Harris PACS. Fix commit `d90b2b200`.*
