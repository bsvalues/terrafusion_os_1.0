# ═══════════════════════════════════════════════════════════════════════════
# TERRADOSSIER - DIAGNOSTIC LAUNCH SCRIPT
# Identifies and fixes common issues, then launches the app
# ═══════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

Write-Host @"

  ████████╗███████╗██████╗ ██████╗  █████╗ ██████╗  ██████╗ ███████╗███████╗██╗███████╗██████╗ 
  ╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔═══██╗██╔════╝██╔════╝██║██╔════╝██╔══██╗
     ██║   █████╗  ██████╔╝██████╔╝███████║██║  ██║██║   ██║███████╗███████╗██║█████╗  ██████╔╝
     ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██║  ██║██║   ██║╚════██║╚════██║██║██╔══╝  ██╔══██╗
     ██║   ███████╗██║  ██║██║  ██║██║  ██║██████╔╝╚██████╔╝███████║███████║██║███████╗██║  ██║
     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝╚══════╝╚═╝╚══════╝╚═╝  ╚═╝
                                                                                                
                              DIAGNOSTIC LAUNCHER
                         Generation 2 Native Application

"@ -ForegroundColor Cyan

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1: Check Deno Installation
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "[Step 1] Checking Deno installation..." -ForegroundColor Yellow

# Add Deno to path if needed
if (-not ($env:Path -like "*\.deno\bin*")) {
    $env:Path += ";$HOME\.deno\bin"
}

try {
    $denoVersion = deno --version 2>&1 | Select-Object -First 1
    Write-Host "  ✅ Deno found: $denoVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Deno NOT found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  To install Deno, run:" -ForegroundColor Yellow
    Write-Host "    irm https://deno.land/install.ps1 | iex" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2: Kill Zombie Processes on Port 3007
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "[Step 2] Checking for zombie processes on port 3007..." -ForegroundColor Yellow

$portCheck = netstat -ano | Select-String ":3007"
if ($portCheck) {
    Write-Host "  ⚠️ Found processes using port 3007:" -ForegroundColor Yellow
    $portCheck | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    
    # Extract PIDs and kill them
    $pids = $portCheck | ForEach-Object {
        if ($_ -match '\s+(\d+)\s*$') {
            $matches[1]
        }
    } | Select-Object -Unique
    
    foreach ($pid in $pids) {
        if ($pid -and $pid -ne "0") {
            Write-Host "  Killing PID $pid..." -ForegroundColor Yellow
            try {
                taskkill /F /PID $pid 2>$null
                Write-Host "  ✅ Killed PID $pid" -ForegroundColor Green
            } catch {
                Write-Host "  ⚠️ Could not kill PID $pid (may already be dead)" -ForegroundColor Yellow
            }
        }
    }
    
    Start-Sleep -Seconds 2
} else {
    Write-Host "  ✅ Port 3007 is free" -ForegroundColor Green
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3: Verify Required Files
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "[Step 3] Verifying required files..." -ForegroundColor Yellow

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$requiredFiles = @(
    @{ Path = "index.html"; Desc = "Entry HTML (must be in root)" },
    @{ Path = "deno.json"; Desc = "Deno manifest" },
    @{ Path = "vite.config.mts"; Desc = "Vite configuration" },
    @{ Path = "src/main.tsx"; Desc = "React entry point" },
    @{ Path = "src/App.tsx"; Desc = "Main App component" }
)

$allFilesOk = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file.Path) {
        Write-Host "  ✅ $($file.Path) - $($file.Desc)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ MISSING: $($file.Path) - $($file.Desc)" -ForegroundColor Red
        $allFilesOk = $false
    }
}

if (-not $allFilesOk) {
    Write-Host ""
    Write-Host "  Some required files are missing. Cannot start." -ForegroundColor Red
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 4: Check index.html location
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "[Step 4] Checking index.html configuration..." -ForegroundColor Yellow

# Check if index.html is in src (wrong) instead of root
if ((Test-Path "src/index.html") -and -not (Test-Path "index.html")) {
    Write-Host "  ⚠️ index.html is in src/ but should be in root!" -ForegroundColor Yellow
    Write-Host "  Moving index.html to root..." -ForegroundColor Yellow
    Move-Item "src/index.html" "index.html"
    Write-Host "  ✅ Moved index.html to root" -ForegroundColor Green
} elseif (Test-Path "index.html") {
    Write-Host "  ✅ index.html is in correct location (root)" -ForegroundColor Green
} else {
    Write-Host "  ❌ index.html not found anywhere!" -ForegroundColor Red
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 5: Launch Server
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "[Step 5] Launching TerraDossier..." -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TerraDossier will be available at: http://localhost:3007" -ForegroundColor White
Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:DENO_NO_PACKAGE_JSON = "1"

# Launch Deno Vite server
deno task dev
