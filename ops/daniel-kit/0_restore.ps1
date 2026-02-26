<#
.SYNOPSIS
    Step 0: Restore PACS database from archived backups.
.DESCRIPTION
    Delegates to the proven restore pipeline. Creates tf-mssql container
    with pacs_oltp database (112,057 Benton County properties).
#>
param(
    [string]$SaPassword = "TF_Pacs2026!"
)
$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path "$PSScriptRoot/../..").Path

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Step 0: Restore PACS Database               ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if already restored
$containerState = docker inspect -f '{{.State.Status}}' tf-mssql 2>$null
if ($containerState -eq "running") {
    $dbCheck = docker exec tf-mssql /opt/mssql-tools18/bin/sqlcmd `
        -S localhost -U sa -P $SaPassword -C -h -1 -W `
        -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name = 'pacs_oltp';" 2>$null
    if ($dbCheck -and [int]($dbCheck.Trim()) -eq 1) {
        Write-Host "  [SKIP] pacs_oltp already exists on tf-mssql. Skipping restore." -ForegroundColor Yellow
        Write-Host "  To force re-restore, run: docker rm -f tf-mssql" -ForegroundColor DarkGray
        exit 0
    }
}

# Run the proven restore pipeline
$restoreScript = Join-Path $repoRoot "ops/dev/restore-pacs-from-archives.ps1"
if (-not (Test-Path $restoreScript)) {
    Write-Host "  [FAIL] Cannot find $restoreScript" -ForegroundColor Red
    exit 1
}

& pwsh $restoreScript -SaPassword $SaPassword
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
    Write-Host "  [FAIL] Restore failed with exit code $exitCode" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "  [DONE] Step 0 complete. pacs_oltp is live." -ForegroundColor Green
exit 0
