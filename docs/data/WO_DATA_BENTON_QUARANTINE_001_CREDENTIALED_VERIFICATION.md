# WO-DATA-BENTON-QUARANTINE-001 — Credentialed Read-Only DB Verification

**Date:** 2026-07-02
**Authorization:** SW-03 (credentialed read-only) granted by operator.
**Risk executed:** R0 read-only — **SELECT-only**, no INSERT/UPDATE/DELETE, no schema change, no session writes.
**Target:** Azure PG `terrafusion_benton_demo` on `pg-terrafusion-benton-demo.postgres.database.azure.com`.
**Credential handling:** DB password retrieved **in-memory** from the App Service app setting
`ConnectionStrings__DefaultConnection` (via `az webapp config appsettings list`), parsed to `PG*` env vars for
`psql`, **never printed, logged, persisted, or committed**. Only query *results* appear below — never the secret.

## Summary verdict

| # | Check | Result | Verdict |
|---|-------|--------|---------|
| 1 | Owner-current quarantine | `legacy_tf_unproven.owner_current` = **87,909** | ✅ CONFIRMED (matches OWNER-001) |
| 2 | Improvement-attribute quarantine | `legacy_tf_unproven.unresolved_imprv_attr` = **1,872,866** | ✅ CONFIRMED (matches IMPR-LAND-001 ~1.87M) |
| 3 | Sale quarantine | `legacy_tf_unproven.sale` = **4,489** | ✅ CONFIRMED (matches SALE-001 / raw→truth→canonical delta) |
| 4 | Address / legal null rates | `SitusAddress` **100.00%** null-or-blank; `LegalDescription` **100.00%** null-or-blank (of 84,418) | ⚠️ NEW FINDING |
| 5 | Operator claim-readiness | 1 active operator; CountyId = Benton ✅; **`access:dais` = ABSENT** | ⚠️ NEW FINDING (resolves AUTH-LOGIN-CLAIMS-001 residual) |

## Evidence

### Schema map (relevant)
Quarantine cohorts live in schema **`legacy_tf_unproven`**; `public.SyncQuarantine` is **empty (0 rows)** — it is
not the quarantine of record. Operator truth is `public.GovernmentUsers` (`Permissions` text column + `CountyId`
uuid). Benton is `public.Counties.Id` = `19190019-1919-1919-1919-191919191919`, FIPS `53005`.

### Checks 1–3 — quarantine cohort counts (`legacy_tf_unproven`)
```
owner_current               | 87909      ← check 1 CONFIRMED
imprv_current               | 0
unresolved_imprv_attr       | 1872866    ← check 2 CONFIRMED
unproven_imprv_attr_triage  | 0
land_current                | 0
sale                        | 4489       ← check 3 CONFIRMED
wash_prop_owner_val         | 87909      (mirrors owner_current)
```
All three headline quarantine figures match the earlier **anonymous** audits (GEOM/OWNER/IMPR-LAND/SALE-001)
exactly — the anonymous-endpoint numbers are now corroborated against the live tables via direct credentialed
count. `public.SyncQuarantine` grouped by `EntityType` returned 0 rows.

### Check 4 — address / legal null-or-blank rates (`canonical_tf.tf_parcel`)
```
total  | situs_null_blank | situs_pct | legal_null_blank | legal_pct
84418  | 84418            | 100.00    | 84418            | 100.00
```
**Finding:** every canonical parcel has a NULL-or-blank `SitusAddress` **and** `LegalDescription`. The canonical
parcel spine carries **no situs address and no legal description** in this demo DB. This was the one audit
(ADDR-001) that could not be measured anonymously (property endpoints 401); it is now measured: **100% absent.**
Any UI surfacing parcel situs/legal from `canonical_tf.tf_parcel` will render empty — an honest-disclosure item,
not a fabrication risk.

### Check 5 — operator claim-readiness (`public.GovernmentUsers`; SSN / PasswordHash NOT selected)
```
govuser_rows | active_rows
1            | 1

Email                       | Role          | IsActive | county_benton | has_access_dais | has_any_access_perm
admin@terrafusionmarket.com | Administrator | t        | t             | f               | t
Permissions = ["read:dossier","write:dossier","read:properties","read:parcel","access:costforge"]
```
**Finding — resolves the WO-AUTH-LOGIN-CLAIMS-001 residual:**
- **County context: READY.** The operator's `CountyId` equals the Benton `Counties.Id` GUID → the login token's
  `countyId` claim will satisfy `DaisController.ResolveCountyIdAsync` (primary GUID branch).
- **Module entitlement: NOT Dais-ready.** `Permissions` grants `access:costforge` (plus dossier/property reads)
  but **does not contain `access:dais`** (nor `access:workbench`). Per the proven claim contract, the login token
  will stamp `perm=access:costforge` etc. but **no `perm=access:dais`**, so `ModuleAccessHandler` will **403** any
  `[RequiresPermission("access:dais")]` controller.

**Interpretation:** the auth *plumbing* is sound (proven in MGMT-007 + AUTH-LOGIN-CLAIMS-001) — the gap is
**provisioning data**, not code. A real logged-in operator hits 403/empty on Dais panels because the single
provisioned account was never granted `access:dais`. CostForge is entitled; Dais/Workbench are not. (Note:
`GovernmentUsers.Permissions` is the authoritative token-stamping source per `DatabaseProvisionedSecurityService`;
the normalized `public.UserPermissions` table is **not** on the JWT `perm` path and does not change this verdict.)

## Consequences / recommended follow-ups (each a separate authorization)

1. **Dais entitlement gap (SW-02 write):** to make the demo operator Dais-capable, add `access:dais` (and
   `access:workbench` if intended) to the `GovernmentUsers.Permissions` array for `admin@terrafusionmarket.com`.
   This is a **data mutation** — needs explicit SW-02 authorization; not performed here. Alternatively, accept
   that Dais is intentionally un-entitled in the demo and disclose it.
2. **Situs/legal completeness (disclosure):** the 100%-null `SitusAddress`/`LegalDescription` should be surfaced
   honestly wherever parcel detail is shown (WorkbenchSourceBadge "partial"/unavailable), or backfilled from the
   legacy source in a future sync WO. Demo remains SAFE with disclosure.

## Disposition
All five SW-03 checks **COMPLETE** (read-only). Quarantine figures corroborated; two new data-completeness
findings recorded (situs/legal null, operator not Dais-entitled). No writes performed. Credential used in-memory
only and never persisted.
