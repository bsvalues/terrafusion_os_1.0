# WO-AUDIT-COUNTY-FILTER-001 — Audit Trail County Isolation + Filter Correctness

**Date:** 2026-07-03
**Authorization:** SW-09 (code). Closes the CodeRabbit **Critical** (county isolation) + two **Major** findings
(category-after-cap, unbounded trail) raised on the audit PRs, plus the writer county-attribution gap.
**Risk executed:** SW-09 — backend code + tests. No deploy (SW-01), no migration, no data mutation.

## Findings addressed
1. **🔴 Critical — county isolation not enforced on rows.** `/api/audit/trail` and `/search` resolved a county but
   then queried `AuditEvents` **without constraining to it** — any authenticated caller could read another county's
   audit rows once capture is populated. (Mitigated in the single-county demo; a real leak in multi-county.)
2. **🟠 Major — category filter applied after `Take(500)`.** `search` mapped→filtered by `category` **in memory after**
   the 500-row SQL cap, so `?category=appeal` could return empty/partial even when matching rows existed beyond the cap.
3. **🟠 Major — unbounded trail.** `trail` returned every event for a parcel with no limit.
4. **Writer county-attribution gap.** `AuditEventWriter` wrote `CountyId` only when the context claim parsed as a GUID;
   a `countyCode`/name claim (the accessor falls back to it) was stored as **null**, so those rows could never surface
   in the now-county-isolated trail.

## Change
**`AuditController` (trail + search):**
- Both queries now filter `AuditEvents` by the resolved county: `Where(e => e.CountyId == countyId.Value)` — true
  row-level isolation, not just an access gate.
- `search` applies the **category filter in SQL before paging** via `ApplyCategoryFilter`, a translatable `Entity`
  predicate that **mirrors `AuditTrailMapper.MapCategory` exactly** (case-insensitive substring, same precedence
  appeal > permit > exemption > document > field > assessment > system; unknown category ⇒ no rows).
- Both endpoints are **paged**: new optional `page`/`pageSize` query params (`Paginate` clamps: default 200, max 500,
  page ≥ 1). Backward-compatible — the frontend sends neither and gets the first bounded page.

**`AuditEventWriter`:** `ResolveCountyIdAsync(countyIdOrCode)` — GUID passes through; otherwise resolves the county by
`Name`/`FipsCode` (incl. zero-padded FIPS) via `_db.Counties`, so emitted rows always carry a resolvable `CountyId`.

## Verification
- API `/warnaserror` build: **0 warnings / 0 errors**.
- `Category=Audit|Stage2`: **102/102** pass, incl. new:
  - `Trail_ExcludesEventsFromAnotherCounty` / `Search_ExcludesEventsFromAnotherCounty` — a different-county event is
    not returned.
  - `Search_CategoryFilter_AppliedBeforePaging` — with `pageSize=2` and the only matching (oldest) event outside the
    newest-2 window, it is still returned (proves category filters before the page cap).
  - `Writer_ResolvesCountyCodeClaimToCountyGuid` — a `countyCode` claim ("Benton") resolves to the seeded county GUID.
  - Existing trail/search/mapping tests updated to seed `CountyId` (they now assert under isolation).
- **Not deployed.** Live county-isolation verification against the demo is an SW-01 deploy (this WO is code-only). The
  existing single-county e2e (`AU25B-E2E-TEST`, CountyId=Benton) remains satisfied by construction — its event carries
  the Benton GUID and the caller resolves to Benton.

## Scope honored / deferred
- ✅ county filter · ✅ category-before-Take · ✅ paging · ✅ writer countyCode resolution · ✅ tests + gates · no deploy/migration/mutation.
- **Deferred (noted, out of this WO):** consolidating `CollaborationService.CreateAuditEventAsync` to write through
  `IAuditEventWriter` (single emission path) — a separate refactor touching another service; it already writes
  `AuditEvents` directly and is not an ETL/isolation regression.
