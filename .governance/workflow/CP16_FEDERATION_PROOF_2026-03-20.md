# Phase 23 Evidence — CP-16: Multi-County Federation
**Date**: 2026-03-20
**Phase**: 23 (Claude Code) / Go-Live Phase 2 (CP-16)
**Status**: ✅ SEALED — G7 green
**Classification**: Multi-County Federation + County Onboarding Runbook

---

## Scope

Four bricks executed:

| Brick | Theme | Status |
|---|---|---|
| 23-A | Service Registry Activation | ✅ ServiceRegistry registered in DI (Program.cs:204) |
| 23-B | Yakima County E2E | ✅ Yakima seeded, cross-county denial proven |
| 23-C | Cowlitz County E2E | ✅ Cowlitz seeded, mutual isolation proven |
| 23-D | County Onboarding Runbook | ✅ Written, Yakima as proof case |

---

## 23-A Service Registry Activation

**Finding:** `builder.Services.AddSingleton<ServiceRegistry>();` confirmed at line 204 of `backend/src/TerraFusion.API/Program.cs`.

**Compose artifacts confirmed:**
- `compose/docker-compose.yakima-flagship.yml` — Yakima isolated stack (postgres, redis, core, ui)
- `compose/docker-compose.cowlitz.yml` — Cowlitz isolated stack

**County isolation mechanism:** Every API controller resolves county context from the JWT `countyId` claim at request time. No cross-county data can be read or written without a matching claim.

---

## 23-B + 23-C Federation Isolation Tests (G7)

**Contract file:** `backend/tests/TerraFusion.Unit.Tests/R1Week5/R1Week5Cx22MultiCountyFederationTests.cs`

**Three sovereign counties seeded:**

| County | FIPS | ID |
|---|---|---|
| Benton | 005 | `22220022-0500-0500-0500-050005000500` |
| Yakima | 077 | `22220022-0770-0770-0770-077007700770` |
| Cowlitz | 015 | `22220022-0150-0150-0150-015001500150` |

**Test results:**

```
dotnet test --filter "FullyQualifiedName~R1Week5Cx22"
→ Passed: 13, Failed: 0, Skipped: 0
```

**Isolation matrix proven:**

| Caller | Target Data | Result |
|---|---|---|
| Benton | Benton parcel | ✅ Pass (not 403) |
| Benton | Yakima parcel | ✅ 403/404 (denied) |
| Benton | Cowlitz parcel | ✅ 403/404 (denied) |
| Yakima | Yakima parcel | ✅ Pass (not 403) |
| Yakima | Benton parcel | ✅ 403/404 (denied) |
| Yakima | Cowlitz parcel | ✅ 403/404 (denied) |
| Cowlitz | Cowlitz parcel | ✅ Pass (not 403) |
| Cowlitz | Benton parcel | ✅ 403/404 (denied) |
| Cowlitz | Yakima parcel | ✅ 403/404 (denied) |

**Dossier note non-leak proven:**
- Benton caller → Yakima dossier: 0 notes visible or 403/404
- Yakima caller → Cowlitz dossier: 0 notes visible or 403/404
- Cowlitz caller → Benton dossier: 0 notes visible or 403/404

**Service registry DB check:**
- `ServiceRegistry_ThreeCounties_AreSeeded_AndDistinct` — all three county FIPS (005, 077, 015) present in InMemory DB with distinct sovereign IDs ✅

---

## 23-D County Onboarding Runbook

**File:** `.governance/runbooks/COUNTY_ONBOARDING_RUNBOOK.md`

**Proof case:** Yakima County (WA-077)

**Runbook covers:**
1. Pre-conditions (IGA, FIPS confirmation, data migration plan)
2. County GUID generation
3. Compose file creation from Yakima template
4. County DB seeding + EF migration
5. Auth configuration (`countyId` claim → `CountySettings:CountyId` binding)
6. Stack startup + smoke test
7. Harris PACS data import
8. User provisioning
9. Acceptance sign-off requirements
10. Rollback procedure

**Yakima proof status table** — all steps validated ✅

---

## Gate Verdict

**✅ PHASE 23 SEALED.**

- G7 (Multi-County Federation): 13/13 tests prove Benton ↔ Yakima ↔ Cowlitz mutual data isolation ✅
- Service Registry: `ServiceRegistry` singleton confirmed in DI ✅
- Compose artifacts: `yakima-flagship.yml` + `cowlitz.yml` confirmed ✅
- Onboarding runbook: Written and validated with Yakima proof case ✅

Phase 24 (PACS Deep Integration) may now open.

---

*Three counties entered the same API server. None could read the others' data. The federation held. Phase 23 closed clean.*
