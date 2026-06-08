# Benton Current-Year Production Readback Checklist

_Date: 2026-06-08 · Acceptance step for the sealed current-year operational substrate
(Mission 1 valuation + jurisdiction, Mission 2 revenue bill explanation + net-paid attestation)._
_This is an acceptance checklist, NOT an ETL step. Run it per parcel in County Studio to accept the
handoff. Source of truth: live Harris PACS → TerraFusion canonical._

---

## How to use

Pick a representative active Benton parcel (and ideally a few: a plain residential, an ag parcel, an
exempt parcel, and one carrying special assessments). For each, walk the steps below in County Studio
and confirm the displayed value resolves from the named canonical source. A step **passes** when the
parcel's value is present and correct; the negative checks (§ End) **pass** when the unsafe surfaces
do **not** appear.

---

## Positive checks (must be present + correct)

| # | Confirm | Backed by (canonical) | Seal |
|---|---------|-----------------------|------|
| 1 | Parcel opens by identity | `canonical_tf.tf_parcel` + `gis_tf.tf_parcel_geom` | Parcel / Geometry |
| 2 | Owner(s) correct (active supplement) | `tf_owner` + parcel-owner links | Owner ✅ 100% |
| 3 | Land + improvement summary | `tf_land` / improvement features | Land ✅ / Improvement ✅ |
| 4 | Assessment value (assessed / appraised / market) | `tf_assessment` (active-supp, 2025) | Assessment Value ✅ |
| 5 | Exemption context (type/subtype/pct, dict-backed) | `tf_exemption` + `dict_exemption_type` | Exemption ✅ |
| 6 | Tax area + district set | `tf_parcel_tax_area` → `tf_tax_area_district` → `tf_tax_district` | Jurisdiction ✅ |
| 7 | Levy tax bill lines (by district / levy / rate) | `tf_tax_bill_line` (+ `tf_levy_rate`) | Revenue Stage 1 ✅ |
| 8 | Special-assessment bill lines (by agency) | `tf_assessment_bill_line` (+ `tf_assessment_agency`) | Revenue Stage 2B ✅ |
| 9 | Due / paid / balance rollups | `tf_tax_bill_current` + `tf_assessment_bill_current` | Stage 1 + 2B; net-paid attested (Stage 3B) |

**Step 9 note:** the rollup `paid` / `balance` is PACS-recorded bill-grain net paid, attested
penny-exact against the collection ledger (`bill.amount_paid` ≡ `SUM(coll_transaction.base_amount_pd)`,
Δ=$0.00 corpus-wide, evidence `2026-06-07-revenue-spine-stage3b-reconciliation-attestation.md`). It is
**not** a receipt-level or cash-ledger figure.

---

## Negative checks (must NOT appear / must NOT be claimed)

| # | Confirm ABSENT | Why |
|---|----------------|-----|
| 10a | Receipt-level payment history / tender detail | Treasurer-grade cash ledger — deferred |
| 10b | Void / refund / reversal workflow | deferred |
| 10c | Penalty / interest / bond **paid** breakdown | tracked separately in PACS; not in `amount_paid` |
| 10d | Delinquency status / certification | deferred |
| 10e | Fund / distribution accounting | deferred |
| 10f | Prior-year revenue history | current-year (2025) only |
| 10g | Any "cash-ledger complete / treasurer-certified" language | beyond the authorized boundary |

---

## Authorized claim boundary (what the substrate may state)

> Per PACS, this parcel's current-year context includes: owner, land, improvement, assessed value,
> exemptions, tax area + districts, levy tax bill lines by district/levy/rate, special-assessment
> bill lines by agency, and PACS-recorded due/paid/balance rollups — with bill-grain net paid
> reconciled penny-exact to the collection ledger.

It may **not** state: receipt-level history, tender detail, void/refund workflow, penalty-interest
breakdown, cash-ledger operations, fund/distribution accounting, delinquency certification, or
prior-year completeness.

---

## Seal lineage (for the readback record)

```
MISSION 1 ✅ CLOSED — valuation + jurisdiction substrate
  Seal packet: b5f8c529e

MISSION 2 ✅ CURRENT-YEAR REVENUE CLOSEOUT COMPLETE
  Stage 1  levy tax bill:            5845c5360
  Stage 2B special-assessment bill:  82002975f
  Stage 3A payment doctrine:         1ce148235
  Addendum #3:                       598e1fc40
  Stage 3B net-paid attestation:     d7717bfc1
  Registry update:                   feb3b8113
```

Detail registry: `benton-lane-status.md`. Packet: `benton-current-year-spine-seal-packet.md` +
addenda #1/#2/#3. Evidence: `evidence/2026-06-07-*`.

---

*Strategic boundary: Benton has a sealed current-year operational substrate across valuation,
jurisdiction, and revenue bill explanation, with payment net-paid attested, while full Treasurer
accounting remains explicitly deferred. This checklist is the acceptance gate for that substrate —
not an invitation to open a new lane.*
