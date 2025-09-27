# TerraFusion Management System - Simple & Powerful

param([string]$Cmd = "help")

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "          TERRAFUSION MANAGEMENT SYSTEM" -ForegroundColor White  
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

switch ($Cmd) {
    "status" {
        Write-Host "[*] System Status:" -ForegroundColor Yellow
        
        # CPU
        $cpu = (Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction SilentlyContinue).CounterSamples.CookedValue
        Write-Host "    CPU Usage: $([Math]::Round($cpu, 2))%" -ForegroundColor $(if ($cpu -gt 80) {"Red"} elseif ($cpu -gt 60) {"Yellow"} else {"Green"})
        
        # Memory  
        $mem = Get-WmiObject Win32_OperatingSystem
        $totalMem = [Math]::Round($mem.TotalVisibleMemorySize / 1MB, 2)
        $freeMem = [Math]::Round($mem.FreePhysicalMemory / 1MB, 2)
        $memPercent = [Math]::Round((($totalMem - $freeMem) / $totalMem) * 100, 2)
        Write-Host "    Memory: $memPercent% used" -ForegroundColor $(if ($memPercent -gt 90) {"Red"} elseif ($memPercent -gt 75) {"Yellow"} else {"Green"})
        
        # Disk
        $disk = Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='C:'"
        $diskPercent = [Math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 2)
        Write-Host "    Disk C: $diskPercent% used" -ForegroundColor $(if ($diskPercent -gt 90) {"Red"} elseif ($diskPercent -gt 80) {"Yellow"} else {"Green"})
        
        Write-Host ""
        Write-Host "[*] TerraFusion Services:" -ForegroundColor Yellow
        
        # Check ports
        @(5000,5001,5002,5003,5004,5006,8000,8080) | ForEach-Object {
            $port = $_
            $test = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet
            if ($test) {
                Write-Host "    Port $port : ACTIVE" -ForegroundColor Green
            }
        }
    }
    
    "optimize" {
        Write-Host "[*] Optimizing System..." -ForegroundColor Yellow
        
        # Clear temp
        Remove-Item "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "    Temp files cleared" -ForegroundColor Green
        
        # Clear npm cache
        npm cache clean --force 2>$null | Out-Null
        Write-Host "    NPM cache cleared" -ForegroundColor Green
        
        # Clear Python cache
        Get-ChildItem -Path . -Filter "__pycache__" -Recurse -Directory -ErrorAction SilentlyContinue | 
            Select-Object -First 10 | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "    Python cache cleared" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "[+] Optimization complete!" -ForegroundColor Green
    }
    
    "start" {
        Write-Host "[*] Starting Services..." -ForegroundColor Yellow
        Write-Host "    Opening web interfaces..." -ForegroundColor Cyan
        Start-Process "http://localhost:\${{TF_API_PORT:-5000}}"
        Start-Process "http://localhost:\${{TF_API_PORT:-5000}}"
        Write-Host "[+] Browsers launched" -ForegroundColor Green
    }
    
    "fix" {
        Write-Host "[*] Quick Fix..." -ForegroundColor Yellow
        
        # Kill stuck processes
        Get-Process node, python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "    Processes cleaned" -ForegroundColor Green
        
        # Clear ports
        @(5000,5001,5002,5003,5004,5006,8000,8080) | ForEach-Object {
            $conn = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
            if ($conn) { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue }
        }
        Write-Host "    Ports cleared" -ForegroundColor Green
        
        Write-Host "[+] Fix complete!" -ForegroundColor Green
    }
    
    "help" {
        Write-Host "Commands:" -ForegroundColor Cyan
        Write-Host "  status   - Check system health" -ForegroundColor White
        Write-Host "  optimize - Clean and optimize" -ForegroundColor White
        Write-Host "  start    - Launch services" -ForegroundColor White
        Write-Host "  fix      - Fix common issues" -ForegroundColor White
        Write-Host ""
        Write-Host "Usage: .\MANAGE.ps1 <command>" -ForegroundColor Gray
    }
    
    default {
        Write-Host "[!] Unknown command. Use: .\MANAGE.ps1 help" -ForegroundColor Red
    }
}

Write-Host ""
