# Benton County PACS - Requirements, Planning & Design (RPD)

## Document Control

**Project**: Benton County Property Assessment and Collection System (PACS)  
**System Type**: Government Enterprise Property Tax Management Platform  
**Classification**: Legacy System Modernization & Maintenance  
**Version**: 1.0  
**Date**: November 3, 2025  
**Prepared By**: TrueAutomation PACS Elite Government OS Engineering Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Requirements](#2-business-requirements)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [System Architecture Design](#5-system-architecture-design)
6. [Data Architecture](#6-data-architecture)
7. [Integration Architecture](#7-integration-architecture)
8. [Security Architecture](#8-security-architecture)
9. [Development Planning](#9-development-planning)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment Strategy](#11-deployment-strategy)
12. [Maintenance & Operations](#12-maintenance--operations)

---

## 1. Executive Summary

### 1.1 System Overview

The Benton County PACS is a mission-critical government property tax management system serving:
- **200+ concurrent users** (appraisers, collectors, administrators)
- **~100,000 property parcels** (real, personal, mobile home, mineral)
- **$XXX million** annual tax levy processing
- **24/7 availability** requirement for online services

### 1.2 Business Objectives

**Primary Goals:**
1. **Accurate property valuation**: Mass appraisal system compliant with state regulations
2. **Efficient tax collection**: Streamlined billing and payment processing
3. **Regulatory compliance**: DOR (Department of Revenue) reporting requirements
4. **Public transparency**: Web-based property search and tax information
5. **Audit trail**: Complete change history for legal/compliance purposes

### 1.3 Key Stakeholders

| Stakeholder Group | Role | Primary Needs |
|------------------|------|---------------|
| County Assessor's Office | Property valuation, appraisal notices | Accurate valuations, mass appraisal tools, appeal management |
| County Treasurer's Office | Tax collection, billing | Payment processing, delinquency tracking, distribution |
| County Auditor's Office | Financial oversight, reporting | GL integration, reconciliation, audit trails |
| Property Owners | Taxpayers | Online access, payment options, appeal process |
| Taxing Districts | Levy certification | Accurate tax calculations, timely distributions |
| State DOR | Regulatory oversight | Compliance reports (PTD forms), data submissions |
| IT Department | System maintenance | Reliable infrastructure, backup/recovery, security |

---

## 2. Business Requirements

### 2.1 Core Business Processes

#### BR-001: Property Appraisal Lifecycle
**Description**: Annual cycle of property valuation from January 1 assessment date through certified roll

**Business Rules:**
- Assessment date is January 1 of each year (lien date)
- Values must be certified to state by August 15
- Property owners have 30-60 days to appeal after notice
- Appeals must be resolved through ARB process
- Certified values cannot change until next year (except supplements)

**Success Criteria:**
- 100% of active properties valued by certification deadline
- <2% appeal rate on valuations
- >95% of appeals resolved within statutory timeframe

#### BR-002: Tax Levy Calculation
**Description**: Calculate property taxes based on certified values and levy rates

**Business Rules:**
- Tax = (Assessed Value / 1000) × Levy Rate
- Multiple taxing districts per property (tax areas)
- Exemptions reduce taxable value (homestead, senior, veteran)
- Special assessments added to tax bill
- Levy rates certified by taxing districts

**Success Criteria:**
- 100% accurate levy calculations
- Zero billing errors requiring corrections
- All levies distributed within 5 business days of collection

#### BR-003: Payment Collection & Distribution
**Description**: Accept payments, apply to bills, distribute to taxing districts

**Business Rules:**
- Multiple payment methods (cash, check, credit card, ACH, online)
- Payment applies to oldest debt first (FIFO)
- Interest/penalties calculated daily on delinquent amounts
- Distribution proportional to levy amounts
- Refunds processed within 30 days

**Success Criteria:**
- <0.1% payment processing errors
- Same-day payment posting
- Daily reconciliation with general ledger

#### BR-004: Ownership Change Processing
**Description**: Update property ownership, calculate REET, prorate taxes

**Business Rules:**
- Ownership effective date is deed recording date
- REET calculated on sale price (state and local rates)
- Taxes prorated between seller/buyer based on ownership days
- New owner inherits tax liability after recording date
- Escrow accounts transferred to new owner

**Success Criteria:**
- Ownership changes processed within 2 business days
- 100% REET collection rate
- Zero proration calculation errors

### 2.2 Regulatory Requirements

#### RR-001: State DOR Compliance
**Requirement**: Submit annual Property Tax Division (PTD) reports

**Reports Required:**
- **PTD Form 1**: Annual assessment roll summary
- **PTD Form 2**: Levy certification
- **PTD Form 3**: Sales ratio study
- **PTD Form 4**: Exemption detail
- **PTD Form 5**: Personal property detail

**Validation Rules:**
- Sales ratios must be within DOR tolerance (0.90 - 1.10)
- Stratification by property type and value range
- Statistical validation (COD, PRD, PRB)
- Electronic submission format (XML/CSV)

#### RR-002: Public Records Disclosure
**Requirement**: Provide public access to property information (non-confidential)

**Disclosure Rules:**
- Assessed values are public record
- Owner names/addresses public (except confidential flags)
- Sale prices public after 90 days
- Appeal records public after resolution
- Tax payment status public

**Restrictions:**
- Confidential accounts redacted
- Bulk data exports require approval
- API rate limiting for public website

#### RR-003: Audit Trail Requirements
**Requirement**: Maintain complete change history for legal defensibility

**Audit Requirements:**
- Who, what, when, where for all changes
- Before/after values for all updates
- 7-year retention minimum (10 years recommended)
- Non-repudiation (changes cannot be deleted)
- User authentication logs

---

## 3. Functional Requirements

### 3.1 Property Management Module

#### FR-PM-001: Property Search
**Priority**: Critical  
**User Story**: As an appraiser, I need to quickly find properties by various criteria

**Acceptance Criteria:**
- Search by: parcel number, address, owner name, legal description
- Wildcard search supported (e.g., "123 Main*")
- Results display within 2 seconds for <1000 matches
- Results sortable by any column
- Export to Excel/CSV

**Technical Requirements:**
- Full-text indexing on key search fields
- Query optimization with NOLOCK hints
- Result pagination (100 records per page)

#### FR-PM-002: Property Detail View
**Priority**: Critical  
**User Story**: As an appraiser, I need to view complete property information in one place

**Acceptance Criteria:**
- All property data visible on tabbed interface
- Tabs: General, Valuation, Land, Improvements, Sales, Exemptions, Permits, Map, Documents
- Lazy-loaded tabs (fetch data on tab activation)
- Read-only mode for users without edit rights
- Print/export entire property record

**Technical Requirements:**
- WCF service calls for each tab
- Caching of frequently accessed lookup data
- Asynchronous loading for performance

#### FR-PM-003: Property Valuation
**Priority**: Critical  
**User Story**: As an appraiser, I need to calculate property values using cost approach

**Acceptance Criteria:**
- Add/edit improvements with detail components
- Add/edit land details
- Select depreciation factors (physical, economic, functional)
- Apply mass appraisal adjustments
- Manual override capability (with justification)
- Recalculate button updates all values
- Value history comparison

**Technical Requirements:**
- Call RecalcProperty stored procedure
- Matrix cost table lookups
- Depreciation schedule queries
- Optimistic concurrency (check for conflicts)

#### FR-PM-004: Property Mapping
**Priority**: High  
**User Story**: As an appraiser, I need to visualize property location and boundaries

**Acceptance Criteria:**
- Display parcel boundary on map
- Show nearby properties
- Measure distances/areas
- Print map with property details
- Export map image

**Technical Requirements:**
- ESRI ArcGIS Runtime integration
- Query Benton_spatial_data for geometry
- Layer management (parcels, roads, aerials)

### 3.2 Appraisal Module

#### FR-AP-001: Mass Appraisal
**Priority**: Critical  
**User Story**: As a senior appraiser, I need to revalue all properties in a neighborhood

**Acceptance Criteria:**
- Select properties by neighborhood, property type, or custom criteria
- Apply adjustment factor to all selected properties
- Preview value changes before committing
- Batch recalculation (progress indicator)
- Exception report (errors/warnings)

**Technical Requirements:**
- Batch processing via recalc_prop_list table
- Transaction management (rollback on error)
- Background job processing via TaskService

#### FR-AP-002: Comparable Sales Analysis
**Priority**: High  
**User Story**: As an appraiser, I need to find comparable sales for valuation support

**Acceptance Criteria:**
- Automatic comparable selection based on criteria:
  - Property type, size, age, quality, location
  - Sale date range (typically last 12 months)
  - Distance from subject property
- Manual comparable selection/override
- Adjustment grid with comparable features
- Statistical summary (mean, median, adjusted value)
- Export to report

**Technical Requirements:**
- comp_sales_property table queries
- Scoring algorithm (comp_sales_point_* tables)
- Geographic distance calculation

#### FR-AP-003: Appraisal Notice Generation
**Priority**: Critical  
**User Story**: As a notice coordinator, I need to generate value notices for mailing

**Acceptance Criteria:**
- Select properties by criteria (value change, exemption change, new construction)
- Preview notice count and estimated costs
- Batch print notices (formatted PDF)
- Track mailing dates
- Online notice delivery option

**Technical Requirements:**
- appr_notice_prop_list generation
- Crystal Reports or SSRS for formatting
- Batch PDF generation

### 3.3 Collection Module

#### FR-CO-001: Tax Bill Generation
**Priority**: Critical  
**User Story**: As a collections manager, I need to generate annual tax statements

**Acceptance Criteria:**
- Calculate taxes for all properties
- Apply exemptions/deductions
- Generate levy breakdown by district
- Print/mail statements
- Electronic statements (email/online portal)

**Technical Requirements:**
- CalculateTaxable stored procedure
- wa_tax_statement table generation
- Levy distribution logic

#### FR-CO-002: Payment Processing
**Priority**: Critical  
**User Story**: As a cashier, I need to accept and apply payments

**Acceptance Criteria:**
- Enter payment amount and method
- Select bill(s) to apply payment
- Calculate change (cash payments)
- Print receipt immediately
- Credit card processing integration
- Overpayment handling (refund or credit balance)

**Technical Requirements:**
- Payment gateway integration (credit cards)
- Real-time balance updates
- Transaction logging

#### FR-CO-003: Delinquency Management
**Priority**: High  
**User Story**: As a collections officer, I need to track and pursue delinquent accounts

**Acceptance Criteria:**
- Delinquent roll generation (overdue bills)
- Interest/penalty calculation
- Notice generation (delinquency warnings)
- Payment plan setup (installment agreements)
- Tax certificate sale processing (foreclosure)

**Technical Requirements:**
- Daily interest calculation job
- delq_roll table management
- Letter generation workflow

### 3.4 Reporting Module

#### FR-RP-001: Standard Reports
**Priority**: High  
**User Story**: As a user, I need pre-built reports for common tasks

**Reports Required:**
- Property detail report
- Tax roll (by district, by owner)
- Sales summary report
- Exemption summary
- Collection summary (daily, monthly, annual)
- Delinquency report

**Technical Requirements:**
- Crystal Reports or SSRS templates
- Parameter prompts (date ranges, filters)
- Export formats (PDF, Excel, CSV)

#### FR-RP-002: Ad-Hoc Query Builder
**Priority**: Medium  
**User Story**: As a power user, I need to create custom queries

**Acceptance Criteria:**
- Visual query builder (drag-drop fields)
- Filter/sort capabilities
- Save queries for reuse
- Share queries with other users
- Export results

**Technical Requirements:**
- query_builder_* tables
- SQL generation from metadata
- Result caching

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

#### NFR-PERF-001: Response Time
**Requirement**: System must provide responsive user experience

**Targets:**
| Operation | Target | Maximum |
|-----------|--------|---------|
| Property search (< 100 results) | 1 second | 3 seconds |
| Property detail load | 2 seconds | 5 seconds |
| Property save | 1 second | 3 seconds |
| Recalculation (single property) | 3 seconds | 10 seconds |
| Report generation (< 1000 records) | 5 seconds | 15 seconds |
| Payment processing | 2 seconds | 5 seconds |

**Measurement**: 95th percentile response time during peak hours

#### NFR-PERF-002: Throughput
**Requirement**: System must support concurrent users

**Targets:**
- 200 concurrent users (typical)
- 300 concurrent users (peak - tax season)
- 50 transactions/second (payment processing peak)

**Measurement**: Load testing during peak scenarios

#### NFR-PERF-003: Batch Processing
**Requirement**: Large batch operations complete within acceptable timeframes

**Targets:**
- Mass recalculation (10,000 properties): < 2 hours
- Tax bill generation (100,000 bills): < 4 hours
- Appraisal notice generation (20,000 notices): < 1 hour
- Database backup: < 30 minutes

**Measurement**: Scheduled job completion times

### 4.2 Reliability Requirements

#### NFR-REL-001: Availability
**Requirement**: System must be available during business hours

**Targets:**
- **Uptime**: 99.5% during business hours (7 AM - 7 PM)
- **Planned downtime**: < 4 hours/month (scheduled maintenance windows)
- **Unplanned downtime**: < 1 hour/month

**Measurement**: Monthly availability reporting

#### NFR-REL-002: Data Integrity
**Requirement**: System must prevent data corruption

**Controls:**
- Database constraints (foreign keys, check constraints)
- Transaction management (ACID compliance)
- Optimistic concurrency (rowversion columns)
- Change log triggers (audit trail)
- Daily backup verification

**Measurement**: Zero data corruption incidents

#### NFR-REL-003: Disaster Recovery
**Requirement**: System must recover from failures

**Targets:**
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 15 minutes (transaction log backups)
- **Backup retention**: 30 days online, 7 years archival

**Measurement**: Annual DR test success

### 4.3 Scalability Requirements

#### NFR-SCAL-001: Data Growth
**Requirement**: System must handle increasing data volumes

**Projections:**
- Property growth: 2% annually
- Transaction growth: 5% annually (online adoption)
- Document storage: 10 GB/year (images, PDFs)

**Design Considerations:**
- Database partitioning (by year)
- Archive strategy (historical data)
- Index maintenance

#### NFR-SCAL-002: User Growth
**Requirement**: System must support increasing user base

**Projections:**
- Internal users: stable (~200)
- External users (website): 10% annual growth

**Design Considerations:**
- Horizontal scaling (web/app tiers)
- Load balancing
- Connection pooling

### 4.4 Security Requirements

#### NFR-SEC-001: Authentication
**Requirement**: Users must be authenticated before access

**Controls:**
- Windows Authentication (domain accounts)
- Multi-factor authentication (MFA) for remote access
- Password complexity requirements
- Account lockout after failed attempts
- Session timeout (30 minutes inactivity)

**Measurement**: Zero unauthorized access incidents

#### NFR-SEC-002: Authorization
**Requirement**: Users can only perform authorized actions

**Controls:**
- Role-based access control (RBAC)
- Granular permissions (view, edit, delete, recalc, etc.)
- Data-level security (confidential records)
- Audit logging of permission changes

**Measurement**: Annual access review

#### NFR-SEC-003: Data Protection
**Requirement**: Sensitive data must be protected

**Controls:**
- Encryption at rest (Transparent Data Encryption)
- Encryption in transit (TLS 1.2+)
- Credit card data tokenization (PCI-DSS compliance)
- Confidential flag enforcement
- Data masking for non-production environments

**Measurement**: Zero data breaches

#### NFR-SEC-004: Network Security
**Requirement**: System must be protected from external threats

**Controls:**
- Firewall rules (whitelist approach)
- Intrusion detection/prevention (IDS/IPS)
- DDoS protection
- Regular vulnerability scanning
- Penetration testing (annual)

**Measurement**: Quarterly security assessments

### 4.5 Usability Requirements

#### NFR-USA-001: User Interface
**Requirement**: System must be intuitive for users

**Design Principles:**
- Consistent navigation (ribbon menus)
- Task-oriented workflows
- Context-sensitive help
- Keyboard shortcuts for power users
- Error messages with clear guidance

**Measurement**: User satisfaction surveys (> 80% satisfaction)

#### NFR-USA-002: Training
**Requirement**: Users must be able to learn the system

**Training Materials:**
- User manuals (role-based)
- Video tutorials
- Interactive help system
- Sandbox environment for practice

**Measurement**: New user productivity within 2 weeks

### 4.6 Maintainability Requirements

#### NFR-MAIN-001: Code Quality
**Requirement**: Codebase must be maintainable

**Standards:**
- Coding conventions documented
- Code reviews required
- Automated testing (unit, integration)
- Technical debt tracked
- Documentation updated with changes

**Measurement**: Code review completion rate

#### NFR-MAIN-002: System Monitoring
**Requirement**: System health must be monitored

**Monitoring:**
- Server health (CPU, memory, disk)
- Database performance (slow queries, deadlocks)
- Application errors (exception logging)
- Business metrics (property count, payment volume)

**Measurement**: Mean time to detect (MTTD) < 5 minutes

---

## 5. System Architecture Design

### 5.1 Architectural Style

**Style**: N-Tier Client-Server Architecture

**Rationale:**
- **Proven pattern** for enterprise applications
- **Separation of concerns** (presentation, business logic, data)
- **Scalability** via load balancing at each tier
- **Security** through network segmentation

**Tiers:**
1. **Presentation Tier**: WinForms thick client (PACS.NET.exe)
2. **Application Tier**: WCF services (business logic, orchestration)
3. **Data Tier**: SQL Server databases (persistence)

### 5.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PACS.NET.exe │  │PACS.ADMIN.exe│  │PACS.QUERY.exe│      │
│  │ (WinForms)   │  │  (WinForms)  │  │  (WinForms)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │         WCF (wsHttpBinding)         │
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────┐
│         ▼                  ▼                  ▼              │
│                   APPLICATION TIER                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              WCF Service Host                        │   │
│  │  ┌────────────┐  ┌─────────────┐  ┌──────────────┐  │   │
│  │  │ PACSService│  │SecuritySvc  │  │WorkflowSvc   │  │   │
│  │  │ (CRUD)     │  │(Auth/Authz) │  │(Workflows)   │  │   │
│  │  └─────┬──────┘  └──────┬──────┘  └──────┬───────┘  │   │
│  │        │                │                 │           │   │
│  │  ┌─────┴────────────────┴─────────────────┴────────┐ │   │
│  │  │         NHibernate ORM Layer                     │ │   │
│  │  │  (Entity mapping, session management, caching)   │ │   │
│  │  └─────────────────────┬────────────────────────────┘ │   │
│  └────────────────────────┼──────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────┘
                            │
                   SQL Server Protocol
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                           ▼                                   │
│                      DATA TIER                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           SQL Server 2022 (Primary)                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │pacs_oltp │  │  CIAPS   │  │TA_AppSvr │           │   │
│  │  └──────────┘  └──────────┘  └──────────┘           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │PACS_Train│  │Web_Int_B │  │  SSISDB  │           │   │
│  │  └──────────┘  └──────────┘  └──────────┘           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      External Database (GIS)                         │   │
│  │  ┌──────────────────────────────────┐                │   │
│  │  │    Benton_spatial_data           │                │   │
│  │  │    (Parcel geometry)             │                │   │
│  │  └──────────────────────────────────┘                │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### 5.3 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DMZ (Public Network)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Web Server (IIS)                            │   │
│  │  - County property search website                    │   │
│  │  - Queries Web_Internet_Benton database              │   │
│  │  - Public access (read-only)                         │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │ Firewall (port 1433 - restricted)
┌────────────────────────┴─────────────────────────────────────┐
│                  Internal Network (Domain)                    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │    Application Server Farm (Load Balanced)           │   │
│  │  ┌────────────────┐      ┌────────────────┐         │   │
│  │  │  WCF Server 1  │      │  WCF Server 2  │         │   │
│  │  │  (Services)    │      │  (Services)    │         │   │
│  │  └────────────────┘      └────────────────┘         │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │       Database Server (Clustered)                    │   │
│  │  - SQL Server 2022 Always On Availability Group      │   │
│  │  - Primary: SERVER01                                 │   │
│  │  - Secondary: SERVER02 (sync replica)                │   │
│  │  - Backup: SERVER03 (async replica, remote site)     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Client Workstations (100+)                    │   │
│  │  - PACS.NET.exe installed locally                    │   │
│  │  - ClickOnce deployment for updates                  │   │
│  │  - Connects to WCF load balancer                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        File Server (Network Share)                   │   │
│  │  - \\JCHARRISPACS\BuildingPermit_Import              │   │
│  │  - CSV file drop location for ETL                    │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### 5.4 Technology Stack Summary

**Client Tier:**
- .NET Framework 4.8
- Windows Forms
- DevExpress UI Controls 20.2
- ESRI ArcGIS Runtime 10.2.6

**Service Tier:**
- WCF (Windows Communication Foundation)
- Windows Server 2019+
- IIS 10+ (WCF hosting)
- NHibernate ORM
- Castle Windsor (DI container)

**Data Tier:**
- SQL Server 2022 Enterprise
- Always On Availability Groups (high availability)
- Transparent Data Encryption (TDE)
- SQL Server Agent (job scheduling)

**Supporting Infrastructure:**
- Active Directory (authentication)
- Network Load Balancer (application tier)
- Backup: Veeam or SQL Server native backups
- Monitoring: SQL Server Management Studio, custom dashboards

---

## 6. Data Architecture

### 6.1 Data Model Overview

**Entity Relationship Summary:**

```
┌──────────┐
│ account  │◄──────┐
└────┬─────┘       │
     │             │
     │ 1:N         │ 1:N
     │             │
     ▼             │
┌──────────┐  ┌────┴────┐
│ address  │  │  owner  │◄──────┐
└──────────┘  └────┬────┘       │
                   │             │
                   │ N:1         │ N:1
                   │             │
              ┌────▼──────┐      │
              │ property  │◄─────┤
              └────┬──────┘      │
                   │             │
                   │ 1:N         │
                   │             │
              ┌────▼──────┐      │
              │property_val│◄────┤
              └────┬──────┘      │
                   │             │
        ┌──────────┼──────────┐  │
        │          │          │  │
        ▼          ▼          ▼  │
    ┌───────┐  ┌──────┐  ┌────────┐
    │ imprv │  │ land │  │  bill  │
    └───┬───┘  └──┬───┘  └────┬───┘
        │         │           │
        ▼         ▼           ▼
  ┌──────────┐ ┌────────┐ ┌─────────┐
  │imprv_det │ │land_det│ │levy_bill│
  └──────────┘ └────────┘ └─────────┘
```

### 6.2 Data Volumes

**Current State (2024):**
| Entity | Row Count | Growth Rate |
|--------|-----------|-------------|
| property | 100,000 | 2,000/year |
| property_val | 500,000 | 100,000/year (yearly snapshots) |
| owner | 300,000 | Variable (ownership changes) |
| imprv | 150,000 | 3,000/year |
| imprv_detail | 600,000 | 12,000/year |
| land_detail | 400,000 | 8,000/year |
| bill | 2,000,000 | 100,000/year |
| payment | 3,000,000 | 200,000/year |
| change_log | 50,000,000 | 10,000,000/year |

**Database Size:**
- **pacs_oltp**: 250 GB (data) + 50 GB (indexes) = 300 GB
- **CIAPS**: 20 GB
- **Other databases**: 50 GB combined
- **Total**: ~400 GB

**Projected Growth:**
- 5-year projection: 600 GB
- 10-year projection: 900 GB

### 6.3 Data Retention Policy

| Data Type | Online Retention | Archive Retention | Purge Policy |
|-----------|------------------|-------------------|--------------|
| Current year property data | Indefinite | N/A | Never |
| Historical property data (prior years) | 10 years | Indefinite | Never |
| Payments/collections | 10 years | 10 years | After 20 years |
| Change logs | 7 years | 10 years | After 17 years |
| Documents/images | Indefinite | N/A | Manual review |
| Temporary tables (staging) | 30 days | None | Automatic |
| Backup files | 30 days online | 7 years offsite | After 7 years |

### 6.4 Data Quality Rules

**Property Data:**
- `geo_id` must be unique per property
- `prop_val_yr` must be valid year (1900-2100)
- `assessed_val` must be >= 0
- `prop_inactive_dt` NULL for active properties

**Owner Data:**
- `pct_ownership` must sum to 100% per property
- `owner_id` must reference valid account
- `owner_tax_yr` must match property_val year

**Billing Data:**
- `current_amount_due` = `initial_amount_due` - `amount_paid` + interest/penalties
- `effective_due_date` must be in future at creation
- `bill_id` must reference valid trans_group

**Referential Integrity:**
- All foreign keys enforced
- Cascade deletes only for dependent data (e.g., address when account deleted)
- Prevent orphan records

---

## 7. Integration Architecture

### 7.1 Integration Points

#### INT-001: CIAPS Building Permit Integration
**Type**: File-based ETL (CSV import)

**Flow:**
```
External Permit System
  └─> CSV Export (nightly)
      └─> \\JCHARRISPACS\BuildingPermit_Import\
          └─> BuildingPermitLoader.ps1 (scheduled task)
              └─> SQL BULK INSERT → permit.building_import
                  └─> pProcess_BuildingImport (stored procedure)
                      └─> Match to properties (geo_id, address)
                          └─> Insert/Update building_permit table
```

**Data Format:**
- CSV file, comma-delimited
- Header row with column names
- Date format: MM/DD/YYYY
- Required columns: permit_num, issue_date, permit_type, valuation, address

**Error Handling:**
- Unmatched addresses logged to building_permit_import_error
- Email notification on processing errors
- Manual review queue for unresolved permits

**Frequency**: Daily (2:00 AM)

#### INT-002: Web_Internet_Benton Data Export
**Type**: Database-to-Database (stored procedures)

**Flow:**
```
pacs_oltp (source)
  └─> pExport_PropertyData (scheduled job)
      └─> Web_Internet_Benton (target)
          └─> County website queries Web_Internet_Benton
```

**Data Exported:**
- Property values (current year only)
- Sales history (last 5 years)
- Tax amounts (current + prior year)
- Building characteristics

**Transformations:**
- Exclude confidential properties
- Redact sensitive owner information
- Anonymize recent sales (<90 days)

**Frequency**: Daily (3:00 AM)

#### INT-003: Payment Gateway Integration
**Type**: API (REST/SOAP)

**Vendors:**
- Credit card processor: [Vendor TBD]
- ACH processor: [Vendor TBD]

**Flow:**
```
PACS.NET.exe
  └─> WCF PaymentService
      └─> Payment Gateway API
          └─> Authorization/Capture
              └─> Response stored in tender table
```

**Security:**
- PCI-DSS Level 1 compliance
- Tokenization (no card storage)
- TLS 1.2+ encryption
- IP whitelisting

**Error Handling:**
- Retry logic (3 attempts)
- Timeout handling (30 seconds)
- Fallback to manual processing

#### INT-004: General Ledger Integration
**Type**: File-based export (CSV/XML)

**Flow:**
```
pacs_oltp
  └─> fin_transaction table
      └─> GL Export Job (nightly)
          └─> CSV file generation
              └─> FTP to GL system
```

**Data Exported:**
- Account number, debit/credit, amount, date, description
- Batch control totals
- Transaction reference numbers

**Frequency**: Daily (after close of business)

### 7.2 API Specifications

#### API-001: Property Search API (Internal)
**Endpoint**: `PACSService.SearchProperties`  
**Protocol**: WCF/SOAP  
**Authentication**: Windows Authentication

**Request:**
```xml
<SearchPropertiesRequest>
  <GeoId>123-456-789</GeoId>
  <Address>Main Street</Address>
  <OwnerName>Smith</OwnerName>
  <MaxResults>100</MaxResults>
</SearchPropertiesRequest>
```

**Response:**
```xml
<SearchPropertiesResponse>
  <Properties>
    <Property>
      <PropId>12345</PropId>
      <GeoId>123-456-789</GeoId>
      <SitusAddress>123 Main St</SitusAddress>
      <OwnerName>John Smith</OwnerName>
      <AssessedValue>250000</AssessedValue>
    </Property>
    ...
  </Properties>
</SearchPropertiesResponse>
```

#### API-002: Public Property Lookup API
**Endpoint**: `https://property.bentoncounty.gov/api/property/{geoId}`  
**Protocol**: REST/JSON  
**Authentication**: API Key

**Request:**
```http
GET /api/property/123-456-789 HTTP/1.1
Host: property.bentoncounty.gov
X-API-Key: [key]
```

**Response:**
```json
{
  "geoId": "123-456-789",
  "situsAddress": "123 Main St",
  "propertyType": "Residential",
  "assessedValue": 250000,
  "taxAmount": 3500,
  "ownerName": "[Redacted if confidential]",
  "yearBuilt": 2010,
  "squareFeet": 2000
}
```

**Rate Limiting**: 100 requests/hour per API key

---

## 8. Security Architecture

### 8.1 Security Layers

**Defense in Depth:**

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Network Security                              │
│ - Firewall rules (inbound/outbound)                    │
│ - VPN for remote access                                │
│ - Network segmentation (VLANs)                         │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Application Security                          │
│ - Windows Authentication (Kerberos)                    │
│ - Multi-factor authentication (MFA)                    │
│ - Session management (timeout, encryption)             │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Authorization                                 │
│ - Role-based access control (RBAC)                     │
│ - Granular permissions (view, edit, delete, etc.)      │
│ - Data-level security (confidential flags)             │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Data Security                                 │
│ - Encryption at rest (TDE)                             │
│ - Encryption in transit (TLS 1.2+)                     │
│ - Data masking (non-production)                        │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 5: Audit & Monitoring                            │
│ - Change log triggers (all updates)                    │
│ - Authentication logs                                  │
│ - Security event monitoring (SIEM)                     │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Authentication Flow

```
1. User launches PACS.NET.exe
   └─> Windows Authentication (domain login)

2. Client connects to WCF service
   └─> Kerberos ticket validation
   └─> SecurityService.Authenticate(username)

3. SecurityService queries pacs_user table
   └─> Verify user exists and is active
   └─> Load user rights via user_role_user_assoc

4. Session established
   └─> Session token returned to client
   └─> Rights cached in memory

5. Subsequent requests
   └─> Session token validated
   └─> Rights checked before each operation
```

### 8.3 Encryption Standards

**Data at Rest:**
- **SQL Server TDE** (Transparent Data Encryption)
- Algorithm: AES-256
- Certificate stored in master database
- Key rotation: Annual

**Data in Transit:**
- **TLS 1.2 or higher** (SSL deprecated)
- Certificate: Wildcard cert for *.bentoncounty.gov
- Cipher suites: Strong ciphers only (no RC4, no DES)

**Sensitive Data:**
- **Credit card numbers**: Tokenized (never stored)
- **SSN** (if stored): Encrypted column-level
- **Passwords**: Hashed (bcrypt or PBKDF2)

### 8.4 Compliance Requirements

**PCI-DSS (Payment Card Industry Data Security Standard):**
- Level 2 compliance (processing < 6M transactions/year)
- Annual SAQ (Self-Assessment Questionnaire)
- Quarterly vulnerability scans
- No card storage (tokenization only)

**CJIS (Criminal Justice Information Services):**
- Applies if law enforcement access confidential records
- Advanced authentication required
- Audit trails for all access

**State/Local Regulations:**
- Public Records Act compliance
- Data breach notification (< 72 hours)
- Privacy protection for confidential records

---

## 9. Development Planning

### 9.1 Development Methodology

**Approach**: Iterative with quarterly releases

**Rationale:**
- Legacy system maintenance (not greenfield)
- Regulatory deadlines (tax season, state reporting)
- User feedback integration

**Sprint Cycle:**
- **Sprint duration**: 2 weeks
- **Planning**: First day of sprint
- **Daily standup**: 15 minutes
- **Sprint review**: Last day of sprint
- **Retrospective**: After review

### 9.2 Release Schedule

**Annual Release Cycle:**

```
Q1 (Jan-Mar): Tax Season Support
  - Bug fixes (high priority)
  - Performance tuning
  - Collections enhancements

Q2 (Apr-Jun): Appraisal Features
  - Mass appraisal improvements
  - Comparable sales tools
  - Notice generation updates

Q3 (Jul-Sep): Compliance & Reporting
  - DOR report updates
  - New state requirements
  - Audit trail enhancements

Q4 (Oct-Dec): Infrastructure & Tech Debt
  - Framework upgrades
  - Database optimization
  - Security patches
```

**Emergency Releases:**
- Critical bugs: within 24 hours
- Security vulnerabilities: within 72 hours

### 9.3 Version Control Strategy

**Repository Structure:**
```
terrafusion_os_1.0/
├── workspaces/
│   └── JCHARRISPACS/
│       ├── DatabaseProjectpacs_oltp/
│       ├── DatabaseProjectPACS_Training/
│       ├── DatabaseProjectCIAPS/
│       ├── DatabaseProjectTA_AppSvr/
│       ├── DatabaseProjectweb_internet_benton/
│       ├── jcharrispacsSSISDB_project/
│       ├── pacs-server-benton/ (deployment scripts)
│       ├── Misc/ (ETL scripts)
│       └── docs/ (documentation)
└── Database/ (legacy structure)
```

**Branching Strategy:**
- **main**: Production-ready code
- **develop**: Integration branch
- **feature/[name]**: Feature development
- **hotfix/[name]**: Emergency fixes

**Merge Policy:**
- Pull requests required
- Code review (1+ approver)
- Automated tests pass
- No direct commits to main

### 9.4 Environment Strategy

| Environment | Purpose | Data | Deployment |
|-------------|---------|------|------------|
| **Local** | Developer workstations | Docker SQL Server, sample data | Manual (publish.ps1) |
| **Dev** | Integration testing | Anonymized production data | Automatic (CI/CD) |
| **Test** | User acceptance testing | Copy of production (monthly refresh) | Manual (release candidate) |
| **Staging** | Pre-production validation | Production replica (nightly sync) | Manual (final verification) |
| **Production** | Live system | Production data | Manual (approved release) |

---

## 10. Testing Strategy

### 10.1 Test Levels

#### Unit Testing
**Scope**: Individual functions/methods

**Tools:**
- NUnit or xUnit (C#)
- Moq (mocking framework)

**Coverage Target**: 70% code coverage (business logic)

**Responsibilities**: Developers

#### Integration Testing
**Scope**: Component interactions

**Focus Areas:**
- WCF service calls
- Database stored procedures
- NHibernate ORM mappings
- External API integrations

**Responsibilities**: QA team + developers

#### System Testing
**Scope**: End-to-end workflows

**Test Scenarios:**
- Property search → detail view → edit → save → recalc
- Tax bill generation → payment processing → receipt printing
- Ownership change → REET calculation → proration
- Mass appraisal → notice generation → appeal processing

**Responsibilities**: QA team

#### User Acceptance Testing (UAT)
**Scope**: Business validation

**Participants:**
- Appraisers (property valuation features)
- Collectors (billing/payment features)
- Administrators (system configuration)

**Duration**: 2 weeks per major release

### 10.2 Performance Testing

**Load Testing:**
- **Tool**: Apache JMeter or LoadRunner
- **Scenarios**:
  - 200 concurrent users (typical load)
  - 300 concurrent users (peak load)
  - 50 transactions/second (payment processing)
- **Metrics**: Response time, throughput, error rate
- **Frequency**: Quarterly + before major releases

**Stress Testing:**
- **Goal**: Identify breaking points
- **Approach**: Gradually increase load until failure
- **Metrics**: Maximum concurrent users, system recovery

**Endurance Testing:**
- **Goal**: Detect memory leaks, resource exhaustion
- **Duration**: 24-48 hours continuous load
- **Metrics**: Memory usage, connection pool size, CPU

### 10.3 Security Testing

**Vulnerability Scanning:**
- **Tool**: Nessus or Qualys
- **Frequency**: Monthly
- **Focus**: Known CVEs, misconfigurations

**Penetration Testing:**
- **Provider**: External security firm
- **Frequency**: Annual
- **Scope**: Network, application, database

**Code Security Review:**
- **Tool**: SonarQube or Veracode
- **Focus**: SQL injection, XSS, CSRF, hardcoded secrets
- **Frequency**: Every commit (automated)

### 10.4 Test Data Management

**Data Sources:**
- **Production**: Copy of production data (anonymized)
- **Synthetic**: Generated test data for specific scenarios
- **Seed Data**: Minimal dataset for unit tests

**Anonymization Process:**
- Replace owner names with fake data
- Randomize addresses (keep format)
- Mask SSN, credit card numbers
- Remove confidential flags

**Refresh Cycle:**
- Dev: Weekly
- Test: Monthly
- Staging: Daily (from production)

---

## 11. Deployment Strategy

### 11.1 Deployment Pipeline

```
┌─────────────────┐
│ Developer       │
│ Commits Code    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Server    │
│ (CI)            │
│ - Compile       │
│ - Unit tests    │
│ - Code analysis │
└────────┬────────┘
         │ Success
         ▼
┌─────────────────┐
│ Dev Environment │
│ (Auto Deploy)   │
│ - Integration   │
│   tests         │
└────────┬────────┘
         │ Manual approval
         ▼
┌─────────────────┐
│ Test Environment│
│ (Manual Deploy) │
│ - UAT           │
│ - Regression    │
└────────┬────────┘
         │ Manual approval
         ▼
┌─────────────────┐
│Staging Env      │
│ (Manual Deploy) │
│ - Final         │
│   validation    │
└────────┬────────┘
         │ Change control approval
         ▼
┌─────────────────┐
│ Production      │
│ (Scheduled)     │
│ - Maintenance   │
│   window        │
└─────────────────┘
```

### 11.2 Database Deployment

**DACPAC Deployment:**
```powershell
# Build database project
dotnet build DatabaseProjectpacs_oltp.sqlproj -c Release

# Generate change script (preview)
SqlPackage /Action:Script `
  /SourceFile:pacs_oltp.dacpac `
  /TargetServerName:PRODSERVER `
  /TargetDatabaseName:pacs_oltp `
  /OutputPath:change_script.sql

# Review script (manual step)

# Apply changes
SqlPackage /Action:Publish `
  /SourceFile:pacs_oltp.dacpac `
  /TargetServerName:PRODSERVER `
  /TargetDatabaseName:pacs_oltp `
  /p:BlockOnPossibleDataLoss=true
```

**Pre-Deployment Checklist:**
- [ ] Full database backup completed
- [ ] Change script reviewed and approved
- [ ] Dependent applications identified
- [ ] Rollback plan documented
- [ ] Maintenance window scheduled
- [ ] Users notified

### 11.3 Application Deployment

**WCF Service Deployment:**
```powershell
# Stop application pool
Stop-WebAppPool -Name "PACSServiceAppPool"

# Backup current version
Copy-Item C:\inetpub\PACSService C:\Backups\PACSService_$(Get-Date -f yyyyMMddHHmmss)

# Deploy new version
Copy-Item \\BuildServer\Releases\PACSService\* C:\inetpub\PACSService -Recurse -Force

# Start application pool
Start-WebAppPool -Name "PACSServiceAppPool"

# Smoke test
Invoke-WebRequest http://localhost/PACSService/PACSService.svc?wsdl
```

**Client Deployment:**
- **Method**: ClickOnce deployment
- **Update check**: On application launch
- **Rollback**: Revert ClickOnce manifest to previous version

### 11.4 Rollback Procedures

**Database Rollback:**
1. Stop application (prevent new connections)
2. Restore database from pre-deployment backup
3. Verify data integrity
4. Restart application
5. Notify users

**Application Rollback:**
1. Deploy previous version (from backup)
2. Restart application pool
3. Test critical functions
4. Notify users

**Rollback Decision Criteria:**
- Critical bugs discovered within 1 hour of deployment
- Data corruption detected
- Performance degradation >50%
- User authentication failures

---

## 12. Maintenance & Operations

### 12.1 Monitoring & Alerting

**System Monitoring:**
| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| CPU usage | > 80% for 5 min | Warning |
| CPU usage | > 95% for 1 min | Critical |
| Memory usage | > 85% | Warning |
| Disk space | < 20% free | Warning |
| Disk space | < 10% free | Critical |
| SQL deadlocks | > 10/hour | Warning |
| Failed logins | > 50/hour | Critical (security) |
| Application errors | > 100/hour | Warning |

**Application Monitoring:**
| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| Response time | > 5 seconds (95th percentile) | Warning |
| Error rate | > 1% | Warning |
| WCF service down | Any service unavailable | Critical |
| Database connection failures | > 10/min | Critical |
| Payment processing failures | > 5% | Critical |

**Business Metrics:**
| Metric | Monitoring | Alert |
|--------|------------|-------|
| Properties valued | Daily count | < expected |
| Payments processed | Hourly total | Deviation > 20% |
| Users logged in | Current count | > 300 (capacity) |
| Recalc errors | Daily count | > 100 |

### 12.2 Backup & Recovery

**Backup Schedule:**
| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Full database | Weekly (Sunday 2 AM) | 30 days |
| Differential | Daily (2 AM) | 7 days |
| Transaction log | Every 15 minutes | 7 days |
| File backup (\\JCHARRISPACS) | Daily | 30 days |
| System state | Weekly | 30 days |

**Backup Verification:**
- Restore test: Monthly (to non-production environment)
- Checksum verification: Every backup
- Backup size monitoring: Alert if deviation >20%

**Recovery Scenarios:**
| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| Database corruption | 4 hours | 15 min | Restore from backup + apply transaction logs |
| Server failure | 4 hours | 15 min | Failover to secondary replica (Always On) |
| Datacenter disaster | 24 hours | 1 hour | Failover to DR site, restore from offsite backup |
| Accidental deletion | 1 hour | 15 min | Point-in-time restore to temp database, copy data |

### 12.3 Maintenance Windows

**Scheduled Maintenance:**
- **Frequency**: Monthly (2nd Sunday of month)
- **Time**: 12:00 AM - 6:00 AM
- **Duration**: Up to 6 hours
- **Activities**:
  - Windows updates
  - SQL Server patches
  - Index rebuild/reorganize
  - Database integrity checks (DBCC CHECKDB)
  - Statistics updates

**Emergency Maintenance:**
- Security patches: As needed (within 72 hours of release)
- Critical bugs: As needed (within 24 hours)

**User Notification:**
- Email: 1 week advance notice
- System message: 3 days advance notice
- Popup warning: 1 hour before maintenance

### 12.4 Support & Troubleshooting

**Support Tiers:**

**Tier 1: Help Desk**
- User password resets
- Basic navigation questions
- Report generation issues
- Escalate to Tier 2 if unresolved in 30 minutes

**Tier 2: Application Support**
- Application errors/crashes
- Data entry issues
- Workflow problems
- Escalate to Tier 3 if unresolved in 2 hours

**Tier 3: Engineering**
- Database issues
- Performance problems
- Integration failures
- Code bugs

**Common Issues & Resolutions:**

| Issue | Diagnosis | Resolution |
|-------|-----------|------------|
| Slow performance | Check CPU/memory, slow queries | Restart app pool, optimize query |
| Recalc errors | Check prop_recalc_errors table | Fix data issue, clear error, rerun |
| Login failures | Check Active Directory, pacs_user table | Unlock account, verify permissions |
| Payment processing failure | Check payment gateway logs | Retry transaction, contact vendor |
| Report generation timeout | Check report parameters, data volume | Narrow date range, add indexes |

**Escalation Path:**
1. Help Desk → Application Support (30 min)
2. Application Support → Engineering (2 hours)
3. Engineering → Vendor (TrueAutomation) (4 hours)

### 12.5 Change Management

**Change Types:**

**Standard Change** (pre-approved):
- Application patches (minor bug fixes)
- Security updates
- Index maintenance
- Approval: Automatic

**Normal Change** (requires approval):
- New features
- Schema changes
- Infrastructure changes
- Approval: Change Advisory Board (CAB)

**Emergency Change** (expedited):
- Critical security vulnerabilities
- System outages
- Data corruption
- Approval: IT Director + 1 CAB member

**Change Control Process:**
1. Submit change request (ServiceNow ticket)
2. CAB review (weekly meeting)
3. Approval/rejection/defer
4. Schedule change
5. Execute change
6. Post-implementation review

---

## 13. Risks & Mitigation

### 13.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Database corruption | Low | Critical | Daily backups, Always On replication, DBCC checks |
| Server hardware failure | Medium | High | Clustered servers, hot spare hardware |
| Network outage | Low | High | Redundant network paths, UPS, generator |
| Performance degradation (data growth) | High | Medium | Regular index maintenance, archival strategy, capacity planning |
| Extended stored procedure issues (xp_*) | Medium | High | Document dependencies, test thoroughly, maintain C++ source |

### 13.2 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Key personnel turnover | Medium | High | Knowledge transfer, documentation, cross-training |
| Vendor discontinuation (TrueAutomation) | Low | Critical | Maintain source code, evaluate alternatives, escrow agreement |
| Regulatory changes (state requirements) | Medium | High | Monitor DOR communications, flexible design, annual review |
| Budget constraints | Medium | Medium | Prioritize critical features, defer enhancements, seek grants |

### 13.3 Security Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Ransomware attack | Medium | Critical | Offline backups, user training, endpoint protection, MFA |
| Data breach (PII exposure) | Low | Critical | Encryption, access controls, audit trails, incident response plan |
| Insider threat | Low | High | Principle of least privilege, monitoring, background checks |
| DDoS attack (public website) | Medium | Medium | CDN, rate limiting, traffic filtering |

---

## 14. Success Criteria

### 14.1 Project Success Metrics

**System Performance:**
- ✅ 95% of queries complete within target response time
- ✅ 99.5% uptime during business hours
- ✅ Zero data loss incidents

**User Satisfaction:**
- ✅ >80% user satisfaction score (annual survey)
- ✅ <50 help desk tickets/month (after stabilization)
- ✅ >90% user adoption rate (daily active users)

**Business Outcomes:**
- ✅ 100% properties valued by certification deadline
- ✅ <2% appeal rate on valuations
- ✅ >95% payment collection rate
- ✅ Zero DOR compliance violations

**Technical Quality:**
- ✅ <5 critical bugs in production per quarter
- ✅ <2% transaction failure rate
- ✅ 70% unit test code coverage

### 14.2 Acceptance Criteria

**Go-Live Readiness:**
- [ ] All critical/high priority defects resolved
- [ ] UAT sign-off from business owners
- [ ] Performance testing passed
- [ ] Security audit completed
- [ ] Disaster recovery tested
- [ ] Production environment ready
- [ ] Users trained
- [ ] Support procedures documented
- [ ] Rollback plan approved

---

## 15. Appendices

### Appendix A: Acronyms & Definitions

- **ARB**: Appraisal Review Board
- **CIAPS**: County Integrated Assessment & Permit System
- **DACPAC**: Data-tier Application Package (SQL Server deployment)
- **DOR**: Department of Revenue (state regulatory agency)
- **NHibernate**: Object-Relational Mapping framework for .NET
- **PACS**: Property Assessment and Collection System
- **PCI-DSS**: Payment Card Industry Data Security Standard
- **PTD**: Property Tax Division (of DOR)
- **REET**: Real Estate Excise Tax
- **RTO**: Recovery Time Objective
- **RPO**: Recovery Point Objective
- **TDE**: Transparent Data Encryption
- **WCF**: Windows Communication Foundation

### Appendix B: Reference Documents

- PACS Deep Dive Technical Documentation (`PACS_DEEP_DIVE.md`)
- Technology Stack Reference (`TECH_STACK.md`)
- Copilot Instructions (`.github/copilot-instructions.md`)
- Database Schema Documentation (SQL files)
- TrueAutomation PACS Vendor Documentation (proprietary)

### Appendix C: Contact Information

**Project Stakeholders:**
- County Assessor: [Contact Info]
- County Treasurer: [Contact Info]
- IT Director: [Contact Info]
- Database Administrator: [Contact Info]
- Lead Developer: [Contact Info]

**Vendor Contacts:**
- TrueAutomation Support: [Contact Info]
- Microsoft SQL Server Support: [Contract Number]
- DevExpress Support: [License Key]

---

**Document Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-03 | TrueAutomation PACS Elite Engineering Team | Initial RPD document |

---

**Approval Signatures:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| County Assessor | | | |
| County Treasurer | | | |
| IT Director | | | |
| Project Manager | | | |

---

*End of Requirements, Planning & Design Document*
