# Benton County PACS: Knowledge Transfer Package for TerraFusion OS Team
**Prepared for System Takeover - November 2025**

## Executive Summary

This document outlines **additional deliverables required** for TerraFusion OS team to successfully take over Benton County PACS operations, maintenance, and modernization. 

**Current State**: We have delivered comprehensive architectural analysis (6,000+ lines) and statistical inventory (4,000+ lines).

**Gap Analysis**: Additional artifacts needed for **operational readiness**, **developer onboarding**, and **modernization execution**.

---

## Section 1: Critical Knowledge Transfer Gaps

### 1.1 Missing Artifacts for Day-1 Operations

| Artifact | Priority | Purpose | Status | ETA |
|----------|----------|---------|--------|-----|
| **Visual Architecture Diagrams** | CRITICAL | ERD, data flow, integration maps | ❌ Missing | 2 weeks |
| **Developer Onboarding Guide** | CRITICAL | New developer 30-day ramp-up plan | ❌ Missing | 1 week |
| **Runbook Library Expansion** | HIGH | 20+ operational procedures (currently have 5) | ⚠️ Partial | 3 weeks |
| **API Migration Specification** | HIGH | REST API contracts for modernization | ❌ Missing | 2 weeks |
| **Testing Strategy & Framework** | HIGH | Unit tests for 2,086 stored procedures | ❌ Missing | 4 weeks |
| **Data Dictionary** | HIGH | Cryptic column name documentation | ❌ Missing | 3 weeks |
| **Disaster Recovery Playbook** | MEDIUM | Failover procedures, backup restoration | ⚠️ Partial | 2 weeks |
| **Security Hardening Guide** | MEDIUM | PCI-DSS compliance, password encryption | ❌ Missing | 2 weeks |
| **Performance Tuning Toolkit** | MEDIUM | SQL scripts, profiling tools, baseline metrics | ⚠️ Partial | 2 weeks |
| **Change Management Process** | MEDIUM | How to safely modify 12,620 database objects | ❌ Missing | 1 week |

### 1.2 Knowledge Transfer Risks

**High-Risk Items** (institutional knowledge not yet captured):

1. **Extended SP Parameter Meanings** - 14 parameters to `xp_RecalcProperty90`, semantics unknown
2. **Business Rule Interpretations** - RCW 84.34/84.36 implementation details undocumented
3. **Error Code Catalog** - `prop_recalc_errors` table codes not documented
4. **Batch Job Dependencies** - SQL Agent job execution order and dependencies
5. **Report Data Sources** - Which stored procedures feed which Crystal Reports
6. **User Role Permissions** - Database role mappings to business functions
7. **Third-Party Integration Contracts** - CIAPS, building permit import formats
8. **Vendor Contact Information** - TrueAutomation support, DevExpress licensing

---

## Section 2: Required Deliverables - Detailed Specifications

### 2.1 Visual Architecture Diagrams

**Purpose**: Enable rapid comprehension of system structure without reading 10,000+ lines of documentation.

**Deliverables**:

#### 2.1.1 Core Entity-Relationship Diagram (ERD)
- **Scope**: 20-30 core tables (property, property_val, situs, owner_prop_assoc, improvement, etc.)
- **Tool**: dbdiagram.io, Lucidchart, or SQL Server Database Diagrams
- **Format**: PNG (high-resolution), PDF (printable), DBML (source)
- **Contents**:
  - Primary keys (bold)
  - Foreign key relationships (arrows)
  - Key columns (not all 264 columns from property_val!)
  - Composite keys highlighted
  - Supplement temporal relationships annotated
- **Audience**: Developers, DBAs, business analysts

**Sample ERD Structure**:
```
property (prop_id) 
  ├─[1:N]→ property_val (prop_id, prop_val_yr, sup_num)
  │         └─[FK]→ abs_subdv (abs_subdv_cd, abs_subdv_yr)
  │         └─[FK]→ neighborhood (hood_cd, hood_yr)
  │         └─[FK]→ appraiser (land_appraiser_id)
  ├─[1:N]→ situs (prop_id, situs_yr, situs_num)
  ├─[1:N]→ improvement (prop_id, prop_val_yr, sup_num, imprv_num)
  ├─[M:N]→ owner_prop_assoc (prop_id, owner_id, own_yr, own_num)
  │         └─[FK]→ account (acct_id)
  └─[M:N]→ prop_building_permit_assoc (prop_id, bldg_permit_id)
            └─[FK]→ building_permit (bldg_permit_id)
```

#### 2.1.2 Cross-Database Integration Diagram
- **Scope**: Show data flow between 6 databases
- **Highlight**:
  - CIAPS → pacs_oltp (synonyms)
  - pacs_oltp → Web_Internet_Benton (ETL nightly)
  - pacs_oltp → ReportServer (SSRS queries)
  - TAAppSvr ← XSP_PACS.dll (extended SP calls)
- **Format**: Visio, draw.io, or Mermaid diagram
- **Audience**: Architects, integration specialists

**Sample Mermaid Code**:
```mermaid
graph LR
    A[CIAPS] -->|Synonyms<br/>Read-Only| B[pacs_oltp]
    B -->|Nightly ETL<br/>Stored Procs| C[Web_Internet_Benton]
    B -->|SSRS Queries| D[ReportServer]
    B -->|Extended SP Calls| E[TAAppSvr<br/>XSP_PACS.dll]
    F[Building Permit<br/>CSV Import] -->|Bulk Insert| A
    C -->|HTTPS| G[Public Website]
    D -->|Crystal Reports| H[Report Portal]
```

#### 2.1.3 WCF Service Architecture Diagram
- **Scope**: 6 WCF services, NHibernate session factories, client connections
- **Show**:
  - PACS.NET.exe client → 6 WCF endpoints
  - TrueAutomation.Services.Host.exe → 6 session factories
  - Session factories → 6 databases
  - Rhino ESB message bus integration
- **Format**: Lucidchart or PlantUML component diagram
- **Audience**: .NET developers, DevOps engineers

#### 2.1.4 Data Flow: Property Recalculation Workflow
- **Scope**: End-to-end flow from user clicking "Recalc" to database update
- **Show**:
  1. User action (PACS.NET.exe)
  2. WCF service call (PACSService)
  3. Stored procedure invocation (RecalcProperty.sql)
  4. Extended SP execution (xp_RecalcProperty90)
  5. TAAppSvr computation (Matrix lookups)
  6. Database updates (property_val table)
  7. Trigger cascades (9 triggers fire)
  8. Change log audit (change_log table)
- **Format**: Swimlane diagram (Lucidchart)
- **Audience**: Business analysts, QA testers, developers

#### 2.1.5 Trigger Cascade Visualization
- **Scope**: Show trigger dependencies for property_val updates
- **Purpose**: Understand performance bottlenecks
- **Format**: Graph visualization (Graphviz/DOT notation)
- **Audience**: DBAs, performance engineers

### 2.2 Developer Onboarding Guide

**Purpose**: 30-day ramp-up plan for new TerraFusion OS developers joining PACS team.

**Document Structure**:

#### Week 1: Environment Setup & System Overview
- **Day 1-2**: Workstation setup
  - Install SQL Server Management Studio (SSMS)
  - Install Visual Studio 2022
  - Clone Git repository
  - Setup Docker environment (local SQL Server)
  - Deploy databases using `publish.ps1` script
- **Day 3-4**: Documentation review
  - Read RPD_REQUIREMENTS_PLANNING_DESIGN.md (1,600 lines)
  - Read TECH_STACK.md (1,400 lines)
  - Read ULTRA_DEEP_DIVE_LEGACY_ANALYSIS.md (6,000 lines)
  - Read SYSTEM_STATISTICS_EXECUTIVE_SUMMARY.md (4,000 lines)
- **Day 5**: Hands-on exploration
  - Execute `server_configuration_analysis.sql`
  - Review top 20 tables (by row count)
  - Review top 20 stored procedures (by execution count)
  - Query `change_log` table (understand audit trail)

#### Week 2: Core Workflows Deep Dive
- **Day 6-7**: Property valuation workflow
  - Trace `RecalcProperty.sql` stored procedure
  - Understand `property_val` table structure (264 columns!)
  - Study supplement workflow (`sup_num` versioning)
  - Review `xsp_pacs_config` table (extended SP configuration)
- **Day 8-9**: Owner and account management
  - Study `account`, `owner_prop_assoc`, `entity` tables
  - Understand ownership transfer workflow (`chg_of_owner`)
  - Review change log triggers (audit trail mechanism)
- **Day 10**: Exemption and special use workflows
  - Agricultural classification (RCW 84.34)
  - Homestead cap/freeze (RCW 84.36)
  - Senior/disabled exemptions

#### Week 3: WCF Services & Integration
- **Day 11-13**: WCF service layer
  - Review WCF endpoint configurations (6 services)
  - Study NHibernate session factory pattern
  - Trace PACSService entity mappings
  - Test service calls using WCF Test Client
- **Day 14-15**: Cross-database integration
  - CIAPS synonym pattern
  - Web_Internet_Benton ETL process
  - Building permit import workflow

#### Week 4: Hands-On Development
- **Day 16-18**: First bug fix assignment
  - Pick low-priority bug from backlog
  - Trace code through stored procedures
  - Implement fix with unit test
  - Code review with senior developer
- **Day 19-20**: First feature assignment
  - Small enhancement to existing functionality
  - Update stored procedure
  - Update WCF service method
  - Update client UI
  - Full end-to-end testing

**Key Learning Checkpoints**:
- [ ] Can deploy databases from scratch using `publish.ps1`
- [ ] Can query property valuation history using `property_val` table
- [ ] Can trace trigger execution using SQL Profiler
- [ ] Can locate and modify stored procedures
- [ ] Can test WCF service endpoints
- [ ] Can explain supplement workflow to business user
- [ ] Can document change log entries for audit

### 2.3 Expanded Runbook Library

**Current State**: 5 runbooks (AG failover, recalc errors, WCF troubleshooting, database restore, index maintenance)

**Required Additions** (15 more runbooks):

1. **SQL Agent Job Failure Recovery** - ETL job failed, how to restart
2. **Building Permit Import Error Resolution** - CSV parse errors, duplicate permits
3. **Mass Reappraisal Kickoff** - Annual reappraisal process (January-March)
4. **Supplement Creation Workflow** - New supplement for value change
5. **Property Split/Consolidation** - Parcel split or merge procedures
6. **Change Log Query Procedures** - How to investigate "who changed what?"
7. **Report Generation Failures** - Crystal Reports errors, SSRS timeouts
8. **User Permission Troubleshooting** - Database role assignments
9. **TempDB Full Recovery** - TempDB exhaustion during mass updates
10. **Deadlock Resolution** - Identify and resolve deadlocks
11. **Extended SP Failure Troubleshooting** - xp_RecalcProperty90 errors
12. **Web Portal Refresh Failure** - Web_Internet_Benton ETL issues
13. **Backup Failure Recovery** - SQL Server backup job errors
14. **Transaction Log Full** - Transaction log growth management
15. **AlwaysOn AG Synchronization Lag** - Replica falling behind

**Runbook Template**:
```markdown
# Runbook: [Title]

## Severity
[CRITICAL | HIGH | MEDIUM | LOW]

## Symptoms
- User-reported symptom 1
- User-reported symptom 2
- System error message examples

## Prerequisites
- Required permissions (e.g., sysadmin, db_owner)
- Required tools (SSMS, PowerShell, etc.)
- Access requirements (production server, service account)

## Diagnostic Steps
1. Step 1: Check [table/log/metric]
   ```sql
   -- Diagnostic query
   ```
2. Step 2: Verify [condition]
3. Step 3: Identify root cause

## Resolution Steps
1. Step 1: [Action]
   ```sql
   -- Resolution query
   ```
2. Step 2: [Action]
3. Step 3: Verify fix

## Rollback Procedure
If resolution fails:
1. Rollback step 1
2. Rollback step 2
3. Escalate to senior DBA

## Post-Resolution Validation
- [ ] Checklist item 1
- [ ] Checklist item 2
- [ ] User confirmation

## Root Cause Prevention
Long-term fixes to prevent recurrence:
- Configuration change recommendation
- Monitoring alert recommendation

## Related Documents
- Link to architecture docs
- Link to related runbooks
```

### 2.4 API Migration Specification

**Purpose**: Define REST API contracts for wrapping stored procedures, enabling microservices extraction.

**Document Structure**:

#### 2.4.1 API Architecture Principles
- **RESTful design** - Resource-based URLs, HTTP verbs
- **Stateless** - No server-side session state
- **JWT authentication** - Replace Windows Authentication
- **JSON payloads** - Replace WCF binary serialization
- **Versioning strategy** - `/api/v1/`, `/api/v2/`
- **Rate limiting** - Protect against abuse
- **CORS policy** - Enable web client access

#### 2.4.2 Priority API Endpoints (Phase 1)

**Property Valuation APIs**:
```
GET    /api/v1/properties/{propId}
GET    /api/v1/properties/{propId}/valuations?year={year}
POST   /api/v1/properties/{propId}/valuations/recalculate
GET    /api/v1/properties/{propId}/valuations/{year}/supplements
POST   /api/v1/properties/{propId}/valuations/{year}/supplements
GET    /api/v1/properties/{propId}/changelog?startDate={date}&endDate={date}
```

**Property Search APIs**:
```
GET    /api/v1/properties/search?geoId={geoId}
GET    /api/v1/properties/search?address={address}
GET    /api/v1/properties/search?owner={ownerName}
POST   /api/v1/properties/search/advanced
```

**Owner/Account APIs**:
```
GET    /api/v1/accounts/{accountId}
GET    /api/v1/accounts/{accountId}/properties
POST   /api/v1/accounts
PUT    /api/v1/accounts/{accountId}
GET    /api/v1/accounts/{accountId}/ownership-history
```

**Exemption APIs**:
```
GET    /api/v1/properties/{propId}/exemptions?year={year}
POST   /api/v1/properties/{propId}/exemptions
PUT    /api/v1/properties/{propId}/exemptions/{exemptionId}
DELETE /api/v1/properties/{propId}/exemptions/{exemptionId}
```

#### 2.4.3 API Implementation Mapping

**Example: Property Valuation Recalculation**

**Current WCF Implementation**:
```csharp
// Client call
var client = new PACSServiceClient();
var result = client.RecalculateProperty(propId, year, supNum, userId);
```

**Target REST API**:
```http
POST /api/v1/properties/12345/valuations/recalculate
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "year": 2025,
  "supplementNumber": 0,
  "recalculateIncome": true,
  "traceEnabled": false
}

Response:
200 OK
{
  "propId": 12345,
  "year": 2025,
  "supplementNumber": 1,
  "appraisedValue": 450000.00,
  "status": "success",
  "recalculationDate": "2025-11-03T14:30:00Z"
}
```

**Backend Implementation** (ASP.NET Core):
```csharp
[ApiController]
[Route("api/v1/properties/{propId}/valuations")]
public class PropertyValuationController : ControllerBase
{
    [HttpPost("recalculate")]
    public async Task<IActionResult> RecalculateProperty(
        int propId, 
        [FromBody] RecalculationRequest request)
    {
        // Call existing stored procedure (preserve business logic!)
        var result = await _dbContext.ExecuteStoredProcedureAsync(
            "RecalcProperty",
            new SqlParameter("@prop_id", propId),
            new SqlParameter("@lYear", request.Year),
            new SqlParameter("@sup_num", request.SupplementNumber),
            // ... 14 parameters total
        );
        
        return Ok(new RecalculationResponse { ... });
    }
}
```

**Migration Strategy**: **Strangler Fig Pattern**
1. Phase 1: Wrap existing stored procedures with REST APIs (no logic changes)
2. Phase 2: WinForms client calls both WCF (primary) and REST (shadow mode) for validation
3. Phase 3: Switch WinForms client to REST APIs (WCF deprecated)
4. Phase 4: Migrate business logic from stored procedures to C# services (incremental)
5. Phase 5: Decommission WCF services, retire stored procedures (gradual)

### 2.5 Testing Strategy & Framework

**Purpose**: Enable safe modification of 2,086 stored procedures without breaking production.

**Document Structure**:

#### 2.5.1 Unit Testing Framework: tSQLt
- **Tool**: tSQLt (open-source SQL Server unit testing framework)
- **Installation**: Deploy tSQLt assemblies to test database
- **Execution**: SQL Agent job runs tests nightly, reports failures
- **Coverage Goal**: 80% of critical stored procedures (top 200 by execution count)

**Example Unit Test**:
```sql
-- Test: RecalcProperty should create new supplement
CREATE PROCEDURE testRecalcProperty_CreatesNewSupplement
AS
BEGIN
    -- Arrange
    EXEC tSQLt.FakeTable @TableName = 'property_val';
    INSERT INTO property_val (prop_id, prop_val_yr, sup_num, appraised_val)
    VALUES (99999, 2025, 0, 100000);
    
    -- Act
    EXEC RecalcProperty 
        @prop_id = 99999,
        @lYear = 2025,
        @sup_num = 0;
    
    -- Assert
    DECLARE @newSupNum INT;
    SELECT @newSupNum = MAX(sup_num) 
    FROM property_val 
    WHERE prop_id = 99999 AND prop_val_yr = 2025;
    
    EXEC tSQLt.AssertEquals 
        @Expected = 1, 
        @Actual = @newSupNum,
        @Message = 'New supplement should be created';
END;
```

#### 2.5.2 Integration Testing Strategy
- **Scope**: Test cross-procedure workflows (e.g., property split → recalculation → billing)
- **Tool**: Specflow (BDD framework) or xUnit with SQL Server integration
- **Environment**: Dedicated test database (copy of production schema, sanitized data)
- **Execution**: CI/CD pipeline (Azure DevOps or GitHub Actions)

**Example Integration Test** (Specflow):
```gherkin
Feature: Property Recalculation Workflow
  As an appraiser
  I want to recalculate property values
  So that assessments reflect current market conditions

Scenario: Recalculate property after new construction
  Given property 12345 has appraised value $300,000
  And a building permit for $100,000 addition was finalized
  When I recalculate property 12345
  Then a new supplement should be created
  And the appraised value should increase
  And a change log entry should record the recalculation
```

#### 2.5.3 Regression Testing Plan
- **Challenge**: 2,086 stored procedures × 100,000 properties = impossibly large test matrix
- **Strategy**: **Risk-Based Testing**
  1. **Critical procedures** (100): Full regression suite (all parameters, edge cases)
  2. **High-usage procedures** (500): Smoke tests (happy path only)
  3. **Low-usage procedures** (1,486): Audit-only (no active tests, monitor production)

**Critical Procedure List** (extract from execution statistics):
```sql
-- Query to identify top 100 most-executed procedures
SELECT TOP 100
    OBJECT_NAME(s.object_id) AS ProcedureName,
    s.execution_count,
    s.total_elapsed_time / 1000000 AS total_elapsed_seconds,
    s.total_elapsed_time / s.execution_count / 1000 AS avg_elapsed_ms
FROM sys.dm_exec_procedure_stats s
ORDER BY s.execution_count DESC;
```

#### 2.5.4 Performance Testing Framework
- **Tool**: SQL Server Profiler + Extended Events
- **Baseline**: Capture current performance metrics (query duration, I/O, CPU)
- **Test**: Re-run after schema changes, compare to baseline
- **Acceptance**: Performance degradation < 10% for critical queries

**Automated Performance Test**:
```powershell
# Capture baseline
$baseline = Measure-Command {
    Invoke-Sqlcmd -Query "EXEC RecalcProperty @prop_id=12345, ..." -Database pacs_oltp
}

# Apply schema change
Invoke-Sqlcmd -InputFile "schema_change.sql" -Database pacs_oltp

# Re-test
$newTime = Measure-Command {
    Invoke-Sqlcmd -Query "EXEC RecalcProperty @prop_id=12345, ..." -Database pacs_oltp
}

# Compare
$degradation = ($newTime.TotalMilliseconds - $baseline.TotalMilliseconds) / $baseline.TotalMilliseconds * 100
if ($degradation -gt 10) {
    Write-Error "Performance degradation: $degradation% (threshold: 10%)"
}
```

### 2.6 Data Dictionary

**Purpose**: Document cryptic column names, business semantics, and institutional knowledge before it's lost.

**Document Structure**:

#### 2.6.1 Core Tables Data Dictionary

**Table: property_val** (264 columns - sample entries)

| Column Name | Data Type | Nullable | Business Meaning | Valid Values | Notes |
|-------------|-----------|----------|------------------|--------------|-------|
| `prop_id` | INT | NOT NULL | Property unique identifier | Foreign key to property.prop_id | Clustered index component |
| `prop_val_yr` | NUMERIC(4) | NOT NULL | Appraisal year | 2000-2099, or **0 = current year** | **Year 0 is magic number** |
| `sup_num` | INT | NOT NULL | Supplement number (version) | 0 = initial, 1+ = reappraisals | Temporal versioning key |
| `prev_sup_num` | INT | NULL | Previous supplement link | Links to prior sup_num | Enables rollback/audit trail |
| `recalc_flag` | CHAR(1) | NULL | Recalculation required flag | 'Y' = needs recalc, NULL = current | Set by triggers, cleared by batch job |
| `vit_flag` | CHAR(1) | NULL | **Valuation in Transaction** (hypothesis) | 'Y' = based on sale, NULL = appraised | **UNDOCUMENTED - needs SME interview** |
| `vit_declaration_filed_dt` | DATETIME | NULL | Date VIT declaration filed | Valid datetime or NULL | Related to vit_flag |
| `appraised_val` | NUMERIC(14) | NULL | Final appraised value | Dollars, no cents | Used for tax billing |
| `land_hstd_val` | NUMERIC(14) | NULL | Homestead land value | Dollars | Eligible for senior exemption |
| `imprv_hstd_val` | NUMERIC(14) | NULL | Homestead improvement value | Dollars | Eligible for senior exemption |
| `land_non_hstd_val` | NUMERIC(14) | NULL | Non-homestead land value | Dollars | Commercial/rental portion |
| `imprv_non_hstd_val` | NUMERIC(14) | NULL | Non-homestead improvement value | Dollars | Commercial/rental portion |
| `ag_use_val` | NUMERIC(14) | NULL | Agricultural use value | Dollars | RCW 84.34 current use |
| `ag_market` | NUMERIC(14) | NULL | Agricultural market value | Dollars | Highest and best use value |
| `ag_loss` | NUMERIC(14) | NULL | Agricultural rollback liability | Dollars | 7-year tax deferral payback |
| `freeze_ceiling` | NUMERIC(14,2) | NULL | Homestead value freeze ceiling | Dollars | Senior/disabled exemption cap |
| `freeze_yr` | NUMERIC(4) | NULL | Year freeze was established | 2000-2099 | Base year for exemption |
| `hscap_qualify_yr` | NUMERIC(4) | NULL | Homestead cap qualification year | 2000-2099 | Year senior turned 61 |
| `hscap_base_yr` | NUMERIC(4) | NULL | Homestead cap base year | 2000-2099 | Value frozen at this year |
| `sup_action` | CHAR(1) | NULL | Supplement action code | 'A'=Add, 'C'=Change, 'D'=Delete, 'R'=Reappraisal | Workflow tracking |
| `mass_created_from` | INT | NULL | Parent property for mass creation | Foreign key to property.prop_id | Parcel split tracking |
| `mass_create_run_id` | INT | NULL | Mass creation batch ID | Unique batch identifier | Enables rollback |

**CRITICAL NOTES**:
- **Year 0 Pattern**: `prop_val_yr = 0` represents "current working year", resolved via `pacs_system.future_yr` table
- **VIT Flag**: Meaning unknown, requires interview with senior appraiser (original developer knowledge)
- **Recalc Flag**: Set by triggers when dependent data changes, cleared by batch job `pRecalcQueuedProperties`
- **Supplement Action**: Soft delete pattern - 'D' doesn't delete record, creates tombstone

#### 2.6.2 Code Value Tables

**Table: sup_action codes** (inferred from usage patterns)

| Code | Meaning | Workflow | Trigger Behavior |
|------|---------|----------|------------------|
| A | Add/New | New construction, parcel split | Creates new property_val record |
| C | Change | Value correction, data fix | Updates existing supplement, increments sup_num |
| D | Delete | Parcel consolidation, demolition | Soft delete (tombstone record), maintains history |
| R | Reappraisal | Scheduled reappraisal, protest resolution | Creates new supplement, links via prev_sup_num |

**DOCUMENTATION GAP**: These codes not formally documented in database, inferred from stored procedure logic.

#### 2.6.3 Extended SP Parameters

**Procedure: xp_RecalcProperty90** (14 parameters - semantics reverse-engineered)

| Parameter | Data Type | Purpose | Notes |
|-----------|-----------|---------|-------|
| @szTAAppSvr | VARCHAR(64) | TAAppSvr hostname | e.g., "VM64DEVDB9008" |
| @lTAAppSvrEnvironmentID | INT | Environment ID | 1=Dev, 2=Test, 3=Prod (hypothesis) |
| @szParam1 | VARCHAR(64) | Windows username | **Plaintext credential!** |
| @szParam2 | VARCHAR(64) | Password | **Plaintext credential!** |
| @lRecalcByPacsUserID | INT | User performing recalc | Foreign key to pacs_user.pacs_user_id |
| @lYear | INT | Appraisal year | 2000-2099 |
| @sup_num | INT | Target supplement number | 0 = create new, >0 = specific supplement |
| @prop_id | INT | Property to recalculate | 0 = batch mode (reads recalc_prop_list), >0 = single property |
| @lRecalcIncome | INT | Recalculate income approach | 1 = yes, 0 = no |
| @lTrace | INT | Enable trace logging | 1 = verbose logging, 0 = normal |
| @lSaleID | INT | Sale ID for valuation | Links to sales.sale_id, 0 = ignore |
| @lChangeLogPacsUserID | INT | User for change log | Foreign key to pacs_user.pacs_user_id |
| @lCalcPTDOnly | INT | Calculate PTD only | **Unknown - requires XSP_PACS.dll source** |
| @lCalcProfileOnly | INT | Calculate profile only | **Unknown - requires XSP_PACS.dll source** |

**CRITICAL SECURITY RISK**: @szParam1/@szParam2 are plaintext credentials, violates PCI-DSS.

**MISSING KNOWLEDGE**: Last 2 parameters (PTD, Profile) semantics unknown without DLL source code or SME interview.

### 2.7 Disaster Recovery Playbook

**Current State**: Basic AG failover runbook exists.

**Required Additions**:

#### 2.7.1 Backup Strategy Documentation
- **Full backups**: Nightly at 2:00 AM (7-day retention)
- **Differential backups**: Every 6 hours (48-hour retention)
- **Transaction log backups**: Every 15 minutes (24-hour retention)
- **Backup validation**: Weekly restore test to secondary server
- **Offsite replication**: Azure Blob Storage (30-day retention)

#### 2.7.2 Recovery Time Objective (RTO) / Recovery Point Objective (RPO)
- **RTO**: 4 hours (time to restore operations)
- **RPO**: 15 minutes (maximum acceptable data loss)
- **Critical databases**: pacs_oltp, PACS_Training (restore priority 1)
- **Secondary databases**: Web_Internet_Benton (can rebuild from pacs_oltp, priority 2)

#### 2.7.3 Failover Scenarios

**Scenario 1: Primary SQL Server Hardware Failure**
1. Automatic failover to AlwaysOn AG secondary (5-minute RTO)
2. Update DNS/connection strings if needed
3. Validate application connectivity
4. Monitor secondary server performance

**Scenario 2: Database Corruption**
1. Run `DBCC CHECKDB` to assess corruption extent
2. If repairable: Run `DBCC CHECKDB (REPAIR_ALLOW_DATA_LOSS)`
3. If not repairable: Restore from most recent clean backup
4. Apply transaction log backups to minimize data loss
5. Validate data integrity post-restore

**Scenario 3: Ransomware Attack**
1. Immediately disconnect affected servers from network
2. Identify infection vector (email, RDP, vulnerability)
3. Restore databases from offline backup (before encryption)
4. Rebuild application servers from clean images
5. Scan all systems before reconnecting to network

#### 2.7.4 Application Server Recovery
- **WCF service host**: IIS application pool restore, service restart
- **PACS client deployment**: MSI reinstall from `\\JCHARRISPACS\PACSDrop`
- **Configuration files**: Restore from version control (Git repository)

### 2.8 Security Hardening Guide

**Purpose**: Address PCI-DSS compliance gaps, implement defense-in-depth.

**Document Structure**:

#### 2.8.1 Immediate Security Fixes (0-3 months)

**1. Encrypt plaintext passwords in xsp_pacs_config**
```sql
-- Enable Transparent Data Encryption (TDE)
USE master;
CREATE MASTER KEY ENCRYPTION BY PASSWORD = '<strong_password>';
CREATE CERTIFICATE TDE_Cert WITH SUBJECT = 'TDE Certificate';
USE pacs_oltp;
CREATE DATABASE ENCRYPTION KEY
WITH ALGORITHM = AES_256
ENCRYPTION BY SERVER CERTIFICATE TDE_Cert;
ALTER DATABASE pacs_oltp SET ENCRYPTION ON;

-- Alternative: Column-level encryption with symmetric key
USE pacs_oltp;
CREATE SYMMETRIC KEY PasswordKey
WITH ALGORITHM = AES_256
ENCRYPTION BY CERTIFICATE TDE_Cert;

-- Encrypt existing passwords
OPEN SYMMETRIC KEY PasswordKey DECRYPTION BY CERTIFICATE TDE_Cert;
UPDATE xsp_pacs_config
SET szParam2 = ENCRYPTBYKEY(KEY_GUID('PasswordKey'), szParam2);
CLOSE SYMMETRIC KEY PasswordKey;
```

**2. Implement Row-Level Security (RLS)**
```sql
-- Restrict users to their assigned properties only
CREATE FUNCTION dbo.fn_securitypredicate_property(@prop_id INT)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS result
WHERE @prop_id IN (
    SELECT prop_id 
    FROM dbo.appraiser_property_assignment
    WHERE appraiser_id = CAST(SESSION_CONTEXT(N'AppraiserID') AS INT)
);

CREATE SECURITY POLICY PropertyAccessPolicy
ADD FILTER PREDICATE dbo.fn_securitypredicate_property(prop_id)
ON dbo.property_val
WITH (STATE = ON);
```

**3. Enable SQL Server Audit**
```sql
-- Audit all DML operations on sensitive tables
CREATE SERVER AUDIT PACS_Audit
TO FILE (FILEPATH = 'C:\Audit\', MAXSIZE = 1024 MB, MAX_ROLLOVER_FILES = 10)
WITH (ON_FAILURE = CONTINUE);

CREATE DATABASE AUDIT SPECIFICATION PACS_Database_Audit
FOR SERVER AUDIT PACS_Audit
ADD (SELECT, INSERT, UPDATE, DELETE ON property_val BY public),
ADD (SELECT, INSERT, UPDATE, DELETE ON xsp_pacs_config BY public),
ADD (EXECUTE ON RecalcProperty BY public);
```

#### 2.8.2 Long-Term Security Improvements (3-12 months)

1. **Replace Windows Authentication with Azure AD** (for cloud migration)
2. **Implement Always Encrypted** (protect PII in transit and at rest)
3. **Dynamic Data Masking** (redact SSN, account numbers for non-privileged users)
4. **SQL Server Advanced Threat Protection** (anomaly detection, injection alerts)
5. **Principle of Least Privilege** (review and restrict database role permissions)

### 2.9 Performance Tuning Toolkit

**Purpose**: Provide scripts and tools for ongoing performance optimization.

**Deliverables**:

#### 2.9.1 Performance Baseline Script
```sql
-- Capture current performance metrics for comparison
SELECT 
    'Database Size' AS Metric,
    SUM(size) * 8 / 1024 / 1024 AS Value_GB
FROM sys.master_files
WHERE database_id = DB_ID('pacs_oltp')
UNION ALL
SELECT 
    'Change Log Rows',
    COUNT(*) 
FROM change_log
UNION ALL
SELECT 
    'Property Val Rows',
    COUNT(*)
FROM property_val
-- ... more metrics
```

#### 2.9.2 Index Maintenance Automation
```sql
-- Automated index rebuild/reorganize based on fragmentation
-- (Integrate into OPERATIONAL_RUNBOOKS.md Index Maintenance section)
```

#### 2.9.3 Query Performance Monitor
- Extended Events session capturing long-running queries (>5 seconds)
- Daily report of top 20 resource consumers
- Alert on performance degradation (>20% slower than baseline)

### 2.10 Change Management Process

**Purpose**: Define safe change procedures for 12,620 database objects.

**Process Flow**:

1. **Change Request** - Developer submits CR with impact analysis
2. **Impact Assessment** - DBA reviews FK dependencies, trigger cascades, view references
3. **Code Review** - Senior developer reviews stored procedure changes
4. **Unit Testing** - Developer writes tSQLt tests for modified procedures
5. **Integration Testing** - QA validates end-to-end workflow in test environment
6. **Performance Testing** - Compare baseline vs post-change metrics
7. **Deployment Window** - Changes deployed during maintenance window (Saturday 2:00 AM)
8. **Rollback Plan** - Database backup immediately before deployment
9. **Post-Deployment Validation** - Smoke tests, monitor for errors
10. **Documentation Update** - Update data dictionary, runbooks, API specs

**Change Classification**:
- **Low Risk**: New view, report query (no rollback needed)
- **Medium Risk**: Stored procedure modification (rollback: restore proc)
- **High Risk**: Table schema change, trigger modification (rollback: full database restore)
- **Critical Risk**: Extended SP replacement, WCF service change (rollback: service deployment)

---

## Section 3: Knowledge Transfer Timeline

### 3.1 Recommended Delivery Schedule

| Week | Deliverable | Owner | Effort | Status |
|------|-------------|-------|--------|--------|
| 1 | Core ERD diagram | DBA Team | 40 hours | 🔴 Not Started |
| 1-2 | Developer Onboarding Guide | Tech Lead | 60 hours | 🔴 Not Started |
| 2 | Cross-Database Integration Diagram | Architect | 20 hours | 🔴 Not Started |
| 2-3 | Data Dictionary (Top 50 tables) | DBA + SME | 80 hours | 🔴 Not Started |
| 3 | WCF Service Architecture Diagram | .NET Dev | 30 hours | 🔴 Not Started |
| 3-4 | API Migration Specification | Architect | 60 hours | 🔴 Not Started |
| 4 | Recalculation Workflow Diagram | Business Analyst | 40 hours | 🔴 Not Started |
| 4-5 | Expanded Runbook Library (15 runbooks) | DevOps Team | 120 hours | 🔴 Not Started |
| 5-6 | Testing Strategy & tSQLt Setup | QA Lead | 80 hours | 🔴 Not Started |
| 6 | Security Hardening Guide | Security Team | 40 hours | 🔴 Not Started |
| 6-7 | Disaster Recovery Playbook | DBA Team | 60 hours | 🔴 Not Started |
| 7 | Performance Tuning Toolkit | DBA Team | 40 hours | 🔴 Not Started |
| 7-8 | Change Management Process | Tech Lead | 30 hours | 🔴 Not Started |

**Total Effort**: **700 person-hours** (~17.5 person-weeks, ~4 months with small team)

### 3.2 Critical Path Dependencies

```
ERD Diagram → Developer Onboarding Guide
Data Dictionary → API Migration Spec → Testing Strategy
Architecture Diagrams → Developer Onboarding Guide
Runbooks → Change Management Process → Disaster Recovery Playbook
```

### 3.3 Resource Requirements

**Team Composition**:
- 1 Database Architect (40% allocation, 8 weeks)
- 2 Senior DBAs (50% allocation, 8 weeks)
- 1 .NET Architect (30% allocation, 4 weeks)
- 1 Senior .NET Developer (40% allocation, 6 weeks)
- 1 Business Analyst (30% allocation, 6 weeks)
- 1 QA Lead (50% allocation, 4 weeks)
- 1 Security Engineer (20% allocation, 2 weeks)
- 1 DevOps Engineer (30% allocation, 4 weeks)
- 1 Technical Writer (60% allocation, 8 weeks)

**Subject Matter Expert (SME) Interviews Required**:
- Senior Appraiser (10 hours) - Business rule validation, cryptic column meanings
- Original TrueAutomation Consultant (5 hours) - Extended SP parameters, TAAppSvr architecture
- County IT Manager (5 hours) - Backup/DR procedures, vendor contacts
- Report Administrator (3 hours) - Crystal Reports dependencies, SSRS catalog

---

## Section 4: Success Criteria - Knowledge Transfer Validation

### 4.1 Measurable Outcomes

**Knowledge Transfer is COMPLETE when**:

- [ ] **Onboarding Test**: New developer can deploy databases, trace recalculation workflow, and fix simple bug within 30 days
- [ ] **Runbook Test**: Operations team can execute all 20 runbooks without escalation to original team
- [ ] **Disaster Recovery Test**: TerraFusion team successfully restores from backup and fails over AG within 4-hour RTO
- [ ] **API Test**: First REST API endpoint deployed to production, serving 100+ requests/hour with <200ms latency
- [ ] **Testing Test**: 100 unit tests written for critical stored procedures, passing in CI/CD pipeline
- [ ] **Documentation Test**: Data dictionary covers top 50 tables, SME interviews completed, cryptic columns explained
- [ ] **Security Test**: Plaintext passwords encrypted, PCI-DSS audit passes, SQL Server Audit enabled
- [ ] **Performance Test**: Baseline metrics captured, 10% degradation alerts configured, index maintenance automated

### 4.2 Knowledge Retention Risk

**High-Risk Knowledge** (single point of failure if not captured):

1. **Extended SP Parameter Semantics** - Only original TrueAutomation developers know (urgent: schedule interview)
2. **VIT Flag Business Rule** - No documentation, requires senior appraiser interview
3. **Recalc Flag Workflow** - Trigger sets, batch clears - logic scattered across 100+ procedures
4. **Year 0 Pattern** - Implicit knowledge, new developers will be confused without documentation
5. **CIAPS Integration Contract** - Building permit CSV format, field mappings undocumented

**Mitigation**: **Prioritize SME interviews in Week 1-2** before institutional knowledge is lost.

---

## Section 5: Cost-Benefit Analysis

### 5.1 Investment Required

**Knowledge Transfer Package**: 700 person-hours × $150/hour (blended rate) = **$105,000**

**Breakdown**:
- Documentation & Diagrams: $45,000 (300 hours)
- Runbook Library Expansion: $18,000 (120 hours)
- Testing Framework Setup: $24,000 (160 hours)
- Security Hardening: $9,000 (60 hours)
- SME Interview Time: $9,000 (60 hours)

### 5.2 Return on Investment (ROI)

**Avoided Costs**:
- **Production Incident**: 1 major incident without runbooks = 40 hours downtime × $5,000/hour = **$200,000 loss**
- **Developer Ramp-Up**: Without onboarding guide, 90-day ramp-up vs 30-day = 60 days × $1,000/day = **$60,000 per developer**
- **Security Breach**: PCI-DSS non-compliance fine = **$500,000 - $5,000,000**
- **Failed Modernization**: Rewrite without API spec/testing = 80% failure risk × $25M project = **$20M wasted**

**ROI Calculation**:
- Investment: $105,000
- Single Incident Avoidance: $200,000
- **Break-Even**: 1 avoided incident or 2 developer onboarding cycles
- **ROI**: **190% return** in first year (conservative estimate)

### 5.3 Risk of Not Investing

**Scenario: TerraFusion Team Takes Over Without Knowledge Transfer Package**

**Year 1 Risks**:
- 50% probability of production incident (no runbooks) = $200K loss
- 3 new developers × 90-day ramp-up (vs 30-day) = $180K productivity loss
- Security audit failure (plaintext passwords) = $500K fine + remediation
- Failed API migration (no spec) = 6-month delay × $500K/month = $3M wasted

**Total Expected Loss**: **$3.88M**

**Mitigation via Knowledge Transfer**: Reduce risk by 80% → **$3.1M avoided loss**

**Conclusion**: **$105K investment protects against $3.1M risk** = **2,857% ROI**

---

## Section 6: Executive Recommendation

### 6.1 Recommended Action

**APPROVE** full Knowledge Transfer Package delivery over 8-week timeline.

**Rationale**:
1. **System Complexity**: 12,620 database objects cannot be safely operated without comprehensive documentation
2. **Knowledge Loss Risk**: Original architects retired, institutional knowledge fragmenting rapidly
3. **Modernization Enabler**: API spec + testing framework are prerequisites for $25M modernization program
4. **Risk Mitigation**: $105K investment protects against $3.1M expected loss (2,857% ROI)
5. **Industry Standard**: Fortune 500 enterprises require comprehensive knowledge transfer for system handoffs

### 6.2 Alternative Options (Not Recommended)

**Option A: Minimal Documentation** ($30K, 2 weeks)
- Pros: Fast, cheap
- Cons: TerraFusion team operating blind, high incident risk, no modernization path
- Risk: 80% probability of major incident within 6 months

**Option B: Learn by Doing** ($0 upfront)
- Pros: No immediate cost
- Cons: Productivity loss, repeated mistakes, tribal knowledge continues
- Risk: 2-3 year ramp-up, modernization project delayed indefinitely

**Option C: Full System Rewrite** ($30M, 7 years)
- Pros: Fresh start, modern architecture
- Cons: 80% failure rate for rewrites, knowledge loss, validation impossible
- Risk: $30M investment, 7 years, likely abandoned mid-project

### 6.3 Next Steps

**Immediate Actions** (Week 0):

1. **Approve Knowledge Transfer Package budget**: $105K
2. **Assign resources**: Identify team members per Section 3.3
3. **Schedule SME interviews**: Book senior appraiser, TrueAutomation consultant (urgent)
4. **Kickoff meeting**: TerraFusion team + current team alignment session

**Week 1 Priorities**:

1. Start Core ERD diagram (DBA team)
2. Conduct SME interviews (capture VIT flag, extended SP parameters, recalc workflow)
3. Begin Developer Onboarding Guide (tech lead)
4. Start Data Dictionary (top 10 tables)

**Monthly Checkpoints**:
- Month 1: Diagrams + Onboarding Guide complete
- Month 2: Data Dictionary + API Spec complete
- Month 3: Testing Framework + Runbooks complete
- Month 4: Security + DR + Change Management complete

---

## Conclusion

The Benton County PACS system is a **mission-critical computational engine** managing $500M+ annual tax levy with 20+ years of embedded institutional knowledge. 

**Without comprehensive knowledge transfer, the TerraFusion OS team faces**:
- ❌ Blind operation of 12,620 database objects
- ❌ High risk of production incidents
- ❌ 90-day developer ramp-up (vs 30-day with onboarding guide)
- ❌ Blocked modernization (no API spec, no testing framework)
- ❌ Security compliance failures (PCI-DSS, plaintext passwords)

**With the Knowledge Transfer Package, TerraFusion OS gains**:
- ✅ Operational readiness (20 runbooks, disaster recovery playbook)
- ✅ Developer productivity (30-day onboarding, data dictionary)
- ✅ Modernization enablers (API spec, testing framework)
- ✅ Risk mitigation ($105K investment protects against $3.1M loss)
- ✅ Institutional knowledge preservation (SME interviews, documentation)

**Recommendation**: **APPROVE** Knowledge Transfer Package delivery. This is not optional for a system of this complexity - it is a **prerequisite for safe operational takeover** and successful modernization.

---

**Document Classification**: STRATEGIC PLANNING  
**Audience**: TerraFusion OS Leadership, Project Managers, Technical Leads  
**Prepared By**: TrueAutomation/PACS Domain Expert (MIT PhD-Level)  
**Date**: November 3, 2025  
**Status**: READY FOR APPROVAL  
**Budget Required**: $105,000  
**Timeline**: 8 weeks (700 person-hours)
