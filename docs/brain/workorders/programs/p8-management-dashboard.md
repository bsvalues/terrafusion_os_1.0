# P8 — Management Dashboard (Roadmap Phase 8)

**Program:** P8-MGMT (roadmap Phase 8; distinct from the register's P8 = Azure/County Runtime)
**Status:** ACTIVE
**Owner:** Operator (bsvalues@gmail.com)
**Last Updated:** 2026-07-01

> **Naming note:** the slug `p8` refers to **roadmap Phase 8 = Management Dashboard** (see
> `project_roadmap_7_11`). It is a different axis from the Program Playbook Register's numeric slots.
> WO IDs in this program are `WO-P8-MGMT-*`.

---

## Goal

Make the **existing** management / operator dashboard surfaces reachable and honest on the Benton
demo. **Do not build a new dashboard** — the surfaces already exist and are honesty-instrumented.
Every WO produces an evidence artifact; deployment itself is gated behind SW-01.

---

## Prime Constraint

The dashboards already exist:

| Surface | Route | Audience |
|---------|-------|----------|
| Assessor Management Dashboard | `/dais` (module `management-dashboard`) | County leadership |
| Sync Doctrine Console | `/workbench/sync-doctrine` | Operator (deployment/pipeline status) |
| Sync Readiness Console | `/workbench/sync-readiness` | Operator (probe control) |

The gap is **reachability + client conformance + deployment**, not construction.

---

## Sovereignty Boundary

| Allowed | Blocked |
|---------|---------|
| Read-only discovery of endpoints/components | Building a new dashboard |
| Local os-shell run against Azure API (Vite proxy) | Azure frontend deployment (SW-01) |
| Scoped client conformance fixes with tests | Data mutation (SW-02) |
| Evidence docs, screenshots | Secrets exposure (SW-03) |
| PR/merge to main | Production launch / go-live (SW-04) |
| Honest `unavailable`/`partial` disclosure | Fake counts, stale 89,247, randomized metrics |

---

## Work Orders (Ordered)

| WO | Title | Status | Evidence |
|----|-------|--------|---------|
| WO-P8-MGMT-001 | Discovery & Scope Packet | **DONE** | PR #1122, `docs/data/WO_P8_MGMT_001_MANAGEMENT_DASHBOARD_SCOPE_PACKET.md` |
| WO-P8-MGMT-002 | Local os-shell vs Azure API reachability proof | **DONE** | PR #1123, `docs/data/WO_P8_MGMT_002_REACHABILITY_PROOF.md` |
| WO-P8-MGMT-003 | Sync Doctrine API client conformance fix | **DONE** | PR #1125, `docs/data/WO_P8_MGMT_003_SYNC_DOCTRINE_CONFORMANCE.md` |
| WO-P8-MGMT-004 | Frontend Deployment Authorization Packet | **NEXT** (R1 docs) | — |
| *frontend deployment execution* | — | **WALL: SW-01** | requires operator authorization |

---

## WO-P8-MGMT-004 Definition (NEXT — docs only, does NOT deploy)

**Goal:** Produce the authorization packet an operator reviews before the frontend is deployed to
the Azure demo. Planning only — crosses no wall.

**Scope (allowed):**
- Document the single-config that now works post-003 (`VITE_API_URL = <azure-origin>`, or same-origin
  served by the API with no `VITE_API_URL`)
- Enumerate build + host options (App Service static serve vs API same-origin serve), tradeoffs
- List required settings/secrets by NAME only (no values) — CORS origins, any auth posture
- Health/readiness expectations for the served SPA
- Honesty gate checklist (no stub endpoints, source badges, `unavailable` disclosure)
- Explicit SW-01 boundary statement + the exact authorization the operator must give

**Do NOT:** deploy, provision, push images, change DNS, expose secrets, or widen public reach.

**Output:** `docs/data/WO_P8_MGMT_004_FRONTEND_DEPLOYMENT_AUTHORIZATION_PACKET.md`.

---

## Stop Walls For This Program

| Wall | Where it triggers |
|------|-------------------|
| SW-01 | Any actual frontend deploy / cloud resource / making the SPA publicly reachable |
| SW-04 | Promoting the demo to county-facing production |
| SW-10 | Changing the SPA's auth posture (e.g. removing dev bypass for a real login flow) |

---

## Loop Usage

```
/goal p8-management-dashboard
/loop program        # runs 004 packet (R1), then STOPS at SW-01 before deployment
```

The operator runs 001→002→003→004 without asking between steps, stopping only at SW-01.
