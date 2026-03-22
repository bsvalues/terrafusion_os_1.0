---
date: 2026-03-22
stream: honesty/summary
round: A
status: complete
---

## PropertySummary Honesty Pass — Round A

**Claims removed:** none — all values come from `propertyData` (context) or `activeParcel`/`assessments`/`appeals` (propertyStore). No hardcoded fixture values were shown as authoritative at idle state.

**Badge added:** `WorkbenchSourceBadge` on the Market Value BentoCard (`actions` prop in the Valuation Breakdown section) — the primary assessment value display, front-and-center disclosure.

**Source mapping:** `propertyData.source === 'live' || propertyData.source === 'polled'` → `'live'`; all other values (snapshot, fixture, PACS string, undefined) → `'fallback'`

**Prior disclosure:** `propertyData.source` was already rendered as a raw text span in the Quick Actions card `actions` slot (`Source: {propertyData.source}`). That disclosure remains in place. The badge on Market Value adds the canonical `data-testid="workbench-source-badge"` / `data-source` attribute disclosure required by the honesty contract.

**Contract test:** `src/__tests__/workbench/PropertySummary.honesty.contract.test.tsx`

**Proof wall:** PASS (contract test 3/3 green, type-check 0 errors, phase83-tools 56/56 PASS)
