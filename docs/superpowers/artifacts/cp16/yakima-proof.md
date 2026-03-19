# CP-16 Yakima County Proof

Date: 2026-03-19
Phase: Phase 3 — Multi-County Federation (Yakima, County #2)
Gate: G7 (Multi-County Evidence)
Status: PENDING

## Yakima Onboarding Requirements (Roadmap Phase 3-B + 3-D)

- `docker-compose.yakima-flagship.yml` brings up isolated Yakima environment
- Assessor journeys pass in Yakima context
- County boundary enforced: Benton data not visible to Yakima session
- County onboarding runbook validated for Yakima as proof case

## Isolation Contract

| Boundary | Check | Status |
|---|---|---|
| Yakima session reads only Yakima parcels | countyId filter applied at service + controller | PENDING |
| Benton data not returned in Yakima context | 0 cross-county results | PENDING |
| Yakima → Cowlitz denied | 403 on county mismatch | PENDING |

## Onboarding Runbook Steps

1. Config: create Yakima-specific `appsettings.Yakima.json` with CountyId
2. Deploy: `docker-compose -f docker-compose.yakima-flagship.yml up -d`
3. Health check: all services healthy in Yakima namespace
4. Assessor journey: Property Workbench loads Yakima parcel, tabs functional
5. Isolation proof: confirm zero Benton data visible in Yakima session
6. Cross-county denial: Yakima session requests Cowlitz resource → 403

## Proof Commands

```bash
# Start Yakima environment
docker-compose -f docker-compose.yakima-flagship.yml up -d

# Run Yakima assessor journey
dotnet test --filter "Yakima|CountyIsolation" --environment CountyId=YAKIMA_001

# Cross-county denial test
curl -H "Authorization: Bearer <yakima-jwt>" \
  http://localhost:${TF_API_PORT:-5046}/api/properties?countyId=BENTON_001
# Expected: 403
```

## Evidence Fields

| Step | Expected | Actual | Status |
|---|---|---|---|
| Yakima environment starts clean | healthy | — | PENDING |
| Assessor journey passes | all steps | — | PENDING |
| Benton data not visible | 0 results | — | PENDING |
| Cowlitz cross-request → 403 | 403 | — | PENDING |
