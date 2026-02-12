#!/usr/bin/env pwsh

Write-Host "🔥 KILLING ALL FAKE ENHANCED APPLICATIONS" -ForegroundColor Red
Write-Host "=========================================" -ForegroundColor White

# Kill all processes on TerraFusion ports 5000-5009
$ports = @(5000, 5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009)

foreach ($port in $ports) {
    Write-Host "🔍 Checking port $port..." -ForegroundColor Yellow
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        
        if ($connections) {
            foreach ($conn in $connections) {
                $processId = $conn.OwningProcess
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                
                if ($process) {
                    Write-Host "❌ Killing fake app: $($process.ProcessName) (PID: $processId) on port $port" -ForegroundColor Red
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    Write-Host "✅ Port $port freed" -ForegroundColor Green
                }
            }
        } else {
            Write-Host "✅ Port $port already free" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️ Could not check port $port" -ForegroundColor Yellow
    }
}

Write-Host "`n🎯 CLEANING FAKE PROCESSES..." -ForegroundColor Cyan

# Kill any Python processes that might be fake launchers
$pythonProcesses = Get-Process -Name "python*" -ErrorAction SilentlyContinue
foreach ($proc in $pythonProcesses) {
    if ($proc.ProcessName -match "python") {
        Write-Host "❌ Killing Python process: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Red
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "`n🧹 CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "All fake Enhanced applications terminated." -ForegroundColor Green
Write-Host "All ports 5000-5009 are now available for REAL applications." -ForegroundColor Green 