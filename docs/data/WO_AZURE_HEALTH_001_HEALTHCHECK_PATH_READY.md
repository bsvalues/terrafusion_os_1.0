# WO-AZURE-HEALTH-001 — App Service Health Check Path → /health/ready

**Program:** P3/P8 boundary — Azure demo platform config (health probe truthfulness)
**Date:** 2026-07-02
**Mode:** SW-01 Azure config change (authorized, bounded). No code, no data, no secrets, no auth.
**Authorization:** Operator granted — move the App Service health probe off shallow `/health` onto the
truthful readiness endpoint `/health/ready` (made real by BACKEND-004).
**Scope:** update `healthCheckPath` `/health` → `/health/ready`; verify the App Service stays healthy;
capture evidence. **No** code / data mutation / secrets / auth-policy / go-live. Stop if Azure requires
plan/resource changes or auth/security decisions.

**Target:** `app-terrafusion-benton-demo` (RG `terrafusion-benton-demo`, Linux, `DOTNETCORE|8.0`).

---

## 0. Outcome

**SUCCESS.** The App Service health probe now targets `/health/ready` (readiness truth: 200 only once
the host has started — BACKEND-004) instead of the shallow `/health` (liveness/"Basic Mode"). Pure
config change; no restart required; app healthy and serving throughout.

---

## 1. Why

BACKEND-001 (F1-F3) found the health surfaces could contradict, and BACKEND-004 fixed it: `/health/ready`
gates on `IHostApplicationLifetime.ApplicationStarted` (200 `Ready` / 503 `NotReady`). BACKEND-008's
runbook flagged that the **platform probe still pointed at `/health`** — a shallow check that returns 200
even while the app is still initializing, so Azure could route traffic to a not-yet-ready instance. With
P8 now reachable (MGMT-005/006), aligning the probe with the truthful endpoint is the right closing move.

---

## 2. Pre-flight (do not probe an unreliable endpoint)

Before switching, confirmed `/health/ready` is reliably 200 on the running (MGMT-006) binary — pointing a
platform probe at an endpoint that 503s would pull the instance from rotation:

```
try 1: /health/ready -> HTTP 200
try 2: /health/ready -> HTTP 200
try 3: /health/ready -> HTTP 200
body: {"status":"Ready","timestamp":"2026-07-02T15:37:12Z","message":"TerraFusion OS is ready to serve requests"}
```
Current probe before change: `healthCheckPath = /health`. App state: `Running`.

---

## 3. Change

```
az webapp config set -g terrafusion-benton-demo -n app-terrafusion-benton-demo \
  --generic-configurations '{"healthCheckPath": "/health/ready"}'
```
(Set with `MSYS_NO_PATHCONV=1` so Git Bash doesn't mangle `/health/ready` into a Windows path.)
Persisted value confirmed: `siteConfig.healthCheckPath = /health/ready`. No restart triggered (health-path
changes are picked up by the platform probe automatically).

---

## 4. Verification (post-change)

| Check | Result |
|-------|--------|
| `siteConfig.healthCheckPath` | **/health/ready** |
| App Service `state` | **Running** |
| `GET /health/ready` (new probe target) | **200** |
| `GET /health` (old, still live) | **200** |
| `GET /` (SPA shell) | **200** — serving intact |
| `GET /api/sync/doctrine/state` | **200** — data live |
| `GET /api/health/detailed` | **401** — auth intact |

The probe now evaluates readiness truth; nothing else changed. No disruption to the SPA, data surface,
or auth posture.

---

## 5. Drift note

Repo grep for `healthCheckPath` finds references only under `QUARANTINE/` (an archived helm chart and old
`deployment_attempts` configs) — **none is the active deploy path** for this App Service (deployed via the
WO-DEPLOY-BENTON-003C process, not those). So the Azure setting is the source of truth and there is no
active-IaC drift that would revert it. If a future IaC-driven deploy is introduced, set
`healthCheckPath: /health/ready` there too.

---

## 6. Scope boundary held

No code change, no data mutation, no secrets, no auth-policy change, no plan/resource change, no go-live.
Purely repointed the existing health probe to the truthful readiness endpoint.

---

**WO-AZURE-HEALTH-001: COMPLETE.** The App Service health probe uses `/health/ready` (BACKEND-004 truth).
Pairs with BACKEND-008 §5 (this was the open "App Service health-check path" item).
