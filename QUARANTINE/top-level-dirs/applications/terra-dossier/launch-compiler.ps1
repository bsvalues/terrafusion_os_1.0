# ═══════════════════════════════════════════════════════════════════════════
# TERRADOSSIER - COMPILER ACTIVATION LAUNCHER
# Forces cache clear and activates JSX compilation
# ═══════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Continue"

Write-Host @"

  ████████╗███████╗██████╗ ██████╗  █████╗ ██████╗  ██████╗ ███████╗███████╗██╗███████╗██████╗ 
  ╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔═══██╗██╔════╝██╔════╝██║██╔════╝██╔══██╗
     ██║   █████╗  ██████╔╝██████╔╝███████║██║  ██║██║   ██║███████╗███████╗██║█████╗  ██████╔╝
     ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██║  ██║██║   ██║╚════██║╚════██║██║██╔══╝  ██╔══██╗
     ██║   ███████╗██║  ██║██║  ██║██║  ██║██████╔╝╚██████╔╝███████║███████║██║███████╗██║  ██║
     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝╚══════╝╚═╝╚══════╝╚═╝  ╚═╝
                                                                                                
                              JSX COMPILER ACTIVATION
                         Generation 2 Native Application

"@ -ForegroundColor Cyan

$AppDir = $PSScriptRoot
Set-Location $AppDir

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1: Kill ALL Deno processes
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "[Step 1] Terminating all Deno processes..." -ForegroundColor Yellow
taskkill /F /IM deno.exe /T 2>$null | Out-Null
Start-Sleep -Seconds 2
Write-Host "  ✅ All Deno processes terminated" -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2: Clear caches
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "[Step 2] Clearing cached dependencies..." -ForegroundColor Yellow

# Remove deno.lock
if (Test-Path "deno.lock") {
    Remove-Item "deno.lock" -Force
    Write-Host "  ✅ Removed deno.lock" -ForegroundColor Green
}

# Remove node_modules
if (Test-Path "node_modules") {
    Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ Removed node_modules" -ForegroundColor Green
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3: Configure environment
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "[Step 3] Configuring environment..." -ForegroundColor Yellow

# Add Deno to PATH
if (-not ($env:Path -like "*\.deno\bin*")) {
    $env:Path += ";$HOME\.deno\bin"
}
Write-Host "  ✅ Deno in PATH" -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════════════════
# STEP 4: Launch with --reload flag
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🚀 LAUNCHING WITH JSX COMPILER" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  URL: http://localhost:3007" -ForegroundColor Cyan
Write-Host "  Mode: Fresh cache (--reload)" -ForegroundColor Gray
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Launch with --reload to force fresh dependency resolution
deno run -A --reload --node-modules-dir npm:vite
