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

## Acceptance Criteria (testable milestones)

**Week 1–2**
- All known parcel routes inventoried in a single list (paths + owners).
- `/property/:parcelId` works with Summary tab and does not 404.
- Activity feed renders from TerraTrace projection (even if empty).

**Week 3–4**
- Atlas tab loads existing map UI inside Workbench.
- Legacy GIS parcel routes 301/302 redirect to Workbench Atlas tab.
- BadgeProvider contributions render without blocking page load.

**Week 5–6**
- Forge tab loads valuation UI inside Workbench.
- Legacy valuation parcel routes redirect to Workbench Forge tab.
- Muse tool “Explain value change” produces draft and emits trace events.

**Week 7–8**
- Dais tab loads permit/exempt/appeal projections.
- Any workflow write passes write‑lane validation in CI.
- write_high tools require confirmation + reason code.

**Week 9–10**
- Dossier tab supports packet assembly linked to trace correlationIds.
- Evidence items link back to originating workflow/tool events.

**Week 11–12**
- CI gates enabled as blocking checks.
- No remaining direct navigation to legacy parcel pages (only redirects).
- Role/licensing visibility rules verified for all tabs.
