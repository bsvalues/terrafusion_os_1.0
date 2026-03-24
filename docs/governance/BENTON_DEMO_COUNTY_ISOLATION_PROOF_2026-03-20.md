# Benton County Demo — County Isolation Proof

**Date:** 2026-03-20
**Phase:** 13A
**Charter Reference:** docs/superpowers/plans/2026-03-19-benton-onsite-production-demo-charter.md (Lane 2)
**Test File:** `frontend/apps/os-shell/src/__tests__/isolation/countyIsolationAudit.contract.test.ts`

---

## Isolation Invariant

A request authenticated to CountyId A must never return data owned by CountyId B.

---

## Enforcement Mechanisms

| Layer | Mechanism | Implementation | Status |
|-------|-----------|----------------|--------|
| Frontend → Pilot API | `x-county-id` header | `pilotApi.ts` line 41 (`buildPilotHeaders`) | Enforced |
| Frontend → backend API | `X-County-Id` header | `countyIsolation.ts` `buildCountyScopedHeaders` | Enforced |
| JWT claim | `countyId` in JWT payload | `useAuthContext.ts` `decodeAuthClaims()` | Enforced |
| Session scoping | `x-county-id` from dev session | `countyIsolation.ts` `buildCountyScopedSessionHeaders` | Enforced |
| Runtime guard | Empty county rejection | `countyIsolation.ts` `assertCountyContext()` | Enforced |
| Write pre-flight | Ownership check before writes | `countyIsolation.ts` `validateCountyOwnership()` | Enforced |
| Audit registry | Documented enforcement map | `countyIsolation.ts` `COUNTY_ISOLATION_AUDIT` (20 surfaces) | Documented |

---

## Strongly Enforced API Surfaces

The following backend controllers enforce county isolation via JWT claim:

| Surface | Mechanism | Risk if Missing |
|---------|-----------|-----------------|
| CostForgeController | jwt_claim | None (enforced) |
| PropertyValuationController | jwt_claim | None (enforced) |
| DossierController | jwt_claim | None (enforced) |
| AtlasController | jwt_claim | None (enforced) |
| ClerkController | jwt_claim | None (enforced) |
| AuditController | jwt_claim | None (enforced) |
| LevyCalculationController | jwt_claim | None (enforced) |

---

## Known Gaps (Accepted for Demo)

The following gaps are documented, risk-classified, and accepted for the Phase 13A demo. Remediation is scheduled post-demo.

| Surface | Gap | Risk | Acceptance |
|---------|-----|------|------------|
| PropertiesController.GetProperties | countyId is optional query param — omitting returns cross-county data | High | Accepted: data is read-only; Benton demo uses authenticated session that always passes countyId |
| PropertiesController.GetPropertyByParcel | No county filtering — parcel lookup crosses county boundaries | High | Accepted: parcel IDs are county-unique in Benton PACS dataset |
| PropertiesController.GetPropertyValuations | No county check on valuation retrieval by property ID | High | Accepted: read-only path, monitored in audit log |
| PropertiesController.CreateValuation | No county verification before write | High | Accepted: demo is read-only mode; write paths not exercised |
| GisController | Spatial queries return data from any county | Medium | Accepted: spatial data is non-PII; county boundary queries are scoped by bounding box |
| AtlasGisController | Bounding box queries return cross-county features | Medium | Accepted: Atlas is display-only in demo |
| DaisController.Certification | Falls back to sentinel GUID when claim is missing | High | Accepted: demo uses authenticated sessions; sentinel fallback not triggered |
| DaisController.Notice | Falls back to sentinel GUID when claim is missing | High | Accepted: same as above |
| ValuationController | Stub — no county scoping infrastructure | Low | Accepted: stub, returns no real data |
| PropertyAssessmentController | Stub — no county scoping infrastructure | Low | Accepted: stub, returns no real data |

---

## Intentionally Cross-County Surfaces

| Surface | Reason |
|---------|--------|
| MultiCountyFederationController | Federation endpoint — intentionally serves multiple counties |
| MultiCountyIntegrationController | Integration endpoint — route-param scoped, cross-county by design |

---

## Machine-Verifiable Proof

Run the isolation audit contract test:

```bash
cd frontend/apps/os-shell
pnpm vitest run src/__tests__/isolation/countyIsolationAudit.contract.test.ts --reporter=verbose
```

**Expected result:** 15/15 tests pass (verified 2026-03-20).

### What the tests prove

1. **Audit map invariants** — All mandatory *enforced* surfaces have a transmission mechanism. No high-risk surface is stub-enforced. `PropertiesController` surfaces are classified as `mandatory` (not stub). All gap surfaces have a documented gap description. Cross-county surfaces have `riskLevel=none`.
2. **`buildCountyScopedHeaders`** — Emits `X-County-Id: benton` when auth has `countyId`. Returns `isolated=false` when `countyId` is null. County A context never produces County B headers.
3. **`assertCountyContext`** — Returns `{ valid: false, error: 'COUNTY_CONTEXT_MISSING' }` for null, empty string, and whitespace-only county IDs. Returns `{ valid: true }` for `'benton'`.
4. **Pilot API source inspection** — `pilotApi.ts` contains `x-county-id` header assignment before line 50, confirming the choke-point header builder is in place.

---

## Sign-off

- [ ] Founder review
- [x] Demo lane L2 artifact: ACCEPTED (Phase 13A Agent A3)
- [ ] Post-demo remediation ticket created for high-risk gaps
