# WO-TUOP-001 — Product Reality Matrix v1 (first live observation)

**Program:** TerraFusion Owner-Usable Product V1
**Goal:** `GOAL-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` · **Loop:** `LOOP-TERRAFUSION-OWNER-USABLE-PRODUCT-V1`
**Authority:** `OWNER-TUOP-V1-MISSION-AUTHORITY-20260911` (Issue #1589)
**Observed:** 2026-09-11 (Pacific), by the HERMES lane, from the screen + deployed-bundle + API evidence.
**Method:** `VISIBLE → OPENS → REAL DATA → OPERATES → WRITES/PERSISTS → RELOADS → HANDS OFF → PASS`.
Verdicts: `PASS / PARTIAL / SHELL_ONLY / WRONG_SURFACE / HONEST_UNAVAILABLE / MISSING / FAIL`.
An unobserved stage is recorded **unobserved**, never assumed. An empty shell never counts as working.

## Candidate identity (release identity must be browser-provable)

| Surface | Identity | Note |
| --- | --- | --- |
| Backend | docker `waco-terrafusion-backend:passkey`, `/health` `gitSha=b2c5073-passkey3`, env `Production` | **4 commits behind** current protected main `88a4629ea` |
| Frontend | docker `waco-terrafusion-frontend:9a158bcc…` (`9a158bcc` = #1560) | **4 commits behind** main; NOT on main tip |
| Launch surface | `http://localhost:8088/` (HERMES lab self-host) | observed in real Microsoft Edge on the owner's screen |

> **Release-identity defect (carried into the first repair child):** the lab is exercising a STALE
> candidate. WO-TUOP-001 verdicts describe the running build; before any terminal
> `TERRAFUSION_OWNER_USABLE_PRODUCT_V1: PASS` the loop must redeploy the EXACT current main and
> re-observe. This matrix is honest about observing a 4-behind candidate, not the tip.

## Per-capability matrix (v1)

| # | Capability | Observed verdict | Evidence (what was actually seen) |
| --- | --- | --- | --- |
| 1 | **OS desktop / windowing / navigation** | `PARTIAL` | Desktop renders: top bar ("TerraFusion OS / Government Operations Environment", Benton County chip), 10 app tiles (Forge/Atlas/Dais/Dossier/GPT/Workbench/Pilot/Trace/Canon/CountiesHUB), bottom dock, Sentinel chip, clock. AX tree confirms tiles are real buttons ("Open TerraForge"… "Open Counties HUB"). Navigation/windowing not yet exercised to PASS. |
| 2 | **Counties HUB** | `HONEST_UNAVAILABLE` (route) + tile now EXISTS | Desktop tile "Open Counties HUB" + dock entry present (corrects the stale "no tile / Ctrl+K only" note). `/counties` route serves 200. Deployed `CountiesHub-*.js` chunk (23.9 KB) is the honest guardrail: "All 39 counties remain selectable with explicit unavailable state", "Governed status claims are suppressed while the feed is unavailable", per-county `unavailableMessage`. This is **WO-WAL-005 scope (real 39-county HUB)**, not a TUOP defect — routed to WAL per the coordination rule. |
| 3 | **Sentinel / system health surface** | `FAIL` | Sentinel console (AX text): SYSTEM STATUS `degraded`, `ModuleLoader FAIL`, Active modules `0`, Total Detected `0`, Components `1 FAIL · 3 OK · 4 TOTAL`. Root-caused (below), not a cosmetic bug. |
| 4 | **Property Workbench** | `unobserved` (auth-gated) | Tile visible; not exercised — all data calls require an authenticated session that the unauthenticated desktop does not have. |
| 5 | **TerraForge (Cost/Comps/Sales/Income)** | `unobserved` (auth-gated) | Tile + dock visible; not exercised behind the auth wall. |
| 6 | **TerraAtlas** | `unobserved` (auth-gated) | Tile + dock visible; not exercised. |
| 7 | **TerraDais** | `unobserved` (auth-gated) | Tile + dock visible; not exercised. |
| 8 | **TerraDossier** | `unobserved` (auth-gated) | Tile + dock visible; not exercised. |
| 9 | **TerraGPT** | `unobserved` (auth-gated) | Tile + dock visible; not exercised. |
| 10 | **TerraPilot / Muse** | `SHELL_ONLY` (suspected) | Muse window opens with greeting "Hello. I'm Muse — your AI assessor…", header "MUSE / No context". Local self-host historically serves a static LLM fallback; not yet confirmed as live model vs stub on THIS candidate. Recorded SHELL_ONLY pending an authenticated interaction test, not PASS. |
| 11 | **TerraCanon** | `unobserved` | Tile visible; not exercised. |
| 12 | **Persistence (reload/restart/re-entry)** | `unobserved` | Requires an authenticated session first. |
| 13 | **Cross-suite handoff** | `unobserved` | Requires authenticated sessions in ≥2 suites. |
| 14 | **UX honesty** | `FAIL` | **Primary defect.** The desktop presents as fully usable — every tile is a normal-looking button, no login prompt, no auth banner — while the session is unauthenticated, so every authenticated data surface silently 401s and Sentinel reports `degraded / ModuleLoader FAIL`. A normal-looking product leads to non-functional surfaces. Violates terminal criterion "no normal-looking buttons lead to nonexistent products." |
| 15 | **Release identity** | `FAIL` | Browser/health show a candidate 4 commits behind main; the loop cannot yet prove the exact current deployed candidate to the owner. |

## Root-cause classification (authority resolution → contradiction scan → canon reconciliation)

The Sentinel `ModuleLoader FAIL / 0 modules` is **not** an independent defect. Evidence:

- `GET /api/service-registry` (the AppFrame module loader source, `frontend/apps/os-shell/src/components/app-frame/AppFrame.tsx:65`) returns **401** unauthenticated.
- `GET /api/modules`, `/api/sentinel`, `/api/health/detailed`, and every suite data endpoint return **401**.
- The frontend container DOES proxy `/api/` to the backend (verified in nginx config; the old "stubbed 502" note is superseded for this stack).

So the single root defect is: **the launched candidate reaches a fully-rendered desktop with no working authenticated session, and presents it as usable.** Everything downstream (Sentinel degraded, 0 modules, every suite unobserved) is a symptom of the same auth/onboarding wall.

Auth-provisioning truth on this candidate (read-only DB probe, secrets never displayed):
- `GovernmentUsers`: 1 row (bootstrap operator `bsvalues@gmail.com`, roles Assessor+Administrator).
- `PasskeyCredentials`: **3 rows**, all bound to that operator, `IsActive=1`, created 2026-09-10.
- Backend env carries `TF_AUTH_BOOTSTRAP_*` (6 vars present).

Contradiction with the stale "no key exists / login wall unfixable" note: **a key now exists** (bootstrap operator + 3 active passkeys). The remaining wall is not credential absence — it is that (a) the desktop does not gate on or surface authentication state, and (b) the in-browser sign-in path to convert the unauthenticated desktop into a working authenticated session is not proven on this candidate.

Canon reconciliation: `current-release.json` was already corrected under WO-TUOP-000. No further canon conflict blocks this child.

## Derived repair child (the first bounded TUOP repair)

**`WO-TUOP-002` — Make the launched desktop honestly reflect authentication state and provide a working in-app sign-in so the authenticated surfaces become reachable.**

Scope (exact, bounded, inside `OWNER-TUOP-V1-MISSION-AUTHORITY-20260911`, repo `terrafusion_os_1.0`):
1. The OS desktop must not present authenticated-only surfaces as silently working when unauthenticated. Either gate the desktop behind sign-in, or render an explicit, honest "sign in to continue" state on the gated surfaces and a truthful Sentinel status — no normal-looking affordance leading to a dead 401.
2. Prove (or repair) the in-app sign-in path on the deployed candidate using the already-provisioned bootstrap operator + passkey, so `/api/service-registry` and the suite data endpoints resolve for a real session.
3. Acceptance is browser-observed: launch → sign in → Sentinel leaves `ModuleLoader FAIL` → at least one suite surface loads real data → state survives reload.

Walls preserved: no Benton production access, no external county-system write, no protected county data, no credential values in evidence, no production promotion (WAL path), no suite redesign.

Deferred to later children (recorded, not dropped): redeploy exact current main and re-observe (release identity); Muse live-model proof; Workbench/Forge/Atlas/Dais/Dossier/GPT/Canon/Persistence/Cross-suite full-chain walks once an authenticated session exists.

## Disposition summary

- **1 genuine TUOP defect → 1 derived bounded child (WO-TUOP-002)**: auth-state honesty + working sign-in.
- **1 WAL-owned seam routed, not duplicated**: Counties HUB real 39-county data → WO-WAL-005.
- **1 release-identity action queued**: redeploy exact main before terminal PASS.
- **No owner authority wall reached** — the loop continues automatically into WO-TUOP-002.

`RESULT: EVIDENCE_ONLY` · `GOAL: GOAL-TERRAFUSION-OWNER-USABLE-PRODUCT-V1` · `LOOP_MODE: discovery` · `ACTIVE_WO: WO-TUOP-001` · `NEXT_WO: WO-TUOP-002` · `BLOCKERS: NONE (auth credential exists; sign-in path to prove)` · `STOP_TYPE: NONE`
