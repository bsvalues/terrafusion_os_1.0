# Sync-Lane Handoff — `TfParcel.Neighborhood`

**Owner:** Sync / CanonicalTf projection lane · **Requested by:** WS-1 Forge slice · 2026-06-12
**Status:** OPEN — Forge side is built and green in shadow; this is the only remaining input gap.

## Why
The Forge `ParcelValuationAssembler` (in-lane, shadow, green: tests A1–A6) needs a parcel-level
neighborhood for the land approach. Today it takes neighborhood as an **injected parameter**; once
canonical carries it, the integration caller passes `parcel.Neighborhood` directly. Neighborhood
must live on the **parcel** (`TfParcel`), not `TfLand` — it is a parcel attribute.

## The change (narrow, additive)
1. **Entity:** add `public string? Neighborhood { get; set; }` to
   `TerraFusion.Core/Entities/CanonicalTf/TfParcel.cs` (nullable; back-compat for pre-slice rows).
2. **Projector:** populate it in the C-series parcel projector from the source neighborhood,
   resolved through `source_xref` lineage like every other canonical field. Legacy source is
   `Property.Neighborhood` (PACS `neighborhood`/`hood_cd` — **confirm exact source column +
   semantics** before projecting; do not assume).
3. **Migration:** additive nullable column (reversible); no backfill required (nullable).
4. **No behavior change** beyond populating the column; no value/authority impact.

## Confirm before building
- Exact PACS/source field for neighborhood and its code semantics (string code vs. id).
- Whether neighborhood is stable per parcel or per reval cycle (affects projection timing).

## Guardrails (unchanged)
- County isolation preserved (neighborhood is within the parcel's county).
- No parity-gate opening, no `Forge:Engine` authoritative swap — this is input plumbing only.
- RP-5 (supplement round-trip via SourceXref) remains the WS-1 / migration gate; this column
  follows the same lineage discipline.

## Done when
`TfParcel.Neighborhood` added + projected + migrated; the Forge integration caller reads
`parcel.Neighborhood` (replacing the injected parameter) with no assembler change required.
