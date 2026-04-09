Param(
    [string]$Password = $(if ($env:SA_PASSWORD) { $env:SA_PASSWORD } else { 'TF_Pacs2026!' }),
    [string]$Image = "mcr.microsoft.com/mssql/server:2019-latest",
    [string]$Name = "mssql-diag-2019",
    [int]$HostPort = 14333,
    [switch]$Cleanup
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "[diag] Removing any existing '$Name' container (ignore errors)" -ForegroundColor Cyan
try { docker rm -f $Name | Out-Null } catch {}

Write-Host "[diag] Starting container $Name from $Image (no volume)" -ForegroundColor Cyan
docker run --name $Name -e ACCEPT_EULA=Y -e SA_PASSWORD="$Password" -e MSSQL_PID=Developer --publish=$HostPort:1433 -d $Image | Out-Null

Write-Host "[diag] Waiting for SQL to accept connections..." -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    $rc = 0
    & docker exec $Name /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$Password" -Q "SELECT 1" -b -C 2>$null | Out-Null
    $rc = $LASTEXITCODE
    if ($rc -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 2
}

if (-not $ready) {
    Write-Host "[diag] SQL did not become ready in time. Recent logs:" -ForegroundColor Yellow
    docker logs --tail 120 $Name
    if ($Cleanup) { docker rm -f $Name | Out-Null }
    exit 1
}

Write-Host "[diag] Connected. Server version:" -ForegroundColor Green
docker exec $Name /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "$Password" -Q "SELECT @@VERSION" -C

if ($Cleanup) {
    Write-Host "[diag] Cleaning up container $Name" -ForegroundColor Cyan
    docker rm -f $Name | Out-Null
}

Write-Host "[diag] Done." -ForegroundColor Green
