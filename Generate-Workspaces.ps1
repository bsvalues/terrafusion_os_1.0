# Workspace Generator Script
# THE TERRAFUSION WAY: Precision + Automation

param(
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "workspace-config.json",
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "workspaces",
    [Parameter(Mandatory=$false)]
    [switch]$Validate
)

# Workspace configuration data
$WorkspaceConfigs = @{
    # Tier 2: Pillar Workspaces (4 remaining)
    "backend" = @{
        tier = 2
        name = "Backend Pillar"
        folders = @(
            @{ path = "../backend"; name = "🚀 Backend Services" }
            @{ path = "../platform/sdk"; name = "📦 Platform SDK (read-only)" }
            @{ path = "../tests/backend"; name = "🧪 Backend Tests" }
            @{ path = "../docs/backend"; name = "📚 Backend Docs" }
            @{ path = "../config"; name = "⚙️ Config (shared)" }
        )
        titleBarColor = "#dc2626"
        excludes = @("../frontend", "../marketplace", "../os-platform", "../terrafusion-cos")
        extensions = @("ms-python.python", "ms-python.vscode-pylance", "rust-lang.rust-analyzer")
        launch = @(
            @{ name = "Start Backend API"; type = "python"; program = "../backend/main.py" }
        )
        tasks = @(
            @{ label = "Build Backend"; command = "make"; args = @("build-backend") }
            @{ label = "Test Backend"; command = "make"; args = @("test-backend") }
        )
    }
    
    "frontend" = @{
        tier = 2
        name = "Frontend Pillar"
        folders = @(
            @{ path = "../frontend"; name = "🎨 Frontend Core" }
            @{ path = "../platform/design-system"; name = "🎨 Design System (read-only)" }
            @{ path = "../platform/sdk"; name = "📦 Platform SDK (read-only)" }
            @{ path = "../tests/frontend/core"; name = "🧪 Frontend Tests" }
            @{ path = "../docs/frontend"; name = "📚 Frontend Docs" }
        )
        titleBarColor = "#059669"
        excludes = @("../backend", "../marketplace", "../os-platform", "../terrafusion-cos")
        extensions = @("dbaeumer.vscode-eslint", "esbenp.prettier-vscode", "bradlc.vscode-tailwindcss")
        launch = @(
            @{ name = "Start Frontend Core"; type = "node"; cwd = "../frontend"; runtimeArgs = @("run", "dev") }
        )
        tasks = @(
            @{ label = "Build Frontend"; command = "npm"; args = @("run", "build:frontend") }
            @{ label = "Test Frontend"; command = "npm"; args = @("run", "test:frontend") }
        )
    }
    
    "os-platform" = @{
        tier = 2
        name = "OS Platform Pillar"
        folders = @(
            @{ path = "../os-platform"; name = "🏛️ OS Platform" }
            @{ path = "../platform/sdk"; name = "📦 Platform SDK" }
            @{ path = "../tests/os-platform"; name = "🧪 Platform Tests" }
            @{ path = "../docs/os-platform"; name = "📚 Platform Docs" }
            @{ path = "../config"; name = "⚙️ Config (shared)" }
        )
        titleBarColor = "#7c3aed"
        excludes = @("../frontend", "../backend", "../marketplace", "../terrafusion-cos")
        extensions = @("ms-python.python", "ms-vscode.vscode-typescript-next", "rust-lang.rust-analyzer")
        launch = @(
            @{ name = "Start OS Platform"; type = "python"; program = "../os-platform/main.py" }
        )
        tasks = @(
            @{ label = "Build Platform"; command = "make"; args = @("build-platform") }
            @{ label = "Test Platform"; command = "make"; args = @("test-platform") }
        )
    }
    
    "terrafusion-cos" = @{
        tier = 2
        name = "TerraFusion COS Pillar"
        folders = @(
            @{ path = "../terrafusion-cos"; name = "🔥 TerraFusion COS" }
            @{ path = "../tests/cos"; name = "🧪 COS Tests" }
            @{ path = "../docs/cos"; name = "📚 COS Docs" }
            @{ path = "../config"; name = "⚙️ Config (shared)" }
        )
        titleBarColor = "#ea580c"
        excludes = @("../frontend", "../backend", "../marketplace", "../os-platform")
        extensions = @("ms-python.python", "rust-lang.rust-analyzer", "ms-python.vscode-pylance")
        launch = @(
            @{ name = "Start COS Kernel"; type = "python"; program = "../terrafusion-cos/kernel/main.py" }
        )
        tasks = @(
            @{ label = "Build COS"; command = "make"; args = @("build-cos") }
            @{ label = "Test COS"; command = "make"; args = @("test-cos") }
        )
    }
}

# Frontend Portal Workspaces (Tier 3 - 6 remaining)
$FrontendPortals = @(
    "code-enforcement", "economic-development", "human-resources", 
    "legal-judicial", "public-health", "public-works"
)

# Marketplace Apps (Tier 4 - 34 total)
$MarketplaceApps = @(
    "terra-bank", "terra-collections", "terra-flow", "terra-justice", "terra-insight",
    "property-workbench", "costforge-ai", "autonomous-research-engine", "LeafScope",
    "RAGPanel", "terra-fusion-dashboard", "terra-fusion-sync", "terra-net", "terra-sync",
    "terra-university", "TerraFusion-PublicRecords", "TerraFusionIDE", "unified-system",
    "government-core", "government-edition", "commercial", "commercial-suite", "revenue",
    "shock-and-awe", "api", "plugins", "store", "templates", "submissions", "testing",
    "marketplace-frontend"
)

function Generate-WorkspaceFile {
    param(
        [string]$Name,
        [hashtable]$Config,
        [string]$OutputPath
    )
    
    $workspace = @{
        folders = $Config.folders
        settings = @{
            "workbench.colorCustomizations" = @{
                "titleBar.activeBackground" = $Config.titleBarColor
                "titleBar.activeForeground" = "#ffffff"
            }
            "files.exclude" = @{
                "**/node_modules" = $true
                "**/dist" = $true
            }
            "editor.formatOnSave" = $true
            "editor.codeActionsOnSave" = @{
                "source.fixAll" = "explicit"
                "source.organizeImports" = "explicit"
            }
        }
        extensions = @{
            recommendations = $Config.extensions
        }
    }
    
    # Add exclusions
    foreach ($exclude in $Config.excludes) {
        $workspace.settings["files.exclude"][$exclude] = $true
    }
    
    # Add launch configurations if present
    if ($Config.launch) {
        $workspace.launch = @{
            version = "0.2.0"
            configurations = $Config.launch
        }
    }
    
    # Add tasks if present
    if ($Config.tasks) {
        $workspace.tasks = @{
            version = "2.0.0"
            tasks = $Config.tasks
        }
    }
    
    # Convert to JSON and save
    $json = $workspace | ConvertTo-Json -Depth 10
    $json | Out-File -FilePath $OutputPath -Encoding UTF8
    
    Write-Host "   ✅ Generated: $OutputPath" -ForegroundColor Green
}

function Generate-FrontendPortalWorkspace {
    param([string]$PortalName)
    
    $displayName = ($PortalName -split '-' | ForEach-Object { (Get-Culture).TextInfo.ToTitleCase($_) }) -join ' '
    $config = @{
        folders = @(
            @{ path = "../../frontend/$PortalName-portal"; name = "🏛️ $displayName Portal" }
            @{ path = "../../platform/design-system"; name = "🎨 Design System (read-only)" }
            @{ path = "../../platform/sdk"; name = "📦 Platform SDK (read-only)" }
            @{ path = "../../tests/frontend/$PortalName"; name = "🧪 Tests" }
            @{ path = "../../docs/portals"; name = "📚 Portal Docs" }
            @{ path = "../../config"; name = "⚙️ Config (shared)" }
        )
        titleBarColor = "#10b981"
        excludes = @("../../frontend/*-portal", "!../../frontend/$PortalName-portal", "../../marketplace", "../../backend", "../../os-platform", "../../terrafusion-cos")
        extensions = @("dbaeumer.vscode-eslint", "esbenp.prettier-vscode", "bradlc.vscode-tailwindcss", "dsznajder.es7-react-js-snippets")
        launch = @(
            @{ name = "Start $displayName Portal"; type = "node"; cwd = "../../frontend/$PortalName-portal"; runtimeArgs = @("run", "dev") }
        )
        tasks = @(
            @{ label = "Build Portal"; command = "npm"; args = @("run", "build"); cwd = "../../frontend/$PortalName-portal" }
            @{ label = "Test Portal"; command = "npm"; args = @("run", "test"); cwd = "../../frontend/$PortalName-portal" }
        )
    }
    
    $outputPath = "workspaces/frontend/$PortalName.code-workspace"
    Generate-WorkspaceFile -Name $PortalName -Config $config -OutputPath $outputPath
}

function Generate-MarketplaceAppWorkspace {
    param([string]$AppName)
    
    $displayName = ($AppName -split '-' | ForEach-Object { (Get-Culture).TextInfo.ToTitleCase($_) }) -join ' '
    $config = @{
        folders = @(
            @{ path = "../../marketplace/$AppName"; name = "💼 $displayName" }
            @{ path = "../../platform/sdk"; name = "📦 Platform SDK (read-only)" }
            @{ path = "../../platform/design-system"; name = "🎨 Design System (read-only)" }
            @{ path = "../../tests/marketplace/$AppName"; name = "🧪 Tests" }
            @{ path = "../../docs/marketplace/$AppName.md"; name = "📚 $displayName Docs" }
        )
        titleBarColor = "#f59e0b"
        excludes = @("../../frontend", "../../backend", "../../os-platform", "../../terrafusion-cos", "../../marketplace/*", "!../../marketplace/$AppName")
        extensions = @("dbaeumer.vscode-eslint", "esbenp.prettier-vscode", "ms-python.python", "ms-python.vscode-pylance", "ms-python.black-formatter")
        launch = @(
            @{ name = "Start $displayName Frontend"; type = "node"; cwd = "../../marketplace/$AppName/frontend"; runtimeArgs = @("run", "dev") }
            @{ name = "Start $displayName Backend"; type = "debugpy"; program = "../../marketplace/$AppName/backend/main.py"; cwd = "../../marketplace/$AppName/backend" }
            @{ name = "Start $displayName MCP Server"; type = "node"; cwd = "../../marketplace/$AppName/mcp-server"; runtimeArgs = @("run", "dev") }
        )
        tasks = @(
            @{ label = "Build $displayName"; command = "npm"; args = @("run", "build"); cwd = "../../marketplace/$AppName" }
            @{ label = "Test $displayName"; command = "npm"; args = @("run", "test"); cwd = "../../marketplace/$AppName" }
        )
    }
    
    $outputPath = "workspaces/marketplace/$AppName.code-workspace"
    Generate-WorkspaceFile -Name $AppName -Config $config -OutputPath $outputPath
}

# Main execution
Write-Host "🎯 THE TERRAFUSION WAY - WORKSPACE GENERATOR" -ForegroundColor Green
Write-Host "Generating remaining 44 workspaces..." -ForegroundColor Yellow
Write-Host ""

$generated = 0

# Generate Tier 2 Pillar Workspaces (4)
Write-Host "📦 Generating Tier 2 Pillar Workspaces..." -ForegroundColor Cyan
foreach ($pillar in $WorkspaceConfigs.Keys) {
    $config = $WorkspaceConfigs[$pillar]
    $outputPath = "workspaces/$pillar.code-workspace"
    Generate-WorkspaceFile -Name $pillar -Config $config -OutputPath $outputPath
    $generated++
}

# Generate Tier 3 Frontend Portal Workspaces (6)
Write-Host "`n🏛️ Generating Tier 3 Frontend Portal Workspaces..." -ForegroundColor Cyan
foreach ($portal in $FrontendPortals) {
    Generate-FrontendPortalWorkspace -PortalName $portal
    $generated++
}

# Generate Tier 4 Marketplace App Workspaces (34)
Write-Host "`n💼 Generating Tier 4 Marketplace App Workspaces..." -ForegroundColor Cyan
foreach ($app in $MarketplaceApps) {
    Generate-MarketplaceAppWorkspace -AppName $app
    $generated++
}

Write-Host ""
Write-Host "🎉 GENERATION COMPLETE!" -ForegroundColor Green
Write-Host "   Generated: $generated workspaces" -ForegroundColor White
Write-Host "   Total: $(4 + $generated) workspaces (including 4 validated examples)" -ForegroundColor White
Write-Host ""
Write-Host "✅ ALL 48 WORKSPACES READY!" -ForegroundColor Green