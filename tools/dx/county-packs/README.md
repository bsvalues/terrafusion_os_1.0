# TerraFusion County Packs

**Deployment templates for sovereign county instances of TerraFusion OS**

## Overview

County Packs are pre-configured deployment templates that package TerraFusion OS for specific county deployments. Each pack contains:

- **Configuration:** County-specific settings, database connections, integrations
- **Scripts:** Automated deployment, migration, and validation scripts
- **Data:** Sample/seed data for testing and initial setup
- **Documentation:** County-specific deployment guides

## Architecture

County Packs implement TerraFusion's **Sovereign County Isolation** model:

```
┌─────────────────────────────────────┐
│ TerraFusion OS Core                 │
│ (Multi-tenant kernel)               │
└─────────────────────────────────────┘
           │
           ├─────────────────┬─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌─────▼──────┐   ┌─────▼──────┐
    │ Benton Pack │   │ Pierce Pack│   │ King Pack  │
    │ (WA)        │   │ (WA)       │   │ (WA)       │
    └─────────────┘   └────────────┘   └────────────┘
         │                  │                  │
    ┌────▼───┐         ┌───▼────┐        ┌───▼────┐
    │ DB 1   │         │ DB 2   │        │ DB 3   │
    │ Redis 1│         │ Redis 2│        │ Redis 3│
    └────────┘         └────────┘        └────────┘
```

### Data Isolation Guarantees

- **Database:** Each county has dedicated PostgreSQL database or schema
- **API:** CountyId-scoped queries enforced at Entity Framework layer
- **Cache:** County-specific Redis keyspaces
- **Audit:** Complete trail of all cross-county queries (logged and blocked)

## Directory Structure

```
tools/dx/county-packs/
├── README.md                    # This file
├── schema.json                  # County Pack manifest schema
│
├── benton/                      # Benton County, WA
│   ├── county-pack.json         # Manifest (countyId, version, features)
│   ├── README.md                # Deployment guide
│   ├── config/
│   │   └── environment.json     # Environment settings (use ${ENV_VAR} placeholders)
│   ├── scripts/
│   │   ├── deploy.sh            # Main deployment script
│   │   ├── rollback.sh          # Rollback procedures
│   │   └── validate.sh          # Post-deployment validation
│   └── data/
│       └── sample-properties.json  # Test data (anonymized)
│
└── pierce/                      # Pierce County, WA (example)
    └── ...
```

## County Pack Manifest

Every County Pack must have a `county-pack.json` manifest:

```json
{
  "countyId": "benton",
  "countyFips": "53005",
  "countyName": "Benton County, WA",
  "version": "1.0.0",
  "terrafusionVersion": "1.0.0",
  "features": [
    "property-assessment",
    "tax-levy",
    "parcel-management"
  ],
  "databases": {
    "postgres": {
      "enabled": true,
      "schema": "benton"
    },
    "redis": {
      "enabled": true,
      "keyspace": "tf:benton:"
    }
  },
  "integrations": {
    "harrisPacs": {
      "enabled": true,
      "version": "9.0",
      "endpoint": "${HARRIS_PACS_URL}"
    }
  }
}
```

## Deployment Workflow

### 1. **Validate County Pack**

```bash
tdc county validate benton
```

Checks:
- ✅ Manifest schema compliance
- ✅ Required files present
- ✅ No hardcoded secrets
- ✅ Integration endpoints reachable

### 2. **Dry-Run Deployment**

```bash
tdc county deploy benton
```

Simulates deployment without making changes:
- Shows what would be created/modified
- Validates database migrations
- Checks for conflicts

### 3. **Execute Deployment**

```bash
tdc county deploy benton --execute
```

Runs full deployment:
1. Creates database schema
2. Runs migrations
3. Seeds initial data
4. Configures integrations
5. Runs post-deployment validation

### 4. **Verify Installation**

```bash
tdc county info benton
```

Shows deployment status and health checks.

## Creating a New County Pack

### Step 1: Create Directory Structure

```bash
mkdir -p tools/dx/county-packs/pierce/{config,scripts,data}
```

### Step 2: Copy Template

```bash
cp tools/dx/county-packs/benton/county-pack.json \
   tools/dx/county-packs/pierce/county-pack.json
```

### Step 3: Customize Manifest

Edit `county-pack.json`:
- Update `countyId`, `countyName`, `countyFips`
- Choose features (property-assessment, tax-levy, etc.)
- Configure integrations (PACS system, Tyler Technologies, etc.)

### Step 4: Add Configuration

Create `config/environment.json`:

```json
{
  "database": {
    "host": "${DB_HOST}",
    "port": "${DB_PORT}",
    "name": "${DB_NAME}"
  },
  "api": {
    "baseUrl": "${API_URL}",
    "timeout": 30000
  },
  "integrations": {
    "pacs": {
      "url": "${PACS_URL}",
      "apiKey": "${PACS_API_KEY}"
    }
  }
}
```

### Step 5: Create Deployment Script

See `benton/scripts/deploy.sh` for template.

### Step 6: Validate

```bash
tdc county validate pierce
```

## Integration with TDC Evidence Pack

County Pack validation contracts integrate with the Phase 7 Evidence Pack:

```bash
# Build evidence pack including county validation
tdc evidence build --pr=123

# Evidence pack includes county-pack-*.json contract
cat .terrafusion/contracts/county-pack-benton-*.json
```

## Security Requirements

### 1. **No Secrets in Manifests**

❌ **NEVER:**
```json
{
  "database": {
    "password": "secretpassword"  // ❌ Hardcoded secret
  }
}
```

✅ **ALWAYS:**
```json
{
  "database": {
    "password": "${DB_PASSWORD}"  // ✅ Environment variable
  }
}
```

### 2. **County Isolation Enforcement**

All database queries MUST include `CountyId` filter:

```csharp
// ✅ Correct - County-scoped query
var properties = await context.Properties
    .Where(p => p.CountyId == countyId)
    .ToListAsync();

// ❌ WRONG - Cross-county query
var properties = await context.Properties.ToListAsync();
```

### 3. **Audit Logging**

All County Pack deployments are logged:
- Who deployed (user)
- When deployed (timestamp)
- What changed (diff)
- Success/failure status

## Validation Rules

The `tf-county-pack-validator` skill enforces:

1. **Manifest Schema:** Must conform to `schema.json`
2. **Required Files:** `county-pack.json`, `config/environment.json`, `scripts/deploy.sh` must exist
3. **FIPS Code:** Must be valid 5-digit US county FIPS code
4. **Version:** Must follow semantic versioning (1.0.0)
5. **Features:** Must be from allowed list
6. **No Secrets:** No hardcoded passwords, API keys, or sensitive data
7. **Integration Endpoints:** Must use `${ENV_VAR}` placeholders

## Available County Packs

| County | FIPS | Status | Version | Features |
|--------|------|--------|---------|----------|
| Benton, WA | 53005 | ✅ Operational | 1.0.0 | Property assessment, tax levy, Harris PACS 9.0 |
| Pierce, WA | 53053 | 🚧 Coming Soon | - | Property assessment, tax levy |
| King, WA | 53033 | 🚧 Coming Soon | - | Property assessment, tax levy |

## Best Practices

1. **Start with Benton:** Use Benton County Pack as reference template
2. **Validate Early:** Run `tdc county validate` before deployment
3. **Dry-Run First:** Always run dry-run deployment before execute
4. **Test with Sample Data:** Use anonymized test data for initial deployments
5. **Document Integrations:** Document all third-party system integrations
6. **Version Control:** Track County Pack changes in Git
7. **Backup Before Deploy:** Always backup database before deployment

## Troubleshooting

### Validation Fails

```bash
# Show detailed validation errors
tdc county validate benton --verbose
```

### Deployment Fails

```bash
# Check logs
tdc county logs benton

# Rollback deployment
cd tools/dx/county-packs/benton/scripts
./rollback.sh
```

### Integration Issues

```bash
# Test integration connectivity
tdc county test-integration benton --integration=harrisPacs
```

## Related Documentation

- [County Pack Standard](../../docs/dev/COUNTY_PACK_STANDARD.md) - Complete specification
- [Benton County Deployment Guide](benton/README.md) - Step-by-step instructions
- [TDC County Command Reference](../tdc/cli/README.md#county-commands) - CLI documentation
- [Sovereign County Isolation](../../docs/architecture/COUNTY_ISOLATION.md) - Architecture overview

---

**Classification:** Government Operating System Infrastructure  
**Last Updated:** 2026-02-13  
**Maintainer:** TerraFusion DX Team
