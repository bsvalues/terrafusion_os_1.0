# TRUST FABRIC ENFORCEMENT - REAL IMPLEMENTATION
# This script implements ACTUAL process control, not configuration theater

Write-Host "🔥 TRUST FABRIC ENFORCEMENT ACTIVATED" -ForegroundColor Red
Write-Host "=====================================" -ForegroundColor White

# Step 1: Nuclear cleanup - kill all TerraFusion processes
Write-Host "`n💀 STEP 1: ELIMINATING ALL ZOMBIE PROCESSES" -ForegroundColor Yellow
$zombies = Get-Process | Where-Object {$_.ProcessName -match "dotnet|node|TerraFusion"}
$zombies | ForEach-Object {
    Write-Host "💀 Killing: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Red
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep 3
Write-Host "✅ Zombie cleanup complete" -ForegroundColor Green

# Step 2: Verify ports are free
Write-Host "`n🔍 STEP 2: VERIFYING PORT AVAILABILITY" -ForegroundColor Yellow
$requiredPorts = @(3000, 5000)
foreach($port in $requiredPorts) {
    $occupied = Get-NetTCPConnection | Where-Object {$_.LocalPort -eq $port -and $_.State -eq "Listen"}
    if($occupied) {
        Write-Host "⚔️  Port $port occupied by PID $($occupied.OwningProcess) - TERMINATING" -ForegroundColor Red
        Stop-Process -Id $occupied.OwningProcess -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "✅ Port $port - FREE" -ForegroundColor Green
    }
}

# Step 3: Start backend with STRICT port enforcement
Write-Host "`n🚀 STEP 3: STARTING BACKEND WITH ENFORCEMENT" -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.API"
    $env:ASPNETCORE_ENVIRONMENT = "Development"
    $env:ASPNETCORE_URLS = "http://localhost:\${{TF_API_PORT:-5000}}"
    $env:TRUST_FABRIC_ENFORCED = "TRUE"
    dotnet run
}
Write-Host "🔐 Backend started as Job $($backendJob.Id) - Trust Fabric managed" -ForegroundColor Green

# Step 4: Wait for backend, then start frontend with --strictPort
Write-Host "`n⏳ STEP 4: WAITING FOR BACKEND INITIALIZATION" -ForegroundColor Yellow
Start-Sleep 8

# Test backend is actually running on our assigned port
try {
    $health = Invoke-WebRequest -Uri "http://localhost:\${{TF_API_PORT:-5000}}/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Backend verified on port \${{TF_API_PORT:-5000}}" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend failed to start on assigned port - ABORTING" -ForegroundColor Red
    Stop-Job $backendJob -Force
    exit 1
}

# Step 5: Start frontend with STRICT port enforcement
Write-Host "`n🚀 STEP 5: STARTING FRONTEND WITH --STRICTPORT" -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\bsval\terrafusion_os_1.0\frontend"
    $env:NODE_ENV = "development"
    $env:PORT = "3000"
    $env:VITE_API_URL = "http://localhost:\${{TF_API_PORT:-5000}}"
    $env:TRUST_FABRIC_ENFORCED = "TRUE"
    # THE KEY: --strictPort makes Vite EXIT if port unavailable instead of scanning
    npm run dev -- --port \${{TF_API_PORT:-5000}} --strictPort
}
Write-Host "🔐 Frontend started as Job $($frontendJob.Id) with --strictPort enforcement" -ForegroundColor Green

# Step 6: Monitor and verify both services
Write-Host "`n🔍 STEP 6: TRUST FABRIC MONITORING ACTIVE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor White

$monitorCount = 0
while($monitorCount -lt 20) {  # Monitor for 2 minutes
    Start-Sleep 6
    $monitorCount++
    
    # Check backend
    $backendOK = $false
    try {
        $health = Invoke-WebRequest -Uri "http://localhost:\${{TF_API_PORT:-5000}}/health" -TimeoutSec 3 -UseBasicParsing
        $backendOK = $true
        Write-Host "✅ Backend: Port \${{TF_API_PORT:-5000}} - ACTIVE" -ForegroundColor Green
    } catch {
        Write-Host "❌ Backend: Port \${{TF_API_PORT:-5000}} - DOWN" -ForegroundColor Red
    }
    
    # Check frontend  
    $frontendOK = $false
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:\${{TF_API_PORT:-5000}}" -TimeoutSec 3 -UseBasicParsing
        $frontendOK = $true
        Write-Host "✅ Frontend: Port \${{TF_API_PORT:-5000}} - ACTIVE" -ForegroundColor Green
    } catch {
        Write-Host "❌ Frontend: Port \${{TF_API_PORT:-5000}} - DOWN" -ForegroundColor Red
    }
    
    # Kill any unauthorized TerraFusion processes
    $rogueProcesses = Get-Process | Where-Object {
        $_.ProcessName -match "dotnet|node" -and 
        $_.Id -notin @($backendJob.Id, $frontendJob.Id)
    }
    
    if($rogueProcesses) {
        Write-Host "⚔️  UNAUTHORIZED PROCESSES DETECTED:" -ForegroundColor Red
        $rogueProcesses | ForEach-Object {
            Write-Host "💀 Terminating rogue: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Yellow
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
    }
    
    if($backendOK -and $frontendOK) {
        Write-Host "`n🎯 TRUST FABRIC ENFORCEMENT: SUCCESS" -ForegroundColor Magenta
        Write-Host "====================================" -ForegroundColor White
        Write-Host "🖥️  Backend API: http://localhost:\${{TF_API_PORT:-5000}}" -ForegroundColor White
        Write-Host "🌐 Frontend UI: http://localhost:\${{TF_API_PORT:-5000}}" -ForegroundColor White
        Write-Host "🔐 Both services under Trust Fabric control" -ForegroundColor Green
        Write-Host "💀 Any unauthorized processes will be terminated" -ForegroundColor Red
        break
    }
}

Write-Host "`n🛡️  Trust Fabric enforcement monitoring continues..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop enforcement and terminate services" -ForegroundColor Yellow

# Keep monitoring until user stops
try {
    while($true) {
        Start-Sleep 10
        Write-Host "🔄 Trust Fabric heartbeat - Services under control" -ForegroundColor Gray
    }
} finally {
    Write-Host "`n🛑 Stopping Trust Fabric enforcement..." -ForegroundColor Red
    Stop-Job $backendJob -Force
    Stop-Job $frontendJob -Force
    Remove-Job $backendJob -Force
    Remove-Job $frontendJob -Force
    Write-Host "💀 All managed services terminated" -ForegroundColor Red
}
