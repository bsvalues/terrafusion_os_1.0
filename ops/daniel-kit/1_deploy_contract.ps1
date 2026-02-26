<#
.SYNOPSIS
    Step 1: Deploy TerraFusion contract views, procedure, and indexes.
.DESCRIPTION
    Copies pacs-contract-views.sql into the tf-mssql container and executes it.
    Creates 3 views, 1 stored procedure, 3 indexes on pacs_oltp.
#>
param(
    [string]$SaPassword = "TF_Pacs2026!",
    [string]$ContainerName = "tf-mssql"
)
$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path "$PSScriptRoot/../..").Path

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Step 1: Deploy Contract Views               ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verify container is running
$state = docker inspect -f '{{.State.Status}}' $ContainerName 2>$null
if ($state -ne "running") {
    Write-Host "  [FAIL] Container '$ContainerName' is not running (state: $state)" -ForegroundColor Red
    Write-Host "  Run 0_restore.ps1 first." -ForegroundColor Yellow
    exit 1
}

# Copy SQL into container
$sqlFile = Join-Path $repoRoot "ops/dev/pacs-contract-views.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "  [FAIL] Cannot find $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "  Copying contract views SQL into container..." -ForegroundColor DarkGray
docker cp $sqlFile "${ContainerName}:/tmp/pacs-contract-views.sql"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] docker cp failed" -ForegroundColor Red
    exit 1
}

# Execute SQL
Write-Host "  Deploying views, procedure, indexes..." -ForegroundColor DarkGray
$output = docker exec $ContainerName /opt/mssql-tools18/bin/sqlcmd `
    -S localhost -U sa -P $SaPassword -C `
    -i /tmp/pacs-contract-views.sql 2>&1 | Out-String

Write-Host $output

# Verify deployment
$viewCount = docker exec $ContainerName /opt/mssql-tools18/bin/sqlcmd `
    -S localhost -U sa -P $SaPassword -C -d pacs_oltp -h -1 -W `
    -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.views WHERE name LIKE 'vw_TerraFusion%';" 2>$null
$viewCount = ($viewCount | Out-String).Trim()

if ([int]$viewCount -eq 3) {
    Write-Host "  [DONE] Step 1 complete. 3 views, 1 procedure, indexes deployed." -ForegroundColor Green
    exit 0
} else {
    Write-Host "  [FAIL] Expected 3 views, found $viewCount" -ForegroundColor Red
    exit 1
}
