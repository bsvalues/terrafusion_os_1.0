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

## Evidence Fields

| Check | Expected | Actual | Status |
|---|---|---|---|
| Cowlitz environment starts clean | healthy | — | PENDING |
| Cowlitz → Benton denied | 403 | — | PENDING |
| Cowlitz → Yakima denied | 403 | — | PENDING |
| Yakima → Cowlitz denied | 403 | — | PENDING |
| Benton → Cowlitz denied | 403 | — | PENDING |
