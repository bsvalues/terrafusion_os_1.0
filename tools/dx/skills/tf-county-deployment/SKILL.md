---
id: tf-county-deployment
name: County Deployment Templates
version: 1.0.0
ownerLane: ops
riskLevel: write-safe
triggers:
  - manual
  - deployment
inputs:
  - county-id
  - deployment-config
  - pacs-integration
outputs:
  - deployment-manifest
  - county-config
  - migration-plan
dependencies: []
tags: [deployment, county, ops, benton, government, pacs, onboarding]
---

# County Deployment Templates

Provides standardized deployment templates for onboarding Washington State counties to TerraFusion OS. Includes database configuration, Harris PACS integration, county-specific UI customization, and data migration planning.

## Supported Counties

| County | Status | Parcels | PACS Version | Integration |
|--------|--------|---------|--------------|-------------|
| Benton | Production | 89,247 | Harris 9.0 | Full sync |
| Clark | Planned | ~180,000 | Tyler Vision | Pending |
| Spokane | Planned | ~250,000 | Aumentum | Pending |
| King | Planned | ~750,000 | Custom | Pending |

## Deployment Architecture

```
County Deployment Package
├── config/
│   ├── county.json           # County-specific configuration
│   ├── appsettings.County.json  # .NET config overlay
│   └── sdui/                 # SDUI layout overrides
├── data/
│   ├── seed.sql              # Initial data seed
│   ├── migration-plan.json   # Data migration plan
│   └── pacs-mapping.json     # PACS field mapping
├── integration/
│   ├── pacs-connector.json   # PACS connection config
│   └── sync-schedule.json    # Sync schedule
└── validation/
    ├── smoke-tests.json      # Post-deployment smoke tests
    └── data-integrity.json   # Data integrity checks
```

## County Configuration Schema

```json
{
  "countyId": "benton",
  "countyName": "Benton County",
  "state": "WA",
  "fips": "53005",
  "timezone": "America/Los_Angeles",
  "database": {
    "provider": "postgresql",
    "connectionString": "Host=db.benton.terrafusion.gov;Database=terrafusion_benton",
    "schema": "benton",
    "isolationLevel": "sovereign"
  },
  "pacs": {
    "vendor": "harris",
    "version": "9.0",
    "endpoint": "https://pacs.benton.gov/api",
    "syncInterval": "15m",
    "fieldMapping": "data/pacs-mapping.json"
  },
  "features": {
    "propertyAssessment": true,
    "taxLevies": true,
    "citizenPortal": true,
    "gisIntegration": true,
    "appealProcessing": true,
    "reportGeneration": true
  },
  "compliance": {
    "fismaHigh": true,
    "dataRetention": "7y",
    "auditLevel": "verbose",
    "encryptionAtRest": true
  },
  "ui": {
    "theme": "government-dark",
    "logo": "/assets/benton-logo.png",
    "primaryColor": "#1e40af",
    "sduiOverrides": "config/sdui/"
  }
}
```

## Benton County Reference Implementation

Benton County (FIPS 53005) is the reference implementation:

- **89,247 parcels** with full property data
- **Harris PACS 9.0** bidirectional sync every 15 minutes
- **Sovereign data isolation** (schema-level separation)
- **FISMA-HIGH compliant** audit and encryption
- **Custom SDUI layouts** for county assessor workflow

### Key Data Tables
- `Properties` - 89,247 records with parcel IDs, addresses, legal descriptions
- `PropertyAssessments` - Annual assessment values
- `TaxLevies` - Tax levy rates and calculations
- `AuditLogs` - All data access logged per FISMA requirements

## Onboarding Workflow

1. **Discovery**: Identify county PACS vendor, data volume, custom requirements
2. **Configuration**: Generate county.json with database, PACS, and feature config
3. **Migration**: Plan data migration from existing PACS to TerraFusion schema
4. **Integration**: Configure PACS connector and sync schedule
5. **Customization**: Generate SDUI layouts for county-specific workflows
6. **Validation**: Run smoke tests and data integrity checks
7. **Go-Live**: Deploy with monitoring and rollback plan

## Usage

```bash
# Generate deployment package for a new county
tdc county init --county-id clark --pacs tyler-vision

# Validate existing county deployment
tdc county validate --county-id benton

# Show county deployment status
tdc county status
```
