# WO-P8-MGMT-001 — Management Dashboard Discovery & Scope Packet

**Work Order:** WO-P8-MGMT-001
**Program:** P8 — Management Dashboard (roadmap phase after P7 County Ops)
**Date:** 2026-07-01
**Mode:** Read-only / planning. No code changes, no new runtime surfaces, no data mutation.
**Status:** DISCOVERY COMPLETE — scope defined, recommendation below
**Authority Boundary:** SW-01/SW-02/SW-03 NOT crossed. This is a scope packet only.

---

## 0. Headline Finding (read this first)

**Both candidate dashboards already exist in code — and are honesty-instrumented.** The real P8
gap is NOT building a dashboard. It is **reachability**: no frontend is deployed to the Benton
demo, so none of these existing honest surfaces is visible to a demo visitor.

Two distinct surfaces, two audiences — **both already built**:

| # | Surface | Audience | Status in code | Route | Fed by |
|---|---------|----------|----------------|-------|--------|
| A | **Assessor Management Dashboard** | County leadership / chief appraiser | **EXISTS, COMPLETE** (Phase 8/19, Dais) | `/dais` (window) | Dais/queue/pilot endpoints (auth-gated) |
| B | **Sync Doctrine Console** (operator/deployment status) | Operator (assessor-as-operator) | **EXISTS** ("DASHBOARD-1: Status board") | `/workbench/sync-doctrine` | `GET /api/sync/doctrine/state` (anonymous, real) |
| B2 | **Sync Readiness Console** (operator control) | Operator | **EXISTS** ("OPS-1-B") | `/workbench/sync-readiness` | sync readiness endpoints |

**Correction to an earlier assumption in this discovery:** I initially believed the operator/
deployment view did not exist. It does — `SyncDoctrineConsole.tsx` already renders the exact
`/api/sync/doctrine/state` canonical counts + operational verdict across canonical/truth/raw/
quarantine layers. Do NOT build a new one.

**The deployment reality (probed 2026-07-01):** `app-terrafusion-benton-demo.azurewebsites.net`
serves **API + DB only**. Root `/` returns an empty body; SPA routes (`/workbench/sync-doctrine`,
`/index.html`) return **401**. No os-shell frontend is deployed. So the existing honest consoles
(A and B) are unreachable on the demo even though the API endpoints that feed B are live and
anonymous. **The gap is a frontend deployment, not a dashboard build.**

---

## 1. Who The Dashboard Is For

Per `project_roadmap_7_11` memory, Phase 8 = "Give leadership a county-wide control surface."
The existing Assessor Management Dashboard already targets that audience:

- `chief_appraiser`, `assessor_leadership`, `residential_analyst`, `commercial_analyst`,
  `gis_analyst`, `field_appraiser`, `appeals_specialist` (role selector in the component)
- Tabs: Overview, Certification, Appeals, Workload
- A "Governed Staff Queue" morning-brief panel routing staff to the correct lane

That audience is **served by Dashboard A**.

**Dashboard B's audience is different:** the person standing up / demoing / operating the Benton
deployment (currently the solo assessor-operator). They need to answer "is the system up, is the
right data loaded, is it honest about what's degraded" — not "what's my certification backlog."

**Recommendation:** Do not merge these audiences into one surface. Keep the assessor operational
dashboard (A) separate from the operator/deployment view (B).

---

## 2. What Demo / Runtime Signals It Must Show

For the **operator/deployment view (already built as `SyncDoctrineConsole`)**, the honest,
demo-relevant signals — all available anonymously on the live demo today and **already rendered by
the existing console**:

| Signal | Source (live, verified) | Real value on demo (2026-07-01) |
|--------|-------------------------|----------------------------------|
| Service liveness | `GET /health`, `/health/live`, `/health/ready` | 200, `status: Healthy`, `environment: BentonCounty` |
| Canonical parcels | `GET /api/sync/doctrine/state` → `canonical.tf_parcel` | **84,418** (= 84,388 active + 30 known dupes, WO-DUPE-001) |
| Canonical sales | `.canonical.tf_sale` | **90,386** |
| Canonical owners | `.canonical.tf_owner` | 97,062 |
| Counties bound | `.summary.countiesBound` | 1 |
| Operational verdict | `.operational` | `true` |
| Provenance depth | `.raw` / `.truth` / `.canonical` / `.quarantine` layers | raw 8.5M owner rows → truth → canonical → quarantine 2.05M |
| System health (honest) | `GET /api/system/health` | `status: Degraded`, `ModuleLoader: false` (modules dir absent on Azure) |
| PACS contract proof | `GET /ops/pacs/proof`, `/ops/pacs/ping` | 200 |

These are the "runtime truth" signals. They map directly to the demo narrative: *the data is real,
the provenance is traceable, and the system is honest about what is degraded.*

---

## 3. Which Endpoints Already Exist

Full backend inventory produced during discovery (40+ dashboard-relevant endpoints). Grouped by
**what is actually reachable anonymously on the deployed Benton demo** (probed 2026-07-01):

### 3a. Anonymous + reachable on live demo (200) — SAFE for Dashboard B

| Endpoint | Returns |
|----------|---------|
| `/health`, `/health/ready`, `/health/live` | Basic liveness + env + gitSha |
| `/api/system/health` | Module load status + component health (honest Degraded) |
| `/api/sync/doctrine/state` | **Real canonical/truth/raw/quarantine row counts + operational verdict** |
| `/api/sync/doctrine/lanes` | Per-lane row counts (parcel/sale/owner/wsdor/improvement/land/geometry) |
| `/ops/pacs/proof`, `/ops/pacs/ping` | PACS contract compliance + connectivity |
| `/api/systemorchestration/health` | System-level health rollup |

### 3b. Auth-gated on live demo (401) — need JWT before use

`/healthz/proof`, `/healthz/ready`, `/api/health/detailed`, `/api/health/metrics`,
`/api/monitoring/*` (report, alerts, metrics, performance, status), `/api/counties`,
`/api/systemorchestration/info` (this one holds the hardcoded stubs — correctly behind auth).

### 3c. Broken on live demo (500)

`/api/levy/dashboard/metrics` — LevyDbContext likely not provisioned against the demo DB. **Do not
wire** until fixed (separate WO).

---

## 4. Which Data Is Real vs Unavailable vs Simulated

This is the honesty backbone. Categorized from code inspection + live probing:

### REAL (authoritative, safe to display)
- `/api/sync/doctrine/*` — actual DB row counts from `canonical_tf` and provenance schemas
- `/health*`, `/api/system/health` — real process + component state
- `/ops/pacs/*` — real PACS contract checks

### UNAVAILABLE (honest gaps — display as "Unavailable", never fabricate)
- All `/api/monitoring/*` and `/healthz/proof` on the demo (401 — no auth wired)
- Dais assessor data (certification/appeals/workload) — endpoints not deployed/authenticated on demo
- `/api/levy/dashboard/*` — 500 on demo

### SIMULATED / STUB — **MUST NOT be displayed as real** (see §5)
- `/api/aiswarm/*` — all return **501 NotImplemented** by design
- `/api/swarm/status` — falls back to **hardcoded 1,008 agents** on orchestrator timeout
- `/api/elitedashboard/realtime` — metrics generated with `Random.Shared.Next()`
- `/api/elitedashboard/*`, `/api/performance/elite/*` — "50,000 agents / 39 counties",
  "quantum coherence", "anomaly detection" = marketing/simulated
- `/api/systemorchestration/info` — hardcoded "1,008 AI Agents" and "89,247 Benton parcels"
  (CARD-10 stub; note 89,247 is also the STALE parcel count — real canonical is 84,418)

---

## 5. What Must NOT Be Displayed Yet

Hard exclusion list for any P8 dashboard work. These violate the honesty doctrine
(`feedback_proof_standard`, UI-honesty contract):

1. **Any agent count** — "1,008", "50,000", "1,000,000", "995,000/1,000,000 healthy". There is no
   running production swarm (per `CLAUDE.md` / `AI_CANON_MAP_V1.md`). All are stub/simulated.
2. **"89,247 parcels"** — stale/hardcoded. Real canonical count is **84,418** (84,388 active).
3. **Any `/api/elitedashboard/realtime` metric** — randomized, not real.
4. **"Quantum", "consciousness", "divine", "championship 99.x% accuracy"** telemetry — marketing.
5. **"39 counties" / "50,000 agents" multi-county federation** — aspirational; `countiesBound = 1`.
6. **RAG / AI-powered insights panels** — no active RAG anywhere (RAGPanel is empty per canon).
7. **Levy dashboard tiles** — 500 on demo until LevyDbContext is provisioned.

---

## 6. What Evidence Proves The Dashboard Is Honest

The existing Assessor Management Dashboard (A) already sets the honesty bar — reuse its pattern:

- **`WorkbenchSourceBadge`** with explicit `live` / `partial` / `unavailable` / source disclosure
  on every section (`ManagementDashboard.tsx`).
- **"Unavailable" rendering** instead of zeros or fabricated values when a source fails
  (`formatInteger`/`formatPercent` return `"Unavailable"` on null).
- **Honesty contract test** (`ManagementDashboard.honesty.contract.test.tsx`) that asserts:
  badges show `unavailable` when backend is down; no "DEMO DATA" banner; **no "AI-powered" fluff
  language**; explicit unavailable messages.
- **Read-lane enforcement** (`daisManagementDashboard.ts`) — dashboard cannot write into
  Forge/Atlas/Dossier; supervisory actions limited to drill-through/reassign/escalate with trace.

**Proof standard for Dashboard B:** every displayed number must trace to a `/api/sync/doctrine/*`
or `/health*` field via a source badge. A contract test must assert that no stub endpoint
(`/api/aiswarm/*`, `/api/elitedashboard/*`, `/api/systemorchestration/info`) is referenced, and
that the parcel figure equals the live `canonical.tf_parcel` value, never a hardcoded constant.

---

## 7. Where It Belongs: Benton Demo vs Operator Console vs Broader Roadmap

The dashboards already exist. The decision is about **reachability and deployment**, not construction.

| Option | Verdict |
|--------|---------|
| **Benton demo** | The demo needs the existing `SyncDoctrineConsole` to be **reachable**. Today it is not (no frontend deployed; SPA routes 401). The console already consumes the live anonymous `/api/sync/doctrine/state`, so making it reachable is a **deployment** task, not a build task. Highest demo value, moderate risk (frontend deploy = SW-01). |
| **Operator console** | `SyncDoctrineConsole` (status) + `SyncReadinessConsole` (control) already ARE the operator console, in the os-shell `/workbench/*` lane. No new console needed — deploy what exists. |
| **Broader TerraFusion roadmap** | Assessor Management Dashboard (A) occupies roadmap P8 and is COMPLETE. Broader work = deploying the authenticated os-shell frontend + Dais backend for multi-county use — a **separate, larger WO** gated on auth + Dais deployment. Not this demo lane. |

**Recommendation (corrected):**
- **Build nothing new.** Both the assessor Management Dashboard AND the operator SyncDoctrineConsole
  already exist and are honesty-instrumented.
- **The next WO is a frontend deployment/reachability WO, not a dashboard build.** Options for the
  operator to choose from in §8.
- **Do NOT rebuild** any dashboard surface — that would duplicate existing honest work and risk
  regressing the guardrail pattern.

---

## 8. Proposed Next WO Options (for operator decision — not authorized by this packet)

The gap is reachability. Two candidate paths, operator picks:

**Option 1 — WO-P8-MGMT-002A: Deploy os-shell frontend to the Benton demo (SW-01)**
- Build `frontend/apps/os-shell` and serve it from the Azure App Service (or a companion static
  host) so `/workbench/sync-doctrine` (and the assessor Management Dashboard) become reachable.
- Existing `SyncDoctrineConsole` immediately lights up against the live anonymous
  `/api/sync/doctrine/state` — no new UI code.
- Requires: frontend build + deploy config; decide auth posture (doctrine console works anonymous;
  Management Dashboard needs JWT).
- Risk: SW-01 (a new deployment). Moderate. Verify honesty contract tests pass pre-deploy.

**Option 2 — WO-P8-MGMT-002B: Local-served frontend pointed at the Azure API (no new deploy)**
- Run os-shell locally (`pnpm dev`) with API base pointed at
  `app-terrafusion-benton-demo.azurewebsites.net`; use `SyncDoctrineConsole` for the demo from a
  local browser.
- Zero deployment risk (no SW-01). Lower "productionness" but proves the console against real
  Azure data immediately.
- Good first step to validate reachability before committing to a full frontend deploy.

**Not recommended:** building any new dashboard component. Both surfaces exist and are honest.

---

## 9. Stop Walls Respected

| Wall | Status |
|------|--------|
| SW-01 (deployment/provisioning) | NOT crossed — no deploy, no new runtime surface |
| SW-02 (data mutation) | NOT crossed — read-only probing only |
| SW-03 (secrets) | NOT crossed — no secrets read or written |

---

## 10. Evidence Log

- Existing assessor surface: `frontend/apps/os-shell/src/pages/dais/ManagementDashboard.tsx`,
  `.../services/suites/daisManagementDashboard.ts`,
  `.../__tests__/dais/ManagementDashboard.honesty.contract.test.tsx`
- Existing operator surfaces: `frontend/apps/os-shell/src/pages/workbench/sync-doctrine/SyncDoctrineConsole.tsx`
  (renders `GET /api/sync/doctrine/state`, canonical/truth/raw/quarantine, operational verdict),
  `.../workbench/sync-readiness/SyncReadinessConsole.tsx` (operator control)
- Existing UI honesty guardrails: `AISwarmDashboard`, `AIAgentMonitoringDashboard`, `EliteAIDashboard`,
  `TerraFusionEliteRealtimeDashboard` — all intentionally block unevidenced agent counts/metrics
- Roadmap placement: `project_roadmap_7_11` memory (P8 = leadership control surface, marked COMPLETE)
- Backend endpoint inventory: 40+ endpoints catalogued (health, monitoring, orchestration, elite,
  levy, doctrine, swarm) with real-vs-stub classification
- Live demo probe (2026-07-01) against `app-terrafusion-benton-demo.azurewebsites.net`:
  anonymous-200 set (§3a) and auth-401 set (§3b) recorded; root `/` empty, SPA routes 401
  (no frontend deployed)
- Live real data captured: `/api/sync/doctrine/state` (84,418 parcels / 90,386 sales / operational
  true), `/api/system/health` (Degraded, ModuleLoader false)
- Canon constraints: `CLAUDE.md`, `AI_CANON_MAP_V1.md` (no running swarm, no active RAG,
  1,008/50,000 counts are aspirational/stub)

---

**WO-P8-MGMT-001: DISCOVERY COMPLETE.** Corrected finding: both the assessor Management Dashboard
and the operator Sync Doctrine Console already exist and are honesty-instrumented; the P8 gap is
**frontend reachability on the demo**, not a dashboard build. Awaiting operator decision between
Option 1 (deploy frontend, SW-01) and Option 2 (local-served frontend, no deploy) in §8.
