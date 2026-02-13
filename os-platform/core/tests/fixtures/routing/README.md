# Phase 12B Routing Test Fixtures

## Purpose
Deterministic DSN resolution and cross-county/cross-environment isolation testing for MCP PostGIS.

## Governance Contract

**Prime Directive:** Counties are sovereign tenants. No query may accidentally hit:
- Wrong county (Benton → Yakima)
- Wrong environment (staging → production)
- Ad-hoc DSN overrides (bypass County Pack governance)

## Fixture Schema

```typescript
interface RoutingFixture {
  county: string;                    // County slug (e.g., "benton")
  countyId: string;                  // Canonical ID (e.g., "wa-benton-053")
  environment: 'development' | 'staging' | 'production';
  dataSource: {
    type: 'postgresql';
    host: string;
    port: number;
    database: string;
    schema: string;
    connectionPool?: {
      min: number;
      max: number;
    };
    readReplica?: {               // Production only
      host: string;
      port: number;
    };
  };
  policy: {
    allowedRisks: ('read' | 'write' | 'ddl')[];
    requireApprovalFor: ('write' | 'ddl')[];
    auditLevel: 'standard' | 'elevated' | 'critical';
  };
  expectedDSNHash?: string;         // For valid fixtures only
  expectedError?: string;           // For invalid fixtures only
}
```

## Valid Fixtures (Positive Tests)

### benton-dev.json
- **County:** Benton (wa-benton-053)
- **Environment:** development
- **Database:** terrafusion_benton_dev (localhost:5432)
- **Policy:** Read-only, standard audit
- **DSN Hash:** a1b2c3d4e5f6g7h8

### benton-staging.json
- **County:** Benton (wa-benton-053)
- **Environment:** staging
- **Database:** terrafusion_benton_staging (staging-db.benton.terrafusion.gov:5432)
- **Policy:** Read + supervised writes, elevated audit
- **DSN Hash:** b2c3d4e5f6g7h8i9

### benton-production.json
- **County:** Benton (wa-benton-053)
- **Environment:** production
- **Database:** terrafusion_benton_prod (prod-db-primary.benton.terrafusion.gov:5432)
- **Policy:** Read + supervised writes/DDL, critical audit
- **Read Replica:** prod-db-replica.benton.terrafusion.gov:5432
- **DSN Hash:** c3d4e5f6g7h8i9j0

### yakima-dev.json
- **County:** Yakima (wa-yakima-077)
- **Environment:** development
- **Database:** terrafusion_yakima_dev (localhost:5433)
- **Policy:** Read-only, standard audit
- **DSN Hash:** d4e5f6g7h8i9j0k1

## Invalid Fixtures (Negative Tests)

### invalid-county-mismatch.json
- **Scenario:** Request Benton, DSN resolves to Yakima
- **Expected:** Reject with "County mismatch: requested benton but DSN resolved to yakima"
- **Purpose:** Prevent cross-county data leakage

### invalid-env-mismatch.json
- **Scenario:** Request staging, DSN resolves to production
- **Expected:** Reject with "Environment mismatch: requested staging but DSN resolved to production"
- **Purpose:** Prevent staging→prod accidents

## Deterministic Resolution Rules

1. **County/Env → DSN Mapping:** Same `{county, environment}` inputs MUST always resolve to the same DSN
2. **DSN Hash Stability:** DSN hash is `SHA256(host:port/database)` (first 16 chars)
3. **No Ad-Hoc Overrides:** Only County Pack manifests + env-specific overrides allowed
4. **Isolation Verification:** Resolver MUST validate DSN matches requested county/env

## Usage in Tests

```javascript
// Valid routing (should succeed)
const bentonDev = await resolveDataSource('benton', 'development');
assert.strictEqual(bentonDev.dsnHash, 'a1b2c3d4e5f6g7h8');

// Cross-county isolation (should throw)
assert.throws(() => {
  resolveDataSource('benton', 'development', { dsnOverride: 'yakima DSN' });
}, /County mismatch/);

// Environment isolation (should throw)
assert.throws(() => {
  resolveDataSource('benton', 'staging', { dsnOverride: 'prod DSN' });
}, /Environment mismatch/);
```

## Evidence Trail

Every DSN resolution generates a routing manifest:
```json
{
  "routingManifestVersion": "1.0.0",
  "county": "benton",
  "environment": "development",
  "dsnHash": "a1b2c3d4e5f6g7h8",
  "resolvedAt": "2026-02-13T12:00:00Z",
  "source": "county-pack",
  "manifestHash": "abc123def456"
}
```

Stored: `.terrafusion/routing-manifests/routing-{county}-{env}-{timestamp}.json`

## Test Coverage Goals

- ✅ Valid DSN resolution (4 fixtures × 1 test each = 4 tests)
- ✅ Cross-county isolation (1 test)
- ✅ Cross-environment isolation (1 test)
- ✅ DSN hash determinism (1 test)
- ✅ Manifest generation (1 test)
- ✅ Regression guards (2 tests: TypeScript compilation, exports)

**Total:** ~10 routing tests

---

**Classification:** Test Fixtures - Phase 12B Multi-County Routing  
**Last Updated:** February 13, 2026  
**Compliance:** County sovereignty + environment isolation + deterministic routing
