# Benton County PACS System - Deep Dive Technical Documentation

## Executive Summary

The Benton County Property Assessment and Collection System (PACS) is a comprehensive legacy property tax management system built on:
- **TrueAutomation PACS** commercial platform (.NET Framework 4.8 WinForms thick client)
- **6 SQL Server databases** with complex cross-database architecture
- **Multi-tier WCF services** with NHibernate ORM
- **Third-party integrations** (CIAPS building permits, Matix GIS, Matrix cost tables)
- **ETL pipelines** for building permits, web data exports, and data imports

This document provides a comprehensive technical explanation of how PACS works from database to UI.

---

## 1. Core Database Architecture

### 1.1 Database Relationships

**6-Database Ecosystem:**
```
pacs_oltp (Production)
  ├── Referenced by: CIAPS (synonyms), Web_Internet_Benton, TA_AppSvr
  └── Mirrors: PACS_Training (backup/training clone)

PACS_Training (Training/Backup)
  └── Identical schema to pacs_oltp for testing

CIAPS (Building Permits)
  ├── Synonyms → pacs_oltp tables
  └── ETL imports from \\JCHARRISPACS\BuildingPermit_Import

TA_AppSvr (Tax Assessor App Server)
  └── Additional application logic

Web_Internet_Benton (Public Website Data)
  └── Staging database for county property search website

SSISDB (SQL Server Integration Services)
  └── ETL orchestration catalog
```

### 1.2 Core Entity Model

**Property Hierarchy:**
```
property (base property record)
  ├── prop_id (PK, INT) - Unique property identifier
  ├── prop_type_cd (FK) - Property type (real, personal, mobile home, etc.)
  ├── geo_id - Geographic/parcel ID (e.g., "123-456-789")
  ├── simple_geo_id - Normalized geo_id (spaces/dashes removed)
  └── state_cd (FK) - Property state code

  ├──> property_val (annual valuation records)
  │     ├── prop_id, prop_val_yr, sup_num (composite PK)
  │     ├── prop_val - Total property value
  │     ├── appraised_val - Appraised value
  │     ├── assessed_val - Assessed value (for tax calculation)
  │     ├── land_hstd_val/land_non_hstd_val - Land homestead/non-homestead
  │     ├── imprv_hstd_val/imprv_non_hstd_val - Improvement homestead/non-homestead
  │     ├── ag_use_val/ag_market - Agricultural use/market values
  │     ├── freeze_ceiling/freeze_yr - Tax freeze ceiling for seniors
  │     ├── legal_desc - Legal property description
  │     ├── abs_subdv_cd - Abstract subdivision code
  │     ├── hood_cd - Neighborhood code
  │     └── sup_num - Supplement number (0=main roll, >0=supplemental)
  │
  ├──> situs (property addresses)
  │     ├── prop_id, situs_id (composite PK)
  │     ├── primary_situs - Primary address flag
  │     ├── situs_num, situs_street, situs_city, situs_state, situs_zip
  │     └── situs_display (computed) - Formatted address string
  │
  ├──> owner (ownership records by year)
  │     ├── owner_tax_yr, sup_num, prop_id, owner_id (composite PK)
  │     ├── owner_id (FK → account.acct_id)
  │     ├── pct_ownership - Ownership percentage
  │     ├── hs_prop - Homestead property flag
  │     └── pct_imprv_hs, pct_land_hs - Homestead percentages
  │
  ├──> imprv (improvements/buildings)
  │     ├── prop_val_yr, sup_num, sale_id, prop_id, imprv_id (composite PK)
  │     ├── imprv_type_cd (FK) - Improvement type (residential, commercial, etc.)
  │     ├── imprv_val - Improvement value
  │     ├── base_val, calc_val, adjusted_val - Value calculation stages
  │     ├── yr_built, actual_year_built - Construction year
  │     ├── living_area_up - Living area (square feet)
  │     ├── economic_pct, physical_pct, functional_pct - Depreciation factors
  │     └── flat_val - Manual override value
  │
  │     └──> imprv_detail (improvement components)
  │           ├── prop_val_yr, sup_num, sale_id, prop_id, imprv_id, imprv_det_id (PK)
  │           ├── imprv_det_class_cd - Class (main, addition, outbuilding)
  │           ├── imprv_det_type_cd - Type (RES-MA, COM, etc.)
  │           ├── imprv_det_area - Square footage
  │           ├── unit_price - Cost per square foot
  │           ├── condition_cd - Physical condition
  │           └── depreciation_yr - Effective age for depreciation
  │
  └──> land_detail (land components)
        ├── prop_val_yr, sup_num, prop_id, land_id (composite PK)
        ├── land_class_cd - Land class (residential, agricultural, etc.)
        ├── land_type_cd - Land type (site, excess, etc.)
        ├── land_val - Land value
        └── land_size - Size in square feet or acres
```

**Account/Owner Model:**
```
account (people and entities)
  ├── acct_id (PK, INT) - Account identifier
  ├── first_name, last_name, file_as_name
  ├── confidential_flag - Public record suppression
  └── ref_id1 - External reference ID

  ├──> address (mailing addresses)
  │     ├── acct_id, addr_id (composite PK)
  │     ├── addr_type_cd (physical, mailing, etc.)
  │     └── primary_addr - Primary address flag
  │
  └──> owner (links accounts to properties by year)
```

**Billing/Collections Model:**
```
bill (tax bills)
  ├── bill_id (PK, also FK → trans_group)
  ├── prop_id, year, sup_num, owner_id
  ├── initial_amount_due, current_amount_due, amount_paid
  ├── effective_due_date - When payment is due
  ├── statement_id - Link to printed statement
  └── is_active - Active bill flag

  ├──> levy_bill (levy breakdown by taxing district)
  │     └── Detailed levy amounts by fund
  │
  └──> bill_payments_due (payment schedule)
        └── Half-payment due dates
```

---

## 2. Property Valuation Workflow

### 2.1 Value Calculation Pipeline

**Step 1: Cost Approach (Improvements)**
```sql
-- Simplified valuation logic flow:

1. imprv_detail record created:
   - imprv_det_area = 2000 sq ft
   - imprv_det_type_cd = 'RES-MA' (Residential Main)
   - condition_cd = 'AVG'
   - yr_built = 2010

2. Lookup Matrix cost tables:
   - Query Matrix schedules by imprv_det_type_cd
   - Find base unit_price for area/quality intersection
   - Example: $150/sq ft for 2000 sq ft, Average quality

3. Calculate depreciation:
   - depreciation_yr = 2024 - 2010 = 14 years
   - Lookup depreciation schedule
   - physical_pct = 10% (age-based)
   - economic_pct = 5% (market conditions)
   - functional_pct = 0% (no functional obsolescence)

4. Calculate values:
   - imprv_det_orig_val = 2000 × $150 = $300,000 (RCN)
   - dep_pct = 10% + 5% = 15%
   - imprv_det_calc_val = $300,000 × (1 - 0.15) = $255,000

5. Apply adjustments:
   - imprv_det_adj_factor (from mass appraisal runs)
   - imprv_det_adj_val = final adjusted value

6. Roll up to imprv table:
   - imprv_val = SUM(all imprv_detail.imprv_det_adj_val for this imprv_id)
```

**Step 2: Land Valuation**
```sql
-- Land detail calculation:

1. land_detail record:
   - land_size = 10,000 sq ft (0.23 acres)
   - land_class_cd = 'RES-1'
   - land_type_cd = 'SITE'

2. Lookup land schedule:
   - Query land_sched by land_class_cd
   - Find unit price per acre or sq ft
   - Example: $50,000/acre for RES-1

3. Calculate:
   - land_val = 0.23 acres × $50,000 = $11,500

4. Apply adjustments:
   - land_adj records (location, topography, etc.)
   - Final land_val updated
```

**Step 3: Property-Level Aggregation**
```sql
-- Stored procedure: RecalcProperty

UPDATE property_val SET
  imprv_hstd_val = (SELECT SUM(imprv_val) 
                    FROM imprv 
                    WHERE imprv.prop_id = property_val.prop_id 
                      AND imprv.prop_val_yr = property_val.prop_val_yr
                      AND imprv.imprv_homesite = 'Y'),
                      
  land_hstd_val = (SELECT SUM(land_val)
                   FROM land_detail
                   WHERE land_detail.prop_id = property_val.prop_id
                     AND land_detail.prop_val_yr = property_val.prop_val_yr),
                     
  prop_val = imprv_hstd_val + imprv_non_hstd_val + land_hstd_val + land_non_hstd_val,
  
  assessed_val = CASE 
    WHEN freeze_ceiling IS NOT NULL THEN freeze_ceiling  -- Senior freeze
    WHEN ag_use_val IS NOT NULL THEN ag_use_val          -- Agricultural use
    ELSE prop_val                                        -- Market value
  END
  
WHERE prop_val_yr = @year AND sup_num = @sup_num
```

### 2.2 Key Stored Procedures

**RecalcProperty** (`RecalcProperty.sql`)
- **Purpose**: Recalculates all values for a property (or list of properties)
- **Call chain**: 
  1. SQL wrapper validates parameters
  2. Calls `master..xp_RecalcProperty90` (extended stored procedure in TA_AppSvr)
  3. Extended SP orchestrates full calculation pipeline
- **Triggers**: Manual user action, mass appraisal runs, supplement creation

**CalculateTaxable** (`CalculateTaxable.sql`)
- **Purpose**: Calculates taxable values for property owner exemptions
- **Process**:
  1. Builds property lists by entity/exemption
  2. Applies exemption amounts
  3. Calculates per-owner taxable values
  4. Stores in `wash_prop_owner_val` table
- **Used for**: Tax bill calculation, reporting

**CalculatePOES** (`CalculatePOES.sql`)
- **Purpose**: "Property Owner Entity State" calculation
- **Calculates**: Percentage ownership, exemptions, special assessments per owner

---

## 3. Annual Appraisal Cycle

### 3.1 Timeline

```
January 1:
  - Assessment date (lien date)
  - Property ownership recorded (owner table)
  - Values established for tax year

January-April:
  - Mass appraisal calculations
  - Neighborhood trend analysis
  - Cost table updates (Matrix schedules)
  - Comparable sales analysis

May 1:
  - Appraisal notices mailed (appr_notice_prop_list)
  - Property owners can view proposed values

May-July:
  - Appeal period (arbitration table)
  - Informal reviews
  - ARB (Appraisal Review Board) hearings

August:
  - Certified roll finalized
  - Values locked for tax calculation

September-October:
  - Levy rates calculated (levy, levy_bill tables)
  - Tax statements generated (wa_tax_statement tables)

November-December:
  - Tax bills mailed
  - Payment collection begins
```

### 3.2 Supplement System

**Main Roll vs. Supplements:**
- **sup_num = 0**: Main annual roll (all properties)
- **sup_num > 0**: Supplemental changes mid-year
  - New construction completion
  - Ownership changes requiring proration
  - Split/merge parcels
  - Corrections/adjustments

**Supplement Workflow:**
```
1. Create supplement (sup_num assigned)

2. Copy property_val record:
   - FROM: (prop_id, year, 0)  -- main roll
   - TO:   (prop_id, year, sup_num)  -- supplement

3. Modify values in supplement record:
   - Update imprv_val (new construction value)
   - Set sup_cd (reason code: 'NEW', 'CHG', etc.)
   - Set sup_dt (effective date)

4. Recalculate supplement:
   - EXEC RecalcProperty @prop_id, @year, @sup_num

5. Accept supplement:
   - EXEC AcceptSuppProperty (creates supplemental bills)
   - Generates pro-rated tax bills based on effective date

6. Track in prop_supp_assoc:
   - Links properties to supplements
   - Status tracking
```

---

## 4. Client Application Architecture

### 4.1 TrueAutomation PACS Client

**Technology Stack:**
- **.NET Framework 4.8** (Windows Forms thick client)
- **DevExpress UI Controls v20.2** (grids, ribbons, docking, charts)
- **ESRI ArcGIS Runtime 10.2.6** (GIS mapping via Matix integration)
- **WCF Services** (Windows Communication Foundation)
- **NHibernate ORM** (Object-Relational Mapping)
- **Castle Windsor** (Dependency injection)
- **LeadTools** (Document imaging/OCR)

**Main Executables:**
```
PACS.NET.exe
  └── Main property assessment client
      - Property search and editing
      - Valuation worksheets
      - Appraisal methods (cost, income, sales comparison)
      - GIS integration
      - Reporting

PACS.ADMIN.exe
  └── Administrative interface
      - System configuration
      - User management
      - Code table maintenance
      - Security settings

PACS.QUERY.exe
  └── Query and reporting tool
      - Ad-hoc SQL queries
      - Custom report builder
      - Data exports
```

### 4.2 WCF Service Architecture

**Service Endpoints** (from `App.config`):

```xml
<!-- Core Services -->
PACSService (WSHttpBinding_IPACSService)
  - Primary data access layer
  - CRUD operations for all entities
  - Business logic enforcement
  - Timeout: 45 minutes (long-running operations)

SecurityService (WSHttpBinding_ISecurityService)
  - User authentication
  - Rights/permissions checking
  - Audit logging

WorkflowService (WSHttpBinding_IWorkflowService)
  - Windows Workflow Foundation integration
  - Multi-step business processes
  - Approval workflows

TaskService (WSHttpBinding_ITaskService)
  - Background task management
  - Job scheduling
  - Batch processing

DocumentManagementService (WSHttpBinding_IDocumentManagementService)
  - Document storage/retrieval
  - Image attachments
  - OCR processing
```

**Service-to-Database Flow:**
```
[PACS.NET.exe Client]
   ↓ (WCF wsHttpBinding, Windows Auth)
[PACSService.svc] (WCF Service Host)
   ↓ (NHibernate ORM)
[pacs_oltp Database]
```

**NHibernate Configuration:**
- **Lazy loading**: Related entities loaded on-demand
- **Session-per-request**: Database session lifecycle
- **Change tracking**: Automatic UPDATE statement generation
- **Caching**: Second-level cache for lookup tables

### 4.3 Client-Side Data Flow Example

**Opening a Property Record:**

```csharp
// 1. User searches for property by geo_id "123-456-789"
PropertySearchCriteria criteria = new PropertySearchCriteria {
    GeoId = "123-456-789"
};

// 2. Client calls PACSService via WCF
PACSServiceClient client = new PACSServiceClient();
PropertySearchResults results = client.SearchProperties(criteria);

// 3. Service queries database via NHibernate
// NHibernate generates:
//   SELECT p.*, pv.*, s.* 
//   FROM property p
//   LEFT JOIN property_val pv ON p.prop_id = pv.prop_id AND pv.prop_val_yr = 2024
//   LEFT JOIN situs s ON p.prop_id = s.prop_id AND s.primary_situs = 'Y'
//   WHERE p.geo_id = '123-456-789'

// 4. Results returned as PropertyDTO objects
Property property = results.Properties[0];

// 5. User opens property detail form
// Client lazy-loads related data as needed:
client.GetOwners(property.PropId, 2024);           // Owner records
client.GetImprovements(property.PropId, 2024, 0);  // Improvements
client.GetLandDetails(property.PropId, 2024, 0);   // Land details

// 6. User modifies improvement area
Improvement imprv = property.Improvements[0];
imprv.LivingAreaUp = 2500;  // Changed from 2000

// 7. User clicks "Recalc" button
client.RecalcProperty(property.PropId, 2024, 0);

// 8. Service calls RecalcProperty stored procedure
// Database recalculates all values

// 9. Client refreshes property values
property = client.GetProperty(property.PropId, 2024, 0);
// Display updated imprv_val, prop_val, etc.
```

---

## 5. ETL Pipelines and Data Integration

### 5.1 Building Permit Import (CIAPS Integration)

**Purpose**: Import building permit data from county permit system into CIAPS database, link to PACS properties

**Source**: `\\JCHARRISPACS\BuildingPermit_Import\*.csv` (network share)

**Pipeline:**

```powershell
# BuildingPermitLoader.ps1 - Scheduled task (nightly)

1. Scan network share for new CSV files

2. For each CSV:
   # BULK INSERT into staging table
   sqlcmd -S localhost -d CIAPS -E -Q "
     BULK INSERT permit.building_import
     FROM '\\JCHARRISPACS\BuildingPermit_Import\permit_20241101.csv'
     WITH (FIRSTROW = 2, FIELDTERMINATOR = ',', ROWTERMINATOR = '\n')
   "

3. Call stored procedure:
   EXEC permit.pProcess_BuildingImport
   
   # Inside stored procedure:
   - Match permits to properties via:
     a) simple_geo_id (taxlot number)
     b) situs address matching
   
   - Insert/update building_permit table
   - Create prop_building_permit_assoc linkage
   - Update building_permit_worksheet if needed

4. Archive processed file:
   Move-Item $csvFile "\\JCHARRISPACS\BuildingPermit_Import\archive_$(Get-Date -f yyyyMMdd)\"

5. Log results:
   # Errors logged to permit.building_permit_import_error
   # Summary written to Misc/log.log
```

**Key Tables:**
```
CIAPS.permit.building_import (staging)
  └── Raw CSV import data

CIAPS.dbo.building_permit (processed permits)
  ├── permit_num, issue_date, final_date
  ├── permit_type (residential, commercial, etc.)
  ├── valuation (permit valuation)
  └── status (active, finaled, expired)

pacs_oltp.dbo.prop_building_permit_assoc (property linkage)
  ├── prop_id (FK → property)
  └── permit_id (FK → building_permit via synonym)
```

**Cross-Database Synonyms** (CIAPS → pacs_oltp):
```sql
-- Defined in DatabaseProjectCIAPS/dbo/Synonyms/

CREATE SYNONYM [dbo].[building_permit]
FOR [pacs_oltp].[dbo].[building_permit];

CREATE SYNONYM [dbo].[property]
FOR [pacs_oltp].[dbo].[property];

CREATE SYNONYM [dbo].[prop_building_permit_assoc]
FOR [pacs_oltp].[dbo].[prop_building_permit_assoc];
```

### 5.2 Web Data Export (Public Website Feed)

**Purpose**: Export property data to Web_Internet_Benton for public property search website

**Target**: County website property lookup (public access)

**Process:**
```sql
-- Scheduled stored procedures in Web_Internet_Benton database

1. EXEC dbo.pExport_PropertyData
   - Queries pacs_oltp.dbo.property_val for current year
   - Filters out confidential properties
   - Anonymizes sensitive owner data
   - Writes to Web_Internet_Benton staging tables

2. EXEC dbo.pExport_SalesData
   - Exports recent sales from pacs_oltp.dbo.sale
   - Includes sale prices, dates, verification status

3. EXEC dbo.pExport_TaxData
   - Current year tax amounts by property
   - Levy rate information
   - Payment status (does NOT include owner names)

4. Web application queries Web_Internet_Benton:
   - Search by address, parcel number
   - Display assessed values, building characteristics
   - Show tax levy breakdown
   - Link to GIS map (Matix integration)
```

---

## 6. Third-Party Integrations

### 6.1 CIAPS (County Integrated Assessment & Permit System)

**Vendor**: Third-party add-on module

**Purpose**:
- Building permit tracking
- Code enforcement
- Planning/zoning integration
- Automated new construction monitoring

**Integration Points:**
```
CIAPS Database
  ├── Synonyms → pacs_oltp.dbo.property, building_permit
  ├── ETL: BuildingPermitLoader.ps1 (CSV imports)
  └── DynLoader: Azure SQL sync (CIAPS-specific, NOT core PACS)

DynLoader.exe (BentonCounty_DynLoader)
  - CIAPS-ONLY tool (not used for core PACS)
  - Syncs CIAPS data to Azure SQL Database
  - Requires Azure firewall whitelist (IP 50.52.46.117)
  - Config: Misc/BentonCounty_DynLoader.dll.config
```

**Data Flow:**
```
External Permit System
  ↓ (CSV export to network share)
\\JCHARRISPACS\BuildingPermit_Import\
  ↓ (BuildingPermitLoader.ps1)
CIAPS.permit.building_import
  ↓ (pProcess_BuildingImport SP)
CIAPS.dbo.building_permit
  ↓ (Synonym)
pacs_oltp.dbo.prop_building_permit_assoc
  ↓
PACS.NET.exe (display in property detail)
```

### 6.2 Matix GIS Integration

**Vendor**: Matix GIS product

**Documentation**: `Database/Matix/matix-504.pdf`

**Purpose**:
- GIS parcel mapping
- Spatial property visualization
- Address geocoding
- Map-based property search

**Integration**:
```
PACS.NET.exe
  └── ESRI ArcGIS Runtime 10.2.6
      └── Connects to spatial database: Benton_spatial_data
          ├── Parcel boundaries (geometry)
          ├── Tax code area boundaries
          └── Geographic features (roads, water, etc.)

User clicks "Map" button in property detail:
  1. Client queries gis_property_attributes table
  2. Retrieves parcel geometry from Benton_spatial_data
  3. Renders map in ArcGIS map control
  4. Overlays property boundaries, labels
```

**Key Tables:**
```
pacs_oltp.dbo.gis_property_attributes
  ├── prop_id (FK → property)
  ├── parcel_geometry (spatial data type)
  └── map_id (link to Benton_spatial_data)

Benton_spatial_data (external database)
  ├── Parcel polygons (GIS shapes)
  └── Attribute linkage to PACS via map_id
```

### 6.3 Matrix Cost Tables

**Purpose**: Property improvement cost schedules for automated valuation

**Location**: `Database/Matrix/*.csv` (Excel/CSV files)

**Structure**:
```
MatrixSchedule - 2019 RES-MA cost matrix
  - Rows: AREA (400, 600, 800, ..., 4000 sq ft)
  - Columns: CLASS (Low, Fair, Avg, Good, VGd, Exc)
  - Values: Multiplicative cost factors

Example: MatrixSchedule - 9-17-2019-00035748.csv
  AREA  | Low   | Fair  | Avg   | Good  | VGd   | Exc
  --------------------------------------------------
  400   | 0.85  | 0.90  | 1.00  | 1.10  | 1.25  | 1.50
  800   | 0.83  | 0.88  | 1.00  | 1.12  | 1.28  | 1.55
  1200  | 0.82  | 0.87  | 1.00  | 1.13  | 1.30  | 1.60
  ...
```

**Usage in Valuation:**
```sql
-- During imprv_detail calculation:

1. Lookup matrix by imprv_det_type_cd ('RES-MA')
2. Find row by imprv_det_area (1200 sq ft)
3. Find column by condition_cd ('Good')
4. Retrieve multiplier: 1.13
5. Apply to base cost:
   unit_price = base_unit_price × 1.13
```

**Matrix Loading:**
- Manual CSV import via PACS.ADMIN.exe
- Stored in `imprv_sched_matrix_assoc` table
- Versioned by effective year

---

## 7. Tax Calculation and Billing

### 7.1 Levy Calculation Process

**Levy**: Tax charged by each taxing district (county, city, school, etc.)

**Process:**
```
1. Certified taxable values (assessed_val) established

2. Taxing districts submit levy requests:
   levy table:
     - levy_cd (district identifier)
     - levy_yr (tax year)
     - levy_amt (total $ requested)
     - levy_rate (calculated: levy_amt / total_taxable_value)

3. Property assigned to tax areas:
   property_val.tax_area_id → tax_area
     └── tax_area_fund_assoc links to multiple levies

4. Calculate property tax:
   
   FOR EACH levy in property's tax area:
     levy_bill record created:
       - prop_id, owner_id, year
       - levy_cd (district)
       - taxable_value (owner's share of assessed_val)
       - levy_tax = (taxable_value / 1000) × levy_rate
   
   bill.initial_amount_due = SUM(all levy_bill.levy_tax)

5. Apply exemptions/deductions:
   - Senior freeze (freeze_ceiling in property_val)
   - Homeowner exemption (property_exemption table)
   - Special assessments added (property_special_assessment)

6. Generate tax statement:
   wa_tax_statement table:
     - statement_id, year, owner_id
     - Property list for this owner
     - Levy breakdown by district
     - Payment due dates
     - Escrow account info (if applicable)
```

### 7.2 Payment Processing

**Payment Flow:**
```
1. Payment received (counter, mail, online):
   
   payment table:
     - payment_id, payment_date, payment_amt
     - payment_method_cd ('CASH', 'CHECK', 'CC', 'ACH')
     - payment_source_cd ('COUNTER', 'MAIL', 'WEB')

2. Tender details:
   
   tender table:
     - payment_id (FK)
     - tender_type_cd
     - tender_amt
     - check_num, credit_card_num (last 4 digits), etc.

3. Apply to bills:
   
   payment_transaction_assoc:
     - payment_id (FK → payment)
     - trans_group_id (FK → bill via bill_id)
     - amount_applied
   
   UPDATE bill SET
     amount_paid = amount_paid + @amount_applied,
     current_amount_due = current_amount_due - @amount_applied

4. Distribution to funds:
   
   coll_transaction table:
     - payment_id, levy_cd, fund_cd
     - amount_collected
   
   Distributes payment across levy districts proportionally

5. Post to general ledger:
   
   fin_transaction table:
     - GL account debits/credits
     - Batch control totals
```

**Payment States:**
```
current_amount_due > 0  → Unpaid balance
current_amount_due = 0  → Paid in full
current_amount_due < 0  → Overpaid (credit balance)
```

---

## 8. Workflows and Business Processes

### 8.1 Change of Ownership Workflow

**Trigger**: Property sold, deed recorded

**Process:**
```
1. Deed information received (manual entry or import):
   
   chg_of_owner table:
     - chg_id, sale_dt, recording_dt
     - buyer_name, seller_name
     - sale_price
   
   chg_of_owner_prop_assoc:
     - chg_id, prop_id

2. REET (Real Estate Excise Tax) calculation:
   
   reet table:
     - chg_id (FK)
     - reet_amt = sale_price × reet_rate
     - reet_status_cd ('PENDING', 'PAID', 'EXEMPT')
   
   Separate workflow for REET payment collection

3. Create new owner record:
   
   a) Create/lookup account for buyer:
      INSERT INTO account (first_name, last_name, ...)
   
   b) Copy previous year owner record:
      INSERT INTO owner 
      SELECT prop_id, @current_year, acct_id (new buyer), ...
      FROM owner 
      WHERE prop_id = @prop_id AND owner_tax_yr = @prior_year

4. Prorate taxes if mid-year:
   
   IF recording_dt > January 1:
     - Calculate days of ownership for seller/buyer
     - Create supplemental bills
     - Seller responsible: Jan 1 - recording_dt
     - Buyer responsible: recording_dt - Dec 31

5. Update escrow accounts (if applicable):
   
   escrow table:
     - Transfer escrow balance to new owner
     - Notify mortgage company of change

6. Notification:
   
   - Generate change of ownership letters
   - Update tax statement mailing addresses
   - Trigger appraisal review if sale indicates value change
```

### 8.2 New Construction Workflow

**Trigger**: Building permit finaled in CIAPS

**Process:**
```
1. Permit marked "Finaled" in CIAPS:
   
   building_permit.final_date = [date]
   building_permit.status = 'FINALED'

2. Appraiser reviews permit:
   
   - Views property in PACS.NET.exe
   - Building permit displayed on "Permits" tab
   - Permit details: valuation, sq ft, permit type

3. Field inspection (optional):
   
   - Appraiser schedules site visit
   - Photos attached to property record
   - Sketch updated (imprv_sketch table)

4. Add new improvement:
   
   a) Create imprv record:
      - imprv_type_cd = 'RES' (residential)
      - yr_built = 2024
      - imprv_state_cd = 'NEW'
   
   b) Create imprv_detail records:
      - Main structure: 2000 sq ft
      - imprv_det_type_cd = 'RES-MA'
      - condition_cd = 'NEW'
   
   c) Recalculate:
      EXEC RecalcProperty @prop_id, 2024, 0

5. Create supplement for pro-rated tax:
   
   a) Create supplement record:
      INSERT INTO property_val 
      SELECT prop_id, 2024, (SELECT MAX(sup_num)+1), ...
      FROM property_val
      WHERE prop_id = @prop_id AND prop_val_yr = 2024 AND sup_num = 0
   
   b) Update supplement values:
      UPDATE property_val
      SET sup_cd = 'NEW',
          sup_dt = @permit_final_date,
          sup_desc = 'New construction completed'
      WHERE prop_id = @prop_id AND prop_val_yr = 2024 AND sup_num = @new_sup_num
   
   c) Recalculate supplement:
      EXEC RecalcProperty @prop_id, 2024, @new_sup_num
   
   d) Accept supplement (creates pro-rated bill):
      EXEC AcceptSuppProperty @prop_id, 2024, @new_sup_num

6. Billing:
   
   - Supplemental bill generated
   - Pro-rated tax = (new_value - old_value) × levy_rate × (days_remaining / 365)
   - Mailed to property owner
```

### 8.3 Mass Appraisal Workflow

**Annual Process:**

```
1. Neighborhood analysis (January-February):
   
   - Review sales in each neighborhood
   - Calculate sales ratios (sale price / assessed value)
   - Identify trending neighborhoods
   
   neighborhood table:
     - hood_cd, hood_desc
     - avg_sale_ratio, median_sale_ratio
   
   comp_sales_property table:
     - Comparable property selections
     - Statistical analysis

2. Cost table updates (February-March):
   
   - Review Matrix cost schedules
   - Update for construction cost inflation
   - Import new schedules via PACS.ADMIN.exe

3. Mass apply adjustments (March):
   
   a) Calculate adjustment factors by neighborhood:
      
      -- Example: Neighborhood 'N123' sales ratio = 0.90
      -- (Assessed values are 10% too high)
      
      UPDATE imprv
      SET imprv_mass_adj_factor = 0.90
      FROM imprv
      JOIN property_val pv ON imprv.prop_id = pv.prop_id
      WHERE pv.hood_cd = 'N123'
        AND imprv.prop_val_yr = 2024
   
   b) Recalculate all properties:
      
      -- Batch process via recalc_prop_list
      INSERT INTO recalc_prop_list (prop_id, sup_yr, sup_num, pacs_user_id)
      SELECT prop_id, 2024, 0, @system_user_id
      FROM property_val
      WHERE prop_val_yr = 2024
        AND prop_inactive_dt IS NULL
      
      EXEC RecalcProperty 0, 2024, 0  -- @prop_id=0 means "use recalc_prop_list"

4. Quality control (April):
   
   - Run statistical reports
   - Review outliers (properties with large value changes)
   - Manual review of high-value properties
   
   comp_sales_ratio_report:
     - Compare new values to recent sales
     - Ensure ratio targets met

5. Appraisal notice generation (April-May):
   
   a) Create notice batch:
      
      INSERT INTO appr_notice_selection_criteria (notice_yr, notice_num, ...)
   
   b) Select properties for notices:
      
      INSERT INTO appr_notice_prop_list (notice_yr, notice_num, prop_id, ...)
      SELECT ...
      FROM property_val
      WHERE prop_val_yr = 2024
        AND (appraised_val <> prior_year_appraised_val  -- Value changed
             OR EXISTS (SELECT 1 FROM property_exemption  -- New exemption
                        WHERE prop_id = property_val.prop_id AND exmpt_yr = 2024))
   
   c) Print and mail notices:
      
      -- Generates formatted notices
      -- Includes value breakdown, appeal instructions
      -- Logged in appr_notice_selection_criteria

6. Appeal processing (May-July):
   
   - Property owners file appeals
   - Informal reviews by appraisers
   - ARB hearings for unresolved appeals
   - Value adjustments recorded
   - Re-run RecalcProperty for adjusted properties

7. Certification (August):
   
   - Final values locked
   - Certified roll exported to state
   - PTD (Property Tax Division) reports generated
```

---

## 9. Key Lookup/Code Tables

**Essential Reference Tables:**

```
property_type (prop_type_cd)
  - 'R' = Real Property
  - 'P' = Personal Property
  - 'M' = Mobile Home
  - 'L' = Leasehold
  - 'MIN' = Mineral Rights

state_code (state_cd)
  - Property state codes (e.g., 'TXBL'=Taxable, 'EX'=Exempt, 'DEL'=Deleted)

imprv_type (imprv_type_cd)
  - 'RES' = Residential
  - 'COM' = Commercial
  - 'IND' = Industrial
  - 'AG' = Agricultural

imprv_det_type_cd (improvement detail types)
  - 'RES-MA' = Residential Main Structure
  - 'RES-AD' = Residential Addition
  - 'COM-OFF' = Commercial Office
  - 'AG-BAR' = Agricultural Barn

condition (condition_cd)
  - 'NEW' = New
  - 'EXC' = Excellent
  - 'VGD' = Very Good
  - 'GD' = Good
  - 'AVG' = Average
  - 'FAIR' = Fair
  - 'POOR' = Poor

exemption types (exmpt_type_cd)
  - 'HS' = Homestead Exemption
  - 'OV65' = Over 65 Exemption
  - 'DIS' = Disabled Person Exemption
  - 'VET' = Veteran Exemption
```

**System Configuration:**

```
pacs_system (singleton record)
  - appr_yr = Current appraisal year
  - future_yr = Future year for projections
  - coll_yr = Current collection year
  - Used globally throughout system for "current year" logic

pacs_config (singleton record)
  - System-wide settings
  - Database connection parameters
  - Report templates
```

---

## 10. Critical Patterns and Conventions

### 10.1 Composite Primary Keys

**Most PACS tables use composite keys:**
```sql
property_val: (prop_val_yr, sup_num, prop_id)
owner: (owner_tax_yr, sup_num, prop_id, owner_id)
imprv: (prop_val_yr, sup_num, sale_id, prop_id, imprv_id)
imprv_detail: (prop_val_yr, sup_num, sale_id, prop_id, imprv_id, imprv_det_id)
```

**Implication**: ALL child table queries must include year and supplement number.

### 10.2 Soft Deletes

**Properties are soft-deleted:**
```sql
-- Never do this:
DELETE FROM property WHERE prop_id = 12345;

-- Instead:
UPDATE property_val 
SET prop_inactive_dt = GETDATE(),
    sup_cd = 'DEL',
    sup_desc = 'Property deleted'
WHERE prop_id = 12345 AND prop_val_yr = 2024 AND sup_num = 0;
```

**Filter deleted properties:**
```sql
SELECT * FROM property_val
WHERE prop_val_yr = 2024
  AND prop_inactive_dt IS NULL;  -- Exclude deleted
```

### 10.3 Trigger-Based Change Logging

**Most tables have change log triggers:**
```sql
CREATE TRIGGER tr_property_val_update_ChangeLog
ON property_val
FOR UPDATE
NOT FOR REPLICATION
AS
  -- Logs all column changes to change_log table
  -- Includes: user_id, timestamp, old_value, new_value
  -- Used for audit trail and rollback
```

**Change log query:**
```sql
SELECT cl.*, u.pacs_user_name
FROM change_log cl
JOIN pacs_user u ON cl.pacs_user_id = u.pacs_user_id
WHERE cl.table_name = 'property_val'
  AND cl.key_prop_id = 12345
  AND cl.key_year = 2024
ORDER BY cl.chg_dt DESC;
```

### 10.4 Extended Stored Procedures

**Many core calculations are in Extended SPs:**
```sql
-- SQL wrapper:
CREATE PROCEDURE RecalcProperty @prop_id int, @year int, ...
AS
  -- Calls extended SP in TA_AppSvr database:
  EXEC master..xp_RecalcProperty90 ...
```

**Extended SPs are compiled C++ DLLs:**
- Registered in SQL Server via `sp_addextendedproc`
- Located in SQL Server Binn folder
- Not human-readable (binary)
- Legacy pattern from older PACS versions

---

## 11. Performance Considerations

### 11.1 Indexing Strategy

**Heavy index usage:**
```sql
-- property table:
idx_geo_id (geo_id)  -- Primary search field
idx_prop_type_cd (prop_type_cd)  -- Filtering

-- property_val table:
CPK_property_val (prop_val_yr, sup_num, prop_id)  -- Clustered PK
idx_hood_cd (hood_cd)  -- Neighborhood reports
idx_abs_subdv_cd (abs_subdv_cd)  -- Subdivision reports

-- owner table:
idx_owner_id (owner_id)  -- Owner lookups
idx_prop_id (prop_id)  -- Property ownershiplookups
```

**All indexes have FILLFACTOR = 90:**
- Leaves 10% free space per page
- Reduces page splits during INSERT/UPDATE
- Trade-off: slightly more storage, faster writes

### 11.2 Query Patterns

**Always use WITH (NOLOCK) for read-only queries:**
```sql
-- Good:
SELECT * FROM property_val WITH (NOLOCK)
WHERE prop_val_yr = 2024;

-- Bad (can cause blocking):
SELECT * FROM property_val
WHERE prop_val_yr = 2024;
```

**Reason**: PACS has high concurrency (many users editing simultaneously)

**Use appropriate JOINs:**
```sql
-- Base query pattern:
SELECT p.prop_id, pv.prop_val, s.situs_display
FROM property_val pv WITH (NOLOCK)
JOIN property p WITH (NOLOCK) ON p.prop_id = pv.prop_id
LEFT JOIN situs s WITH (NOLOCK) ON s.prop_id = p.prop_id AND s.primary_situs = 'Y'
JOIN prop_supp_assoc psa WITH (NOLOCK) ON psa.prop_id = pv.prop_id 
  AND psa.owner_tax_yr = pv.prop_val_yr 
  AND psa.sup_num = pv.sup_num
WHERE pv.prop_val_yr = 2024
  AND pv.prop_inactive_dt IS NULL;
```

---

## 12. Common Pitfalls and Debugging

### 12.1 Build Warnings/Errors (Expected)

**SQL Database Projects show thousands of errors:**
```
Error SQL71501: Self-referencing views
Error SQL71006: External database references (Benton_spatial_data, web_internet_benton)
```

**These are NORMAL:**
- SQL projects can't validate cross-database references at build time
- Runtime SQL Server resolves correctly
- DACPACs generate successfully despite errors

### 12.2 Cross-Database Dependencies

**Always check synonyms and cross-database queries when modifying schemas:**

**Example: Modifying `property` table:**
```sql
-- 1. Check CIAPS synonyms:
SELECT * FROM DatabaseProjectCIAPS.dbo.Synonyms
WHERE base_object_name LIKE '%property%';

-- 2. Check cross-database queries in CIAPS:
SELECT ROUTINE_NAME, ROUTINE_DEFINITION
FROM DatabaseProjectCIAPS.INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_DEFINITION LIKE '%[pacs_oltp]%property%'
   OR ROUTINE_DEFINITION LIKE '%[PACS_Training]%property%';

-- 3. Update both pacs_oltp AND PACS_Training (keep in sync!)
```

### 12.3 Recalc Errors

**Properties can have recalc errors:**
```sql
-- Check for recalc errors:
SELECT * FROM prop_recalc_errors
WHERE prop_id = 12345;

-- Common causes:
-- - Missing schedule records (imprv_sched, land_sched)
-- - Invalid improvement detail types
-- - Circular dependencies (land_detail → land_detail)
-- - Division by zero (0 sq ft area)
```

**Fix pattern:**
```sql
-- 1. Identify error
SELECT err_desc FROM prop_recalc_errors WHERE prop_id = 12345;

-- 2. Fix data issue
UPDATE imprv_detail SET imprv_det_area = 1000
WHERE prop_id = 12345 AND imprv_det_area = 0;

-- 3. Clear error flag
DELETE FROM prop_recalc_errors WHERE prop_id = 12345;

-- 4. Recalc
EXEC RecalcProperty 12345, 2024, 0;
```

---

## 13. System Entry Points (User Perspective)

### 13.1 PACS.NET.exe - Main Client

**Login:**
- Windows Authentication (domain credentials)
- User rights checked via `pacs_user` table
- Rights control visibility of menu items, buttons

**Main Workflows:**

**Property Search:**
1. Search by geo_id, address, owner name
2. Results grid displays matching properties
3. Double-click opens Property Detail form

**Property Detail:**
- **General Tab**: Property info, ownership
- **Valuation Tab**: Land/improvement values, recalc button
- **Improvements Tab**: Building details, cost worksheets
- **Land Tab**: Land components, land schedules
- **Sales Tab**: Sales history, comparable sales
- **Exemptions Tab**: Owner exemptions
- **Permits Tab**: Building permits (CIAPS integration)
- **Map Tab**: GIS visualization (Matix integration)
- **Documents Tab**: Attached images/PDFs

**Appraisal Tools:**
- **Cost Approach**: Improvement cost worksheets
- **Sales Comparison**: Comparable grids
- **Income Approach**: Income/expense analysis
- **Mass Appraisal**: Neighborhood trend analysis

**Reporting:**
- **Standard Reports**: Pre-built Crystal Reports
- **Query Builder**: Ad-hoc SQL query tool
- **Exports**: Excel, CSV, PDF

### 13.2 Collections (Tax Bills/Payments)

**Accessed via "Collections" menu:**

**Search Tax Bills:**
- By property, owner, bill number
- Filter by year, paid status

**Accept Payment:**
1. Search for bill(s)
2. Enter payment amount, method (cash, check, CC)
3. Apply to selected bill(s)
4. Print receipt

**Payment Plans:**
- Installment agreements
- Payout agreements (structured payments)

**Delinquencies:**
- Delinquent roll generation
- Delinquent notices
- Tax certificate sales (foreclosure process)

---

## 14. Security and User Rights

### 14.1 User Rights Model

**Rights stored in:**
```
pacs_user (users)
  └── user_role_user_assoc (user-to-role assignments)
      └── user_role (roles)
          └── user_role_right_assoc (role-to-right assignments)
              └── user_rights (individual rights)
```

**Sample Rights:**
```
- PROP_VIEW: View property records
- PROP_EDIT: Edit property data
- PROP_DELETE: Delete properties
- VAL_RECALC: Recalculate property values
- BILL_CREATE: Create tax bills
- PAYMENT_ACCEPT: Accept payments
- REPORT_CONFIDENTIAL: View confidential owner data
```

**Rights Enforcement:**
1. **Client-side**: Menu items/buttons hidden if no right
2. **Service-side**: WCF service methods check rights before execution
3. **Database-side**: Change log records user_id for audit

### 14.2 Confidential Records

**Confidential flag on accounts:**
```sql
account.confidential_flag = 'Y'
  └── Uses confidential_file_as_name instead of file_as_name
  └── Restricted from web export
  └── Requires special right to view
```

**Use cases:**
- Law enforcement officers
- Domestic violence victims
- Public officials

---

## 15. Deployment and Maintenance

### 15.1 Local Development Setup

**Prerequisites:**
- Docker Desktop (for SQL Server container)
- .NET 8 SDK (for building database projects)
- SqlPackage CLI (for DACPAC deployment)

**Startup:**
```powershell
# 1. Start SQL Server
cd pacs-server-benton/infra/docker
docker compose -f compose.mssql.yml up -d

# 2. Wait for health check (30-60 seconds)

# 3. Publish all databases
cd ../../scripts
pwsh publish.ps1 -SqlServer "localhost,1433" -SaPassword "P@ssw0rd123!"
```

**Publish order (dependency chain):**
1. pacs_oltp (production)
2. PACS_Training (training/backup clone)
3. TA_AppSvr (tax assessor app server)
4. CIAPS (building permits - references pacs_oltp synonyms)
5. Web_Internet_Benton (web data staging)
6. SSISDB (ETL catalog)

### 15.2 Schema Change Workflow

**Modifying a table (example: adding column to `property`):**

```powershell
# 1. Edit SQL file
code DatabaseProjectpacs_oltp/dbo/Tables/property.sql

# Add column:
ALTER TABLE [dbo].[property] ADD
  [new_column] VARCHAR(50) NULL;

# 2. Build project
cd DatabaseProjectpacs_oltp
dotnet build DatabaseProjectpacs_oltp.sqlproj -c Release

# 3. Deploy to local dev
SqlPackage /Action:Publish `
  /SourceFile:bin/Release/pacs_oltp.dacpac `
  /TargetServerName:localhost,1433 `
  /TargetDatabaseName:pacs_oltp `
  /TargetUser:sa `
  /TargetPassword:P@ssw0rd123!

# 4. Apply same change to PACS_Training (keep schemas in sync)
code DatabaseProjectpacs_training/dbo/Tables/property.sql
# (repeat build and publish for PACS_Training)

# 5. Check for cross-database impact:
# - Does CIAPS reference this table? (check synonyms)
# - Does Web_Internet_Benton query this table?
# - Rebuild dependent projects if needed

# 6. Test in local environment

# 7. Commit changes to Git
git add DatabaseProjectpacs_oltp/dbo/Tables/property.sql
git add DatabaseProjectpacs_training/dbo/Tables/property.sql
git commit -m "Add new_column to property table"
```

---

## 16. Glossary

**Key Terms:**

- **Appraisal Year**: Year for which property values are assessed (e.g., 2024 values for 2025 taxes)
- **ARB**: Appraisal Review Board (hears property value appeals)
- **Assessed Value**: Taxable value after exemptions/adjustments
- **CIAPS**: County Integrated Assessment & Permit System (third-party add-on)
- **DOR**: Department of Revenue (state agency overseeing property tax)
- **Freeze Ceiling**: Maximum taxable value for senior/disabled homeowner exemptions
- **Geo ID**: Geographic/parcel identifier (e.g., taxlot number)
- **Homestead**: Primary residence, eligible for special exemptions
- **Levy**: Tax charged by a taxing district
- **Main Roll**: Annual assessment (sup_num = 0)
- **Matrix**: Cost table schedules for improvement valuation
- **Matix**: GIS product for spatial/mapping features (note spelling difference from Matrix)
- **PACS**: Property Assessment and Collection System
- **PTD**: Property Tax Division (state DOR department)
- **REET**: Real Estate Excise Tax (transfer tax on property sales)
- **Supplement**: Mid-year assessment change (sup_num > 0)
- **TA_AppSvr**: Tax Assessor Application Server database
- **Tax Area**: Geographic area with unique combination of taxing districts
- **UDI**: Undivided Interest (multiple owners sharing property)

---

## 17. Further Resources

**Documentation Locations:**
- `Database/Query Samples/` - SQL query examples
- `Database/PACS Query Instructions/` - Query training materials
- `Database/PDF's/` - User guides (Admin Console, Matrix Schedules, DOR Reports)
- `pacs-server-benton/docs/README.md` - Deployment quickstart
- `.github/copilot-instructions.md` - AI agent guidance

**External Documentation:**
- TrueAutomation PACS vendor documentation (proprietary)
- Microsoft .NET Framework 4.8 docs
- DevExpress WinForms controls documentation
- ESRI ArcGIS Runtime documentation

**Key Contacts:**
- **Appraisal Staff**: Use PACS.NET.exe for property valuation
- **Collections Staff**: Use Collections module for tax bill/payment management
- **IT/Database Admins**: Maintain SQL Server, deployments, backups
- **GIS Staff**: Maintain Matix spatial data integration

---

## Conclusion

The Benton County PACS system is a complex, mature property tax management platform with:

- **Sophisticated database architecture** (6 databases, cross-database relationships)
- **Comprehensive valuation logic** (cost, sales, income approaches)
- **Robust workflow support** (appraisal cycle, ownership changes, billing)
- **Legacy thick client** (.NET WinForms with WCF services)
- **Third-party integrations** (CIAPS permits, Matix GIS, Matrix cost tables)
- **Extensive ETL pipelines** (building permits, web exports)

Understanding this system requires knowledge of:
- SQL Server database design patterns
- Property tax assessment principles
- .NET Framework/WCF architecture
- NHibernate ORM
- GIS/spatial data concepts
- Complex business rules and regulations

This document provides the foundation for working with PACS at a deep technical level. For specific use cases, refer to query samples, stored procedure source code, and existing documentation.

**Key Takeaway**: PACS is not just a database—it's a comprehensive business application platform for property tax administration, with decades of accumulated business logic encoded in database schemas, stored procedures, and client application code.
