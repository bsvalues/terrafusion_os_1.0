# PACS Server Deep Dive Investigation Plan

## Executive Summary

This document outlines a structured investigation plan to understand the **complete server architecture** beyond the database schema and business logic. Focus areas: service layer, infrastructure, performance, security, and operations.

**Target Audience**: Senior developers, architects, DevOps engineers  
**Timeline**: 4-6 weeks for comprehensive understanding  
**Prerequisites**: Complete PACS_DEEP_DIVE.md and TECH_STACK.md

---

## Phase 1: Service Layer Architecture (Week 1-2)

### Objectives
- Map all WCF service endpoints to implementation classes
- Understand NHibernate session management
- Document transaction boundaries
- Identify performance bottlenecks in service calls

### Investigation Tasks

#### Task 1.1: WCF Service Discovery
```powershell
# Find all service contract interfaces
cd Database/PACSDrop
grep_search -query "interface I.*Service" -isRegexp true

# Find service implementations
grep_search -query "class.*Service.*:.*I.*Service" -isRegexp true

# Analyze service configuration
read_file "PACS.NET.exe.config" | Select-String -Pattern "endpoint|binding"
```

**Expected Deliverables:**
- [ ] Service contract interface inventory (6 services documented)
- [ ] Implementation class mapping
- [ ] Binding configuration analysis (WSHttpBinding settings)
- [ ] Authentication/authorization flow diagram

#### Task 1.2: NHibernate Configuration Analysis
```powershell
# Find NHibernate configuration
grep_search -query "hibernate.cfg.xml|SessionFactory|ISession" -isRegexp true

# Find entity mappings
file_search -query "**/*.hbm.xml"
file_search -query "**/Mappings/**/*.cs"

# Find entity classes
grep_search -query "public class.*\s*{\s*public virtual.*Id" -isRegexp true
```

**Expected Deliverables:**
- [ ] Entity class inventory (50+ entities expected)
- [ ] Mapping strategy documentation (Fluent vs XML)
- [ ] Lazy loading configuration analysis
- [ ] Second-level cache implementation details

#### Task 1.3: Service Performance Profiling
**Tools Needed:**
- WCF Service Trace Viewer
- PerfView or dotTrace profiler
- SQL Server Profiler

**Investigation Steps:**
1. Enable WCF tracing in App.config:
```xml
<system.diagnostics>
  <sources>
    <source name="System.ServiceModel" switchValue="Information, ActivityTracing">
      <listeners>
        <add name="traceListener" />
      </listeners>
    </source>
  </sources>
  <sharedListeners>
    <add name="traceListener" type="System.Diagnostics.XmlWriterTraceListener" 
         initializeData="C:\logs\WCFTrace.svclog" />
  </sharedListeners>
</system.diagnostics>
```

2. Profile typical operations:
   - Property search (GetPropertiesByGeoId)
   - Property detail load (GetProperty)
   - Value recalculation (RecalculateProperty)
   - Payment processing (ProcessPayment)

**Expected Deliverables:**
- [ ] Service call duration metrics (baseline)
- [ ] N+1 query identification
- [ ] Memory usage patterns
- [ ] Network payload size analysis

---

## Phase 2: Database Server Configuration (Week 2-3)

### Objectives
- Document SQL Server instance configuration
- Understand Always On AG topology
- Analyze performance tuning settings
- Map security configuration

### Investigation Tasks

#### Task 2.1: SQL Server Instance Analysis
```sql
-- Instance configuration
SELECT * FROM sys.configurations ORDER BY name;

-- Database settings
SELECT db.name, db.recovery_model_desc, db.page_verify_option_desc,
       db.is_auto_create_stats_on, db.is_auto_update_stats_on,
       db.is_query_store_on, db.compatibility_level
FROM sys.databases db
WHERE db.name IN ('pacs_oltp', 'PACS_Training', 'CIAPS', 'TA_AppSvr', 'Web_Internet_Benton');

-- Memory configuration
SELECT (physical_memory_kb / 1024) AS physical_memory_mb,
       (virtual_memory_kb / 1024) AS virtual_memory_mb,
       (committed_kb / 1024) AS committed_mb,
       (committed_target_kb / 1024) AS committed_target_mb
FROM sys.dm_os_sys_info;

-- TempDB configuration
SELECT name, physical_name, size * 8 / 1024 AS size_mb, growth
FROM sys.master_files
WHERE database_id = DB_ID('tempdb');
```

**Expected Deliverables:**
- [ ] Max server memory setting (recommended vs actual)
- [ ] TempDB file configuration (1 file per core?)
- [ ] MAXDOP setting
- [ ] Cost threshold for parallelism
- [ ] Recovery model per database
- [ ] Query Store configuration

#### Task 2.2: Always On Availability Groups Deep Dive
```sql
-- AG configuration
SELECT ag.name AS ag_name,
       ar.replica_server_name,
       ar.availability_mode_desc,
       ar.failover_mode_desc,
       ar.primary_role_allow_connections_desc,
       ar.secondary_role_allow_connections_desc,
       ars.role_desc,
       ars.operational_state_desc,
       ars.connected_state_desc,
       ars.synchronization_health_desc
FROM sys.availability_groups ag
JOIN sys.availability_replicas ar ON ag.group_id = ar.group_id
JOIN sys.dm_hadr_availability_replica_states ars ON ar.replica_id = ars.replica_id;

-- Database replicas
SELECT db.name, drs.synchronization_state_desc, drs.synchronization_health_desc
FROM sys.dm_hadr_database_replica_states drs
JOIN sys.databases db ON drs.database_id = db.database_id;

-- AG listener
SELECT * FROM sys.availability_group_listeners;
SELECT * FROM sys.availability_group_listener_ip_addresses;
```

**Expected Deliverables:**
- [ ] Primary/secondary replica identification
- [ ] Synchronous vs asynchronous replication mode
- [ ] Automatic failover configuration
- [ ] Read-only routing configuration
- [ ] AG listener connection string format
- [ ] Backup strategy (which replica?)

#### Task 2.3: Performance Baseline Analysis
```sql
-- Wait statistics (top 10)
SELECT TOP 10 wait_type, 
       wait_time_ms / 1000.0 AS wait_time_s,
       (wait_time_ms * 100.0) / SUM(wait_time_ms) OVER() AS pct,
       waiting_tasks_count
FROM sys.dm_os_wait_stats
WHERE wait_type NOT IN (
    'CLR_SEMAPHORE', 'LAZYWRITER_SLEEP', 'RESOURCE_QUEUE', 'SLEEP_TASK',
    'SLEEP_SYSTEMTASK', 'SQLTRACE_BUFFER_FLUSH', 'WAITFOR', 'LOGMGR_QUEUE',
    'CHECKPOINT_QUEUE', 'REQUEST_FOR_DEADLOCK_SEARCH', 'XE_TIMER_EVENT', 'BROKER_TO_FLUSH',
    'BROKER_TASK_STOP', 'CLR_MANUAL_EVENT', 'CLR_AUTO_EVENT', 'DISPATCHER_QUEUE_SEMAPHORE',
    'FT_IFTS_SCHEDULER_IDLE_WAIT', 'XE_DISPATCHER_WAIT', 'XE_DISPATCHER_JOIN', 'SQLTRACE_INCREMENTAL_FLUSH_SLEEP'
)
ORDER BY wait_time_ms DESC;

-- Top 20 most expensive queries
SELECT TOP 20 
    qs.execution_count,
    qs.total_elapsed_time / 1000000.0 AS total_elapsed_time_s,
    qs.total_elapsed_time / qs.execution_count / 1000.0 AS avg_elapsed_time_ms,
    qs.total_logical_reads,
    qs.total_logical_reads / qs.execution_count AS avg_logical_reads,
    SUBSTRING(st.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(st.text)
            ELSE qs.statement_end_offset
        END - qs.statement_start_offset)/2) + 1) AS statement_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
ORDER BY qs.total_elapsed_time DESC;

-- Missing indexes
SELECT 
    migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans) AS improvement_measure,
    DB_NAME(mid.database_id) AS database_name,
    OBJECT_NAME(mid.object_id, mid.database_id) AS table_name,
    mid.equality_columns,
    mid.inequality_columns,
    mid.included_columns,
    migs.user_seeks,
    migs.user_scans,
    migs.last_user_seek,
    migs.avg_total_user_cost,
    migs.avg_user_impact
FROM sys.dm_db_missing_index_groups mig
JOIN sys.dm_db_missing_index_group_stats migs ON mig.index_group_handle = migs.group_handle
JOIN sys.dm_db_missing_index_details mid ON mig.index_handle = mid.index_handle
WHERE migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans) > 10000
ORDER BY improvement_measure DESC;

-- Index fragmentation
SELECT 
    OBJECT_NAME(ps.object_id) AS table_name,
    i.name AS index_name,
    ps.index_type_desc,
    ps.avg_fragmentation_in_percent,
    ps.page_count
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'SAMPLED') ps
JOIN sys.indexes i ON ps.object_id = i.object_id AND ps.index_id = i.index_id
WHERE ps.avg_fragmentation_in_percent > 30 AND ps.page_count > 1000
ORDER BY ps.avg_fragmentation_in_percent DESC;
```

**Expected Deliverables:**
- [ ] Top 5 wait types and remediation strategies
- [ ] Top 20 slowest queries with optimization recommendations
- [ ] Missing index recommendations (prioritized)
- [ ] Fragmented indexes requiring rebuild
- [ ] Baseline performance metrics document

---

## Phase 3: Infrastructure & Operations (Week 3-4)

### Objectives
- Map physical/virtual server topology
- Document backup/restore procedures
- Understand monitoring and alerting
- Analyze disaster recovery capabilities

### Investigation Tasks

#### Task 3.1: Server Infrastructure Mapping
```powershell
# Gather Windows Server information
Get-ComputerInfo | Select-Object CsName, WindowsProductName, WindowsVersion, 
    OsArchitecture, CsNumberOfProcessors, CsNumberOfLogicalProcessors, 
    CsTotalPhysicalMemory, CsDomain

# IIS configuration
Get-WebSite
Get-WebApplication
Get-IISAppPool | Select-Object Name, State, ManagedRuntimeVersion, 
    ManagedPipelineMode, StartMode

# Network configuration
Get-NetIPAddress | Where-Object {$_.AddressFamily -eq 'IPv4'}
Get-NetRoute | Where-Object {$_.DestinationPrefix -eq '0.0.0.0/0'}
```

**Expected Deliverables:**
- [ ] Server inventory (hostname, IP, role, specs)
- [ ] Network topology diagram
- [ ] IIS application pool configuration
- [ ] Windows services inventory (PACS-related)

#### Task 3.2: Backup & Recovery Documentation
```sql
-- Backup history
SELECT 
    bs.database_name,
    bs.type,
    bs.backup_start_date,
    bs.backup_finish_date,
    DATEDIFF(SECOND, bs.backup_start_date, bs.backup_finish_date) AS duration_seconds,
    bs.backup_size / 1024 / 1024 AS backup_size_mb,
    bs.compressed_backup_size / 1024 / 1024 AS compressed_size_mb,
    bmf.physical_device_name
FROM msdb.dbo.backupset bs
JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
WHERE bs.database_name IN ('pacs_oltp', 'PACS_Training', 'CIAPS')
    AND bs.backup_start_date > DATEADD(DAY, -7, GETDATE())
ORDER BY bs.backup_start_date DESC;

-- SQL Agent jobs (backup jobs)
SELECT j.name, j.enabled, js.next_run_date, js.next_run_time
FROM msdb.dbo.sysjobs j
JOIN msdb.dbo.sysjobschedules js ON j.job_id = js.job_id
WHERE j.name LIKE '%backup%'
ORDER BY j.name;
```

**Investigation Steps:**
1. Document backup schedule:
   - Full backups: Frequency? Day of week?
   - Differential backups: Frequency?
   - Transaction log backups: Frequency? (Every 15 min per RPD)
   
2. Document backup retention:
   - How long are backups kept?
   - Where are backups stored? (Local? Network share? Azure Blob?)
   
3. Test restore procedure:
   - Time to restore pacs_oltp to test environment
   - Verify CHECKDB after restore

**Expected Deliverables:**
- [ ] Backup schedule documentation
- [ ] Backup storage location and capacity
- [ ] Restore procedure runbook
- [ ] Last successful restore test date
- [ ] RTO/RPO actual vs target

#### Task 3.3: Monitoring & Alerting Configuration
```sql
-- SQL Server alerts
SELECT name, enabled, delay_between_responses, event_id, severity
FROM msdb.dbo.sysalerts
ORDER BY severity DESC;

-- SQL Agent operators
SELECT name, email_address, enabled
FROM msdb.dbo.sysoperators;

-- Database mail configuration
SELECT * FROM msdb.dbo.sysmail_profile;
SELECT * FROM msdb.dbo.sysmail_account;
```

**Investigation Steps:**
1. Review monitoring tools:
   - SQL Server Agent alerts configured?
   - Third-party monitoring (SolarWinds, SCOM, Datadog)?
   - Application performance monitoring (APM)?
   
2. Document alert thresholds:
   - Disk space warnings
   - Failed backup alerts
   - Long-running query alerts
   - AG replica synchronization alerts
   - Application error rate thresholds

**Expected Deliverables:**
- [ ] Monitoring tool inventory
- [ ] Alert configuration documentation
- [ ] Escalation procedure (who gets notified?)
- [ ] Alert fatigue assessment (false positive rate)

---

## Phase 4: Security & Compliance (Week 4-5)

### Objectives
- Document authentication flow end-to-end
- Audit permissions and role memberships
- Verify PCI-DSS compliance for payment processing
- Review encryption configuration

### Investigation Tasks

#### Task 4.1: Authentication & Authorization Analysis
```sql
-- Server-level principals
SELECT sp.name, sp.type_desc, sp.is_disabled, sp.create_date, sp.modify_date
FROM sys.server_principals sp
WHERE sp.type IN ('S', 'U', 'G')
ORDER BY sp.name;

-- Database-level principals (pacs_oltp)
USE pacs_oltp;
SELECT dp.name, dp.type_desc, dp.create_date, dp.authentication_type_desc
FROM sys.database_principals dp
WHERE dp.type IN ('S', 'U', 'G')
ORDER BY dp.name;

-- Role memberships
SELECT 
    role.name AS role_name,
    member.name AS member_name,
    member.type_desc AS member_type
FROM sys.database_role_members drm
JOIN sys.database_principals role ON drm.role_principal_id = role.principal_id
JOIN sys.database_principals member ON drm.member_principal_id = member.principal_id
ORDER BY role.name, member.name;

-- Object-level permissions
SELECT 
    OBJECT_NAME(major_id) AS object_name,
    USER_NAME(grantee_principal_id) AS grantee,
    permission_name,
    state_desc
FROM sys.database_permissions
WHERE major_id > 0 AND class_desc = 'OBJECT_OR_COLUMN'
ORDER BY OBJECT_NAME(major_id), USER_NAME(grantee_principal_id);
```

**Investigation Steps:**
1. Map service accounts:
   - What account runs IIS application pool?
   - What account runs SQL Server service?
   - What account runs SQL Server Agent?
   - What account runs PACS.NET.exe client?

2. Document authentication flow:
   - Client → WCF: Windows Authentication (Kerberos?)
   - WCF → SQL Server: Integrated security or SQL auth?
   - Is impersonation/delegation configured?

3. Review least privilege:
   - Are service accounts db_owner? (Should be db_datareader/db_datawriter)
   - Are application users granted EXECUTE on specific SPs only?

**Expected Deliverables:**
- [ ] Service account inventory with permissions
- [ ] Authentication flow diagram (Kerberos SPN configuration?)
- [ ] Permission audit report
- [ ] Recommendations for least privilege improvements

#### Task 4.2: Encryption Configuration
```sql
-- TDE status
SELECT db.name, dek.encryption_state_desc, dek.percent_complete, dek.encryptor_type
FROM sys.dm_database_encryption_keys dek
JOIN sys.databases db ON dek.database_id = db.database_id;

-- SSL/TLS configuration
SELECT encrypt_option FROM sys.dm_exec_connections WHERE session_id = @@SPID;

-- Always Encrypted columns (if any)
SELECT 
    t.name AS table_name,
    c.name AS column_name,
    c.encryption_type_desc
FROM sys.columns c
JOIN sys.tables t ON c.object_id = t.object_id
WHERE c.encryption_type IS NOT NULL;
```

**Investigation Steps:**
1. Verify TDE:
   - Certificate backup location?
   - Key rotation schedule?

2. Check connection encryption:
   - Force Encryption enabled on SQL Server?
   - Client connection strings use Encrypt=True?

3. PCI-DSS compliance (payment data):
   - Are credit card numbers stored? (Should NOT be)
   - Payment tokens stored instead?
   - Access logging for payment data?

**Expected Deliverables:**
- [ ] TDE configuration documentation
- [ ] Certificate backup procedure
- [ ] Connection encryption verification
- [ ] PCI-DSS compliance checklist

---

## Phase 5: Advanced Topics (Week 5-6)

### Objectives
- Understand extended stored procedure implementation
- Document SSIS package orchestration
- Analyze performance tuning opportunities
- Create operational runbooks

### Investigation Tasks

#### Task 5.1: Extended Stored Procedure Analysis
```sql
-- List extended SPs
SELECT name, type_desc FROM sys.objects 
WHERE type = 'X' AND name LIKE 'xp_%Property%';

-- Check DLL location
EXEC sp_helpextendedproc 'xp_RecalcProperty90';
EXEC sp_helpextendedproc 'xp_CalculateTaxable80';
```

**Investigation Steps:**
1. Locate DLL files:
   ```powershell
   # Search for extended SP DLLs
   Get-ChildItem -Path "C:\Program Files\Microsoft SQL Server\" -Recurse -Filter "*.dll" |
       Where-Object {$_.Name -like "*Recalc*" -or $_.Name -like "*Taxable*"}
   ```

2. Reverse engineer functionality:
   - Use ILSpy or dotPeek if .NET assembly
   - Use Dependency Walker if native C++ DLL
   - Document input parameters and return values

3. Performance profile:
   - How long does xp_RecalcProperty90 take for average property?
   - CPU vs memory bound?
   - Can it be rewritten in T-SQL?

**Expected Deliverables:**
- [ ] Extended SP DLL inventory
- [ ] Functionality documentation (what calculations?)
- [ ] Performance characteristics
- [ ] Migration strategy (to T-SQL or CLR?)

#### Task 5.2: SSIS Package Orchestration
```powershell
# Find SSIS packages
Get-ChildItem -Path "C:\SSIS\*" -Include "*.dtsx" -Recurse

# Query SSISDB catalog
```

```sql
USE SSISDB;

-- List packages
SELECT f.name AS folder_name, p.name AS project_name, pk.name AS package_name
FROM catalog.packages pk
JOIN catalog.projects p ON pk.project_id = p.project_id
JOIN catalog.folders f ON p.folder_id = f.folder_id;

-- Execution history
SELECT 
    e.execution_id,
    e.folder_name,
    e.project_name,
    e.package_name,
    e.start_time,
    e.end_time,
    DATEDIFF(SECOND, e.start_time, e.end_time) AS duration_seconds,
    e.status,
    e.executed_as_name
FROM catalog.executions e
ORDER BY e.start_time DESC;

-- SQL Agent jobs running SSIS
SELECT j.name, s.step_name, s.command
FROM msdb.dbo.sysjobs j
JOIN msdb.dbo.sysjobsteps s ON j.job_id = s.job_id
WHERE s.command LIKE '%dtexec%' OR s.command LIKE '%SSISDB%'
ORDER BY j.name;
```

**Expected Deliverables:**
- [ ] SSIS package inventory with descriptions
- [ ] Execution schedule (daily? weekly?)
- [ ] Data flow diagrams for each package
- [ ] Error handling and retry logic documentation
- [ ] Performance metrics (average execution time)

#### Task 5.3: Operational Runbooks
Create standardized procedures for common operations:

**Runbook 1: Database Failover Procedure**
```markdown
1. Verify secondary replica is synchronized
2. Notify users of planned downtime window
3. Execute failover: ALTER AVAILABILITY GROUP [AGName] FAILOVER;
4. Verify new primary role
5. Test application connectivity
6. Monitor for issues
```

**Runbook 2: Index Maintenance**
```sql
-- Rebuild fragmented indexes (Sunday 2 AM)
EXEC sp_MSforeachtable 'ALTER INDEX ALL ON ? REBUILD WITH (ONLINE = ON)';

-- Update statistics (Daily 1 AM)
EXEC sp_MSforeachtable 'UPDATE STATISTICS ? WITH FULLSCAN';
```

**Runbook 3: Property Recalculation Error Resolution**
```markdown
1. Query prop_recalc_errors table
2. Identify error pattern (zero area? missing data?)
3. Fix root cause in imprv_detail or land_detail
4. Clear error: DELETE FROM prop_recalc_errors WHERE prop_id = ?
5. Re-run: EXEC RecalcProperty @prop_id = ?, @year = 2024, @sup_num = 0
6. Verify recalculation succeeded
```

**Expected Deliverables:**
- [ ] 10+ operational runbooks covering common scenarios
- [ ] Disaster recovery runbook (complete restore procedure)
- [ ] Security incident response procedure
- [ ] Escalation contacts and communication plan

---

## Phase 6: Performance Optimization (Week 6)

### Investigation Tasks

#### Task 6.1: Query Optimization Review
Review all stored procedures for optimization opportunities:

```sql
-- Find SPs without execution plans
SELECT OBJECT_NAME(qt.objectid) AS sp_name, 
       qs.execution_count,
       qs.total_elapsed_time / 1000000.0 AS total_elapsed_time_s
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
WHERE qt.objectid IS NOT NULL
ORDER BY qs.total_elapsed_time DESC;
```

**Optimization Checklist:**
- [ ] Remove unnecessary cursors (replace with set-based operations)
- [ ] Add WITH (NOLOCK) hints where appropriate
- [ ] Eliminate SELECT * (specify columns)
- [ ] Use OPTION (RECOMPILE) for parameter sniffing issues
- [ ] Add missing indexes identified in Phase 2
- [ ] Update statistics on heavily queried tables

#### Task 6.2: Application Performance Tuning
Review client application for optimization:

**N+1 Query Detection:**
```csharp
// BAD: N+1 queries
foreach (var property in properties)
{
    var owner = session.Get<Owner>(property.OwnerId); // Separate query per property!
}

// GOOD: Eager loading
var properties = session.Query<Property>()
    .Fetch(p => p.Owner) // Single query with JOIN
    .ToList();
```

**Lazy Loading Review:**
- Identify tabs/sections that trigger lazy loads
- Pre-fetch data for commonly accessed tabs
- Disable lazy loading for small reference tables

**Expected Deliverables:**
- [ ] Top 10 query optimization recommendations
- [ ] Application performance improvement plan
- [ ] Before/after performance metrics

---

## Deliverables Summary

### Week 1-2: Service Layer
- Service contract documentation
- NHibernate entity mapping inventory
- Service performance baseline

### Week 3: Database Configuration
- SQL Server configuration documentation
- Always On AG topology diagram
- Performance baseline metrics

### Week 4: Infrastructure
- Server infrastructure map
- Backup/restore procedures
- Monitoring configuration

### Week 5: Security
- Authentication flow diagram
- Permission audit report
- Encryption configuration

### Week 6: Advanced Topics
- Extended SP documentation
- SSIS orchestration guide
- Operational runbooks (10+)
- Performance optimization plan

---

## Success Criteria

✅ **Complete Understanding Achieved When:**
1. Can explain data flow from client click → database → back to UI
2. Can perform AG failover without assistance
3. Can troubleshoot slow performance using DMVs
4. Can restore pacs_oltp database in under 2 hours
5. Can explain security architecture to auditor
6. Can onboard new developer in 1 week using documentation
7. Can identify root cause of 90% of production issues within 30 minutes

---

## Tools & Resources Needed

**Software:**
- SQL Server Management Studio 19+
- Visual Studio 2022 (for C# debugging)
- WCF Service Trace Viewer
- PerfView or dotTrace profiler
- ILSpy or dotPeek (for .NET decompilation)
- Dependency Walker (for native DLL analysis)
- Wireshark (for network traffic analysis)

**Access Required:**
- Production server RDP access (read-only)
- SQL Server sysadmin role (test environment)
- IIS Manager access
- SQL Server Agent job definitions
- Network topology diagrams

**Time Commitment:**
- 10-15 hours per week for 6 weeks
- 60-90 hours total investigation time

---

**Document Version**: 1.0  
**Last Updated**: November 3, 2025  
**Owner**: TrueAutomation PACS Elite Engineering Team
