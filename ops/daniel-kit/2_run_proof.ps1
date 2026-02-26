<#
.SYNOPSIS
    Step 2: Run contract proof and collect proof bundle artifacts.
.DESCRIPTION
    1. Runs 18-check contract test (writes contract-checks.log)
    2. Starts the .NET API (if not already running)
    3. Hits /ops/pacs/proof (writes proof.json)
    4. Captures environment state (writes environment.txt)
    All artifacts written to proof-bundle/ directory.
#>
param(
    [string]$SaPassword = "TF_Pacs2026!",
    [string]$ContainerName = "tf-mssql",
    [int]$ApiPort = 5000
)
$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path "$PSScriptRoot/../..").Path
$bundleDir = Join-Path $PSScriptRoot "proof-bundle"

# Create proof-bundle directory
if (-not (Test-Path $bundleDir)) { New-Item -ItemType Directory -Path $bundleDir -Force | Out-Null }

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Step 2: Contract Proof + Bundle             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# ── Phase 1: Contract checks (18-check suite) ────────────────────────────────
Write-Host "  Phase 1: Running 18-check contract validation..." -ForegroundColor Yellow
$contractScript = Join-Path $repoRoot "ops/dev/test-pacs-contract.ps1"
$logFile = Join-Path $bundleDir "contract-checks.log"

$contractOutput = & pwsh $contractScript -SaPassword $SaPassword -ContainerName $ContainerName 2>&1 | Out-String
$contractOutput | Out-File -FilePath $logFile -Encoding UTF8
$contractExit = $LASTEXITCODE

# Show summary
$summaryLine = ($contractOutput -split "`n" | Where-Object { $_ -match "PASS.*FAIL" }) -join ""
if ($summaryLine) { Write-Host "  $($summaryLine.Trim())" -ForegroundColor $(if ($contractExit -eq 0) {"Green"} else {"Red"}) }

if ($contractExit -ne 0) {
    Write-Host "  [WARN] Contract checks had failures. See contract-checks.log" -ForegroundColor Yellow
    $allPassed = $false
}

# ── Phase 2: API proof endpoint ──────────────────────────────────────────────
Write-Host ""
Write-Host "  Phase 2: Getting API contract proof..." -ForegroundColor Yellow
$proofFile = Join-Path $bundleDir "proof.json"

# Check if API is already running
$apiRunning = $false
try {
    $health = Invoke-WebRequest -Uri "http://localhost:$ApiPort/health" -TimeoutSec 3 -ErrorAction Stop
    if ($health.StatusCode -eq 200) { $apiRunning = $true }
} catch { $apiRunning = $false }

$weStartedApi = $false
if (-not $apiRunning) {
    Write-Host "  API not running. Starting TerraFusion.API..." -ForegroundColor DarkGray
    $apiProject = Join-Path $repoRoot "backend/src/TerraFusion.API/TerraFusion.API.csproj"

    if (-not (Test-Path $apiProject)) {
        Write-Host "  [FAIL] Cannot find $apiProject" -ForegroundColor Red
        # Still write what we have
        @{ error = "API project not found"; contractChecks = $contractExit -eq 0 } |
            ConvertTo-Json | Out-File -FilePath $proofFile -Encoding UTF8
        $allPassed = $false
    } else {
        $env:ASPNETCORE_ENVIRONMENT = "Development"
        $apiProcess = Start-Process -FilePath "dotnet" `
            -ArgumentList "run","--project",$apiProject,"--no-build" `
            -WorkingDirectory (Join-Path $repoRoot "backend") `
            -PassThru -WindowStyle Hidden
        $weStartedApi = $true

        # Wait for API to start (up to 30 seconds)
        $waited = 0
        while ($waited -lt 30) {
            Start-Sleep -Seconds 2
            $waited += 2
            try {
                $h = Invoke-WebRequest -Uri "http://localhost:$ApiPort/health" -TimeoutSec 2 -ErrorAction Stop
                if ($h.StatusCode -eq 200) { break }
            } catch {}
        }

        if ($waited -ge 30) {
            Write-Host "  [FAIL] API did not start within 30 seconds" -ForegroundColor Red
            $allPassed = $false
        }
    }
}

# Hit proof endpoint
try {
    $proofResponse = Invoke-WebRequest -Uri "http://localhost:$ApiPort/ops/pacs/proof" -TimeoutSec 30 -ErrorAction Stop
    $proofJson = $proofResponse.Content | ConvertFrom-Json
    $proofResponse.Content | ConvertTo-Json -Depth 10 | Out-File -FilePath $proofFile -Encoding UTF8

    $valid = $proofJson.contractValid
    Write-Host "  contractValid: $valid (latency: $($proofJson.latencyMs)ms)" -ForegroundColor $(if ($valid) {"Green"} else {"Red"})

    if (-not $valid) { $allPassed = $false }
} catch {
    Write-Host "  [FAIL] Could not reach /ops/pacs/proof: $($_.Exception.Message)" -ForegroundColor Red
    @{ error = $_.Exception.Message; contractChecks = $contractExit -eq 0 } |
        ConvertTo-Json | Out-File -FilePath $proofFile -Encoding UTF8
    $allPassed = $false
}

# ── Phase 3: Environment snapshot ────────────────────────────────────────────
Write-Host ""
Write-Host "  Phase 3: Capturing environment state..." -ForegroundColor Yellow
$envFile = Join-Path $bundleDir "environment.txt"

$envLines = @(
    "═══════════════════════════════════════════════════════════"
    "  TerraFusion OS — Environment Snapshot"
    "  Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC' -AsUTC)"
    "═══════════════════════════════════════════════════════════"
    ""
    "── Host ──"
    "  Hostname:    $env:COMPUTERNAME"
    "  OS:          $([System.Runtime.InteropServices.RuntimeInformation]::OSDescription)"
    "  PowerShell:  $($PSVersionTable.PSVersion)"
    "  .NET SDK:    $(dotnet --version 2>$null)"
    ""
    "── Docker ──"
)

$dockerVersion = docker version --format '{{.Server.Version}}' 2>$null
$envLines += "  Docker Engine: $dockerVersion"
$envLines += ""
$envLines += "── Container: $ContainerName ──"

$inspectFmt = docker inspect -f 'Image={{.Config.Image}} Status={{.State.Status}} Started={{.State.StartedAt}}' $ContainerName 2>$null
$envLines += "  $inspectFmt"
$envLines += ""

$envLines += "── Docker Volumes ──"
$volumes = docker volume ls --format '{{.Name}}' 2>$null | Where-Object { $_ -match "mssql|pacs" }
foreach ($v in $volumes) { $envLines += "  $v" }
$envLines += ""

$envLines += "── Database ──"
$dbInfo = docker exec $ContainerName /opt/mssql-tools18/bin/sqlcmd `
    -S localhost -U sa -P $SaPassword -C -d pacs_oltp -h -1 -W `
    -Q "SET NOCOUNT ON; SELECT 'Name=' + DB_NAME() + ' Tables=' + CAST((SELECT COUNT(*) FROM sys.tables) AS VARCHAR) + ' Properties=' + CAST((SELECT COUNT(*) FROM dbo.property) AS VARCHAR) + ' Views=' + CAST((SELECT COUNT(*) FROM sys.views WHERE name LIKE 'vw_TerraFusion%') AS VARCHAR);" 2>$null | Out-String
$envLines += "  $($dbInfo.Trim())"
$envLines += ""

$envLines += "── API ──"
$envLines += "  Port: $ApiPort"
$envLines += "  Environment: Development"
$envLines += "  PacsConnection: Server=localhost,1433;Database=pacs_oltp;...;Encrypt=True"
$envLines += ""
$envLines += "── Git ──"
$gitHash = git -C $repoRoot rev-parse --short HEAD 2>$null
$gitBranch = git -C $repoRoot branch --show-current 2>$null
$envLines += "  Commit: $gitHash"
$envLines += "  Branch: $gitBranch"

$envLines -join "`n" | Out-File -FilePath $envFile -Encoding UTF8
Write-Host "  Environment captured." -ForegroundColor Green

# ── Cleanup ──────────────────────────────────────────────────────────────────
if ($weStartedApi -and $apiProcess -and -not $apiProcess.HasExited) {
    Write-Host ""
    Write-Host "  Stopping API process..." -ForegroundColor DarkGray
    Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
}

# ── Summary ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Proof Bundle                                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan

$bundleFiles = Get-ChildItem $bundleDir -File
foreach ($f in $bundleFiles) {
    $kb = [math]::Round($f.Length / 1024, 1)
    Write-Host "  $($f.Name) ($kb KB)" -ForegroundColor White
}

Write-Host ""
if ($allPassed) {
    Write-Host "  RESULT: ALL CHECKS PASSED" -ForegroundColor Green
    Write-Host "  Send the proof-bundle/ folder to Bill." -ForegroundColor Green
    exit 0
} else {
    Write-Host "  RESULT: SOME CHECKS FAILED — review proof-bundle/ for details" -ForegroundColor Red
    exit 1
}
