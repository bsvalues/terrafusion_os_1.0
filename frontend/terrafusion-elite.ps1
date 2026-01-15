# TerraFusion Elite Development Orchestrator
# Government. Transcended. - Engineering Excellence Protocol

param(
    [switch]$Watch,
    [switch]$Analyze,
    [switch]$Test,
    [string]$Port = "8002",
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# ASCII Art Banner
Write-Host @"
╔══════════════════════════════════════════════════════════════════════════════╗
║                        🏛️ TERRAFUSION ELITE OS 🏛️                          ║
║                          Government. Transcended.                           ║
║                     Engineering Excellence Protocol                         ║
╚══════════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

function Write-Elite {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss.fff"
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        "QUANTUM" { "Magenta" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-TerraFusionHealth {
    Write-Elite "🔍 Performing championship-level health diagnostics..." "QUANTUM"

    # Check Node.js version
    $nodeVersion = node --version
    Write-Elite "Node.js Version: $nodeVersion" "SUCCESS"

    # Check npm version
    $npmVersion = npm --version
    Write-Elite "npm Version: $npmVersion" "SUCCESS"

    # Check TypeScript compilation
    Write-Elite "🔧 Validating TypeScript configuration..." "INFO"
    $tscResult = npx tsc --noEmit --skipLibCheck 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Elite "✅ TypeScript validation passed" "SUCCESS"
    } else {
        Write-Elite "⚠️ TypeScript issues detected (non-blocking)" "WARNING"
        if ($Verbose) { Write-Host $tscResult }
    }

    # Check for critical files
    $criticalFiles = @(
        "src/App.tsx",
        "src/main.tsx",
        "vite.config.ts",
        "package.json"
    )

    foreach ($file in $criticalFiles) {
        if (Test-Path $file) {
            Write-Elite "✅ Critical file found: $file" "SUCCESS"
        } else {
            Write-Elite "❌ Missing critical file: $file" "ERROR"
        }
    }
}

function Start-QuantumBuild {
    param([switch]$Analyze)

    Write-Elite "🔬 Initiating quantum-enhanced build process..." "QUANTUM"

    # Clean previous builds
    if (Test-Path "../native-shell/ui/dist") {
        Write-Elite "🧹 Cleaning previous build artifacts..." "INFO"
        Remove-Item "../native-shell/ui/dist/*" -Recurse -Force -ErrorAction SilentlyContinue
    }

    # Build command with optional analysis
    $buildCommand = if ($Analyze) { "npm run build -- --mode=analyze" } else { "npm run build" }

    Write-Elite "⚡ Executing: $buildCommand" "INFO"
    $buildStart = Get-Date

    Invoke-Expression $buildCommand

    if ($LASTEXITCODE -eq 0) {
        $buildDuration = ((Get-Date) - $buildStart).TotalSeconds
        Write-Elite "🎯 Build completed in $([math]::Round($buildDuration, 2))s - Championship performance!" "SUCCESS"
        return $true
    } else {
        Write-Elite "💥 Build failed - Initiating autonomous recovery protocols..." "ERROR"
        return $false
    }
}

function Start-EliteServer {
    param([string]$Port)

    Write-Elite "🚀 Deploying TerraFusion Elite Server on port $Port..." "QUANTUM"

    # Navigate to build output
    Push-Location "../native-shell/ui/dist"

    try {
        # Check if port is available
        $portCheck = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        if ($portCheck.TcpTestSucceeded) {
            Write-Elite "⚠️ Port $Port already in use - attempting graceful takeover..." "WARNING"
            # Kill existing processes on port
            $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
            foreach ($proc in $processes) {
                Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
            }
            Start-Sleep -Seconds 2
        }

        Write-Elite "🌐 Server starting with infinite scalability architecture..." "SUCCESS"
        Write-Elite "📡 Access URLs:" "INFO"
        Write-Elite "   🏠 Local:    http://localhost:$Port" "SUCCESS"
        Write-Elite "   🌍 Network:  http://172.22.48.1:$Port" "SUCCESS"

        # Start server with enhanced configuration
        npx serve . -l $Port --single --cors --compress

    } finally {
        Pop-Location
    }
}

function Start-WatchMode {
    Write-Elite "👁️ Activating autonomous watch mode with quantum optimization..." "QUANTUM"

    # Create file watcher
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = "./src"
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true
    $watcher.Filter = "*.tsx"

    # Define the action
    $action = {
        $path = $Event.SourceEventArgs.FullPath
        $changeType = $Event.SourceEventArgs.ChangeType
        Write-Elite "📝 File change detected: $path ($changeType)" "INFO"
        Write-Elite "🔄 Initiating autonomous rebuild..." "QUANTUM"

        # Rebuild in background
        Start-Job -ScriptBlock {
            cd $using:PWD
            npm run build 2>&1 | Out-Null
        } | Out-Null
    }

    # Register events
    Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action
    Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action
    Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $action

    Write-Elite "✅ Watch mode activated - Quantum-level responsiveness enabled" "SUCCESS"
    return $watcher
}

# Main execution flow
try {
    Write-Elite "🎯 TerraFusion Elite Engineering Protocol initiated..." "QUANTUM"

    # Health check
    Test-TerraFusionHealth

    # Execute tests if requested
    if ($Test) {
        Write-Elite "🧪 Running championship-level test suite..." "INFO"
        npm test -- --run --reporter=verbose
        if ($LASTEXITCODE -ne 0) {
            Write-Elite "❌ Tests failed - Autonomous healing required" "ERROR"
            exit 1
        }
        Write-Elite "✅ All tests passed with transcendent excellence" "SUCCESS"
    }

    # Build with optional analysis
    $buildSuccess = Start-QuantumBuild -Analyze:$Analyze
    if (-not $buildSuccess) {
        Write-Elite "💥 Build failure detected - Terminating with error code" "ERROR"
        exit 1
    }

    # Start watch mode if requested
    $watcher = $null
    if ($Watch) {
        $watcher = Start-WatchMode
    }

    # Start elite server
    Write-Elite "🏛️ Government. Transcended. - Server deployment commencing..." "QUANTUM"
    Start-EliteServer -Port $Port

} catch {
    Write-Elite "💥 Critical error in engineering protocol: $($_.Exception.Message)" "ERROR"
    exit 1
} finally {
    # Cleanup
    if ($watcher) {
        $watcher.Dispose()
        Write-Elite "🔧 Watch mode terminated" "INFO"
    }
    Write-Elite "🏁 TerraFusion Elite Protocol completed" "QUANTUM"
}
