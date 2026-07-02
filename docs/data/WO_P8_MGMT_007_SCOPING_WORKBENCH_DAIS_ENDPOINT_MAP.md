# WO-P8-MGMT-007 (SCOPING) — Workbench / Dais Data-Endpoint Map

**Program:** P8 — Management Dashboard (authenticated-surface verification lane)
**Date:** 2026-07-02
**Mode:** R0 read-only. Frontend source read + anonymous GET classification probe. No auth used, no
writes, no secrets, no mutation, no deployment.
**Purpose:** Pre-scope the (not-yet-authorized) WO-P8-MGMT-007 authenticated verification by mapping
exactly which endpoints the `/dais` suite and Workbench panels call, and classifying each as
already-anonymous vs token-gated — so the eventual authenticated pass is a tight GET list, not
click-around exploration.
**Authority boundary:** SW-10 (authenticated data) NOT crossed — no token obtained. SW-03 (secrets) NOT
crossed. All probes were anonymous GETs against already-public or deny-by-default endpoints.

---

## 0. Headline

The `/dais` + Workbench data surface is **partly anonymous already** (delivered by MGMT-006), and the
**true token-gated set is only 4 endpoints**. A separate, auth-independent gap surfaced: the Dais
audit-trail endpoints return **404** on the deployed build.

---

## 1. Read-endpoint map (route → endpoint → anonymous probe verdict)

Anonymous GET probes against `app-terrafusion-benton-demo.azurewebsites.net`, 2026-07-02:

| Surface / panel | Endpoint (GET) | Anon | Verdict |
|---|---|---|---|
| Workbench · sync-doctrine console | `/api/sync/doctrine/state`, `/api/sync/doctrine/lanes` | 200 | ✅ renders live, no token |
| Workbench · quarantine (imprv-attr) | `/api/sync/workbench/f/quarantine/imprv-attr` | 200 | ✅ anonymous |
| Pilot surfaces | `/api/pilot/tools`, `/api/pilot/health`, `/api/pilot/traces` | 200 | ✅ anonymous |
| Workbench · sync-readiness | `/api/workbench/sync-readiness` | 401 | 🔒 needs token |
| Dais · supervisor flag queue | `/api/workbench/flags` | 401 | 🔒 needs token |
| Dais · appeals | `/api/dais/appeals` | 401 | 🔒 needs token |
| Dais · certification | `/api/dais/cert/status` | 401 | 🔒 needs token |
| Dais · permits / notices | `/api/dais/permits`, `/api/dais/notices/parcel/{id}` | (same base/auth → 401) | 🔒 needs token |
| Dais · audit trail | `/api/audit/trail`, `/api/audit/search` | 404 | ⚠️ endpoint absent on deployed build (NOT auth) |

Source of the endpoint list (frontend clients, `frontend/apps/os-shell/src`):
- `api/syncDoctrine.ts` → `/api/sync/doctrine/{state,lanes,batch/{guid}}` (via `apiFetch`, relative `/api`).
- `api/workbenchSyncReadiness.ts` → GET `/api/workbench/sync-readiness`; POST `.../refresh` (write).
- `api/syncQuarantine.ts` → GET `/api/sync/workbench/f/quarantine/imprv-attr`; POST `.../{id}/route`,
  `.../{id}/dismiss` (writes).
- `services/suites/daisService.ts` (`const API = '/api/dais'`) → GET `/appeals`, `/appeals/parcel/{id}`,
  `/permits`, `/cert/status`, `/notices/parcel/{id}` (`authHeadersReadOnly()`); PUT `/appeals/{id}/status`,
  `/permits/{id}/status`; POST `/appeals` (writes).
- `components/dais/SupervisorFlagQueue.tsx` → GET `/api/workbench/flags`; POST `/api/workbench/flags/{id}/status` (write).
- `components/dais/AuditTab.tsx`, `pages/dais/AuditTrailPage.tsx` → GET `/api/audit/trail`, `/api/audit/search`.

---

## 2. Write endpoints — EXCLUDED from any verification (read-only guarantee)

`/api/workbench/sync-readiness/refresh` (POST) · `/api/sync/doctrine/drain/{lane}` (POST) ·
`/api/sync/workbench/f/quarantine/imprv-attr/{id}/route` + `/dismiss` (POST) ·
`/api/dais/appeals` (POST) · `/api/dais/appeals/{id}/status` + `/api/dais/permits/{id}/status` (PUT) ·
`/api/workbench/flags/{id}/status` (POST) · `/api/sync/workbench/g/commit` (POST) ·
`/api/sync/corpus/start` (POST). **None of these is touched by verification.**

---

## 3. Findings that shape SW-10

1. **Already anonymous (MGMT-006 delivered):** sync-doctrine board, imprv-attr quarantine list, and the
   Pilot panels render live with no token. No further work needed for those.
2. **The token-gated set is only 4 endpoints:** `sync-readiness`, `workbench/flags`, `dais/appeals`,
   `dais/cert/status` (+ same-base `dais/permits` / `dais/notices`). That is the entire surface a login
   token would unlock — the SW-10 verification target list.
3. **Auth-independent deploy gap:** `/api/audit/trail` and `/api/audit/search` return **404** on the
   deployed build — the Dais audit-trail panel would fail even authenticated. This is a
   controller-presence / route gap, not an auth issue, and is out of scope for the (token) verification.

---

## 4. Pre-scoped verification (for WO-P8-MGMT-007, if/when authorized)

Prerequisite (unchanged): a token requires the operator to pick the auth method and authorize the
credential/secret use — `/api/auth/dev-token` is `IsDevelopment()`-gated (401 in this env, BACKEND-006),
so there is no anonymous token path. Recommended method A (real login via `/api/auth/login` with a
seeded operator account; credential local-env only, never Git/logs).

Read-only GET list (the only 4 targets):
```
GET /api/workbench/sync-readiness
GET /api/workbench/flags
GET /api/dais/appeals
GET /api/dais/cert/status
```
Record per endpoint: HTTP status + renders-real-data / unavailable / error. No writes, no refresh/drain/
route/dismiss, no secrets in output, no auth-policy change, no go-live. Note (already known):
`/api/audit/*` 404 — flag as a separate deploy gap, do not chase in the verification.

---

## 5. Evidence log

- Frontend source: `frontend/apps/os-shell/src/{api,services/suites,components/dais,pages/dais}` (grep of
  `apiFetch`/`buildApiUrl`/`fetch` + method).
- Anonymous GET probe (2026-07-02): §1 table (200 anon / 401 gated / 404 absent).
- `apiBase.ts` Invariant B: `buildApiUrl` prepends `/api` in browser → all relative, same-origin.

---

**WO-P8-MGMT-007 (SCOPING): COMPLETE (R0).** The authenticated verification is now a tight 4-endpoint
GET list. The actual run remains parked behind the SW-10/SW-03 auth-method decision. The `/api/audit/*`
404 is recorded as a separate deploy gap.
