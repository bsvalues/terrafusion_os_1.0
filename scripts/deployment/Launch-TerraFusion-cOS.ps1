# TerraFusion cOS Enterprise Launcher
# Handles dual-GPU systems automatically for government deployment

param(
    [switch]$Debug,
    [switch]$ForceNvidia,
    [switch]$ForceAmd
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  TerraFusion cOS - Government Operating System" -ForegroundColor White
Write-Host "  Enterprise Desktop Launcher" -ForegroundColor Gray
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Detect GPU configuration
Write-Host "Detecting GPU configuration..." -ForegroundColor Yellow
$gpus = Get-WmiObject Win32_VideoController
$hasNvidia = $gpus | Where-Object { $_.Name -like "*NVIDIA*" }
$hasAmd = $gpus | Where-Object { $_.Name -like "*AMD*" -or $_.Name -like "*Radeon*" }
$hasIntel = $gpus | Where-Object { $_.Name -like "*Intel*" }

if ($gpus.Count -gt 1) {
    Write-Host "  Dual-GPU system detected:" -ForegroundColor Cyan
    foreach ($gpu in $gpus) {
        Write-Host "    - $($gpu.Name)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "  Configuring for optimal compatibility..." -ForegroundColor Yellow
}

# Set environment variables to force GPU selection
if ($ForceNvidia -or ($hasNvidia -and $gpus.Count -gt 1)) {
    Write-Host "  Configuring NVIDIA GPU..." -ForegroundColor Green
    $env:CUDA_VISIBLE_DEVICES = "0"
    $env:__NV_PRIME_RENDER_OFFLOAD = "1"
    $env:__GLX_VENDOR_LIBRARY_NAME = "nvidia"
}

# Set Electron-specific environment for dual-GPU compatibility
$env:ELECTRON_ENABLE_LOGGING = "1"
$env:ELECTRON_DISABLE_SANDBOX = "1"

# Change to cOS directory
$cosPath = Join-Path $PSScriptRoot "terrafusion-cos"
if (-not (Test-Path $cosPath)) {
    Write-Host "ERROR: TerraFusion cOS directory not found at: $cosPath" -ForegroundColor Red
    Write-Host "Please ensure you are running this script from the TerraFusion OS installation directory." -ForegroundColor Yellow
    exit 1
}

Set-Location $cosPath

# Check if API server is running
Write-Host "Checking API server..." -ForegroundColor Yellow
$apiRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8090/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $apiRunning = $true
        Write-Host "  API server is running" -ForegroundColor Green
    }
} catch {
    Write-Host "  API server not detected" -ForegroundColor Yellow
}

if (-not $apiRunning) {
    Write-Host ""
    Write-Host "Starting API server..." -ForegroundColor Yellow
    
    # Start API server in background
    $apiScript = Join-Path $cosPath "api_server.py"
    if (Test-Path $apiScript) {
        Start-Process -FilePath "python" -ArgumentList $apiScript -WindowStyle Hidden -PassThru | Out-Null
        Write-Host "  API server started" -ForegroundColor Green
        Start-Sleep -Seconds 3
    } else {
        Write-Host "  WARNING: API server script not found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Launching TerraFusion cOS Desktop..." -ForegroundColor Cyan
Write-Host ""

# Create startup batch file with GPU workarounds
$startupBat = Join-Path $env:TEMP "terrafusion-launch.bat"
@"
@echo off
REM TerraFusion cOS Startup with GPU Compatibility

REM Force software rendering for dual-GPU compatibility
set LIBGL_ALWAYS_SOFTWARE=1
set MESA_GL_VERSION_OVERRIDE=3.3

REM Electron-specific settings
set ELECTRON_ENABLE_LOGGING=1
set ELECTRON_DISABLE_SANDBOX=1

REM Change to cOS directory
cd /d "$cosPath"

REM Launch with npm
npm start
"@ | Out-File -FilePath $startupBat -Encoding ASCII

# Execute the launcher
try {
    $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$startupBat`"" -PassThru -Wait
    
    if ($process.ExitCode -ne 0) {
        Write-Host ""
        Write-Host "================================================================" -ForegroundColor Red
        Write-Host "  ERROR: TerraFusion cOS failed to launch" -ForegroundColor Red
        Write-Host "================================================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "  1. Check GPU drivers are up to date" -ForegroundColor Gray
        Write-Host "  2. Try running with -ForceNvidia flag" -ForegroundColor Gray
        Write-Host "  3. Check logs in: terrafusion-cos\logs\electron-main.log" -ForegroundColor Gray
        Write-Host ""
        
        if ($hasNvidia -and $hasAmd) {
            Write-Host "Dual-GPU System Detected:" -ForegroundColor Yellow
            Write-Host "  Your system has both AMD and NVIDIA GPUs." -ForegroundColor Gray
            Write-Host "  This may cause compatibility issues with Electron." -ForegroundColor Gray
            Write-Host ""
            Write-Host "Recommended Actions:" -ForegroundColor Cyan
            Write-Host "  1. Update both AMD and NVIDIA drivers to latest versions" -ForegroundColor Gray
            Write-Host "  2. Configure Windows Graphics Settings:" -ForegroundColor Gray
            Write-Host "     - Settings > System > Display > Graphics" -ForegroundColor Gray
            Write-Host "     - Add electron.exe and set to 'High performance' (NVIDIA)" -ForegroundColor Gray
            Write-Host "  3. Contact TerraFusion support with log files" -ForegroundColor Gray
        }
        
        exit $process.ExitCode
    }
    
    Write-Host ""
    Write-Host "TerraFusion cOS desktop closed" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
} finally {
    # Cleanup
    if (Test-Path $startupBat) {
        Remove-Item $startupBat -Force -ErrorAction SilentlyContinue
    }
}
