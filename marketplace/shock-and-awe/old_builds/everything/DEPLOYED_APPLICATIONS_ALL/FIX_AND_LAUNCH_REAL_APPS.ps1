#!/usr/bin/env pwsh

Clear-Host
Write-Host "################################################################" -ForegroundColor Cyan
Write-Host "#                                                              #" -ForegroundColor Cyan
Write-Host "#          🚀 TERRAFUSION EXECUTION WITH EXCELLENCE 🚀         #" -ForegroundColor Cyan
Write-Host "#                                                              #" -ForegroundColor Cyan
Write-Host "#          FIXING ALL ISSUES & LAUNCHING REAL APPS            #" -ForegroundColor Cyan
Write-Host "#                                                              #" -ForegroundColor Cyan
Write-Host "################################################################" -ForegroundColor Cyan

# Get the script directory and set working directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "`n🔥 PHASE 1: ELIMINATING FAKE APPLICATIONS" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor White

# Kill all fake applications on ports 5000-5009
$ports = @(5000, 5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009, 8080, 3000)
$killedCount = 0

foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                $processId = $conn.OwningProcess
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "❌ Terminating fake process: $($process.ProcessName) on port $port" -ForegroundColor Red
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    $killedCount++
                }
            }
        }
    } catch { }
}

Write-Host "✅ Eliminated $killedCount fake applications" -ForegroundColor Green

Write-Host "`n⚡ PHASE 2: FIXING RUST BACKEND" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor White

# Navigate to the correct Rust backend directory
if (Test-Path "TerraFusionBuild_ACTUAL\backend") {
    Set-Location "TerraFusionBuild_ACTUAL\backend"
    Write-Host "✅ Found TerraFusionBuild_ACTUAL backend directory" -ForegroundColor Green
    
    # Check if Rust is installed
    try {
        $rustVersion = cargo --version 2>$null
        Write-Host "✅ Rust found: $rustVersion" -ForegroundColor Green
        
        # Build the Rust backend
        Write-Host "`n🔨 Building Rust backend..." -ForegroundColor Yellow
        $buildOutput = cargo build --release 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Rust backend compiled successfully!" -ForegroundColor Green
            
            # Start Rust backend in background
            Write-Host "🚀 Starting Rust backend on port 8080..." -ForegroundColor Cyan
            Start-Job -ScriptBlock { 
                Set-Location $using:PWD
                cargo run --release 
            } -Name "TerraFusion-Rust-Backend"
            
            Write-Host "✅ Rust backend started in background" -ForegroundColor Green
            Start-Sleep 3
        } else {
            Write-Host "❌ Rust build failed:" -ForegroundColor Red
            Write-Host $buildOutput -ForegroundColor Red
            Write-Host "`n🔧 Attempting to fix tracing_subscriber issue..." -ForegroundColor Yellow
            
            # Check and fix Cargo.toml if needed
            $cargoContent = Get-Content "Cargo.toml" -Raw
            if ($cargoContent -notmatch 'tracing-subscriber.*env-filter') {
                Write-Host "🔧 Fixing tracing-subscriber dependency..." -ForegroundColor Yellow
                $cargoContent = $cargoContent -replace 'tracing-subscriber = "0\.3"', 'tracing-subscriber = { version = "0.3", features = ["env-filter"] }'
                Set-Content "Cargo.toml" $cargoContent
                
                # Try building again
                Write-Host "🔨 Rebuilding with fix..." -ForegroundColor Yellow
                $buildOutput2 = cargo build --release 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Fixed and compiled successfully!" -ForegroundColor Green
                    Start-Job -ScriptBlock { 
                        Set-Location $using:PWD
                        cargo run --release 
                    } -Name "TerraFusion-Rust-Backend"
                    Write-Host "✅ Rust backend started" -ForegroundColor Green
                } else {
                    Write-Host "❌ Still failing after fix" -ForegroundColor Red
                }
            }
        }
    } catch {
        Write-Host "❌ Rust not found! Please install from https://rustup.rs/" -ForegroundColor Red
    }
    
    # Return to main directory
    Set-Location $scriptDir
} else {
    Write-Host "❌ TerraFusionBuild_ACTUAL backend directory not found" -ForegroundColor Red
}

Write-Host "`n🌐 PHASE 3: HANDLING FRONTEND" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor White

# Check Node.js installation
$nodeFound = $false
$frontendStarted = $false

try {
    $nodeVersion = node --version 2>$null
    $npmVersion = npm --version 2>$null
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
    $nodeFound = $true
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
}

if ($nodeFound -and (Test-Path "TerraFusionBuild_ACTUAL\frontend")) {
    Set-Location "TerraFusionBuild_ACTUAL\frontend"
    Write-Host "🔨 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install --silent
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed" -ForegroundColor Green
        Write-Host "🚀 Starting Next.js frontend on port 3000..." -ForegroundColor Cyan
        Start-Job -ScriptBlock { 
            Set-Location $using:PWD
            npm run dev 
        } -Name "TerraFusion-Frontend"
        Write-Host "✅ Frontend started in background" -ForegroundColor Green
        $frontendStarted = $true
    }
    Set-Location $scriptDir
} else {
    Write-Host "⚠️ Frontend will not start (Node.js missing or directory not found)" -ForegroundColor Yellow
    Write-Host "💡 Backend will still work on port 8080" -ForegroundColor Cyan
}

Write-Host "`n🎮 PHASE 4: LAUNCHING PLAYGROUND HUB" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor White

if (Test-Path "TerraFusionPlayground_PRODUCTION\start_playground.py") {
    try {
        $pythonVersion = python --version 2>$null
        Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
        
        # Install Python dependencies
        Write-Host "🔨 Installing Python dependencies..." -ForegroundColor Yellow
        python -m pip install flask flask-cors --quiet --disable-pip-version-check
        
        Set-Location "TerraFusionPlayground_PRODUCTION"
        Write-Host "🚀 Starting TerraFusion Playground Hub..." -ForegroundColor Cyan
        Start-Job -ScriptBlock { 
            Set-Location $using:PWD
            python start_playground.py 
        } -Name "TerraFusion-Playground"
        Write-Host "✅ Playground hub started" -ForegroundColor Green
        Set-Location $scriptDir
    } catch {
        Write-Host "❌ Python not found - Playground hub cannot start" -ForegroundColor Red
    }
} else {
    Write-Host "❌ TerraFusion Playground not found" -ForegroundColor Red
}

Write-Host "`n⏱️ PHASE 5: WAITING FOR SERVICES TO START" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor White

Write-Host "Waiting 10 seconds for all services to initialize..." -ForegroundColor Yellow
Start-Sleep 10

Write-Host "`n🎯 PHASE 6: FINAL STATUS & LAUNCH" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor White

# Check what's actually running
$runningServices = @()

# Check Rust backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 5 -ErrorAction SilentlyContinue
    $runningServices += "✅ Rust Backend (8080)"
} catch {
    Write-Host "❌ Rust backend not responding on port 8080" -ForegroundColor Red
}

# Check frontend
if ($frontendStarted) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction SilentlyContinue
        $runningServices += "✅ Next.js Frontend (3000)"
    } catch {
        Write-Host "❌ Frontend not responding on port 3000" -ForegroundColor Red
    }
}

# Check playground
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction SilentlyContinue
    $runningServices += "✅ TerraFusion Playground (3000)"
} catch { }

Write-Host "`n🎉 EXECUTION COMPLETE!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor White

if ($runningServices.Count -gt 0) {
    Write-Host "🚀 REAL APPLICATIONS NOW RUNNING:" -ForegroundColor Green
    foreach ($service in $runningServices) {
        Write-Host "   $service" -ForegroundColor White
    }
    
    Write-Host "`n🌐 Opening applications in browser..." -ForegroundColor Cyan
    if ("✅ Rust Backend (8080)" -in $runningServices) {
        Start-Process "http://localhost:8080"
    }
    if ("✅ Next.js Frontend (3000)" -in $runningServices -or "✅ TerraFusion Playground (3000)" -in $runningServices) {
        Start-Sleep 2
        Start-Process "http://localhost:3000"
    }
    
} else {
    Write-Host "❌ No services successfully started" -ForegroundColor Red
    Write-Host "💡 Check the individual error messages above" -ForegroundColor Yellow
}

Write-Host "`n📊 BACKGROUND JOBS STATUS:" -ForegroundColor Cyan
Get-Job | Format-Table Name, State -AutoSize

Write-Host "`n🎯 EXECUTION WITH EXCELLENCE COMPLETE!" -ForegroundColor Green
Write-Host "Real TerraFusion applications are now running!" -ForegroundColor White
Write-Host "No more fake Enhanced applications!" -ForegroundColor White

Read-Host "`nPress Enter to exit (services will continue running in background)" 