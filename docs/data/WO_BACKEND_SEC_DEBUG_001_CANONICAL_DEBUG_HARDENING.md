# WO-BACKEND-SEC-DEBUG-001 — CanonicalDebugController Hardening

**Date:** 2026-07-02
**Authorization:** SW-10 (auth/security policy) granted by operator.
**Risk executed:** SW-10 code change — narrowed the controller's authorization posture. Verified by build +
tests; no live probe of new behavior possible without a deploy (SW-01), and no destructive endpoint was invoked.

## Finding (from WO-BACKEND-006)
`CanonicalDebugController` (`[Route("api/debug")]`) carried a class-level **`[AllowAnonymous]`** while exposing ~20
**DB-mutating** POST endpoints — the SYNC-POP / drain / populate / doctrine-closure lanes, plus a DESTRUCTIVE
`truncate-raw-landing`. `run-chain` is the operator's sync-workflow HTTP entry point (Program.cs comment ~L996).

## Runtime containment as-found (re-verified live, read-only GET)
```
GET https://app-terrafusion-benton-demo.azurewebsites.net/api/debug/canonical-counts  →  404
```
The demo returns **404**, not 200 — because Program.cs (`NamespaceExcludingControllerFeatureProvider`, ~L1192)
**excludes `CanonicalDebugController` from the MVC feature set in every non-Development environment**. So on the
demo the routes do not exist. The `[AllowAnonymous]` hole was therefore **latent**: live only where the controller
IS mapped (Development, or if that exclusion is ever bypassed), where anonymous callers could invoke destructive
mutations.

## Change applied (defense-in-depth; layered)
Single-line attribute swap on the controller class:
```diff
- [AllowAnonymous]
+ [Authorize(Roles = "SystemAdmin,Administrator")]
```
Now three independent layers guard the surface:
1. **Environment gate** (unchanged) — not mapped outside Development → 404.
2. **Authorization** (new) — where mapped, the whole controller requires an authenticated caller in the
   `SystemAdmin` **or** `Administrator` role. Anonymous → 401; authenticated non-admin → 403; admin → allowed.
   Destructive mutations can no longer be invoked without an admin token.
3. **Destructive env gate** (unchanged) — `truncate-raw-landing` still additionally requires
   `ALLOW_DESTRUCTIVE_DEBUG=true`.

Both role names are listed to match this codebase's two admin vocabularies (`AIModelsController` uses `SystemAdmin`;
the provisioned Benton operator's `GovernmentUsers.Role` is `Administrator`) — so the legitimate admin operator is
not locked out. The `[Authorize(Roles=…)]` pattern is already proven in `AIModelsController`.

## Blast-radius check (why this is safe)
- **No in-process caller.** Every in-repo `api/debug/` reference is a comment/docstring, not an HTTP client. The
  Program.cs note states run-chain is invoked over HTTP by external operator tooling specifically to reuse the wired
  DI tree — i.e. the callers are curl/scripts, not application code. Nothing internal breaks.
- **Operator runbook implication:** operator sync tooling that POSTs to `/api/debug/*` must now send an admin
  `Authorization: Bearer <token>` (obtain via the normal admin login; in Development, an admin dev-token). This is
  the intended hardening, not a regression.
- **Demo unaffected:** already 404 (excluded); this change is belt-and-suspenders if it is ever mapped there.

## Verification
- API `/warnaserror` build: **0 warnings / 0 errors**.
- New reflection posture-guard tests (`CanonicalDebugControllerHardeningTests`): assert the class requires
  `[Authorize]` with both admin roles, is **not** `[AllowAnonymous]`, and **no action method** re-opens anonymous
  access. Full `Category=Security` suite: **110/110 pass** (3 new + 107 pre-existing, no regression).
- New-behavior live proof (401/403/admin-200) is not possible without deploying the change (SW-01) and the demo
  excludes the controller anyway; the posture-guard tests lock the contract instead. No destructive endpoint invoked.

## Disposition
Hardening **COMPLETE**. The anonymous-mutation hole is closed by construction and guarded against regression.
Files: `CanonicalDebugController.cs` (attribute + doc), `CanonicalDebugControllerHardeningTests.cs` (new).
