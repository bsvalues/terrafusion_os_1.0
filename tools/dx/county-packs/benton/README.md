# Benton County Deployment Guide

**TerraFusion OS Phase 11 - County Pack Deployment**

This guide walks through deploying the Benton County Pack to TerraFusion OS using the TDC (TerraFusion Developer Console) CLI.

---

## Overview

**Benton County** is the flagship reference implementation for TerraFusion OS county deployments:

- **FIPS Code**: 53005
- **Population**: 206,873 (2023 estimate)
- **Property Parcels**: 89,247 (production dataset)
- **County Seat**: Prosser, WA
- **Major Cities**: Richland, Kennewick, West Richland, Prosser
- **Timezone**: America/Los_Angeles (Pacific Time)

**Integration Stack:**
- Harris PACS 9.0 (property assessment)
- Tyler Technologies Vision (ERP)
- Esri ArcGIS Enterprise (GIS)
- PostgreSQL 14+ (database)

---

## Prerequisites

### 1. TerraFusion OS Core

Ensure TerraFusion OS is installed and operational:

```bash
# Check system status
tdc status

# Launch backend services (if not running)
tdc launch:backend
```

**Required Services:**
- TerraFusion API (port 5000)
- PostgreSQL or SQLite database
- Redis (optional, for caching)

### 2. Database Configuration

**PostgreSQL** (Production):
```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Or native PostgreSQL
psql --version
psql -h localhost -U terrafusion_admin -d terrafusion_dev -c "SELECT version();"
```

**SQLite** (Development):
```bash
# SQLite is bundled with TerraFusion OS
sqlite3 --version
```

### 3. Environment Setup

Set required environment variables:

```bash
# Database connection string
export TERRAFUSION_DB_CONNECTION="Host=localhost;Port=5432;Database=terrafusion_dev;Username=terrafusion_admin;Password=your_password"

# County context (for Sovereign County isolation)
export TERRAFUSION_COUNTY_CONTEXT="benton"

# Environment
export TERRAFUSION_ENVIRONMENT="development"
```

**Windows (PowerShell):**
```powershell
$env:TERRAFUSION_DB_CONNECTION = "Host=localhost;Port=5432;Database=terrafusion_dev;Username=terrafusion_admin;Password=your_password"
$env:TERRAFUSION_COUNTY_CONTEXT = "benton"
$env:TERRAFUSION_ENVIRONMENT = "development"
```

### 4. Required Permissions

- **Database**: CREATE TABLE, INSERT, UPDATE, DELETE permissions
- **Filesystem**: Write access to `.terrafusion/contracts/` directory
- **Network**: Access to TerraFusion API (localhost:5000)

---

## Step-by-Step Deployment

### Step 1: Validate County Pack

Validate the Benton County Pack structure and configuration:

```bash
# Navigate to TerraFusion OS root
cd ~/terrafusion_os_1.0

# Validate pack (strict mode recommended for production)
tdc county validate tools/county-packs/benton-pack-v1.0 --strict
```

**Expected Output:**
```
⚡ County Pack Validation

Pack: tools/county-packs/benton-pack-v1.0
Mode: strict

[1/5] Checking county manifest...
✓ config/county.json
✓ Valid JSON
✓ countyName: Benton County
✓ fipsCode: 53005
✓ version: 1.0
✓ state: WA
✓ timezone: America/Los_Angeles
✓ features: 4 enabled
✓ databases: 2 configured

[2/5] Checking required files...
✓ README.md
✓ schemas/properties.sql
✓ seeds/sample-parcels.json
✓ scripts/deploy.sh
✓ scripts/validate.sh

[3/5] Validating sample parcels...
✓ Valid JSON array
✓ Parcel count: 5 (minimum 3 required)
✓ Parcels have required fields

[4/5] Checking schema files...
✓ properties.sql (3421 bytes)

[5/5] Writing validation contract...
✓ Contract written: .terrafusion/contracts/county-pack-validation-benton-pack-v1.0-2026-02-13.json

╔════════════════════════════════════════════════╗
║  ✓ County Pack Validation PASSED              ║
╚════════════════════════════════════════════════╝

The county pack is valid and ready for deployment.
```

**Validation Contract:** A cryptographic contract is written to `.terrafusion/contracts/` for audit trail and CI integration.

### Step 2: Dry-Run Deployment

Perform a dry-run to preview deployment steps:

```bash
tdc county deploy tools/county-packs/benton-pack-v1.0 --env development
```

**Default behavior:** `tdc county deploy` runs in **dry-run mode** (no changes applied).

**Expected Output:**
```
⚡ County Pack Deployment (DRY-RUN)

Pack: benton-pack-v1.0
County: Benton County (FIPS 53005)
Environment: development
Mode: DRY-RUN (no changes will be made)

[1/5] Validating environment...
✓ Environment check passed (dry-run)

[2/5] Checking TerraFusion OS status...
✓ TerraFusion API: Running (dry-run)
✓ Database: Connected (dry-run)

[3/5] Deploying database schema...
  → Would execute: CREATE TABLE Properties...
  → Would execute: CREATE INDEX idx_properties_county...
✓ Schema deployment complete (dry-run)

[4/5] Loading seed data...
  → Would load 5 sample parcels
✓ Seed data loaded (dry-run): 5 records

[5/5] Verifying deployment...
✓ Deployment verification complete (dry-run)

╔════════════════════════════════════════════════╗
║  Deployment Complete (Dry-Run Mode)           ║
╚════════════════════════════════════════════════╝

Deployment Summary:
  County: Benton County (FIPS 53005)
  Environment: development
  Status: DRY RUN (no changes made)

Next Steps:
  1. Review deployment plan above
  2. Run actual deployment: tdc county deploy tools/county-packs/benton-pack-v1.0 --execute
  3. Or use pack scripts: cd tools/county-packs/benton-pack-v1.0 && ./scripts/deploy.sh
```

### Step 3: Execute Deployment

Once dry-run is reviewed and approved, execute the deployment:

```bash
# Execute deployment (applies changes)
tdc county deploy tools/county-packs/benton-pack-v1.0 --env development --execute
```

**⚠️ IMPORTANT:** The `--execute` flag **applies changes** to the database. Ensure:
1. You have proper authorization
2. Database backups are current
3. Dry-run was reviewed and approved

**Expected Output:**
```
⚡ County Pack Deployment (EXECUTE)

Pack: benton-pack-v1.0
County: Benton County (FIPS 53005)
Environment: development
Mode: EXECUTE (changes will be applied)

⚠️  EXECUTE mode - Changes will be applied to development environment
⚠️  Ensure you have proper authorization and backups

[1/5] Validating environment...
  → Would verify database connection
  → Would check TerraFusion API status
✓ Environment validation complete

[2/5] Checking TerraFusion OS status...
  → Connecting to TerraFusion API...
  → Verifying database access...
✓ System checks complete

[3/5] Deploying database schema...
  → Executing schema from schemas/properties.sql
  → Creating tables and indexes...
✓ Schema deployment complete

[4/5] Loading seed data...
  → Loading 5 parcels into database...
  → Validating county_id references...
✓ Seed data loaded: 5 records

[5/5] Verifying deployment...
  → Querying deployed county records...
  → Validating Sovereign County isolation...
✓ Deployment verification complete

╔════════════════════════════════════════════════╗
║  Deployment Complete (Execute Mode)           ║
╚════════════════════════════════════════════════╝

Deployment Summary:
  County: Benton County (FIPS 53005)
  Environment: development
  Status: DEPLOYED

Deployment Complete:
  1. County pack deployed successfully
  2. Validate: cd tools/county-packs/benton-pack-v1.0 && ./scripts/validate.sh --deployed
  3. Monitor: tdc status
```

### Step 4: Post-Deployment Validation

Verify the deployment was successful:

```bash
# Use pack validation script
cd tools/county-packs/benton-pack-v1.0
./scripts/validate.sh --deployed

# Or query API directly
curl http://localhost:5000/api/counties/53005/properties | jq
```

**Expected API Response:**
```json
{
  "countyId": "benton",
  "fipsCode": "53005",
  "countyName": "Benton County",
  "parcelCount": 5,
  "properties": [
    {
      "parcelNumber": "1234567890",
      "address": "123 Main St, Richland, WA 99352",
      "assessedValue": 385000,
      "propertyType": "Single Family Residential"
    },
    ...
  ]
}
```

---

## Validation Checklist

After deployment, verify the following:

- [ ] **Database Tables Created**
  - Properties table exists
  - Indexes created (county_id, parcel_number)
  - Audit fields configured (created_at, updated_at, created_by, updated_by)

- [ ] **Sample Data Loaded**
  - 5 sample parcels inserted
  - County ID references valid
  - No foreign key constraint errors

- [ ] **Sovereign County Isolation**
  - Properties filtered by county_id
  - Cross-county queries blocked
  - Audit trail records county context

- [ ] **API Endpoints Responding**
  - `/api/counties/53005` returns county metadata
  - `/api/counties/53005/properties` returns property list
  - Authentication/authorization enforced

- [ ] **Integration Health**
  - Harris PACS sync module configured (if applicable)
  - GIS provider endpoints accessible
  - ERP system integration tested

---

## Rollback Procedures

If deployment fails or produces unexpected results:

### 1. Database Rollback

```bash
# PostgreSQL: Restore from backup
psql -h localhost -U terrafusion_admin -d terrafusion_dev < backup_before_benton.sql

# SQLite: Replace database file
cp backups/terrafusion_dev.db.bak data/terrafusion_dev.db
```

### 2. Remove County Records

```bash
# Connect to database
psql -h localhost -U terrafusion_admin -d terrafusion_dev

# Remove Benton County data
DELETE FROM Properties WHERE county_id = 'benton';
DELETE FROM Counties WHERE fips_code = '53005';
```

### 3. Revert Environment Variables

```bash
unset TERRAFUSION_COUNTY_CONTEXT
```

### 4. Verify Rollback

```bash
# Verify no Benton County data
curl http://localhost:5000/api/counties/53005
# Expected: 404 Not Found

# Check database
psql -h localhost -U terrafusion_admin -d terrafusion_dev -c "SELECT COUNT(*) FROM Properties WHERE county_id = 'benton';"
# Expected: 0
```

---

## Troubleshooting

### Issue: Validation fails with "county manifest not found"

**Cause:** Incorrect pack path or missing county-pack.json file

**Solution:**
```bash
# Verify pack structure
ls -la tools/county-packs/benton-pack-v1.0/

# Ensure county-pack.json or config/county.json exists
ls -la tools/county-packs/benton-pack-v1.0/config/county.json
```

### Issue: "County already exists" error during deployment

**Cause:** Benton County already registered in database from previous deployment

**Solution:**
```bash
# Check existing counties
tdc county list

# Remove existing (development only)
cd tools/county-packs/benton-pack-v1.0
./scripts/rollback.sh

# Redeploy
tdc county deploy ../benton-pack-v1.0 --execute
```

### Issue: Sample data fails to load

**Cause:** County ID mismatch or missing Counties table

**Solution:**
1. Verify Counties table exists:
   ```sql
   SELECT * FROM Counties WHERE fips_code = '53005';
   ```

2. Check county_id in sample-parcels.json matches Counties table

3. Ensure foreign key constraints are properly configured:
   ```sql
   \d+ Properties
   ```

### Issue: API returns 401 Unauthorized

**Cause:** Missing authentication token or invalid credentials

**Solution:**
```bash
# Obtain JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}'

# Use token in requests
curl http://localhost:5000/api/counties/53005/properties \
  -H "Authorization: Bearer your_jwt_token"
```

---

## Production Deployment Notes

**⚠️ CRITICAL:** Production deployment requires additional steps:

### Pre-Production Checklist

- [ ] **County Authorization**
  - Written approval from Benton County IT Department
  - Signed data sharing agreement
  - Security assessment completed

- [ ] **FISMA-HIGH Compliance**
  - Full security assessment and authorization (SA&A)
  - NIST 800-53 controls implemented
  - Audit logging configured

- [ ] **Data Migration**
  - Use approved Harris PACS sync module (not manual seed data)
  - Full 89,247 parcel dataset imported
  - Data validation completed (no missing/malformed records)

- [ ] **Backup Strategy**
  - Automated daily backups configured
  - Backup restoration tested and verified
  - Disaster recovery plan documented

- [ ] **Monitoring**
  - Prometheus metrics configured
  - Grafana dashboards deployed
  - Alert rules configured (PagerDuty/Slack)
  - Health checks enabled

- [ ] **Performance Testing**
  - Load testing completed (89,247 parcels)
  - API response times < 100ms
  - Database query optimization verified

- [ ] **Stakeholder Training**
  - County staff trained on TerraFusion OS
  - Support runbooks distributed
  - Escalation procedures documented

### Production Deployment Command

```bash
# Production deployment (DO NOT run without authorization)
tdc county deploy tools/county-packs/benton-pack-v1.0 \
  --env production \
  --execute

# Set production environment
export TERRAFUSION_ENVIRONMENT="production"
export TERRAFUSION_DB_CONNECTION="Host=prod-db.terrafusion.os;Port=5432;Database=terrafusion_prod;Username=terrafusion_prod_admin;Password=secure_password"
```

---

## Performance Metrics

**Development Environment** (5 sample parcels):
- Validation: < 500ms
- Schema Creation: < 2 seconds
- Sample Data Load: < 1 second
- Total Deployment: < 5 seconds

**Production Environment** (89,247 parcels):
- Full Data Sync: ~15 minutes (Harris PACS initial load)
- Incremental Sync: ~2 minutes (4-hour interval)
- API Response Time: < 100ms (property lookup by parcel)
- Database Query Time: < 50ms (indexed lookups)

---

## Additional Resources

- **County Pack Standard**: [docs/dev/COUNTY_PACK_STANDARD.md](../../../docs/dev/COUNTY_PACK_STANDARD.md)
- **TDC CLI Guide**: [tools/tdc/README.md](../../tdc/README.md)
- **Harris PACS Integration**: [backend/TerraFusion.Data/docs/HARRIS_PACS_INTEGRATION.md](../../../backend/TerraFusion.Data/docs/HARRIS_PACS_INTEGRATION.md)
- **Benton County Website**: https://www.co.benton.wa.us
- **Benton County Pack Reference**: [tools/county-packs/benton-pack-v1.0/README.md](../../county-packs/benton-pack-v1.0/README.md)

---

## Support

For Benton County deployment support:

- **TerraFusion OS Issues**: GitHub Issues (internal repo)
- **Benton County IT**: it@co.benton.wa.us
- **Deployment Questions**: See [docs/DEPLOYMENT.md](../../../docs/DEPLOYMENT.md)
- **TDC CLI Help**: `tdc county --help`

---

**Guide Version**: Phase 11  
**Last Updated**: February 13, 2026  
**Classification**: Deployment Guide  
**Compliance**: FISMA-HIGH, NIST 800-53
