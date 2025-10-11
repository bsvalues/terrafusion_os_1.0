<#
.SYNOPSIS
    TerraFusion OS - One-Command Startup Script
    
.DESCRIPTION
    Start all TerraFusion services with a single command:
    - Backend API (C# .NET)
    - TerraFusion Dashboard (React)
    - TerraFusion GIS (React)
    - AI Command Brain
    - AI Workspace Companion
    
    THE TERRAFUSION WAY - One command to rule them all!
    
.EXAMPLE
    .\scripts\start-everything.ps1
    .\scripts\start-everything.ps1 -SkipBackend
    .\scripts\start-everything.ps1 -Quick
#>

param(
    [switch]$SkipBackend,      # Skip starting backend (if already running)
    [switch]$Quick,            # Start only essential services
    [switch]$NoCompanion,      # Don't start AI Workspace Companion
    [switch]$InstallFirst      # Run npm install before starting (slower)
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$ErrorActionPreference = "Continue"
$WorkspaceRoot = "C:\Users\bsval\terrafusion_os_1.0"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-StartupHeader {
    param([string]$Title)
    
    Write-Host ""
    Write-Host ("═" * 80) -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host ("═" * 80) -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

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

function Start-ServiceInBackground {
    param(
        [string]$ServiceName,
        [string]$WorkingDirectory,
        [string]$Command,
        [int]$ExpectedPort = 0,
        [int]$StartupDelay = 5
    )
    
    Write-Info "Starting $ServiceName..."
    
    # Check if port is already in use
    if ($ExpectedPort -gt 0 -and (Test-PortInUse -Port $ExpectedPort)) {
        Write-Warning "$ServiceName appears to be already running on port $ExpectedPort"
        return $null
    }
    
    # Check if directory exists
    if (-not (Test-Path $WorkingDirectory)) {
        Write-Error "$ServiceName directory not found: $WorkingDirectory"
        return $null
    }
    
    # Install dependencies if requested
    if ($InstallFirst) {
        Write-Info "Installing dependencies for $ServiceName..."
        Push-Location $WorkingDirectory
        npm install --silent 2>&1 | Out-Null
        Pop-Location
    }
    
    # Start the service
    try {
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "pwsh.exe"
        $processInfo.Arguments = "-NoExit -Command `"cd '$WorkingDirectory'; $Command`""
        $processInfo.WorkingDirectory = $WorkingDirectory
        $processInfo.UseShellExecute = $true
        $processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Minimized
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        
        Write-Success "$ServiceName started (PID: $($process.Id))"
        
        # Wait for startup
        if ($ExpectedPort -gt 0) {
            Write-Info "Waiting for $ServiceName to be ready on port $ExpectedPort..."
            $waited = 0
            $maxWait = $StartupDelay * 2
            
            while ($waited -lt $maxWait -and -not (Test-PortInUse -Port $ExpectedPort)) {
                Start-Sleep -Seconds 1
                $waited++
                Write-Host "." -NoNewline
            }
            Write-Host ""
            
            if (Test-PortInUse -Port $ExpectedPort) {
                Write-Success "$ServiceName is ready!"
            } else {
                Write-Warning "$ServiceName may still be starting (check terminal window)"
            }
        }
        
        return $process
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Error "Failed to start ${ServiceName}: $errorMsg"
        return $null
    }
}

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================

function Test-Prerequisites {
    Write-StartupHeader "PRE-FLIGHT CHECKS"
    
    $allGood = $true
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>&1
        Write-Success "Node.js $nodeVersion found"
    } catch {
        Write-Error "Node.js not found! Please install Node.js 18+"
        $allGood = $false
    }
    
    # Check .NET (if not skipping backend)
    if (-not $SkipBackend) {
        try {
            $dotnetVersion = dotnet --version 2>&1
            Write-Success ".NET SDK $dotnetVersion found"
        } catch {
            Write-Error ".NET SDK not found! Please install .NET 8.0+"
            $allGood = $false
        }
    }
    
    # Check npm
    try {
        $npmVersion = npm --version 2>&1
        Write-Success "npm $npmVersion found"
    } catch {
        Write-Error "npm not found! Please install npm"
        $allGood = $false
    }
    
    # Check workspace
    if (Test-Path $WorkspaceRoot) {
        Write-Success "Workspace found: $WorkspaceRoot"
    } else {
        Write-Error "Workspace not found: $WorkspaceRoot"
        $allGood = $false
    }
    
    Write-Host ""
    
    if (-not $allGood) {
        Write-Error "Pre-flight checks failed! Please fix the issues above."
        exit 1
    }
}

# ============================================================================
# STARTUP FUNCTIONS
# ============================================================================

function Start-Backend {
    Write-StartupHeader "STARTING BACKEND API"
    
    $backendPath = Join-Path $WorkspaceRoot "backend\api-unified"
    
    if (-not (Test-Path $backendPath)) {
        Write-Warning "Backend directory not found: $backendPath"
        Write-Info "Skipping backend startup"
        return $null
    }
    
    # Check if already running
    if (Test-PortInUse -Port 5000) {
        Write-Warning "Backend API appears to be already running on port 5000"
        return $null
    }
    
    Write-Info "Starting TerraFusion Backend API..."
    
    try {
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "pwsh.exe"
        $processInfo.Arguments = "-NoExit -Command `"cd '$backendPath'; dotnet run`""
        $processInfo.WorkingDirectory = $backendPath
        $processInfo.UseShellExecute = $true
        $processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Minimized
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        
        Write-Success "Backend API started (PID: $($process.Id))"
        Write-Info "Waiting for backend to be ready on port 5000..."
        
        $waited = 0
        $maxWait = 30
        
        while ($waited -lt $maxWait -and -not (Test-PortInUse -Port 5000)) {
            Start-Sleep -Seconds 1
            $waited++
            Write-Host "." -NoNewline
        }
        Write-Host ""
        
        if (Test-PortInUse -Port 5000) {
            Write-Success "Backend API is ready! http://localhost:5000"
        } else {
            Write-Warning "Backend may still be starting (check terminal window)"
        }
        
        return $process
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Error "Failed to start backend: $errorMsg"
        return $null
    }
}

function Start-Dashboard {
    Write-StartupHeader "STARTING TERRAFUSION DASHBOARD"
    
    $dashboardPath = Join-Path $WorkspaceRoot "src\terrafusion-dashboard\TerraFusionDashboard"
    
    return Start-ServiceInBackground `
        -ServiceName "TerraFusion Dashboard" `
        -WorkingDirectory $dashboardPath `
        -Command "npm run dev" `
        -ExpectedPort 3001 `
        -StartupDelay 10
}

function Start-GIS {
    Write-StartupHeader "STARTING TERRAFUSION GIS"
    
    $gisPath = Join-Path $WorkspaceRoot "src\terrafusion-gis"
    
    return Start-ServiceInBackground `
        -ServiceName "TerraFusion GIS" `
        -WorkingDirectory $gisPath `
        -Command "npm run dev" `
        -ExpectedPort 3002 `
        -StartupDelay 10
}

function Start-Demo {
    Write-StartupHeader "STARTING TERRAFUSION v0 DEMO"
    
    $demoPath = Join-Path $WorkspaceRoot "src\terrafusion-v0-demo"
    
    return Start-ServiceInBackground `
        -ServiceName "TerraFusion v0 Demo" `
        -WorkingDirectory $demoPath `
        -Command "npm run dev" `
        -ExpectedPort 3000 `
        -StartupDelay 10
}

function Start-AICompanion {
    Write-StartupHeader "STARTING AI WORKSPACE COMPANION"
    
    $companionPath = Join-Path $WorkspaceRoot "ai-workspace-companion"
    
    if (-not (Test-Path $companionPath)) {
        Write-Warning "AI Workspace Companion not found: $companionPath"
        return $null
    }
    
    Write-Info "Starting AI Workspace Companion..."
    
    try {
        $processInfo = New-Object System.Diagnostics.ProcessStartInfo
        $processInfo.FileName = "pwsh.exe"
        $processInfo.Arguments = "-NoExit -Command `"cd '$companionPath'; npm run launch`""
        $processInfo.WorkingDirectory = $companionPath
        $processInfo.UseShellExecute = $true
        $processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
        
        $process = [System.Diagnostics.Process]::Start($processInfo)
        
        Write-Success "AI Workspace Companion started (PID: $($process.Id))"
        
        return $process
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Error "Failed to start AI Workspace Companion: $errorMsg"
        return $null
    }
}

# ============================================================================
# DISPLAY STATUS DASHBOARD
# ============================================================================

function Show-StatusDashboard {
    param($Services)
    
    Write-StartupHeader "TERRAFUSION OS STATUS DASHBOARD"
    
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                     🚀 ALL SERVICES STARTED 🚀                               ║" -ForegroundColor Green
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  FRONTEND SERVICES" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    if ($Services.Dashboard) {
        Write-Host "  ✅ TerraFusion Dashboard" -ForegroundColor Green
        Write-Host "     📍 http://localhost:3001" -ForegroundColor Yellow
        Write-Host "     🎯 Main county operations interface"
        Write-Host ""
    }
    
    if ($Services.GIS) {
        Write-Host "  ✅ TerraFusion GIS" -ForegroundColor Green
        Write-Host "     📍 http://localhost:3002" -ForegroundColor Yellow
        Write-Host "     🗺️  GIS mapping and spatial analysis"
        Write-Host ""
    }
    
    if ($Services.Demo) {
        Write-Host "  ✅ TerraFusion v0 Demo" -ForegroundColor Green
        Write-Host "     📍 http://localhost:3000" -ForegroundColor Yellow
        Write-Host "     🎪 Next.js demo application"
        Write-Host ""
    }
    
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  BACKEND SERVICES" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    if ($Services.Backend) {
        Write-Host "  ✅ TerraFusion API" -ForegroundColor Green
        Write-Host "     📍 http://localhost:5000" -ForegroundColor Yellow
        Write-Host "     🔧 C# .NET unified API gateway"
        Write-Host ""
    } else {
        Write-Host "  ⚠️  TerraFusion API" -ForegroundColor Yellow
        Write-Host "     Not started (use -SkipBackend flag was used or backend unavailable)"
        Write-Host ""
    }
    
    if ($Services.Companion -and -not $NoCompanion) {
        Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "  AI SERVICES" -ForegroundColor Cyan
        Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  ✅ AI Workspace Companion" -ForegroundColor Green
        Write-Host "     🤖 Your AI development assistant"
        Write-Host ""
    }
    
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  QUICK ACCESS" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  📚 Documentation:"
    Write-Host "     - WORKSPACE_NAVIGATION_GUIDE.md (complete workspace guide)"
    Write-Host "     - ACTIVE_SYSTEMS.md (ready-to-run guide)"
    Write-Host "     - .workspace-map.json (machine-readable structure)"
    Write-Host ""
    Write-Host "  🔧 Management Commands:"
    Write-Host "     - .\scripts\health-check.ps1 (check system health)"
    Write-Host "     - .\scripts\validate-workspace.ps1 (validate all packages)"
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  💡 TIP: All services are running in minimized terminal windows." -ForegroundColor Yellow
    Write-Host "      Check the taskbar to bring them to the foreground if needed." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Clear-Host

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║            TERRAFUSION OS - ONE-COMMAND STARTUP                             ║" -ForegroundColor Cyan
Write-Host "║                      THE TERRAFUSION WAY                                     ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting TerraFusion OS at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host ""

# Run pre-flight checks
Test-Prerequisites

# Track started services
$StartedServices = @{
    Backend = $null
    Dashboard = $null
    GIS = $null
    Demo = $null
    Companion = $null
}

# Start services
if (-not $SkipBackend) {
    $StartedServices.Backend = Start-Backend
    Start-Sleep -Seconds 2
}

$StartedServices.Dashboard = Start-Dashboard
Start-Sleep -Seconds 2

if (-not $Quick) {
    $StartedServices.GIS = Start-GIS
    Start-Sleep -Seconds 2
    
    $StartedServices.Demo = Start-Demo
    Start-Sleep -Seconds 2
}

if (-not $NoCompanion) {
    $StartedServices.Companion = Start-AICompanion
}

# Show status dashboard
Show-StatusDashboard -Services $StartedServices

Write-Host "THE TERRAFUSION WAY - One command to rule them all! 🚀" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this window (services will continue running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
