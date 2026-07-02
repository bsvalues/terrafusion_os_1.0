# WO-WORKBENCH-002 - Routing / Deep-Link Truth

## Result

`PASS`

Program: `GOAL-PROPERTY-WORKBENCH-CANONICAL-ASSESSOR-EXPERIENCE`

Loop: `LOOP-PROPERTY-WORKBENCH-CANONICAL-ASSESSOR-EXPERIENCE`

Mode: evidence only. No runtime code, route table, CI, schema, data, secret, PACS, SQL, or deployment behavior changed.

## Purpose

This packet records the current Property Workbench routing and deep-link truth from `origin/main`.
It does not repair routes. It separates what is implemented, what is enforced, and what remains
ambiguous for later Workbench classification WOs.

## Authority Read

Before writing this evidence, the Workbench routing lane was checked against:

- `brain/packs/shell/README.md`
- `frontend/apps/os-shell/AGENTS.md`

Relevant rules:

- Parcel-scoped work routes to the Property Workbench, not standalone parcel windows.
- The Property Workbench is an OS shell surface, not a suite-owned surface.
- The canonical Workbench tab order is governed by architecture/canon and must not be changed in this WO.

## Observed Route Tree

Source: `frontend/apps/os-shell/src/Router.tsx`

Implemented Workbench route entries:

| Route | Element | Evidence |
| --- | --- | --- |
| `/property` | `PropertySearch` | Native parcel search entrypoint |
| `/property/:parcelId` | `PropertyWorkbench` with `PropertySummary` index child | Parcel-context Workbench root |
| `/property/:parcelId/forge` | `PropertyForge` | Forge tab deep link |
| `/property/:parcelId/atlas` | `PropertyAtlas` | Atlas tab deep link |
| `/property/:parcelId/dais` | `PropertyDais` | Dais tab deep link |
| `/property/:parcelId/clerk` | `PropertyClerk` | R3 extension tab deep link |
| `/property/:parcelId/treasury` | `PropertyTreasury` | R3 extension tab deep link |
| `/property/:parcelId/audit` | `PropertyAudit` | R3 extension tab deep link |
| `/property/:parcelId/dossier` | `PropertyDossier` | Dossier tab deep link |
| `/property/:parcelId/pilot` | `PropertyPilot` | Pilot tab deep link |

Legacy route behavior:

- `modules/property-workbench` redirects to `/`.
- `modules/property-workbench/*` redirects to `/`.
- `suites/terra-prime/*` redirects to `/property`.
- Standalone suite home routes still exist for `/forge`, `/atlas`, `/dais`, `/dossier`, and `/gpt`.

Operational interpretation:

- `/property/:parcelId[/tab]` is implemented as the canonical parcel-context route family.
- `/property` is the parcel search/intake route.
- `/property/search` is not registered as a search route. With the current route tree, it can be
  interpreted as `parcelId=search` by the dynamic `/property/:parcelId` route.
- Standalone suite homes coexist with Workbench parcel tabs, but parcel-scoped suite work should route through the Workbench.

## Route / Tab Truth Matrix

This matrix records the current route, data-source, API, and honest-empty truth required by the
Property Workbench program definition. It is evidence only; it does not certify production readiness
or repair missing contracts.

| Surface | Route / entrypoint | Observed data source | Observed API dependency | Honest-empty / gap behavior |
| --- | --- | --- | --- | --- |
| Search | `/property` | `PropertySearch` UI surface | Not proven in this WO | Search/intake route exists, but data/API behavior is not proven here. |
| Summary | `/property/:parcelId` | `PropertyWorkbench` index / summary child | Not proven in this WO | Missing or unknown tab slug resolves active tab to `summary`; no URL rewrite proven. |
| Forge | `/property/:parcelId/forge` | `PropertyForge` tab surface | Not proven in this WO | Deep-link route exists; data/API and empty-state behavior require Forge surface truth. |
| Atlas | `/property/:parcelId/atlas` | `PropertyAtlas` tab surface | Not proven in this WO | Deep-link route exists; data/API and empty-state behavior require Atlas surface truth. |
| Dais | `/property/:parcelId/dais` | `PropertyDais` tab surface | Not proven in this WO | Deep-link route exists; data/API and empty-state behavior require Dais surface truth. |
| Dossier | `/property/:parcelId/dossier` | `PropertyDossier` tab surface | Not proven in this WO | Deep-link route exists; data/API and empty-state behavior require Dossier surface truth. |
| Pilot | `/property/:parcelId/pilot` | `PropertyPilot` tab surface | Not proven in this WO | Deep-link route exists; Workbench Pilot integration behavior requires Pilot truth. |
| Clerk | `/property/:parcelId/clerk` | `PropertyClerk` tab surface | Not proven in this WO | R3 extension route exists; constitutional/maturity status is not proven here. |
| Treasury | `/property/:parcelId/treasury` | `PropertyTreasury` tab surface | Not proven in this WO | R3 extension route exists; constitutional/maturity status is not proven here. |
| Audit | `/property/:parcelId/audit` | `PropertyAudit` tab surface | Not proven in this WO | R3 extension route exists; constitutional/maturity status is not proven here. |
| No-parcel suite fallback | `/property/search?openTab=<tabId>` helper output | `suiteRegistry.ts` helper output only | Not routed as a dedicated search route | Drift: helper/test contract exists, but the router does not register `/property/search`. |

## Deep-Link Resolution

Source: `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbench.tsx`

`PropertyWorkbench` derives the active tab from the browser path:

- base path: `/property/${parcelId}`
- missing or empty tab slug resolves to `summary`
- known tab slugs resolve to their tab
- unknown tab slugs resolve to `summary`

Currently accepted path slugs in `getCurrentTabFromPath`:

- `forge`
- `atlas`
- `dais`
- `clerk`
- `treasury`
- `audit`
- `dossier`
- `pilot`

Important nuance:

- Unknown slugs are repaired to `summary` as an active-tab value.
- The current inspected code does not show a URL rewrite from an unknown slug back to `/property/:parcelId`.
- The contract test has a helper that can build a canonical URL, but the route component itself resolves the tab state rather than proving a browser URL replacement.

## Context-Aware Href Generation

Source: `frontend/apps/os-shell/src/config/suiteRegistry.ts`

The registry provides context-aware helper output for Workbench suite links:

- with parcel context: `/property/<parcelId>/<tab>`
- without parcel context: `/property/search?openTab=<tabId>` helper output only

Confirmed helper functions:

- `getWorkbenchHref(...)`
- `getWorkbenchHrefById(...)`
- `getWorkbenchHrefWithContext(...)`
- `getWorkbenchHrefByIdWithContext(...)`
- `getWorkbenchFallbackRoute(...)`
- `getWorkbenchFallbackById(...)`

Observed mappings:

| Registry item | With parcel context | Without parcel context |
| --- | --- | --- |
| Forge | `/property/<parcelId>/forge` | `/property/search?openTab=forge` |
| Atlas | `/property/<parcelId>/atlas` | `/property/search?openTab=atlas` |
| Dais | `/property/<parcelId>/dais` | `/property/search?openTab=dais` |
| Dossier | `/property/<parcelId>/dossier` | `/property/search?openTab=dossier` |
| GPT special case | `/property/<parcelId>/pilot` | `/property/search?openTab=pilot` |

Operational interpretation:

- Suite tiles/actions can generate Workbench links without hardcoding URL strings.
- `gpt` remains a standalone suite, but parcel-context GPT intent maps to the Pilot tab.
- `pilot` as an OS feature does not behave as a normal workbench suite in `getWorkbenchHrefByIdWithContext`.
- The no-parcel `/property/search?openTab=<tabId>` output is not a confirmed routable search URL.
  It is carried as route drift because `Router.tsx` registers `/property` and `/property/:parcelId`,
  not `/property/search`.

## Window Adapter Routing

Source: `frontend/apps/os-shell/src/pages/workbench/PropertyWorkbenchWindow.tsx`

The window adapter is not a browser route. It receives `parcelId` and `tabId` from desktop-window metadata and renders tabs through state.

Observed behavior:

- missing `tabId` defaults to `summary`
- `clerk` and `audit` initial tabs resolve to `dossier`
- `treasury` initial tab resolves to `dais`
- valid tab ids otherwise preserve the requested tab
- pop-out navigates to `/property/<parcelId>`

Operational interpretation:

- Browser deep links and desktop-window Workbench tabs are related but not identical.
- The route path supports `clerk`, `treasury`, and `audit` as distinct child routes.
- The window adapter collapses `clerk`/`audit` to Dossier and `treasury` to Dais for initial state.
- This discrepancy should be carried into WO-WORKBENCH-003 tab/tool maturity classification rather than repaired in this evidence WO.

## Tests and Gates Found

Routing/deep-link tests:

- `frontend/apps/os-shell/src/__tests__/routing/deepLinkCanonicalization.contract.test.ts`
- `frontend/apps/os-shell/src/__tests__/workbench/parcelContext.navigation.contract.test.ts`
- `frontend/apps/os-shell/src/__tests__/routes/suiteRouting.contract.test.tsx`
- `frontend/apps/os-shell/src/__tests__/shell/routeReadinessSweep.contract.test.ts`

Workbench route/spec gate:

- `scripts/spec-gates/workbench-compliance.mjs`

Gate behavior observed from source:

- scans UI route declarations
- rejects direct suite-owned parcel routes such as `/forge/parcel/`
- checks canonical route pattern `/property/:parcelId`
- prints canonical tabs as `summary | forge | atlas | dais | dossier | pilot`

Known enforcement gap:

- The compliance gate's canonical tab list does not include `clerk`, `treasury`, or `audit`.
- The current runtime route tree includes `clerk`, `treasury`, and `audit`.
- The gate still passes because the current scanner only checks `slug:` lines in Workbench context, not React Router child paths.

## Contract Drift to Carry Forward

These are findings only, not fixes:

1. Route tree includes R3 extension tabs (`clerk`, `treasury`, `audit`) beyond the six-tab canonical list printed by the compliance gate.
2. `frontend/apps/os-shell/src/contracts/workbench.ts` defines `WorkbenchTabSlug` through `dossier` and omits `pilot`, while runtime route/tab code uses `pilot`.
3. `suiteRegistry.ts` defines `VALID_WORKBENCH_TAB_IDS` with `summary`, `forge`, `atlas`, `dais`, `clerk`, `treasury`, `audit`, `dossier`, `pilot`, which is broader than the compliance gate's printed canonical list.
4. Browser route mode and window-adapter mode do not fully agree for `clerk`, `treasury`, and `audit`.
5. The deep-link contract proves active-tab fallback for unknown slugs, but not a live URL rewrite.
6. The no-parcel helper output `/property/search?openTab=<tabId>` is not registered as a dedicated
   search route and may be interpreted as `parcelId=search` by `/property/:parcelId`.

## Validation Run

Commands:

```powershell
node scripts/spec-gates/workbench-compliance.mjs
node docs/brain/workorders/tools/wo-query.mjs --json
git diff --check
```

Expected validation meaning:

- Workbench route compliance remains green.
- Work Order registry query remains readable.
- Evidence file has no whitespace errors.

## Proven

- The canonical parcel route family `/property/:parcelId[/tab]` is implemented.
- `/property` is the parcel search/intake route.
- Suite registry helpers produce context-aware Workbench hrefs.
- Unknown active-tab slugs fall back to `summary` at tab-resolution time.
- Workbench routing evidence can be produced without changing runtime code.

## Not Proven

- Browser URL canonicalization from an invalid tab slug back to a clean URL.
- Runtime parity between route-based Workbench and the desktop window adapter for all tabs.
- Whether R3 extension tabs are constitutionally approved, transitional, or drift.
- Whether `WorkbenchTabSlug`, `VALID_WORKBENCH_TAB_IDS`, `WORKBENCH_TABS`, and `workbench-compliance.mjs` should be reconciled.
- Whether `/property/search?openTab=<tabId>` is intended to become a routable fallback URL or should be replaced by `/property?openTab=<tabId>`.

## Next Recommended WO

`WO-WORKBENCH-003 - Tab + Tool Maturity Classification`

Reason:

Routing truth exposes the next highest-value gap: classify each tab as canonical, extension, transitional, or drift before implementing Forge/Atlas/Dais/Dossier/Pilot surface-specific truth packets.

## Stop Type

`ROUTING_DEEP_LINK_TRUTH_READY_FOR_REVIEW`
