# TerraFusion Suite Launcher - PowerShell Script
# Launches actual TerraFusion production applications for Benton County

Write-Host "🚀 LAUNCHING TERRAFUSION PRODUCTION SUITE FOR BENTON COUNTY" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Blue

# Set the working directory to the DEPLOYED_APPLICATIONS folder
Set-Location -Path $PSScriptRoot

# Production application configurations
$applications = @(
    @{
        Name = "BCBSGISPRO - Property Search & GIS"
        Directory = "BCBSGISPRO_PRODUCTION"
        Port = 3000
        URL = "http://localhost:3000"
        Description = "Full-stack property search with GIS mapping and Benton County data"
        StartCommand = "npm run dev"
        Type = "Node.js/React"
    },
    @{
        Name = "TerraFlow - Workflow Engine"
        Directory = "TerraFlow_PRODUCTION"
        Port = 5000
        URL = "http://localhost:5000"
        Description = "Advanced workflow engine for property assessments"
        StartCommand = "python app.py"
        Type = "Python/Flask"
    },
    @{
        Name = "TerraFusionPro - Professional Suite"
        Directory = "TerraFusionPro_PRODUCTION"
        Port = 3001
        URL = "http://localhost:3001"
        Description = "Complete TerraFusion professional platform"
        StartCommand = "npm run dev"
        Type = "Node.js/React"
    },
    @{
        Name = "TerraFusionDashboard - Analytics"
        Directory = "TerraFusionDashboard_PRODUCTION"
        Port = 3002
        URL = "http://localhost:3002"
        Description = "Advanced analytics and reporting dashboard"
        StartCommand = "npm run dev"
        Type = "Node.js/React"
    },
    @{
        Name = "BSIncomeValuation - Valuation Engine"
        Directory = "BSIncomeValuation_PRODUCTION"
        Port = 5001
        URL = "http://localhost:5001"
        Description = "Income-based property valuation system"
        StartCommand = "python server/app.py"
        Type = "Python/Flask"
    }
)

# Start each production application
$processes = @()
foreach ($app in $applications) {
    $appPath = Join-Path $PSScriptRoot $app.Directory
    
    if (Test-Path $appPath) {
        Write-Host "▶️ Starting $($app.Name) on port $($app.Port)..." -ForegroundColor Yellow
        Write-Host "   Type: $($app.Type) | Path: $($app.Directory)" -ForegroundColor Gray
        
        try {
            Set-Location -Path $appPath
            
            if ($app.Type -like "*Node.js*") {
                # Check if node_modules exists, if not run npm install
                if (-not (Test-Path "node_modules")) {
                    Write-Host "   📦 Installing dependencies..." -ForegroundColor Cyan
                    npm install
                }
                $process = Start-Process npm -ArgumentList "run", "dev" -WindowStyle Minimized -PassThru
            }
            elseif ($app.Type -like "*Python*") {
                # Check if requirements.txt exists and install dependencies
                if (Test-Path "requirements.txt") {
                    Write-Host "   📦 Installing Python dependencies..." -ForegroundColor Cyan
                    pip install -r requirements.txt
                }
                $process = Start-Process python -ArgumentList $app.StartCommand.Split(" ")[1] -WindowStyle Minimized -PassThru
            }
            
            $processes += @{
                Process = $process
                App = $app
                Path = $appPath
            }
            Write-Host "✅ $($app.Name) started successfully!" -ForegroundColor Green
            Start-Sleep -Seconds 3
        }
        catch {
            Write-Host "❌ Failed to start $($app.Name): $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Return to original directory
        Set-Location -Path $PSScriptRoot
    }
    else {
        Write-Host "⚠️ Production app not found: $($app.Directory)" -ForegroundColor Yellow
    }
}

# Wait for applications to initialize
Write-Host "⏳ Waiting for production applications to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Display status and URLs
Write-Host ""
Write-Host "🎉 TERRAFUSION PRODUCTION SUITE IS NOW RUNNING!" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Blue
Write-Host "📱 Access your production applications:" -ForegroundColor White

foreach ($app in $applications) {
    Write-Host "   • $($app.Name.PadRight(35)) $($app.URL)" -ForegroundColor Cyan
    Write-Host "     $($app.Description)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "💡 For Benton County demonstration:" -ForegroundColor Yellow
Write-Host "   1. Start with BCBSGISPRO (port 3000) - Full property search & GIS" -ForegroundColor White
Write-Host "   2. Use TerraFlow (port 5000) - Workflow engine for assessments" -ForegroundColor White
Write-Host "   3. Access TerraFusionPro (port 3001) - Complete professional suite" -ForegroundColor White
Write-Host "   4. View analytics in Dashboard (port 3002) - Advanced reporting" -ForegroundColor White
Write-Host "   5. Run valuations with BSIncomeValuation (port 5001) - Valuation engine" -ForegroundColor White
Write-Host ""

# Open the main application in browser
try {
    Write-Host "🌐 Opening browser to BCBSGISPRO Property Search..." -ForegroundColor Cyan
    Start-Process "http://localhost:3000"
}
catch {
    Write-Host "⚠️ Could not open browser automatically. Please navigate to http://localhost:3000" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Press any key to stop all production applications..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Stop all processes
Write-Host "🛑 Stopping all TerraFusion production applications..." -ForegroundColor Red
foreach ($processInfo in $processes) {
    try {
        if (-not $processInfo.Process.HasExited) {
            $processInfo.Process.CloseMainWindow()
            Start-Sleep -Seconds 2
            if (-not $processInfo.Process.HasExited) {
                $processInfo.Process.Kill()
            }
            Write-Host "✅ Stopped $($processInfo.App.Name)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "⚠️ Error stopping $($processInfo.App.Name): $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "👋 TerraFusion Production Suite shutdown complete" -ForegroundColor Green 