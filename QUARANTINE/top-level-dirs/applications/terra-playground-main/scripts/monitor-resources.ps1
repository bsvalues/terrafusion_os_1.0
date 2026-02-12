function Test-SystemResources {
    Write-Host "Checking system resources..."
    
    $minMemory = 16GB
    $minDiskSpace = 50GB
    $minCpuCores = 4
    
    $memory = Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property capacity -Sum
    $disk = Get-PSDrive C
    $cpu = Get-CimInstance Win32_Processor
    
    $issues = @()
    
    if ($memory.Sum -lt $minMemory) {
        $issues += "Insufficient memory: $([math]::Round($memory.Sum/1GB, 2))GB available, $([math]::Round($minMemory/1GB, 2))GB required"
    }
    
    if ($disk.Free -lt $minDiskSpace) {
        $issues += "Insufficient disk space: $([math]::Round($disk.Free/1GB, 2))GB available, $([math]::Round($minDiskSpace/1GB, 2))GB required"
    }
    
    if ($cpu.NumberOfCores -lt $minCpuCores) {
        $issues += "Insufficient CPU cores: $($cpu.NumberOfCores) available, $minCpuCores required"
    }
    
    if ($issues.Count -gt 0) {
        throw "System requirements not met:`n$($issues -join "`n")"
    }
}

function Monitor-BuildResources {
    Write-Host "Monitoring build resources..."
    
    $logFile = "build-resources.log"
    $interval = 30
    $duration = 3600
    
    $startTime = Get-Date
    $endTime = $startTime.AddSeconds($duration)
    
    while ((Get-Date) -lt $endTime) {
        $memory = Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*python*" } | Measure-Object -Property WorkingSet -Sum
        $cpu = Get-CimInstance Win32_Processor | Select-Object -ExpandProperty LoadPercentage
        $disk = Get-PSDrive C | Select-Object -ExpandProperty Free
        
        $logEntry = @{
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            MemoryUsage = [math]::Round($memory.Sum/1MB, 2)
            CpuUsage = $cpu
            DiskSpace = [math]::Round($disk/1GB, 2)
        }
        
        $logEntry | ConvertTo-Json | Add-Content $logFile
        
        if ($memory.Sum -gt 12GB) {
            Write-Warning "High memory usage detected: $([math]::Round($memory.Sum/1GB, 2))GB"
        }
        
        if ($cpu -gt 90) {
            Write-Warning "High CPU usage detected: $cpu%"
        }
        
        if ($disk -lt 10GB) {
            Write-Warning "Low disk space: $([math]::Round($disk/1GB, 2))GB"
        }
        
        Start-Sleep -Seconds $interval
    }
}

function Cleanup-Resources {
    Write-Host "Cleaning up resources..."
    
    Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*python*" } | Stop-Process -Force
    Remove-Item -Path "temp" -Recurse -Force -ErrorAction SilentlyContinue
    Clear-RecycleBin -Force
}

function Main {
    try {
        Test-SystemResources
        Monitor-BuildResources
    } catch {
        Write-Error "Resource monitoring failed: $_"
        Cleanup-Resources
        exit 1
    }
}

Main 