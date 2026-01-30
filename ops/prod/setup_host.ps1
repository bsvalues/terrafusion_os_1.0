param(
    [switch]$DryRun
)

Write-Host "=== TERRAFUSION PRODUCTION SITE PREP ===" -ForegroundColor Cyan
Write-Host "Target: Localhost (Windows)"
Write-Host "Time: $(Get-Date)"

# 1. Directory Structure
$BaseDir = "C:\TerraFusion"
$DataDir = "$BaseDir\Data"
$LogDir = "$BaseDir\Logs"

$Dirs = @(
    "$DataDir\redis",
    "$DataDir\postgres", # Legacy support
    "$LogDir\api",
    "$LogDir\cortex"
)

foreach ($d in $Dirs) {
    if (-not (Test-Path $d)) {
        if ($DryRun) {
            Write-Host "[DRY RUN] Would create: $d" -ForegroundColor Yellow
        } else {
            New-Item -ItemType Directory -Force -Path $d | Out-Null
            Write-Host "[OK] Created: $d" -ForegroundColor Green
        }
    } else {
        Write-Host "[OK] Exists: $d" -ForegroundColor Gray
    }
}

# 2. Port Availability
$Ports = @(80, 5000, 8006)
Write-Host "`nChecking Port Availability..."
foreach ($p in $Ports) {
    if ($DryRun) {
         # In dry run, we just check, we don't act
         $netstat = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
         if ($netstat) {
             Write-Host "[WARN] Port $p is already IN USE" -ForegroundColor Red
         } else {
             Write-Host "[OK] Port $p is FREE" -ForegroundColor Green
         }
    } else {
        # Production logic: Fail if blocked? Or just warn?
        # For prep, we warn.
        $netstat = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
        if ($netstat) {
             Write-Host "[BUSY] Port $p is active (possibly previous deployment)" -ForegroundColor Yellow
        } else {
             Write-Host "[FREE] Port $p is available" -ForegroundColor Green
        }
    }
}

# 3. Docker Check
Write-Host "`nChecking Docker Engine..."
try {
    $version = docker --version
    Write-Host "[OK] $version detected" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Docker not found on PATH" -ForegroundColor Red
    if (-not $DryRun) { exit 1 }
}

# 4. Secrets Check
$SecretFile = "ops\prod\secrets.prod.env"
if (Test-Path $SecretFile) {
    Write-Host "[OK] Secrets file found: $SecretFile" -ForegroundColor Green
} else {
    Write-Host "[PENDING] Secrets file missing: $SecretFile" -ForegroundColor Yellow
    Write-Host "    Action: Copy ops\prod\secrets_template.env to $SecretFile and fill values."
}

Write-Host "`n=== SITE PREP COMPLETE ==="
if ($DryRun) { Write-Host "(Dry Run Mode - No changes made)" -ForegroundColor Cyan }
