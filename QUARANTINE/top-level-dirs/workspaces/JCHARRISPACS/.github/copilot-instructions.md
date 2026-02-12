# Benton County PACS System - AI Agent Instructions

## Project Overview

Legacy Benton County Property Assessment and Collections System (PACS) workspace
containing:

- **6 SQL Server databases**: pacs_oltp (production), PACS_Training
  (backup/training), TA_AppSvr, CIAPS, Web_Internet_Benton, SSISDB
- **TrueAutomation PACS client** (.NET WinForms desktop application in
  `Database/PACSDrop/`)
- **SQL Database Projects** using Microsoft.Build.Sql SDK (0.1.12-preview)
- **Cross-database architecture** with synonyms and cross-database queries
- **ETL pipelines** via BentonCounty_DynLoader (.NET) and
  BuildingPermitLoader.ps1

## Architecture & Database Structure

### Database Architecture (Critical Understanding)

**Production vs Development Databases**:

- `pacs_oltp` - **Production PACS database** (now modeled in
  `DatabaseProjectpacs_oltp/`)
- `PACS_Training` - **Training/backup clone** of pacs_oltp structure (mirrors
  pacs_oltp schema)
- `CIAPS` - **Third-party add-on** (County Integrated Assessment & Permit
  System) for building permits
- `TA_AppSvr` - Tax assessor application server database
- `Web_Internet_Benton` - Web data staging database that **feeds the
  public-facing county website**
- `SSISDB` - SQL Server Integration Services catalog

**Key architectural insight**: Both `pacs_oltp` and `PACS_Training` have
identical schemas - pacs_oltp is production, PACS_Training is for
training/testing. Local development deploys both databases.

### Cross-Database Dependencies

**Synonyms** (CIAPS → PACS_Training/pacs_oltp):

- `CIAPS.dbo.building_permit` → `[pacs_oltp].[dbo].[building_permit]`
- `CIAPS.dbo.property` → `[pacs_oltp].[dbo].[property]`
- `CIAPS.dbo.property_val` → `[pacs_oltp].[dbo].[property_val]`
- `CIAPS.dbo.prop_building_permit_assoc` →
  `[pacs_oltp].[dbo].[prop_building_permit_assoc]`

**Direct cross-database queries** (examples):

- `CIAPS.permit.pProcess_BuildingImport` joins to `[pacs_oltp].[dbo].situs`
- Views in `PACS_Training.CO_ANTHONYV` query `[pacs_oltp].[dbo].pacs_system` for
  current appraisal year
- Web_Internet_Benton likely queries pacs_oltp for public property data

When modifying schemas, **always check**:

1. Synonym definitions in `DatabaseProjectCIAPS/dbo/Synonyms/`
2. Cross-database queries using `pacs_oltp` or `PACS_Training` prefixes
3. Whether changes affect both production (pacs_oltp) and training databases

## Critical Workflows

### Local Development Setup

```powershell
# 1. Start SQL Server (from pacs-server-benton/infra/docker)
docker compose -f compose.mssql.yml up -d

# 2. Wait for health check, then publish databases
pwsh ../../scripts/publish.ps1 -SqlServer "localhost,1433" -SaPassword "P@ssw0rd123!"
```

**Connection details**:

- Server: `localhost,1433`
- SA Password: `P@ssw0rd123!` (default, override with `$env:SA_PASSWORD`)
- Authentication: SQL Server authentication (sa user)

### Building & Publishing Databases

**Build process** (from `publish.ps1`):

1. Uses `dotnet build` with Microsoft.Build.Sql SDK
2. Generates `.dacpac` files in `bin/{BuildConfig}/` under each project
3. Uses `SqlPackage` CLI to deploy DACPACs to server

**Publish order matters** (dependency chain):

```
pacs_oltp → PACS_Training → TA_AppSvr → CIAPS → Web_Internet_Benton → SSISDB
```

**Why this order**: pacs_oltp is referenced by CIAPS synonyms and cross-database
queries, so it must be deployed first.

**Manual build example**:

```powershell
dotnet build DatabaseProjectCIAPS/DatabaseProjectCIAPS.sqlproj -c Release
SqlPackage /Action:Publish /SourceFile:CIAPS.dacpac /TargetServerName:localhost,1433 /TargetDatabaseName:CIAPS /TargetUser:sa /TargetPassword:P@ssw0rd123!
```

**Note on build warnings/errors**: Both `pacs_oltp` and `PACS_Training` projects
may show numerous build warnings/errors due to:

- Self-referencing views (e.g., views that reference `pacs_oltp.dbo.*` within
  the pacs_oltp database itself)
- External database references (e.g., `Benton_spatial_data`,
  `web_internet_benton`, `cnv_area_benton`)
- Cross-database query validations that SQL projects cannot resolve at build
  time

These warnings are **expected** and do not prevent successful `.dacpac`
generation and deployment. The runtime SQL Server resolves these references
correctly.

### ETL & Data Loading

**Building Permit Import Pipeline** (CIAPS third-party integration):

- **Source**: Network share `\\JCHARRISPACS\BuildingPermit_Import` (CSV files
  from external permit system)
- **Loader**: `Misc/BuildingPermitLoader.ps1` (BULK INSERT via sqlcmd to staging
  table)
- **Staging table**: `CIAPS.permit.building_import`
- **Processing**: `CIAPS.permit.pProcess_BuildingImport` stored procedure
  - Matches permits to properties via taxlot or address matching
  - Links to `pacs_oltp.dbo.property`, `pacs_oltp.dbo.situs` (address data)
  - Creates/updates `building_permit` records
- **Archives**: Processed files moved to
  `BuildingPermit_Import/archive_YYYYMMDD/` subdirectories
- **Frequency**: Automated job (see error logs in `Misc/log.log`)

**DynLoader (.NET application)** (CIAPS-specific tool):

- Config: `Misc/BentonCounty_DynLoader.dll.config` (assembly bindings for
  System.Data.SqlClient)
- Purpose: Azure SQL connectivity for CIAPS data synchronization to cloud
- **Important**: This is ONLY for CIAPS third-party system, NOT core PACS
  functionality
- Known issue: Requires Azure firewall rules for IP `50.52.46.117` (see
  `Misc/log.log`)

**Web Data Export** (Web_Internet_Benton → public website):

- `Web_Internet_Benton` serves as staging database for county property search
  website
- Data is populated from `pacs_oltp` via **stored procedures** (not SSIS or
  replication)
- Check `DatabaseProjectweb_internet_benton/dbo/StoredProcedures/` for data sync
  logic

## SQL Project Conventions

### File Organization

Each `DatabaseProject*` follows this structure:

```
DatabaseProject{Name}/
  ├── {Name}.sqlproj              # Microsoft.Build.Sql project
  ├── dbo/
  │   ├── Functions/
  │   ├── StoredProcedures/
  │   ├── Synonyms/               # Cross-database references
  │   └── Tables/
  ├── Security/                   # Users, roles, permissions
  └── Script.PreDeployment1.sql  # Pre-deployment scripts (often empty)
```

### SQL Project Properties

- **DSP**: `Microsoft.Data.Tools.Schema.Sql.Sql150DatabaseSchemaProvider` (SQL
  Server 2019)
- **ModelCollation**: `1033, CI` (US English, case-insensitive)
- **Build target**: Cleans `project.assets.json` in BeforeBuild to avoid stale
  references

### Naming Patterns

- **Stored procedures**: Prefixed with `p` (e.g., `pInsert_BuildingPermit`,
  `pProcess_BuildingImport`)
- **Schema-qualified objects**: Use two-part names like
  `[permit].[pInsert_BuildingPermit]`
- **Domain-specific schemas**: `permit`, `RPT` (reports), `CO_ANTHONYV` (user
  views)

## Security & Permissions

**Standard users**:

- `ciaps_prod` - Production access (db_owner on CIAPS, db_datareader on
  PACS_Training)
- `ciaps_dev` - Development login with restricted permissions
- `ciaps_azure_etl` - ETL service account (db_datareader)

Check `DatabaseProject*/Security/` for user definitions and role memberships.

## Common Pitfalls

1. **Synonym breakage**: Modifying tables in pacs_oltp/PACS_Training without
   checking CIAPS synonyms
2. **Publish order**: pacs_oltp must deploy BEFORE CIAPS (synonym dependencies)
3. **Cross-database queries**: SQL projects don't validate cross-db references
   at build time
4. **Case sensitivity**: Server uses case-insensitive collation, but file system
   is case-sensitive
5. **Azure connectivity**: DynLoader requires Azure SQL firewall rules
   configured
6. **Schema synchronization**: pacs_oltp and PACS_Training schemas should stay
   identical - changes to one should be applied to both
7. **CIAPS third-party nature**: CIAPS is a separate add-on system - changes
   here don't affect core PACS

## TrueAutomation PACS Client Application

**Desktop application** (.NET WinForms, .NET Framework 4.8):

- **Location**: `Database/PACSDrop/` contains full client deployment
- **Main executables**:
  - `PACS.NET.exe` - Main PACS client application
  - `PACS.ADMIN.exe` - Administrative interface
  - `PACS.QUERY.exe` - Query/reporting tool
- **Key libraries**: DevExpress UI controls (v20.2), TrueAutomation.\*
  assemblies, ESRI ArcGIS Runtime (10.2.6)
- **Config**: `App.config` defines WCF service endpoints for:
  - TaskService, SecurityService, WorkflowService
  - PACSService (main data access layer)
  - DocumentManagementService
- **Architecture**: Multi-tier WCF services with NHibernate ORM for data access
- **Note**: This is a legacy thick client - database changes must consider
  impact on client application queries

## Third-Party Integrations

### Matix GIS System

- **Location**: `Database/Matix/` (PDF documentation)
- **Purpose**: GIS integration for spatial/geographic property data
- **Integration**: ESRI ArcGIS Runtime used in PACS client for mapping features
- **External databases referenced**: `Benton_spatial_data` (contains spatial
  parcel data)

### Matrix Cost Tables

- **Location**: `Database/Matrix/` (Excel/CSV schedules)
- **Purpose**: Property valuation cost schedules for appraisal calculations
- **File format**: MatrixSchedule files with property improvement cost factors
- **Example**: `MatrixSchedule - 9-17-2019-00035748.csv` contains 2019 RES-MA
  cost matrix
  - Structure: CLASS (X-axis) vs AREA (Y-axis) with multiplicative factors
  - Quality grades: Chp, Low, Fair, Avg, Good, VGd, Exc
  - Used for automated property valuations based on improvement characteristics

### CIAPS (Third-Party Add-On)

- **Purpose**: County Integrated Assessment & Permit System for building permits
- **Databases**: CIAPS database with `permit` schema
- **DynLoader**: Azure sync tool (CIAPS-specific, NOT core PACS)
- **ETL**: Building permit imports from `\\JCHARRISPACS\BuildingPermit_Import`

## Developer Resources

### Query Samples & Documentation

- `Database/Query Samples/` - Example SQL queries for common tasks
  - Advanced queries, base query templates
  - Monitor queries (new construction, recalculation errors)
  - Situs/address queries, tax code area queries
- `Database/PACS Query Instructions/` - Query documentation
  - PACS Query.pdf, Query Instructions by John Kulseth.docx
- `Database/PDF's/` - System documentation
  - Admin Console User Guide, Comparable Grids in PACS.Net
  - Creating a Matrix Schedule, DOR Edits/Exports/Reports

## Key Files to Reference

- `pacs-server-benton/docs/README.md` - Quickstart guide
- `pacs-server-benton/scripts/publish.ps1` - Deployment orchestration
- `pacs-server-benton/infra/docker/compose.mssql.yml` - Local SQL Server config
- `pacs-server-benton/infra/mssql/init/01-create-dbs.sql` - Database
  initialization
- `DatabaseProjectCIAPS/permit/StoredProcedures/pProcess_BuildingImport.sql` -
  ETL logic
- `Misc/BuildingPermitLoader.ps1` - CSV import automation

## When Modifying Code

- **SQL schema changes**: Rebuild affected project, check dependent synonyms,
  test publish locally
- **Stored procedures**: Follow `p{Action}_{Entity}` naming, use schema prefixes
- **Cross-database logic**: Document dependencies in comments, update synonym
  definitions
- **Security changes**: Update both Security/\*.sql files AND deployment scripts
- **ETL scripts**: Test against `\\JCHARRISPACS\BuildingPermit_Import` share (or
  mock locally)

## Docker Environment

The `compose.mssql.yml` uses:

- **Image**: `mcr.microsoft.com/mssql/server:2022-latest`
- **Health check**: Uses sqlcmd with `-C` (trust server cert)
- **Volumes**: Persists data to `pacs-server-benton/infra/mssql/data`
- **Init scripts**: Auto-runs SQL files from `mssql/init/` on first start
