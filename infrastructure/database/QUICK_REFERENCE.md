# TerraFusion Production Databases - Quick Reference

## 🎯 The 5 Core Production Databases

| Database | Port | Purpose | Priority | Status |
|----------|------|---------|----------|--------|
| **TerraFlow_PRODUCTION** | 5435 | AI Workflow & Agent Orchestration | CRITICAL | 🟡 Ready for Deployment |
| **TerraFusionSync_PRODUCTION** | 5436 | Gov System Sync & Harris PACS | CRITICAL | 🟡 Ready for Deployment |
| **TerraFusionAssessor_PRODUCTION** | 5437 | CAMA Mass Appraisal | CRITICAL | 🟡 Ready for Deployment |
| **BCBSGISPRO_PRODUCTION** | 5438 | GIS Parcel Mapping | CRITICAL | 🟡 Ready for Deployment |
| **BSIncomeValuation_PRODUCTION** | 5439 | Income Valuation | HIGH | 🟡 Ready for Deployment |

## 🚀 Quick Start (3 Commands)

```bash
# 1. Check current status
python infrastructure/database/validate-production-databases.py

# 2. Deploy all 5 databases
python infrastructure/database/deploy-production-databases.py

# 3. Verify deployment
python infrastructure/database/validate-production-databases.py
```

## 📁 Created Files

### Deployment Tools
- ✅ `infrastructure/database/deploy-production-databases.py` - Automated deployment system
- ✅ `infrastructure/database/validate-production-databases.py` - Python validator
- ✅ `infrastructure/database/validate-production-databases.ps1` - PowerShell validator (requires psql)
- ✅ `infrastructure/database/PRODUCTION_DATABASES_README.md` - Complete documentation

### Generated Files (after deployment)
- `.env.production.databases` - Connection strings
- `deployment_report_*.json` - Deployment results
- `validation_report_*.json` - Validation results

## 🔗 Integration Points

### Backend .NET API
Each database gets its own `DbContext`:
- `TerraFlowDbContext` → TerraFlow_PRODUCTION
- `TerraFusionSyncDbContext` → TerraFusionSync_PRODUCTION
- `TerraFusionAssessorDbContext` → TerraFusionAssessor_PRODUCTION
- `BCBSGISProDbContext` → BCBSGISPRO_PRODUCTION
- `BSIncomeValuationDbContext` → BSIncomeValuation_PRODUCTION

### Connection String Format
```
postgresql://postgres:password@localhost:{PORT}/{DATABASE_NAME}?sslmode=require
```

## 📊 What Each Database Contains

### TerraFlow_PRODUCTION
- `workflows` - Workflow definitions
- `tasks` - Task queue
- `agents` - 1,008+ AI agents
- `states` - State management
- `transitions` - State transitions

### TerraFusionSync_PRODUCTION
- `sync_jobs` - Sync job definitions
- `sync_logs` - Operation logs
- `mapping_rules` - Data mapping
- `conflicts` - Conflict tracking
- `audit_trail` - Complete audit

### TerraFusionAssessor_PRODUCTION
- `properties` - Property records
- `assessments` - Assessment values
- `models` - Valuation models
- `neighborhoods` - Neighborhood data
- `sales` - Sales validation

### BCBSGISPRO_PRODUCTION
- `parcels` - Parcel boundaries
- `boundaries` - Legal boundaries
- `spatial_features` - GIS features
- `map_layers` - Map layers
- `coordinates` - Coordinate systems

### BSIncomeValuation_PRODUCTION
- `income_properties` - Income properties
- `rent_rolls` - Rent roll data
- `expenses` - Operating expenses
- `cap_rates` - Capitalization rates
- `valuations` - Valuation results

## 🛡️ Security Features

- ✅ County data isolation (`county_id` in all tables)
- ✅ Audit logging schema in every database
- ✅ UUID primary keys (uuid-ossp extension)
- ✅ PostGIS enabled (BCBSGISPRO)
- ✅ SSL/TLS required connections
- ✅ FISMA-High compliance ready

## 🎯 Next Steps

### Option 1: Deploy Now (PostgreSQL Running)
If PostgreSQL is already running:
```bash
python infrastructure/database/deploy-production-databases.py
```

### Option 2: Start PostgreSQL First
If PostgreSQL isn't running:
```bash
# Windows (as Administrator)
net start postgresql-x64-15

# Linux
sudo systemctl start postgresql

# Docker
cd infrastructure/database
docker-compose -f docker-compose-postgresql.yml up -d
```

### Option 3: Use Existing Docker Setup
```bash
cd infrastructure/database
docker-compose -f docker-compose-postgresql.yml up -d terrafusion-db-primary
```

## 📈 Current Status

**Validation Result**: PostgreSQL master not accessible (expected - needs configuration)

**Next Action**: 
1. Configure PostgreSQL credentials in environment
2. Run deployment script
3. Validate successful deployment

## 🏆 Success Criteria

Deployment is successful when validation shows:
```
🏆 ALL PRODUCTION DATABASES VALIDATED - GOVERNMENT. TRANSCENDED.

✅ READY - TerraFlow_PRODUCTION (5 tables, X MB)
✅ READY - TerraFusionSync_PRODUCTION (5 tables, X MB)
✅ READY - TerraFusionAssessor_PRODUCTION (5 tables, X MB)
✅ READY - BCBSGISPRO_PRODUCTION (5 tables, X MB)
✅ READY - BSIncomeValuation_PRODUCTION (5 tables, X MB)
```

---

**Government. Transcended.** 🏛️
