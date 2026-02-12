# 🔄 WORKSPACE SWITCHER
# TerraFusion OS 1.0 - Quick Workspace Selection Tool

param(
    [string]$Role = "",
    [switch]$List,
    [switch]$Help
)

if ($Help) {
    Write-Host "🎯 TerraFusion Workspace Switcher" -ForegroundColor Cyan
    Write-Host "Usage: .\Switch-Workspace.ps1 -Role <role> [-List] [-Help]" -ForegroundColor White
    Write-Host ""
    Write-Host "Roles:" -ForegroundColor Yellow
    Write-Host "  owner       - Master workspace (Supreme Commander view)" -ForegroundColor White
    Write-Host "  cto         - Master workspace (Architecture oversight)" -ForegroundColor White
    Write-Host "  backend     - Backend services development" -ForegroundColor White
    Write-Host "  frontend    - Frontend platform development" -ForegroundColor White  
    Write-Host "  marketplace - Marketplace infrastructure" -ForegroundColor White
    Write-Host "  platform    - OS Platform services" -ForegroundColor White
    Write-Host ""
    Write-Host "Government Portals:" -ForegroundColor Yellow
    Write-Host "  citizen     - Citizen Services Portal" -ForegroundColor White
    Write-Host "  enforcement - Code Enforcement Portal" -ForegroundColor White
    Write-Host "  economic    - Economic Development Portal" -ForegroundColor White
    Write-Host "  hr          - Human Resources Portal" -ForegroundColor White
    Write-Host "  legal       - Legal & Judicial Portal" -ForegroundColor White
    Write-Host "  health      - Public Health Portal" -ForegroundColor White
    Write-Host "  works       - Public Works Portal" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\Switch-Workspace.ps1 -Role owner" -ForegroundColor Gray
    Write-Host "  .\Switch-Workspace.ps1 -Role backend" -ForegroundColor Gray
    Write-Host "  .\Switch-Workspace.ps1 -List" -ForegroundColor Gray
    exit 0
}

Write-Host "🚀 TerraFusion Workspace Switcher" -ForegroundColor Cyan

if ($List) {
    Write-Host "📁 Available Workspaces:" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "🎯 Leadership & Architecture:" -ForegroundColor Yellow
    Write-Host "   master.code-workspace              - Supreme Commander (Owner/CTO)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🏗️ Platform Development:" -ForegroundColor Yellow
    Write-Host "   backend.code-workspace             - Backend Services Team" -ForegroundColor White
    Write-Host "   frontend.code-workspace            - Frontend Core Team" -ForegroundColor White
    Write-Host "   marketplace.code-workspace         - Marketplace Infrastructure" -ForegroundColor White
    Write-Host "   os-platform.code-workspace         - OS Platform Team" -ForegroundColor White
    Write-Host "   terrafusion-cos.code-workspace     - TerraFusion COS Team" -ForegroundColor White
    
    Write-Host ""
    Write-Host "🏛️ Government Portals:" -ForegroundColor Yellow
    $portals = @(
        "citizen-services", "code-enforcement", "economic-development", 
        "human-resources", "legal-judicial", "public-health", "public-works"
    )
    foreach ($portal in $portals) {
        Write-Host "   frontend/$portal.code-workspace" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "💼 Marketplace Applications:" -ForegroundColor Yellow
    $apps = Get-ChildItem -Path "workspaces/marketplace" -Filter "*.code-workspace" | Select-Object -First 10
    foreach ($app in $apps) {
        Write-Host "   marketplace/$($app.Name)" -ForegroundColor White
    }
    Write-Host "   ... and 22 more marketplace apps" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "Use: .\Switch-Workspace.ps1 -Role <role> to open workspace" -ForegroundColor Cyan
    exit 0
}

if ($Role -eq "") {
    Write-Host "❌ Error: Role required" -ForegroundColor Red
    Write-Host "Use: .\Switch-Workspace.ps1 -Help for options" -ForegroundColor Yellow
    exit 1
}

# Role to workspace mapping
$workspaceMap = @{
    "owner" = "workspaces/master.code-workspace"
    "cto" = "workspaces/master.code-workspace"
    "backend" = "workspaces/backend.code-workspace"
    "frontend" = "workspaces/frontend.code-workspace"
    "marketplace" = "workspaces/marketplace.code-workspace" 
    "platform" = "workspaces/os-platform.code-workspace"
    "cos" = "workspaces/terrafusion-cos.code-workspace"
    "citizen" = "workspaces/frontend/citizen-services.code-workspace"
    "enforcement" = "workspaces/frontend/code-enforcement.code-workspace"
    "economic" = "workspaces/frontend/economic-development.code-workspace"
    "hr" = "workspaces/frontend/human-resources.code-workspace"
    "legal" = "workspaces/frontend/legal-judicial.code-workspace"
    "health" = "workspaces/frontend/public-health.code-workspace"
    "works" = "workspaces/frontend/public-works.code-workspace"
}

$workspacePath = $workspaceMap[$Role.ToLower()]

if (-not $workspacePath) {
    Write-Host "❌ Error: Unknown role '$Role'" -ForegroundColor Red
    Write-Host "Use: .\Switch-Workspace.ps1 -Help for available roles" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $workspacePath)) {
    Write-Host "❌ Error: Workspace file not found: $workspacePath" -ForegroundColor Red
    exit 1
}

Write-Host "🎯 Opening workspace for role: $Role" -ForegroundColor Green
Write-Host "📁 Workspace: $workspacePath" -ForegroundColor Gray

# Try to open with VS Code
try {
    Write-Host "🚀 Launching VS Code..." -ForegroundColor Cyan
    
    # Use code command if available
    if (Get-Command code -ErrorAction SilentlyContinue) {
        Start-Process "code" -ArgumentList $workspacePath
        Write-Host "✅ VS Code launched with workspace!" -ForegroundColor Green
    } else {
        # Fallback to explorer
        Write-Host "⚠️  VS Code command not found, opening file location..." -ForegroundColor Yellow
        Start-Process "explorer" -ArgumentList "/select,$((Resolve-Path $workspacePath).Path)"
        Write-Host "📁 File location opened. Double-click the .code-workspace file." -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "🎊 Welcome to your TerraFusion workspace!" -ForegroundColor Magenta
    
    # Role-specific tips
    switch ($Role.ToLower()) {
        "owner" { 
            Write-Host "👑 Owner Tips:" -ForegroundColor Yellow
            Write-Host "   - Press F5 to launch health dashboard" -ForegroundColor White
            Write-Host "   - Use Ctrl+Shift+P → 'Tasks: Generate Workspace Health Report'" -ForegroundColor White
            Write-Host "   - Monitor all 45 workspaces from here" -ForegroundColor White
        }
        "cto" { 
            Write-Host "🎯 CTO Tips:" -ForegroundColor Yellow  
            Write-Host "   - Access architecture docs in docs/ folder" -ForegroundColor White
            Write-Host "   - CI/CD configs in .github/ folder" -ForegroundColor White
            Write-Host "   - Infrastructure configs in infrastructure/ folder" -ForegroundColor White
        }
        "backend" { 
            Write-Host "🔧 Backend Tips:" -ForegroundColor Yellow
            Write-Host "   - Backend services in backend/ folder" -ForegroundColor White
            Write-Host "   - Press F5 to start backend API" -ForegroundColor White
            Write-Host "   - Run tests with Ctrl+Shift+P → 'Tasks: Test Backend'" -ForegroundColor White
        }
        "frontend" { 
            Write-Host "🎨 Frontend Tips:" -ForegroundColor Yellow
            Write-Host "   - Core components in frontend/ folder" -ForegroundColor White
            Write-Host "   - Press F5 to start dev server" -ForegroundColor White
            Write-Host "   - Design system in frontend/design-system/" -ForegroundColor White
        }
        default {
            Write-Host "💡 General Tips:" -ForegroundColor Yellow
            Write-Host "   - Press F5 to start development server" -ForegroundColor White
            Write-Host "   - Use Ctrl+P to quickly open files" -ForegroundColor White  
            Write-Host "   - Check Extensions panel for recommended tools" -ForegroundColor White
        }
    }
    
    Write-Host ""
    Write-Host "THE TERRAFUSION WAY: Focused development, maximum productivity! 🎯" -ForegroundColor Magenta
    
} catch {
    Write-Host "❌ Error launching workspace: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Manual steps:" -ForegroundColor Yellow
    Write-Host "   1. Open VS Code" -ForegroundColor White
    Write-Host "   2. File → Open Workspace from File" -ForegroundColor White
    Write-Host "   3. Select: $workspacePath" -ForegroundColor White
}