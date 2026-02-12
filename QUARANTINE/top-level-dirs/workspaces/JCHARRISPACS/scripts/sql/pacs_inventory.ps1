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

-- Schemas (user-defined)
INSERT INTO @inventory
SELECT 'schemas' AS object_type, COUNT(*) AS object_count
FROM sys.schemas
WHERE schema_id > 4 AND schema_id < 16384;

-- Users
INSERT INTO @inventory
SELECT 'users' AS object_type, COUNT(*) AS object_count
FROM sys.database_principals
WHERE type IN ('S', 'U') AND principal_id > 4;

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
        WHEN 'total_objects' THEN 9
    END;
"@

try {
    # Execute SQL query via sqlcmd
    $result = sqlcmd -S $Server -d $Database -U $Username -P $Password -W -h-1 -Q $query
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: sqlcmd failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
    
    # Parse pipe-delimited results into hashtable
    $inventory = @{}
    foreach ($line in $result) {
        if ($line -match '^\s*$') { continue }  # Skip empty lines
        $parts = $line.Split('|')
        if ($parts.Count -eq 2) {
            $key = $parts[0].Trim()
            $value = [int]$parts[1].Trim()
            $inventory[$key] = $value
        }
    }
    
    if ($inventory.Count -eq 0) {
        Write-Host "⚠️  Warning: No inventory data returned" -ForegroundColor Yellow
        exit 1
    }
    
    # Build JSON output
    $json = @{
        database  = $Database
        server    = $Server
        timestamp = (Get-Date -Format "o")
        summary   = $inventory
        metadata  = @{
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
    Write-Host "   Tables:      $($inventory['tables'])" -ForegroundColor White
    Write-Host "   Procedures:  $($inventory['procedures'])" -ForegroundColor White
    Write-Host "   Views:       $($inventory['views'])" -ForegroundColor White
    Write-Host "   Triggers:    $($inventory['triggers'])" -ForegroundColor White
    Write-Host "   Functions:   $($inventory['functions'])" -ForegroundColor White
    Write-Host "   Synonyms:    $($inventory['synonyms'])" -ForegroundColor White
    Write-Host "   Total:       $($inventory['total_objects'])" -ForegroundColor Yellow
    
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
