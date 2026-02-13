---
name: tf-county-pack-validator
triggers: ["county pack", "deployment validation", "manifest check"]
lane: governance
risk: read
status: operational
phase: 11
---

# TerraFusion County Pack Validator

**Validates County Pack structure, manifest schema, and deployment readiness**

## Purpose

The County Pack Validator ensures that county deployment packages conform to TerraFusion's Sovereign County Isolation architecture and are ready for production deployment.

## What It Validates

### 1. Manifest Schema Compliance

**Required Fields:**
- `countyId` - Must be lowercase alphanumeric (e.g., "benton")
- `countyFips` - Must be valid 5-digit US county FIPS code
- `countyName` - Full county name with state
- `version` - Semantic version (e.g., "1.0.0")
- `terrafusionVersion` - Compatible TerraFusion OS version
- `features` - Array of enabled features
- `databases` - At least one database (postgres or sqlite) must be enabled

**Optional Fields:**
- `integrations` - Third-party system integrations (Harris PACS, Tyler, etc.)
- `customizations` - County-specific UI/UX customizations
- `deployment` - Deployment strategy and health checks
- `compliance` - FISMA level, audit logging, encryption settings

### 2. File Structure Validation

**Mandatory Files:**
```
county-pack.json         # Manifest
config/environment.json  # Environment settings
scripts/deploy.sh        # Deployment script
README.md                # Documentation
```

**Optional Files:**
```
data/sample-properties.json  # Test data
scripts/rollback.sh          # Rollback procedures
scripts/validate.sh          # Post-deployment tests
```

### 3. Security Requirements

**No Hardcoded Secrets:**
- ❌ FAIL: `"password": "secretpassword"`
- ✅ PASS: `"password": "${DB_PASSWORD}"`

All sensitive values must use `${ENV_VAR}` placeholders.

**Encryption Enforcement:**
- Database connections must use SSL/TLS
- Redis connections must use authentication
- API endpoints must use HTTPS in production

### 4. Integration Validation

**Harris PACS 9.0:**
- Must specify version ("9.0")
- Endpoint must use `${HARRIS_PACS_URL}` variable
- API key must use `${HARRIS_PACS_API_KEY}` variable

**Tyler Technologies:**
- Must specify product (Vision, Eagle, etc.)
- Endpoint must use environment variable

### 5. County Isolation Enforcement

**Database Schema:**
- Each county must have dedicated schema (e.g., `benton`, `pierce`)
- Schema name must match `countyId`

**Redis Keyspace:**
- Must use county-prefixed keys: `tf:{countyId}:`
- Example: `tf:benton:parcels:12345`

## Violation Codes

### TF_COUNTY_001_MISSING_MANIFEST
**Severity:** ERROR  
**Description:** `county-pack.json` file not found

**Example:**
```bash
$ tdc county validate pierce
❌ FAIL: county-pack.json not found in tools/dx/county-packs/pierce/
```

**Fix:** Create manifest file:
```bash
cp tools/dx/county-packs/benton/county-pack.json \
   tools/dx/county-packs/pierce/county-pack.json
```

---

### TF_COUNTY_002_INVALID_SCHEMA
**Severity:** ERROR  
**Description:** Manifest does not conform to JSON schema

**Example:**
```json
{
  "countyId": "BENTON",  // ❌ Must be lowercase
  "countyFips": "5005",  // ❌ Must be 5 digits (53005)
  "version": "1.0"       // ❌ Must be semver (1.0.0)
}
```

**Fix:**
```json
{
  "countyId": "benton",
  "countyFips": "53005",
  "version": "1.0.0"
}
```

---

### TF_COUNTY_003_MISSING_INTEGRATION
**Severity:** WARNING  
**Description:** Required integration not configured

**Example:**
```json
{
  "integrations": {
    "harrisPacs": {
      "enabled": true,
      "endpoint": null  // ❌ Missing endpoint
    }
  }
}
```

**Fix:**
```json
{
  "integrations": {
    "harrisPacs": {
      "enabled": true,
      "version": "9.0",
      "endpoint": "${HARRIS_PACS_URL}"
    }
  }
}
```

---

### TF_COUNTY_004_HARDCODED_SECRET
**Severity:** ERROR  
**Description:** Secrets hardcoded in configuration files

**Example:**
```json
{
  "databases": {
    "postgres": {
      "password": "MySecretPassword123"  // ❌ Hardcoded
    }
  }
}
```

**Fix:**
```json
{
  "databases": {
    "postgres": {
      "password": "${POSTGRES_PASSWORD}"  // ✅ Environment variable
    }
  }
}
```

---

### TF_COUNTY_005_INVALID_FIPS
**Severity:** ERROR  
**Description:** Invalid county FIPS code format or value

**Example:**
```json
{
  "countyFips": "12345"  // ❌ Not a valid US county FIPS
}
```

**Fix:** Use correct 5-digit FIPS code:
- Format: `{state_fips}{county_fips}`
- Example: `53005` = Washington (53) + Benton County (005)
- Reference: [US Census FIPS Codes](https://www.census.gov/library/reference/code-lists/ansi.html)

---

### TF_COUNTY_006_MISSING_DATABASE
**Severity:** ERROR  
**Description:** No database configuration found

**Example:**
```json
{
  "databases": {
    "postgres": { "enabled": false },
    "sqlite": { "enabled": false }  // ❌ At least one must be enabled
  }
}
```

**Fix:**
```json
{
  "databases": {
    "postgres": {
      "enabled": true,
      "host": "${POSTGRES_HOST}",
      "schema": "benton"
    }
  }
}
```

---

### TF_COUNTY_007_NO_SCHEMA_ISOLATION
**Severity:** ERROR  
**Description:** Database schema does not match countyId

**Example:**
```json
{
  "countyId": "benton",
  "databases": {
    "postgres": {
      "schema": "public"  // ❌ Must be "benton"
    }
  }
}
```

**Fix:**
```json
{
  "countyId": "benton",
  "databases": {
    "postgres": {
      "schema": "benton"  // ✅ Matches countyId
    }
  }
}
```

---

### TF_COUNTY_008_MISSING_REQUIRED_FILE
**Severity:** ERROR  
**Description:** Required file missing from County Pack

**Example:**
```bash
$ tdc county validate pierce
❌ FAIL: scripts/deploy.sh not found
```

**Fix:** Create required file:
```bash
cp tools/dx/county-packs/benton/scripts/deploy.sh \
   tools/dx/county-packs/pierce/scripts/deploy.sh
```

## TDC Commands

### Validate County Pack

```bash
# Validate County Pack structure and manifest
tdc county validate benton

# Verbose output with detailed violations
tdc county validate benton --verbose

# JSON output for CI integration
tdc county validate benton --json
```

**Output (PASS):**
```
🏛️  Validating Benton County Pack...

✅ Manifest schema: VALID
✅ Required files: ALL PRESENT
✅ Security: NO HARDCODED SECRETS
✅ Integrations: CONFIGURED
✅ County isolation: ENFORCED

✅ PASS: County Pack is deployment-ready

Contract: .terrafusion/contracts/county-pack-benton-20260213T143000.json
```

**Output (FAIL):**
```
🏛️  Validating Pierce County Pack...

❌ Manifest schema: INVALID
   - TF_COUNTY_005_INVALID_FIPS: FIPS code "12345" is not valid

❌ Security: HARDCODED SECRETS FOUND
   - TF_COUNTY_004_HARDCODED_SECRET: Password hardcoded in config/environment.json

❌ FAIL: County Pack has 2 errors, 0 warnings

Contract: .terrafusion/contracts/county-pack-pierce-20260213T143000.json
```

### Deploy County Pack

```bash
# Dry-run deployment (default)
tdc county deploy benton

# Execute actual deployment
tdc county deploy benton --execute

# Skip validation (not recommended)
tdc county deploy benton --execute --skip-validation
```

### List County Packs

```bash
# List all available County Packs
tdc county list

# Output:
# Available County Packs:
#   - benton   (Benton County, WA)   [DEPLOYED]
#   - pierce   (Pierce County, WA)   [NOT DEPLOYED]
#   - king     (King County, WA)     [NOT DEPLOYED]
```

### Show County Pack Info

```bash
# Show detailed County Pack information
tdc county info benton

# Output:
# County Pack: Benton County, WA
# County ID: benton
# FIPS Code: 53005
# Version: 1.0.0
# Status: DEPLOYED
# Deployed At: 2026-02-10T15:30:00Z
# Deployed By: admin@terrafusion.gov
#
# Features:
#   - property-assessment
#   - tax-levy
#   - parcel-management
#   - harris-pacs-integration
#
# Integrations:
#   - Harris PACS 9.0 (ACTIVE)
#   - PostgreSQL (benton schema)
#   - Redis (tf:benton: keyspace)
```

## Contract Output

Validation results are written to `.terrafusion/contracts/county-pack-{countyId}-{timestamp}.json`:

**Example (PASS):**
```json
{
  "skillName": "tf-county-pack-validator",
  "contractVersion": "1.0.0",
  "status": "PASS",
  "countyId": "benton",
  "countyName": "Benton County, WA",
  "countyFips": "53005",
  "version": "1.0.0",
  "validatedAt": "2026-02-13T14:30:00Z",
  "violations": [],
  "summary": {
    "totalChecks": 8,
    "passed": 8,
    "errors": 0,
    "warnings": 0
  }
}
```

**Example (FAIL):**
```json
{
  "skillName": "tf-county-pack-validator",
  "contractVersion": "1.0.0",
  "status": "FAIL",
  "countyId": "pierce",
  "countyName": "Pierce County, WA",
  "countyFips": "53053",
  "version": "1.0.0",
  "validatedAt": "2026-02-13T14:35:00Z",
  "violations": [
    {
      "code": "TF_COUNTY_004_HARDCODED_SECRET",
      "severity": "ERROR",
      "message": "Hardcoded secret found in config/environment.json",
      "location": "config/environment.json:15",
      "field": "databases.postgres.password"
    },
    {
      "code": "TF_COUNTY_003_MISSING_INTEGRATION",
      "severity": "WARNING",
      "message": "Harris PACS integration enabled but endpoint not configured",
      "location": "county-pack.json:45",
      "field": "integrations.harrisPacs.endpoint"
    }
  ],
  "summary": {
    "totalChecks": 8,
    "passed": 6,
    "errors": 1,
    "warnings": 1
  }
}
```

## Integration with Evidence Pack

County Pack validation contracts integrate with Phase 7 Evidence Pack:

```bash
# Build evidence pack before PR merge
tdc evidence build --pr=123

# Evidence pack includes county validation if County Pack files changed
cat .terrafusion/evidence-pack-pr123.json
```

**Evidence Pack Output:**
```json
{
  "contracts": [
    {
      "lane": "governance",
      "skill": "tf-county-pack-validator",
      "status": "PASS",
      "path": ".terrafusion/contracts/county-pack-benton-20260213T143000.json"
    }
  ]
}
```

## Best Practices

1. **Validate Early:** Run `tdc county validate` before committing changes
2. **Use Benton as Template:** Benton County Pack is the reference implementation
3. **Never Hardcode Secrets:** Always use `${ENV_VAR}` placeholders
4. **Test Before Deploy:** Always run dry-run deployment first
5. **Document Integrations:** Add integration notes to County Pack README
6. **Version Bumps:** Increment version on every manifest change
7. **Schema Isolation:** Enforce schema = countyId for database isolation

## Related Documentation

- [County Pack Standard](../../../docs/dev/COUNTY_PACK_STANDARD.md)
- [Benton County Deployment Guide](../../county-packs/benton/README.md)
- [Sovereign County Isolation Architecture](../../../docs/architecture/COUNTY_ISOLATION.md)
- [TDC County Command Reference](../../../tools/tdc/cli/README.md#county)

---

**Lane:** Governance  
**Risk:** Read  
**Status:** Operational (Phase 11)  
**TDC Command:** `tdc county validate <pack-name>`
