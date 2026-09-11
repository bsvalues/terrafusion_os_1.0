# WO-TUOP Step Zero — Shell-Lineage Reconciliation (canonical native host)

**Program:** TerraFusion Owner-Usable Product V1 · **Authority:** `OWNER-TUOP-V1-MISSION-AUTHORITY-20260911` (Issue #1589)
**Class:** Read-only source reconciliation; no rebuild, no runtime mutation.
**Base:** `origin/main` @ `43ef0238e` · **Observed:** 2026-09-11
**Trigger:** Owner correction — the TUOP launch/acceptance model was too narrow ("browser-proven" can pass *around* the native host instead of *through* it), and current source carries two unresolved desktop-host lineages (WPF `native-shell/` vs `frontend/electron/`). Nothing may be rebuilt until the canonical host is settled.

## VERDICT (evidence-bounded; corrected 2026-09-11 after owner review)

**Proven — UI/runtime lineage (confidence ~99%):**

> **Canonical UI/runtime assembly target = `frontend/apps/os-shell` → build output
> `native-shell/ui/dist` → served by the TerraFusion API.** `frontend/electron/` is
> **SUPERSEDED / NON-CANONICAL** as a current UI host (it loads `frontend/dist`, a directory
> `platform.json` lists under `deprecated.outputDirs`; against the canonical build it falls through
> to its own “Application files not found” placeholder).

**NOT yet proven — the final native executable host:**

> The WPF `native-shell/Terrafusion.Shell` is a **REAL HOST IMPLEMENTATION and the STRONG
> SURVIVING CANONICAL-HOST CANDIDATE, but release-host authority is NOT yet proven.** No CI
> workflow builds or packages `Terrafusion.Shell.exe` (repo-wide grep: zero workflow references to
> `Terrafusion.Shell`, `net8.0-windows`, `UseWPF`, or any host `.exe` build). The release artifact
> packages only `./publish` + `./native-shell/ui/dist`. The previously-cited “sanctioned launcher”
> `LAUNCH_TERRAFUSION_OS.ps1` is itself **STALE** — it hardcodes `localhost:5000` (5000 is in
> `platform.json` `deprecated.ports`; canonical API default is 5046 via `TF_API_PORT`), targets
> `backend/TerraFusion.API` instead of the contract's `backend/src/TerraFusion.API`, hardcodes
> another user's home path (`C:\Users\bsval\...`), and indiscriminately kills every `dotnet`
> process. It evidences that WPF was *intended* as a launcher at some point; it is not safe
> evidence of current launcher/host authority.

**Component classification (the defensible state of canon):**

| Component | Classification |
| --- | --- |
| `frontend/apps/os-shell` | ACTIVE / CANONICAL UI |
| `native-shell/ui/dist` | CANONICAL UI BUILD/PACKAGE LOCATION |
| `frontend/electron` | SUPERSEDED / NON-CANONICAL current UI host |
| WPF `native-shell/Terrafusion.Shell` | REAL HOST IMPLEMENTATION / STRONG CANONICAL-HOST CANDIDATE — release-host authority needs build/package/release proof |
| `LAUNCH_TERRAFUSION_OS.ps1` | STALE LAUNCHER, not canonical authority (contradicts `platform.json`) |
| Docker images (`ci.yml`: API + frontend + agents + spatial) | The only release machinery that actually builds today; server-shaped, not a desktop product assembly |

**The deeper finding this exposes:** the repository evidence does not show the API release pieces,
the canonical UI bundle, and any native host being produced **together** as one authoritative
installable TerraFusion product. TerraFusion may not currently have one complete release assembly
at all. That — not login — is the first foundational productization defect, and WO-TUOP-004 must
settle host authority through actual build/package/release evidence rather than assume it.

Anti-bullshit rule applied: **do not promote an inference to canon merely because it is probably
correct.** The WPF host is very plausible and probably intended — “probably” is not release proof.

## Evidence (UI/runtime lineage rows are decisive; the launcher row is downgraded to stale-intent)

| # | Source | Finding | Points to |
| --- | --- | --- | --- |
| 1 | `platform.json` (`paths.frontend.buildOutput`) | "Single source of truth… never hardcode" → frontend buildOutput = **`native-shell/ui/dist`** | native-shell |
| 2 | `frontend/vite.config.ts:135` | actual `outDir: ../native-shell/ui/dist` (+ stats.html → native-shell) | native-shell |
| 3 | `backend/src/TerraFusion.API/Program.cs:150,158,2786,2885` | API serves the SPA from **`native-shell/ui/dist`** via `PhysicalFileProvider` + `MapFallback` — the API host IS the product server | native-shell |
| 4 | `.github/workflows/ci.yml:507-518`, `ci-cd-main.yml:263-268`, `frontend-build-guarded.yml:232-252` | release packaging tars/zips `./publish` + **`native-shell/ui/dist`**; **no workflow builds or packages electron** | native-shell |
| 5 | `tests/deployment-truth-gate.test.mjs` §E1 | asserts "frontend build config targets native-shell output" | native-shell |
| 6 | `scripts/deployment/LAUNCH_TERRAFUSION_OS.ps1:36-37` | ~~sanctioned launcher~~ **DOWNGRADED 2026-09-11**: hardcodes deprecated :5000, wrong API path (`backend/TerraFusion.API` vs contract `backend/src/TerraFusion.API`), foreign home path, blanket `dotnet` kill. Evidence of PAST intent only — not current authority. | (intent only) |
| 7 | `.github/workflows/seal-gate-fast.yml:476` | electron appears ONLY in the LEGACY-path classifier exclusion list (tolerated legacy), never as a build target | electron = legacy |
| 8 | `frontend/electron/main.js:139-146` | Electron `loadFile('../dist/index.html')` = **`frontend/dist`**, which `platform.json` `deprecated.outputDirs` lists as **deprecated**. The canonical build no longer emits there → Electron falls through to its own `data:text/html,…Application files not found` placeholder. | electron = dead path |

Net: 5 independent truth sources (platform contract, build config, backend server, release CI, deployment gate) prove the **UI/runtime lineage** through `native-shell/ui/dist`; the launcher was downgraded on owner review. The single artifact naming electron (`package.json#main`) is contradicted by all of them and resolves to a deprecated output dir. **No source proves the WPF executable is the packaged release host — that question stays open for WO-TUOP-004.**

## The settled launch chain (Step Zero output the owner asked for)

1. **WPF vs Electron →** Electron is superseded as a UI host (proven). WPF `native-shell/` is the surviving native-host CANDIDATE; final host authority awaits release-proof in WO-TUOP-004.
2. **Canonical native host → NOT YET RELEASE-PROVEN.** Candidate: `Terrafusion.Shell` (WebView2), a *thin host*: `MainWindow.LoadUI()` reads `service-registry.json` (workspace root) for the backend URL (fallback `http://localhost:5000`) and sets `webView.Source = {backendUrl}/index.html`. The product is the API-served SPA; the shell wraps it.
3. **Exact build/package path →** `frontend` build → `native-shell/ui/dist` (vite outDir); backend `dotnet publish` → `./publish`; release artifact = `publish/` + `native-shell/ui/dist` (+ the `Terrafusion.Shell` host).
4. **Backend startup responsibility →** `LAUNCH_TERRAFUSION_OS.ps1` starts the API (`dotnet run --urls http://localhost:5000`); the shell discovers it via `service-registry.json`, does not spawn it. (Electron, by contrast, *did* spawn `dotnet …TerraFusion.API.dll` — another sign it predates the current orchestration.)
5. **DB startup/binding →** `Program.cs` reads `ConnectionStrings:DefaultConnection`; provider is connection-string-driven: `UseSqlite` when the string is SQLite, else `UseNpgsql`. Lab = SQLite; state/production = Postgres. No provider is hardcoded.
6. **ServiceRegistry →** backend `ServiceRegistry` (singleton) + `ModuleSeedService` (scoped); `EnsureSeededAsync` seeds `service-registry.json` from `platform.json`; `/api/service-registry` is the endpoint the OS-shell ModuleLoader consumes. **This is the same endpoint returning 401 unauthenticated** — confirming at source level that the Matrix-v1 "Sentinel ModuleLoader FAIL / 0 modules" is the auth wall in front of the registry, not an independent bug.
7. **Auth →** `authPolicy.ts`: `shouldForceLoginRedirect()` returns true unless dev-preview (`VITE_USE_MOCK_DATA`/`VITE_DEV_PREVIEW_BYPASS_AUTH`, or vite dev mode without `VITE_ENFORCE_AUTH_IN_DEV`). `AuthGuard` redirects unauthenticated → `/login` only when `shouldForceLoginRedirect()`. The deployed candidate reaching a fully-rendered desktop with no login means the running build is in a bypass/preview posture (or the flag is unset in that build) — the precise defect WO-TUOP-002 must make honest. Canon (surface-contract.json) already forbids this: "Pilot ok:true != product readiness", "route proof != product proof", "No mock/fallback/random data."
8. **County context →** `CountyId` is the authorization boundary on every protected surface; no silent Benton fallback (canon-digest + WAL). Trust modes `PUBLIC / COUNTY_PROVIDED / CONNECTED` (+ reserved `OFFICIAL_TERRAFUSION_ADOPTION`).
9. **Five product layers →** canon `surface-contract.json` + `canon-digest.md`: L1 OS Shell (dock/topbar/chrome) · L2 Home Scene (= GIS/county orientation, **distinct from Counties HUB**) · L3 five Suite Workspaces (Forge/Atlas/Dais/Dossier/GPT, each `/suite` ≠ `/property/:parcelId/suite`) · L4 Tier-0 Property Workbench (Summary→Forge→Atlas→Dais→Dossier→Pilot) · L5 Full Applications (Cost/Comps/Sales/IncomeForge, ParcelLens, LayerWorks, TerraLevy, TerraPILT, TerraPermit, appeals/cert/notices, Dossier evidence, GPT/RAG). Seeing desktop tiles proves **L1 only**.
10. **Pilot / Trace →** TerraPilot = governed action pipeline (claims + county/license tool allowlist + mode + risk + confirmation/supervisor + trace emission), not a chat window. TerraTrace = append-only activity/evidence spine; the Workbench feed is a projection of it. A valuation change with no corresponding trace is **not** complete TerraFusion behavior.
11. **TerraCanon →** in-product support/ops cockpit (one of the four required cold-open views alongside Shell, Counties HUB, SalesForge): exact release, runtime health, suite health, data/Sync/Edge posture, evidence, diagnostics.
12. **Sync/Edge posture →** for a CONNECTED county, Edge/Sync is the governed acquisition boundary (read → validate → normalize → quarantine → reconcile → transfer into TerraFusion-controlled storage); legacy systems are upstream sources, not live read deps. `JCASTERRAFUSION` is the reference Edge target; Harris PACS stays separate/authoritative. **HERMES does not connect protected Benton production** — the launch must carry the same contracts and exercise them with lawful lab data or truthfully show `unavailable`.

## The corrected launch model (release assembly, four planes)

TUOP's observation/acceptance must start at the **release assembly**, not at "OS desktop":

```text
TERRAFUSION RELEASE ASSEMBLY
 0 Native Product Host   canonical exe (Terrafusion.Shell/WPF), installer/package, exact release identity
 1 Runtime Foundation    TerraFusion API · ServiceRegistry/ModuleRegistry · auth+session · RBAC/policy/tool allowlists · canonical CountyId · county/stamp routing
 2 Data Foundation       TerraFusion DB (product runtime truth) · county-scoped persistence · provenance/trust state · Sync ingestion · quarantine/reconciliation · Edge/source state
 3 Product L1 OS Shell   desktop/dock/topbar/windows
 4 Product L2            Home Scene (GIS/county orientation) + Counties HUB / county control surface
 5 Product L3            TerraForge · TerraAtlas · TerraDais · TerraDossier · TerraGPT (suite ≠ workbench tab)
 6 Product L4            Property Workbench: Summary · Forge · Atlas · Dais · Dossier · Pilot
 7 Product L5            actual applications/modules/tools
 8 Action/Evidence Spine TerraPilot (governed actions) · TerraTrace (append-only spine)
 9 Support/Operations    TerraCanon (release/health/suite/data/Sync/Edge/evidence/diagnostics)
10 Recovery/Release      reload · restart · upgrade · rollback · exact-revision verification
```

Outside the product runtime, required for a CONNECTED production county: `County network → TerraFusion Edge/Sync → TerraFusion-controlled county DB → TerraFusion API/stamp → product`.

## Terminal-contract correction (the "one word")

TUOP previously said the product is **"browser-proven."** Over-applied — it lets acceptance pass *around* the native host. Corrected rule:

> **Product-surface proven through the assembled TerraFusion product — the canonical release assembly (API + `native-shell/ui/dist` UI bundle + the native host once release-proven in WO-TUOP-004; WPF `Terrafusion.Shell` is the surviving candidate) — using browser/WebView inspection as evidence where appropriate.** The browser/WebView remains the verifier; it is not itself the product entry point unless the canonical architecture says so.

A green `localhost:8088` docker SPA in a bare Edge window is **verifier evidence**, not "TerraFusion launched." "TerraFusion launched" = host + API + DB + ServiceRegistry + auth + county context + the five layers + Pilot/Trace + TerraCanon assembled as one reproducible release assembly with exact identity — an assembly the repository does not currently prove exists.

## Derived actions (registered, not started inline — owner: "no rebuilding until answered")

- **WO-TUOP-003 — Shell-lineage canon drift fix (governance/R3, ready):** correct stale root `package.json#main` (`frontend/electron/main.js`) so the one contradicting artifact stops misdirecting future agents, and record the electron supersession where agents read it. Bounded; rebuilds neither host.
- **WO-TUOP-004 — Canonical Release Assembly (derived, blocked on 003):** produce API publish + `native-shell/ui/dist` + native host as ONE reproducible release assembly with exact, product-provable release identity; **settle the native-host authority question inside this WO through actual build/package/release evidence** (WPF `Terrafusion.Shell` is the surviving candidate — prove or replace it; do not assume it). This discharges the Matrix-v1 "release identity FAIL" and is the prerequisite for proving any layer *through the assembled product* rather than around it.
- **WO-TUOP-005 — Launcher reconciliation (derived, ready):** retire or repair `LAUNCH_TERRAFUSION_OS.ps1` (and any sibling launchers) so it consumes `platform.json` / the environment contract, targets `backend/src/TerraFusion.API`, never hardcodes deprecated ports (`5000`), never hardcodes user home paths, and never indiscriminately kills every `dotnet` process. Not cosmetic: the script currently contradicts the platform's own declared single source of truth.

## Status of each Step-Zero node

SETTLED from source: UI/runtime lineage (os-shell → native-shell/ui/dist → API; electron superseded), build/package path, backend startup, DB binding, ServiceRegistry, auth gate logic, five-layer canon, Pilot/Trace/Canon roles, Sync/Edge contract.
OPEN for WO-TUOP-004 release-proof: whether the WPF executable is the packaged release host (no CI builds/packages it today). NEEDS the next live observation pass (through the assembled product, not a bare browser): the actual assembled release identity, live ServiceRegistry population post-auth, county-context behavior, and per-layer L2–L5 reality. Recorded unobserved, never assumed.

`RESULT: EVIDENCE_ONLY` · `LOOP_MODE: discovery` · `STOP_TYPE: NONE` — Step Zero answered; loop continues into the assembly/auth children. No owner wall reached.
