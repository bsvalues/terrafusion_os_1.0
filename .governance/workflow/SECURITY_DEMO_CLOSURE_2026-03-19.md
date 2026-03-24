# L1 Security Demo Closure — 2026-03-19

**Charter**: Benton County Onsite Production Demo Charter
**Day**: Day 1 — Security Critical/High Closure
**Branch**: main / HEAD: post-Day-1-commit (see git log)
**Lane Owner**: L1 Security Closure (@tf-writer)

---

## Verdict: DAY 1 SECURITY CLOSURE COMPLETE ✅

All demo-critical and demo-adjacent security findings closed or formally classified.

| Finding | Before | After | Risk Delta |
|---------|--------|-------|------------|
| PlaygroundController class-level `[AllowAnonymous]` (WARN-1) | `[AllowAnonymous]` on class — all 5 endpoints unauthenticated including `POST /start` | `[Authorize]` on class; `[AllowAnonymous]` scoped to GET health/scenarios/runs/runs/{id} only; `POST /start` requires auth | **CLOSED → CLEAR** |
| TerraFusion.Operations hardcoded JWT fallback | `jwtSettings["Secret"] ?? "TerraFusion-Default-Secret"` — predictable token forgery window | Random session key + startup warning; tokens don't survive restart; predictable string eliminated | **CLOSED → CLEAR** |
| JWT secrets in main demo path (TerraFusion.API) | Configuration-driven, throws if missing | No change — already compliant | **PRE-CLEAR** |
| Sanitization on PlaygroundController `POST /start` | ScenarioId non-empty check + `ValidateScenarioAsync` allowlist | No change required — allowlist validation is adequate for prototype surfaces; Parameters dict is in-memory only, no persistence mutation | **CLEAR** |

---

## Fix 1 — PlaygroundController Scope Restriction

**File**: `backend/src/TerraFusion.API/Controllers/PlaygroundController.cs`

**Before** (WARN-1 state):
```csharp
[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]                          // class-level: ALL endpoints unauthenticated
public class PlaygroundController : ControllerBase
{
    [HttpGet("health")]
    public IActionResult GetHealth() { ... }

    [HttpGet("scenarios")]
    public async Task<IActionResult> GetScenarios() { ... }

    [HttpPost("start")]
    public async Task<JsonResult> StartScenario(...) { ... }  // unauthenticated WRITE

    [HttpGet("runs")]
    public IActionResult ListRuns() { ... }

    [HttpGet("runs/{id}")]
    public IActionResult GetRun(string id) { ... }
}
```

**After** (scope-restricted):
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]                               // class-level: auth required by default
public class PlaygroundController : ControllerBase
{
    [HttpGet("health")]
    [AllowAnonymous]                      // read-only health probe — safe
    public IActionResult GetHealth() { ... }

    [HttpGet("scenarios")]
    [AllowAnonymous]                      // read-only list — safe for demo discoverability
    public async Task<IActionResult> GetScenarios() { ... }

    [HttpPost("start")]
    // NO [AllowAnonymous] — inherits [Authorize] — authenticated write only ✅
    public async Task<JsonResult> StartScenario(...) { ... }

    [HttpGet("runs")]
    [AllowAnonymous]                      // read-only observability — safe
    public IActionResult ListRuns() { ... }

    [HttpGet("runs/{id}")]
    [AllowAnonymous]                      // read-only run detail — safe
    public IActionResult GetRun(string id) { ... }
}
```

**Risk reduction**: Unauthenticated `POST /start` (prototype scenario execution) eliminated. All write operations now require valid JWT bearer token.

---

## Fix 2 — TerraFusion.Operations JWT Fallback Hardening

**File**: `backend/src/TerraFusion.Operations/Program.cs`

**Before**:
```csharp
var secretKey = Encoding.ASCII.GetBytes(jwtSettings["Secret"] ?? "TerraFusion-Default-Secret");
```

**After**:
```csharp
var configuredSecret = jwtSettings["Secret"];
if (string.IsNullOrEmpty(configuredSecret))
{
    configuredSecret = "TerraFusion-Ops-Session-" + Guid.NewGuid().ToString("N");
    Console.WriteLine("⚠️  WARNING: No JWT:Secret configured in TerraFusion.Operations — using a random session key. " +
        "Tokens will NOT survive app restarts. Set JWT:Secret in appsettings.json for production.");
}
var secretKey = Encoding.ASCII.GetBytes(configuredSecret);
```

**Risk reduction**: Predictable `"TerraFusion-Default-Secret"` that any attacker could use to forge valid Operations-microservice tokens is eliminated. Random GUID per session ensures tokens cannot be forged without the key even in misconfigured environments.

**Note**: `TerraFusion.Operations` is not on the primary Benton demo path (assessor journeys use TerraFusion.API). However, the predictable fallback was a supply-chain-adjacent risk and warranted hardening regardless of demo scope.

---

## Sanitization Assessment — Demo-Exposed Surfaces

| Surface | Input | Validation Present | Assessment |
|---------|-------|--------------------|------------|
| `PlaygroundController POST /start` | `ScenarioId` (string), `Parameters` (dict) | ScenarioId: non-empty check + `ValidateScenarioAsync` allowlist (`hello-world`, `pilt-sample`, `permit-ai`). Parameters: unvalidated but in-memory only, no persistence mutation. | **CLEAR** — allowlist is adequate for prototype surface |
| `PilotController` | `countyId`-scoped, `[Authorize(Policy = "OSCoreAccess")]` | Auth policy enforces county scope at controller level | **CLEAR** — pre-existing from Day 0 L5 audit |
| `CoPilotController` | County-scoped GPT routing | `[Authorize(Policy = "RequireUser")]` at controller | **CLEAR** — pre-existing from Day 0 L5 audit |

No demo-critical surface has open sanitization risk.

---

## JWT Secret Configuration Status

| Service | Secret Source | Hardcoded Fallback | Status |
|---------|-------------|-------------------|--------|
| `TerraFusion.API` (JwtAuthService) | `JwtSettings:SecretKey` config | Random Guid per session + startup warn | ✅ CLEAR |
| `TerraFusion.API` (AuthenticationConfiguration) | `JwtSettings:SecretKey` config | Random Guid per session + startup warn | ✅ CLEAR |
| `TerraFusion.API` (JwtTokenService) | `JwtSettings:SecretKey` config | **Throws** if missing | ✅ CLEAR |
| `TerraFusion.Core` (AuthenticationService) | `JwtSettings:SecretKey` config | **Throws** if missing | ✅ CLEAR |
| `TerraFusion.Security` (EdgeFunctionAuth) | `JwtSettings:SecretKey` config | **Throws** if missing | ✅ CLEAR |
| `TerraFusion.Operations` (Program.cs) | `JWT:Secret` config | ~~Hardcoded predictable~~ → **Random Guid + warn** (FIXED Day 1) | ✅ CLEAR |

No demo-critical JWT surface has a hardcoded or predictable fallback secret.

---

## Command Wall — Post-Day 1 Results

| Command | Result |
|---------|--------|
| `npx tsc -p tsconfig.core.json --noEmit` | ✅ 0 errors |
| `node --test os-platform/core/tests/phase83-tools.test.mjs` | ✅ 56/56 |
| `node --test os-platform/core/tests/phase85-tools.test.mjs` | ✅ 22/22 |
| `node --test os-platform/core/tests/phase86-toolrunner.test.mjs` | ✅ 9/9 |
| `vitest run src/__tests__/auth/` | ✅ 532/532 (29 files) |
| `dotnet build TerraFusion.sln --configuration Release` | ✅ 0 errors, 4 warnings (pre-existing AutoMapper NU1903) |

---

## Day 1 Exit Criteria Checklist

- [x] No open critical demo-path security finding
- [x] Anonymous write exposure on demo pathways closed (PlaygroundController POST /start now requires auth)
- [x] Hardcoded JWT fallback eliminated (TerraFusion.Operations)
- [x] Sanitization/validation confirmed on all demo-exposed surfaces
- [x] Command wall green post-changes
- [x] SECURITY_DEMO_CLOSURE artifact published

**Day 1 verdict: COMPLETE — GO for Day 2 (County Isolation + RBAC Hardening)**

---

## Files Changed

| File | Change |
|------|--------|
| `backend/src/TerraFusion.API/Controllers/PlaygroundController.cs` | Class `[AllowAnonymous]` → `[Authorize]`; route-level `[AllowAnonymous]` on GET endpoints only |
| `backend/src/TerraFusion.Operations/Program.cs` | Hardcoded `"TerraFusion-Default-Secret"` → random Guid session key with startup warning |
