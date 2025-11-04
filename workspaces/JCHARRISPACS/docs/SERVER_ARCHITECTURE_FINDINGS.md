# PACS Server Architecture - Investigation Findings

## Executive Summary

**Investigation Date**: November 3, 2025  
**Scope**: Complete server architecture analysis - service layer, data access, extended stored procedures, configuration  
**Status**: Phase 1 Complete - WCF Services & NHibernate Analysis  
**Investigator**: TrueAutomation PACS Elite Government OS Engineering Team

This document contains detailed findings from investigating the **complete PACS server architecture** beyond the database schema. Focus areas: WCF service layer, NHibernate ORM configuration, extended stored procedures, and runtime configuration.

---

## 1. WCF Service Architecture

### 1.1 Service Inventory

**6 Core WCF Services Identified:**

| Service Name | Contract Interface | Implementation Assembly | Primary Purpose |
|--------------|-------------------|-------------------------|-----------------|
| **PACS Service** | `TrueAutomation.PACSService.WCF.IPACSService` | TrueAutomation.PACSService.WCF.dll | Core property/assessment data access |
| **Task Service** | `TrueAutomation.TaskService.WCF.ITaskService` | TrueAutomation.TaskService.WCF.dll | Workflow task management |
| **Security Service** | `TrueAutomation.SecurityService.WCF.ISecurityService` | TrueAutomation.SecurityService.WCF.dll | Authentication & authorization |
| **Workflow Service** | `TrueAutomation.WorkflowService.WCF.IWorkflowService` | TrueAutomation.WorkflowService.WCF.dll | Workflow orchestration |
| **Service Bus** | `TrueAutomation.ServiceBus.WCF.IServiceBus` | TrueAutomation.ServiceBus.WCF.dll | Message bus (Rhino ESB) |
| **Document Management** | `TrueAutomation.DocumentManagement.WCF.IDocumentManagementService` | TrueAutomation.DocumentManagement.WCF.dll | Document storage & retrieval |

**Service Location:**
- **Service Host**: `TrueAutomation.Services.Host.exe` (Windows Service)
- **Config File**: `TrueAutomation.Services.Host.exe.config`
- **Base URL Pattern**: `http://{server}:8732/TrueAutomation/Services/{ServiceName}/`

### 1.2 WCF Binding Configuration

**Transport Protocol**: WSHttpBinding (SOAP over HTTP)

**Security Configuration:**
```xml
<security mode="Message">
  <transport clientCredentialType="Windows" />
  <message clientCredentialType="Windows" 
           negotiateServiceCredential="true" 
           algorithmSuite="Default" />
</security>
```

**Key Findings:**
- **Authentication**: Windows Authentication (Kerberos negotiation)
- **No SSL/TLS Transport**: Security mode is "Message" (encrypted SOAP envelope), not "Transport"
- **Identity**: Uses `<dns value="localhost"/>` for service identity

**Message Size Configuration:**

| Service | maxReceivedMessageSize | receiveTimeout | Significance |
|---------|------------------------|----------------|--------------|
| PACSService | 2,147,483,647 bytes (2GB) | 00:45:00 | Longest timeout for complex property data |
| TaskService | 2,147,483,647 bytes | 00:15:00 | Standard timeout |
| SecurityService | 2,147,483,647 bytes | 00:15:00 | Standard timeout |
| WorkflowService | 2,147,483,647 bytes | 00:15:00 | Standard timeout |
| ServiceBus | 2,147,483,647 bytes | 00:15:00 | Standard timeout |
| DocumentManagement | 2,147,483,647 bytes | 00:15:00 | Standard timeout |

**Critical Observation**: PACSService has 3x longer timeout (45 minutes vs 15 minutes) - indicates complex, long-running operations like mass property recalculations.

**Reader Quotas** (All Services):
```xml
<readerQuotas 
  maxDepth="2147483647" 
  maxStringContentLength="2147483647" 
  maxArrayLength="2147483647" 
  maxBytesPerRead="2147483647" 
  maxNameTableCharCount="2147483647" />
```

**Analysis**: Maximum values set for all quotas - designed for large data payloads (property lists, document uploads, batch operations).

### 1.3 Client Configuration

**Client Application**: `PACS.NET.exe`  
**Config File**: `PACS.NET.exe.config`

**Service Endpoints** (Empty addresses = dynamic discovery):
```xml
<endpoint address="" 
          binding="wsHttpBinding" 
          contract="PACSServiceReference.IPACSService" 
          name="WSHttpBinding_IPACSService">
  <identity><dns value="localhost" /></identity>
</endpoint>
```

**Key Finding**: Empty `address=""` attributes indicate service discovery mechanism (likely configured via app settings or service locator pattern).

**Commented Section** reveals previous hardcoded endpoints:
```xml
<!-- Previous Configuration (QA Environment):
     http://VM64QAJob29008:8732/TrueAutomation/Services/PACSService/
     Identity: bmorin@PACS.local
-->
```

**Service References** (Client-side proxies):
- `PACSServiceReference.IPACSService`
- `TaskServiceReference.ITaskService`
- `SecurityServiceReference.ISecurityService`
- `WorkflowServiceReference.IWorkflowService`
- `ServiceBusReference.IServiceBus`
- `DocumentManagementServiceReference.IDocumentManagementService`
- `ValidateAddressAPI.IAddressValidate` (External USPS address validation)

---

## 2. NHibernate ORM Configuration

### 2.1 Session Factory Configuration

**Configuration Pattern**: Multiple session factories (one per service)

**Database Configuration Files:**

| Service | Config File | Database | Connection String Pattern |
|---------|-------------|----------|---------------------------|
| PACS Service | PACSService.db.cfg.xml | pacs_chelan_workflow_dev | Integrated Security (Windows Auth) |
| Task Service | TaskService.db.cfg.xml | (Service-specific DB) | Integrated Security |
| Security Service | SecurityService.db.cfg.xml | workflow_deepa | Integrated Security |
| Workflow Service | WorkflowService.db.cfg.xml | workflow_persistence | Integrated Security |
| Service Bus | ServiceBus.db.cfg.xml | (Message queue DB) | Integrated Security |
| Document Management | DocumentManagementService.db.cfg.xml | (Document storage DB) | Integrated Security |

**Sample Configuration** (PACSService.db.cfg.xml):
```xml
<hibernate-configuration xmlns="urn:nhibernate-configuration-2.2">
  <session-factory>
    <property name="connection.connection_string">
      Data Source=VM64DEVDB9008;
      Database=pacs_chelan_workflow_dev;
      Integrated Security=SSPI;
    </property>
    <property name="dialect">NHibernate.Dialect.MsSql2008Dialect</property>
    <property name="connection.provider">NHibernate.Connection.DriverConnectionProvider</property>
    <property name="connection.driver_class">NHibernate.Driver.SqlClientDriver</property>
    <property name="show_sql">false</property>
    <property name="connection.release_mode">auto</property>
    <property name="adonet.batch_size">500</property>
    <property name="proxyfactory.factory_class">
      NHibernate.ByteCode.Castle.ProxyFactoryFactory, NHibernate.ByteCode.Castle
    </property>
  </session-factory>
</hibernate-configuration>
```

**Key NHibernate Settings:**

| Setting | Value | Significance |
|---------|-------|--------------|
| **dialect** | MsSql2008Dialect | SQL Server 2008+ syntax support |
| **show_sql** | false | SQL logging disabled (performance) |
| **connection.release_mode** | auto | Releases connections automatically |
| **adonet.batch_size** | 500 | Batches 500 INSERT/UPDATE operations |
| **proxyfactory** | Castle.Core | Uses Castle DynamicProxy for lazy loading |

**Critical Finding**: `adonet.batch_size=500` enables significant performance optimization for bulk operations (mass property updates, batch inserts).

### 2.2 Entity Mapping Architecture

**Mapping Assembly Registration** (from TrueAutomation.Services.Host.exe.config):

```xml
<databaseConfiguration>
  <databases>
    <add name="PACS Service" settingsFile="PACSService.db.cfg.xml">
      <mappingAssemblies>
        <add name="PACS Service Data Access Layer" 
             assembly="TrueAutomation.PACSService.DAL.NHibernate"/>
      </mappingAssemblies>
    </add>
    <!-- ... other services ... -->
  </databases>
</databaseConfiguration>
```

**Entity Domain Assemblies:**
- `TrueAutomation.PACSService.Domain.dll` - Entity classes
- `TrueAutomation.PACSService.DAL.NHibernate.dll` - NHibernate mappings
- `TrueAutomation.PACSService.DTOs.dll` - Data transfer objects

**Entity Classes Discovered** (from TrueAutomation.PACSService.Domain.dll):

```
TrueAutomation.PACSService.Domain:
  - Pacs_User
  - Property
  - Account
  - User_Role
  - TaskQuery
  - TaskQueryMapping
  - TaskQuerySelectionField
  - TaskQuerySelectionFieldMapping
```

**Mapping Strategy**: Assembly-based mapping (Fluent NHibernate or embedded .hbm.xml resources)

**Finding**: No standalone `.hbm.xml` files found - mappings are embedded as resources in `*.DAL.NHibernate.dll` assemblies or defined via Fluent NHibernate code-based mappings.

### 2.3 Lazy Loading Configuration

**Proxy Factory**: Castle DynamicProxy (via `NHibernate.ByteCode.Castle`)

**Implications:**
1. **Navigation properties** on entities are lazily loaded by default
2. **N+1 query problem** likely exists in client code
3. **Session-per-request pattern** required to avoid "Session is closed" errors

**Example Lazy Loading Scenario:**
```csharp
// BAD: Triggers N+1 queries
var properties = session.Query<Property>().ToList();
foreach (var prop in properties) {
    var owner = prop.Owner; // Separate query per property!
    Console.WriteLine(owner.Name);
}

// GOOD: Eager loading
var properties = session.Query<Property>()
    .Fetch(p => p.Owner)
    .ToList(); // Single query with JOIN
```

---

## 3. Dependency Injection / IoC Configuration

### 3.1 Castle Windsor Container

**Configuration**: `<castle>` section in `TrueAutomation.Services.Host.exe.config`

```xml
<castle>
  <components>
    <!-- Empty - likely uses code-based registration -->
  </components>
</castle>
```

**Key Libraries:**
- `Castle.Windsor.dll` - IoC container
- `Castle.Core.dll` - Core abstractions
- `Castle.Facilities.Logging.dll` - Logging integration
- `Castle.Facilities.WcfIntegration.dll` - WCF service hosting

**Service Registration Pattern**: Services are registered via `serviceHosting` configuration:

```xml
<serviceHosting>
  <services>
    <add name="PACS Service" 
         service="TrueAutomation.PACSService.WCF.IPACSService, TrueAutomation.PACSService.WCF, Culture=neutral, PublicKeyToken=ff3a2d1ac5316cc0" 
         enabled="true"/>
    <!-- ... other services ... -->
  </services>
</serviceHosting>
```

**Analysis**: Custom service hosting framework that integrates Castle Windsor with WCF.

### 3.2 Repository Pattern

**Configuration**: `<repositoryConfiguration>` section

```xml
<repositoryConfiguration>
  <repositories>
    <!-- Empty in current config -->
  </repositories>
</repositoryConfiguration>
```

**Design Pattern**: Repository pattern abstracts data access from business logic.

**Expected Structure:**
```
Service Layer (WCF) 
  → Business Logic Layer 
    → Repository Interface 
      → Repository Implementation (NHibernate)
        → Database
```

---

## 4. Extended Stored Procedures (Critical Black Box)

### 4.1 Extended SP Discovery

**Extended Stored Procedures Identified:**

| Extended SP Name | DLL File | Purpose | Called From |
|------------------|----------|---------|-------------|
| `xp_RecalcProperty90` | XSP_PACS.dll | Property value recalculation | `RecalcProperty` stored proc |
| `xp_CalculateTaxable80` | XSP_PACS.dll | Taxable value calculation | `CalculateTaxable` stored proc |
| `xp_RecalcProperty80` | XSP_PACS.dll | Legacy recalc version | `RecalcChangedProperty` stored proc |
| `xp_CalculateTaxable90` | XSP_PACS.dll | Taxable calc version 90 | `CNV_Mass_values_update` stored proc |

### 4.2 Registration Commands

**Found in CNV_Mass_values_update.sql:**
```sql
exec sp_addextendedproc 'xp_CalculateTaxable90', 'XSP_PACS.dll'
exec sp_addextendedproc 'xp_RecalcProperty90', 'XSP_PACS.dll'
```

**Critical Finding**: DLL file `XSP_PACS.dll` **NOT FOUND** in workspace or Database folder.

**Implication**: Extended SP DLL is either:
1. Installed in SQL Server's Binn directory (`C:\Program Files\Microsoft SQL Server\MSSQL*.MSSQLSERVER\MSSQL\Binn\`)
2. Registered on production server but not deployed to dev environment
3. Compiled from C++ source code not in this repository

### 4.3 RecalcProperty Extended SP Analysis

**Wrapper Stored Procedure**: `dbo.RecalcProperty`

**Parameters Passed to Extended SP:**
```sql
exec master..xp_RecalcProperty90
    @szTAAppSvr,              -- TA Application Server name
    @lTAAppSvrEnvironmentID,  -- Environment ID
    @szParam1,                -- Parameter 1 (PACS user name?)
    @szParam2,                -- Parameter 2 (unknown)
    @lRecalcByPacsUserID,     -- User ID initiating recalc
    @lYear,                   -- Property valuation year
    @sup_num,                 -- Supplement number
    @prop_id,                 -- Property ID (or 0 for batch)
    @lRecalcIncome,           -- Boolean: recalc income approach?
    @lTrace,                  -- Boolean: enable trace logging?
    @lSaleID,                 -- Sale ID (for comparable analysis?)
    @lChangeLogPacsUserID,    -- User ID for change logging
    @lCalcPTDOnly,            -- Boolean: calc PTD only?
    @lCalcProfileOnly         -- Boolean: calc profile only?
```

**Configuration Source**: `xsp_pacs_config` table

```sql
select top 1
    @szTAAppSvr = szTAAppSvr,
    @lTAAppSvrEnvironmentID = lTAAppSvrEnvironmentID,
    @szParam1 = szParam1,
    @szParam2 = szParam2
from xsp_pacs_config with(nolock)
```

**Batch Recalculation Pattern**:
```sql
-- When @prop_id = 0 and @sup_num > 0, recalc ALL properties in supplement
delete recalc_prop_list where pacs_user_id = @lRecalcByPacsUserID
insert recalc_prop_list (prop_id, sup_yr, sup_num, pacs_user_id)
select pv.prop_id, pv.prop_val_yr, pv.sup_num, @lRecalcByPacsUserID
from property_val as pv with(nolock)
where pv.prop_val_yr = @sup_yr and pv.sup_num = @sup_num
```

**Critical Insight**: Extended SP likely reads from `recalc_prop_list` table for batch operations to optimize performance.

### 4.4 CalculateTaxable Extended SP Analysis

**Wrapper Stored Procedure**: `dbo.CalculateTaxable`

**Parameters:**
```sql
exec master..xp_CalculateTaxable80 
    + @szTAAppSvr + ',' 
    + cast(@lTAAppSvrEnvironmentID as varchar(64)) + ','
    + @szParam1 + ',' + @szParam2 + ','
    + cast(@lYear as varchar(4)) + ',' 
    + cast(@sup_num as varchar(3)) + ','
    + cast(@prop_id as varchar(16)) + ','
    + cast(@lTrace as varchar(1))
```

**Purpose**: Calculates taxable assessed value considering:
- Freeze amounts (senior/disabled exemptions)
- Agricultural use values
- Historical values
- Levy rates

---

## 5. Service Bus / Messaging Architecture

### 5.1 Rhino ESB Configuration

**Message Bus**: Rhino ESB (lightweight service bus)

**Configuration:**
```xml
<rhino.esb>
  <bus threadCount="1" 
       numberOfRetries="1" 
       endpoint="rhino.queues://localhost:22022/trueautomation_servicebus" 
       name="ServiceBus"/>
  <messages>
    <add name="TrueAutomation.WorkflowService.Messages" 
         endpoint="rhino.queues://localhost:22022/trueautomation_servicebus"/>
  </messages>
</rhino.esb>
```

**Key Settings:**
- **Transport**: `rhino.queues://` (persistent file-based queues)
- **Port**: 22022
- **Queue Name**: `trueautomation_servicebus`
- **Thread Count**: 1 (single-threaded processing)
- **Retry Policy**: 1 retry on failure

**Message Consumers:**
```xml
<rhino.consumers>
  <Assemblies>
    <add name="TrueAutomation.ServiceBus.MessageBus.dll"/>
    <add name="TrueAutomation.ServiceBus.MessageBus.Consumers.dll"/>
  </Assemblies>
</rhino.consumers>
```

**Persistent Queue Storage**: Likely uses `Esent.Interop.dll` (Extensible Storage Engine) for queue persistence.

**Use Case**: Asynchronous workflow task processing, background jobs, audit logging.

---

## 6. Logging Configuration

### 6.1 log4net Configuration

**Configuration Files:**
- `log4net.config` (server-side)
- `PACS.NET.log4net.config` (client-side)
- `PACS.ADMIN.log4net.config` (admin client)

**Sample Log Entry** (from `PACS.NET2024.10.23.log`):
```
2024-10-23 14:32:15,123 [1] INFO  TrueAutomation.Client - User logged in: john.doe
```

**Log4net Integration:**
```xml
<configSections>
  <section name="log4net" type="System.Configuration.IgnoreSectionHandler" />
</configSections>
<log4net configSource="PACS.NET.log4net.config" />
```

**Finding**: External config files used for logging to allow runtime changes without recompiling.

---

## 7. Third-Party Integrations

### 7.1 USPS Address Validation

**Service Endpoint:**
```xml
<endpoint address="http://VM64QAJOB910840:8080/ValidateAddressService/AddressValidate" 
          binding="basicHttpBinding" 
          contract="ValidateAddressAPI.IAddressValidate" 
          name="BasicHttpBinding">
```

**Purpose**: Real-time USPS address standardization for situs records.

### 7.2 Email Configuration (SMTP)

**Configuration** (from TrueAutomation.Services.Host.exe.config):
```xml
<system.net>
  <mailSettings>
    <smtp deliveryMethod="Network" from="TA.TestEmail@gmail.com">
      <!-- Using Gmail SMTP temporarily -->
      <network host="smtp.gmail.com" 
               port="587" 
               userName="TA.TestEmail" 
               password="lpstatest" 
               enableSsl="true"/>
    </smtp>
  </mailSettings>
</system.net>
```

**Finding**: Gmail SMTP used for testing. Production should use internal SMTP relay.

**Security Risk**: Plain-text password in config file.

---

## 8. Key Architecture Patterns

### 8.1 Multi-Tier Architecture

```
Presentation Tier:
  PACS.NET.exe (WinForms Client)
  PACS.ADMIN.exe (Admin Client)
  PACS.QUERY.exe (Query Tool)
    ↓ [WCF WSHttpBinding]
Service Tier:
  TrueAutomation.Services.Host.exe
    - PACSService.WCF
    - TaskService.WCF
    - SecurityService.WCF
    - WorkflowService.WCF
    - ServiceBus.WCF
    - DocumentManagement.WCF
    ↓ [Repository Pattern]
Data Access Tier:
  NHibernate ORM
    - *.DAL.NHibernate assemblies
    - Session factories per service
    - Lazy loading with Castle.DynamicProxy
    ↓ [ADO.NET / SQL Server Provider]
Database Tier:
  SQL Server 2022
    - pacs_oltp (production)
    - PACS_Training (training)
    - CIAPS (building permits)
    - TA_AppSvr (tax assessor)
    - workflow_persistence (workflow state)
    - Extended SPs (xp_RecalcProperty90, xp_CalculateTaxable80)
```

### 8.2 Session Management Pattern

**NHibernate Session Lifecycle**: Session-per-request

**Expected Pattern:**
1. Client calls WCF service
2. WCF service opens NHibernate session
3. Business logic executes (lazy loading active)
4. Service returns response
5. Session closed, connections released

**Potential Issue**: Long-running WCF calls (45-minute timeout for PACSService) may hold database connections.

### 8.3 Transaction Management

**NHibernate Transaction Scope**: Likely session-level transactions

**WCF Transaction Flow**: `transactionFlow="false"` in all bindings - **no distributed transactions**.

**Implication**: Each service call is a separate transaction. Multi-service operations lack transactional consistency.

---

## 9. Performance Considerations

### 9.1 NHibernate Batch Size

**Setting**: `adonet.batch_size=500`

**Impact**: 
- **INSERT/UPDATE operations**: Batches 500 statements into single round-trip
- **Estimated savings**: 500 network round-trips reduced to 1
- **Use case**: Mass property value updates, batch assessments

### 9.2 WCF Message Size Limits

**Configuration**: `maxReceivedMessageSize="2147483647"` (2GB)

**Implications:**
- Allows large datasets (entire property lists, bulk document uploads)
- **Risk**: Memory exhaustion on server if multiple clients request large datasets simultaneously
- **Recommendation**: Implement paging for large result sets

### 9.3 Connection Pooling

**ADO.NET Connection String**: `Integrated Security=SSPI;`

**Default Pooling Settings** (ADO.NET defaults):
- Min Pool Size: 0
- Max Pool Size: 100
- Connection Timeout: 15 seconds

**Finding**: No custom pooling configuration - using defaults.

---

## 10. Security Architecture

### 10.1 Authentication Flow

```
1. User launches PACS.NET.exe
2. Windows credentials passed to WCF service (Kerberos/NTLM)
3. WCF SecurityService validates user via Windows Authentication
4. Service impersonates user for SQL Server connection (Integrated Security)
5. Database permissions enforced via SQL Server roles
```

**Key Components:**
- **Client Credentials**: Windows Authentication (domain account)
- **Service Credentials**: Windows Authentication (service account)
- **Database Credentials**: Integrated Security (impersonation or app pool identity)

### 10.2 Authorization

**Role-Based Access Control** (likely implemented):
- `User_Role` entity in domain model
- `SecurityService` handles authorization checks
- Database-level permissions via SQL Server roles

### 10.3 Encryption

**In-Transit Encryption**: WS-Security Message encryption (not SSL/TLS)

**At-Rest Encryption**: TDE (Transparent Data Encryption) on SQL Server (per TECH_STACK.md)

---

## 11. Critical Gaps & Unknowns

### 11.1 Extended Stored Procedure DLL Location

**Status**: ❌ **NOT FOUND**

**Impact**: Cannot analyze core valuation logic without DLL or source code.

**Next Steps:**
1. Check production SQL Server Binn directory
2. Request C++ source code from vendor (TrueAutomation)
3. Use SQL Server Profiler to trace extended SP execution

### 11.2 Entity Mapping Details

**Status**: ⚠️ **PARTIALLY DOCUMENTED**

**Finding**: Mapping files embedded in DLL resources - cannot inspect without decompiling.

**Next Steps:**
1. Use ILSpy/dotPeek to decompile `TrueAutomation.PACSService.DAL.NHibernate.dll`
2. Extract embedded `.hbm.xml` resources
3. Document entity relationships and lazy loading configuration

### 11.3 Service Implementation Code

**Status**: ⚠️ **ASSEMBLIES ONLY**

**Finding**: Only compiled DLLs available - no source code in repository.

**Impact**: Cannot trace business logic or optimize service methods.

**Next Steps:**
1. Decompile service assemblies for critical methods
2. Request source code access from vendor
3. Document via reverse engineering

---

## 12. Recommendations

### 12.1 Immediate Actions (High Priority)

1. **Locate Extended SP DLL**
   - Check `C:\Program Files\Microsoft SQL Server\MSSQL*.MSSQLSERVER\MSSQL\Binn\XSP_PACS.dll`
   - Document extended SP parameters and return values
   - Consider migrating to CLR stored procedures (.NET)

2. **Enable WCF Tracing** (temporarily for diagnostics)
   ```xml
   <system.diagnostics>
     <sources>
       <source name="System.ServiceModel" switchValue="Information, ActivityTracing">
         <listeners><add name="xml" /></listeners>
       </source>
     </sources>
     <sharedListeners>
       <add name="xml" type="System.Diagnostics.XmlWriterTraceListener"
            initializeData="C:\logs\WCFTrace.svclog" />
     </sharedListeners>
   </system.diagnostics>
   ```

3. **Profile N+1 Queries**
   - Enable `show_sql=true` in NHibernate config (dev only)
   - Identify frequently called methods with lazy loading issues
   - Add eager loading (`Fetch()`) to critical queries

### 12.2 Short-Term Improvements (1-3 Months)

1. **Implement Service-Level Monitoring**
   - Add performance counters for WCF services
   - Track average response time per operation
   - Alert on long-running calls (>5 minutes)

2. **Optimize NHibernate Queries**
   - Review generated SQL for inefficiencies
   - Add indexes for frequently queried navigation properties
   - Consider second-level caching for reference data

3. **Security Hardening**
   - Move SMTP password to encrypted config section
   - Implement SSL/TLS for WCF transport security
   - Audit database permissions (principle of least privilege)

### 12.3 Long-Term Strategic Initiatives (6-12 Months)

1. **Migrate from Extended SPs to CLR**
   - Rewrite `xp_RecalcProperty90` in C# as CLR stored procedure
   - Benefit: Debuggable, maintainable, version-controlled

2. **Modernize Service Architecture**
   - Migrate WCF services to ASP.NET Core gRPC
   - Implement API gateway for client access
   - Add service mesh for observability

3. **Refactor NHibernate to EF Core**
   - Migrate entity mappings to EF Core code-first
   - Implement explicit loading to eliminate N+1 queries
   - Benefit: Modern ORM with better performance and tooling

---

## 13. Server Configuration Checklist

### 13.1 IIS Configuration (for WCF services)

- [ ] Application pool identity: Network Service or custom service account?
- [ ] Application pool settings: Memory limits, recycling schedule?
- [ ] IIS authentication: Windows Authentication enabled?
- [ ] HTTP.sys settings: Request queue limits?

### 13.2 SQL Server Configuration

- [ ] Max server memory setting
- [ ] TempDB configuration (1 file per core?)
- [ ] MAXDOP setting
- [ ] Cost threshold for parallelism
- [ ] Query Store enabled?
- [ ] Always On AG configuration (if applicable)

### 13.3 Windows Server Configuration

- [ ] Service accounts: What accounts run what services?
- [ ] Kerberos SPN configuration (for delegation)
- [ ] Firewall rules: Ports 8732 (WCF), 22022 (message bus), 1433 (SQL)
- [ ] Network load balancing (if multi-server)

---

## 14. Next Investigation Steps

### Phase 2: SQL Server Deep Dive (See SERVER_DEEP_DIVE_PLAN.md)

**Immediate SQL Queries to Run:**

```sql
-- Instance configuration
SELECT * FROM sys.configurations ORDER BY name;

-- Wait statistics
SELECT TOP 10 wait_type, wait_time_ms, waiting_tasks_count
FROM sys.dm_os_wait_stats
WHERE wait_type NOT IN ('CLR_SEMAPHORE', 'LAZYWRITER_SLEEP', 'SLEEP_TASK')
ORDER BY wait_time_ms DESC;

-- Top expensive queries
SELECT TOP 20 
    qs.execution_count,
    qs.total_elapsed_time / 1000000.0 AS total_elapsed_time_s,
    SUBSTRING(st.text, (qs.statement_start_offset/2)+1, 100) AS statement_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
ORDER BY qs.total_elapsed_time DESC;

-- Always On AG status (if configured)
SELECT ag.name, ar.replica_server_name, ars.role_desc, ars.synchronization_health_desc
FROM sys.availability_groups ag
JOIN sys.availability_replicas ar ON ag.group_id = ar.group_id
JOIN sys.dm_hadr_availability_replica_states ars ON ar.replica_id = ars.replica_id;
```

---

## 15. Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-03 | Initial investigation findings - WCF services, NHibernate config, extended SPs | TrueAutomation PACS Elite Engineering Team |

---

**Investigation Status**: ✅ Phase 1 Complete (Service Architecture)  
**Next Phase**: SQL Server Configuration & Performance Baseline (Phase 2)  
**Confidence Level**: High (based on configuration files and assembly inspection)  
**Unknowns**: Extended SP DLL location, entity mapping details, service implementation source code

---

*End of Server Architecture Findings Document*
