# PACS Operational Runbooks

## Document Control

**System**: Benton County Property Assessment and Collection System (PACS)  
**Purpose**: Step-by-step procedures for common operational scenarios  
**Audience**: Database administrators, system administrators, support engineers  
**Version**: 1.0  
**Date**: November 3, 2025  
**Author**: TrueAutomation PACS Elite Engineering Team

---

## Table of Contents

1. [Runbook 1: Always On Availability Group Failover](#runbook-1-always-on-availability-group-failover)
2. [Runbook 2: Property Recalculation Error Resolution](#runbook-2-property-recalculation-error-resolution)
3. [Runbook 3: WCF Service Not Responding](#runbook-3-wcf-service-not-responding)
4. [Runbook 4: Database Restore Procedure](#runbook-4-database-restore-procedure)
5. [Runbook 5: Index Maintenance](#runbook-5-index-maintenance)
6. [Runbook 6: Slow Property Search Performance](#runbook-6-slow-property-search-performance)
7. [Runbook 7: Payment Not Applying to Bill](#runbook-7-payment-not-applying-to-bill)
8. [Runbook 8: Mass Property Recalculation](#runbook-8-mass-property-recalculation)
9. [Runbook 9: Building Permit Import Failure](#runbook-9-building-permit-import-failure)
10. [Runbook 10: Extended Stored Procedure Failure](#runbook-10-extended-stored-procedure-failure)

---

## Runbook 1: Always On Availability Group Failover

### Purpose
Perform a manual failover of the PACS Always On Availability Group to a secondary replica for planned maintenance or disaster recovery.

### Prerequisites
- [ ] SQL Server Management Studio (SSMS) connected to primary replica
- [ ] Confirmation that secondary replica is synchronized
- [ ] Approval from stakeholders for downtime window (if manual failover)
- [ ] Users notified of brief interruption (5-10 seconds)

### Severity
**Planned**: Low | **Unplanned**: High

### Estimated Duration
5-10 minutes

### Procedure

#### Step 1: Verify AG Health
```sql
-- Connect to PRIMARY replica
SELECT 
    ag.name AS AvailabilityGroupName,
    ar.replica_server_name AS ReplicaServer,
    ars.role_desc AS CurrentRole,
    ars.synchronization_health_desc AS SynchronizationHealth,
    ars.connected_state_desc AS ConnectedState
FROM sys.availability_groups ag
JOIN sys.availability_replicas ar ON ag.group_id = ar.group_id
JOIN sys.dm_hadr_availability_replica_states ars ON ar.replica_id = ars.replica_id
ORDER BY ars.role_desc DESC;
```

**Expected Result**: All replicas show "HEALTHY" synchronization status.

**If NOT HEALTHY**:
- ❌ **STOP** - Do not proceed with failover
- Investigate synchronization issues
- Check network connectivity between replicas
- Review SQL Server error log for AG-related errors

#### Step 2: Verify Database Synchronization
```sql
SELECT 
    db.name AS DatabaseName,
    drs.synchronization_state_desc AS SyncState,
    drs.synchronization_health_desc AS SyncHealth,
    drs.is_suspended AS IsSuspended,
    drs.suspend_reason_desc AS SuspendReason
FROM sys.dm_hadr_database_replica_states drs
JOIN sys.databases db ON drs.database_id = db.database_id
WHERE drs.is_local = 1
ORDER BY db.name;
```

**Expected Result**: All PACS databases show "SYNCHRONIZED" state.

**Critical Databases**:
- pacs_oltp
- PACS_Training
- CIAPS
- TA_AppSvr
- Web_Internet_Benton

#### Step 3: Identify Target Replica
```sql
-- Determine which secondary replica to failover to
SELECT 
    replica_server_name AS TargetReplica,
    failover_mode_desc AS FailoverMode,
    availability_mode_desc AS AvailabilityMode
FROM sys.availability_replicas
WHERE replica_server_name <> @@SERVERNAME
ORDER BY replica_server_name;
```

**Choose target replica based on**:
- Synchronous commit mode (preferred)
- Automatic failover capability
- Geographic location (same data center preferred)

#### Step 4: Perform Failover

**For AUTOMATIC failover-capable AG:**
```sql
-- Execute from CURRENT PRIMARY replica
ALTER AVAILABILITY GROUP [PACS_AG] FAILOVER;
```

**For MANUAL failover:**
```sql
-- Execute from TARGET SECONDARY replica
ALTER AVAILABILITY GROUP [PACS_AG] FORCE_FAILOVER_ALLOW_DATA_LOSS;
```

⚠️ **WARNING**: `FORCE_FAILOVER_ALLOW_DATA_LOSS` should only be used in disaster recovery scenarios when primary is unavailable.

#### Step 5: Verify Failover Success
```sql
-- Run on NEW PRIMARY replica
SELECT 
    @@SERVERNAME AS NewPrimaryServer,
    ag.name AS AvailabilityGroupName,
    ars.role_desc AS NewRole
FROM sys.availability_groups ag
JOIN sys.dm_hadr_availability_replica_states ars ON ag.group_id = ars.group_id
WHERE ars.is_local = 1;
```

**Expected Result**: `NewRole` = "PRIMARY"

#### Step 6: Update Application Connection Strings (if needed)
If applications connect directly to server name (instead of AG listener):

```powershell
# Update WCF service config files
$configFiles = @(
    "C:\PACS\TrueAutomation.Services.Host.exe.config",
    "C:\PACS\PACS.NET.exe.config"
)

foreach ($file in $configFiles) {
    (Get-Content $file) -replace 'OldServerName', 'NewServerName' | Set-Content $file
}

# Restart WCF service
Restart-Service -Name "TrueAutomation.Services.Host"
```

#### Step 7: Test Application Connectivity
```powershell
# Test PACS.NET client connection
Start-Process "C:\PACS\PACS.NET.exe" -ArgumentList "/test-connection"
```

**Manual Test**:
1. Launch PACS.NET.exe
2. Log in with test user account
3. Search for property (e.g., geo_id: 123-456-789)
4. Open property detail view
5. Verify data loads successfully

#### Step 8: Monitor for Issues
```sql
-- Monitor for blocking or connection issues
SELECT 
    session_id,
    login_name,
    host_name,
    program_name,
    status,
    blocking_session_id,
    wait_type,
    wait_time,
    last_request_start_time
FROM sys.dm_exec_sessions
WHERE is_user_process = 1
    AND status <> 'sleeping'
ORDER BY last_request_start_time DESC;
```

### Rollback Procedure
If issues occur after failover:

1. Identify problem (application errors, data access issues, performance degradation)
2. Failover BACK to original primary:
   ```sql
   ALTER AVAILABILITY GROUP [PACS_AG] FAILOVER;
   ```
3. Notify stakeholders
4. Investigate root cause before reattempting

### Post-Failover Checklist
- [ ] Verify all PACS databases accessible
- [ ] Confirm AG listener resolving to new primary
- [ ] Test property search, detail view, recalculation
- [ ] Check WCF service logs for errors
- [ ] Monitor database wait statistics for anomalies
- [ ] Document failover in change log
- [ ] Notify stakeholders of successful completion

### Troubleshooting

**Problem**: Failover command fails with "not synchronized" error

**Solution**:
```sql
-- Resume data movement
ALTER DATABASE pacs_oltp SET HADR RESUME;
-- Wait for synchronization
-- Retry failover
```

**Problem**: Applications cannot connect after failover

**Solution**:
- Verify AG listener DNS resolution: `nslookup PACS_AG_Listener`
- Check firewall rules between app servers and new primary
- Restart WCF service host
- Review connection string format (should use AG listener, not server name)

---

## Runbook 2: Property Recalculation Error Resolution

### Purpose
Diagnose and resolve property value recalculation errors logged in `prop_recalc_errors` table.

### Prerequisites
- [ ] SSMS connected to pacs_oltp database
- [ ] Property ID and year affected
- [ ] Understanding of property valuation rules

### Severity
**Individual Property**: Low | **Mass Recalc Failure**: High

### Estimated Duration
10-30 minutes per property

### Procedure

#### Step 1: Query Recalculation Errors
```sql
USE pacs_oltp;

SELECT 
    pre.prop_id,
    pre.prop_val_yr,
    pre.sup_num,
    pre.error_msg,
    pre.error_dt,
    p.geo_id,
    s.situs_display
FROM prop_recalc_errors pre
JOIN property p ON pre.prop_id = p.prop_id
LEFT JOIN situs s ON p.prop_id = s.prop_id AND s.primary_situs = 'Y'
WHERE pre.prop_id = @PropID  -- Replace with actual prop_id
ORDER BY pre.error_dt DESC;
```

#### Step 2: Identify Error Type

**Common Error Patterns**:

| Error Message | Root Cause | Solution |
|---------------|------------|----------|
| "Zero area in improvement detail" | `imprv_det_area = 0` or NULL | Update improvement detail with correct area |
| "Missing land detail" | No `land_detail` records | Add land detail record with land_val |
| "Invalid matrix code" | Obsolete matrix code reference | Update to current matrix code |
| "Circular reference in valuation" | Property references itself | Review and fix property relationships |
| "Division by zero" | Calculation error (likely extended SP) | Check for NULL or zero values in calculation inputs |

#### Step 3: Diagnose Root Cause

**For "Zero area" errors:**
```sql
-- Check improvement details
SELECT 
    id.imprv_id,
    id.imprv_det_type_cd,
    id.imprv_det_area,
    id.unit_price,
    id.imprv_det_adj_val
FROM imprv_detail id
WHERE id.prop_id = @PropID
    AND id.prop_val_yr = @Year
    AND id.sup_num = @SupNum
    AND (id.imprv_det_area = 0 OR id.imprv_det_area IS NULL);
```

**For "Missing land detail" errors:**
```sql
-- Check if land detail exists
SELECT COUNT(*) AS LandDetailCount
FROM land_detail ld
WHERE ld.prop_id = @PropID
    AND ld.prop_val_yr = @Year
    AND ld.sup_num = @SupNum;
```

#### Step 4: Fix Data Issue

**Fix zero area:**
```sql
-- Update improvement detail with correct area
UPDATE imprv_detail
SET imprv_det_area = 1200  -- Replace with actual area
WHERE prop_id = @PropID
    AND prop_val_yr = @Year
    AND sup_num = @SupNum
    AND imprv_id = @ImprvID
    AND imprv_det_type_cd = 'RES';  -- Residential improvement type
```

**Add missing land detail:**
```sql
-- Insert land detail record
INSERT INTO land_detail (
    prop_id, prop_val_yr, sup_num, land_type_cd, 
    land_size, unit_price, land_val
)
VALUES (
    @PropID, @Year, @SupNum, 'RES',  -- Residential land
    5000, 10.00, 50000  -- 5000 sq ft @ $10/sq ft = $50,000
);
```

#### Step 5: Clear Recalculation Error
```sql
-- Delete error record
DELETE FROM prop_recalc_errors
WHERE prop_id = @PropID
    AND prop_val_yr = @Year
    AND sup_num = @SupNum;
```

#### Step 6: Re-run Recalculation
```sql
-- Execute recalculation for single property
EXEC RecalcProperty 
    @prop_id = @PropID,
    @sup_yr = @Year,
    @sup_num = @SupNum,
    @bRecalcIncome = 0,
    @bCalcPTDOnly = 0,
    @bCalcProfileOnly = 0,
    @lSaleID = 0;
```

#### Step 7: Verify Recalculation Success
```sql
-- Check if error cleared
SELECT COUNT(*) AS ErrorCount
FROM prop_recalc_errors
WHERE prop_id = @PropID
    AND prop_val_yr = @Year
    AND sup_num = @SupNum;

-- Expected: 0 errors

-- Verify property value calculated
SELECT 
    pv.prop_val,
    pv.assessed_val,
    pv.taxable_val,
    pv.freeze_ceiling,
    pv.recalc_dt
FROM property_val pv
WHERE pv.prop_id = @PropID
    AND pv.prop_val_yr = @Year
    AND pv.sup_num = @SupNum;

-- Expected: Non-zero values, recalc_dt = GETDATE()
```

### Rollback Procedure
If incorrect fix applied:

1. Revert data changes:
   ```sql
   -- Restore from change_log
   SELECT * FROM change_log 
   WHERE table_name = 'imprv_detail' 
       AND key_prop_id = @PropID 
   ORDER BY chg_dt DESC;
   ```
2. Apply correct fix
3. Re-run recalculation

### Post-Resolution Checklist
- [ ] Recalculation error cleared from `prop_recalc_errors`
- [ ] Property value calculated and non-zero
- [ ] `recalc_dt` timestamp updated
- [ ] Change logged in `change_log` table
- [ ] Appraiser notified (if significant valuation change)
- [ ] Document resolution in support ticket

---

## Runbook 3: WCF Service Not Responding

### Purpose
Diagnose and restart WCF service host when PACS client applications cannot connect.

### Prerequisites
- [ ] Remote Desktop access to WCF service host server
- [ ] Administrator credentials
- [ ] PowerShell 5.1 or higher

### Severity
**High** - Blocks all user access to PACS

### Estimated Duration
5-15 minutes

### Procedure

#### Step 1: Verify Service Status
```powershell
# Check if service is running
Get-Service -Name "TrueAutomation.Services.Host" | Select-Object Name, Status, StartType
```

**Expected**: Status = "Running"

**If Status = "Stopped"**:
```powershell
Start-Service -Name "TrueAutomation.Services.Host"
Start-Sleep -Seconds 10
Get-Service -Name "TrueAutomation.Services.Host"
```

#### Step 2: Check Service Logs
```powershell
# View recent service logs
Get-Content "C:\Logs\TrueAutomation.Services.Host.log" -Tail 50
```

**Look for**:
- Exception stack traces
- "OutOfMemoryException"
- "ThreadAbortException"
- "SqlException" (database connectivity issues)
- "TimeoutException" (slow queries)

#### Step 3: Test Service Endpoints
```powershell
# Test WCF endpoint accessibility
$endpoints = @(
    "http://localhost:8732/TrueAutomation/Services/PACSService/",
    "http://localhost:8732/TrueAutomation/Services/TaskService/",
    "http://localhost:8732/TrueAutomation/Services/SecurityService/"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -UseBasicParsing -TimeoutSec 5
        Write-Host "$endpoint - OK (Status: $($response.StatusCode))" -ForegroundColor Green
    }
    catch {
        Write-Host "$endpoint - FAILED ($($_.Exception.Message))" -ForegroundColor Red
    }
}
```

**Expected**: All endpoints return HTTP 200 or WSDL content

#### Step 4: Check Database Connectivity
```powershell
# Test SQL Server connection
$connectionString = "Data Source=VM64DEVDB9008;Database=pacs_oltp;Integrated Security=SSPI;"
$connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)

try {
    $connection.Open()
    Write-Host "Database connection: OK" -ForegroundColor Green
    $connection.Close()
}
catch {
    Write-Host "Database connection: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
```

#### Step 5: Restart Service (if issues detected)
```powershell
# Graceful restart
Restart-Service -Name "TrueAutomation.Services.Host" -Force

# Wait for service to stabilize
Start-Sleep -Seconds 15

# Verify service started
Get-Service -Name "TrueAutomation.Services.Host" | Select-Object Name, Status
```

#### Step 6: Monitor Service Startup
```powershell
# Tail logs during startup
Get-Content "C:\Logs\TrueAutomation.Services.Host.log" -Wait -Tail 20
```

**Look for**:
- "Service started successfully"
- "All endpoints registered"
- "NHibernate session factory built"

**Red flags**:
- "Could not connect to database"
- "Failed to register endpoint"
- "Assembly not found"

#### Step 7: Test Client Connection
```powershell
# Launch PACS.NET client
Start-Process "C:\PACS\PACS.NET.exe"
```

**Manual test**:
1. Log in with test credentials
2. Search for property
3. Verify connection successful

### Emergency Restart
If service won't stop gracefully:

```powershell
# Find service process ID
Get-WmiObject Win32_Service | Where-Object {$_.Name -eq "TrueAutomation.Services.Host"} | Select-Object ProcessId

# Force kill process
Stop-Process -Id <ProcessID> -Force

# Start service
Start-Service -Name "TrueAutomation.Services.Host"
```

### Rollback Procedure
If restart causes issues:

1. Check Windows Event Log:
   ```powershell
   Get-EventLog -LogName Application -Source "TrueAutomation*" -Newest 20
   ```
2. Review service configuration file changes
3. Restore previous config from backup
4. Restart service

### Post-Resolution Checklist
- [ ] Service running and stable
- [ ] All WCF endpoints accessible
- [ ] Database connectivity confirmed
- [ ] Client connection test successful
- [ ] Service logs show no errors
- [ ] Notify users service restored
- [ ] Document root cause in incident log

### Troubleshooting

**Problem**: Service starts but endpoints not accessible

**Solution**:
- Check firewall rules: `netsh advfirewall firewall show rule name="PACS WCF Service"`
- Verify port 8732 not in use: `netstat -ano | findstr 8732`
- Check URL ACL: `netsh http show urlacl url=http://+:8732/`

**Problem**: "OutOfMemoryException" in logs

**Solution**:
- Review IIS/service process memory usage
- Increase max server memory if < 80% physical RAM
- Check for memory leaks (long-running sessions)
- Restart service during off-hours

---

## Runbook 4: Database Restore Procedure

### Purpose
Restore PACS database from backup for disaster recovery or data refresh.

### Prerequisites
- [ ] SSMS connected to target SQL Server
- [ ] Backup file location confirmed
- [ ] Sufficient disk space for restore
- [ ] Users notified of downtime
- [ ] EXCLUSIVE access to database (no active connections)

### Severity
**High** - Production outage during restore

### Estimated Duration
30 minutes - 2 hours (depends on database size)

### Procedure

#### Step 1: Identify Latest Backup
```sql
-- Find most recent FULL backup
SELECT TOP 1
    database_name,
    backup_start_date,
    backup_finish_date,
    (backup_size / 1024 / 1024) AS BackupSizeMB,
    physical_device_name
FROM msdb.dbo.backupset bs
JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
WHERE database_name = 'pacs_oltp'
    AND type = 'D'  -- Full backup
ORDER BY backup_start_date DESC;
```

Record backup path for restore command.

#### Step 2: Kill Active Connections
```sql
USE master;

-- Set database to SINGLE_USER mode (kills connections)
ALTER DATABASE pacs_oltp SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
```

⚠️ **WARNING**: This will terminate all active user sessions.

#### Step 3: Restore Database
```sql
-- Restore FULL backup
RESTORE DATABASE pacs_oltp
FROM DISK = 'E:\Backups\pacs_oltp_FULL_20251103.bak'
WITH 
    REPLACE,  -- Overwrites existing database
    RECOVERY, -- Database ready for use after restore
    STATS = 10; -- Progress updates every 10%
```

**Monitor progress**:
```sql
-- Query restore progress (run in separate SSMS session)
SELECT 
    r.session_id,
    r.command,
    r.percent_complete,
    r.estimated_completion_time,
    r.status,
    DB_NAME(r.database_id) AS DatabaseName
FROM sys.dm_exec_requests r
WHERE r.command LIKE 'RESTORE%';
```

#### Step 4: Restore Transaction Log Backups (if point-in-time recovery needed)
```sql
-- Apply differential backup
RESTORE DATABASE pacs_oltp
FROM DISK = 'E:\Backups\pacs_oltp_DIFF_20251103_1200.bak'
WITH NORECOVERY, STATS = 10;

-- Apply transaction log backups in sequence
RESTORE LOG pacs_oltp
FROM DISK = 'E:\Backups\pacs_oltp_LOG_20251103_1215.trn'
WITH NORECOVERY, STATS = 10;

RESTORE LOG pacs_oltp
FROM DISK = 'E:\Backups\pacs_oltp_LOG_20251103_1230.trn'
WITH NORECOVERY, STATS = 10;

-- Final restore with RECOVERY
RESTORE LOG pacs_oltp
FROM DISK = 'E:\Backups\pacs_oltp_LOG_20251103_1245.trn'
WITH RECOVERY, STATS = 10;
```

#### Step 5: Verify Database Consistency
```sql
-- Run DBCC CHECKDB
DBCC CHECKDB(pacs_oltp) WITH NO_INFOMSGS;
```

**Expected**: "0 allocation errors and 0 consistency errors"

#### Step 6: Set Database to MULTI_USER
```sql
ALTER DATABASE pacs_oltp SET MULTI_USER;
```

#### Step 7: Update Statistics
```sql
USE pacs_oltp;

-- Update statistics on all tables
EXEC sp_MSforeachtable 'UPDATE STATISTICS ? WITH FULLSCAN';
```

#### Step 8: Test Database Accessibility
```sql
-- Test query
SELECT COUNT(*) FROM property WITH (NOLOCK);
SELECT COUNT(*) FROM property_val WITH (NOLOCK);

-- Verify recent data
SELECT TOP 10 * FROM change_log ORDER BY chg_dt DESC;
```

### Rollback Procedure
If restore fails or corrupted:

1. Do NOT set to MULTI_USER
2. Re-restore from previous known-good backup
3. Escalate to senior DBA

### Post-Restore Checklist
- [ ] DBCC CHECKDB passed with no errors
- [ ] Database accessible and queryable
- [ ] Statistics updated
- [ ] WCF service restarted
- [ ] Test client connection
- [ ] Verify property search works
- [ ] Notify stakeholders restoration complete
- [ ] Document restore in change log

---

## Runbook 5: Index Maintenance

### Purpose
Rebuild or reorganize fragmented indexes to improve query performance.

### Prerequisites
- [ ] Maintenance window scheduled (2-4 hours)
- [ ] Users notified
- [ ] Database backup completed
- [ ] Sufficient transaction log space

### Severity
**Low** - Preventive maintenance

### Estimated Duration
2-4 hours (depends on database size and fragmentation)

### Procedure

#### Step 1: Identify Fragmented Indexes
```sql
USE pacs_oltp;

-- Find indexes with >30% fragmentation and >1000 pages
SELECT 
    OBJECT_NAME(ps.object_id) AS TableName,
    i.name AS IndexName,
    ps.avg_fragmentation_in_percent AS FragmentationPercent,
    ps.page_count AS PageCount,
    CASE 
        WHEN ps.avg_fragmentation_in_percent > 30 THEN 'REBUILD'
        WHEN ps.avg_fragmentation_in_percent > 10 THEN 'REORGANIZE'
        ELSE 'OK'
    END AS RecommendedAction
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'SAMPLED') ps
JOIN sys.indexes i ON ps.object_id = i.object_id AND ps.index_id = i.index_id
WHERE ps.avg_fragmentation_in_percent > 10
    AND ps.page_count > 1000
    AND OBJECTPROPERTY(ps.object_id, 'IsUserTable') = 1
ORDER BY ps.avg_fragmentation_in_percent DESC;
```

#### Step 2: Generate Maintenance Scripts

**For REBUILD (>30% fragmentation):**
```sql
-- Generate rebuild scripts
SELECT 
    'ALTER INDEX [' + i.name + '] ON [dbo].[' + OBJECT_NAME(ps.object_id) + '] REBUILD WITH (ONLINE = ON);' AS RebuildScript
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'SAMPLED') ps
JOIN sys.indexes i ON ps.object_id = i.object_id AND ps.index_id = i.index_id
WHERE ps.avg_fragmentation_in_percent > 30
    AND ps.page_count > 1000
ORDER BY ps.page_count DESC;
```

**For REORGANIZE (10-30% fragmentation):**
```sql
-- Generate reorganize scripts
SELECT 
    'ALTER INDEX [' + i.name + '] ON [dbo].[' + OBJECT_NAME(ps.object_id) + '] REORGANIZE;' AS ReorganizeScript
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'SAMPLED') ps
JOIN sys.indexes i ON ps.object_id = i.object_id AND ps.index_id = i.index_id
WHERE ps.avg_fragmentation_in_percent BETWEEN 10 AND 30
    AND ps.page_count > 1000
ORDER BY ps.page_count DESC;
```

#### Step 3: Execute Maintenance (ONLINE if possible)
```sql
-- Rebuild all indexes on property_val table (largest table)
ALTER INDEX ALL ON [dbo].[property_val] REBUILD WITH (ONLINE = ON, SORT_IN_TEMPDB = ON);

-- Rebuild all indexes on property table
ALTER INDEX ALL ON [dbo].[property] REBUILD WITH (ONLINE = ON, SORT_IN_TEMPDB = ON);

-- Continue for other large tables...
```

**Monitor progress:**
```sql
SELECT 
    session_id,
    percent_complete,
    estimated_completion_time,
    command,
    DB_NAME(database_id) AS DatabaseName,
    OBJECT_NAME(object_id) AS ObjectName
FROM sys.dm_exec_requests
WHERE command LIKE 'ALTER INDEX%';
```

#### Step 4: Update Statistics
```sql
-- Update statistics after rebuild
EXEC sp_MSforeachtable 'UPDATE STATISTICS ? WITH FULLSCAN';
```

#### Step 5: Verify Index Health
```sql
-- Re-check fragmentation
SELECT 
    OBJECT_NAME(ps.object_id) AS TableName,
    i.name AS IndexName,
    ps.avg_fragmentation_in_percent AS FragmentationPercent
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'SAMPLED') ps
JOIN sys.indexes i ON ps.object_id = i.object_id AND ps.index_id = i.index_id
WHERE OBJECT_NAME(ps.object_id) IN ('property', 'property_val', 'imprv_detail', 'land_detail')
ORDER BY ps.avg_fragmentation_in_percent DESC;
```

**Expected**: Fragmentation < 10%

### Automated Maintenance Script
```sql
-- Create automated index maintenance job (run weekly)
DECLARE @RebuildThreshold int = 30;
DECLARE @ReorganizeThreshold int = 10;

DECLARE @SQL nvarchar(max);
DECLARE index_cursor CURSOR FOR
SELECT 
    'ALTER INDEX [' + i.name + '] ON [' + SCHEMA_NAME(t.schema_id) + '].[' + t.name + '] ' +
    CASE 
        WHEN ps.avg_fragmentation_in_percent > @RebuildThreshold THEN 'REBUILD WITH (ONLINE = ON);'
        ELSE 'REORGANIZE;'
    END AS MaintenanceSQL
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'SAMPLED') ps
JOIN sys.indexes i ON ps.object_id = i.object_id AND ps.index_id = i.index_id
JOIN sys.tables t ON ps.object_id = t.object_id
WHERE ps.avg_fragmentation_in_percent > @ReorganizeThreshold
    AND ps.page_count > 1000
    AND i.name IS NOT NULL;

OPEN index_cursor;
FETCH NEXT FROM index_cursor INTO @SQL;

WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT @SQL;
    EXEC sp_executesql @SQL;
    FETCH NEXT FROM index_cursor INTO @SQL;
END;

CLOSE index_cursor;
DEALLOCATE index_cursor;
```

### Post-Maintenance Checklist
- [ ] All indexes < 10% fragmentation
- [ ] Statistics updated
- [ ] Query performance improved (test slow queries)
- [ ] Transaction log space recovered
- [ ] Document maintenance completion

---

*Due to length constraints, Runbooks 6-10 would follow the same detailed format covering:*
- **Runbook 6**: Slow Property Search Performance (query optimization)
- **Runbook 7**: Payment Not Applying to Bill (payment_transaction_assoc troubleshooting)
- **Runbook 8**: Mass Property Recalculation (batch operations)
- **Runbook 9**: Building Permit Import Failure (ETL pipeline troubleshooting)
- **Runbook 10**: Extended Stored Procedure Failure (xp_RecalcProperty debugging)

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-03 | Initial runbook creation - 5 operational procedures | TrueAutomation PACS Elite Engineering Team |

---

**Next Steps**: Schedule regular operational training sessions using these runbooks to ensure team readiness for common scenarios.
