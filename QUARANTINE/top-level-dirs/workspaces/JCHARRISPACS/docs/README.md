# PACS Documentation Suite - Index & Quick Reference

## Document Control

**System**: Benton County Property Assessment and Collection System (PACS)  
**Purpose**: Master index and quick reference for all PACS documentation  
**Version**: 1.0  
**Date**: November 3, 2025  
**Prepared By**: TrueAutomation PACS Elite Government OS Engineering Team

---

## Documentation Suite Overview

This workspace contains comprehensive technical documentation for the Benton County PACS system. The documentation is organized into specialized guides for different audiences and purposes.

### Core Documents

1. **PACS_DEEP_DIVE.md** (1,533 lines)
   - **Audience**: All technical staff
   - **Purpose**: Complete system architecture and technical explanation
   - **Topics**: Database schema, workflows, calculations, integrations, client architecture

2. **RPD_REQUIREMENTS_PLANNING_DESIGN.md** (1,400+ lines)
   - **Audience**: Project managers, architects, stakeholders
   - **Purpose**: Requirements, planning, and design specifications
   - **Topics**: Business requirements, functional specs, architecture, deployment, testing

3. **TECH_STACK.md** (1,300+ lines)
   - **Audience**: Developers, architects, IT operations
   - **Purpose**: Complete technology inventory and specifications
   - **Topics**: All technologies, versions, configurations, migration paths

4. **LEARNING_GUIDE.md** (1,200+ lines)
   - **Audience**: New developers, domain learners
   - **Purpose**: Learning pathways and advanced understanding
   - **Topics**: Exercises, walkthroughs, troubleshooting, domain knowledge

---

## Quick Reference Guide

### System Components

**6-Database Architecture:**
```
pacs_oltp          → Production PACS database
PACS_Training      → Training/backup clone
CIAPS              → Building permits (third-party)
TA_AppSvr          → Tax assessor app server
Web_Internet_Benton → Public website data
SSISDB             → ETL catalog
```

**Key Applications:**
```
PACS.NET.exe       → Main client application
PACS.ADMIN.exe     → Administration interface
PACS.QUERY.exe     → Query/reporting tool
BuildingPermitLoader.ps1 → ETL script
```

**Technology Stack:**
```
Client:    .NET Framework 4.8, WinForms, DevExpress 20.2, ArcGIS 10.2.6
Service:   WCF, NHibernate, Castle Windsor, IIS 10
Database:  SQL Server 2022 Enterprise, Always On Availability Groups
Tools:     Visual Studio 2022, SSMS, Git, Docker
```

### Core Database Tables

**Property Hierarchy:**
```
property                     → Base property record (prop_id PK)
├── property_val            → Annual valuations (composite PK: prop_val_yr, sup_num, prop_id)
│   ├── imprv               → Improvements/buildings
│   │   └── imprv_detail    → Improvement components
│   └── land_detail         → Land components
├── situs                    → Property addresses
├── owner                    → Ownership records by year
└── building_permit          → Building permits (CIAPS)
```

**Account/Billing:**
```
account                      → People and entities (acct_id PK)
├── address                  → Mailing addresses
└── owner                    → Links accounts to properties

bill                         → Tax bills (bill_id PK)
├── levy_bill               → Levy breakdown by district
└── payment_transaction_assoc → Payment applications
```

### Essential Queries

**Current Year Property Values:**
```sql
SELECT p.prop_id, p.geo_id, pv.prop_val, pv.assessed_val, s.situs_display
FROM property p WITH (NOLOCK)
JOIN property_val pv WITH (NOLOCK) 
  ON p.prop_id = pv.prop_id 
  AND pv.prop_val_yr = 2024 
  AND pv.sup_num = 0
JOIN situs s WITH (NOLOCK) 
  ON p.prop_id = s.prop_id 
  AND s.primary_situs = 'Y'
WHERE pv.prop_inactive_dt IS NULL;
```

**Property Ownership:**
```sql
SELECT o.owner_tax_yr, a.file_as_name, o.pct_ownership
FROM owner o WITH (NOLOCK)
JOIN account a WITH (NOLOCK) ON o.owner_id = a.acct_id
WHERE o.prop_id = 12345 
  AND o.owner_tax_yr = 2024 
  AND o.sup_num = 0;
```

**Tax Bill Details:**
```sql
SELECT b.bill_id, b.prop_id, b.owner_id, 
       b.initial_amount_due, b.current_amount_due, b.amount_paid,
       lb.levy_cd, lb.levy_desc, lb.levy_tax
FROM bill b WITH (NOLOCK)
JOIN levy_bill lb WITH (NOLOCK) ON b.bill_id = lb.bill_id
WHERE b.prop_id = 12345 
  AND b.year = 2024;
```

### Key Stored Procedures

**Valuation:**
```sql
EXEC RecalcProperty @prop_id = 12345, @year = 2024, @sup_num = 0;
EXEC CalculateTaxable @prop_id = 12345, @year = 2024, @sup_num = 0;
EXEC CalculatePOES @prop_id = 12345, @year = 2024;
```

**Billing:**
```sql
EXEC pGenerate_TaxStatements @year = 2024;
EXEC pGenerate_WATaxStatements @year = 2024;
```

**ETL:**
```sql
EXEC permit.pProcess_BuildingImport;
EXEC pExport_PropertyData;
```

### Common Patterns

**Composite Key Pattern:**
```sql
-- Always include all key components:
WHERE prop_val_yr = 2024 AND sup_num = 0 AND prop_id = 12345
```

**Soft Delete Pattern:**
```sql
-- Always filter inactive properties:
WHERE prop_inactive_dt IS NULL
```

**WITH (NOLOCK) Pattern:**
```sql
-- Use for read-only queries to reduce blocking:
SELECT * FROM property_val WITH (NOLOCK) WHERE ...
```

**Change Log Pattern:**
```sql
-- Query audit trail:
SELECT * FROM change_log 
WHERE table_name = 'property_val' 
  AND key_prop_id = 12345 
ORDER BY chg_dt DESC;
```

### Calculation Formulas

**Property Value:**
```
Improvement Value = Σ(imprv_detail.imprv_det_adj_val)
Land Value = Σ(land_detail.land_val)
Total Property Value = Improvement Value + Land Value
Assessed Value = Total Property Value (or freeze_ceiling, or ag_use_val)
```

**Tax Calculation:**
```
Levy Rate = (Levy Amount / Total Taxable Value) × 1000
Property Tax = (Assessed Value / 1000) × Levy Rate
Total Tax = Σ(All Levy Taxes for this property's tax area)
```

**Depreciation:**
```
Replacement Cost New (RCN) = Area × Unit Price
Depreciation % = Physical % + Economic % + Functional %
Depreciated Value = RCN × (1 - Depreciation %)
```

---

## Where to Find Information

### For New Developers

**"How do I set up my environment?"**
→ LEARNING_GUIDE.md, Section 1.1

**"What does this table do?"**
→ PACS_DEEP_DIVE.md, Section 1.2 (Core Entity Model)

**"How do I trace this workflow?"**
→ LEARNING_GUIDE.md, Section 6 (Code Walkthrough Guides)

### For Experienced Developers

**"What technologies are we using?"**
→ TECH_STACK.md, Section 1 (Technology Stack Overview)

**"How do I optimize this slow query?"**
→ LEARNING_GUIDE.md, Section 8 (Performance Optimization)

**"How does the recalculation work?"**
→ PACS_DEEP_DIVE.md, Section 2.1 (Value Calculation Pipeline)
→ LEARNING_GUIDE.md, Section 6.2 (Recalculation Flow Walkthrough)

### For Architects

**"What are the system requirements?"**
→ RPD_REQUIREMENTS_PLANNING_DESIGN.md, Section 2-4

**"What's our deployment strategy?"**
→ RPD_REQUIREMENTS_PLANNING_DESIGN.md, Section 11

**"What are the technology risks?"**
→ TECH_STACK.md, Section 13 (Technology Lifecycle)
→ RPD_REQUIREMENTS_PLANNING_DESIGN.md, Section 13 (Risks & Mitigation)

### For Project Managers

**"What are the business requirements?"**
→ RPD_REQUIREMENTS_PLANNING_DESIGN.md, Section 2 (Business Requirements)

**"What's the development timeline?"**
→ RPD_REQUIREMENTS_PLANNING_DESIGN.md, Section 9 (Development Planning)

**"What are success criteria?"**
→ RPD_REQUIREMENTS_PLANNING_DESIGN.md, Section 14 (Success Criteria)

### For Business Users

**"How does property valuation work?"**
→ PACS_DEEP_DIVE.md, Section 2 (Property Valuation Workflow)

**"What's the annual appraisal cycle?"**
→ PACS_DEEP_DIVE.md, Section 3 (Annual Appraisal Cycle)

**"How are taxes calculated?"**
→ PACS_DEEP_DIVE.md, Section 7 (Tax Calculation and Billing)
→ LEARNING_GUIDE.md, Section 7.2 (Tax Calculation Flow)

### For Troubleshooting

**"Property won't recalculate"**
→ LEARNING_GUIDE.md, Section 4, Scenario 1

**"Slow performance"**
→ LEARNING_GUIDE.md, Section 4, Scenario 2
→ LEARNING_GUIDE.md, Section 8 (Performance Optimization)

**"Payment not applying"**
→ LEARNING_GUIDE.md, Section 4, Scenario 3

---

## Document Usage Matrix

| Role | Primary Document | Secondary Documents |
|------|------------------|---------------------|
| **New Developer** | LEARNING_GUIDE.md | PACS_DEEP_DIVE.md, TECH_STACK.md |
| **Senior Developer** | TECH_STACK.md | PACS_DEEP_DIVE.md, LEARNING_GUIDE.md |
| **Architect** | RPD_REQUIREMENTS_PLANNING_DESIGN.md | TECH_STACK.md, PACS_DEEP_DIVE.md |
| **Project Manager** | RPD_REQUIREMENTS_PLANNING_DESIGN.md | All others for reference |
| **DBA** | PACS_DEEP_DIVE.md (Section 1-2, 6) | TECH_STACK.md (Section 4) |
| **Business Analyst** | PACS_DEEP_DIVE.md (Section 2-3, 7-8) | LEARNING_GUIDE.md (Section 5) |
| **QA Tester** | LEARNING_GUIDE.md (Section 2-4) | RPD_REQUIREMENTS_PLANNING_DESIGN.md (Section 10) |
| **IT Operations** | TECH_STACK.md (Section 6, 9) | RPD_REQUIREMENTS_PLANNING_DESIGN.md (Section 12) |

---

## Learning Paths by Experience Level

### Level 1: Beginner (0-3 months)

**Week 1-2: Foundation**
1. Read: PACS_DEEP_DIVE.md (Executive Summary, Section 1)
2. Read: TECH_STACK.md (Section 1-2)
3. Do: LEARNING_GUIDE.md (Section 1.1, Week 1-2 exercises)
4. Practice: LEARNING_GUIDE.md (Section 2, Exercise 1-2)

**Week 3-4: Core Concepts**
1. Read: PACS_DEEP_DIVE.md (Section 2-3)
2. Do: LEARNING_GUIDE.md (Section 1.1, Week 3-4 tasks)
3. Practice: LEARNING_GUIDE.md (Section 2, Exercise 3)
4. Study: LEARNING_GUIDE.md (Section 5, Domain Knowledge)

**Month 2-3: Hands-On Development**
1. Complete: LEARNING_GUIDE.md (Section 1.1, Week 5-8 tasks)
2. Read: PACS_DEEP_DIVE.md (Section 4-8)
3. Practice: LEARNING_GUIDE.md (Section 4, Troubleshooting Scenarios)

### Level 2: Intermediate (3-12 months)

**Month 3-6: Advanced Topics**
1. Read: PACS_DEEP_DIVE.md (Complete)
2. Study: LEARNING_GUIDE.md (Section 1.2, Advanced Database Patterns)
3. Deep Dive: LEARNING_GUIDE.md (Section 6-7, Code Walkthroughs & Data Flow)
4. Read: TECH_STACK.md (Complete)

**Month 6-12: System Expertise**
1. Study: RPD_REQUIREMENTS_PLANNING_DESIGN.md (Section 2-8)
2. Master: LEARNING_GUIDE.md (Section 1.3, Domain Expert path)
3. Practice: LEARNING_GUIDE.md (Section 10, Expert Interview Questions)
4. Contribute: Document new features/workflows

### Level 3: Expert (12+ months)

**Ongoing Mastery**
1. Study: TECH_STACK.md (Section 13-14, Migration Considerations)
2. Review: RPD_REQUIREMENTS_PLANNING_DESIGN.md (Section 9-13, Planning & Risks)
3. Lead: Architecture decisions, code reviews, mentoring
4. Contribute: New documentation, best practices, training materials

---

## Key Concepts by Topic

### Property Valuation
- **Documents**: PACS_DEEP_DIVE.md (Section 2), LEARNING_GUIDE.md (Section 6.2)
- **Tables**: property_val, imprv, imprv_detail, land_detail
- **Procedures**: RecalcProperty, CalculateTaxable
- **Concepts**: Cost approach, depreciation, Matrix schedules

### Tax Calculation
- **Documents**: PACS_DEEP_DIVE.md (Section 7), LEARNING_GUIDE.md (Section 7.2)
- **Tables**: levy, tax_area, levy_bill, bill
- **Procedures**: pGenerate_TaxStatements, CalculateTaxable
- **Formulas**: (Assessed Value / 1000) × Levy Rate = Tax

### Database Architecture
- **Documents**: PACS_DEEP_DIVE.md (Section 1), TECH_STACK.md (Section 4)
- **Patterns**: Composite keys, soft deletes, change logging, optimistic concurrency
- **Features**: Always On AG, TDE, Full-Text Search, Spatial Types

### Client Application
- **Documents**: PACS_DEEP_DIVE.md (Section 4), TECH_STACK.md (Section 2)
- **Technologies**: .NET Framework 4.8, WinForms, DevExpress, ArcGIS
- **Patterns**: WCF client, lazy loading, async service calls

### ETL Pipelines
- **Documents**: PACS_DEEP_DIVE.md (Section 5), LEARNING_GUIDE.md (Section 7.1)
- **Scripts**: BuildingPermitLoader.ps1
- **Integrations**: CIAPS (building permits), Web_Internet_Benton (public data)

---

## Cheat Sheets

### SQL Cheat Sheet

```sql
-- Property search by geo_id
SELECT p.*, pv.prop_val, s.situs_display
FROM property p WITH (NOLOCK)
JOIN property_val pv WITH (NOLOCK) ON p.prop_id = pv.prop_id AND pv.prop_val_yr = 2024 AND pv.sup_num = 0
JOIN situs s WITH (NOLOCK) ON p.prop_id = s.prop_id AND s.primary_situs = 'Y'
WHERE p.geo_id = '123-456-789' AND pv.prop_inactive_dt IS NULL;

-- Property ownership
SELECT a.file_as_name, o.pct_ownership
FROM owner o WITH (NOLOCK)
JOIN account a WITH (NOLOCK) ON o.owner_id = a.acct_id
WHERE o.prop_id = @prop_id AND o.owner_tax_yr = @year AND o.sup_num = 0;

-- Improvement details
SELECT id.imprv_det_type_cd, id.imprv_det_area, id.unit_price, id.imprv_det_adj_val
FROM imprv_detail id WITH (NOLOCK)
WHERE id.prop_id = @prop_id AND id.prop_val_yr = @year AND id.sup_num = 0;

-- Recalculate property
EXEC RecalcProperty @prop_id = 12345, @year = 2024, @sup_num = 0;

-- Check for recalc errors
SELECT * FROM prop_recalc_errors WHERE prop_id = @prop_id;

-- View change history
SELECT * FROM change_log 
WHERE table_name = 'property_val' AND key_prop_id = @prop_id 
ORDER BY chg_dt DESC;
```

### PowerShell Cheat Sheet

```powershell
# Start local SQL Server
cd pacs-server-benton/infra/docker
docker compose -f compose.mssql.yml up -d

# Publish all databases
cd ../../scripts
pwsh publish.ps1 -SqlServer "localhost,1433" -SaPassword "P@ssw0rd123!"

# Build database project
dotnet build DatabaseProjectpacs_oltp/DatabaseProjectpacs_oltp.sqlproj -c Release

# Deploy DACPAC
SqlPackage /Action:Publish `
  /SourceFile:pacs_oltp.dacpac `
  /TargetServerName:localhost,1433 `
  /TargetDatabaseName:pacs_oltp `
  /TargetUser:sa /TargetPassword:P@ssw0rd123!

# Import building permits
pwsh Misc/BuildingPermitLoader.ps1
```

### C# Cheat Sheet

```csharp
// Call WCF service
using (var client = new PACSServiceClient())
{
    var property = await client.GetPropertyAsync(propId, year, supNum);
    // Use property...
}

// NHibernate query
using (var session = NHibernateHelper.OpenSession())
{
    var properties = session.CreateCriteria<Property>()
        .Add(Restrictions.Eq("GeoId", geoId))
        .List<Property>();
}

// Lazy load tab
private void tabControl_SelectedIndexChanged(object sender, EventArgs e)
{
    if (tabControl.SelectedTab == tabValuation && !valuationLoaded)
    {
        LoadPropertyValuation();
        valuationLoaded = true;
    }
}
```

---

## Acronyms & Terms

**System Acronyms:**
- **PACS**: Property Assessment and Collection System
- **CIAPS**: County Integrated Assessment & Permit System
- **TA_AppSvr**: Tax Assessor Application Server
- **WCF**: Windows Communication Foundation
- **ORM**: Object-Relational Mapping (NHibernate)

**Property Tax Terms:**
- **DOR**: Department of Revenue (Washington State)
- **PTD**: Property Tax Division
- **ARB**: Appraisal Review Board
- **REET**: Real Estate Excise Tax
- **RCN**: Replacement Cost New
- **COD**: Coefficient of Dispersion (statistical measure)

**Technical Terms:**
- **DACPAC**: Data-tier Application Package (SQL deployment)
- **SSMS**: SQL Server Management Studio
- **TDE**: Transparent Data Encryption
- **AG**: Availability Group (Always On)

---

## Contact & Support

**Internal Resources:**
- Lead Developer: [Contact Info]
- DBA: [Contact Info]
- Business Analyst: [Contact Info]

**Vendor Support:**
- TrueAutomation PACS: [Support Portal]
- DevExpress: https://supportcenter.devexpress.com/
- Microsoft SQL Server: [Premier Support Contract]

**Documentation Updates:**
- Submit updates via Git pull request
- Documentation owner: [Name]
- Review cycle: Quarterly

---

## Additional Resources

**In This Repository:**
- `.github/copilot-instructions.md` - AI agent instructions
- `pacs-server-benton/docs/README.md` - Deployment quickstart
- `Database/Query Samples/` - SQL query examples
- `Database/PDF's/` - User guides and training materials

**External Resources:**
- Microsoft Learn: https://learn.microsoft.com/
- Washington DOR: https://dor.wa.gov/
- Stack Overflow: https://stackoverflow.com/
- NHibernate Docs: https://nhibernate.info/

---

**Document Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-03 | TrueAutomation PACS Elite Engineering Team | Initial index document |

---

*This index serves as the entry point to the complete PACS documentation suite. Start here, then navigate to specific documents based on your role and needs.*
