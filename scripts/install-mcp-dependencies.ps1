# TerraFusion OS 1.0 - MCP Server Dependencies Installer
# THE TERRAFUSION WAY: Batch install all MCP server dependencies
# Date: October 10, 2025

param(
    [switch]$DryRun,
    [switch]$Verbose
)

Write-Host "╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                   ║" -ForegroundColor Cyan
Write-Host "║       🚀 TerraFusion MCP Dependencies Installer 🚀               ║" -ForegroundColor Cyan
Write-Host "║                                                                   ║" -ForegroundColor Cyan
Write-Host "║              THE TERRAFUSION WAY: Install Smart!                  ║" -ForegroundColor Cyan
Write-Host "║                                                                   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# Define all MCP server paths that need dependencies
$mcpServers = @(
    # AI Systems
    "modules\ai-systems\ai\mcp-server",
    "modules\ai-systems\ai-advanced\mcp-server",
    "modules\ai-systems\ai-agent-quantum-coordinator\mcp-server",
    "modules\ai-systems\ai-command-brain\mcp-server",
    "modules\ai-systems\ai-swarm\mcp-server",
    
    # Government Core
    "modules\government-core\costforge-ai-enhanced\mcp-server",
    "modules\government-core\terra-agent\mcp-server",
    "modules\government-core\terra-collections\mcp-server",
    "modules\government-core\terra-flow\mcp-server",
    "modules\government-core\terra-fusion-assessor\mcp-server",
    "modules\government-core\terra-fusion-dashboard\mcp-server",
    "modules\government-core\terra-fusion-sync\mcp-server",
    "modules\government-core\terra-insight\mcp-server",
    "modules\government-core\terra-legislative-pulse\mcp-server",
    "modules\government-core\terra-levy\mcp-server",
    "modules\government-core\terra-miner\mcp-server",
    "modules\government-core\TerraFusion-PublicRecords\mcp-server",
    "modules\government-core\TerraFusion_Record\mcp-server",
    "modules\government-core\TerraFusionPermit\mcp-server",
    
    # Backend Systems
    "backend\mcp-core",
    "backend\mcp-servers",
    
    # Pro Plus (Rust)
    "src\terrafusion-pro-plus\mcp-server"
)

$stats = @{
    Total = $mcpServers.Count
    Success = 0
    Failed = 0
    Skipped = 0
    PythonServers = 0
    TypeScriptServers = 0
    RustServers = 0
}

Write-Host "📊 Found $($stats.Total) MCP servers to process" -ForegroundColor Yellow
Write-Host ""

foreach ($serverPath in $mcpServers) {
    $fullPath = Join-Path $PSScriptRoot "..\$serverPath"
    $serverName = Split-Path $serverPath -Leaf
    $parentName = Split-Path (Split-Path $serverPath -Parent) -Leaf
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "🔧 Processing: $parentName\$serverName" -ForegroundColor Cyan
    Write-Host "   Path: $serverPath" -ForegroundColor DarkGray
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "   ⚠️  SKIP: Directory not found" -ForegroundColor Yellow
        $stats.Skipped++
        continue
    }
    
    # Determine server type and install dependencies
    $packageJson = Join-Path $fullPath "package.json"
    $requirementsTxt = Join-Path $fullPath "requirements.txt"
    $cargoToml = Join-Path $fullPath "Cargo.toml"
    
    $installed = $false
    
    # Python Server (has requirements.txt)
    if (Test-Path $requirementsTxt) {
        Write-Host "   🐍 Python Server: Installing from requirements.txt" -ForegroundColor Green
        $stats.PythonServers++
        
        if ($DryRun) {
            Write-Host "   [DRY RUN] Would run: pip install -r requirements.txt" -ForegroundColor DarkYellow
            $installed = $true
        } else {
            try {
                Push-Location $fullPath
                
                # Check if virtual environment exists
                $venvPath = Join-Path $fullPath "venv"
                if (Test-Path $venvPath) {
                    Write-Host "   📦 Using virtual environment" -ForegroundColor DarkCyan
                    & "$venvPath\Scripts\pip.exe" install -r requirements.txt --quiet
                } else {
                    Write-Host "   📦 Installing with system pip" -ForegroundColor DarkCyan
                    pip install -r requirements.txt --quiet
                }
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "   ✅ SUCCESS: Python dependencies installed" -ForegroundColor Green
                    $installed = $true
                } else {
                    throw "pip install failed with exit code $LASTEXITCODE"
                }
                
                Pop-Location
            } catch {
                Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
                Pop-Location
            }
        }
    }
    # TypeScript/JavaScript Server (has package.json, no requirements.txt)
    elseif ((Test-Path $packageJson) -and -not (Test-Path $requirementsTxt)) {
        # Check if it's actually a TypeScript server (not just Python with package.json)
        $packageContent = Get-Content $packageJson -Raw | ConvertFrom-Json
        
        if ($packageContent.main -match "\.(ts|js)$" -or $packageContent.scripts.build -match "tsc") {
            Write-Host "   📘 TypeScript/JavaScript Server: Installing from package.json" -ForegroundColor Blue
            $stats.TypeScriptServers++
            
            if ($DryRun) {
                Write-Host "   [DRY RUN] Would run: npm install" -ForegroundColor DarkYellow
                $installed = $true
            } else {
                try {
                    Push-Location $fullPath
                    
                    Write-Host "   📦 Running npm install..." -ForegroundColor DarkCyan
                    npm install --silent
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "   ✅ SUCCESS: npm dependencies installed" -ForegroundColor Green
                        $installed = $true
                    } else {
                        throw "npm install failed with exit code $LASTEXITCODE"
                    }
                    
                    Pop-Location
                } catch {
                    Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
                    Pop-Location
                }
            }
        } else {
            Write-Host "   ⚠️  SKIP: Python server with package.json but no requirements.txt" -ForegroundColor Yellow
            $stats.Skipped++
            continue
        }
    }
    # Rust Server (has Cargo.toml)
    elseif (Test-Path $cargoToml) {
        Write-Host "   🦀 Rust Server: Building with Cargo" -ForegroundColor Magenta
        $stats.RustServers++
        
        if ($DryRun) {
            Write-Host "   [DRY RUN] Would run: cargo build --release" -ForegroundColor DarkYellow
            $installed = $true
        } else {
            try {
                Push-Location $fullPath
                
                Write-Host "   📦 Running cargo build..." -ForegroundColor DarkCyan
                cargo build --release
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "   ✅ SUCCESS: Rust server built" -ForegroundColor Green
                    $installed = $true
                } else {
                    throw "cargo build failed with exit code $LASTEXITCODE"
                }
                
                Pop-Location
            } catch {
                Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
                Pop-Location
            }
        }
    }
    else {
        Write-Host "   ⚠️  SKIP: No requirements.txt, package.json, or Cargo.toml found" -ForegroundColor Yellow
        $stats.Skipped++
        continue
    }
    
    if ($installed) {
        $stats.Success++
    } else {
        $stats.Failed++
    }
    
    Write-Host ""
}

# Summary
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                   ║" -ForegroundColor Cyan
Write-Host "║                    📊 INSTALLATION SUMMARY                        ║" -ForegroundColor Cyan
Write-Host "║                                                                   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Servers:        $($stats.Total)" -ForegroundColor White
Write-Host "✅ Successfully Installed: $($stats.Success)" -ForegroundColor Green
Write-Host "❌ Failed:            $($stats.Failed)" -ForegroundColor Red
Write-Host "⚠️  Skipped:          $($stats.Skipped)" -ForegroundColor Yellow
Write-Host ""
Write-Host "By Type:" -ForegroundColor White
Write-Host "  🐍 Python:          $($stats.PythonServers)" -ForegroundColor Green
Write-Host "  📘 TypeScript:      $($stats.TypeScriptServers)" -ForegroundColor Blue
Write-Host "  🦀 Rust:            $($stats.RustServers)" -ForegroundColor Magenta
Write-Host ""
Write-Host "Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
Write-Host ""

if ($stats.Failed -gt 0) {
    Write-Host "⚠️  Some installations failed. Check output above for details." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "🎉 All dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Run .\scripts\validate-workspace.ps1 to verify!" -ForegroundColor Cyan
    exit 0
}
