# CP-16 Cowlitz County Proof

Date: 2026-03-19
Phase: Phase 3 — Multi-County Federation (Cowlitz, County #3)
Gate: G7 (Multi-County Evidence)
Status: PENDING

## Cowlitz Requirements (Roadmap Phase 3-C)

- `docker-compose.cowlitz.yml` brings up isolated Cowlitz environment
- Cross-county denial proof: Yakima session denied access to Cowlitz data and vice versa
- Cowlitz and Benton mutually isolated

## Isolation Matrix

| From Session | To County Data | Expected Result | Status |
|---|---|---|---|
| Cowlitz | Cowlitz | 200 (allowed) | PENDING |
| Cowlitz | Benton | 403 (denied) | PENDING |
| Cowlitz | Yakima | 403 (denied) | PENDING |
| Yakima | Cowlitz | 403 (denied) | PENDING |
| Benton | Cowlitz | 403 (denied) | PENDING |

## Proof Commands

```bash
# Start Cowlitz environment
docker-compose -f docker-compose.cowlitz.yml up -d

# Cross-county denial proofs
curl -H "Authorization: Bearer <cowlitz-jwt>" \
  http://localhost:${TF_API_PORT:-5046}/api/properties?countyId=BENTON_001
# Expected: 403

curl -H "Authorization: Bearer <cowlitz-jwt>" \
  http://localhost:${TF_API_PORT:-5046}/api/properties?countyId=YAKIMA_001
# Expected: 403

curl -H "Authorization: Bearer <yakima-jwt>" \
  http://localhost:${TF_API_PORT:-5046}/api/properties?countyId=COWLITZ_001
# Expected: 403
```

## Sovereignty Invariant

Every request must carry `countyId`. Any request that succeeds for a county it should not access
is a BLOCK_AND_ALERT event per sovereign.yaml zero-tolerance policy.
Shadow writes and cross-county leakage are unconditionally blocked.

## Static Verification (CP-16 scope)

Compose file structure verified:
- `compose/docker-compose.cowlitz.yml` ✅ exists
- Cowlitz containers use isolated `terrafusion_cowlitz` external network
- Each service carries `COUNTY_NAME: "Cowlitz County, WA"`, `COUNTY_CODE: "US-WA-COWLITZ"`, `COWLITZ_DEMO_MODE: "true"`
- Ports: `8020` (core), `3020` (ui) — distinct from Benton and Yakima ranges

Cross-county controller enforcement (CP-14 G3):
- `DaisController.RequireCountyAccessAsync()` → 401/403 on county mismatch — 7/7 tests ✅
- `PropertiesController.TryResolveCountyId()` → 400/403 on county mismatch — 7/7 tests ✅

Note: Cowlitz compose file uses hardcoded credentials (`terrafusion_cowlitz_secure_2024`) — flagged for CP-18 security sweep to move to env vars. Non-blocking for G7 contract verification.

## Evidence Fields

| Check | Expected | Actual | Status |
|---|---|---|---|
| Cowlitz compose file present | exists | ✅ exists | VERIFIED (static) |
| Network isolation wired | isolated network | ✅ isolated | VERIFIED (static) |
| County env vars set | COUNTY_NAME/CODE/MODE | ✅ set | VERIFIED (static) |
| Cowlitz → Benton denied (controller) | 403 | ✅ CP-14 proof | VERIFIED (static) |
| Cowlitz → Yakima denied (controller) | 403 | ✅ CP-14 proof | VERIFIED (static) |
| Yakima → Cowlitz denied (controller) | 403 | ✅ CP-14 proof | VERIFIED (static) |
| Benton → Cowlitz denied (controller) | 403 | ✅ CP-14 proof | VERIFIED (static) |
| Cowlitz environment starts clean | healthy | — | DEFERRED (CP-17 SRE) |
