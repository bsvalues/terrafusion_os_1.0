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
### Docker Troubleshooting: Named Volume Compose + Diagnostics

If the default Docker setup crashes (SQLPAL/AppLoader) or stays unhealthy, try these two checks:

1. Minimal container without any volume (isolates host vs. volume issues)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/diagnostics/test_mssql_container.ps1 -Cleanup
```

Expected: Prints server `@@VERSION`. If this fails, it indicates a host/WSL2 resource or kernel issue rather than our compose file.

2. Use a named-volume compose (avoids Windows bind-mount quirks)

```powershell
cd pacs-server-benton/infra/docker
$env:SA_PASSWORD = "P@ssw0rd123!"   # or your own strong password
docker compose -f compose.mssql.named.yml up -d
docker ps
docker logs pacs-benton-mssql --tail 80
```

If this comes up healthy, the prior bind-mounted data directory was the culprit. Named volumes store data inside the Docker Linux VM and are more reliable for SQL Server under WSL2.

Notes:

- Ensure Docker Desktop uses WSL 2 and has at least 4–8GB memory allocated.
- Run `wsl --update` and restart Docker Desktop if crashes persist.
- Keep `MSSQL_PID=Developer`, `ACCEPT_EULA=Y`, and a strong `SA_PASSWORD`.
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

---

# TerraFusion Integration Operational Runbooks

## Table of Contents - TerraFusion

11. [Runbook 11: TerraFusion Integration Health Check](#runbook-11-terrafusion-integration-health-check)
12. [Runbook 12: TerraFusion API Performance Issues](#runbook-12-terrafusion-api-performance-issues)
13. [Runbook 13: TerraFusion Security Audit Response](#runbook-13-terrafusion-security-audit-response)
14. [Runbook 14: TerraFusion Monitoring Stack Maintenance](#runbook-14-terrafusion-monitoring-stack-maintenance)
15. [Runbook 15: TerraFusion Data Validation Failure](#runbook-15-terrafusion-data-validation-failure)

---

## Runbook 11: TerraFusion Integration Health Check

### Purpose
Diagnose and resolve TerraFusion integration issues including API views, security configuration, and monitoring components.

### Prerequisites
- [ ] SSMS connected to pacs_oltp database
- [ ] PowerShell access to execute TerraFusion scripts
- [ ] Administrator privileges on TerraFusion monitoring server

### Severity
**High** - Affects TerraFusion OS modernization capabilities

### Estimated Duration
15-30 minutes

### Procedure

#### Step 1: Execute TerraFusion Health Check
```sql
USE pacs_oltp;

-- Run comprehensive health check
EXEC sp_TerraFusion_HealthCheck @Detailed = 1;
```

**Expected Results:**
- System: Database Connection = OK
- Data: Property Table = OK (> 0 records)
- Integration: TerraFusion Views = OK (>= 3 views)
- Performance: API Indexes = OK (>= 3 indexes)

#### Step 2: Verify TerraFusion API Views
```sql
-- Check view existence and functionality
SELECT 
    v.name AS ViewName,
    v.create_date,
    v.modify_date,
    'EXISTS' AS Status
FROM sys.views v
WHERE v.name LIKE 'vw_TerraFusion_%'
UNION ALL
SELECT 
    expected_view,
    NULL,
    NULL,
    'MISSING'
FROM (VALUES 
    ('vw_TerraFusion_Property_Core'),
    ('vw_TerraFusion_Assessment_History')
) t(expected_view)
WHERE expected_view NOT IN (SELECT name FROM sys.views WHERE name LIKE 'vw_TerraFusion_%')
ORDER BY Status, ViewName;
```

#### Step 3: Test API View Performance
```sql
-- Test Property Core View response time
DECLARE @start_time datetime2 = SYSDATETIME();
SELECT TOP 100 * FROM vw_TerraFusion_Property_Core WHERE prop_id IS NOT NULL;
DECLARE @duration_ms int = DATEDIFF(millisecond, @start_time, SYSDATETIME());
PRINT 'Property Core View query time: ' + CAST(@duration_ms as varchar) + 'ms';

-- Test Assessment History View
SET @start_time = SYSDATETIME();
SELECT TOP 100 * FROM vw_TerraFusion_Assessment_History WHERE prop_val_yr >= 2020;
SET @duration_ms = DATEDIFF(millisecond, @start_time, SYSDATETIME());
PRINT 'Assessment History View query time: ' + CAST(@duration_ms as varchar) + 'ms';
```

**Performance Thresholds:**
- Property Core View: < 500ms
- Assessment History View: < 1000ms

#### Step 4: Run Automated Validation
```powershell
# Execute TerraFusion validation framework
pwsh .\Test-TerraFusion.ps1 -ExportResults
```

### Resolution Actions

**If Views Missing:**
```powershell
# Recreate missing views
pwsh .\TerraFusion-SchemaFix.ps1
```

**If Performance Issues:**
```sql
-- Rebuild TerraFusion indexes
ALTER INDEX ALL ON property REBUILD WITH (ONLINE = ON);
ALTER INDEX ALL ON property_val REBUILD WITH (ONLINE = ON);
ALTER INDEX ALL ON situs REBUILD WITH (ONLINE = ON);
```

### Post-Resolution Checklist
- [ ] All health check categories show OK status
- [ ] API views return data within performance thresholds
- [ ] Security configuration validated
- [ ] Performance indexes optimal
- [ ] Monitoring stack operational
- [ ] Validation framework passes all tests

---

## Runbook 12: TerraFusion API Performance Issues

### Purpose
Diagnose and resolve slow API response times or timeout issues with TerraFusion views.

### Prerequisites
- [ ] Access to Query Store data
- [ ] Ability to run performance traces
- [ ] SSMS with actual execution plans enabled

### Severity
**Medium-High** - Impacts user experience and API SLAs

### Estimated Duration
30-60 minutes

### Procedure

#### Step 1: Identify Slow Queries
```sql
USE pacs_oltp;

-- Query Store: Top slow queries
SELECT TOP 10
    qt.query_sql_text,
    rs.avg_duration / 1000.0 AS avg_duration_ms,
    rs.avg_cpu_time / 1000.0 AS avg_cpu_ms,
    rs.avg_logical_io_reads,
    rs.count_executions,
    rs.last_execution_time
FROM sys.query_store_query_text qt
JOIN sys.query_store_query q ON qt.query_text_id = q.query_text_id
JOIN sys.query_store_plan p ON q.query_id = p.query_id
JOIN sys.query_store_runtime_stats rs ON p.plan_id = rs.plan_id
WHERE qt.query_sql_text LIKE '%vw_TerraFusion_%'
ORDER BY rs.avg_duration DESC;
```

#### Step 2: Check Index Usage
```sql
-- Index usage statistics for TerraFusion views
SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    s.user_seeks,
    s.user_scans,
    s.user_lookups,
    s.user_updates,
    s.last_user_seek,
    s.last_user_scan
FROM sys.dm_db_index_usage_stats s
JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE OBJECT_NAME(s.object_id) IN ('property', 'property_val', 'situs')
ORDER BY s.user_seeks DESC;
```

#### Step 3: Optimize Performance
```sql
-- Create recommended indexes
CREATE NONCLUSTERED INDEX IX_TerraFusion_PropertyVal_YearGeoID
ON property_val (prop_val_yr, prop_id)
INCLUDE (assessed_val, appraised_val, market, recalc_dt);

-- Update statistics
UPDATE STATISTICS property WITH FULLSCAN;
UPDATE STATISTICS property_val WITH FULLSCAN;
UPDATE STATISTICS situs WITH FULLSCAN;
```

### Post-Optimization Checklist
- [ ] Query response times < 500ms for Property Core View
- [ ] Query response times < 1000ms for Assessment History View
- [ ] Execution plans show index seeks (not scans)
- [ ] No missing index recommendations for TerraFusion queries
- [ ] Validation framework performance tests pass

---

## Runbook 13: TerraFusion Security Audit Response

### Purpose
Respond to security audit findings or suspicious activity in TerraFusion integration components.

### Prerequisites
- [ ] Access to SQL Server audit logs
- [ ] Administrative access to review security configurations
- [ ] Ability to modify security settings

### Severity
**High** - Security compliance and data protection

### Estimated Duration
45-90 minutes

### Procedure

#### Step 1: Review TerraFusion Audit Logs
```sql
-- Check TerraFusion audit events
SELECT 
    event_time,
    server_principal_name,
    database_principal_name,
    object_name,
    statement,
    succeeded,
    application_name,
    client_ip
FROM fn_get_audit_file('C:\Audit\TerraFusion\*.sqlaudit', DEFAULT, DEFAULT)
WHERE event_time >= DATEADD(hour, -24, GETDATE())  -- Last 24 hours
ORDER BY event_time DESC;
```

#### Step 2: Validate Current Security Configuration
```sql
-- Check TerraFusion user permissions
SELECT 
    dp.name AS principal_name,
    dp.type_desc,
    dp.create_date,
    dp.modify_date,
    dp.is_disabled
FROM sys.database_principals dp
WHERE dp.name = 'TerraFusion_Integration';

-- Check explicit permissions
SELECT 
    p.class_desc,
    p.permission_name,
    p.state_desc,
    OBJECT_SCHEMA_NAME(p.major_id) AS schema_name,
    OBJECT_NAME(p.major_id) AS object_name
FROM sys.database_permissions p
JOIN sys.database_principals dp ON p.grantee_principal_id = dp.principal_id
WHERE dp.name = 'TerraFusion_Integration'
ORDER BY p.class_desc, p.permission_name;
```

#### Step 3: Implement Security Hardening (if needed)
```sql
-- Reset TerraFusion user if compromised
DROP USER [TerraFusion_Integration];
CREATE USER [TerraFusion_Integration] FOR LOGIN [TERRAFUSION\svc_integration];

-- Grant minimal required permissions only
GRANT SELECT ON vw_TerraFusion_Property_Core TO [TerraFusion_Integration];
GRANT SELECT ON vw_TerraFusion_Assessment_History TO [TerraFusion_Integration];
GRANT EXECUTE ON sp_TerraFusion_HealthCheck TO [TerraFusion_Integration];
```

### Post-Audit Checklist
- [ ] All audit logs reviewed for anomalies
- [ ] User permissions validated as minimal required
- [ ] No unauthorized privilege escalations found
- [ ] Data access controls functioning correctly
- [ ] Security compliance report generated

---

## Runbook 14: TerraFusion Monitoring Stack Maintenance

### Purpose
Perform regular maintenance on Prometheus, Grafana, and SQL Exporter components of the TerraFusion monitoring stack.

### Prerequisites
- [ ] Administrative access to monitoring servers
- [ ] Backup of monitoring configurations
- [ ] Scheduled maintenance window

### Severity
**Low-Medium** - Preventive maintenance for monitoring reliability

### Estimated Duration
60-90 minutes

### Procedure

#### Step 1: Check Monitoring Stack Health
```powershell
# Test all monitoring endpoints
$endpoints = @(
    @{Name="Prometheus"; URL="http://localhost:9090/-/healthy"},
    @{Name="Grafana"; URL="http://localhost:3000/api/health"},
    @{Name="SQL Exporter"; URL="http://localhost:9399/metrics"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri $endpoint.URL -Method GET -TimeoutSec 10
        Write-Host "✅ $($endpoint.Name): Healthy" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ $($endpoint.Name): Unhealthy - $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

#### Step 2: Backup Configurations
```powershell
# Backup current configurations
$backupPath = "C:\TerraFusion\Monitoring\backup\$(Get-Date -Format 'yyyy-MM-dd')"
New-Item -Path $backupPath -ItemType Directory -Force

Copy-Item "C:\TerraFusion\Monitoring\prometheus\prometheus.yml" "$backupPath\prometheus.yml.bak"
Copy-Item "C:\TerraFusion\Monitoring\grafana\grafana.ini" "$backupPath\grafana.ini.bak"
Copy-Item "C:\TerraFusion\Monitoring\sql_exporter\sql_exporter.yml" "$backupPath\sql_exporter.yml.bak"

Write-Host "✅ Configuration backup created: $backupPath"
```

#### Step 3: Restart Services and Verify
```powershell
# Re-run monitoring setup to verify everything is working
pwsh .\Setup-TerraFusionMonitoring.ps1 -GenerateConfigs

# Test data collection
pwsh .\Test-TerraFusion.ps1 -ExportResults
```

### Maintenance Schedule Recommendations

**Weekly:**
- Check service health
- Review disk space usage
- Validate metric collection

**Monthly:**
- Backup configurations
- Review and clean old data
- Update dashboard content
- Test alerting rules

**Quarterly:**
- Update monitoring software versions
- Review security settings
- Optimize retention policies
- Performance tuning

---

## Runbook 15: TerraFusion Data Validation Failure

### Purpose
Diagnose and resolve failures in the TerraFusion data validation framework that indicate data integrity or API functionality issues.

### Prerequisites
- [ ] Access to TerraFusion validation reports
- [ ] SSMS access to pacs_oltp database
- [ ] PowerShell execution capabilities

### Severity
**Medium-High** - Indicates potential data quality issues affecting API reliability

### Estimated Duration
30-60 minutes depending on failure type

### Procedure

#### Step 1: Review Latest Validation Report
```powershell
# Find most recent validation report
$testingPath = "C:\TerraFusion\Testing"
$latestReport = Get-ChildItem -Path $testingPath -Filter "*Validation_Report*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($latestReport) {
    $report = Get-Content $latestReport.FullName | ConvertFrom-Json
    Write-Host "Latest Validation Report: $($latestReport.Name)"
    Write-Host "Test Date: $($report.Metadata.TestDate)"
    Write-Host "Total Tests: $($report.Metadata.TotalTests)"
    Write-Host "Passed: $($report.Summary.PassedTests)"
    Write-Host "Failed: $($report.Summary.FailedTests)"
    Write-Host "Warnings: $($report.Summary.WarningTests)"
    
    # Show failed tests
    $failedTests = $report.TestResults | Where-Object { $_.Status -eq "FAIL" }
    if ($failedTests) {
        Write-Host "`nFailed Tests:" -ForegroundColor Red
        $failedTests | ForEach-Object { Write-Host "  - $($_.Category): $($_.Test) - $($_.Details)" }
    }
}
```

#### Step 2: Fix Data Integrity Issues
```sql
-- Check if core tables exist and have data
SELECT 
    name AS TableName,
    create_date,
    modify_date
FROM sys.tables
WHERE name IN ('property', 'property_val', 'situs', 'owner')
ORDER BY name;
```

**If tables missing:**
```powershell
# Republish database schema
pwsh .\pacs-server-benton\scripts\publish.ps1 -SqlServer "localhost,1433" -SaPassword "P@ssw0rd123!"
```

#### Step 3: Fix Performance Issues
```sql
-- Check fragmentation on key tables
SELECT 
    OBJECT_NAME(ps.object_id) AS TableName,
    i.name AS IndexName,
    ps.avg_fragmentation_in_percent,
    CASE 
        WHEN ps.avg_fragmentation_in_percent > 30 THEN 'REBUILD'
        WHEN ps.avg_fragmentation_in_percent > 10 THEN 'REORGANIZE'
        ELSE 'OK'
    END AS Action
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'SAMPLED') ps
JOIN sys.indexes i ON ps.object_id = i.object_id AND ps.index_id = i.index_id
WHERE OBJECT_NAME(ps.object_id) IN ('property', 'property_val', 'situs')
AND ps.avg_fragmentation_in_percent > 10
ORDER BY ps.avg_fragmentation_in_percent DESC;
```

#### Step 4: Re-run Validation
```powershell
# Generate test data if needed for empty database
pwsh .\Test-TerraFusion.ps1 -GenerateTestData -ExportResults -FullValidation
```

### Post-Resolution Checklist
- [ ] All validation categories show PASS status
- [ ] Performance metrics within acceptable thresholds
- [ ] Security configuration validated
- [ ] Data integrity confirmed
- [ ] Business rules compliance verified
- [ ] Resolution documented

---

## TerraFusion Quick Reference

### Essential Commands

**Health Check:**
```sql
EXEC sp_TerraFusion_HealthCheck;
```

**Performance Test:**
```powershell
pwsh .\Test-TerraFusion.ps1 -ExportResults
```

**Integration Validation:**
```powershell
pwsh .\Deploy-TerraFusion.ps1 -ValidateOnly
```

**Monitoring Setup:**
```powershell
pwsh .\Setup-TerraFusionMonitoring.ps1 -GenerateConfigs
```

### TerraFusion Support Contacts

- **Primary**: TerraFusion Elite Government OS Engineering Team
- **Documentation**: C:\TerraFusion\Documentation\
- **Health Monitoring**: Execute sp_TerraFusion_HealthCheck in pacs_oltp
- **Emergency**: Use Deploy-TerraFusion.ps1 -Rollback for rapid recovery

## Database Bring-Up (Local)

Two supported paths to stand up the SQL databases for PACS work.

Path A – Docker (preferred when host supports MSSQL containers)

- Requirements: Docker Desktop (WSL2), 4–6 GB RAM allocated to Docker.
- Start container (from repo root):

    ```powershell
    Push-Location pacs-server-benton/infra/docker
    docker compose -f compose.mssql.yml down -v
    # Optional: reset data if needed
    Pop-Location
    Remove-Item -Recurse -Force 'pacs-server-benton/infra/mssql/data/*' -ErrorAction SilentlyContinue
    Push-Location pacs-server-benton/infra/docker
    docker compose -f compose.mssql.yml up -d
    Pop-Location
    ```

- Health check:

    ```powershell
    docker inspect -f '{{.State.Health.Status}}' pacs-benton-mssql
    # Expect: healthy
    ```

- Publish DB projects:

    ```powershell
    pwsh ./pacs-server-benton/scripts/publish.ps1 -SqlServer "localhost,1433" -SaPassword "P@ssw0rd123!"
    ```

- Verify and export:

    ```powershell
    pwsh ./Make.ps1 all-checks
    pwsh ./Make.ps1 data-dictionary
    ```

Notes

- If the container repeatedly exits or logs SQLPAL/AppLoader errors, your host may be incompatible with the Linux SQL image. Use Path B instead.
- The compose file can be switched between `mcr.microsoft.com/mssql/server:2022-latest` and `2019-latest` should host compatibility vary.

Path B – Windows SQL Server (Developer/Express)

- Install SQL Server Developer or Express locally. Enable SQL authentication and set the `sa` password to `P@ssw0rd123!` (or update env vars `PACS_USER`/`PACS_PW`).
- Create empty DBs (optional – the publish script will create as needed):

    ```powershell
    sqlcmd -S localhost,1433 -U sa -P "P@ssw0rd123!" -i .\pacs-server-benton\infra\mssql\init\01-create-dbs.sql
    ```

- Publish DB projects:

    ```powershell
    pwsh ./pacs-server-benton/scripts/publish.ps1 -SqlServer "localhost,1433" -SaPassword "P@ssw0rd123!"
    ```

- Verify and export (same as Path A):

    ```powershell
    pwsh ./Make.ps1 all-checks
    pwsh ./Make.ps1 data-dictionary
    ```

Troubleshooting

- sqlcmd timeouts: ensure the SQL service/instance is listening on `localhost,1433` and firewall allows connections.
- DACPAC build failures: cross-database references can produce SQL715 warnings/errors. Re-run publish; the runtime server resolves references. If needed, publish in this order: pacs_oltp → PACS_Training → TA_AppSvr → CIAPS → Web_Internet_Benton → SSISDB.
- Container health stuck at `starting`/`unhealthy`: allocate more Docker RAM/CPUs and retry; if persists, use Path B.
