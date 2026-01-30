# ADR-0001 — Property Workbench is Tier‑0 OS Surface

Date: 2026-01-28
Status: Accepted

## Decision
Property Workbench is a Tier‑0 TerraFusion OS surface, not suite-owned.

## Rationale
Parcel is the primary entity across workflows; duplicating parcel screens causes drift and confusion.

## Consequences
Suites integrate via Workbench extension contract; legacy parcel routes redirect to canonical /property/:parcelId[/tab].
