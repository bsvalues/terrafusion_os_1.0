<#
.SYNOPSIS
    TerraFusion OS - FIXED One-Command Startup (Using ACTUAL Paths)
    
.DESCRIPTION
    Start TerraFusion services that ACTUALLY EXIST:
    - Backend API (C# .NET) - backend/TerraFusion.API
    - Frontend (React/Vite) - frontend/
    - TerraFusion cOS (Python) - terrafusion-cos/ (optional)
    
    FIXED VERSION - No more ghost paths!
    
.EXAMPLE
    .\START-TERRAFUSION-FIXED.ps1
    .\START-TERRAFUSION-FIXED.ps1 -SkipBackend
    .\START-TERRAFUSION-FIXED.ps1 -SkipCOS
#>

param(
    [switch]$SkipBackend,
    [switch]$SkipCOS,
    [switch]$OpenBrowser
)

$ErrorActionPreference = "Continue"
$WorkspaceRoot = "C:\Users\bsval\terrafusion_os_1.0"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host ("═" * 80) -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host ("═" * 80) -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success { param([string]$Msg) Write-Host "✅ $Msg" -ForegroundColor Green }
function Write-Info { param([string]$Msg) Write-Host "ℹ️  $Msg" -ForegroundColor Cyan }
function Write-Warning { param([string]$Msg) Write-Host "⚠️  $Msg" -ForegroundColor Yellow }
function Write-Error { param([string]$Msg) Write-Host "❌ $Msg" -ForegroundColor Red }

function Test-PortInUse {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("127.0.0.1", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Clear-Host
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         TERRAFUSION OS - ONE-COMMAND STARTUP (FIXED PATHS)                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host ""

$StartedServices = @()

# ============================================================================
# START BACKEND API
# ============================================================================

if (-not $SkipBackend) {
    Write-Header "STARTING BACKEND API"
    
    $backendPath = Join-Path $WorkspaceRoot "backend\TerraFusion.API"
    
    if (Test-Path $backendPath) {
        if (Test-PortInUse -Port 5000) {
            Write-Warning "Backend already running on port 5000"
        } else {
            Write-Info "Starting Backend API from: $backendPath"
            
            $processInfo = New-Object System.Diagnostics.ProcessStartInfo
            $processInfo.FileName = "pwsh.exe"
            $processInfo.Arguments = "-NoExit -Command `"cd '$backendPath'; Write-Host '🚀 TerraFusion Backend API' -ForegroundColor Cyan; dotnet run`""
            $processInfo.WorkingDirectory = $backendPath
            $processInfo.UseShellExecute = $true
            $processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
            
            $backendProcess = [System.Diagnostics.Process]::Start($processInfo)
            
            Write-Success "Backend started (PID: $($backendProcess.Id))"
            Write-Info "Waiting for backend on port 5000..."
            
            $waited = 0
            while ($waited -lt 20 -and -not (Test-PortInUse -Port 5000)) {
                Start-Sleep -Seconds 1
                $waited++
                Write-Host "." -NoNewline
            }
            Write-Host ""
            
            if (Test-PortInUse -Port 5000) {
                Write-Success "Backend ready at http://localhost:5000"
                $StartedServices += @{ Name = "Backend API"; Port = 5000; PID = $backendProcess.Id }
            } else {
                Write-Warning "Backend may still be starting (check terminal)"
            }
        }
    } else {
        Write-Error "Backend not found at: $backendPath"
    }
}

Start-Sleep -Seconds 2

# ============================================================================
# START FRONTEND
# ============================================================================

Write-Header "STARTING FRONTEND (React/Vite)"

$frontendPath = Join-Path $WorkspaceRoot "frontend"

if (Test-Path $frontendPath) {
    if (Test-PortInUse -Port 3000) {
        Write-Warning "Frontend already running on port 3000"
    } else {
        Write-Info "Starting Frontend from: $frontendPath"
        
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "pwsh.exe"
        $processInfo.Arguments = "-NoExit -Command `"cd '$frontendPath'; Write-Host '🎨 TerraFusion Frontend' -ForegroundColor Magenta; npm run dev`""
        $processInfo.WorkingDirectory = $frontendPath
        $processInfo.UseShellExecute = $true
        $processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
        
        $frontendProcess = [System.Diagnostics.Process]::Start($processInfo)
        
        Write-Success "Frontend started (PID: $($frontendProcess.Id))"
        Write-Info "Waiting for frontend on port 3000..."
        
        $waited = 0
        while ($waited -lt 15 -and -not (Test-PortInUse -Port 3000)) {
            Start-Sleep -Seconds 1
            $waited++
            Write-Host "." -NoNewline
        }
        Write-Host ""
        
        if (Test-PortInUse -Port 3000) {
            Write-Success "Frontend ready at http://localhost:3000"
            $StartedServices += @{ Name = "Frontend"; Port = 3000; PID = $frontendProcess.Id }
            
            if ($OpenBrowser) {
                Write-Info "Opening browser..."
                Start-Process "http://localhost:3000"
            }
        } else {
            Write-Warning "Frontend may still be starting (check terminal)"
        }
    }
} else {
    Write-Error "Frontend not found at: $frontendPath"
}

Start-Sleep -Seconds 2

# ============================================================================
# START TERRAFUSION COS (Optional Python Service)
# ============================================================================

if (-not $SkipCOS) {
    Write-Header "STARTING TERRAFUSION COS (Python)"
    
    $cosPath = Join-Path $WorkspaceRoot "terrafusion-cos"
    
    if (Test-Path $cosPath) {
        if (Test-PortInUse -Port 8090) {
            Write-Warning "TerraFusion cOS already running on port 8090"
        } else {
            Write-Info "Starting TerraFusion cOS from: $cosPath"
            Write-Info "(This requires Python and dependencies - will skip if not available)"
            
            # Check if api_server.py exists
            $apiServer = Join-Path $cosPath "api_server.py"
            if (Test-Path $apiServer) {
                $processInfo = New-Object System.Diagnostics.ProcessStartInfo
                $processInfo.FileName = "pwsh.exe"
                $processInfo.Arguments = "-NoExit -Command `"cd '$cosPath'; Write-Host '🐍 TerraFusion cOS' -ForegroundColor Yellow; python api_server.py`""
                $processInfo.WorkingDirectory = $cosPath
                $processInfo.UseShellExecute = $true
                $processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
                
                try {
                    $cosProcess = [System.Diagnostics.Process]::Start($processInfo)
                    Write-Success "cOS started (PID: $($cosProcess.Id))"
                    $StartedServices += @{ Name = "TerraFusion cOS"; Port = 8090; PID = $cosProcess.Id }
                } catch {
                    Write-Warning "Failed to start cOS (Python may not be configured): $($_.Exception.Message)"
                }
            } else {
                Write-Warning "api_server.py not found in $cosPath"
            }
        }
    } else {
        Write-Warning "TerraFusion cOS not found at: $cosPath"
    }
}

# ============================================================================
# STATUS DASHBOARD
# ============================================================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                     🚀 TERRAFUSION OS STARTED 🚀                            ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

if ($StartedServices.Count -gt 0) {
    Write-Host "✅ RUNNING SERVICES:" -ForegroundColor Green
    Write-Host ""
    foreach ($service in $StartedServices) {
        Write-Host "  🟢 $($service.Name)" -ForegroundColor Green
        Write-Host "     📍 http://localhost:$($service.Port)" -ForegroundColor Yellow
        Write-Host "     🔧 PID: $($service.PID)" -ForegroundColor Cyan
        Write-Host ""
    }
} else {
    Write-Host "⚠️  No services started (all skipped or already running)" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "📚 QUICK COMMANDS:" -ForegroundColor Cyan
Write-Host "   • Open frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   • Check backend: http://localhost:5000/health" -ForegroundColor White
Write-Host "   • Stop services: Close the terminal windows" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "THE TERRAFUSION WAY - Using tools we ACTUALLY built! 🚀" -ForegroundColor Cyan
Write-Host ""

Write-Host "Press any key to exit (services will continue running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
