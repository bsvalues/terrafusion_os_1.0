# TerraFusion Owner-Usable Product V1

**Goal:** `GOAL-TERRAFUSION-OWNER-USABLE-PRODUCT-V1`

**Loop:** `LOOP-TERRAFUSION-OWNER-USABLE-PRODUCT-V1`

**Owner directive:** GitHub Issue #1589 (recorded owner directive, 2026-09-11)

**Authority:** `OWNER-TUOP-V1-MISSION-AUTHORITY-20260911` in `.governance/owner-decisions.json`

**Deadline:** none fixed; WAL V1 retains the 2026-09-28 production deadline. TUOP-V1 feeds WAL: only a TUOP-accepted candidate should be carried through WAL's production gates.

**Status:** ACTIVE on protected merge of the activation PR. `WO-TUOP-000` (mission activation) completes on protected merge; `WO-TUOP-001` (first live Product Reality Matrix) is then dependency-cleared and is the first execution.

## Mission

Turn the existing TerraFusion body of work into a coherent, usable product. HERMES continuously inspects, repairs, integrates, deploys and browser-verifies TerraFusion OS, Counties HUB, Property Workbench, TerraForge, TerraAtlas, TerraDais, TerraDossier, TerraGPT and TerraCanon until the intended assessor workflows work in the launched application. Tests, PRs, routes, source ownership, contracts and backend functionality are supporting evidence only — never the terminal condition.

This is a mission-level program. A child WO, a merged PR, a green test suite, or a backend proof is not the task boundary. The lead operator continues through the dependency graph until the terminal condition is observed or a genuine authority wall is reached.

## Why this program exists (the recorded defect it closes)

1. No prior mission-level authority had the terminal condition "TerraFusion OS and the suites are an owner-usable product." WAL V1 carries the 39-county launch path; the Five-Suite program completed canonical ownership/contracts/adapters/parity at the pure-unwired layer — a "suite complete" state that was never product completeness. Months of micro-completions happened because narrow WOs escalated broader work and no parent product loop existed to catch the escalation. This program is that loop.
2. The owner is the authority wall, not the dispatcher (`GOAL_LOOP_AUTONOMY_RULES.md`). TUOP-V1 is structured so HERMES owns plan/dispatch/recovery and the owner makes actual owner decisions only.

## The loop (HERMES owns it)

```text
Launch exact candidate
        ↓
Exercise actual product (browser, from the screen)
        ↓
Find first real product defect
        ↓
Cortex classify (authority resolution → contradiction scan → canon reconciliation)
        ↓
Derive exact bounded child WO
        ↓
Implement / build / test (isolated worktree, exact reservations)
        ↓
Independent review / remediate
        ↓
Protected merge
        ↓
Deploy exact candidate (lab-internal pre-production)
        ↓
Browser acceptance (OMEN / agent-driven)
        ↓
PASS? — NO → next exact repair child (KEEP GOING)
      — YES per surface → record capability, continue journey
```

Forbidden loop exits: "PR complete, come ask William what's next." "Tests pass, mission complete." "Backend done, UI later." Owner prompt relay between children.

## Product Reality Matrix (the measurement standard)

The first execution is **not** a rebuild and **not** a source review. HERMES launches the current exact candidate and observes it **from the screen**, producing the live Product Reality Matrix. For every major capability:

`VISIBLE → OPENS → REAL DATA → OPERATES → WRITES/PERSISTS → RELOADS → HANDS OFF → PASS`

Verdict discipline (expanded from the TerraForge canonical-inventory acceptance code to the whole product):

| Verdict | Meaning |
| --- | --- |
| `PASS` | Full chain observed on the launched candidate |
| `PARTIAL` | Real but incomplete chain; name the exact broken stage |
| `SHELL_ONLY` | Surface renders but performs nothing real |
| `WRONG_SURFACE` | Capability exists on a different surface than the product journey requires |
| `HONEST_UNAVAILABLE` | Surface truthfully declares unavailability (acceptable interim state, not a defect) |
| `MISSING` | Not present |
| `FAIL` | Present and broken, or a normal-looking affordance leads nowhere |

An empty-looking shell never counts as working capability. The matrix is continuously refreshed; it is the program's Observe step.

## Terminal acceptance (single receipt)

**`TERRAFUSION_OWNER_USABLE_PRODUCT_V1: PASS`** — required from an actual launched candidate, **product-surface proven through the assembled TerraFusion product** (the canonical release assembly: API + `native-shell/ui/dist` UI bundle + the native host once release-proven in WO-TUOP-004; WPF `Terrafusion.Shell` is the surviving candidate), at an exact deployed revision, using browser/WebView inspection as evidence. The browser/WebView is the verifier; it is not itself the product entry point. A green `localhost` docker SPA in a bare browser window is verifier evidence, not “TerraFusion launched.”:

- **OS:** desktop/windowing/navigation/context is coherent and usable.
- **Counties HUB:** Benton and statewide county context behaves truthfully.
- **Workbench:** search parcel → open parcel → state/context survives.
- **Forge:** useful Cost/Comps/Sales/Income workflow works.
- **Atlas:** actual useful spatial workflow — not cards advertising nonexistent GIS tools.
- **Dais:** real assessor workflow can be performed and persisted.
- **Dossier:** evidence/document handoff and retrieval works.
- **GPT:** useful grounded assessor interaction in the correct county/property context.
- **TerraCanon:** support can identify running release, runtime health, suite health, Edge/Sync/data condition and produce useful diagnostics.
- **Persistence:** reload/restart/re-entry works.
- **Cross-suite:** context and workflow handoffs work.
- **UX:** no normal-looking button leads to a nonexistent product; queued capability is disabled/hidden, never broken-looking.
- **Release identity:** the canonical shell proves the exact deployed release assembly (host + API publish + `native-shell/ui/dist`) — not a bare browser tab. Step Zero (shell lineage) is settled in `docs/brain/evidence/WO-TUOP-000-STEP-ZERO-SHELL-LINEAGE-RECONCILIATION.md`: `native-shell/` (WPF/WebView2) is canonical; `frontend/electron/` is superseded.

Only after this PASS should WAL V1 carry the accepted candidate through its real production gates (WO-WAL-007 exact-candidate acceptance → WO-WAL-008 production/external assessor acceptance).

## Work Order graph

| WO | Outcome | Dependency |
| --- | --- | --- |
| `WO-TUOP-000` | Canonicalize Issue #1589 mission authority, register this program, reconcile `docs/brain/canon/current-release.json` to the active owner decision set | owner directive |
| `WO-TUOP-001` | Launch the current exact candidate in the lab and produce the first live Product Reality Matrix from the screen; classify every non-PASS verdict; derive the exact bounded repair children for defects inside this authority | 000 protected merge |
| `WO-TUOP-002` | Desktop auth-state honesty + working in-app sign-in — executed INSIDE the assembled product | 001 evidence merge + **004** (owner sequencing directive) |
| `WO-TUOP-003` | Shell-lineage canon drift fix: stale root `package.json#main` → electron; record supersession | ready now |
| `WO-TUOP-004` | Canonical release assembly + native-host release-proof + **Runtime Dependency Closure Matrix** (zero-UNKNOWN gate) | 003 + 005 (both protected-main complete) |
| `WO-TUOP-005` | Launcher reconciliation: `LAUNCH_TERRAFUSION_OS.ps1` must consume `platform.json`/env contract (no deprecated :5000, correct API path, no foreign home paths, no blanket dotnet kill) | ready now |
| further derived children | One exact bounded product-usability repair child per classified defect, created under `OWNER-TUOP-V1-MISSION-AUTHORITY-20260911` child policy — never floating, always registered | matrix verdicts |
| `WO-TUOP-099` | Terminal acceptance: full-journey product-surface proof through the assembled product on the exact deployed release; record `TERRAFUSION_OWNER_USABLE_PRODUCT_V1: PASS`; hand the accepted candidate identity to WAL V1 | all repair children |

Child WOs are derived from observed defects (the matrix), not invented from source archaeology. The morning deep-dive feeds the same loop: for each finding, dispatch an existing bounded recovery child or derive the exact child inside this authority; stop only at a genuine owner authority wall.

## Step Zero verdict — shell lineage (evidence-bounded, corrected after owner review 2026-09-11)

**Proven (~99%):** the canonical UI/runtime assembly target is `frontend/apps/os-shell` → build output
`native-shell/ui/dist` → served by the TerraFusion API (`platform.json`, `frontend/vite.config.ts`,
`backend/src/TerraFusion.API/Program.cs`, release CI packaging, deployment-truth-gate E1).
`frontend/electron/` is **superseded/non-canonical** (loads deprecated `frontend/dist`).

**Not yet proven:** that the WPF `Terrafusion.Shell` executable is the canonical *packaged release host*.
No CI workflow builds or packages it; the release artifact contains only `./publish` +
`native-shell/ui/dist`; and the once-cited launcher `LAUNCH_TERRAFUSION_OS.ps1` is stale (hardcodes
deprecated :5000, wrong API path, foreign home path, blanket `dotnet` kill) — evidence of past intent,
not current authority. WPF is the surviving canonical-host **candidate**; `WO-TUOP-004` must settle it
through actual build/package/release evidence rather than assume it, and `WO-TUOP-005` reconciles the
launcher to the platform contract. Do not promote an inference to canon merely because it is probably
correct. Full chain: `docs/brain/evidence/WO-TUOP-000-STEP-ZERO-SHELL-LINEAGE-RECONCILIATION.md`.

**Foundational finding:** the repository does not currently prove that API + UI bundle + native host are
produced together as one authoritative installable product. TerraFusion may have **no complete release
assembly at all** — the first foundational productization defect, ahead of login.

## The four-plane launch model (release assembly — observation must START here)

The Product Reality Matrix must begin at the release assembly, not at “OS desktop.” Seeing desktop tiles proves only
Layer 1. The complete launch is:

```text
TERRAFUSION RELEASE ASSEMBLY
 0 Native Product Host   canonical exe (Terrafusion.Shell/WPF+WebView2), installer/package, exact release identity
 1 Runtime Foundation    TerraFusion API · ServiceRegistry/ModuleRegistry · auth+session · RBAC/policy/tool allowlists · canonical CountyId · county/stamp routing
 2 Data Foundation       TerraFusion DB (product runtime truth) · county-scoped persistence · provenance/trust state · Sync ingestion · quarantine/reconciliation · Edge/source state
 3 Product L1 OS Shell   desktop / dock / topbar / windows
 4 Product L2            Home Scene (GIS/county orientation) + Counties HUB / county control surface
 5 Product L3            TerraForge · TerraAtlas · TerraDais · TerraDossier · TerraGPT (suite ≠ workbench tab)
 6 Product L4            Property Workbench: Summary · Forge · Atlas · Dais · Dossier · Pilot
 7 Product L5            actual applications/modules/tools (Cost/Comps/Sales/IncomeForge, ParcelLens, LayerWorks, TerraLevy, TerraPILT, TerraPermit, appeals/cert/notices, Dossier evidence, GPT/RAG)
 8 Action/Evidence Spine TerraPilot (governed action pipeline) · TerraTrace (append-only activity/evidence spine)
 9 Support/Operations    TerraCanon (release/runtime/suite/data/Sync/Edge/evidence/diagnostics)
10 Recovery/Release      reload · restart · upgrade · rollback · exact-revision verification
```

Outside the product runtime, required for a CONNECTED production county: `County network → TerraFusion Edge/Sync →
TerraFusion-controlled county DB → TerraFusion API/stamp → product`. HERMES does not connect protected Benton
production; the launch carries the same contracts and exercises them with lawful lab data or truthfully shows `unavailable`.

## "Launch TerraFusion" = staged dependency closure (owner definition, 2026-09-11)

```text
CANONICAL RELEASE ASSEMBLY (exact identity · native host · OS UI bundle)
  → RUNTIME DEPENDENCY CLOSURE (API · configuration · migrations/schema · DB · auth/session/RBAC ·
      county+tenant context · service/module registry · required hosted services · realtime plumbing ·
      persistent storage · Pilot · Trace)
  → DATA PLANE (TF DB truth · provenance/trust · Sync · quarantine/reconciliation · Edge posture)
  → PRODUCT LAYERS (L1 OS Shell · L2 Home Scene · Counties HUB · L3 five suites · L4 Workbench · L5 applications)
  → CROSS-CUTTING PRODUCT (TerraPilot · TerraTrace · TerraCanon · enabled AI runtime)
  → OPERABILITY (restart · persistence · monitoring/logging · backup/restore · upgrade · rollback)
```

Only after closure may the native product launch and user journeys begin. **WO-TUOP-004 must produce
the Runtime Dependency Closure Matrix** — every runtime dependency classified exactly once
(`REQUIRED_CORE / REQUIRED_WHEN_ENABLED / EXTERNAL_BOUNDARY / OPTIONAL / SUPERSEDED /
QUARANTINED-HISTORICAL / UNKNOWN`); the assembly cannot pass while any UNKNOWN remains. Classify from
active-consumer evidence, never from platform-contract mentions alone (worked example: Redis is
"Optional - graceful degradation" in Program.cs with NoOp fallback and only TerraFusion.AI consumers
→ OPTIONAL/UNKNOWN pending necessity evidence, despite platform.json declaring its port).

## The release boundary = seven closure domains (owner definition, rev 4 2026-09-11)

The Runtime Dependency Closure Matrix (WO-TUOP-004) is structured as seven domains, each decomposed
into individual rows — **no aggregate PASS** (a "five suites" rollup is how the estate once claimed
"TerraForge = PASS because /forge opened" while CostForge/CompsForge/SalesForge did nothing):

```text
1. RELEASE ASSEMBLY      host · API · UI bundle · release identity · package/install
2. RUNTIME FOUNDATION    config · ServiceRegistry · ModuleRegistry · DB · migrations ·
                         hosted services (each of the 11 individually) · realtime/hubs (each consumed hub)
3. SECURITY + IDENTITY   auth/session · JWT signing+issuer/audience · passkeys/WebAuthn · secrets/keys ·
                         TLS/certs · CORS · rate-limit · session policy · RBAC · county identity ·
                         county-isolation policy · SignalR token path ·
                         ENTITLEMENT/CAPABILITY ACTIVATION: role claims · county policy ·
                         license/entitlement · feature/profile flags · tool allowlists ·
                         module availability state
4. DATA FOUNDATION       TerraFusion DB · county catalog · provenance/trust · Sync ·
                         quarantine/reconciliation · Edge posture · durable artifact/document stores
5. TERRAFUSION PRODUCT   L1 OS Shell · L2 Home Scene · Counties HUB · L3 five suite homes (each) ·
                         L4 Workbench (Summary + each suite contribution + Pilot) ·
                         L5 each application actually claimed in V1 (CostForge · CompsForge ·
                         SalesForge · IncomeForge · ParcelLens · LayerWorks · TerraLevy · …)
6. CROSS-CUTTING OS      TerraPilot · TerraTrace · TerraCanon · enabled AI/GPT/RAG runtime
7. OPERABILITY           health · logs · monitoring · restart · persistence · backup/restore ·
                         upgrade · rollback
```

**Launch-boundary pass bar:** *No aggregate PASS. No UNKNOWN. No superseded component running.
Every REQUIRED_CORE component live-proven inside the exact assembled revision.* At that point the
**TerraFusion launch boundary is complete** — the definition of what TerraFusion is when you launch
it is coherent. That is NOT product-complete: product completion follows when the five layers and
applications are actually operated (the journeys after 004/002).

**Entitlement discipline:** the closure must distinguish not-implemented vs disabled-by-policy vs
license-unavailable vs wrong-role vs broken vs intentionally-unavailable (Pilot's contract carries
`enabledBy: { license, policyFlag }`). Without it, the loop could discover a policy-disabled module
and rebuild it — the exact failure mode this mission exists to end.

**Mention ≠ dependency (inviolate):** platform.json port mentions, estate-wide code searches, and
historical documents never establish runtime necessity (worked examples: BlobServiceClient =
QUARANTINE BS_PACS material; AddQuartz = old Harris PACS document; Redis = optional/graceful-degradation
with AI-only consumers). Classify from active-consumer evidence.

**Known configuration drift for the 005 lane (source-verified):** `SecurityConfig.cs`
`CorsSettings.AllowedOrigins` defaults to deprecated ports 3000/5000 (canonical API default 5046).
Reconcile from real deployment evidence — never by guessing.

## Work ordering (owner directive, 2026-09-11)

**003 + 005** (remove known launch-lineage drift: stale `package.json#main`; launcher contradicting
platform.json) → **004** (settle native host via release-proof; build the authoritative release
assembly; runtime dependency closure) → **then 002** (test and repair auth INSIDE the assembled
product) → then drive Layer 1 through Layer 5 journeys against the assembly. Login repair must not
race ahead of the release assembly.

## Hard walls (mandatory, unchanged)

External county-system write-back; Benton production access (Benton remains outside the personal lab; HERMES must not become Benton production); protected county data/credentials/secrets without exact recorded authorization; cross-county disclosure; silent Benton fallback; unsupported capability claims; fabricated evidence; required-control/branch-protection/review/exact-head/reservation bypass; suite redesign beyond product-usability repair; work outside Issue #1589. Lab-internal candidate deployment for browser acceptance is authorized; public production promotion remains the WAL V1 gated path (SW-01/SW-04).

## Authority-resolution rule (the Brain-safety clause)

Any agent executing under this program must first run: **authority resolution → contradiction scan → canon reconciliation → execution.** Owner decisions outrank Brain canon. A Wiki or canon artifact generated from stale truth is not authority. The activation under `WO-TUOP-000` reconciles `current-release.json` (which still recorded the pre-WAL Phase 0 gate and deferred statewide interoperability) to the active owner decision set.

## Relationship to WAL V1

WAL V1 (`OWNER-WAL-V1-MISSION-AUTHORITY-20260827`, deadline 2026-09-28) remains ACTIVE and owns the production launch path. Coordination rule: TUOP-V1 children touching Counties HUB, county data trust modes, Sync, or the WAL launch path must not duplicate or contradict an open WAL child; where both programs claim the same seam, the WAL child owns the merge and TUOP-V1 consumes its result. TUOP-V1 owns the product-usability recovery seams WAL does not cover, including usability repair (not redesign) in the four suite repositories.

## Continuation

On protected merge of the activation, continue automatically into `WO-TUOP-001` and then the repair-child wave. Do not return to the owner merely because activation or an individual child PR completed. Reaching a real wall is success; emit the standard RESULT block and wait.
