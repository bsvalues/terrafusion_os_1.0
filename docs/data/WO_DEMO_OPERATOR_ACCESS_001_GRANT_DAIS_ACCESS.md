# WO-DEMO-OPERATOR-ACCESS-001 — Grant Dais Access to Demo Operator

**Date:** 2026-07-02
**Authorization:** SW-02 (data mutation) granted by operator — "grant `access:dais` to the demo operator".
**Risk executed:** R2/SW-02 — a single scoped UPDATE to one row's `Permissions`, plus read-only verification.
**Target:** Azure PG `terrafusion_benton_demo`. Credential + JWT signing key retrieved **in-memory** from App
Service app settings (`ConnectionStrings__DefaultConnection`, `JwtSettings__SecretKey`); neither printed, logged,
persisted, nor committed. The minted verification token was used in-process only and never emitted.

## Motivation
`WO-DATA-BENTON-QUARANTINE-001` found the sole provisioned operator (`admin@terrafusionmarket.com`, Administrator,
CountyId = Benton) had `access:costforge` but **not** `access:dais`, so a real login would 403 on Dais panels —
a **provisioning-data** gap, not a code gap. This WO closes that gap.

## Grant scope — precisely what the code requires (no over-grant)
Enumerated `RequiresPermission("…")` across all API controllers:
- **`access:dais`** gates exactly one controller — **`WorkbenchFlagsController`**. It is the Dais/Workbench-flags
  module key.
- **`DaisController`** carries **no** `RequiresPermission` — it is gated by authentication + county isolation
  (`ResolveCountyIdAsync`), which the operator already satisfies (CountyId = Benton).
- There is **no `access:workbench` key** in the codebase — so it was *not* invented/granted.
- `access:forge` (a separate module, `ForgeController`) was **not** requested and **not** granted.

**Grant applied: `access:dais` only.** Minimal and sufficient for the Dais/Workbench surface.

## The write (SW-02) — one row, idempotent, transactional
```sql
BEGIN;
UPDATE public."GovernmentUsers"
   SET "Permissions" = ("Permissions"::jsonb || '["access:dais"]'::jsonb)::text
 WHERE "Email" = 'admin@terrafusionmarket.com'
   AND NOT ("Permissions"::jsonb @> '"access:dais"');   -- idempotent guard
COMMIT;
```
- Affected rows: **1**. Only the `Permissions` column changed; no audit/identity/credential columns touched
  (`GovernmentUsers` has no `UpdatedAt`/`UpdatedBy`; `SocialSecurityNumber`/`PasswordHash` never referenced).
- Before: `["read:dossier","write:dossier","read:properties","read:parcel","access:costforge"]` (has_dais = **f**)
- After:  `[…, "access:costforge", "access:dais"]` (has_dais = **t**), committed.

### Parse-safety note (why the jsonb reformat is harmless)
The jsonb round-trip reformats the array with spaces after commas. `DatabaseProvisionedSecurityService.ParseList`
JSON-**deserializes** any value beginning with `[` (`JsonSerializer.Deserialize<string[]>`), and its delimiter
fallback uses `StringSplitOptions.TrimEntries` — so tokens are whitespace-clean either way and
`ModuleAccessHandler`'s exact (case-insensitive) match on `access:dais` succeeds. No regression.

## Live end-to-end verification (read-only GET; token minted in-memory)
Minted an HS256 token carrying the **exact claim set a post-grant login will now stamp** — every `perm` from the
updated `Permissions` (incl. `access:dais`) + `countyId` = Benton GUID, `iss=TerraFusion.API`,
`aud=TerraFusion.Client` — and probed the live demo:
```
200  GET /api/workbench/flags                              {"total":0,...,"items":[]}   (was 403 for bare token)
200  GET /api/dais/cert/status?county=Benton&taxYear=2025  rollStatus "blocked", real workflow steps
401  GET /api/workbench/flags  (NO TOKEN, control)         deny-by-default intact
```
The Dais-gated `WorkbenchFlagsController` and the Dais cert endpoint now authorize with the operator's post-grant
claim set; the no-token control still 401s.

## Closure — the full auth chain is now green end-to-end
```
login stamps perm from GovernmentUsers.Permissions   ✅ WO-AUTH-LOGIN-CLAIMS-001 (code contract)
Permissions now contains access:dais                 ✅ this WO (SW-02 write, verified in DB)
ModuleAccessHandler accepts access:dais              ✅ WO-P8-MGMT-007 + live probe above
county context = Benton                              ✅ WO-DATA-BENTON-QUARANTINE-001
──────────────────────────────────────────────────────────────────────────────────────
A real logged-in Benton operator is now Dais-capable (no 403/empty from entitlement).
```

## Residual / not done here
- A true **real-login** proof (POST `/api/auth/login` with the operator password) was **not** performed: it needs
  the operator credential and it writes a `UserSession` row. The minted-token probe above is the read-only
  equivalent (mirrors the post-grant login claim set). If a full login proof is wanted, authorize it explicitly.
- The situs/legal 100%-null finding (QUARANTINE-001) is unaffected by this WO and remains a disclosure/backfill item.
