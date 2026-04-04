# Benton County PACS - Database Object Inventory Script
# Generates JSON report of tables, procedures, views, triggers, synonyms
# Usage: ./pacs_inventory.ps1 -Server "localhost,1433" -Database "pacs_oltp" -Username "sa" -Password "P@ssw0rd123!"

param(
    [Parameter(Mandatory = $true)]
    [string]$Server,
    
    [Parameter(Mandatory = $true)]
    [string]$Database,
    
    [Parameter(Mandatory = $true)]
    [string]$Username,
    
    [Parameter(Mandatory = $true)]
    [string]$Password,
    
    [Parameter(Mandatory = $false)]
    [string]$OutputPath = "./_artifacts/pacs_inventory.json"
)

$ErrorActionPreference = "Stop"

Write-Host "📊 Benton County PACS - Database Inventory" -ForegroundColor Cyan
Write-Host "   Server: $Server" -ForegroundColor Gray
Write-Host "   Database: $Database" -ForegroundColor Gray
Write-Host ""

# SQL query to count database objects
$query = @"
SET NOCOUNT ON;

DECLARE @inventory TABLE (
    object_type NVARCHAR(50),
    object_count INT
);

-- Tables
INSERT INTO @inventory
SELECT 'tables' AS object_type, COUNT(*) AS object_count
FROM sys.tables
WHERE type = 'U' AND is_ms_shipped = 0;

-- Stored Procedures
INSERT INTO @inventory
SELECT 'procedures' AS object_type, COUNT(*) AS object_count
FROM sys.procedures
WHERE type = 'P' AND is_ms_shipped = 0;

-- Views
INSERT INTO @inventory
SELECT 'views' AS object_type, COUNT(*) AS object_count
FROM sys.views
WHERE type = 'V' AND is_ms_shipped = 0;

-- Triggers
INSERT INTO @inventory
SELECT 'triggers' AS object_type, COUNT(*) AS object_count
FROM sys.triggers
WHERE parent_id <> 0 AND is_ms_shipped = 0;

-- Functions (scalar + table-valued)
INSERT INTO @inventory
SELECT 'functions' AS object_type, COUNT(*) AS object_count
FROM sys.objects
WHERE type IN ('FN', 'IF', 'TF') AND is_ms_shipped = 0;

-- Synonyms
INSERT INTO @inventory
SELECT 'synonyms' AS object_type, COUNT(*) AS object_count
FROM sys.synonyms;

-- Schemas (user-defined — excludes built-in system schemas by name)
INSERT INTO @inventory
SELECT 'schemas' AS object_type, COUNT(*) AS object_count
FROM sys.schemas
WHERE name NOT IN (
    'sys','INFORMATION_SCHEMA','guest','public',
    'db_owner','db_accessadmin','db_securityadmin','db_ddladmin',
    'db_backupoperator','db_datareader','db_datawriter',
    'db_denydatareader','db_denydatawriter'
);

-- Users
INSERT INTO @inventory
SELECT 'users' AS object_type, COUNT(*) AS object_count
FROM sys.database_principals
WHERE type IN ('S', 'U') AND principal_id > 4;

-- Indexes (user-defined, on user tables)
INSERT INTO @inventory
SELECT 'indexes' AS object_type, COUNT(*) AS object_count
FROM sys.indexes i
INNER JOIN sys.tables t ON t.object_id = i.object_id
WHERE t.is_ms_shipped = 0 AND i.index_id > 0;

-- Foreign keys
INSERT INTO @inventory
SELECT 'foreign_keys' AS object_type, COUNT(*) AS object_count
FROM sys.foreign_keys
WHERE is_ms_shipped = 0;

-- Total objects
INSERT INTO @inventory
SELECT 'total_objects' AS object_type, 
       SUM(object_count) AS object_count
FROM @inventory
WHERE object_type <> 'total_objects';

-- Return results as pipe-delimited
SELECT object_type + '|' + CAST(object_count AS VARCHAR(20)) AS result
FROM @inventory
ORDER BY 
    CASE object_type
        WHEN 'tables' THEN 1
        WHEN 'procedures' THEN 2
        WHEN 'views' THEN 3
        WHEN 'triggers' THEN 4
        WHEN 'functions' THEN 5
        WHEN 'synonyms' THEN 6
        WHEN 'schemas' THEN 7
        WHEN 'users' THEN 8
        WHEN 'indexes' THEN 9
        WHEN 'foreign_keys' THEN 10
        WHEN 'total_objects' THEN 99
    END;

-- Row counts for key operational tables (section header + rows)
SELECT 'ROWCOUNTS' AS result;
SELECT 'rc_property|'       + CAST(COUNT(*) AS VARCHAR(20)) FROM dbo.property WITH(NOLOCK);
SELECT 'rc_owner|'          + CAST(COUNT(*) AS VARCHAR(20)) FROM dbo.owner WITH(NOLOCK);
SELECT 'rc_property_val|'   + CAST(COUNT(*) AS VARCHAR(20)) FROM dbo.property_val WITH(NOLOCK);
SELECT 'rc_situs|'          + CAST(COUNT(*) AS VARCHAR(20)) FROM dbo.situs WITH(NOLOCK);

-- Schema breakdown: table count per schema (exclude built-in system schemas by name)
SELECT 'SCHEMABKD' AS result;
SELECT s.name + '|' + CAST(COUNT(t.object_id) AS VARCHAR(20)) AS result
FROM sys.schemas s
LEFT JOIN sys.tables t ON t.schema_id = s.schema_id AND t.is_ms_shipped = 0
WHERE s.name NOT IN (
    'sys','INFORMATION_SCHEMA','guest','public',
    'db_owner','db_accessadmin','db_securityadmin','db_ddladmin',
    'db_backupoperator','db_datareader','db_datawriter',
    'db_denydatareader','db_denydatawriter'
)
GROUP BY s.name
HAVING COUNT(t.object_id) > 0
ORDER BY COUNT(t.object_id) DESC;
"@

try {
    # Execute SQL query via docker exec (sqlcmd not required on host)
    $sqlPw = if ($Password) { $Password } else { "TF_Pacs2026!" }
    # stdin-only args: no -Q so the piped query drives execution
    $sqlcmdStdinArgs = @("-S", "localhost", "-U", $Username, "-P", $sqlPw, "-d", $Database, "-C", "-W", "-h-1")

    # Prefer local sqlcmd; fall back to docker exec tf-mssql
    if (Get-Command sqlcmd -ErrorAction SilentlyContinue) {
        $result = $query | sqlcmd -S $Server -d $Database -U $Username -P $sqlPw -C -W -h-1
    } elseif ((docker inspect -f '{{.State.Running}}' tf-mssql 2>$null) -eq 'true') {
        Write-Host "  (sqlcmd not found on host — using docker exec tf-mssql)" -ForegroundColor Gray
        $result = $query | docker exec -i tf-mssql /opt/mssql-tools18/bin/sqlcmd @sqlcmdStdinArgs
    } else {
        Write-Host "❌ Neither sqlcmd nor a running tf-mssql container found." -ForegroundColor Red
        Write-Host "   Start SQL Server: .\Make.ps1 docker-up" -ForegroundColor Yellow
        exit 1
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: sqlcmd failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
    
    # Parse pipe-delimited results — three sections divided by header rows
    $inventory      = @{}
    $rowCounts      = @{}
    $schemaBreakdown = [System.Collections.Generic.List[hashtable]]::new()
    $section        = "summary"

    foreach ($line in $result) {
        if ($line -match '^\s*$') { continue }
        $trimmed = $line.Trim()
        if ($trimmed -eq 'ROWCOUNTS') { $section = "rowcounts"; continue }
        if ($trimmed -eq 'SCHEMABKD') { $section = "schema";   continue }

        $parts = $trimmed.Split('|')
        if ($parts.Count -ne 2) { continue }
        $key = $parts[0].Trim(); $val = $parts[1].Trim()

        switch ($section) {
            "summary"  { $inventory[$key] = [int]$val }
            "rowcounts" {
                # strip 'rc_' prefix for cleaner JSON
                $rowCounts[$key -replace '^rc_',''] = [int]$val
            }
            "schema"   {
                $schemaBreakdown.Add(@{ schema = $key; tables = [int]$val }) | Out-Null
            }
        }
    }
    
    if ($inventory.Count -eq 0) {
        Write-Host "⚠️  Warning: No inventory data returned" -ForegroundColor Yellow
        exit 1
    }
    
    # Build JSON output
    $json = @{
        database         = $Database
        server           = $Server
        timestamp        = (Get-Date -Format "o")
        summary          = $inventory
        row_counts       = $rowCounts
        schema_breakdown = $schemaBreakdown
        metadata         = @{
            validated_date = (Get-Date -Format "yyyy-MM-dd")
            snapshot_type  = "observed_in_benton"
            note           = "Counts exclude system objects (is_ms_shipped=0)"
        }
    } | ConvertTo-Json -Depth 10
    
    # Ensure output directory exists
    $outputDir = Split-Path -Parent $OutputPath
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    }
    
    # Write to file
    $json | Out-File -FilePath $OutputPath -Encoding UTF8
    
    Write-Host "✅ Inventory complete!" -ForegroundColor Green
    Write-Host "   Output: $OutputPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "   Tables:        $($inventory['tables'])" -ForegroundColor White
    Write-Host "   Procedures:    $($inventory['procedures'])" -ForegroundColor White
    Write-Host "   Views:         $($inventory['views'])" -ForegroundColor White
    Write-Host "   Triggers:      $($inventory['triggers'])" -ForegroundColor White
    Write-Host "   Functions:     $($inventory['functions'])" -ForegroundColor White
    Write-Host "   Synonyms:      $($inventory['synonyms'])" -ForegroundColor White
    Write-Host "   Indexes:       $($inventory['indexes'])" -ForegroundColor White
    Write-Host "   Foreign Keys:  $($inventory['foreign_keys'])" -ForegroundColor White
    Write-Host "   Total:         $($inventory['total_objects'])" -ForegroundColor Yellow
    if ($rowCounts.Count -gt 0) {
        Write-Host ""
        Write-Host "Row counts:" -ForegroundColor Cyan
        foreach ($k in ($rowCounts.Keys | Sort-Object)) {
            Write-Host "   $k : $($rowCounts[$k])" -ForegroundColor White
        }
    }
    
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
