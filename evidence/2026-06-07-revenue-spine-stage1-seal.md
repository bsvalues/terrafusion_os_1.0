# Revenue Spine Stage 1 — Current-Year Levy Tax Bill Explanation Seal

_Sealed 2026-06-07. Benton County PACS (`pacs_oltp`) → TerraFusion (`terrafusion`)._

## Mission scope (approved)

> "Approved: open Revenue Spine Stage 1 — Current-Year Levy Tax Bill Explanation Seal.
> Build only: tf_levy_rate, tf_tax_bill_line, tf_tax_bill_current. Use PACS-recorded amounts
> as source of truth. Do not include A assessment bills. Do not reconcile payment transactions.
> Do not open fund / distribution / delinquency / history."

This lane seals the **current-year levy tax bill as PACS records it** — a read model that
explains, per parcel, which levy bills exist, against which tax district, at what rate, with
what amount due / paid / balance. It is **not** a Treasurer system: amounts are taken verbatim
from PACS (`bill` ⋈ `levy_bill`); balance is the recorded arithmetic `due − paid`, not a
recomputation from rate × value.

## Grain & doctrine

- **Universe:** `dbo.bill` where `year = 2025 AND is_active = 1 AND bill_type = 'L'` (current-year,
  active, **levy** bills only). 1:1 with `dbo.levy_bill` on `bill_id` (per Stage 0 discovery).
- **Active-supplement doctrine** carried forward: current bill state is the active row PACS marks
  `is_active = 1` (no blind `sup_num = 0`).
- **Boundary held:** `levy_cd` and `tax_district_id` are carried (they identify *which* bill /
  jurisdiction), but **no** `fund_id`, `distribution_id`, `delinquency_id`, payment-transaction,
  or history columns exist on any Stage-1 entity. Fund/distribution/delinquency/history remain a
  later mission.

## Pipeline

```
dbo.bill ⋈ dbo.levy_bill (2025/L/active)
   → legacy_pacs_raw.tax_bill_line        (Npgsql binary COPY landing)
   → canonical_tf.tf_tax_bill_line        (parcel-resolved COPY projection;
                                            balance = due − paid; rate joined from tf_levy_rate)
   → canonical_tf.tf_tax_bill_current      (set-based INSERT…SELECT per-parcel rollup)

dbo.levy (2025) → canonical_tf.tf_levy_rate (district × levy_cd → rate)
```

Parcel resolution via `sync_bridge.source_xref` (TfEntityType='parcel', prop_id → tf_parcel),
identical to the assessment / exemption / jurisdiction lanes.

## Runtime proof (drain batch `1d22f9fb-5ce6-4c73-b643-005eb743ffbd`, 596.2s)

Drain response: `status=Succeeded`, `rowsLanded=1,104,507`, `rowsCanonicalized=990,665`,
`rowsQuarantinedThisLane=0`, `gateSummary: PASS×4`.

| # | Gate | Result | Verdict |
|---|------|--------|---------|
| G1 | Landed L-bill denominator | `legacy_pacs_raw.tax_bill_line` = **1,104,507** | ✅ matches Stage-0 2025 L-bill count |
| G2 | Levy-rate populated | `tf_levy_rate` = **49** (district × levy_cd) | ✅ |
| G3 | Bill-line projected (parcel-resolved) | `tf_tax_bill_line` = **990,665**; distinct parcels = **79,767** | ✅ |
| G4 | Parcel-resolution honesty | 1,104,507 − 990,665 = **113,842** lines unresolved (bills against prop_ids outside the real-property spine — MH / personal property); explicitly excluded, not lost | ✅ honest gap |
| G5 | Jurisdiction backing | `tf_tax_bill_line` with `TaxDistrictId IS NULL` = **0** | ✅ 100% district-backed |
| G6 | Rate backing | `LevyRate IS NULL` = **0**; rate-backed = **990,665** | ✅ 100% rate-backed |
| G7 | Rollup integrity | `tf_tax_bill_current` = **79,767** rows = distinct parcels; `SUM(BillCount)` = **990,665** = line count | ✅ every line rolled up exactly once |
| G8 | Amount integrity (line ↔ rollup, exact) | due **308,949,578.44** = **308,949,578.44**; paid **3,602.19** = **3,602.19**; balance **308,945,976.25** = **308,945,976.25** | ✅ exact |
| G8b | Balance identity | due − paid = 308,949,578.44 − 3,602.19 = **308,945,976.25** = recorded balance | ✅ |
| G9 | Quarantine | `quarantineDelta = 0` (394,361 → 394,361) | ✅ none |
| BND | Revenue boundary | no `fund_id` / `distribution_id` / `delinquency_id` columns on `tf_tax_bill_line` | ✅ held |

(Low `paid` total is correct: 2025 current-year bills are largely unpaid at drain time; PACS-recorded
amounts taken verbatim, not reconciled against payment transactions — that is a deferred mission.)

## What this seals / does NOT seal

- **Sealed:** current-year (2025) levy tax bill state per parcel, as PACS records it — bill exists,
  against which district, at what rate, due / paid / balance. Read-only explanation model.
- **Not sealed (deferred, explicit):** payment-transaction reconciliation, 'A' assessment bills,
  fund / distribution / delinquency, prior-year / history bills, recomputation of due from rate × value.

## Key facts

- Migration `20260608002824_AddRevenueSpineStage1` (Up = 4 CreateTable: `tax_bill_line`,
  `tf_levy_rate`, `tf_tax_bill_line`, `tf_tax_bill_current`; Down = 4 DropTable — no unrelated drops).
- PACS numeric columns read type-flexibly (`Convert.To*` over `GetValue`) — same guard as the
  exemption lane (decimal-stored numerics).
- Projection + landing use Npgsql binary COPY on a dedicated connection; rollup is a single
  set-based `INSERT…SELECT … gen_random_uuid()`.
