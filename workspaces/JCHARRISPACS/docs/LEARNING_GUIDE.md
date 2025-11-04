# PACS System - Additional Learning Resources & Deep Understanding Guides

## Document Control

**System**: Benton County Property Assessment and Collection System (PACS)  
**Purpose**: Further learning pathways and advanced system understanding  
**Version**: 1.0  
**Date**: November 3, 2025  
**Prepared By**: TrueAutomation PACS Elite Government OS Engineering Team

---

## Table of Contents

1. [Learning Pathways](#1-learning-pathways)
2. [Hands-On Exercises](#2-hands-on-exercises)
3. [Advanced Topics](#3-advanced-topics)
4. [Troubleshooting Scenarios](#4-troubleshooting-scenarios)
5. [Domain Knowledge](#5-domain-knowledge)
6. [Code Walkthrough Guides](#6-code-walkthrough-guides)
7. [Data Flow Tracing](#7-data-flow-tracing)
8. [Performance Optimization](#8-performance-optimization)
9. [Research Resources](#9-research-resources)
10. [Expert Interview Questions](#10-expert-interview-questions)

---

## 1. Learning Pathways

### 1.1 For New Developers (0-3 months)

**Week 1-2: Environment Setup & Basic Understanding**

□ **Day 1-2**: Development environment setup
  - Install Docker Desktop
  - Clone repository from GitHub
  - Start local SQL Server: `docker compose -f compose.mssql.yml up -d`
  - Run `publish.ps1` to deploy all databases
  - Connect SSMS to `localhost,1433` with sa/P@ssw0rd123!

□ **Day 3-4**: Database exploration
  - Read `PACS_DEEP_DIVE.md` (sections 1-2)
  - Open DatabaseProjectpacs_oltp in Visual Studio
  - Explore table schemas: property, property_val, owner, imprv
  - Query data: `SELECT TOP 100 * FROM property_val WHERE prop_val_yr = 2024`

□ **Day 5**: Client application exploration
  - Read `TECH_STACK.md` (section 2)
  - Locate `Database/PACSDrop/PACS.NET.exe`
  - Review `App.config` for WCF endpoints
  - Understand DevExpress controls in use

**Week 3-4: Core Workflows**

□ **Property valuation workflow**
  - Trace RecalcProperty stored procedure
  - Understand composite keys (prop_val_yr, sup_num, prop_id)
  - Follow improvement → imprv_detail → cost calculation
  - Experiment: Modify imprv_det_area, run RecalcProperty, observe value changes

□ **Tax calculation workflow**
  - Read sections on levy calculation (PACS_DEEP_DIVE.md section 7)
  - Query: `SELECT * FROM levy WHERE levy_yr = 2024`
  - Trace: property_val.assessed_val → levy_bill → bill
  - Understand: (assessed_val / 1000) × levy_rate = tax

**Week 5-8: Development Tasks**

□ **Simple bug fix** (guided by mentor)
  - Fix reported UI issue
  - Make database schema change (add nullable column)
  - Write unit test for change
  - Deploy to dev environment

□ **Small feature** (guided by mentor)
  - Add new report parameter
  - Create stored procedure
  - Build Crystal Report
  - Test end-to-end

**Self-Assessment:**
- [ ] Can navigate database schema confidently
- [ ] Understand property valuation basics
- [ ] Can make simple code changes
- [ ] Familiar with deployment process

### 1.2 For Experienced Developers (Month 2-6)

**Advanced Database Patterns**

□ Study extended stored procedures
  - Read xp_RecalcProperty90 wrapper (RecalcProperty.sql)
  - Understand xsp_pacs_config configuration table
  - Learn when extended SPs are called vs. T-SQL logic

□ Cross-database dependencies
  - Map all CIAPS synonyms → pacs_oltp references
  - Find cross-database queries: `grep -r "\[pacs_oltp\]" DatabaseProjectCIAPS/`
  - Document dependency graph

□ Trigger-based change logging
  - Study tr_property_update_ChangeLog trigger pattern
  - Query change_log table for audit trail
  - Understand non-repudiation requirements

**Advanced Application Architecture**

□ WCF service deep dive
  - Debug service call from client → PACSService → NHibernate → SQL
  - Profile service performance (use Fiddler or WCF tracing)
  - Understand session management (session-per-request)

□ NHibernate ORM mastery
  - Study entity mappings (.hbm.xml files)
  - Understand lazy loading behavior
  - Optimize N+1 query problems
  - Configure second-level cache for lookup tables

□ DevExpress control customization
  - Build custom GridView column (computed field)
  - Create custom LookUpEdit with filtering
  - Implement custom RibbonControl button with action

**Self-Assessment:**
- [ ] Can architect new features independently
- [ ] Understand full stack (client → service → database)
- [ ] Can optimize performance issues
- [ ] Familiar with all major subsystems

### 1.3 For Domain Experts (Month 6+)

**Property Tax Domain Knowledge**

□ **Study Washington State property tax law**
  - RCW 84 (Property Tax Code)
  - DOR regulations and guidance
  - PTD reporting requirements

□ **Mass appraisal methodology**
  - Cost approach (replacement cost - depreciation)
  - Sales comparison approach
  - Income approach (for commercial properties)
  - Statistical analysis (sales ratios, COD, PRD)

□ **Assessment cycle timeline**
  - January 1: Assessment date (lien date)
  - May: Appraisal notices
  - July: Appeal deadline
  - August: Certification
  - November: Tax statements

**System Integration Expertise**

□ **CIAPS building permit integration**
  - Understand permit → property linkage logic
  - Study address matching algorithm
  - Review error handling (building_permit_import_error table)

□ **Matix GIS integration**
  - Study spatial data model (Benton_spatial_data)
  - Understand parcel geometry storage
  - Map coordinate system transformations

□ **Web export pipeline**
  - Trace Web_Internet_Benton ETL (pExport_PropertyData)
  - Understand public records disclosure rules
  - Review confidential data filtering

**Self-Assessment:**
- [ ] Can explain property tax process to non-technical users
- [ ] Understand legal/regulatory requirements
- [ ] Expert in all system integrations
- [ ] Mentor others effectively

---

## 2. Hands-On Exercises

### Exercise 1: Add a New Property

**Goal**: Understand property creation workflow

**Steps:**
```sql
-- 1. Insert property record
INSERT INTO property (prop_id, geo_id, simple_geo_id, prop_type_cd, state_cd)
VALUES (999999, '999-999-999', '999999999', 'R', 'TXBL');

-- 2. Insert current year property_val
INSERT INTO property_val (
  prop_val_yr, sup_num, prop_id, 
  prop_val, assessed_val, appraised_val,
  land_hstd_val, imprv_hstd_val
)
SELECT 
  (SELECT appr_yr FROM pacs_system),  -- Current year
  0,  -- Main roll
  999999,  -- New prop_id
  0, 0, 0, 0, 0;  -- Initial zero values

-- 3. Insert situs (address)
INSERT INTO situs (
  prop_id, situs_id, primary_situs,
  situs_num, situs_street, situs_city, situs_state, situs_zip
)
VALUES (
  999999, 1, 'Y',
  '123', 'Test Street', 'Richland', 'WA', '99352'
);

-- 4. Insert owner
DECLARE @current_year INT = (SELECT appr_yr FROM pacs_system);
INSERT INTO owner (
  owner_tax_yr, sup_num, prop_id, owner_id,
  pct_ownership, hs_prop
)
VALUES (
  @current_year, 0, 999999, 1,  -- Assuming account_id 1 exists
  100.0, 'Y'
);

-- 5. Verify
SELECT p.*, pv.*, s.situs_display, o.*
FROM property p
JOIN property_val pv ON p.prop_id = pv.prop_id
JOIN situs s ON p.prop_id = s.prop_id AND s.primary_situs = 'Y'
JOIN owner o ON p.prop_id = o.prop_id
WHERE p.prop_id = 999999;
```

**Expected Result**: Property appears in searches, has valid address and owner

**Cleanup:**
```sql
DELETE FROM owner WHERE prop_id = 999999;
DELETE FROM situs WHERE prop_id = 999999;
DELETE FROM property_val WHERE prop_id = 999999;
DELETE FROM property WHERE prop_id = 999999;
```

### Exercise 2: Simulate Recalculation

**Goal**: Understand value calculation pipeline

**Steps:**
```sql
-- 1. Find a residential property with improvements
SELECT TOP 1 
  pv.prop_id, pv.prop_val_yr, pv.sup_num,
  pv.prop_val, pv.imprv_hstd_val, pv.land_hstd_val
FROM property_val pv
WHERE pv.prop_val_yr = 2024 
  AND pv.sup_num = 0
  AND pv.imprv_hstd_val > 0
  AND pv.prop_inactive_dt IS NULL;

-- Let's say we found prop_id = 12345

-- 2. View current improvement details
SELECT 
  id.imprv_det_id, id.imprv_det_type_cd,
  id.imprv_det_area, id.unit_price,
  id.imprv_det_orig_val, id.imprv_det_calc_val
FROM imprv_detail id
WHERE id.prop_id = 12345 
  AND id.prop_val_yr = 2024 
  AND id.sup_num = 0;

-- 3. Modify improvement area (simulate addition)
UPDATE imprv_detail
SET imprv_det_area = imprv_det_area + 100  -- Add 100 sq ft
WHERE prop_id = 12345 
  AND prop_val_yr = 2024 
  AND sup_num = 0
  AND imprv_det_id = 1;

-- 4. Recalculate property
EXEC RecalcProperty @prop_id = 12345, @year = 2024, @sup_num = 0;

-- 5. View updated values
SELECT 
  pv.prop_val AS TotalPropertyValue,
  pv.imprv_hstd_val AS ImprovementValue,
  pv.land_hstd_val AS LandValue,
  pv.assessed_val AS AssessedValue
FROM property_val pv
WHERE pv.prop_id = 12345 
  AND pv.prop_val_yr = 2024 
  AND pv.sup_num = 0;

-- 6. Rollback (don't commit changes)
ROLLBACK;
```

**Expected Result**: prop_val increased by approximately (100 sq ft × unit_price × (1 - depreciation))

### Exercise 3: Trace a Payment

**Goal**: Understand payment processing and distribution

**Steps:**
```sql
-- 1. Find an open bill
SELECT TOP 1 
  b.bill_id, b.prop_id, b.year, b.owner_id,
  b.initial_amount_due, b.current_amount_due, b.amount_paid
FROM bill b
WHERE b.current_amount_due > 0
  AND b.is_active = 'Y';

-- Let's say bill_id = 67890, current_amount_due = 1500.00

-- 2. View levy breakdown
SELECT 
  lb.levy_cd, lb.levy_desc,
  lb.taxable_value, lb.levy_rate, lb.levy_tax
FROM levy_bill lb
WHERE lb.bill_id = 67890;

-- 3. Simulate payment (don't actually run, just understand flow)
/*
-- Create payment record
INSERT INTO payment (payment_id, payment_date, payment_amt, payment_method_cd)
VALUES (NEXT VALUE FOR payment_id_seq, GETDATE(), 1500.00, 'CHECK');

-- Create tender (check details)
INSERT INTO tender (payment_id, tender_type_cd, tender_amt, check_num)
VALUES (@@IDENTITY, 'CHECK', 1500.00, '1234');

-- Apply to bill
INSERT INTO payment_transaction_assoc (payment_id, trans_group_id, amount_applied)
VALUES (@@IDENTITY, 67890, 1500.00);

-- Update bill
UPDATE bill 
SET amount_paid = amount_paid + 1500.00,
    current_amount_due = current_amount_due - 1500.00
WHERE bill_id = 67890;

-- Distribute to funds (proportional to levy amounts)
INSERT INTO coll_transaction (payment_id, levy_cd, fund_cd, amount_collected)
SELECT 
  @@IDENTITY,
  lb.levy_cd,
  lb.fund_cd,
  (lb.levy_tax / b.initial_amount_due) * 1500.00  -- Proportional distribution
FROM levy_bill lb
JOIN bill b ON lb.bill_id = b.bill_id
WHERE lb.bill_id = 67890;
*/

-- 4. Query payment history for property
SELECT 
  p.payment_date, p.payment_amt, p.payment_method_cd,
  pta.amount_applied
FROM payment p
JOIN payment_transaction_assoc pta ON p.payment_id = pta.payment_id
WHERE pta.trans_group_id IN (
  SELECT bill_id FROM bill WHERE prop_id = [prop_id] AND year = 2024
)
ORDER BY p.payment_date DESC;
```

**Expected Result**: Understand payment → tender → application → distribution flow

---

## 3. Advanced Topics

### 3.1 Composite Key Optimization

**Problem**: Composite keys (prop_val_yr, sup_num, prop_id) complicate queries

**Best Practices:**

```sql
-- ❌ BAD: Missing key components
SELECT * FROM property_val WHERE prop_id = 12345;
-- This will return multiple rows (one per year/supplement)!

-- ✅ GOOD: Include all key components
SELECT * FROM property_val 
WHERE prop_val_yr = 2024 AND sup_num = 0 AND prop_id = 12345;

-- ✅ GOOD: Use CTE for current year
WITH CurrentYear AS (
  SELECT appr_yr FROM pacs_system
)
SELECT pv.*
FROM property_val pv
CROSS JOIN CurrentYear cy
WHERE pv.prop_val_yr = cy.appr_yr 
  AND pv.sup_num = 0 
  AND pv.prop_id = 12345;

-- ✅ GOOD: Indexed view for common pattern
CREATE VIEW vw_current_property_val
WITH SCHEMABINDING AS
SELECT 
  pv.prop_id, pv.prop_val, pv.assessed_val, pv.land_hstd_val, pv.imprv_hstd_val
FROM dbo.property_val pv
WHERE pv.prop_val_yr = (SELECT appr_yr FROM dbo.pacs_system)
  AND pv.sup_num = 0
  AND pv.prop_inactive_dt IS NULL;

-- Then query:
SELECT * FROM vw_current_property_val WHERE prop_id = 12345;
```

### 3.2 Handling Supplements

**Understanding Supplement Logic:**

```sql
-- Main roll (sup_num = 0) is the baseline
-- Supplements (sup_num > 0) represent mid-year changes

-- Find all supplements for a property
SELECT 
  pv.sup_num,
  pv.sup_cd,  -- NEW, CHG, COR, etc.
  pv.sup_dt,  -- Effective date
  pv.sup_desc,
  pv.prop_val - pv_main.prop_val AS value_change
FROM property_val pv
JOIN property_val pv_main ON 
  pv.prop_id = pv_main.prop_id 
  AND pv.prop_val_yr = pv_main.prop_val_yr 
  AND pv_main.sup_num = 0
WHERE pv.prop_id = 12345 
  AND pv.prop_val_yr = 2024 
  AND pv.sup_num > 0;

-- Creating a supplement (new construction scenario)
BEGIN TRANSACTION;

-- 1. Copy main roll to new supplement
DECLARE @new_sup_num INT = (
  SELECT COALESCE(MAX(sup_num), 0) + 1 
  FROM property_val 
  WHERE prop_id = 12345 AND prop_val_yr = 2024
);

INSERT INTO property_val (prop_val_yr, sup_num, prop_id, ...)
SELECT 
  prop_val_yr, 
  @new_sup_num,  -- New supplement number
  prop_id,
  ...  -- All other columns
FROM property_val
WHERE prop_id = 12345 AND prop_val_yr = 2024 AND sup_num = 0;

-- 2. Update supplement metadata
UPDATE property_val
SET 
  sup_cd = 'NEW',
  sup_dt = '2024-06-15',  -- Completion date
  sup_desc = 'New construction completed per permit #12345'
WHERE prop_id = 12345 AND prop_val_yr = 2024 AND sup_num = @new_sup_num;

-- 3. Add new improvement to supplement
INSERT INTO imprv (prop_val_yr, sup_num, sale_id, prop_id, imprv_id, ...)
VALUES (2024, @new_sup_num, 0, 12345, 1, ...);

-- 4. Recalculate supplement
EXEC RecalcProperty @prop_id = 12345, @year = 2024, @sup_num = @new_sup_num;

-- 5. Accept supplement (creates pro-rated bill)
EXEC AcceptSuppProperty @prop_id = 12345, @year = 2024, @sup_num = @new_sup_num;

COMMIT;
```

### 3.3 Optimistic Concurrency

**Problem**: Multiple users editing same property simultaneously

**Solution**: Use rowversion column for optimistic locking

```csharp
// Client-side code pattern
public void UpdateProperty(PropertyDTO property)
{
    using (var session = NHibernateHelper.OpenSession())
    using (var transaction = session.BeginTransaction())
    {
        try
        {
            // Load entity with version check
            var existingProperty = session.Get<Property>(property.PropId);
            
            // NHibernate compares rowversion automatically
            existingProperty.GeoId = property.GeoId;
            existingProperty.PropTypeCd = property.PropTypeCd;
            // ... other updates
            
            session.Update(existingProperty);
            transaction.Commit();
        }
        catch (StaleObjectStateException ex)
        {
            // Another user modified the record
            throw new ConcurrencyException(
                "Property was modified by another user. Please refresh and try again.",
                ex
            );
        }
    }
}
```

**SQL Pattern:**
```sql
-- Check rowversion before update
DECLARE @original_rowversion BINARY(8) = 0x00000000000007D1;

UPDATE property_val
SET prop_val = 500000,
    rowversion_column = rowversion_column  -- Auto-incremented by SQL Server
WHERE prop_id = 12345 
  AND prop_val_yr = 2024 
  AND sup_num = 0
  AND rowversion_column = @original_rowversion;

IF @@ROWCOUNT = 0
  RAISERROR('Concurrency conflict: Record was modified by another user.', 16, 1);
```

---

## 4. Troubleshooting Scenarios

### Scenario 1: Property Won't Recalculate

**Symptoms:**
- User clicks "Recalc" button, values don't update
- prop_recalc_errors table has entry for this property

**Diagnosis:**
```sql
-- 1. Check for recalc errors
SELECT * FROM prop_recalc_errors WHERE prop_id = 12345;

-- 2. Check improvement detail for issues
SELECT 
  id.imprv_det_id,
  id.imprv_det_area,
  id.unit_price,
  id.depreciation_yr
FROM imprv_detail id
WHERE id.prop_id = 12345 AND id.prop_val_yr = 2024 AND id.sup_num = 0;

-- Common issues:
-- - imprv_det_area = 0 (division by zero)
-- - Missing schedule record (imprv_sched)
-- - Invalid depreciation_yr
```

**Resolution:**
```sql
-- Fix zero area
UPDATE imprv_detail
SET imprv_det_area = 1000  -- Correct value
WHERE prop_id = 12345 
  AND imprv_det_area = 0;

-- Clear error flag
DELETE FROM prop_recalc_errors WHERE prop_id = 12345;

-- Retry recalc
EXEC RecalcProperty @prop_id = 12345, @year = 2024, @sup_num = 0;
```

### Scenario 2: Slow Property Search

**Symptoms:**
- Property search takes > 10 seconds
- Users complaining about performance

**Diagnosis:**
```sql
-- 1. Enable actual execution plan in SSMS (Ctrl+M)

-- 2. Run problematic query
SELECT p.prop_id, p.geo_id, pv.prop_val, s.situs_display, o.file_as_name
FROM property p
JOIN property_val pv ON p.prop_id = pv.prop_id
JOIN situs s ON p.prop_id = s.prop_id AND s.primary_situs = 'Y'
LEFT JOIN owner o ON p.prop_id = o.prop_id AND o.owner_tax_yr = 2024
WHERE pv.prop_val_yr = 2024 AND pv.sup_num = 0
  AND s.situs_street LIKE '%Main%';

-- 3. Check execution plan for:
-- - Table scans (should be index seeks)
-- - Missing index warnings
-- - High cost operations
```

**Common Fixes:**
```sql
-- Add missing index
CREATE NONCLUSTERED INDEX idx_situs_street
ON situs (situs_street)
INCLUDE (prop_id, situs_display)
WHERE primary_situs = 'Y';

-- Add WITH (NOLOCK) to reduce blocking
SELECT ... FROM property p WITH (NOLOCK)
JOIN property_val pv WITH (NOLOCK) ON ...;

-- Update statistics
UPDATE STATISTICS property WITH FULLSCAN;
UPDATE STATISTICS property_val WITH FULLSCAN;
```

### Scenario 3: Payment Not Applying to Bill

**Symptoms:**
- Payment entered, but bill still shows full amount due
- Receipt printed, but balance unchanged

**Diagnosis:**
```sql
-- 1. Find the payment
SELECT * FROM payment WHERE payment_date = '2024-11-01' AND payment_amt = 1500.00;
-- Let's say payment_id = 98765

-- 2. Check if payment was applied
SELECT * FROM payment_transaction_assoc WHERE payment_id = 98765;
-- If no rows, payment wasn't applied!

-- 3. Check bill status
SELECT * FROM bill WHERE bill_id = 67890;
-- Verify is_active = 'Y', not voided
```

**Resolution:**
```sql
-- Apply payment manually (if payment exists but wasn't applied)
INSERT INTO payment_transaction_assoc (payment_id, trans_group_id, amount_applied)
VALUES (98765, 67890, 1500.00);

UPDATE bill
SET amount_paid = amount_paid + 1500.00,
    current_amount_due = current_amount_due - 1500.00
WHERE bill_id = 67890;

-- Distribute to funds
INSERT INTO coll_transaction (payment_id, levy_cd, fund_cd, amount_collected)
SELECT 
  98765,
  lb.levy_cd,
  lb.fund_cd,
  (lb.levy_tax / b.initial_amount_due) * 1500.00
FROM levy_bill lb
JOIN bill b ON lb.bill_id = b.bill_id
WHERE lb.bill_id = 67890;
```

---

## 5. Domain Knowledge

### 5.1 Property Tax Glossary

**Essential Terms:**

- **Assessed Value**: Taxable value (after exemptions) used for tax calculation
- **Appraised Value**: Market value estimated by assessor
- **Levy**: Tax amount charged by a taxing district
- **Levy Rate**: Dollars of tax per $1,000 of assessed value
- **Mill Rate**: Same as levy rate (historical term)
- **Tax Area**: Geographic area with unique combination of taxing districts
- **Taxing District**: Entity that levies taxes (county, city, school, fire, hospital, etc.)
- **Homestead**: Primary residence, eligible for exemptions
- **Exemption**: Reduction in taxable value (senior, disabled, veteran, etc.)
- **Freeze**: Senior/disabled exemption that caps assessed value
- **Supplement**: Mid-year assessment change
- **Roll**: Annual assessment roll (list of all properties and values)
- **Certification**: Final approval of assessed values (submitted to state)
- **ARB**: Appraisal Review Board (hears appeals)
- **REET**: Real Estate Excise Tax (transfer tax on property sales)
- **Agricultural Use Value**: Reduced value for farmland (vs. market value)
- **Highest and Best Use**: Most profitable legal use of property

### 5.2 Valuation Approaches

**1. Cost Approach** (Primary for residential new construction)
```
Replacement Cost New (RCN)
  - Physical Depreciation
  - Functional Obsolescence
  - Economic Obsolescence
  = Depreciated Improvement Value
  + Land Value
  = Total Property Value
```

**2. Sales Comparison Approach** (Primary for residential existing)
```
Subject Property Characteristics
Compare to: Recent Sales of Similar Properties
Adjustments for:
  - Size differences
  - Quality differences
  - Age differences
  - Location differences
  = Indicated Value
```

**3. Income Approach** (Primary for commercial/investment properties)
```
Gross Income
  - Vacancy & Collection Loss
  = Effective Gross Income
  - Operating Expenses
  = Net Operating Income (NOI)
  / Capitalization Rate
  = Indicated Value
```

### 5.3 Assessment Cycle

**Key Dates (Washington State):**

| Date | Milestone | Description |
|------|-----------|-------------|
| January 1 | Assessment Date (Lien Date) | Property ownership and condition recorded |
| March 31 | Personal Property Filing Deadline | Businesses file personal property returns |
| April 30 | Board of Equalization Deadline | County completes valuation adjustments |
| May 31 | Appraisal Notice Mailing | Notices mailed to property owners |
| July 1 | Appeal Deadline | 60 days from notice mailing |
| August 15 | Certification Deadline | Values certified to state DOR |
| October 31 | Levy Certification | Taxing districts certify levy amounts |
| November 30 | Tax Statement Mailing | Tax bills mailed to owners |
| April 30 (next year) | First Half Due | First half payment due |
| October 31 (next year) | Second Half Due | Second half payment due |

---

## 6. Code Walkthrough Guides

### 6.1 Walkthrough: Property Search to Detail View

**User Action**: User searches for property "123-456-789"

**Code Flow:**

```
1. User enters geo_id in search box
   └─> PACS.NET.exe: PropertySearchForm.txtGeoId_TextChanged()

2. Client calls WCF service
   └─> PACSServiceClient.SearchProperties(new SearchCriteria { GeoId = "123-456-789" })

3. WCF PACSService receives request
   └─> PACSService.svc.cs: SearchProperties(SearchCriteria criteria)
       └─> SecurityService.CheckPermission(user, "PROP_VIEW")  // Authorization
       └─> PropertyService.Search(criteria)  // Business logic

4. PropertyService uses NHibernate
   └─> PropertyService.cs: Search(SearchCriteria criteria)
       └─> session.CreateCriteria<Property>()
                  .Add(Restrictions.Eq("GeoId", criteria.GeoId))
                  .List<Property>();

5. NHibernate generates SQL
   └─> SELECT p.*, pv.*, s.* 
       FROM property p
       LEFT JOIN property_val pv ON p.prop_id = pv.prop_id AND pv.prop_val_yr = 2024
       LEFT JOIN situs s ON p.prop_id = s.prop_id AND s.primary_situs = 'Y'
       WHERE p.geo_id = '123-456-789'

6. Results returned to client
   └─> PACSService returns List<PropertyDTO>
       └─> Client receives results
           └─> PropertySearchForm.gridResults.DataSource = results

7. User double-clicks result
   └─> PropertySearchForm.gridResults_DoubleClick()
       └─> PropertyDetailForm form = new PropertyDetailForm(selectedProperty);
           form.Show();

8. PropertyDetailForm loads
   └─> PropertyDetailForm_Load()
       └─> LoadPropertyGeneral()  // General tab
       └─> (Other tabs lazy-loaded on activation)

9. User clicks "Valuation" tab
   └─> tabControl_SelectedIndexChanged()
       └─> LoadPropertyValuation()
           └─> PACSServiceClient.GetPropertyValuation(propId, year, supNum)
               └─> Query: SELECT * FROM property_val, imprv, land_detail WHERE ...
               └─> Display values in grid
```

**Key Files:**
- Client: `PACS.NET/Forms/PropertySearchForm.cs`
- Client: `PACS.NET/Forms/PropertyDetailForm.cs`
- Service: `PACS.Services/PACSService.svc.cs`
- Business Logic: `PACS.BusinessLogic/PropertyService.cs`
- ORM Mapping: `PACS.Domain/Mappings/Property.hbm.xml`

### 6.2 Walkthrough: Recalculation Flow

**User Action**: User clicks "Recalc" button on property detail

**Code Flow:**

```
1. User clicks Recalc button
   └─> PropertyDetailForm.btnRecalc_Click()

2. Show progress dialog
   └─> ProgressDialog.Show("Recalculating property values...")

3. Call WCF service (async)
   └─> await PACSServiceClient.RecalcPropertyAsync(propId, year, supNum)

4. WCF PACSService receives request
   └─> PACSService.svc.cs: RecalcProperty(int propId, int year, int supNum)
       └─> SecurityService.CheckPermission(user, "VAL_RECALC")
       └─> PropertyService.Recalculate(propId, year, supNum)

5. PropertyService prepares recalc
   └─> PropertyService.cs: Recalculate()
       └─> // Validate property exists
       └─> // Check for recalc errors (clear if found)
       └─> // Call database stored procedure

6. Execute RecalcProperty stored procedure
   └─> SqlCommand: EXEC RecalcProperty @prop_id, @year, @sup_num

7. RecalcProperty.sql stored procedure
   └─> -- Validate parameters
       └─> IF @prop_id = 0 THEN use recalc_prop_list ELSE recalc single property
       └─> -- Call extended stored procedure
       EXEC master..xp_RecalcProperty90 
            @server_name, @database_name, @prop_id, @year, @sup_num, ...

8. Extended SP (C++ DLL) executes
   └─> xp_RecalcProperty90.dll
       └─> Read xsp_pacs_config (system parameters)
       └─> For each imprv_detail:
           └─> Calculate unit_price × area = orig_val
           └─> Apply depreciation: orig_val × (1 - dep_pct) = calc_val
           └─> Apply adjustments: calc_val × adj_factor = adj_val
       └─> Roll up imprv values:
           └─> SUM(imprv_detail.adj_val) → imprv.imprv_val
       └─> For each land_detail:
           └─> Calculate land_size × unit_price = land_val
       └─> Roll up to property_val:
           └─> SUM(imprv.imprv_val) → property_val.imprv_hstd_val
           └─> SUM(land_detail.land_val) → property_val.land_hstd_val
           └─> imprv_hstd_val + land_hstd_val → property_val.prop_val
       └─> Apply exemptions:
           └─> IF freeze_ceiling THEN assessed_val = freeze_ceiling
           └─> ELSE assessed_val = prop_val

9. Return to client
   └─> Extended SP completes → RecalcProperty.sql returns → WCF service returns

10. Client refreshes display
    └─> PropertyDetailForm receives success response
        └─> LoadPropertyValuation()  // Refresh values
        └─> ProgressDialog.Close()
        └─> MessageBox.Show("Recalculation complete")
```

**Key Files:**
- Client: `PACS.NET/Forms/PropertyDetailForm.cs` (btnRecalc_Click)
- Service: `PACS.Services/PACSService.svc.cs` (RecalcProperty method)
- Business Logic: `PACS.BusinessLogic/PropertyService.cs` (Recalculate method)
- Database: `DatabaseProjectpacs_oltp/dbo/StoredProcedures/RecalcProperty.sql`
- Extended SP: `master..xp_RecalcProperty90` (C++ DLL, proprietary)

---

## 7. Data Flow Tracing

### 7.1 Building Permit Import Flow

**Trigger**: CSV file dropped to `\\JCHARRISPACS\BuildingPermit_Import\`

**Complete Flow:**

```
1. External Permit System
   └─> Nightly export job (2:00 AM)
       └─> Generate CSV file: permit_20241103.csv
           └─> Columns: permit_num, issue_date, permit_type, valuation, address, ...
           └─> Save to: \\JCHARRISPACS\BuildingPermit_Import\permit_20241103.csv

2. Windows Task Scheduler
   └─> Schedule: Daily at 2:30 AM
       └─> Run: pwsh.exe -File "C:\Scripts\BuildingPermitLoader.ps1"

3. BuildingPermitLoader.ps1 script
   └─> $csvFiles = Get-ChildItem "\\JCHARRISPACS\BuildingPermit_Import\*.csv"
       └─> ForEach ($csv in $csvFiles):
           └─> // BULK INSERT to staging table
               sqlcmd -S localhost -d CIAPS -E -Q "
                 BULK INSERT permit.building_import
                 FROM '\\JCHARRISPACS\BuildingPermit_Import\$csv'
                 WITH (FIRSTROW = 2, FIELDTERMINATOR = ',', ROWTERMINATOR = '\n')
               "
           └─> // Call processing stored procedure
               sqlcmd -S localhost -d CIAPS -E -Q "
                 EXEC permit.pProcess_BuildingImport
               "
           └─> // Move to archive
               Move-Item $csv "\\JCHARRISPACS\BuildingPermit_Import\archive_$(Get-Date -f yyyyMMdd)\"

4. pProcess_BuildingImport stored procedure
   └─> CIAPS.permit.pProcess_BuildingImport.sql
       └─> // Iterate through building_import staging table
           DECLARE cursor FOR SELECT * FROM permit.building_import WHERE processed_dt IS NULL
           OPEN cursor
           FETCH NEXT FROM cursor INTO @permit_num, @address, @geo_id, ...
           
           WHILE @@FETCH_STATUS = 0:
               └─> // Attempt to match to property
                   DECLARE @prop_id INT = NULL
                   
                   // Method 1: Match by geo_id (taxlot)
                   IF @geo_id IS NOT NULL:
                     SELECT @prop_id = prop_id 
                     FROM [pacs_oltp].[dbo].[property]  -- Cross-database!
                     WHERE simple_geo_id = REPLACE(REPLACE(@geo_id, '-', ''), ' ', '')
                   
                   // Method 2: Match by situs address
                   IF @prop_id IS NULL:
                     SELECT TOP 1 @prop_id = s.prop_id
                     FROM [pacs_oltp].[dbo].[situs] s
                     WHERE CONCAT(s.situs_num, ' ', s.situs_street) = @address
                   
                   // Insert/update building_permit
                   IF EXISTS (SELECT 1 FROM building_permit WHERE permit_num = @permit_num):
                     UPDATE building_permit SET issue_date = @issue_date, ... 
                     WHERE permit_num = @permit_num
                   ELSE:
                     INSERT INTO building_permit (permit_num, issue_date, ...)
                     VALUES (@permit_num, @issue_date, ...)
                   
                   // Create property association (if matched)
                   IF @prop_id IS NOT NULL:
                     INSERT INTO [pacs_oltp].[dbo].[prop_building_permit_assoc]
                     (prop_id, permit_id, assoc_dt)
                     VALUES (@prop_id, @@IDENTITY, GETDATE())
                   ELSE:
                     // Log error (couldn't match to property)
                     INSERT INTO permit.building_permit_import_error
                     (permit_num, error_desc)
                     VALUES (@permit_num, 'Could not match to property')
                   
                   // Mark as processed
                   UPDATE permit.building_import 
                   SET processed_dt = GETDATE() 
                   WHERE permit_num = @permit_num
               
               FETCH NEXT FROM cursor INTO @permit_num, ...
           
           CLOSE cursor
           DEALLOCATE cursor

5. PACS Client Display
   └─> User opens property in PACS.NET.exe
       └─> PropertyDetailForm loads
           └─> Click "Permits" tab
               └─> LoadPermits()
                   └─> WCF call: PACSServiceClient.GetBuildingPermits(propId)
                       └─> Query: SELECT bp.* 
                                   FROM prop_building_permit_assoc pbpa
                                   JOIN building_permit bp ON pbpa.permit_id = bp.permit_id
                                   WHERE pbpa.prop_id = @prop_id
                       └─> Display permits in grid (permit_num, issue_date, valuation, status)
```

**Key Integration Points:**
- **Cross-database queries**: CIAPS → pacs_oltp (via synonyms or full qualification)
- **Address matching**: Fuzzy logic (may need manual review for unmatched)
- **Error handling**: building_permit_import_error table (manual resolution queue)
- **Logging**: Misc/log.log file (PowerShell script output)

### 7.2 Tax Calculation Flow

**Trigger**: Annual levy certification received from taxing districts

**Complete Flow:**

```
1. Levy Certification (October)
   └─> Taxing districts submit levy amounts:
       └─> County: $50,000,000
       └─> City of Richland: $25,000,000
       └─> School District: $75,000,000
       └─> Fire District: $10,000,000
       └─> Hospital District: $5,000,000
       └─> Total: $165,000,000

2. Load Levy Data
   └─> INSERT INTO levy (levy_cd, levy_yr, levy_amt, levy_desc)
       VALUES 
         ('COUNTY', 2024, 50000000, 'Benton County'),
         ('RICH', 2024, 25000000, 'City of Richland'),
         ('BSD', 2024, 75000000, 'Badger School District'),
         ('FD1', 2024, 10000000, 'Fire District 1'),
         ('HOSP', 2024, 5000000, 'Hospital District');

3. Calculate Levy Rates
   └─> // Levy rate = (levy_amt / total_taxable_value) × 1000
       
       UPDATE levy
       SET levy_rate = (levy_amt / (
         SELECT SUM(assessed_val) 
         FROM property_val pv
         JOIN tax_area_prop_assoc tapa ON pv.prop_id = tapa.prop_id
         JOIN tax_area_fund_assoc tafa ON tapa.tax_area_id = tafa.tax_area_id
         WHERE tafa.levy_cd = levy.levy_cd
           AND pv.prop_val_yr = levy.levy_yr
           AND pv.sup_num = 0
       )) * 1000
       WHERE levy_yr = 2024;
       
       // Example result: County levy rate = $2.50 per $1,000 assessed value

4. Generate Tax Bills (November)
   └─> EXEC pGenerate_TaxStatements @year = 2024
       
       └─> // For each property:
           DECLARE cursor FOR SELECT prop_id FROM property_val WHERE prop_val_yr = 2024 AND sup_num = 0
           
           WHILE @@FETCH_STATUS = 0:
               └─> // Get property assessed value
                   SELECT @assessed_val = assessed_val FROM property_val WHERE prop_id = @prop_id
               
               └─> // Get tax area
                   SELECT @tax_area_id = tax_area_id FROM tax_area_prop_assoc WHERE prop_id = @prop_id
               
               └─> // Get applicable levies for this tax area
                   SELECT levy_cd INTO #levies FROM tax_area_fund_assoc WHERE tax_area_id = @tax_area_id
               
               └─> // Calculate per-owner taxable values (handles partial ownership, exemptions)
                   EXEC CalculateTaxable @prop_id, 2024, 0
                   -- Populates wash_prop_owner_val table
               
               └─> // Create bill for each owner
                   INSERT INTO bill (bill_id, prop_id, year, sup_num, owner_id, ...)
                   SELECT 
                     NEXT VALUE FOR bill_id_seq,
                     wpov.prop_id,
                     wpov.prop_val_yr,
                     wpov.sup_num,
                     wpov.owner_id,
                     ...
                   FROM wash_prop_owner_val wpov
                   WHERE wpov.prop_id = @prop_id;
               
               └─> // Create levy_bill records (breakdown by district)
                   INSERT INTO levy_bill (bill_id, levy_cd, taxable_value, levy_rate, levy_tax)
                   SELECT 
                     @bill_id,
                     l.levy_cd,
                     wpov.taxable_value,
                     l.levy_rate,
                     (wpov.taxable_value / 1000) * l.levy_rate  -- Tax calculation!
                   FROM wash_prop_owner_val wpov
                   CROSS JOIN levy l
                   JOIN #levies lv ON l.levy_cd = lv.levy_cd
                   WHERE wpov.prop_id = @prop_id AND l.levy_yr = 2024;
               
               └─> // Update bill total
                   UPDATE bill
                   SET initial_amount_due = (SELECT SUM(levy_tax) FROM levy_bill WHERE bill_id = @bill_id),
                       current_amount_due = initial_amount_due
                   WHERE bill_id = @bill_id;

5. Generate Tax Statements (Printed Notices)
   └─> EXEC pGenerate_WATaxStatements @year = 2024
       
       └─> // Group bills by owner (one statement per owner)
           INSERT INTO wa_tax_statement (statement_id, year, owner_id, ...)
           SELECT 
             NEXT VALUE FOR statement_id_seq,
             2024,
             owner_id,
             ...
           FROM (SELECT DISTINCT owner_id FROM bill WHERE year = 2024) owners;
       
       └─> // Populate statement detail (properties for this owner)
           INSERT INTO wa_tax_statement_property (statement_id, bill_id, ...)
           SELECT statement_id, bill_id, ...
           FROM wa_tax_statement ts
           JOIN bill b ON ts.owner_id = b.owner_id AND ts.year = b.year;
       
       └─> // Print statements (Crystal Reports)
           -- Batch print job generates PDFs
           -- Mail merge for addresses

6. Mail Tax Statements
   └─> Physical mail via county mail room

7. Payment Processing (see Exercise 3 above)
```

**Key Calculations:**
```
Levy Rate = (Levy Amount / Total Taxable Value) × 1000
  Example: ($50,000,000 / $10,000,000,000) × 1000 = $5.00 per $1,000

Property Tax = (Assessed Value / 1000) × Levy Rate
  Example: ($250,000 / 1000) × $5.00 = $1,250
```

---

## 8. Performance Optimization

### 8.1 Query Optimization Checklist

**Before Optimization:**

```sql
-- Capture baseline metrics
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Run query
SELECT ...;

-- Review metrics:
-- - Logical reads (should be low)
-- - CPU time (milliseconds)
-- - Elapsed time (milliseconds)
```

**Optimization Steps:**

□ **Step 1: Review Execution Plan**
  - Enable actual execution plan (Ctrl+M in SSMS)
  - Look for: Table scans, index scans, missing index warnings
  - Target: Index seeks, low cost operations

□ **Step 2: Add Missing Indexes**
  - Follow missing index recommendations (with caution)
  - Prefer covering indexes (INCLUDE columns)
  - Consider filtered indexes for selective predicates

□ **Step 3: Rewrite Query**
  - Avoid SELECT * (specify only needed columns)
  - Use EXISTS instead of IN for subqueries
  - Eliminate unnecessary JOINs
  - Use WITH (NOLOCK) if stale data acceptable

□ **Step 4: Update Statistics**
  - Run: `UPDATE STATISTICS [table] WITH FULLSCAN;`
  - Enable auto-update statistics asynchronously

□ **Step 5: Consider Indexed Views**
  - For frequently joined tables
  - For complex aggregations
  - Requires SCHEMABINDING

**Example Optimization:**

```sql
-- ❌ SLOW: Correlated subquery
SELECT p.prop_id, p.geo_id,
  (SELECT MAX(sale_price) FROM sale WHERE prop_id = p.prop_id) AS last_sale_price
FROM property p
WHERE p.prop_type_cd = 'R';

-- ✅ FAST: JOIN instead
SELECT p.prop_id, p.geo_id, s.sale_price AS last_sale_price
FROM property p
LEFT JOIN (
  SELECT prop_id, sale_price,
    ROW_NUMBER() OVER (PARTITION BY prop_id ORDER BY sale_date DESC) AS rn
  FROM sale
) s ON p.prop_id = s.prop_id AND s.rn = 1
WHERE p.prop_type_cd = 'R';

-- ✅ EVEN FASTER: Indexed view
CREATE VIEW vw_last_sale
WITH SCHEMABINDING AS
SELECT prop_id, MAX(sale_date) AS last_sale_date
FROM dbo.sale
GROUP BY prop_id;

CREATE UNIQUE CLUSTERED INDEX idx_vw_last_sale ON vw_last_sale (prop_id);

SELECT p.prop_id, p.geo_id, s.sale_price
FROM property p
LEFT JOIN vw_last_sale vls ON p.prop_id = vls.prop_id
LEFT JOIN sale s ON vls.prop_id = s.prop_id AND vls.last_sale_date = s.sale_date
WHERE p.prop_type_cd = 'R';
```

### 8.2 Application Performance Tips

**Client-Side:**

1. **Lazy Load Tabs**: Don't load all property data upfront
   ```csharp
   private void tabControl_SelectedIndexChanged(object sender, EventArgs e)
   {
       if (tabControl.SelectedTab == tabValuation && !valuationLoaded)
       {
           LoadPropertyValuation();
           valuationLoaded = true;
       }
   }
   ```

2. **Cache Lookup Data**: Load code tables once, cache in memory
   ```csharp
   private static Dictionary<string, string> _propertyTypeLookup = null;
   
   private Dictionary<string, string> GetPropertyTypes()
   {
       if (_propertyTypeLookup == null)
       {
           _propertyTypeLookup = PACSServiceClient.GetPropertyTypes()
               .ToDictionary(pt => pt.Code, pt => pt.Description);
       }
       return _propertyTypeLookup;
   }
   ```

3. **Async Service Calls**: Don't block UI thread
   ```csharp
   private async void btnSearch_Click(object sender, EventArgs e)
   {
       progressBar.Visible = true;
       var results = await PACSServiceClient.SearchPropertiesAsync(criteria);
       gridResults.DataSource = results;
       progressBar.Visible = false;
   }
   ```

**Service-Side:**

1. **Enable NHibernate Second-Level Cache**: For lookup tables
   ```xml
   <class name="PropertyType" table="property_type">
     <cache usage="read-only" />
     ...
   </class>
   ```

2. **Batch Fetching**: Reduce N+1 queries
   ```xml
   <set name="Improvements" batch-size="25">
     ...
   </set>
   ```

3. **Use Stored Procedures for Complex Logic**: Avoid multiple round-trips
   ```csharp
   // Instead of: Load property, load owners, load improvements, ...
   // Do: Single stored procedure that returns everything
   var property = session.CreateSQLQuery("EXEC pGet_PropertyComplete @prop_id")
       .SetParameter("prop_id", propId)
       .SetResultTransformer(Transformers.AliasToBean<PropertyDTO>())
       .UniqueResult<PropertyDTO>();
   ```

---

## 9. Research Resources

### 9.1 Official Documentation

**Microsoft Documentation:**
- .NET Framework: https://learn.microsoft.com/en-us/dotnet/framework/
- SQL Server: https://learn.microsoft.com/en-us/sql/
- WCF: https://learn.microsoft.com/en-us/dotnet/framework/wcf/
- NHibernate: https://nhibernate.info/doc/

**Vendor Documentation:**
- DevExpress: https://docs.devexpress.com/
- ESRI ArcGIS: https://developers.arcgis.com/
- TrueAutomation PACS: [Contact vendor for documentation]

**Washington State Resources:**
- DOR Property Tax Division: https://dor.wa.gov/taxes-rates/property-tax
- RCW Title 84 (Property Tax): https://app.leg.wa.gov/RCW/default.aspx?Title=84
- County Assessor's Manual: https://dor.wa.gov/get-form-or-publication/publications-subject/tax-topics/property-tax/assessors-reference-library

### 9.2 Community Forums

- **Stack Overflow**: SQL Server, C#, .NET Framework questions
- **NHibernate Users Group**: Google Groups
- **DevExpress Support Center**: https://supportcenter.devexpress.com/

### 9.3 Books

**Recommended Reading:**

1. **C# and .NET:**
   - "C# in Depth" by Jon Skeet
   - "CLR via C#" by Jeffrey Richter

2. **SQL Server:**
   - "SQL Server Execution Plans" by Grant Fritchey
   - "T-SQL Querying" by Itzik Ben-Gan

3. **NHibernate:**
   - "NHibernate in Action" by Pierre Henri Kuaté

4. **Property Tax:**
   - "Property Appraisal and Assessment Administration" by IAAO
   - "Mass Appraisal of Real Property" by IAAO

---

## 10. Expert Interview Questions

### 10.1 For Database Specialists

**Q1**: "Explain the composite key pattern in PACS and why it was chosen."

**Expected Answer:**
- Composite keys (prop_val_yr, sup_num, prop_id) allow historical tracking
- Each year is a snapshot (prop_val_yr)
- Supplements (sup_num) handle mid-year changes without modifying main roll
- Trade-off: More complex queries, but better auditability and legal defensibility

**Q2**: "How would you optimize a query that's doing a table scan on property_val with 500,000 rows?"

**Expected Answer:**
- Check WHERE clause for sargable predicates
- Ensure indexes exist on filtered columns (prop_val_yr, sup_num)
- Consider filtered index if always filtering on prop_inactive_dt IS NULL
- Use covering index (INCLUDE columns) to avoid key lookups
- Update statistics if cardinality estimates are wrong

**Q3**: "Describe the change log pattern and its importance."

**Expected Answer:**
- Triggers on every table (tr_*_update_ChangeLog)
- Captures old vs. new values for every UPDATE
- Stores in change_log table with user_id, timestamp
- Legal requirement for audit trail (7-10 year retention)
- Enables "who changed what when" queries
- Performance impact: ~10% overhead on writes (acceptable for auditability)

### 10.2 For Application Developers

**Q1**: "Walk me through the optimistic concurrency pattern in PACS."

**Expected Answer:**
- Uses rowversion (timestamp) column
- NHibernate compares rowversion on UPDATE
- If rowversion changed, throws StaleObjectStateException
- Client catches exception, prompts user to refresh and retry
- Alternative to pessimistic locking (avoids lock contention)

**Q2**: "How would you add a new WCF service endpoint for a new feature?"

**Expected Answer:**
- Define service contract interface (INewService)
- Implement service class (NewService.svc)
- Register in Castle Windsor (service locator)
- Add endpoint to Web.config (service host)
- Generate client proxy (Add Service Reference)
- Update client App.config with endpoint
- Deploy service to IIS, restart app pool

**Q3**: "Explain the lazy loading pattern in property detail forms."

**Expected Answer:**
- PropertyDetailForm has multiple tabs (General, Valuation, Land, Improvements, etc.)
- Only General tab loaded on form open
- Other tabs loaded on first activation (tabControl_SelectedIndexChanged)
- Flag prevents re-loading: if (!valuationLoaded) { Load(); valuationLoaded = true; }
- Reduces initial load time from ~5 seconds to ~2 seconds
- Improves user experience (perceived performance)

### 10.3 For System Architects

**Q1**: "What are the risks of the current technology stack, and how would you mitigate them?"

**Expected Answer:**
- **Risk 1**: .NET Framework 4.8 is in maintenance mode (no new features)
  - Mitigation: Plan .NET 6/8 migration (2-3 year project)
- **Risk 2**: WCF deprecated in .NET Core/5+
  - Mitigation: Migrate to gRPC or REST APIs incrementally
- **Risk 3**: Extended stored procedures (xp_*) are proprietary vendor DLLs
  - Mitigation: Document functionality, consider T-SQL rewrites, maintain vendor relationship
- **Risk 4**: DevExpress and ArcGIS versions out of support
  - Mitigation: Immediate upgrade to latest versions (already planned)

**Q2**: "How would you design a new microservice to replace the monolithic WCF services?"

**Expected Answer:**
- **Approach**: Strangler fig pattern (incremental replacement)
- **Services**: PropertyService, ValuationService, CollectionService, ReportingService
- **Technology**: ASP.NET Core 6/8, gRPC for internal, REST for external
- **Data**: Separate databases or schema-per-service (eventual consistency)
- **Communication**: Event-driven (RabbitMQ or Azure Service Bus)
- **Deployment**: Docker containers, Kubernetes orchestration
- **Migration**: Run old and new side-by-side, gradually shift traffic

**Q3**: "Design a caching strategy for PACS to improve performance."

**Expected Answer:**
- **Level 1 (Client)**: Cache lookup tables (property types, code tables) in memory, refresh daily
- **Level 2 (Service)**: NHibernate second-level cache for read-mostly entities
- **Level 3 (Database)**: SQL Server query result cache (application-level)
- **Level 4 (Distributed)**: Redis cache for cross-server sharing
- **Invalidation**: Event-based (publish cache invalidation on updates)
- **Monitoring**: Track hit/miss ratios, tune cache expiration policies

---

## 11. Next Steps for Deep Understanding

### Immediate Actions (This Week)

- [ ] Set up local development environment
- [ ] Run all exercises in section 2
- [ ] Read PACS_DEEP_DIVE.md completely
- [ ] Review TECH_STACK.md for technology familiarity gaps
- [ ] Map out one complete workflow end-to-end (choose property search or recalc)

### Short-Term Goals (This Month)

- [ ] Complete a small bug fix or feature independently
- [ ] Shadow an experienced developer for a week
- [ ] Attend appraisal cycle meeting (understand business context)
- [ ] Document a new workflow not covered in existing docs

### Long-Term Mastery (Next 3-6 Months)

- [ ] Become the "go-to" person for one subsystem (e.g., valuations, collections, GIS)
- [ ] Present a technical deep-dive to the team
- [ ] Contribute to architecture decisions (e.g., .NET migration planning)
- [ ] Mentor a new developer using these learning resources

---

**Document Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-03 | TrueAutomation PACS Elite Engineering Team | Initial learning resources document |

---

*End of Learning Resources & Deep Understanding Guide*
