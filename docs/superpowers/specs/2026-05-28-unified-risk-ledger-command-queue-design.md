# Unified Risk Ledger Command Queue Design

## Purpose

Make County Studio's Unified Risk Ledger the first operational command queue for Benton valuation review. The ledger must sit above the supporting boards, show every risk object across valuation surfaces, and let an appraiser filter/sort without falling back to city-first thinking.

## Scope

This slice promotes the existing ledger into the primary county command queue. It covers revaluation cycles, neighborhoods, model groups, value tiers, and taxing district exposure. It does not add simulation, forecasting, recalibration labs, or new downstream workflow generation.

## Behavior

- County landing shows the Unified Risk Ledger before the individual risk boards.
- Ledger rows use the severity bands `Critical`, `High`, `Medium`, and `Low`.
- Users can filter the ledger by severity band and return to `All`.
- Users can sort by priority, risk score, parcel exposure, or object type.
- Ledger actions open neighborhood evidence using the strongest evidence segment where possible.
- City remains metadata only and is not a grouping, filter, breadcrumb parent, or primary command dimension.

## Testing

Focused tests should prove:

- ledger severity bands are `Critical/High/Medium/Low`
- city metadata does not create ledger objects
- taxing district exposure groups by district, not city
- the County Studio landing renders the ledger as the first command queue
- severity filtering and sorting operate on the same cross-surface ledger
- neighborhood evidence drill preserves reval/cycle context and has no City crumb

