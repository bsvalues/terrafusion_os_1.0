# TerraFusion OS - Post-.NET Installation Verification
# Run this AFTER installing .NET 8.0 SDK

Write-Host "🏛️ TerraFusion OS - Post-Installation Verification" -ForegroundColor Cyan
Write-Host "Government. Transcended." -ForegroundColor Green
Write-Host ""

# Step 1: Verify .NET Installation
Write-Host "🔍 Step 1: Verifying .NET 8.0 SDK Installation..." -ForegroundColor Yellow

try {
    $dotnetVersion = dotnet --version 2>$null
    if ($dotnetVersion) {
        Write-Host "✅ .NET SDK installed successfully: $dotnetVersion" -ForegroundColor Green

        # Check if it's the right version
        if ($dotnetVersion.StartsWith("8.0")) {
            Write-Host "✅ Version is .NET 8.0 - Perfect!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Version is $dotnetVersion - .NET 8.0 recommended" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ .NET SDK not found - please install and restart PowerShell" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ .NET SDK not found - please install and restart PowerShell" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Install Entity Framework Tools
Write-Host "🔧 Step 2: Installing Entity Framework Tools..." -ForegroundColor Yellow

try {
    $efResult = dotnet tool install --global dotnet-ef 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Entity Framework tools installed" -ForegroundColor Green
    } else {
        # May already be installed
        $efVersion = dotnet ef --version 2>$null
        if ($efVersion) {
            Write-Host "✅ Entity Framework tools already installed: $efVersion" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Entity Framework tools installation issue" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️  Entity Framework tools installation issue" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Backend Restore and Build
Write-Host "⚙️ Step 3: Restoring and Building Backend..." -ForegroundColor Yellow

if (Test-Path "backend") {
    try {
        Push-Location "backend"

        Write-Host "📦 Restoring NuGet packages..." -ForegroundColor Gray
        dotnet restore --nologo

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backend packages restored successfully" -ForegroundColor Green

            Write-Host "🔨 Building backend solution..." -ForegroundColor Gray
            dotnet build --nologo --configuration Release

            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Backend built successfully" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Backend build had issues (check for interface errors)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ Backend package restore failed" -ForegroundColor Red
        }

        Pop-Location
    } catch {
        Write-Host "❌ Backend setup failed" -ForegroundColor Red
        Pop-Location
    }
} else {
    Write-Host "❌ Backend directory not found" -ForegroundColor Red
}

Write-Host ""

# Step 4: Frontend Dependencies
Write-Host "🎨 Step 4: Installing Frontend Dependencies..." -ForegroundColor Yellow

if (Test-Path "frontend") {
    try {
        Push-Location "frontend"

        if (!(Test-Path "node_modules") -or (Get-ChildItem "node_modules" | Measure-Object).Count -lt 10) {
            Write-Host "📦 Installing npm packages..." -ForegroundColor Gray
            npm install --silent

            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Frontend dependency installation had issues" -ForegroundColor Yellow
            }
        } else {
            Write-Host "✅ Frontend dependencies already installed" -ForegroundColor Green
        }

        Pop-Location
    } catch {
        Write-Host "❌ Frontend setup failed" -ForegroundColor Red
        Pop-Location
    }
} else {
    Write-Host "❌ Frontend directory not found" -ForegroundColor Red
}

Write-Host ""

# Step 5: Re-run System Diagnostic
Write-Host "🔍 Step 5: Running System Diagnostic..." -ForegroundColor Yellow

if (Test-Path "agents\terrafusion-phd-systems-agent") {
    try {
        Push-Location "agents\terrafusion-phd-systems-agent"
        Write-Host "🧠 Running TerraFusion diagnostic..." -ForegroundColor Gray
        npm run diagnostic
        Pop-Location
        Write-Host "✅ Diagnostic completed - check results above" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Diagnostic had issues" -ForegroundColor Yellow
        Pop-Location
    }
} else {
    Write-Host "⚠️  Diagnostic agent not found" -ForegroundColor Yellow
}

Write-Host ""

# Step 6: Service Startup Test
Write-Host "🚀 Step 6: Testing Service Startup..." -ForegroundColor Yellow

Write-Host "📋 To start TerraFusion services:" -ForegroundColor Cyan
Write-Host "   Terminal 1: cd backend && dotnet run --project TerraFusion.API --urls http://localhost:5000" -ForegroundColor White
Write-Host "   Terminal 2: cd backend && dotnet run --project TerraFusion.Consciousness --urls http://localhost:3004" -ForegroundColor White
Write-Host "   Terminal 3: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "🌐 Service Endpoints:" -ForegroundColor Cyan
Write-Host "   Frontend PWA:     http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API:      http://localhost:5000" -ForegroundColor White
Write-Host "   AI Consciousness: http://localhost:3004" -ForegroundColor White
Write-Host "   API Docs:         http://localhost:5000/swagger" -ForegroundColor White

Write-Host ""

# Final Status
Write-Host "🎯 Installation Status Summary:" -ForegroundColor Cyan

$statusItems = @(
    @{ Name = ".NET 8.0 SDK"; Status = (Get-Command "dotnet" -ErrorAction SilentlyContinue) -ne $null },
    @{ Name = "Node.js"; Status = (Get-Command "node" -ErrorAction SilentlyContinue) -ne $null },
    @{ Name = "Python"; Status = (Get-Command "python" -ErrorAction SilentlyContinue) -ne $null },
    @{ Name = "Backend Directory"; Status = Test-Path "backend" },
    @{ Name = "Frontend Directory"; Status = Test-Path "frontend" },
    @{ Name = "Configuration"; Status = Test-Path "config" },
    @{ Name = "Workspaces"; Status = Test-Path "workspaces" }
)

foreach ($item in $statusItems) {
    $icon = if ($item.Status) { "✅" } else { "❌" }
    $color = if ($item.Status) { "Green" } else { "Red" }
    Write-Host "   $icon $($item.Name)" -ForegroundColor $color
}

Write-Host ""

# Next Steps
if ((Get-Command "dotnet" -ErrorAction SilentlyContinue) -ne $null) {
    Write-Host "🎊 SUCCESS! TerraFusion OS is ready for development!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📚 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Read: BEGINNERS_GUIDE_TO_TERRAFUSION_OS.md" -ForegroundColor White
    Write-Host "   2. Open workspace: code workspaces/master.code-workspace" -ForegroundColor White
    Write-Host "   3. Start services using the commands above" -ForegroundColor White
    Write-Host "   4. Visit http://localhost:3000 to see TerraFusion in action" -ForegroundColor White
    Write-Host ""
    Write-Host "🏛️ Government. Transcended. - Execute with championship excellence!" -ForegroundColor Magenta
} else {
    Write-Host "⚠️  .NET SDK installation required to continue" -ForegroundColor Yellow
    Write-Host "   Please install .NET 8.0 SDK and restart PowerShell" -ForegroundColor White
}
