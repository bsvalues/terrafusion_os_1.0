# Benton County PACS - Complete Technology Stack Reference

## Document Control

**System**: Benton County Property Assessment and Collection System (PACS)  
**Purpose**: Comprehensive technology inventory and specifications  
**Version**: 1.0  
**Date**: November 3, 2025  
**Prepared By**: TrueAutomation PACS Elite Government OS Engineering Team

---

## Table of Contents

1. [Technology Stack Overview](#1-technology-stack-overview)
2. [Client Application Layer](#2-client-application-layer)
3. [Application Service Layer](#3-application-service-layer)
4. [Data Layer](#4-data-layer)
5. [Integration Layer](#5-integration-layer)
6. [Infrastructure Layer](#6-infrastructure-layer)
7. [Development & Build Tools](#7-development--build-tools)
8. [Testing Tools](#8-testing-tools)
9. [Monitoring & Operations](#9-monitoring--operations)
10. [Security Tools](#10-security-tools)
11. [Third-Party Components](#11-third-party-components)
12. [Version Matrix](#12-version-matrix)
13. [Technology Lifecycle](#13-technology-lifecycle)
14. [Migration Considerations](#14-migration-considerations)

---

## 1. Technology Stack Overview

### 1.1 High-Level Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                               │
│  .NET Framework 4.8 | WinForms | DevExpress | ArcGIS         │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ WCF over HTTP/HTTPS
                        │
┌───────────────────────┴───────────────────────────────────────┐
│                 APPLICATION SERVICE LAYER                      │
│  WCF Services | NHibernate | Windows Server | IIS            │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ SQL Server Protocol (TDS)
                        │
┌───────────────────────┴───────────────────────────────────────┐
│                      DATA LAYER                               │
│  SQL Server 2022 | T-SQL | Extended SPs | SSIS               │
└───────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Categories

| Category | Primary Technologies | Purpose |
|----------|---------------------|---------|
| **Client Development** | .NET Framework 4.8, C#, WinForms | Desktop application |
| **UI Controls** | DevExpress 20.2 | Rich user interface |
| **Service Layer** | WCF, IIS, Windows Server | Business logic tier |
| **ORM** | NHibernate 5.x | Data access abstraction |
| **Database** | SQL Server 2022 Enterprise | Data persistence |
| **GIS** | ESRI ArcGIS Runtime 10.2.6 | Mapping/spatial |
| **Reporting** | Crystal Reports, SSRS | Report generation |
| **Build/Deploy** | MSBuild, SqlPackage, PowerShell | CI/CD pipeline |
| **Version Control** | Git, GitHub | Source code management |

---

## 2. Client Application Layer

### 2.1 Core Framework

**Microsoft .NET Framework 4.8**

- **Version**: 4.8.0 (Final version - no further releases)
- **Release Date**: April 18, 2019
- **End of Support**: Tied to Windows OS lifecycle
- **Target Framework Moniker**: `net48`
- **Runtime**: CLR 4.0

**Key Features Used:**
- Windows Forms (WinForms) for UI
- Windows Communication Foundation (WCF) client
- System.Data.SqlClient for direct database access
- System.Xml for configuration and data serialization
- System.IO for file operations
- System.Drawing for graphics/images

**Why .NET Framework (not .NET Core/5+):**
- Legacy application (started pre-.NET Core)
- WinForms designer maturity
- DevExpress control compatibility
- WCF client support (deprecated in .NET 5+)
- No cross-platform requirement (Windows-only)

**Configuration Files:**
- `PACS.NET.exe.config` - Application settings
- `App.config` - WCF endpoints, connection strings
- Machine-level: `machine.config` for server settings

### 2.2 UI Framework

**Windows Forms (WinForms)**

- **Namespace**: `System.Windows.Forms`
- **Designer**: Visual Studio WinForms Designer
- **Data Binding**: `BindingSource`, `BindingList<T>`
- **MDI Support**: Multiple Document Interface for child forms

**Key Form Types:**
- `Form` - Standard windows
- `UserControl` - Reusable UI components
- `DataGridView` - Tabular data display
- `PropertyGrid` - Property editors
- `TreeView` - Hierarchical navigation

**Dialog Patterns:**
- Modal dialogs: `ShowDialog()`
- Modeless: `Show()`
- Message boxes: `MessageBox.Show()`

### 2.3 Third-Party UI Components

**DevExpress WinForms Controls v20.2**

- **Vendor**: Developer Express Inc.
- **License**: Commercial (per-developer)
- **Installation**: NuGet packages + local assemblies
- **Documentation**: https://docs.devexpress.com/WindowsForms/

**Key Assemblies:**
```
DevExpress.Data.v20.2.dll
DevExpress.Utils.v20.2.dll
DevExpress.XtraEditors.v20.2.dll
DevExpress.XtraGrid.v20.2.dll
DevExpress.XtraBars.v20.2.dll
DevExpress.XtraLayout.v20.2.dll
DevExpress.XtraNavBar.v20.2.dll
DevExpress.XtraTreeList.v20.2.dll
DevExpress.XtraCharts.v20.2.dll
DevExpress.XtraReports.v20.2.dll
DevExpress.XtraPrinting.v20.2.dll
```

**Primary Controls Used:**

| Control | Purpose | Location Example |
|---------|---------|------------------|
| `XtraForm` | Base form class | All main windows |
| `GridControl` / `GridView` | Data grids | Property search results |
| `LayoutControl` | Form layout management | Property detail forms |
| `RibbonControl` | Ribbon menu | Main application menu |
| `DockManager` | Docking panels | Tool windows |
| `NavBarControl` | Navigation sidebar | Module navigation |
| `TreeList` | Hierarchical data | Folder structures |
| `DateEdit` | Date picker | Date fields |
| `LookUpEdit` | Dropdown with search | Code table lookups |
| `MemoEdit` | Multi-line text | Legal descriptions |
| `ButtonEdit` | Text with button | Search fields |
| `ProgressBarControl` | Progress indicators | Batch processing |

**Styling:**
- **Skins**: Office 2019 theme (default)
- **Vector Icons**: SVG icon library
- **Font**: Segoe UI 9pt

### 2.4 GIS Integration

**ESRI ArcGIS Runtime SDK for .NET v10.2.6**

- **Vendor**: ESRI (Environmental Systems Research Institute)
- **License**: Commercial (runtime deployment license)
- **Target Framework**: .NET Framework 4.5+
- **Architecture**: 32-bit and 64-bit support

**Key Assemblies:**
```
ESRI.ArcGIS.Client.dll
ESRI.ArcGIS.Client.Toolkit.dll
ESRI.ArcGIS.Runtime.dll
```

**Functionality:**
- Map display and navigation
- Parcel boundary visualization
- Feature layers (properties, roads, boundaries)
- Geocoding (address to coordinates)
- Spatial queries (find nearby properties)
- Measurement tools (distance, area)
- Print/export maps

**Data Sources:**
- **Local Database**: Benton_spatial_data (SQL Server with spatial types)
- **Shapefile Support**: Legacy GIS data import
- **ArcGIS Server**: Enterprise GIS services (if available)

**Coordinate Systems:**
- **EPSG:2927**: Washington State Plane South (feet)
- **EPSG:4326**: WGS84 (lat/lon for web mapping)

### 2.5 Document Management

**LeadTools Document Imaging SDK**

- **Vendor**: LEAD Technologies
- **Version**: [Version TBD - check assemblies]
- **Purpose**: Document scanning, OCR, PDF generation

**Key Assemblies:**
```
Leadtools.dll
Leadtools.Codecs.dll
Leadtools.Controls.WinForms.dll
Leadtools.ImageProcessing.Core.dll
Leadtools.Ocr.dll
```

**Features:**
- TWAIN scanner support
- Image format conversion (TIFF, JPEG, PNG, PDF)
- OCR (Optical Character Recognition)
- Annotation tools
- PDF creation and manipulation

### 2.6 Reporting (Client-Side)

**Crystal Reports for .NET Framework**

- **Version**: SAP Crystal Reports 13.x
- **Runtime**: Included in .NET Framework
- **Designer**: Standalone Crystal Reports Designer

**Report Types:**
- Property detail report
- Tax statement
- Appraisal notice
- Collection reports

**Data Sources:**
- Direct database connection
- Typed DataSets
- WCF service data

**Export Formats:**
- PDF (primary)
- Excel (XLSX)
- Word (DOCX)
- CSV

---

## 3. Application Service Layer

### 3.1 Windows Communication Foundation (WCF)

**WCF Runtime**

- **Version**: Included in .NET Framework 4.8
- **Hosting**: IIS 10 with WAS (Windows Activation Service)
- **Protocol**: HTTP/HTTPS
- **Binding**: `WSHttpBinding` (WS-* standards)

**Service Endpoints:**

```xml
<!-- PACSService - Main data service -->
<endpoint 
  address="http://pacsserver.bentoncounty.gov/PACSService/PACSService.svc"
  binding="wsHttpBinding"
  contract="PACS.Services.IPACSService" />

<!-- SecurityService - Authentication/Authorization -->
<endpoint 
  address="http://pacsserver.bentoncounty.gov/SecurityService/SecurityService.svc"
  binding="wsHttpBinding"
  contract="PACS.Services.ISecurityService" />

<!-- WorkflowService - Business workflows -->
<endpoint 
  address="http://pacsserver.bentoncounty.gov/WorkflowService/WorkflowService.svc"
  binding="wsHttpBinding"
  contract="PACS.Services.IWorkflowService" />

<!-- TaskService - Background jobs -->
<endpoint 
  address="http://pacsserver.bentoncounty.gov/TaskService/TaskService.svc"
  binding="wsHttpBinding"
  contract="PACS.Services.ITaskService" />

<!-- DocumentManagementService - Document storage -->
<endpoint 
  address="http://pacsserver.bentoncounty.gov/DocumentService/DocumentService.svc"
  binding="wsHttpBinding"
  contract="PACS.Services.IDocumentManagementService" />
```

**WCF Configuration:**

| Setting | Value | Purpose |
|---------|-------|---------|
| `maxReceivedMessageSize` | 2,147,483,647 (2 GB) | Large data transfers |
| `receiveTimeout` | 00:45:00 (45 min) | Long-running operations |
| `sendTimeout` | 00:45:00 (45 min) | Report generation |
| `maxBufferPoolSize` | 524,288 (512 KB) | Memory optimization |
| `maxArrayLength` | 2,147,483,647 | Large arrays |
| `maxStringContentLength` | 2,147,483,647 | Large strings |

**Security:**
- **Authentication**: Windows (Kerberos/NTLM)
- **Authorization**: Role-based (custom)
- **Message Security**: `Message` mode (encrypted SOAP)
- **Transport Security**: HTTPS (optional, for external access)

**Behavior Extensions:**
- `serviceMetadata`: Enable WSDL (for development)
- `serviceDebug`: Include exception details (development only)
- `serviceThrottling`: Concurrent call limits
- `dataContractSerializer`: Max items in object graph

### 3.2 Object-Relational Mapping (ORM)

**NHibernate v5.x**

- **Version**: 5.3.x (latest compatible with .NET Framework 4.8)
- **License**: LGPL (open source)
- **Purpose**: Database abstraction, entity mapping

**NuGet Packages:**
```xml
<PackageReference Include="NHibernate" Version="5.3.x" />
<PackageReference Include="FluentNHibernate" Version="3.1.0" /> <!-- Optional, for fluent mapping -->
<PackageReference Include="NHibernate.Caches.SysCache" Version="5.7.0" /> <!-- Second-level cache -->
```

**Configuration:**

```xml
<!-- hibernate.cfg.xml -->
<hibernate-configuration>
  <session-factory>
    <property name="connection.provider">NHibernate.Connection.DriverConnectionProvider</property>
    <property name="connection.driver_class">NHibernate.Driver.SqlClientDriver</property>
    <property name="connection.connection_string">Server=DBSERVER;Database=pacs_oltp;Integrated Security=true;</property>
    <property name="dialect">NHibernate.Dialect.MsSql2012Dialect</property>
    <property name="show_sql">false</property>
    <property name="format_sql">true</property>
    <property name="cache.use_second_level_cache">true</property>
    <property name="cache.provider_class">NHibernate.Caches.SysCache.SysCacheProvider, NHibernate.Caches.SysCache</property>
  </session-factory>
</hibernate-configuration>
```

**Mapping Strategies:**
- **XML Mapping**: `.hbm.xml` files for entity definitions
- **Fluent Mapping**: C# code-based mappings (alternative)
- **Convention**: Table name = Entity name, composite keys common

**Key Features Used:**
- Lazy loading (proxies for related entities)
- Change tracking (dirty checking)
- Second-level cache (for lookup tables)
- Batch fetching (optimize N+1 queries)
- Optimistic concurrency (version/timestamp)

**Session Management:**
- **Pattern**: Session-per-request
- **Scope**: WCF operation call
- **Transactions**: Explicit transaction management

### 3.3 Dependency Injection

**Castle Windsor v5.x**

- **Version**: 5.1.x
- **License**: Apache 2.0 (open source)
- **Purpose**: IoC container for dependency injection

**NuGet Package:**
```xml
<PackageReference Include="Castle.Windsor" Version="5.1.x" />
```

**Registration Example:**
```csharp
// Register services
container.Register(
  Component.For<IPropertyService>()
    .ImplementedBy<PropertyService>()
    .LifestylePerWcfOperation(),
  
  Component.For<ISecurityService>()
    .ImplementedBy<SecurityService>()
    .LifestyleSingleton(),
  
  Component.For<ISessionFactory>()
    .UsingFactoryMethod(CreateSessionFactory)
    .LifestyleSingleton()
);
```

**Lifestyle Management:**
- `LifestyleSingleton`: One instance per application
- `LifestylePerWcfOperation`: One instance per WCF call
- `LifestyleTransient`: New instance each time

### 3.4 Workflow Engine

**Windows Workflow Foundation (WF)**

- **Version**: 4.5 (included in .NET Framework 4.8)
- **Namespace**: `System.Activities`
- **Hosting**: WorkflowServiceHost in IIS

**Workflow Types:**
- Appraisal workflow (notice → appeal → resolution)
- Ownership change workflow (deed → REET → proration)
- Payment plan workflow (agreement → schedule → collection)

**Persistence:**
- **SQL Workflow Instance Store**: Workflow state persisted in SQL Server
- **Tracking**: Workflow execution history

**Activities:**
- Custom activities for PACS business logic
- Approval activities (human task)
- Decision activities (business rules)

---

## 4. Data Layer

### 4.1 Database Management System

**Microsoft SQL Server 2022 Enterprise Edition**

- **Version**: 16.0 (SQL Server 2022)
- **Build**: 16.0.1000.6 (or later)
- **Edition**: Enterprise (for Always On Availability Groups)
- **Licensing**: Per-core model
- **End of Mainstream Support**: January 11, 2028
- **End of Extended Support**: January 11, 2033

**Edition Features Used:**

| Feature | Purpose |
|---------|---------|
| Always On Availability Groups | High availability (primary + 2 replicas) |
| Transparent Data Encryption (TDE) | Data at rest encryption |
| SQL Server Agent | Job scheduling (backups, ETL, maintenance) |
| Full-Text Search | Address/owner name searching |
| Spatial Data Types | GIS parcel geometry |
| Columnstore Indexes | Analytics/reporting queries |
| Resource Governor | Query resource management |
| Database Mail | Email notifications |

**Database Compatibility Level:**
- **Level**: 150 (SQL Server 2019) or 160 (SQL Server 2022)
- **Reason**: Provides latest optimizer features while maintaining compatibility

### 4.2 Database Architecture

**6-Database System:**

```sql
-- Production PACS database
CREATE DATABASE pacs_oltp
  ON PRIMARY (
    NAME = pacs_oltp_data,
    FILENAME = 'D:\SQLData\pacs_oltp.mdf',
    SIZE = 100GB,
    MAXSIZE = UNLIMITED,
    FILEGROWTH = 10GB
  )
  LOG ON (
    NAME = pacs_oltp_log,
    FILENAME = 'E:\SQLLog\pacs_oltp_log.ldf',
    SIZE = 50GB,
    MAXSIZE = UNLIMITED,
    FILEGROWTH = 5GB
  );

-- Training/backup clone
CREATE DATABASE PACS_Training;

-- Building permits (third-party)
CREATE DATABASE CIAPS;

-- Tax assessor app server
CREATE DATABASE TA_AppSvr;

-- Public website data staging
CREATE DATABASE Web_Internet_Benton;

-- SQL Server Integration Services catalog
CREATE DATABASE SSISDB;
```

**Recovery Model:**
- **Model**: FULL (for point-in-time recovery)
- **Backup Strategy**: 
  - Full: Weekly (Sunday 2 AM)
  - Differential: Daily (2 AM)
  - Transaction log: Every 15 minutes

**Database Options:**
```sql
ALTER DATABASE pacs_oltp SET
  RECOVERY FULL,
  READ_COMMITTED_SNAPSHOT ON,  -- Row versioning for read consistency
  AUTO_UPDATE_STATISTICS_ASYNC ON,  -- Background stats updates
  PARAMETERIZATION FORCED,  -- Query plan reuse
  COMPATIBILITY_LEVEL = 150;
```

### 4.3 T-SQL Programming

**Stored Procedures:**

| Category | Count | Naming Convention |
|----------|-------|-------------------|
| Data access (CRUD) | ~500 | `p{Action}_{Entity}` (e.g., `pInsert_Property`) |
| Calculations | ~100 | `pCalculate{What}` (e.g., `pCalculateTaxable`) |
| Reports | ~300 | `pReport_{ReportName}` |
| ETL/Integration | ~50 | `pProcess_{Process}` (e.g., `pProcess_BuildingImport`) |
| Utilities | ~100 | `pUtil_{Function}` |
| **Total** | **~2,086** | |

**Extended Stored Procedures:**
- **xp_RecalcProperty90**: Property value recalculation (C++ DLL)
- **xp_CalculateTaxable80**: Taxable value calculation (C++ DLL)
- **xp_CalculatePOES**: Property Owner Entity State (C++ DLL)

**User-Defined Functions:**
- Scalar functions: ~50 (e.g., `fn_GetCurrentYear()`)
- Table-valued functions: ~30 (e.g., `fn_GetPropertyOwners(@prop_id)`)

**Triggers:**
- **Change log triggers**: All tables (e.g., `tr_property_update_ChangeLog`)
- **Business logic triggers**: ~50 (e.g., `tr_property_val_recalc`)
- **Audit triggers**: Security-sensitive tables

**Views:**
- **Base views**: ~100 (simplified table access)
- **Reporting views**: ~200 (pre-joined data for reports)
- **Indexed views**: ~10 (materialized aggregations)

### 4.4 Indexes and Performance

**Index Types:**

| Index Type | Usage | Example |
|------------|-------|---------|
| Clustered (PK) | ~800 (one per table) | `CPK_property_val` |
| Non-clustered | ~2,000 | `idx_property_geo_id` |
| Unique | ~300 | `UQ_account_ref_id1` |
| Full-text | ~10 | `FT_situs_address` |
| Spatial | ~5 | `SIDX_gis_property_geometry` |
| Filtered | ~20 | `idx_property_val_active` (WHERE prop_inactive_dt IS NULL) |

**Index Maintenance:**
- **Job**: SQL Server Agent job (weekly)
- **Strategy**: 
  - Rebuild if fragmentation > 30%
  - Reorganize if fragmentation 10-30%
  - Update statistics after maintenance

**Query Optimization:**
- **Query Store**: Enabled (track query performance)
- **Automatic Tuning**: Enabled (plan forcing)
- **Missing Index DMVs**: Monitored weekly

### 4.5 High Availability & Disaster Recovery

**Always On Availability Groups**

**Configuration:**
```
Availability Group: PACS_AG
  ├── Primary Replica: SERVER01 (Synchronous commit, automatic failover)
  ├── Secondary Replica: SERVER02 (Synchronous commit, automatic failover)
  └── DR Replica: SERVER03 (Asynchronous commit, manual failover, remote site)

Listener: PACS-LISTENER.bentoncounty.gov (Virtual IP)
```

**Failover:**
- **Automatic**: Primary to Secondary (< 30 seconds)
- **Manual**: Primary to DR (planned maintenance)
- **Read-Only Routing**: Reports query secondary replica

**Backup Strategy:**
- **Primary Replica**: Full and differential backups
- **Secondary Replica**: Transaction log backups (to reduce load on primary)

### 4.6 Security Features

**Authentication:**
- **Mode**: Windows Authentication (preferred)
- **SQL Authentication**: Disabled (security best practice)

**Logins & Users:**

| Login | Type | Purpose |
|-------|------|---------|
| `DOMAIN\PACS_ServiceAccount` | Windows | WCF service account |
| `DOMAIN\PACS_Users` | Windows Group | Read/write access for staff |
| `DOMAIN\PACS_Readonly` | Windows Group | Read-only for reports |
| `sa` | SQL | Disabled (security) |
| `ciaps_prod` | SQL | CIAPS third-party integration |

**Database Roles:**
- `db_owner`: Administrators only
- `db_datareader`: Read-only users, web application
- `db_datawriter`: Service accounts, ETL processes
- `Custom roles`: Granular permissions (e.g., `pacs_appraiser`, `pacs_collector`)

**Transparent Data Encryption (TDE):**
```sql
-- Master key in master database
CREATE MASTER KEY ENCRYPTION BY PASSWORD = '[ComplexPassword]';

-- Certificate for encryption
CREATE CERTIFICATE TDE_Cert WITH SUBJECT = 'TDE Certificate for PACS';

-- Database encryption key
USE pacs_oltp;
CREATE DATABASE ENCRYPTION KEY
WITH ALGORITHM = AES_256
ENCRYPTION BY SERVER CERTIFICATE TDE_Cert;

-- Enable TDE
ALTER DATABASE pacs_oltp SET ENCRYPTION ON;
```

**Row-Level Security (RLS):**
- **Confidential records**: Predicate function filters based on user permissions
- **Implementation**: Security policies on account, owner tables

**Dynamic Data Masking:**
- **SSN masking**: `XXX-XX-1234` (last 4 digits visible)
- **Credit card masking**: `XXXX-XXXX-XXXX-1234`

### 4.7 Integration Services (SSIS)

**SQL Server Integration Services (SSIS)**

- **Version**: SSIS 2022
- **Catalog**: SSISDB database
- **Management**: SQL Server Management Studio (SSMS)

**SSIS Packages:**

| Package Name | Purpose | Schedule |
|--------------|---------|----------|
| BuildingPermitImport | Import permit CSVs | Daily 2:00 AM |
| WebDataExport | Export to Web_Internet_Benton | Daily 3:00 AM |
| PropertyValuationETL | Annual valuation data prep | Manual (yearly) |
| BackupValidation | Restore test backups | Weekly (Sunday) |

**Connections:**
- **OLE DB**: SQL Server connections
- **Flat File**: CSV import/export
- **FTP**: External file transfer (if needed)

**Components:**
- **Data Flow**: ETL transformations
- **Control Flow**: Orchestration logic
- **Event Handlers**: Error logging/notification
- **Variables**: Dynamic configuration

---

## 5. Integration Layer

### 5.1 File-Based Integration

**CSV File Processing:**
- **Library**: `System.IO` (native .NET)
- **Parser**: Custom or `CsvHelper` NuGet package
- **Location**: `\\JCHARRISPACS\BuildingPermit_Import\`

**PowerShell Scripting:**
- **Version**: PowerShell 5.1 (Windows PowerShell)
- **Scripts**: `BuildingPermitLoader.ps1`, deployment automation
- **Scheduling**: Windows Task Scheduler

### 5.2 Web Services Integration

**REST API Client:**
- **Library**: `System.Net.Http.HttpClient`
- **Serialization**: `System.Text.Json` or `Newtonsoft.Json`

**SOAP Client:**
- **WCF Client**: For legacy SOAP services
- **WSDL**: Service reference generation

### 5.3 Payment Gateway Integration

**Credit Card Processing:**
- **Provider**: [Vendor TBD]
- **Protocol**: REST API or SOAP
- **Security**: PCI-DSS Level 1 compliance
- **Tokenization**: No card storage (tokens only)

**ACH Processing:**
- **Provider**: [Vendor TBD]
- **Protocol**: NACHA file format
- **Encryption**: GPG or similar

---

## 6. Infrastructure Layer

### 6.1 Operating Systems

**Server OS:**

| Server Role | OS | Version |
|-------------|----|---------| 
| Database Server | Windows Server 2019/2022 Datacenter | Build 17763+ / 20348+ |
| Application Server | Windows Server 2019/2022 Standard | Build 17763+ / 20348+ |
| File Server | Windows Server 2019/2022 Standard | Build 17763+ / 20348+ |

**Client OS:**

| OS | Support | Notes |
|----|---------|-------|
| Windows 10 Pro/Enterprise | 21H2 or later | Primary desktop OS |
| Windows 11 Pro/Enterprise | 22H2 or later | Supported |
| Windows 8.1 | Not recommended | End of support |

**Active Directory:**
- **Domain**: bentoncounty.gov (or bentoncounty.local)
- **Forest Functional Level**: Windows Server 2016 or later
- **Domain Controllers**: At least 2 (redundancy)

### 6.2 Web Server

**Internet Information Services (IIS) 10**

- **Version**: IIS 10.0 (Windows Server 2019/2022)
- **Features Installed**:
  - Web Server (IIS) role
  - Application Development Features:
    - .NET Extensibility 4.8
    - ASP.NET 4.8
    - ISAPI Extensions
    - ISAPI Filters
  - Management Tools:
    - IIS Management Console
    - IIS Management Scripts and Tools
  - Security:
    - Request Filtering
    - Windows Authentication
  - Performance:
    - Dynamic Content Compression
    - Static Content Compression

**Application Pools:**

| App Pool | .NET Version | Identity | Recycling |
|----------|--------------|----------|-----------|
| PACSServiceAppPool | .NET CLR v4.0 | Network Service | Daily at 2 AM |
| DefaultAppPool | .NET CLR v4.0 | ApplicationPoolIdentity | Default (1740 min) |

**SSL/TLS:**
- **Certificate**: Wildcard cert (*.bentoncounty.gov)
- **Protocol**: TLS 1.2, TLS 1.3 (TLS 1.0/1.1 disabled)
- **Cipher Suites**: Strong ciphers only

### 6.3 Networking

**Network Load Balancing (NLB):**
- **Type**: Windows NLB or hardware load balancer
- **Algorithm**: Least connections
- **Health Check**: HTTP GET /PACSService/PACSService.svc

**Firewall Rules:**

| Source | Destination | Port | Protocol | Purpose |
|--------|-------------|------|----------|---------|
| Clients (internal) | App Servers | 80, 443 | HTTP/HTTPS | WCF services |
| App Servers | Database Servers | 1433 | SQL Server | Database access |
| File Server | Database Server | 1433 | SQL Server | ETL import |
| Public | Web Server (DMZ) | 443 | HTTPS | Public website |
| Web Server (DMZ) | Database Server | 1433 | SQL Server | Read-only query |

**VPN:**
- **Type**: SSL VPN or IPsec
- **Purpose**: Remote access for IT staff
- **MFA**: Required for external access

### 6.4 Storage

**Storage Area Network (SAN):**
- **Type**: Fiber Channel or iSCSI SAN
- **RAID**: RAID 10 (performance + redundancy)
- **Capacity**:
  - Database data: 1 TB (with growth capacity)
  - Database logs: 500 GB
  - Backups: 2 TB (30-day retention)
  - File shares: 500 GB

**Backup Storage:**
- **Primary**: Local disk (NAS or SAN)
- **Secondary**: Tape or cloud (offsite)
- **Retention**: 30 days online, 7 years archival

---

## 7. Development & Build Tools

### 7.1 Integrated Development Environment (IDE)

**Visual Studio 2022**

- **Edition**: Professional or Enterprise
- **Version**: 17.x (latest)
- **Workloads**:
  - .NET desktop development
  - Data storage and processing
  - ASP.NET and web development (for WCF)

**Extensions:**
- **ReSharper** (optional): Code analysis and refactoring
- **SonarLint**: Code quality and security
- **GitKraken** (alternative): Git GUI client

**Visual Studio 2019** (legacy support):
- **Edition**: Professional
- **Version**: 16.x
- **Purpose**: Maintain compatibility with older DevExpress versions

### 7.2 SQL Development Tools

**SQL Server Management Studio (SSMS)**

- **Version**: 19.x (latest)
- **Purpose**: Database administration, query development
- **Key Features**:
  - Query editor with IntelliSense
  - Execution plan analysis
  - Database diagram designer
  - Backup/restore management

**Azure Data Studio** (optional):
- **Purpose**: Cross-platform SQL development
- **Extensions**: SQL Server Import, PowerShell

**SQL Server Data Tools (SSDT):**
- **Included in**: Visual Studio 2022
- **Purpose**: Database project development (.sqlproj)
- **SDK**: Microsoft.Build.Sql (0.1.12-preview)

### 7.3 Version Control

**Git**

- **Version**: Git 2.x (latest)
- **Hosting**: GitHub (cloud) or Azure DevOps
- **Repository**: terrafusion_os_1.0
- **Branch Strategy**: GitFlow (main, develop, feature/*, hotfix/*)

**Git Clients:**
- **Git CLI**: Command-line interface
- **Visual Studio**: Built-in Git support
- **GitHub Desktop**: GUI client
- **GitKraken**: Advanced Git GUI (optional)

**.gitignore Pattern:**
```gitignore
# Visual Studio
.vs/
bin/
obj/
*.user
*.suo

# SQL Database Projects
project.assets.json
*.dbmdl

# Compiled assemblies
*.dll
*.exe
*.pdb

# NuGet packages (restore instead)
packages/

# Build output
[Bb]in/
[Oo]bj/
```

### 7.4 Build Automation

**MSBuild**

- **Version**: MSBuild 17.x (Visual Studio 2022)
- **Purpose**: Compile .NET projects
- **Configuration**: Debug, Release

**Build Commands:**
```powershell
# Build solution
msbuild PACS.sln /p:Configuration=Release /p:Platform="Any CPU"

# Build specific project
msbuild PACS.NET.csproj /t:Rebuild /p:Configuration=Release

# Build database project
dotnet build DatabaseProjectpacs_oltp.sqlproj -c Release
```

**SqlPackage CLI**

- **Version**: Included with SSDT or standalone
- **Purpose**: Deploy DACPAC files
- **Download**: https://aka.ms/sqlpackage

**Deployment Command:**
```powershell
SqlPackage.exe `
  /Action:Publish `
  /SourceFile:pacs_oltp.dacpac `
  /TargetServerName:DBSERVER `
  /TargetDatabaseName:pacs_oltp `
  /TargetUser:sa `
  /TargetPassword:[password] `
  /p:BlockOnPossibleDataLoss=true `
  /p:CreateNewDatabase=false
```

### 7.5 Package Management

**NuGet**

- **Version**: NuGet 6.x (Visual Studio integrated)
- **Repository**: nuget.org (public) + internal feed (private packages)
- **Configuration**: `nuget.config`

**Key Packages:**
```xml
<packages>
  <package id="NHibernate" version="5.3.x" />
  <package id="Castle.Windsor" version="5.1.x" />
  <package id="Newtonsoft.Json" version="13.0.x" />
  <package id="System.Data.SqlClient" version="4.8.x" />
  <!-- DevExpress packages (from licensed feed) -->
  <package id="DevExpress.Win.Grid" version="20.2.x" />
  <package id="DevExpress.Win.Ribbon" version="20.2.x" />
</packages>
```

### 7.6 Continuous Integration (CI)

**Azure DevOps Pipelines** (or GitHub Actions)

**Build Pipeline:**
```yaml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'windows-latest'

steps:
  - task: NuGetToolInstaller@1
  
  - task: NuGetCommand@2
    inputs:
      command: 'restore'
      restoreSolution: 'PACS.sln'
  
  - task: VSBuild@1
    inputs:
      solution: 'PACS.sln'
      platform: 'Any CPU'
      configuration: 'Release'
  
  - task: VSTest@2
    inputs:
      testAssemblyVer2: '**\*Tests.dll'
  
  - task: SqlAzureDacpacDeployment@1
    inputs:
      azureSubscription: '[Azure connection]'
      authenticationType: 'server'
      serverName: 'DEV-SQL-SERVER'
      databaseName: 'pacs_oltp'
      sqlUsername: 'sa'
      sqlPassword: '[password]'
      deployType: 'DacpacTask'
      dacpacFile: '$(Build.SourcesDirectory)\DatabaseProjectpacs_oltp\bin\Release\pacs_oltp.dacpac'
```

---

## 8. Testing Tools

### 8.1 Unit Testing

**NUnit Framework**

- **Version**: NUnit 3.x
- **NuGet Package**: `NUnit`, `NUnit3TestAdapter`
- **Test Runner**: Visual Studio Test Explorer

**Mocking Framework:**
- **Moq**: Version 4.x
- **Purpose**: Mock WCF services, database repositories

**Example Test:**
```csharp
[TestFixture]
public class PropertyServiceTests
{
    [Test]
    public void GetProperty_ValidPropId_ReturnsProperty()
    {
        // Arrange
        var mockRepo = new Mock<IPropertyRepository>();
        mockRepo.Setup(r => r.GetProperty(12345)).Returns(new Property { PropId = 12345 });
        var service = new PropertyService(mockRepo.Object);
        
        // Act
        var result = service.GetProperty(12345);
        
        // Assert
        Assert.That(result.PropId, Is.EqualTo(12345));
    }
}
```

### 8.2 Integration Testing

**Database Testing:**
- **Tool**: NUnit + SQL Server LocalDB
- **Approach**: Test stored procedures against real database

**WCF Service Testing:**
- **Tool**: WCF Test Client (built-in)
- **Approach**: Manual service endpoint testing

### 8.3 Performance Testing

**Load Testing:**
- **Tool**: Apache JMeter or Visual Studio Load Test (deprecated)
- **Alternative**: k6 (open source, modern)

**Database Performance:**
- **SQL Server Profiler**: Trace queries
- **Extended Events**: Lightweight profiling
- **Query Store**: Historical performance analysis

### 8.4 Code Quality Tools

**Static Code Analysis:**
- **SonarQube**: Code quality and security scanning
- **ReSharper**: Code inspections (optional commercial tool)
- **StyleCop**: C# code style enforcement

**Security Scanning:**
- **SonarQube Security**: OWASP Top 10 vulnerabilities
- **Veracode** (optional): Commercial security scanning

---

## 8a. TerraFusion Integration API Stack (PacsApi — Added Post-Handoff)

This section documents the ASP.NET Core 8 minimal API built to expose PACS data to TerraFusion OS.

### PacsApi — Core Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | ASP.NET Core Minimal API | .NET 8 | HTTP host, routing, middleware |
| ORM | Dapper | 2.1.28 | Thin SQL-to-object mapping |
| SQL Client | Microsoft.Data.SqlClient | 5.2.2 | SQL Server connectivity (TDS) |
| Auth | JWT Bearer (JwtBearer) | 8.0.0 | Stateless API authentication |
| Logging | Serilog | 8.0.0 | Structured logging, console sink |
| API docs | Swashbuckle (Swagger) | 6.6.2 | OpenAPI spec + Swagger UI |

### PacsApi — Observability

| Component | Package | Version | Purpose |
|-----------|---------|---------|---------|
| OTel core | OpenTelemetry.Extensions.Hosting | 1.8.1 | Trace/metric pipeline host |
| HTTP instrumentation | OpenTelemetry.Instrumentation.AspNetCore | 1.8.1 | Auto-instrument all HTTP requests |
| SQL instrumentation | OpenTelemetry.Instrumentation.SqlClient | 1.8.0-beta.1 | Auto-instrument all SQL queries |
| OTLP export | OpenTelemetry.Exporter.OpenTelemetryProtocol | 1.8.1 | Send traces to any OTLP collector |
| Console export | OpenTelemetry.Exporter.Console | 1.8.1 | Fallback when no OTLP endpoint set |

Set `OTEL_EXPORTER_OTLP_ENDPOINT` env var to activate OTLP export. Service name: `pacs-api`.

### PacsApi — Security Patterns

| Pattern | Implementation | Notes |
|---------|---------------|-------|
| Service account | `pacs_api_svc` SQL login | Least-privilege: datareader + recalc_flag UPDATE only |
| Secret injection | `PACS_API_SVC_PASSWORD` env var | Never hardcoded; replaces PLACEHOLDER in connection string |
| JWT validation | HMAC-SHA256, ≥32-char secret | Throws `InvalidOperationException` on startup if key too short |
| Transport security | `TrustServerCertificate=true` (no `Encrypt=false`) | Encrypts SQL traffic; trusts self-signed cert on dev SQL |
| CORS | `TerraFusion` named policy | Origins from `PACS_CORS_ORIGINS` env var |
| Rate limiting | Sliding window 10 req/60s | Applied to `/v1/operations/*` only |

### PacsApi — Endpoints Summary

9 endpoints across 6 groups. See `docs/PACS_API_REFERENCE.md` for full documentation.

| Group | Endpoints | Auth | Rate-limited |
|-------|-----------|------|-------------|
| Health | GET /health, GET /health/ready | None | No |
| Properties | GET /v1/properties/{id}, /values, /search, /owners, /permits | Bearer JWT | No |
| Owners | GET /v1/owners/{id} | Bearer JWT | No |
| Situs | GET /v1/situs/{id} | Bearer JWT | No |
| Operations | POST /v1/operations/recalc/property/{id} | Bearer JWT | Yes (10/60s) |

---

## 9. Monitoring & Operations

### 9.0 TerraFusion Monitoring Stack (compose.full.yml)

The following monitoring services are configured but require pre-pulled images (Docker Hub blocked on this network):

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| sql_exporter | `burningalchemist/sql_exporter` | 9399 | Expose SQL Server metrics to Prometheus |
| Prometheus | `prom/prometheus:v2.51.2` | 9090 | Metrics collection and alerting |
| Grafana | `grafana/grafana:10.4.2` | 3000 | Dashboards (default: admin/admin) |

Start with: `.\Make.ps1 docker-up`  
Config files: `pacs-server-benton/infra/docker/`, `pacs-server-benton/infra/prometheus/`, `pacs-server-benton/infra/grafana/`

### 9.1 Application Monitoring

**Windows Event Log:**
- **Source**: PACS application events
- **Levels**: Error, Warning, Information
- **Viewer**: Event Viewer (eventvwr.msc)

**Custom Logging:**
- **Library**: `log4net` or `NLog`
- **NuGet Package**: `log4net` version 2.x
- **Targets**: File, database, event log

**Log4net Configuration:**
```xml
<log4net>
  <appender name="RollingFile" type="log4net.Appender.RollingFileAppender">
    <file value="C:\Logs\PACS\PACS.log" />
    <appendToFile value="true" />
    <maximumFileSize value="10MB" />
    <maxSizeRollBackups value="10" />
    <layout type="log4net.Layout.PatternLayout">
      <conversionPattern value="%date [%thread] %-5level %logger - %message%newline" />
    </layout>
  </appender>
  
  <appender name="SqlServer" type="log4net.Appender.AdoNetAppender">
    <connectionString value="Server=DBSERVER;Database=pacs_oltp;Integrated Security=true;" />
    <commandText value="INSERT INTO app_log (log_date, log_level, logger, message) VALUES (@log_date, @log_level, @logger, @message)" />
    <!-- Parameters omitted for brevity -->
  </appender>
  
  <root>
    <level value="INFO" />
    <appender-ref ref="RollingFile" />
    <appender-ref ref="SqlServer" />
  </root>
</log4net>
```

### 9.2 Database Monitoring

**SQL Server Management Studio (SSMS):**
- **Activity Monitor**: Real-time performance dashboard
- **Reports**: Standard reports (disk usage, performance, etc.)

**Dynamic Management Views (DMVs):**
- `sys.dm_exec_requests`: Active queries
- `sys.dm_exec_query_stats`: Query performance statistics
- `sys.dm_os_wait_stats`: Wait statistics
- `sys.dm_db_index_physical_stats`: Index fragmentation

**SQL Server Agent Alerts:**
- **Alert on**: Severity 16+ errors, deadlocks, job failures
- **Notification**: Email via Database Mail

**Query Store:**
- **Enabled**: Yes (for query performance tracking)
- **Retention**: 30 days
- **Purpose**: Identify regressed queries

### 9.3 Infrastructure Monitoring

**Windows Performance Monitor (PerfMon):**
- **Counters**:
  - Processor: % Processor Time
  - Memory: Available MBytes
  - Disk: Avg. Disk sec/Read, Avg. Disk sec/Write
  - SQL Server: Batch Requests/sec, Buffer Cache Hit Ratio

**System Center Operations Manager (SCOM)** (optional):
- **Purpose**: Enterprise monitoring
- **Management Packs**: SQL Server, IIS, Windows Server

**Third-Party Monitoring** (alternatives):
- **SolarWinds Database Performance Analyzer**
- **Redgate SQL Monitor**
- **Datadog** (cloud-based)

### 9.4 Alerting

**Email Notifications:**
- **SQL Server Database Mail**: Configured for SQL Agent alerts
- **SMTP Server**: Internal mail server or Office 365

**SMS/Text Alerts** (optional):
- **Integration**: Third-party service (Twilio, PagerDuty)

**Alert Escalation:**
1. Email to on-call DBA
2. SMS after 15 minutes (no acknowledgment)
3. Escalate to manager after 30 minutes

---

## 10. Security Tools

### 10.1 Antivirus & Endpoint Protection

**Microsoft Defender for Endpoint:**
- **Version**: Included with Windows Server 2019/2022
- **Features**: Real-time protection, cloud-delivered protection
- **Exclusions**: SQL Server data/log files (performance)

**Alternative**: Third-party antivirus (Symantec, McAfee, etc.)

### 10.2 Firewall

**Windows Defender Firewall:**
- **Enabled**: Yes (all profiles)
- **Rules**: Inbound rules for SQL Server (1433), HTTP/HTTPS (80, 443)

**Network Firewall:**
- **Type**: Hardware firewall (Cisco, Palo Alto, etc.)
- **Rules**: See section 6.3 Networking

### 10.3 Vulnerability Scanning

**Microsoft Baseline Security Analyzer (MBSA):**
- **Purpose**: Windows and SQL Server security assessment
- **Frequency**: Monthly

**Nessus or Qualys:**
- **Purpose**: Comprehensive vulnerability scanning
- **Frequency**: Quarterly

### 10.4 Penetration Testing

**External Provider:**
- **Frequency**: Annual
- **Scope**: Network, application, database
- **Report**: Findings and remediation recommendations

---

## 11. Third-Party Components

### 11.1 Commercial Components

| Component | Vendor | License Type | Cost (est.) |
|-----------|--------|--------------|-------------|
| DevExpress WinForms | Developer Express | Per-developer subscription | $499/dev/year |
| ESRI ArcGIS Runtime | ESRI | Runtime deployment | $1,500/deployment |
| Crystal Reports | SAP | Runtime included in .NET | Free (runtime) |
| LeadTools Imaging | LEAD Technologies | Per-developer + runtime | $3,000/dev + $1,000/deployment |
| TrueAutomation PACS Platform | TrueAutomation | Enterprise license + support | $XX,XXX/year |
| SQL Server Enterprise | Microsoft | Per-core licensing | $7,128/core (2-core min) |
| Windows Server Datacenter | Microsoft | Per-core licensing | $6,155/16-core license |

### 11.2 Open Source Components

| Component | License | Purpose |
|-----------|---------|---------|
| NHibernate | LGPL | ORM |
| Castle Windsor | Apache 2.0 | Dependency injection |
| log4net | Apache 2.0 | Logging |
| Newtonsoft.Json | MIT | JSON serialization |
| Dapper (optional) | Apache 2.0 | Micro-ORM for performance |

---

## 12. Version Matrix

### 12.1 Current Production Versions (2025)

| Component | Version | Release Date | Support End Date |
|-----------|---------|--------------|------------------|
| .NET Framework | 4.8 | April 2019 | Tied to Windows OS |
| Windows Server | 2019/2022 | Oct 2018 / Aug 2021 | Jan 2029 / Oct 2031 |
| SQL Server | 2022 | Nov 2022 | Jan 2033 |
| IIS | 10.0 | Sept 2016 | Tied to Windows Server |
| DevExpress WinForms | 20.2 | Dec 2020 | Dec 2023 (upgrade needed) |
| ESRI ArcGIS Runtime | 10.2.6 | June 2014 | Retired (upgrade needed) |
| NHibernate | 5.3.x | 2020 | Community support |
| Castle Windsor | 5.1.x | 2020 | Community support |

### 12.2 Compatibility Matrix

**Client OS Support:**

| OS | .NET Framework 4.8 | DevExpress 20.2 | ArcGIS Runtime 10.2.6 |
|----|-------------------|-----------------|----------------------|
| Windows 10 21H2+ | ✅ Supported | ✅ Supported | ✅ Supported |
| Windows 11 22H2+ | ✅ Supported | ✅ Supported | ✅ Supported |
| Windows 8.1 | ✅ Supported | ⚠️ End of life | ✅ Supported |
| Windows 7 | ❌ Not supported | ❌ Not supported | ⚠️ Limited support |

**Server OS Support:**

| OS | SQL Server 2022 | IIS 10 | WCF Hosting |
|----|-----------------|--------|-------------|
| Windows Server 2022 | ✅ Supported | ✅ Supported | ✅ Supported |
| Windows Server 2019 | ✅ Supported | ✅ Supported | ✅ Supported |
| Windows Server 2016 | ⚠️ Limited support | ✅ Supported | ✅ Supported |

---

## 13. Technology Lifecycle

### 13.1 End-of-Life Components (Upgrade Required)

**DevExpress 20.2:**
- **Status**: Out of support (Dec 2023)
- **Recommendation**: Upgrade to DevExpress 23.2 or later
- **Impact**: Low (mostly UI controls, backward compatible)
- **Effort**: 2-4 weeks (testing + deployment)

**ESRI ArcGIS Runtime 10.2.6:**
- **Status**: Retired (June 2017)
- **Recommendation**: Upgrade to ArcGIS Runtime SDK for .NET 100.15 or later
- **Impact**: High (API changes, code refactoring required)
- **Effort**: 2-3 months (development + testing)

### 13.2 Planned Upgrades (Roadmap)

**2025 Q2:**
- ✅ SQL Server 2022 migration (completed)
- ⏳ DevExpress 23.2 upgrade

**2025 Q4:**
- ArcGIS Runtime SDK upgrade (major effort)
- Windows Server 2022 migration (database servers)

**2026:**
- Evaluate .NET 6/8 migration (long-term project)
- Modernize WCF to gRPC or REST APIs

### 13.3 Technology Risks

| Technology | Risk | Mitigation |
|------------|------|------------|
| .NET Framework 4.8 | No new features, long-term obsolescence | Plan migration to .NET 6/8 (2-3 year project) |
| WCF | Deprecated in .NET Core/5+ | Evaluate gRPC, REST API alternatives |
| Extended Stored Procedures (xp_*) | Proprietary C++ DLLs, vendor dependency | Document functionality, consider T-SQL rewrites |
| Crystal Reports | Limited .NET Core support | Evaluate alternatives (SSRS, Telerik Reporting) |
| ArcGIS Runtime 10.2.6 | Retired product | Upgrade to 100.x series (breaking changes) |

---

## 14. Migration Considerations

### 14.1 .NET Framework to .NET 6/8 Migration

**Challenges:**
- **WinForms**: Supported in .NET 6+, but designer differences
- **WCF Client**: Use CoreWCF or migrate to REST/gRPC
- **DevExpress**: Requires updated controls for .NET 6+
- **NHibernate**: Compatible with .NET 6+

**Benefits:**
- Performance improvements (30-50% faster)
- Cross-platform support (Windows, Linux for services)
- Modern language features (C# 10+)
- Active development and support

**Effort Estimate:**
- **Analysis**: 1 month
- **Development**: 6-12 months
- **Testing**: 3-6 months
- **Deployment**: Phased rollout (3 months)

**Recommendation**: Plan for 2026-2027 timeframe

### 14.2 WCF to gRPC/REST Migration

**gRPC Benefits:**
- Modern, performant (binary protocol)
- Strongly typed contracts
- Bi-directional streaming

**REST API Benefits:**
- Industry standard
- Browser-friendly (web clients)
- Tooling maturity

**Approach:**
- **Phase 1**: New services as gRPC/REST
- **Phase 2**: Migrate existing services incrementally
- **Phase 3**: Retire WCF endpoints

**Effort Estimate:** 12-18 months

### 14.3 Database Modernization

**Considerations:**
- **Extended SPs**: Rewrite in T-SQL or .NET (CLR)
- **SQL Server 2022 features**: Leverage new capabilities
- **Azure SQL**: Evaluate cloud migration (long-term)

**No immediate migration needed** (SQL Server 2022 supported until 2033)

---

## 15. Technology Stack Summary

### 15.1 Technology Scorecard

| Layer | Technology | Maturity | Support Status | Modernization Priority |
|-------|------------|----------|----------------|----------------------|
| **Client** | .NET Framework 4.8 | ⭐⭐⭐⭐⭐ Mature | 🟢 Supported | 🟡 Medium (2026+) |
| **Client** | WinForms | ⭐⭐⭐⭐⭐ Mature | 🟢 Supported | 🟢 Low (stable) |
| **Client** | DevExpress 20.2 | ⭐⭐⭐⭐ Mature | 🔴 End of support | 🔴 High (2025) |
| **Client** | ArcGIS 10.2.6 | ⭐⭐⭐ Legacy | 🔴 Retired | 🔴 High (2025) |
| **Service** | WCF | ⭐⭐⭐⭐⭐ Mature | 🟡 Maintenance mode | 🟡 Medium (2026+) |
| **Service** | NHibernate | ⭐⭐⭐⭐ Mature | 🟢 Community support | 🟢 Low (stable) |
| **Database** | SQL Server 2022 | ⭐⭐⭐⭐⭐ Modern | 🟢 Supported | 🟢 Low (current) |
| **Database** | Extended SPs | ⭐⭐⭐ Legacy | ⚠️ Vendor-dependent | 🟡 Medium (risk) |
| **Infrastructure** | Windows Server 2022 | ⭐⭐⭐⭐⭐ Modern | 🟢 Supported | 🟢 Low (current) |
| **Infrastructure** | IIS 10 | ⭐⭐⭐⭐ Mature | 🟢 Supported | 🟢 Low (stable) |

### 15.2 Strategic Technology Direction

**Short-Term (2025):**
1. ✅ Upgrade DevExpress to 23.2
2. ✅ Upgrade ArcGIS Runtime to 100.x
3. ⏳ Complete SQL Server 2022 migration

**Mid-Term (2026-2027):**
1. Plan .NET 6/8 migration (feasibility study)
2. Begin WCF to gRPC/REST migration (new services)
3. Refactor extended stored procedures

**Long-Term (2028+):**
1. Complete .NET 6/8 migration
2. Evaluate Azure cloud migration
3. Modernize UI (consider Blazor, Avalonia, or web-based)

---

**Document Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-03 | TrueAutomation PACS Elite Engineering Team | Initial technology stack document |

---

*End of Technology Stack Reference Document*
