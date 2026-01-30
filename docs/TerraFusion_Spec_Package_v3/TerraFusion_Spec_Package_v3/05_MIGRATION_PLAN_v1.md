# Migration Plan — Consolidate Parcel Screens into Property Workbench (v1)

## Goals
- One OS-level parcel surface (Property Workbench)
- No broken deep links
- Migrate suite-by-suite (no big bang)

## Phase 0 — Inventory
- Find every existing parcel screen/route in Forge/Atlas/Dais/Dossier + legacy apps
- Produce route map (old → new)

## Phase 1 — Workbench shell
- Add canonical routes:
  - /property/:parcelId + /forge|/atlas|/dais|/dossier|/pilot
- Summary tab + Context Ribbon + Trace feed projection

## Phase 2 — Suite tab adapters
For each suite (one at a time):
- Host existing UI in a Workbench tab adapter
- Swap in extension contract for badges/actions
- Enforce write-lane matrix

## Phase 3 — Redirects
- Old suite parcel routes → redirect to canonical Workbench route
- Preserve query params

## Phase 4 — Decommission
- Remove old parcel pages only after validation checklist passes + contract tests green
