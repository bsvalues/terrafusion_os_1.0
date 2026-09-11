# WO-TUOP-002 — Desktop auth-state honesty + working in-app sign-in

| Field | Value |
| --- | --- |
| Status | `BLOCKED_ON_WO-TUOP-004` (owner directive 2026-09-11: repair auth INSIDE the canonical assembled product, not ahead of it) |
| Program | TerraFusion Owner-Usable Product V1 |
| Goal | `GOAL-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` |
| Loop | `LOOP-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` |
| Owner authority source | Issue #1589 via `OWNER-TUOP-V1-MISSION-AUTHORITY-20260911`; derived from WO-TUOP-001 Product Reality Matrix v1 |
| Repository | `bsvalues/terrafusion_os_1.0` |
| Risk | R4 — frontend shell auth-state behavior + sign-in path; no schema migration, no protected data |
| Terminal condition | `DESKTOP_HONESTLY_GATES_AUTH_AND_AUTHENTICATED_SESSION_REACHES_REAL_SURFACES` |

## Sequencing (owner directive 2026-09-11)

This child must NOT race ahead of `WO-TUOP-004`. Until the canonical release assembly and the
Runtime Dependency Closure Matrix exist, an auth repair could land in a runtime configuration that
is not the shippable product — wrong-target work. Order: 003 + 005 (drift removal) → 004 (assembly
+ closure + host release-proof) → **then** this child, executed against the assembled product.

## Defect being repaired (observed, not theorized)

The launched candidate reaches a fully-rendered OS desktop with no working authenticated session and
presents it as usable: every suite tile is a normal-looking button, there is no sign-in prompt or
auth banner, while every authenticated data call 401s (`/api/service-registry`, `/api/modules`,
suite endpoints) and Sentinel reports `degraded / ModuleLoader FAIL / 0 modules`. Sentinel's failure
is a symptom of the missing session, not an independent bug (verified: module loader consumes
`/api/service-registry`, which is 401 unauthenticated).

Provisioning truth: the bootstrap operator row and 3 active passkey credentials EXIST in the
candidate DB. The wall is the unproven/unhonest in-browser sign-in path plus the desktop's silent
"everything looks available" presentation — not credential absence.

## Required outcome

1. **Honest auth state.** An unauthenticated desktop must not present authenticated-only surfaces as
   silently working: gate the desktop behind sign-in, or render explicit honest sign-in affordances on
   gated surfaces and a truthful Sentinel/system status. No normal-looking affordance may lead to a
   dead 401 (terminal criterion: UX honesty).
2. **Working in-app sign-in.** Prove or repair the deployed sign-in path (password and/or passkey with
   the provisioned bootstrap operator) so a real browser session obtains a token and
   `/api/service-registry` + suite data endpoints resolve. Include the SPA→API route wire if the
   deployed frontend's login route mismatch is present (`/auth/*` vs `/api/auth/*`).
3. **Sentinel truthful after sign-in.** With an authenticated session, ModuleLoader resolves modules;
   Sentinel status reflects reality (no permanent `degraded/0 modules` while the backend is healthy).
4. **Browser-observed acceptance** (OMEN/agent on the launched candidate, exact deployed revision
   recorded): launch → sign in → Sentinel leaves ModuleLoader FAIL → at least one suite surface loads
   real data → reload preserves the session (persistence stage of the matrix).

## Reservations

- **Repository:** `bsvalues/terrafusion_os_1.0` only. No suite repositories in this child.
- **Paths (indicative, to be pinned exactly in the child PR):** `frontend/apps/os-shell/src/auth/**`,
  `frontend/apps/os-shell/src/components/app-frame/**`, `frontend/apps/os-shell/src/Router.tsx`,
  Sentinel/desktop shell components, the SPA login page + its API wire, and the deployment nginx/proxy
  config used by the lab candidate. Backend auth controller changes only if the browser path proves a
  server-side defect, scoped to the sign-in route.
- **Environment:** HERMES lab self-host candidate (docker), rebuilt from EXACT current main at child
  start — this child also discharges the WO-TUOP-001 release-identity action by observing the redeployed tip.
- **Forbidden:** schema migrations; touching `GovernmentUsers`/`PasskeyCredentials` data; credential
  values in evidence/PRs/logs; Benton production; external county systems; county data; production
  promotion (WAL path); suite redesign; weakening Sentinel to hide the failure.

## Validation

- Unauthenticated launch: no surface presents as working while 401-bound (screenshot + AX evidence).
- Sign-in via the real browser path succeeds with the provisioned operator (evidence shows token
  obtained, never the credential).
- `/api/service-registry` returns 200 with modules for the authenticated session.
- Sentinel console shows ModuleLoader OK and a truthful system status.
- One suite surface loads real data; F5/reload preserves the session.
- Required checks green; independent review; zero unresolved substantive threads; exact-head merge.

## Stop conditions

Genuine owner authority wall only: credentials/secrets beyond the already-provisioned bootstrap
operator (SW-03), schema/migration need (SW-02), Benton production or public promotion (SW-01/04),
conflicting canon after reconciliation (SW-05). A failing gate inside scope is repair work, not a wall.

## Continuation

On protected merge + browser acceptance, refresh the Product Reality Matrix (v2) against the exact
redeployed candidate and continue automatically into the next-highest-severity non-PASS row. Do not
return to the owner between children.
