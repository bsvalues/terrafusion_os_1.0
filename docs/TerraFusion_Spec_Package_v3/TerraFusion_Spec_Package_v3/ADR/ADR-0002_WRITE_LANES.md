# ADR-0002 — Suite Boundaries and Write Lanes

Date: 2026-01-28
Status: Accepted

## Decision
Each parcel domain fact/artifact has exactly one write owner (write lane). Read-only projections are allowed.

## Rationale
Eliminates drift from duplicate writes and makes ownership decisions deterministic.

## Consequences
Cross-lane writes must call the owning suite service (often via TerraPilot tool) and emit TerraTrace.
