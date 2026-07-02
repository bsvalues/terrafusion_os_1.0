# WO-BACKEND-006 — Auth / Security Proof

**Program:** P3 — Backend Operational Excellence
**Date:** 2026-07-02
**Mode:** Evidence (read-only proof). No auth-policy change applied. Fix recommended, NOT applied (see §5).
**Sources:** Source map of `TerraFusion.API` auth (clean main worktree) + live anonymous probes of the
deployed demo (`app-terrafusion-benton-demo.azurewebsites.net`, 003C snapshot).
**Authority Boundary:** SW-10 authorized. This WO **proves** posture and **recommends** one hardening;
it does **not** apply an auth change, because the one candidate fix is not trivially bounded (§5).

---

## 0. Verdict

**The backend auth posture is fail-secure and, at runtime on the demo, sound.** Authentication is JWT
Bearer with strict validation; authorization is **deny-by-default** (`FallbackPolicy =
RequireAuthenticatedUser`); the dev-token bypass is **hard-gated to `IsDevelopment()`** and is
**not reachable** on the deployed BentonCounty environment; the production JWT secret is env-var
driven; security/LDAP services fail closed. **One latent defense-in-depth gap** exists in code
(`CanonicalDebugController` `[AllowAnonymous]` on mutation endpoints) — currently contained at
runtime (401 on the demo) and recommended for an operator-decided fix (§5), not applied here.

---

## 1. Runtime Proof (deployed BentonCounty demo)

Probed anonymously (GET only; no POST to any write/truncate route):

| Endpoint | Code | Meaning |
|----------|------|---------|
| `/api/auth/dev-token` | **401** (empty body) | dev bypass NOT reachable in prod; **no token leaked** |
| `/api/auth/login` · `/api/auth/me` | 401 | auth surface gated |
| `/api/properties` · `/api/admin/status` · `/api/systemorchestration/info` | 401 | sensitive endpoints gated |
| `/healthz` · `/healthz/proof` | 401 | health-check + SpecLock proof gated |
| `/api/debug/canonical-counts` · `/sync-pop-2/*` (GET) | **401** | debug controller NOT anonymous at runtime |
| `/health*` · `/api/system/health` · `/api/sync/doctrine/*` · `/ops/pacs/*` | 200 | intended anonymous surface only |

**The auth wall is real:** every sensitive endpoint is 401; only the intended health/doctrine/ops
surface is anonymous. The single highest-severity check — dev-token in production — **passes**.

---

## 2. Authentication (code proof)

`backend/src/TerraFusion.API/Security/AuthenticationConfiguration.cs`:
- JWT Bearer; `ValidateIssuer`/`ValidateAudience`/`ValidateLifetime`/`ValidateIssuerSigningKey` all
  **true**; `ClockSkew = TimeSpan.Zero` (no skew tolerance).
- `Program.cs`: `app.UseAuthentication()` then `app.UseAuthorization()` — **correct order**.
- SignalR JWT via query-string token (hubs).

## 3. Authorization (deny-by-default)

- **`FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build()`** — every
  endpoint without explicit `[Authorize]`/`[AllowAnonymous]` requires an authenticated user (added
  under PR-2 / Prometheus T3 to remove silent anonymous fallback).
- Policies: `RequireAdmin`, `RequireAssessor`, `RequireUser`, `OSCoreAccess`, `TIER5AIAccess`;
  dynamic module/permission policies via `DynamicModulePolicyProvider` + `ModuleAccessHandler`.
- Fail-closed services: `InMemorySecurityService.ValidateUserCredentialsAsync` returns **false** with
  a warning if a real security service isn't registered; production LDAP is `FailClosedLdapService`
  (throws rather than silently allowing).

## 4. Secrets (no hardcoded prod secret)

- Signing key from `JwtSettings:SecretKey` (env `JwtSettings__SecretKey`). **Non-Development fails
  fast** (`InvalidOperationException`) if the key is missing — no silent weak default in prod.
- Development has a clearly-labeled fallback key (`...DEV-ONLY-NEVER-USE-IN-PROD...`) and
  `appsettings.json` carries a dev-only key (checked in, labeled). `appsettings.Production.json` uses
  `${JWT_SECRET}` — **no hardcoded production secret**. (No secret values reproduced in this doc.)
- Dev-token payload (Development only): `dev-user-001`, roles `[Developer, Assessor, GovernmentUser]`,
  120-min expiry — inert in prod because the endpoint is `IsDevelopment()`-gated.

---

## 5. The One Finding — `CanonicalDebugController` (latent, contained; fix = operator decision)

**Code:** `backend/src/TerraFusion.API/Controllers/CanonicalDebugController.cs:59` — the **entire
controller** is `[AllowAnonymous]`, and it includes DB-mutation endpoints:
- `POST /api/debug/sync-pop-2/run-chain` — writes to `legacy_pacs_raw.*` / `truth_pacs.*` /
  `canonical_tf.tf_sale` (no `[Authorize]`, no destructive-guard).
- `POST /api/debug/sync-pop-2/truncate-raw-landing` — TRUNCATES tables; guarded by
  `ALLOW_DESTRUCTIVE_DEBUG=true` → 403 otherwise (line ~329).

**Runtime reality:** on the deployed demo **all `/api/debug/*` return 401** — so it is **not
anonymously exploitable there** (the effective protection is environmental/deployment-level, not the
controller's own authorization). This is a **defense-in-depth gap**: the mutation endpoints rely on
an implicit external gate rather than explicit endpoint authorization.

**Why NOT auto-fixed here (bounded-fix discipline):**
- `run-chain` is the **operator's sync-workflow HTTP entry point** (see `Program.cs:996` — "SYNC-POP-2
  entry point lives at POST /api/debug/sync-pop-2/run-chain … using HTTP avoids re-registering the
  entire sale promoter/projector chain"). Adding `[Authorize(Policy="RequireAdmin")]` would require
  the operator's curl-based sync tooling to carry a token — a **real blast radius** on the sync
  workflow, not a trivially-safe change.
- Runtime risk is currently contained (401 on the demo).
- Therefore this is an **operator decision**, not a unilateral auth change. The scope authorized a
  fix "only as explicitly bounded"; this one is not.

**Recommended fix (for operator authorization as its own WO):** add
`[Authorize(Policy = "RequireAdmin")]` at the controller level (or split read-only debug reads into a
separate anonymous controller and require auth only on the mutation/truncate actions), then update
the operator sync-runbook to authenticate. Bundle with a contract test asserting the mutation
endpoints require auth.

---

## 6. Lower-Priority Notes (no action)

- **CORS:** `AllowAnyMethod()`/`AllowAnyHeader()` + `AllowCredentials()` with a config-driven origin
  allowlist (localhost in dev; HTTPS origins in `appsettings.Production.json`). Mitigated by the
  allowlist; consider tightening methods/headers in a future hardening WO.
- **`/api/auth/revoke` anonymous:** RFC 7009-style user-initiated revocation; JTI-validated, no
  escalation. Acceptable by design.
- **LDAP/AD:** production is `FailClosedLdapService` (stub, throws) — a real integration gap tracked
  elsewhere, but fail-secure.

---

## 7. Stop Walls

| Wall | Status |
|------|--------|
| SW-10 auth/security | authorized; **no policy change applied** (proof + recommendation only) |
| SW-02 data mutation | not crossed (GET-only probes; never POSTed a write/truncate route) |
| SW-03 secrets | not crossed (no secret values read or reproduced) |
| SW-01 deploy | not crossed |

---

## 8. Evidence Log

- Auth config: `Security/AuthenticationConfiguration.cs` (JWT validation, FallbackPolicy, policies, fail-closed services)
- Middleware order: `Program.cs` `UseAuthentication`→`UseAuthorization`
- Dev-token gate: `Program.cs:~2795` `if (app.Environment.IsDevelopment())` (runtime-confirmed 401 on demo)
- Finding: `Controllers/CanonicalDebugController.cs:59` (`[AllowAnonymous]` + mutation), `Program.cs:996` (operator HTTP entry point)
- Secrets: `appsettings.Production.json` `${JWT_SECRET}` (env-driven); no prod hardcode
- Runtime probes (anon, GET-only): dev-token 401 (empty), all sensitive 401, `/api/debug/*` 401

---

**WO-BACKEND-006: COMPLETE (proof).** Posture is fail-secure and runtime-sound. One latent
defense-in-depth item (`CanonicalDebugController`) is surfaced for an operator-authorized hardening WO
(not applied here because its fix affects the operator sync workflow). Next in program: BACKEND-007
(release gate synthesis), BACKEND-008 (operational runbook) — both now have real audit content.
