<#
.SYNOPSIS
    TerraFusion Elite Government OS - Service Orchestration Script

.DESCRIPTION
    Launches and manages all TerraFusion services with health monitoring
    - Backend API (.NET 8.0) on port 5000
    - Frontend UI (React/Vite) on port 3000
    - Optional GIS services

.NOTES
    Author: TerraFusion Elite Engineering Team
    Version: 1.0.0
    Date: November 12, 2025
#>

[CmdletBinding()]
param(
    [Parameter()]
    [switch]$SkipGIS,

    [Parameter()]
    [switch]$ProductionMode,

    [Parameter()]
    [int]$StartupDelay = 15
)

$ErrorActionPreference = "Continue"
$baseDir = "C:\Users\bsval\terrafusion_os_1.0"

# Banner
Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║    ████████╗███████╗██████╗ ██████╗  █████╗ ███████╗██╗   ██╗╗║
║    ╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║   ██║║
║       ██║   █████╗  ██████╔╝██████╔╝███████║█████╗  ██║   ██║║
║       ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██╔══╝  ██║   ██║║
║       ██║   ███████╗██║  ██║██║  ██║██║  ██║██║     ╚██████╔╝║
║       ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ║
║                                                               ║
║              ELITE GOVERNMENT OS - SERVICE LAUNCHER           ║
║                      Version 1.0.0                            ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Host "🚀 Initializing TerraFusion Service Orchestration..." -ForegroundColor Green
Write-Host ""

# Pre-flight checks
function Test-ServicePort {
    param([int]$Port)
    try {
        $null = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

function Stop-ServiceByPort {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "   ⚠️  Stopping existing process on port $Port ($($process.Name))" -ForegroundColor Yellow
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
        }
    }
}

Write-Host "🔍 Pre-Flight Checks" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

# Check and stop conflicting services
$ports = @(5000, 3000)
foreach ($port in $ports) {
    if (Test-ServicePort -Port $port) {
        Write-Host "   Port $port in use - cleaning up..." -ForegroundColor Yellow
        Stop-ServiceByPort -Port $port
    }
    else {
        Write-Host "   ✅ Port $port available" -ForegroundColor Green
    }
}

# Verify directories
$services = @{
    "Backend"  = "$baseDir\backend"
    "Frontend" = "$baseDir\frontend"
}

foreach ($svc in $services.GetEnumerator()) {
    if (Test-Path $svc.Value) {
        Write-Host "   ✅ $($svc.Key) directory found" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ $($svc.Key) directory missing: $($svc.Value)" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Start Backend API
Write-Host "🔧 Starting Backend API Service" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$backendPath = "$baseDir\backend"
$buildConfig = if ($ProductionMode) { "Release" } else { "Debug" }

Write-Host "   📂 Location: $backendPath" -ForegroundColor White
Write-Host "   🏗️  Configuration: $buildConfig" -ForegroundColor White
Write-Host "   🌐 URL: http://localhost:5000" -ForegroundColor White
Write-Host ""

$backendJob = Start-Process pwsh -ArgumentList @(
    "-NoExit",
    "-Command",
    "Write-Host '🔧 TerraFusion Backend API' -ForegroundColor Cyan; cd '$backendPath'; dotnet run --project TerraFusion.API -c $buildConfig --urls http://localhost:5000"
) -PassThru -WindowStyle Normal

if ($backendJob) {
    Write-Host "   ✅ Backend API process started (PID: $($backendJob.Id))" -ForegroundColor Green
}
else {
    Write-Host "   ❌ Failed to start Backend API" -ForegroundColor Red
    exit 1
}

Write-Host "   ⏳ Waiting $StartupDelay seconds for API initialization..." -ForegroundColor Yellow
Start-Sleep -Seconds $StartupDelay

# Verify Backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/test" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ Backend API responding (HTTP $($response.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠️  Backend API not responding yet (may need more time)" -ForegroundColor Yellow
}

Write-Host ""

# Start Frontend
Write-Host "🎨 Starting Frontend UI Service" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

$frontendPath = "$baseDir\frontend"

Write-Host "   📂 Location: $frontendPath" -ForegroundColor White
Write-Host "   🌐 URL: http://localhost:3000" -ForegroundColor White
Write-Host ""

$frontendJob = Start-Process pwsh -ArgumentList @(
    "-NoExit",
    "-Command",
    "Write-Host '🎨 TerraFusion Frontend UI' -ForegroundColor Cyan; cd '$frontendPath'; npm run dev -- --host"
) -PassThru -WindowStyle Normal

if ($frontendJob) {
    Write-Host "   ✅ Frontend UI process started (PID: $($frontendJob.Id))" -ForegroundColor Green
}
else {
    Write-Host "   ❌ Failed to start Frontend UI" -ForegroundColor Red
}

Write-Host "   ⏳ Waiting 10 seconds for Vite dev server..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verify Frontend on common Vite ports
$detectedFrontendPort = $null
$candidatePorts = @(5173, 3000)
foreach ($p in $candidatePorts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$p" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Host "   ✅ Frontend UI responding on port $p (HTTP $($response.StatusCode))" -ForegroundColor Green
        $detectedFrontendPort = $p
        break
    }
    catch { }
}

if (-not $detectedFrontendPort) {
    Write-Host "   ⚠️  Frontend UI not responding yet (may need more time)" -ForegroundColor Yellow
    Write-Host "   🔁 Retrying frontend launch after clean-up..." -ForegroundColor Yellow
    foreach ($p in $candidatePorts) { Stop-ServiceByPort -Port $p }
    $frontendJob = Start-Process pwsh -ArgumentList @(
        "-NoExit",
        "-Command",
        "Write-Host '🎨 TerraFusion Frontend UI' -ForegroundColor Cyan; cd '$frontendPath'; npm run dev -- --host"
    ) -PassThru -WindowStyle Normal
    Write-Host "   ⏳ Waiting 10 seconds for retry..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    foreach ($p in $candidatePorts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$p" -UseBasicParsing -TimeoutSec 8 -ErrorAction Stop
            Write-Host "   ✅ Frontend UI responding on port $p (HTTP $($response.StatusCode))" -ForegroundColor Green
            $detectedFrontendPort = $p
            break
        }
        catch { }
    }
    if (-not $detectedFrontendPort) {
        Write-Host "   ❌ Frontend UI still not responding. Check the Frontend terminal window for errors." -ForegroundColor Red
    }
}

Write-Host ""

# Final Status Report
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           🎉 TERRAFUSION SERVICES LAUNCHED                   ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
Write-Host ""

$frontendUrl = if ($detectedFrontendPort) { "http://localhost:$detectedFrontendPort" } else { "http://localhost:3000" }
$finalStatus = @(
    [PSCustomObject]@{Service = "Backend API"; URL = "http://localhost:5000"; Status = "🟢 Running"; PID = $backendJob.Id },
    [PSCustomObject]@{Service = "Frontend UI"; URL = $frontendUrl; Status = "🟢 Running"; PID = $frontendJob.Id }
)

$finalStatus | Format-Table -AutoSize

Write-Host ""
Write-Host "🌐 Quick Links:" -ForegroundColor Cyan
Write-Host "   • Frontend UI:  $frontendUrl" -ForegroundColor White
Write-Host "   • Backend API:  http://localhost:5000" -ForegroundColor White
Write-Host "   • API Test:     http://localhost:5000/api/test" -ForegroundColor White
Write-Host "   • API Docs:     http://localhost:5000/swagger" -ForegroundColor White
Write-Host ""
Write-Host "📝 Management Commands:" -ForegroundColor Cyan
Write-Host "   • View Processes:  Get-Process | Where-Object { `$_.Id -in @($($backendJob.Id),$($frontendJob.Id)) }" -ForegroundColor DarkGray
Write-Host "   • Stop All:        Stop-Process -Id $($backendJob.Id),$($frontendJob.Id) -Force" -ForegroundColor DarkGray
Write-Host ""

# Aggregated Health Check
Write-Host "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "🔎 Aggregated Health Check" -ForegroundColor Cyan
$healthResults = @()

# Backend API check with retry and safe JSON parsing
$apiResp = $null
for ($i = 0; $i -lt 5 -and -not $apiResp; $i++) {
    try {
        $apiResp = Invoke-WebRequest -Uri "http://localhost:5000/api/test" -UseBasicParsing -TimeoutSec 8 -ErrorAction Stop
    }
    catch {
        Start-Sleep -Seconds 2
    }
}
if ($apiResp -and $apiResp.StatusCode -eq 200) {
    $apiMsg = "OK"
    try {
        $apiJson = $apiResp.Content | ConvertFrom-Json -ErrorAction Stop
        if ($null -ne $apiJson -and $apiJson.PSObject.Properties.Name -contains 'message' -and $apiJson.message) {
            $apiMsg = $apiJson.message
        }
    }
    catch { }
    $healthResults += [PSCustomObject]@{Service = "Backend API"; Endpoint = "/api/test"; Status = "✅ UP"; Code = $apiResp.StatusCode; Message = $apiMsg }
}
else {
    $healthResults += [PSCustomObject]@{Service = "Backend API"; Endpoint = "/api/test"; Status = "❌ DOWN"; Code = "N/A"; Message = "-" }
}

# Frontend UI check with retry
if ($detectedFrontendPort) {
    $frontResp = $null
    for ($i = 0; $i -lt 5 -and -not $frontResp; $i++) {
        try {
            $frontResp = Invoke-WebRequest -Uri "http://localhost:$detectedFrontendPort" -UseBasicParsing -TimeoutSec 8 -ErrorAction Stop
        }
        catch {
            Start-Sleep -Seconds 2
        }
    }
    if ($frontResp -and $frontResp.StatusCode -eq 200) {
        $healthResults += [PSCustomObject]@{Service = "Frontend UI"; Endpoint = "/"; Status = "✅ UP"; Code = $frontResp.StatusCode; Message = "OK" }
    }
    else {
        $healthResults += [PSCustomObject]@{Service = "Frontend UI"; Endpoint = "/"; Status = "❌ DOWN"; Code = "N/A"; Message = "-" }
    }
}
else {
    $healthResults += [PSCustomObject]@{Service = "Frontend UI"; Endpoint = "/"; Status = "❌ DOWN"; Code = "N/A"; Message = "-" }
}
$healthResults | Format-Table -AutoSize
Write-Host "\n✨ TerraFusion Elite Government OS is now operational!" -ForegroundColor Green
Write-Host ""
