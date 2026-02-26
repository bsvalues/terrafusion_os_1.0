<#
.SYNOPSIS
    Validates the TerraFusion pacscontract.v1 abstraction layer.
.DESCRIPTION
    Mirrors PacsSqlAdapter.ValidateContractAsync exactly:
      1. Database connectivity (pacs_oltp)
      2. Three views exist
      3. Three indexes exist
      4. sp_TerraFusion_HealthCheck exists and runs
      5. Property read (by ID and GeoID)
      6. Ownership + Assessment History queries
    Exit 0 = all checks pass. Exit 1 = failure.
.PARAMETER SaPassword
    SQL Server SA password. Default: TF_Pacs2026!
.PARAMETER ContainerName
    Docker container name. Default: tf-mssql
#>
param(
    [string]$SaPassword = "TF_Pacs2026!",
    [string]$ContainerName = "tf-mssql"
)

$ErrorActionPreference = "Stop"
$pass = 0
$fail = 0

function Check([string]$Name, [scriptblock]$Test) {
    try {
        $result = & $Test
        if ($result) {
            Write-Host "  [PASS] $Name" -ForegroundColor Green
            $script:pass++
        } else {
            Write-Host "  [FAIL] $Name" -ForegroundColor Red
            $script:fail++
        }
    } catch {
        Write-Host "  [FAIL] $Name — $($_.Exception.Message)" -ForegroundColor Red
        $script:fail++
    }
}

function SqlQuery([string]$Query) {
    $raw = docker exec $ContainerName /opt/mssql-tools18/bin/sqlcmd `
        -S localhost -U sa -P $SaPassword -C -d pacs_oltp `
        -h -1 -W -Q "SET NOCOUNT ON; $Query" 2>&1 | Out-String
    return $raw.Trim()
}

Write-Host ""
Write-Host "=== TerraFusion pacscontract.v1 — Contract Proof ===" -ForegroundColor Cyan
Write-Host ""

# ── Gate: Container running ──────────────────────────────────────────────────
Write-Host "Container:" -ForegroundColor Yellow
Check "Docker container '$ContainerName' is running" {
    $state = docker inspect -f '{{.State.Status}}' $ContainerName 2>$null
    $state -eq "running"
}

# ── 1. Database connectivity ─────────────────────────────────────────────────
Write-Host "Database:" -ForegroundColor Yellow
Check "Connected to pacs_oltp" {
    $db = SqlQuery "SELECT DB_NAME();"
    $db -match "pacs_oltp"
}

# ── 2. Views ─────────────────────────────────────────────────────────────────
Write-Host "Views:" -ForegroundColor Yellow
$requiredViews = @(
    "vw_TerraFusion_Property_Core",
    "vw_TerraFusion_Property_Ownership",
    "vw_TerraFusion_Assessment_History"
)
foreach ($v in $requiredViews) {
    Check "View '$v' exists" {
        $count = SqlQuery "SELECT COUNT(*) FROM sys.views WHERE name = '$v';"
        [int]$count -eq 1
    }
}

# ── 3. Stored Procedure ─────────────────────────────────────────────────────
Write-Host "Procedures:" -ForegroundColor Yellow
Check "sp_TerraFusion_HealthCheck exists" {
    $count = SqlQuery "SELECT COUNT(*) FROM sys.procedures WHERE name = 'sp_TerraFusion_HealthCheck';"
    [int]$count -eq 1
}

Check "sp_TerraFusion_HealthCheck returns HEALTHY" {
    $result = SqlQuery "EXEC sp_TerraFusion_HealthCheck;"
    $result -match "HEALTHY"
}

# ── 4. Indexes (warning-only per contract) ───────────────────────────────────
Write-Host "Indexes:" -ForegroundColor Yellow
$requiredIndexes = @(
    "IX_TerraFusion_Property_GeoID",
    "IX_TerraFusion_PropertyVal_PropYear",
    "IX_TerraFusion_Situs_Property"
)
foreach ($ix in $requiredIndexes) {
    Check "Index '$ix' exists" {
        $count = SqlQuery "SELECT COUNT(*) FROM sys.indexes WHERE name = '$ix';"
        [int]$count -eq 1
    }
}

# ── 5. Data queries (mirrors PacsSqlAdapter methods) ─────────────────────────
Write-Host "Data:" -ForegroundColor Yellow

Check "Property Core view has rows (>100K)" {
    $count = SqlQuery "SELECT COUNT(*) FROM vw_TerraFusion_Property_Core;"
    [int]$count -gt 100000
}

Check "Ownership view has rows (>200K)" {
    $count = SqlQuery "SELECT COUNT(*) FROM vw_TerraFusion_Property_Ownership;"
    [int]$count -gt 200000
}

Check "Assessment History view has rows (>1M)" {
    $count = SqlQuery "SELECT COUNT(*) FROM vw_TerraFusion_Assessment_History;"
    [int]$count -gt 1000000
}

Check "GetPropertyByIdAsync — returns columns for prop_id 10007" {
    $result = SqlQuery "SELECT prop_id, geo_id, assessed_val FROM vw_TerraFusion_Property_Core WHERE prop_id = 10007;"
    $result -match "10007" -and $result -match "101040000000000"
}

Check "GetPropertyByGeoIdAsync — geo_id lookup works" {
    $result = SqlQuery "SELECT TOP 1 prop_id FROM vw_TerraFusion_Property_Core WHERE geo_id = '101040000000000';"
    [int]($result.Trim()) -eq 10007
}

Check "GetOwnershipAsync — returns owner data" {
    $result = SqlQuery "SELECT TOP 1 owner_name FROM vw_TerraFusion_Property_Ownership WHERE prop_id = 10007;"
    $result -match "MILLER"
}

Check "GetAssessmentHistoryAsync — returns history" {
    $count = SqlQuery "SELECT COUNT(*) FROM vw_TerraFusion_Assessment_History WHERE prop_id = 10007;"
    [int]$count -ge 5
}

Check "GetChangedPropertiesAsync — delta sync query works" {
    $count = SqlQuery "SELECT COUNT(*) FROM vw_TerraFusion_Property_Core WHERE last_modified >= '2014-01-01';"
    [int]$count -gt 0
}

# ── Summary ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  pacscontract.v1 Proof: $pass PASS / $fail FAIL" -ForegroundColor $(if ($fail -eq 0) {"Green"} else {"Red"})
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($fail -gt 0) {
    Write-Host "Contract validation FAILED. $fail check(s) did not pass." -ForegroundColor Red
    exit 1
}

Write-Host "Contract fully satisfied. PacsSqlAdapter will pass ValidateContractAsync." -ForegroundColor Green
exit 0
