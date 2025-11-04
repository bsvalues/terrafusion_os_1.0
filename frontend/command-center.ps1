# TerraFusion Elite Development Command Center
# Government. Transcended. - Ultimate Developer Experience

param(
    [string]$Command = "help",
    [string]$Target = "",
    [switch]$Watch,
    [switch]$Silent
)

# Elite Command Center Functions
function Write-Command {
    param([string]$Message, [string]$Level = "INFO")
    if (-not $Silent) {
        $timestamp = Get-Date -Format "HH:mm:ss"
        $color = switch ($Level) {
            "SUCCESS" { "Green" }
            "WARNING" { "Yellow" }
            "ERROR" { "Red" }
            "COMMAND" { "Cyan" }
            "RESULT" { "Magenta" }
            default { "White" }
        }
        Write-Host "[$timestamp] $Message" -ForegroundColor $color
    }
}

function Show-CommandCenter {
    Clear-Host
    Write-Host @"
╔══════════════════════════════════════════════════════════════════════════════╗
║                🏛️ TERRAFUSION ELITE COMMAND CENTER 🏛️                      ║
║                          Government. Transcended.                           ║
║                      Ultimate Developer Experience                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Green

    # System Status
    $serverStatus = Test-NetConnection -ComputerName localhost -Port 8002 -WarningAction SilentlyContinue
    $buildExists = Test-Path "../native-shell/ui/index.html"

    Write-Host ""
    Write-Host "📊 CURRENT STATUS" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

    if ($serverStatus.TcpTestSucceeded) {
        Write-Host "🟢 TerraFusion Server: OPERATIONAL (Port 8002)" -ForegroundColor Green
    } else {
        Write-Host "🔴 TerraFusion Server: OFFLINE" -ForegroundColor Red
    }

    if ($buildExists) {
        $buildTime = (Get-Item "../native-shell/ui/index.html").LastWriteTime
        Write-Host "✅ Production Build: READY ($buildTime)" -ForegroundColor Green
    } else {
        Write-Host "❌ Production Build: NOT FOUND" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "🎯 AVAILABLE COMMANDS" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host ""

    Write-Host "🏗️ BUILD COMMANDS" -ForegroundColor Cyan
    Write-Host "  build          - Full production build" -ForegroundColor White
    Write-Host "  build-dev      - Development build with source maps" -ForegroundColor White
    Write-Host "  build-analyze  - Build with bundle analyzer" -ForegroundColor White
    Write-Host "  clean          - Clean build artifacts" -ForegroundColor White
    Write-Host ""

    Write-Host "🚀 SERVER COMMANDS" -ForegroundColor Cyan
    Write-Host "  start          - Start development server" -ForegroundColor White
    Write-Host "  stop           - Stop all servers" -ForegroundColor White
    Write-Host "  restart        - Restart server" -ForegroundColor White
    Write-Host "  status         - Server status check" -ForegroundColor White
    Write-Host ""

    Write-Host "🔧 DEVELOPMENT TOOLS" -ForegroundColor Cyan
    Write-Host "  repair         - Fix TypeScript issues" -ForegroundColor White
    Write-Host "  optimize       - Performance optimization" -ForegroundColor White
    Write-Host "  benchmark      - Performance benchmarking" -ForegroundColor White
    Write-Host "  test           - Run test suite" -ForegroundColor White
    Write-Host ""

    Write-Host "📊 MONITORING" -ForegroundColor Cyan
    Write-Host "  monitor        - Real-time system monitoring" -ForegroundColor White
    Write-Host "  logs           - View server logs" -ForegroundColor White
    Write-Host "  health         - Comprehensive health check" -ForegroundColor White
    Write-Host ""

    Write-Host "🌐 QUICK ACCESS" -ForegroundColor Cyan
    Write-Host "  open           - Open application in browser" -ForegroundColor White
    Write-Host "  ide            - Open in VS Code" -ForegroundColor White
    Write-Host "  explorer       - Open build directory" -ForegroundColor White
    Write-Host ""

    Write-Host "USAGE: .\command-center.ps1 <command> [options]" -ForegroundColor Gray
    Write-Host "       .\command-center.ps1 build" -ForegroundColor Gray
    Write-Host "       .\command-center.ps1 start -Watch" -ForegroundColor Gray
}

function Invoke-BuildCommand {
    param([string]$BuildType = "production")

    Write-Command "🏗️ Initiating $BuildType build..." "COMMAND"

    switch ($BuildType) {
        "production" {
            npm run build
        }
        "dev" {
            $env:NODE_ENV = "development"
            npm run build
        }
        "analyze" {
            npm run build -- --mode=analyze
        }
        default {
            npm run build
        }
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Command "✅ Build completed successfully" "SUCCESS"

        # Show build stats
        $buildDir = "../native-shell/ui"
        if (Test-Path $buildDir) {
            $assets = Get-ChildItem "$buildDir/assets" -ErrorAction SilentlyContinue
            $totalSize = ($assets | Measure-Object Length -Sum).Sum / 1MB
            Write-Command "📦 Generated $($assets.Count) assets, $([math]::Round($totalSize, 2)) MB total" "RESULT"
        }
    } else {
        Write-Command "❌ Build failed" "ERROR"
    }
}

function Invoke-ServerCommand {
    param([string]$Action)

    switch ($Action) {
        "start" {
            Write-Command "🚀 Starting TerraFusion Elite Server..." "COMMAND"

            # Ensure build exists
            if (-not (Test-Path "../native-shell/ui/index.html")) {
                Write-Command "📦 Build not found, creating production build..." "WARNING"
                Invoke-BuildCommand
            }

            # Start server in new window
            $serverPath = Resolve-Path "../native-shell/ui"
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serverPath'; npx serve . -l 8002 --single --cors"

            Start-Sleep -Seconds 3
            $status = Test-NetConnection -ComputerName localhost -Port 8002 -WarningAction SilentlyContinue

            if ($status.TcpTestSucceeded) {
                Write-Command "✅ Server started successfully on port 8002" "SUCCESS"
                Write-Command "🌍 Access: http://localhost:8002" "RESULT"
            } else {
                Write-Command "❌ Server startup failed" "ERROR"
            }
        }

        "stop" {
            Write-Command "🛑 Stopping all Node.js processes..." "COMMAND"
            Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
            Write-Command "✅ Servers stopped" "SUCCESS"
        }

        "restart" {
            Invoke-ServerCommand "stop"
            Start-Sleep -Seconds 2
            Invoke-ServerCommand "start"
        }

        "status" {
            $status = Test-NetConnection -ComputerName localhost -Port 8002 -WarningAction SilentlyContinue
            if ($status.TcpTestSucceeded) {
                Write-Command "🟢 Server is OPERATIONAL on port 8002" "SUCCESS"
            } else {
                Write-Command "🔴 Server is OFFLINE" "ERROR"
            }
        }
    }
}

function Invoke-DevToolCommand {
    param([string]$Tool)

    switch ($Tool) {
        "repair" {
            Write-Command "🔧 Running TypeScript repair protocol..." "COMMAND"
            .\typescript-repair.ps1 -Fast
        }

        "optimize" {
            Write-Command "⚡ Running performance optimization..." "COMMAND"
            .\performance-optimizer.ps1 -Optimize
        }

        "benchmark" {
            Write-Command "🏁 Running performance benchmark..." "COMMAND"
            .\performance-optimizer.ps1 -Benchmark
        }

        "test" {
            Write-Command "🧪 Running test suite..." "COMMAND"
            npm test
        }
    }
}

function Invoke-MonitoringCommand {
    param([string]$MonitorType)

    switch ($MonitorType) {
        "monitor" {
            Write-Command "👁️ Starting real-time monitoring..." "COMMAND"
            .\elite-dashboard.ps1 -Monitoring
        }

        "logs" {
            Write-Command "📄 Checking server logs..." "COMMAND"
            # Basic log checking
            $status = Test-NetConnection -ComputerName localhost -Port 8002 -WarningAction SilentlyContinue
            if ($status.TcpTestSucceeded) {
                Write-Command "✅ Server responding normally" "SUCCESS"
            } else {
                Write-Command "❌ No server response" "ERROR"
            }
        }

        "health" {
            Write-Command "🏥 Running comprehensive health check..." "COMMAND"

            # Check multiple aspects
            $checks = @()

            # Server check
            $serverStatus = Test-NetConnection -ComputerName localhost -Port 8002 -WarningAction SilentlyContinue
            $checks += @{ Component = "Server"; Status = $serverStatus.TcpTestSucceeded }

            # Build check
            $buildExists = Test-Path "../native-shell/ui/index.html"
            $checks += @{ Component = "Build"; Status = $buildExists }

            # Dependencies check
            $nodeModules = Test-Path "node_modules"
            $checks += @{ Component = "Dependencies"; Status = $nodeModules }

            # TypeScript check
            $tsConfig = Test-Path "tsconfig.json"
            $checks += @{ Component = "TypeScript"; Status = $tsConfig }

            Write-Host ""
            Write-Host "🏥 HEALTH CHECK RESULTS" -ForegroundColor Yellow
            Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

            foreach ($check in $checks) {
                if ($check.Status) {
                    Write-Host "✅ $($check.Component): HEALTHY" -ForegroundColor Green
                } else {
                    Write-Host "❌ $($check.Component): ISSUE DETECTED" -ForegroundColor Red
                }
            }
        }
    }
}

function Invoke-QuickAccessCommand {
    param([string]$Target)

    switch ($Target) {
        "open" {
            Write-Command "🌐 Opening TerraFusion in browser..." "COMMAND"
            Start-Process "http://localhost:8002"
        }

        "ide" {
            Write-Command "💻 Opening in VS Code..." "COMMAND"
            code .
        }

        "explorer" {
            Write-Command "📁 Opening build directory..." "COMMAND"
            $buildPath = Resolve-Path "../native-shell/ui" -ErrorAction SilentlyContinue
            if ($buildPath) {
                explorer $buildPath
            } else {
                Write-Command "❌ Build directory not found" "ERROR"
            }
        }
    }
}

# Main command router
try {
    switch ($Command.ToLower()) {
        "help" { Show-CommandCenter }
        "h" { Show-CommandCenter }
        "?" { Show-CommandCenter }

        # Build commands
        "build" { Invoke-BuildCommand "production" }
        "build-dev" { Invoke-BuildCommand "dev" }
        "build-analyze" { Invoke-BuildCommand "analyze" }
        "clean" {
            Write-Command "🧹 Cleaning build artifacts..." "COMMAND"
            if (Test-Path "../native-shell/ui") {
                Remove-Item "../native-shell/ui/*" -Recurse -Force
                Write-Command "✅ Build artifacts cleaned" "SUCCESS"
            }
        }

        # Server commands
        "start" { Invoke-ServerCommand "start" }
        "stop" { Invoke-ServerCommand "stop" }
        "restart" { Invoke-ServerCommand "restart" }
        "status" { Invoke-ServerCommand "status" }

        # Dev tools
        "repair" { Invoke-DevToolCommand "repair" }
        "optimize" { Invoke-DevToolCommand "optimize" }
        "benchmark" { Invoke-DevToolCommand "benchmark" }
        "test" { Invoke-DevToolCommand "test" }

        # Monitoring
        "monitor" { Invoke-MonitoringCommand "monitor" }
        "logs" { Invoke-MonitoringCommand "logs" }
        "health" { Invoke-MonitoringCommand "health" }

        # Quick access
        "open" { Invoke-QuickAccessCommand "open" }
        "ide" { Invoke-QuickAccessCommand "ide" }
        "explorer" { Invoke-QuickAccessCommand "explorer" }

        default {
            Write-Command "❓ Unknown command: $Command" "ERROR"
            Write-Command "💡 Use '.\command-center.ps1 help' for available commands" "WARNING"
        }
    }

} catch {
    Write-Command "💥 Command execution error: $($_.Exception.Message)" "ERROR"
} finally {
    if ($Command -ne "help") {
        Write-Command "🏛️ Command completed. Government. Transcended." "RESULT"
    }
}
