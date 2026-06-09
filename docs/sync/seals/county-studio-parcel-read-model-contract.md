# County Studio Parcel Read-Model Contract

_Date: 2026-06-08 · For a FUTURE County Studio / Property Workbench parcel-detail surface. This is a
read contract over the sealed Benton canonical substrate — not a build requirement for the current
seal. Read-only; the UI consumes, it does not mutate._

## Resolution entry point

A parcel page resolves by **prop_id → live parcel** through `sync_bridge.source_xref`
(`TfEntityType='parcel' AND IsActive`) → `canonical_tf.tf_parcel` (the live 83,326-parcel spine;
`ParcelNumber` = APN). All canonical surfaces below are keyed by `TfParcelId` on that live spine
(post-F1 re-key, 0 orphans).

> Always resolve through the **active** parcel xref. Do NOT join `tf_parcel` blindly — it carries
> ~3.1M historical/debris rows (F2); only the active-xref subset is the live identity.

## Surfaces (per parcel)

| Card | Table | Key | Notes |
|---|---|---|---|
| Identity | `canonical_tf.tf_parcel` | `TfParcelId` | `ParcelNumber` = APN; `SitusAddress`, `LegalDescription` |
| Geometry | `gis_tf.tf_parcel_geom` | `TfParcelId` | `GeomWkt`, centroid; ~970 parcels have no geometry (NULL-APN residual) |
| Owner | `canonical_tf.tf_owner` + `canonical_tf.tf_parcel_owner_link` | link `TfParcelId` → `TfOwnerId` | active supplement; `IsPrimary`, `PctOwnership` |
| Assessment value | `canonical_tf.tf_assessment` | `TfParcelId` | 2025 active-supp; assessed/appraised/market + land/imprv components |
| Land | `canonical_tf.tf_land` | `TfParcelId` | segments; some parcels legitimately have none |
| Improvement | `canonical_tf.tf_improvement` (+ `tf_improvement_feature`) | `TfParcelId` | some parcels legitimately have none |
| Exemption | `canonical_tf.tf_exemption` (+ `dict_exemption_type`) | `TfParcelId` | type/subtype/pct; present only where applicable |
| Jurisdiction | `canonical_tf.tf_parcel_tax_area` → `tf_tax_area_district` → `tf_tax_district` | `TfParcelId` → TCA → districts | parcel → tax area → districts |
| Levy tax bills | `canonical_tf.tf_tax_bill_line` (+ `tf_levy_rate`) | `TfParcelId` | per district/levy/rate; current-year active 'L' |
| Levy rollup | `canonical_tf.tf_tax_bill_current` | `TfParcelId` | due / paid / balance totals |
| Special assessments | `canonical_tf.tf_assessment_bill_line` (+ `tf_assessment_agency`) | `TfParcelId` | per agency; current-year active 'A' |
| Special-assmt rollup | `canonical_tf.tf_assessment_bill_current` | `TfParcelId` | due / paid / balance totals |

## Display rules

- A surface with **0 rows is valid** — render "none" / hide the card, do not error. (E.g. parcels
  with no land segment, no improvement, no geometry, or no exemption.)
- `paid` / `balance` are **PACS-recorded bill-grain net** (attested = `SUM(coll_transaction.base_amount_pd)`).
  Label as such — NOT receipt-level or cash-ledger-reconciled.

## Must NOT surface (honesty boundary)

receipt-level payment history · tender detail · void/refund workflow · penalty-interest paid breakdown ·
delinquency status/certification · fund/distribution accounting · prior-year completeness · any
"Treasurer-certified" language. These are deferred Treasurer-grade stages, not in the sealed substrate.

## Status

This contract describes what a future UI *may* read. It imposes **no build obligation** on the current
seal. The substrate is complete and joined on the live spine as of `e77cf9458`.
