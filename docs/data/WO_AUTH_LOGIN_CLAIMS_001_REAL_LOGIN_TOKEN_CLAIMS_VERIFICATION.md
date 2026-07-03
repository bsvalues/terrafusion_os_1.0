# WO-AUTH-LOGIN-CLAIMS-001 — Real Login Token Claims Verification

**Date:** 2026-07-02
**Risk class:** R0 (read-only code inspection) — no writes, no auth-policy change, no data mutation, GET-only.
**Method:** Static source-truth read of the real token-issuance path and its entitlement consumers, in the
clean main worktree (`C:\Users\bsval\tf-worktrees\wo-ops-clean-main`, `origin/main` @ `c5bdc575e`). No live
login POST was executed — see "Residual (walled)" for why.

## Motivation

WO-P8-MGMT-007 proved the demo's entitlement model with a **minted** JWT: a bare authenticated token → 403;
adding a `perm=access:dais` claim → allowed; adding county context → Dais resolves Benton scope. The minted
token used `countyCode=Benton` (the *name/FIPS fallback* branch). This WO answers the follow-up: **does the
REAL login path stamp the same claims, with the exact names and formats the entitlement layer reads** — so a
genuinely logged-in Benton operator does NOT hit 403/empty on Workbench/Dais panels?

## Claim-contract chain (source-verified)

### 1. Issuer — `AuthController.Login` → `BuildProvisionedClaims`
`backend/src/TerraFusion.API/Controllers/AuthController.cs`

- `POST /api/auth/login` (`[AllowAnonymous]`) validates a **provisioned** user (public signup disabled;
  unprovisioned → 401), then calls `BuildProvisionedClaims(provisionedUser)` and issues a token pair.
- `BuildProvisionedClaims` (lines 323–351) stamps:
  - `["perm"] = user.Permissions` — a `string[]` (see §4).
  - `["countyId"] = user.CountyId.Value.ToString()` — GUID string (when present).
  - `["countyName"]`, `["countyState"]`, `["countyFipsCode"]` — descriptive county claims.
- Note: it stamps `countyId` (GUID) and `countyName`, **not** `countyCode`.

### 2. Encoder — `JwtTokenService.GenerateAccessToken`
`backend/src/TerraFusion.API/Services/JwtTokenService.cs`

- Custom-claim loop (lines 77–93, "CX-16") explicitly expands any `IEnumerable<string>` value into **multiple
  claims of the same key** — so `perm = ["access:dais", ...]` becomes several distinct `perm` claims.
- Token is HS256, `iss` default `TerraFusion.API`, `aud` default `TerraFusion.Client` — matching the values
  MGMT-007 used and the demo's `ValidateToken` parameters (issuer/audience/lifetime/signing-key all validated,
  `ClockSkew = 0`).

### 3a. Consumer (module permission) — `ModuleAccessHandler`
`backend/src/TerraFusion.API/Security/ModuleAccessHandler.cs`

- Reads claims of type **`perm`**, succeeds on a case-insensitive exact match against
  `requirement.PermissionKey`. **✅ Matches** the `perm` claim login stamps.

### 3b. Consumer (county isolation) — `DaisController.ResolveCountyIdAsync`
`backend/src/TerraFusion.API/Controllers/DaisController.cs` (lines 59–92)

- **Primary branch:** reads `countyId` claim → `Guid.TryParse` → returns it directly. **✅ Matches** login's
  `countyId` GUID. This is the branch real logins actually exercise.
- **Fallback branch:** if no parseable `countyId`, reads a `countyCode` claim and resolves by county Name / FIPS.
  This is the branch MGMT-007's minted `countyCode=Benton` token exercised. Login does **not** stamp `countyCode`,
  but it doesn't need to — the GUID primary branch resolves first.

### 4. Permission source of truth — `DatabaseProvisionedSecurityService`
`backend/src/TerraFusion.API/Security/Services/DatabaseProvisionedSecurityService.cs`

- `ProvisionedUserAuthContext.Permissions` = `ResolvePermissions(user)` = `ParseList(user.Permissions)`, i.e. the
  parsed **`GovernmentUser.Permissions`** DB column.
- Canonical module-permission format is **`access:{moduleId}`** (line ~220: `var expected = $"access:{moduleId}"`),
  the identical string `[RequiresPermission("access:dais")]` controllers demand. So a Dais-entitled operator's row
  must carry `access:dais` in its `Permissions` column, and a non-null `CountyId`.

## Verdict

**CONTRACT PROVEN (static, end-to-end):** The real login path stamps `perm` (from `GovernmentUser.Permissions`)
and `countyId` (GUID) using the exact claim **names and formats** the entitlement layer reads —
`ModuleAccessHandler` (`perm`) and `DaisController.ResolveCountyIdAsync` (`countyId` GUID primary branch). The
CX-16 multi-claim expansion, HS256, and iss/aud all align with the demo's validation and with MGMT-007's findings.
There is **no claim-name mismatch** in the plumbing. A real logged-in Benton Dais operator will therefore be
authorized (not 403/empty) **provided the data condition below holds.**

**New fact vs MGMT-007:** MGMT-007 exercised the `countyCode` *fallback* resolution branch; real logins use the
`countyId` GUID *primary* branch. This WO confirms that primary branch is present and correct in code — closing
the "does the branch real logins use actually work" question that a minted-token test could not.

## Residual (data-dependent — walled, not faked)

The **plumbing** is proven; the **data** is not verifiable here without crossing walls:

- **Does the provisioned Benton Dais operator's `GovernmentUser.Permissions` column actually contain
  `access:dais`, and is `CountyId` set to the Benton `Counties.Id` GUID?** This is a credentialed DB read on the
  demo → **SW-03** (secrets/credentials). Not performed; not assumed.
- **A live end-to-end `POST /api/auth/login` proof is double-walled:** it requires real operator credentials
  (**SW-03**) *and* it **writes a `UserSession` row** via `RecordUserSessionAsync` (AuthController.cs lines 66–72)
  → **SW-02** (data mutation). GET-only discipline and no-write posture were kept; the live login was not executed.

## Corroborating regression coverage (already in-tree, not added here)

- `tests/.../R1Week5/R1Week5Cx27PermClaimAuthTests.cs` — runs the **real** `DynamicModulePolicyProvider` + both
  handlers; asserts the `perm`-claim path (only server-key-signed tokens accepted).
- `tests/.../R1Week5/R1Week5Cx16RealLoginE2ETests.cs` — real-login end-to-end perm-claim flow.
- `tests/.../Phase4/JwtTokenServiceSecurityTests.cs`, `TerraFusion.API.Tests/JwtTokenServiceSecurityTests.cs` —
  token security/signing.

## Disposition

- Claim-contract verification: **COMPLETE** (static). No code change required — the contract is already correct.
- Live/credentialed proof: **PARKED** at SW-02 + SW-03 (real-login session write + operator credentials).
- Recommendation: fold the live proof into the existing credentialed lane
  (`WO-DATA-BENTON-QUARANTINE-001`, SW-03) if/when operator authorizes a credentialed demo session — read the
  Benton operator's `Permissions`/`CountyId` directly rather than driving a login that mutates a session row.
