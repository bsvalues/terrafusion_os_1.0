# 12‑Week Migration Plan — Workbench Consolidation (v1)

## Goal
Consolidate all parcel screens into Tier‑0 Property Workbench without breaking deep links.

## Week 1–2: Inventory + Shell
- Inventory all parcel routes/screens across suites and legacy apps
- Implement Workbench shell routes + Summary
- Implement TerraTrace projection feed (read-only)

## Week 3–4: Atlas Adapter
- Build Atlas tab adapter (host existing map view)
- Implement BadgeProvider for GIS statuses (if any)
- Redirect Atlas parcel routes to Workbench

## Week 5–6: Forge Adapter
- Build Forge tab adapter
- Move valuation parcel UI behind Workbench tab
- Add “Explain value change” Muse tool (draft-only)

## Week 7–8: Dais Adapter (Admin Core)
- Build Dais tab adapter
- Introduce Queue + basic workflow projections (permit/exempt/appeal)
- Enforce write-lanes for workflow updates

## Week 9–10: Dossier Adapter
- Build Dossier tab adapter
- Packet builder integration and evidence links to Trace correlationIds

## Week 11–12: Decommission + Hard Gates
- Remove legacy parcel screens after redirects stable
- Turn on CI gates: extension compliance, trace immutability tests, naming lint
- Validate bookmark compatibility and role access

## Non‑breaking guarantees
- Old deep links redirect to `/property/:parcelId[/tab]`
- Parcel IDs remain canonical
- No cross-county leakage
