-- =============================================
-- PACS SQL Server Configuration Analysis Script
-- Purpose: Complete server configuration baseline for Phase 2 investigation
-- Target: SQL Server 2022 Enterprise (localhost,1433 or production)
-- Author: TrueAutomation PACS Elite Engineering Team
-- Date: November 3, 2025
-- =============================================

-- Instructions:
-- 1. Connect to target SQL Server instance (localhost,1433 for dev, production server for prod)
-- 2. Execute this script in SQL Server Management Studio or Azure Data Studio
-- 3. Review results and save to documentation
-- 4. Compare dev vs production configurations

SET NOCOUNT ON;

PRINT '======================================';
PRINT 'PACS SQL SERVER CONFIGURATION ANALYSIS';
PRINT 'Started: ' + CONVERT(varchar, GETDATE(), 120);
PRINT '======================================';
PRINT '';

-- =============================================
-- 1. SQL SERVER INSTANCE INFORMATION
-- =============================================
PRINT '1. SQL SERVER INSTANCE INFORMATION';
PRINT '-------------------------------------';

SELECT 
    SERVERPROPERTY('ServerName') AS ServerName,
    SERVERPROPERTY('MachineName') AS MachineName,
    SERVERPROPERTY('InstanceName') AS InstanceName,
    SERVERPROPERTY('Edition') AS Edition,
    SERVERPROPERTY('ProductVersion') AS ProductVersion,
    SERVERPROPERTY('ProductLevel') AS ProductLevel,
    SERVERPROPERTY('ProductUpdateLevel') AS ProductUpdateLevel,
    SERVERPROPERTY('Collation') AS Collation,
    SERVERPROPERTY('IsClustered') AS IsClustered,
    SERVERPROPERTY('IsHadrEnabled') AS IsHadrEnabled,
    SERVERPROPERTY('HadrManagerStatus') AS HadrManagerStatus;

PRINT '';

-- =============================================
-- 2. CRITICAL INSTANCE CONFIGURATION SETTINGS
-- =============================================
PRINT '2. CRITICAL INSTANCE CONFIGURATION SETTINGS';
PRINT '-------------------------------------';

SELECT 
    name AS ConfigurationOption,
    value AS CurrentValue,
    value_in_use AS ValueInUse,
    minimum AS MinValue,
    maximum AS MaxValue,
    description,
    is_dynamic AS IsDynamic,
    is_advanced AS IsAdvanced
FROM sys.configurations
WHERE name IN (
    'max server memory (MB)',
    'min server memory (MB)',
    'max degree of parallelism',
    'cost threshold for parallelism',
    'optimize for ad hoc workloads',
    'backup compression default',
    'remote admin connections',
    'clr enabled',
    'xp_cmdshell'
)
ORDER BY name;

PRINT '';

-- =============================================
-- 3. MEMORY CONFIGURATION
-- =============================================
PRINT '3. MEMORY CONFIGURATION';
PRINT '-------------------------------------';

SELECT 
    (physical_memory_kb / 1024) AS PhysicalMemoryMB,
    (physical_memory_kb / 1024 / 1024) AS PhysicalMemoryGB,
    (virtual_memory_kb / 1024) AS VirtualMemoryMB,
    (committed_kb / 1024) AS CommittedMemoryMB,
    (committed_target_kb / 1024) AS CommittedTargetMB,
    (visible_target_kb / 1024) AS VisibleTargetMB,
    (stack_size_in_bytes / 1024) AS StackSizeKB,
    process_physical_memory_low,
    process_virtual_memory_low
FROM sys.dm_os_sys_info;

PRINT '';

-- Memory clerks (top 10 consumers)
PRINT 'Top 10 Memory Clerks:';
SELECT TOP 10
    type AS MemoryClerkType,
    (SUM(pages_kb) / 1024) AS MemoryUsedMB
FROM sys.dm_os_memory_clerks
GROUP BY type
ORDER BY SUM(pages_kb) DESC;

PRINT '';

-- =============================================
-- 4. TEMPDB CONFIGURATION
-- =============================================
PRINT '4. TEMPDB CONFIGURATION';
PRINT '-------------------------------------';

SELECT 
    name AS FileName,
    physical_name AS PhysicalPath,
    (size * 8 / 1024) AS SizeMB,
    (size * 8 / 1024 / 1024) AS SizeGB,
    growth AS GrowthValue,
    CASE 
        WHEN is_percent_growth = 1 THEN 'Percent'
        ELSE 'MB'
    END AS GrowthType,
    state_desc AS State
FROM sys.master_files
WHERE database_id = DB_ID('tempdb')
ORDER BY file_id;

-- Recommended: 1 TempDB file per CPU core (up to 8), or number of cores
DECLARE @CPUCount int = (SELECT cpu_count FROM sys.dm_os_sys_info);
DECLARE @TempDBFileCount int = (SELECT COUNT(*) FROM sys.master_files WHERE database_id = DB_ID('tempdb') AND type = 0);

PRINT '';
PRINT 'CPU Count: ' + CAST(@CPUCount AS varchar);
PRINT 'TempDB Data Files: ' + CAST(@TempDBFileCount AS varchar);
IF @TempDBFileCount < @CPUCount AND @CPUCount <= 8
    PRINT 'RECOMMENDATION: Add more TempDB files (target: 1 per core up to 8)';
ELSE IF @TempDBFileCount < 8 AND @CPUCount > 8
    PRINT 'RECOMMENDATION: Consider 8 TempDB files for high core count';
ELSE
    PRINT 'TempDB file count is optimal';

PRINT '';

-- =============================================
-- 5. DATABASE INVENTORY
-- =============================================
PRINT '5. DATABASE INVENTORY (PACS Databases)';
PRINT '-------------------------------------';

SELECT 
    db.name AS DatabaseName,
    db.database_id AS DatabaseID,
    db.state_desc AS State,
    db.recovery_model_desc AS RecoveryModel,
    db.compatibility_level AS CompatibilityLevel,
    db.page_verify_option_desc AS PageVerify,
    db.is_auto_create_stats_on AS AutoCreateStats,
    db.is_auto_update_stats_on AS AutoUpdateStats,
    db.is_auto_update_stats_async_on AS AutoUpdateStatsAsync,
    db.is_query_store_on AS QueryStoreEnabled,
    db.is_read_committed_snapshot_on AS RCSI_Enabled,
    db.snapshot_isolation_state_desc AS SnapshotIsolation,
    (SUM(mf.size) * 8 / 1024) AS TotalSizeMB,
    (SUM(mf.size) * 8 / 1024 / 1024) AS TotalSizeGB
FROM sys.databases db
LEFT JOIN sys.master_files mf ON db.database_id = mf.database_id
WHERE db.name IN ('pacs_oltp', 'PACS_Training', 'CIAPS', 'TA_AppSvr', 'Web_Internet_Benton', 'SSISDB')
GROUP BY 
    db.name, db.database_id, db.state_desc, db.recovery_model_desc, 
    db.compatibility_level, db.page_verify_option_desc, 
    db.is_auto_create_stats_on, db.is_auto_update_stats_on, 
    db.is_auto_update_stats_async_on, db.is_query_store_on,
    db.is_read_committed_snapshot_on, db.snapshot_isolation_state_desc
ORDER BY db.name;

PRINT '';

-- =============================================
-- 6. ALWAYS ON AVAILABILITY GROUPS (if configured)
-- =============================================
PRINT '6. ALWAYS ON AVAILABILITY GROUPS';
PRINT '-------------------------------------';

IF SERVERPROPERTY('IsHadrEnabled') = 1
BEGIN
    -- AG configuration
    SELECT 
        ag.name AS AvailabilityGroupName,
        ar.replica_server_name AS ReplicaServer,
        ar.availability_mode_desc AS AvailabilityMode,
        ar.failover_mode_desc AS FailoverMode,
        ar.primary_role_allow_connections_desc AS PrimaryRoleConnections,
        ar.secondary_role_allow_connections_desc AS SecondaryRoleConnections,
        ar.backup_priority AS BackupPriority,
        ar.endpoint_url AS EndpointURL,
        ars.role_desc AS CurrentRole,
        ars.operational_state_desc AS OperationalState,
        ars.connected_state_desc AS ConnectedState,
        ars.synchronization_health_desc AS SynchronizationHealth,
        ars.last_connect_error_description AS LastConnectError
    FROM sys.availability_groups ag
    JOIN sys.availability_replicas ar ON ag.group_id = ar.group_id
    LEFT JOIN sys.dm_hadr_availability_replica_states ars ON ar.replica_id = ars.replica_id
    ORDER BY ag.name, ar.replica_server_name;

    PRINT '';

    -- Database replica states
    SELECT 
        ag.name AS AvailabilityGroupName,
        db.name AS DatabaseName,
        drs.synchronization_state_desc AS SynchronizationState,
        drs.synchronization_health_desc AS SynchronizationHealth,
        drs.database_state_desc AS DatabaseState,
        drs.is_suspended AS IsSuspended,
        drs.suspend_reason_desc AS SuspendReason,
        drs.last_hardened_lsn AS LastHardenedLSN,
        drs.last_commit_time AS LastCommitTime
    FROM sys.dm_hadr_database_replica_states drs
    JOIN sys.databases db ON drs.database_id = db.database_id
    JOIN sys.availability_groups ag ON drs.group_id = ag.group_id
    WHERE db.name IN ('pacs_oltp', 'PACS_Training', 'CIAPS', 'TA_AppSvr', 'Web_Internet_Benton')
    ORDER BY ag.name, db.name;

    PRINT '';

    -- AG listeners
    SELECT 
        agl.dns_name AS ListenerDNSName,
        agl.port AS ListenerPort,
        agip.ip_address AS IPAddress,
        agip.ip_subnet_mask AS SubnetMask,
        agip.is_dhcp AS IsDHCP,
        agip.state_desc AS State
    FROM sys.availability_group_listeners agl
    JOIN sys.availability_group_listener_ip_addresses agip ON agl.listener_id = agip.listener_id
    ORDER BY agl.dns_name;
END
ELSE
BEGIN
    PRINT 'Always On Availability Groups: NOT ENABLED';
END

PRINT '';

-- =============================================
-- 7. WAIT STATISTICS (Top 20)
-- =============================================
PRINT '7. WAIT STATISTICS (Top 20 Waits)';
PRINT '-------------------------------------';

WITH WaitStats AS (
    SELECT 
        wait_type,
        wait_time_ms,
        waiting_tasks_count,
        max_wait_time_ms,
        signal_wait_time_ms,
        wait_time_ms - signal_wait_time_ms AS resource_wait_time_ms
    FROM sys.dm_os_wait_stats
    WHERE wait_type NOT IN (
        -- Filter out benign wait types
        'CLR_SEMAPHORE', 'LAZYWRITER_SLEEP', 'RESOURCE_QUEUE', 'SLEEP_TASK',
        'SLEEP_SYSTEMTASK', 'SQLTRACE_BUFFER_FLUSH', 'WAITFOR', 'LOGMGR_QUEUE',
        'CHECKPOINT_QUEUE', 'REQUEST_FOR_DEADLOCK_SEARCH', 'XE_TIMER_EVENT', 'BROKER_TO_FLUSH',
        'BROKER_TASK_STOP', 'CLR_MANUAL_EVENT', 'CLR_AUTO_EVENT', 'DISPATCHER_QUEUE_SEMAPHORE',
        'FT_IFTS_SCHEDULER_IDLE_WAIT', 'XE_DISPATCHER_WAIT', 'XE_DISPATCHER_JOIN', 
        'SQLTRACE_INCREMENTAL_FLUSH_SLEEP', 'ONDEMAND_TASK_QUEUE', 'BROKER_EVENTHANDLER',
        'SLEEP_BPOOL_FLUSH', 'DIRTY_PAGE_POLL', 'HADR_FILESTREAM_IOMGR_IOCOMPLETION',
        'SP_SERVER_DIAGNOSTICS_SLEEP'
    )
)
SELECT TOP 20
    wait_type AS WaitType,
    waiting_tasks_count AS WaitCount,
    (wait_time_ms / 1000.0) AS WaitTimeSeconds,
    (wait_time_ms / 1000.0 / 60.0) AS WaitTimeMinutes,
    (wait_time_ms * 100.0) / SUM(wait_time_ms) OVER() AS PercentageOfTotalWaits,
    (wait_time_ms / NULLIF(waiting_tasks_count, 0)) AS AvgWaitTimeMS,
    (max_wait_time_ms / 1000.0) AS MaxWaitTimeSeconds,
    (signal_wait_time_ms / 1000.0) AS SignalWaitTimeSeconds,
    (resource_wait_time_ms / 1000.0) AS ResourceWaitTimeSeconds,
    CASE 
        WHEN wait_type LIKE 'LCK%' THEN 'Locking'
        WHEN wait_type LIKE 'PAGEIOLATCH%' THEN 'Page I/O Latch'
        WHEN wait_type LIKE 'PAGELATCH%' THEN 'Page Latch'
        WHEN wait_type LIKE 'IO_COMPLETION' THEN 'I/O Completion'
        WHEN wait_type LIKE 'ASYNC_NETWORK_IO' THEN 'Network I/O'
        WHEN wait_type LIKE 'CXPACKET' THEN 'Parallelism'
        WHEN wait_type LIKE 'SOS_SCHEDULER_YIELD' THEN 'CPU Pressure'
        WHEN wait_type LIKE 'WRITELOG' THEN 'Transaction Log I/O'
        ELSE 'Other'
    END AS WaitCategory
FROM WaitStats
ORDER BY wait_time_ms DESC;

PRINT '';

-- =============================================
-- 8. TOP 20 MOST EXPENSIVE QUERIES
-- =============================================
PRINT '8. TOP 20 MOST EXPENSIVE QUERIES (By Total Elapsed Time)';
PRINT '-------------------------------------';

SELECT TOP 20
    qs.execution_count AS ExecutionCount,
    (qs.total_elapsed_time / 1000000.0) AS TotalElapsedTimeSeconds,
    (qs.total_elapsed_time / 1000000.0 / 60.0) AS TotalElapsedTimeMinutes,
    (qs.total_elapsed_time / qs.execution_count / 1000.0) AS AvgElapsedTimeMS,
    (qs.total_worker_time / 1000000.0) AS TotalWorkerTimeSeconds,
    (qs.total_worker_time / qs.execution_count / 1000.0) AS AvgWorkerTimeMS,
    qs.total_logical_reads AS TotalLogicalReads,
    (qs.total_logical_reads / qs.execution_count) AS AvgLogicalReads,
    qs.total_logical_writes AS TotalLogicalWrites,
    qs.total_physical_reads AS TotalPhysicalReads,
    qs.last_execution_time AS LastExecutionTime,
    qs.creation_time AS CreationTime,
    DB_NAME(st.dbid) AS DatabaseName,
    OBJECT_NAME(st.objectid, st.dbid) AS ObjectName,
    SUBSTRING(st.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(st.text)
            ELSE qs.statement_end_offset
        END - qs.statement_start_offset)/2) + 1) AS QueryText
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
WHERE DB_NAME(st.dbid) IN ('pacs_oltp', 'PACS_Training', 'CIAPS', 'TA_AppSvr', 'Web_Internet_Benton')
ORDER BY qs.total_elapsed_time DESC;

PRINT '';

-- =============================================
-- 9. MISSING INDEXES (High Impact)
-- =============================================
PRINT '9. MISSING INDEXES (High Impact - Top 20)';
PRINT '-------------------------------------';

SELECT TOP 20
    (migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans)) AS ImprovementMeasure,
    DB_NAME(mid.database_id) AS DatabaseName,
    OBJECT_NAME(mid.object_id, mid.database_id) AS TableName,
    mid.equality_columns AS EqualityColumns,
    mid.inequality_columns AS InequalityColumns,
    mid.included_columns AS IncludedColumns,
    migs.user_seeks AS UserSeeks,
    migs.user_scans AS UserScans,
    migs.last_user_seek AS LastUserSeek,
    migs.last_user_scan AS LastUserScan,
    migs.avg_total_user_cost AS AvgTotalUserCost,
    migs.avg_user_impact AS AvgUserImpact,
    'CREATE NONCLUSTERED INDEX IX_' + OBJECT_NAME(mid.object_id, mid.database_id) + '_Missing' +
    ' ON ' + mid.statement + 
    ' (' + ISNULL(mid.equality_columns, '') + 
    CASE WHEN mid.inequality_columns IS NOT NULL THEN ',' + mid.inequality_columns ELSE '' END + ')' +
    CASE WHEN mid.included_columns IS NOT NULL THEN ' INCLUDE (' + mid.included_columns + ')' ELSE '' END AS CreateIndexStatement
FROM sys.dm_db_missing_index_groups mig
JOIN sys.dm_db_missing_index_group_stats migs ON mig.index_group_handle = migs.group_handle
JOIN sys.dm_db_missing_index_details mid ON mig.index_handle = mid.index_handle
WHERE 
    DB_NAME(mid.database_id) IN ('pacs_oltp', 'PACS_Training', 'CIAPS', 'TA_AppSvr', 'Web_Internet_Benton')
    AND migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans) > 10000
ORDER BY ImprovementMeasure DESC;

PRINT '';

-- =============================================
-- 10. INDEX FRAGMENTATION (Heavily Fragmented)
-- =============================================
PRINT '10. INDEX FRAGMENTATION (>30% fragmentation, >1000 pages)';
PRINT '-------------------------------------';

-- Check pacs_oltp database
USE pacs_oltp;
GO

SELECT 
    OBJECT_NAME(ps.object_id) AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType,
    ps.index_id AS IndexID,
    ps.avg_fragmentation_in_percent AS FragmentationPercent,
    ps.page_count AS PageCount,
    ps.record_count AS RecordCount,
    ps.avg_page_space_used_in_percent AS AvgPageSpaceUsed,
    CASE 
        WHEN ps.avg_fragmentation_in_percent > 30 THEN 'REBUILD'
        WHEN ps.avg_fragmentation_in_percent > 10 THEN 'REORGANIZE'
        ELSE 'OK'
    END AS RecommendedAction
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'SAMPLED') ps
JOIN sys.indexes i ON ps.object_id = i.object_id AND ps.index_id = i.index_id
WHERE 
    ps.avg_fragmentation_in_percent > 30 
    AND ps.page_count > 1000
    AND OBJECTPROPERTY(ps.object_id, 'IsUserTable') = 1
ORDER BY ps.avg_fragmentation_in_percent DESC;

PRINT '';

-- =============================================
-- 11. STATISTICS UPDATE STATUS
-- =============================================
PRINT '11. STATISTICS UPDATE STATUS (Stale Statistics - pacs_oltp)';
PRINT '-------------------------------------';

SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    s.name AS StatisticsName,
    sp.last_updated AS LastUpdated,
    sp.rows AS RowCount,
    sp.rows_sampled AS RowsSampled,
    sp.modification_counter AS ModificationCount,
    CASE 
        WHEN sp.modification_counter > (sp.rows * 0.20) THEN 'High Churn (>20%)'
        WHEN sp.modification_counter > (sp.rows * 0.10) THEN 'Moderate Churn (>10%)'
        ELSE 'OK'
    END AS ChurnLevel,
    DATEDIFF(DAY, sp.last_updated, GETDATE()) AS DaysSinceUpdate
FROM sys.stats s
CROSS APPLY sys.dm_db_stats_properties(s.object_id, s.stats_id) sp
WHERE 
    OBJECTPROPERTY(s.object_id, 'IsUserTable') = 1
    AND (sp.modification_counter > (sp.rows * 0.10) OR DATEDIFF(DAY, sp.last_updated, GETDATE()) > 7)
ORDER BY sp.modification_counter DESC;

PRINT '';

-- =============================================
-- 12. EXTENDED STORED PROCEDURES
-- =============================================
PRINT '12. EXTENDED STORED PROCEDURES (PACS-specific)';
PRINT '-------------------------------------';

SELECT 
    name AS ExtendedSPName,
    type_desc AS Type,
    create_date AS CreateDate,
    modify_date AS ModifyDate
FROM sys.objects
WHERE type = 'X' 
    AND (name LIKE 'xp_%Property%' OR name LIKE 'xp_%Taxable%' OR name LIKE 'xp_%PACS%')
ORDER BY name;

-- Try to get DLL path (may fail if not accessible)
BEGIN TRY
    EXEC sp_helpextendedproc 'xp_RecalcProperty90';
    EXEC sp_helpextendedproc 'xp_CalculateTaxable80';
END TRY
BEGIN CATCH
    PRINT 'Note: Extended SP DLL paths not accessible or SPs not registered';
END CATCH

PRINT '';

-- =============================================
-- 13. SQL AGENT JOBS (Backup & Maintenance)
-- =============================================
PRINT '13. SQL AGENT JOBS (Backup & Maintenance)';
PRINT '-------------------------------------';

SELECT 
    j.name AS JobName,
    j.enabled AS IsEnabled,
    j.description AS Description,
    CASE 
        WHEN ja.run_requested_date IS NOT NULL AND ja.stop_execution_date IS NULL THEN 'Running'
        ELSE 'Not Running'
    END AS CurrentStatus,
    jh.step_name AS LastStepName,
    CASE jh.run_status
        WHEN 0 THEN 'Failed'
        WHEN 1 THEN 'Succeeded'
        WHEN 2 THEN 'Retry'
        WHEN 3 THEN 'Canceled'
        WHEN 4 THEN 'In Progress'
    END AS LastRunStatus,
    jh.run_date AS LastRunDate,
    jh.run_time AS LastRunTime,
    jh.run_duration AS LastRunDuration,
    jh.message AS LastRunMessage
FROM msdb.dbo.sysjobs j
LEFT JOIN msdb.dbo.sysjobactivity ja ON j.job_id = ja.job_id
LEFT JOIN (
    SELECT job_id, step_name, run_status, run_date, run_time, run_duration, message,
           ROW_NUMBER() OVER (PARTITION BY job_id ORDER BY run_date DESC, run_time DESC) AS rn
    FROM msdb.dbo.sysjobhistory
    WHERE step_id = 0
) jh ON j.job_id = jh.job_id AND jh.rn = 1
WHERE j.name LIKE '%backup%' OR j.name LIKE '%maintenance%' OR j.name LIKE '%PACS%'
ORDER BY j.name;

PRINT '';

-- =============================================
-- 14. BACKUP HISTORY (Last 7 Days)
-- =============================================
PRINT '14. BACKUP HISTORY (Last 7 Days - PACS Databases)';
PRINT '-------------------------------------';

SELECT 
    bs.database_name AS DatabaseName,
    CASE bs.type
        WHEN 'D' THEN 'Full'
        WHEN 'I' THEN 'Differential'
        WHEN 'L' THEN 'Log'
    END AS BackupType,
    bs.backup_start_date AS BackupStartDate,
    bs.backup_finish_date AS BackupFinishDate,
    DATEDIFF(SECOND, bs.backup_start_date, bs.backup_finish_date) AS DurationSeconds,
    (bs.backup_size / 1024 / 1024) AS BackupSizeMB,
    (bs.compressed_backup_size / 1024 / 1024) AS CompressedSizeMB,
    CAST((bs.backup_size - bs.compressed_backup_size) * 100.0 / bs.backup_size AS DECIMAL(5,2)) AS CompressionPercent,
    bmf.physical_device_name AS BackupLocation,
    bs.server_name AS ServerName,
    bs.recovery_model AS RecoveryModel
FROM msdb.dbo.backupset bs
JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
WHERE 
    bs.database_name IN ('pacs_oltp', 'PACS_Training', 'CIAPS', 'TA_AppSvr', 'Web_Internet_Benton')
    AND bs.backup_start_date > DATEADD(DAY, -7, GETDATE())
ORDER BY bs.database_name, bs.backup_start_date DESC;

PRINT '';

-- =============================================
-- 15. DATABASE FILE SIZES AND GROWTH
-- =============================================
PRINT '15. DATABASE FILE SIZES AND GROWTH (PACS Databases)';
PRINT '-------------------------------------';

SELECT 
    DB_NAME(mf.database_id) AS DatabaseName,
    mf.name AS LogicalFileName,
    mf.type_desc AS FileType,
    mf.physical_name AS PhysicalPath,
    (mf.size * 8 / 1024) AS CurrentSizeMB,
    (mf.size * 8 / 1024 / 1024) AS CurrentSizeGB,
    CASE 
        WHEN mf.is_percent_growth = 1 THEN CAST(mf.growth AS varchar) + '%'
        ELSE CAST((mf.growth * 8 / 1024) AS varchar) + ' MB'
    END AS GrowthSetting,
    CASE 
        WHEN mf.max_size = -1 THEN 'Unlimited'
        WHEN mf.max_size = 268435456 THEN 'Unlimited (2TB)'
        ELSE CAST((mf.max_size * 8 / 1024) AS varchar) + ' MB'
    END AS MaxSize,
    mf.state_desc AS State
FROM sys.master_files mf
WHERE DB_NAME(mf.database_id) IN ('pacs_oltp', 'PACS_Training', 'CIAPS', 'TA_AppSvr', 'Web_Internet_Benton', 'tempdb')
ORDER BY DB_NAME(mf.database_id), mf.type DESC, mf.file_id;

PRINT '';

-- =============================================
-- 16. QUERY STORE CONFIGURATION (if enabled)
-- =============================================
PRINT '16. QUERY STORE CONFIGURATION (PACS Databases)';
PRINT '-------------------------------------';

SELECT 
    db.name AS DatabaseName,
    db.is_query_store_on AS QueryStoreEnabled,
    qso.desired_state_desc AS DesiredState,
    qso.actual_state_desc AS ActualState,
    qso.readonly_reason AS ReadOnlyReason,
    qso.current_storage_size_mb AS CurrentStorageSizeMB,
    qso.max_storage_size_mb AS MaxStorageSizeMB,
    qso.query_capture_mode_desc AS QueryCaptureMode,
    qso.size_based_cleanup_mode_desc AS CleanupMode,
    qso.stale_query_threshold_days AS StaleQueryThresholdDays,
    qso.max_plans_per_query AS MaxPlansPerQuery
FROM sys.databases db
LEFT JOIN sys.database_query_store_options qso ON db.database_id = qso.database_id
WHERE db.name IN ('pacs_oltp', 'PACS_Training', 'CIAPS', 'TA_AppSvr', 'Web_Internet_Benton')
ORDER BY db.name;

PRINT '';

-- =============================================
-- 17. BLOCKING AND DEADLOCKS
-- =============================================
PRINT '17. CURRENT BLOCKING (if any)';
PRINT '-------------------------------------';

SELECT 
    t1.session_id AS BlockedSessionID,
    t1.wait_type AS WaitType,
    t1.wait_time AS WaitTimeMS,
    t1.wait_resource AS WaitResource,
    t2.session_id AS BlockingSessionID,
    DB_NAME(t1.database_id) AS DatabaseName,
    t1.command AS Command,
    st1.text AS BlockedQueryText,
    st2.text AS BlockingQueryText,
    s1.login_name AS BlockedLoginName,
    s2.login_name AS BlockingLoginName,
    s1.host_name AS BlockedHostName,
    s2.host_name AS BlockingHostName,
    s1.program_name AS BlockedProgramName,
    s2.program_name AS BlockingProgramName
FROM sys.dm_exec_requests t1
JOIN sys.dm_exec_sessions s1 ON t1.session_id = s1.session_id
CROSS APPLY sys.dm_exec_sql_text(t1.sql_handle) st1
LEFT JOIN sys.dm_exec_requests t2 ON t1.blocking_session_id = t2.session_id
LEFT JOIN sys.dm_exec_sessions s2 ON t2.session_id = s2.session_id
OUTER APPLY sys.dm_exec_sql_text(t2.sql_handle) st2
WHERE t1.blocking_session_id <> 0;

IF @@ROWCOUNT = 0
    PRINT 'No blocking detected';

PRINT '';

-- =============================================
-- SUMMARY AND RECOMMENDATIONS
-- =============================================
PRINT '';
PRINT '======================================';
PRINT 'ANALYSIS COMPLETE';
PRINT 'Finished: ' + CONVERT(varchar, GETDATE(), 120);
PRINT '======================================';
PRINT '';
PRINT 'NEXT STEPS:';
PRINT '1. Review wait statistics - optimize based on top wait types';
PRINT '2. Review missing indexes - create high-impact indexes';
PRINT '3. Review index fragmentation - schedule rebuild/reorganize';
PRINT '4. Review backup history - ensure all databases backed up';
PRINT '5. Review configuration settings - adjust based on workload';
PRINT '6. Document findings in SERVER_ARCHITECTURE_FINDINGS.md';
PRINT '';

-- Reset context to master
USE master;
GO
