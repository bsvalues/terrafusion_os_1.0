$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TerraFusion OS 1.0 - Starting Up    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Start-Backend {
    Write-Host "[BACKEND] Starting API server on port 5000..." -ForegroundColor Yellow
    
    $backendPath = Join-Path $PSScriptRoot "backend\TerraFusion.API"
    
    if (-not (Test-Path $backendPath)) {
        Write-Host "[ERROR] Backend directory not found at: $backendPath" -ForegroundColor Red
        return $false
    }
    
    $backendProcess = Start-Process -FilePath "dotnet" -ArgumentList "run", "--project", $backendPath, "--urls", "http://localhost:5000" -NoNewWindow -PassThru
    
    Start-Sleep -Seconds 3
    
    $maxAttempts = 30
    for ($i = 1; $i -le $maxAttempts; $i++) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.status -eq "healthy" -or $response.status -eq "degraded") {
                Write-Host "[BACKEND] ✅ API server is running! Status: $($response.status)" -ForegroundColor Green
                Write-Host "[BACKEND] Server: $($response.server)" -ForegroundColor Gray
                Write-Host "[BACKEND] Modules loaded: $($response.modules.total)" -ForegroundColor Gray
                return $true
            }
        }
        catch {
            Write-Host "[BACKEND] Waiting for API to start... ($i/$maxAttempts)" -ForegroundColor Gray
            Start-Sleep -Seconds 1
        }
    }
    
    Write-Host "[WARNING] Backend API didn't respond in time, but may still be starting..." -ForegroundColor Yellow
    return $true
}

function Start-Frontend {
    Write-Host ""
    Write-Host "[FRONTEND] Starting React application on port 3000..." -ForegroundColor Yellow
    
    $frontendPath = Join-Path $PSScriptRoot "frontend"
    
    if (-not (Test-Path $frontendPath)) {
        Write-Host "[ERROR] Frontend directory not found at: $frontendPath" -ForegroundColor Red
        return $false
    }
    
    Push-Location $frontendPath
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "[FRONTEND] Installing dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    $frontendProcess = Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow -PassThru
    Pop-Location
    
    Start-Sleep -Seconds 5
    
    Write-Host "[FRONTEND] ✅ React application starting..." -ForegroundColor Green
    Write-Host "[FRONTEND] Opening browser at http://localhost:3000" -ForegroundColor Cyan
    
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:3000"
    
    return $true
}

function Show-Status {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   TerraFusion OS 1.0 - Running!       " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🚀 Backend API: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "📊 Health Check: http://localhost:5000/health" -ForegroundColor Cyan
    Write-Host "📡 API Test: http://localhost:5000/api/test" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
    Write-Host ""
}

function Stop-Services {
    Write-Host ""
    Write-Host "Stopping TerraFusion services..." -ForegroundColor Yellow
    
    Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    Write-Host "Services stopped." -ForegroundColor Green
}

trap {
    Stop-Services
    exit
}

$backendSuccess = Start-Backend

if ($backendSuccess) {
    $frontendSuccess = Start-Frontend
    
    if ($frontendSuccess) {
        Show-Status
        
        Write-Host "Services are running. Press Ctrl+C to stop." -ForegroundColor Gray
        while ($true) {
            Start-Sleep -Seconds 60
        }
    }
    else {
        Write-Host "[ERROR] Failed to start frontend" -ForegroundColor Red
        Stop-Services
    }
}
else {
    Write-Host "[ERROR] Failed to start backend" -ForegroundColor Red
    exit 1
}

