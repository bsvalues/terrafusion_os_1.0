<#
.SYNOPSIS
    Step 3: Query real Benton County parcels through TerraFusion views.
.DESCRIPTION
    Reads real property data and writes parcel-sample.txt to the proof bundle.
    Demonstrates all three adapter query paths: Core, Ownership, History.
#>
param(
    [string]$SaPassword = "TF_Pacs2026!",
    [string]$ContainerName = "tf-mssql"
)
$ErrorActionPreference = "Stop"
$bundleDir = Join-Path $PSScriptRoot "proof-bundle"
if (-not (Test-Path $bundleDir)) { New-Item -ItemType Directory -Path $bundleDir -Force | Out-Null }

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Step 3: Live Parcel Query                   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

function SqlQuery([string]$Query) {
    $raw = docker exec $ContainerName /opt/mssql-tools18/bin/sqlcmd `
        -S localhost -U sa -P $SaPassword -C -d pacs_oltp `
        -W -Q "SET NOCOUNT ON; $Query" 2>&1 | Out-String
    return $raw.Trim()
}

$sampleFile = Join-Path $bundleDir "parcel-sample.txt"
$lines = @()

$lines += "═══════════════════════════════════════════════════════════"
$lines += "  TerraFusion OS — Live Parcel Sample"
$lines += "  Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC' -AsUTC)"
$lines += "═══════════════════════════════════════════════════════════"
$lines += ""

# Pick 3 real properties with different characteristics
$propIds = SqlQuery "SELECT TOP 3 prop_id FROM vw_TerraFusion_Property_Core WHERE geo_id IS NOT NULL AND assessed_val > 0 AND situs_city IS NOT NULL ORDER BY prop_id;"
$ids = ($propIds -split "`n" | Where-Object { $_ -match '^\s*\d+\s*$' } | ForEach-Object { $_.Trim() }) | Select-Object -First 3

if ($ids.Count -eq 0) {
    # Fallback to any property
    $ids = @("10007")
}

foreach ($id in $ids) {
    Write-Host "  Querying property $id..." -ForegroundColor DarkGray

    $lines += "──────────────────────────────────────────────────────────"
    $lines += "  PROPERTY: $id"
    $lines += "──────────────────────────────────────────────────────────"
    $lines += ""

    # Core
    $lines += "  ── Property Core (vw_TerraFusion_Property_Core) ──"
    $core = SqlQuery "SELECT prop_id, geo_id, prop_type_cd, situs_addr, situs_city, situs_zip, assessed_val, market_val, land_val, imprv_val, appr_year FROM vw_TerraFusion_Property_Core WHERE prop_id = $id;"
    $lines += $core
    $lines += ""

    # Ownership
    $lines += "  ── Ownership (vw_TerraFusion_Property_Ownership) ──"
    $own = SqlQuery "SELECT TOP 3 prop_id, owner_name, mail_addr_1, mail_city, mail_state, mail_zip, pct_ownership FROM vw_TerraFusion_Property_Ownership WHERE prop_id = $id;"
    $lines += $own
    $lines += ""

    # Assessment History
    $lines += "  ── Assessment History (vw_TerraFusion_Assessment_History, last 5 years) ──"
    $hist = SqlQuery "SELECT TOP 5 prop_val_yr, assessed_val, market_val, land_val, imprv_val FROM vw_TerraFusion_Assessment_History WHERE prop_id = $id ORDER BY prop_val_yr DESC;"
    $lines += $hist
    $lines += ""
}

# Summary stats
$lines += "══════════════════════════════════════════════════════════"
$lines += "  DATABASE SUMMARY"
$lines += "══════════════════════════════════════════════════════════"
$totalCore = SqlQuery "SELECT COUNT(*) FROM vw_TerraFusion_Property_Core;"
$totalOwn = SqlQuery "SELECT COUNT(*) FROM vw_TerraFusion_Property_Ownership;"
$totalHist = SqlQuery "SELECT COUNT(*) FROM vw_TerraFusion_Assessment_History;"
$lines += "  Property Core rows:       $totalCore"
$lines += "  Ownership rows:            $totalOwn"
$lines += "  Assessment History rows:   $totalHist"
$lines += ""
$lines += "  Contract: pacscontract.v1"
$lines += "  Database: pacs_oltp"

$lines -join "`n" | Out-File -FilePath $sampleFile -Encoding UTF8

Write-Host ""
Write-Host "  [DONE] Parcel sample written to proof-bundle/parcel-sample.txt" -ForegroundColor Green
Write-Host "  Properties queried: $($ids -join ', ')" -ForegroundColor White
exit 0
