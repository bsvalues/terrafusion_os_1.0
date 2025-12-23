<#
.SYNOPSIS
    VS Code Extension Audit & Reduction Tool for TerraFusion

.DESCRIPTION
    Analyzes installed extensions and generates a reduction plan.
    Categories: DISABLE_NOW, DISABLE_IF_LAG, KEEP_CORE

.EXAMPLE
    .\Audit-Extensions.ps1
    .\Audit-Extensions.ps1 -ApplyDisable
#>

param(
    [switch]$ApplyDisable,
    [switch]$ShowAll
)

# ═══════════════════════════════════════════════════════════════════════════
# Extension Categories
# ═══════════════════════════════════════════════════════════════════════════

# DISABLE NOW - Safe to disable, redundant or deprecated
$DisableNow = @(
    # Deprecated (VS Code has native support)
    "coenraads.bracket-pair-colorizer-2",    # Use native editor.bracketPairColorization
    "2gua.rainbow-brackets",                  # Redundant with native

    # Duplicate functionality (pick ONE)
    "fabiospampinato.vscode-todo-plus",       # Keep todo-tree instead
    "wayou.vscode-todo-highlight",            # Keep todo-tree instead

    # Heavy on monorepos
    "wix.vscode-import-cost",                 # Analyzes every import
    "leodevbro.blockman",                     # Heavy visual processing

    # Rarely used / niche
    "arthulobo.easy-codesnap",                # Screenshot tool
    "hediet.vscode-drawio",                   # Rarely used in dev
    "yzane.markdown-pdf",                     # Export tool
    "jebbs.plantuml",                         # If not using PlantUML

    # Duplicate theme packs
    "gydunhn.vsc-essentials",                 # Meta pack, heavy
    "gydunhn.vsc-essentials-core",
    "gydunhn.vsc-essentials-material-themes",
    "gydunhn.vsc-essentials-themes-core"
)

# DISABLE IF LAG - Monitor and disable if you see slowness
$DisableIfLag = @(
    # Git-related (can be heavy on large repos)
    "donjayamanne.githistory",                # Git Graph is enough
    "mhutchie.git-graph",                     # Consider if GitLens is enough

    # Heavy indexers
    "streetsidesoftware.code-spell-checker",  # Scans all files
    "usernamehw.errorlens",                   # Shows errors inline (can lag)

    # Preview tools
    "kisstkondoros.vscode-gutter-preview",    # Image preview in gutter
    "vitaliymaz.vscode-svg-previewer",

    # Linters running constantly
    "ms-python.flake8",                       # If using Ruff
    "ms-python.pylint",                       # If using Ruff
    "davidanson.vscode-markdownlint",         # If not editing much MD

    # Auto-tools that can conflict
    "formulahendry.auto-close-tag",           # Can conflict with other tools
    "formulahendry.auto-rename-tag",
    "steoates.autoimport"
)

# KEEP CORE - Essential for TerraFusion dev
$KeepCore = @(
    # Remote Development
    "ms-vscode-remote.remote-wsl",
    "ms-vscode-remote.remote-containers",
    "ms-vscode-remote.remote-ssh-edit",

    # Languages
    "ms-dotnettools.csharp",
    "ms-dotnettools.csdevkit",
    "rust-lang.rust-analyzer",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "ms-vscode.vscode-typescript-next",

    # Formatting
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "editorconfig.editorconfig",

    # Docker/K8s
    "ms-azuretools.vscode-docker",
    "ms-kubernetes-tools.vscode-kubernetes-tools",

    # Git
    "eamodio.gitlens",

    # AI (ONE driver)
    "github.copilot",
    "github.copilot-chat",

    # Testing
    "ms-playwright.playwright",
    "orta.vscode-jest",
    "hbenl.vscode-test-explorer",

    # Database
    "cweijan.vscode-postgresql-client2",
    "mongodb.mongodb-vscode",
    "redis.redis-for-vscode",

    # Infrastructure
    "hashicorp.terraform",
    "redhat.vscode-yaml",

    # Productivity
    "gruntfuggly.todo-tree",
    "alefragnani.bookmarks"
)

# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║     🔍 VS Code Extension Audit                            ║" -ForegroundColor Cyan
Write-Host "  ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get installed extensions
$installed = code-insiders --list-extensions 2>$null
if (-not $installed) {
    $installed = code --list-extensions 2>$null
}

$installedList = @($installed)
$total = $installedList.Count

Write-Host "  Total installed: $total extensions" -ForegroundColor Yellow
Write-Host ""

# Categorize
$toDisableNow = @()
$toDisableIfLag = @()
$coreKeep = @()
$uncategorized = @()

foreach ($ext in $installedList) {
    $extLower = $ext.ToLower()
    if ($DisableNow -contains $extLower) {
        $toDisableNow += $ext
    }
    elseif ($DisableIfLag -contains $extLower) {
        $toDisableIfLag += $ext
    }
    elseif ($KeepCore -contains $extLower) {
        $coreKeep += $ext
    }
    else {
        $uncategorized += $ext
    }
}

# Report
Write-Host "  ═══ DISABLE NOW (Safe, redundant/deprecated) ═══" -ForegroundColor Red
Write-Host "  Count: $($toDisableNow.Count)" -ForegroundColor Red
foreach ($ext in $toDisableNow) {
    Write-Host "    ❌ $ext" -ForegroundColor DarkRed
}
Write-Host ""

Write-Host "  ═══ DISABLE IF LAG (Monitor, disable if slow) ═══" -ForegroundColor Yellow
Write-Host "  Count: $($toDisableIfLag.Count)" -ForegroundColor Yellow
foreach ($ext in $toDisableIfLag) {
    Write-Host "    ⚠️  $ext" -ForegroundColor DarkYellow
}
Write-Host ""

Write-Host "  ═══ KEEP CORE (Essential for TerraFusion) ═══" -ForegroundColor Green
Write-Host "  Count: $($coreKeep.Count)" -ForegroundColor Green
if ($ShowAll) {
    foreach ($ext in $coreKeep) {
        Write-Host "    ✅ $ext" -ForegroundColor DarkGreen
    }
}
Write-Host ""

Write-Host "  ═══ UNCATEGORIZED (Review manually) ═══" -ForegroundColor Gray
Write-Host "  Count: $($uncategorized.Count)" -ForegroundColor Gray
if ($ShowAll) {
    foreach ($ext in $uncategorized) {
        Write-Host "    ❓ $ext" -ForegroundColor DarkGray
    }
}
Write-Host ""

# Summary
$targetEnabled = $coreKeep.Count + $uncategorized.Count - 20  # Assume 20 uncategorized can be disabled
Write-Host "  ═══ SUMMARY ═══" -ForegroundColor Cyan
Write-Host "  Current enabled:    $total" -ForegroundColor White
Write-Host "  Recommended core:   $($coreKeep.Count)" -ForegroundColor Green
Write-Host "  To disable (safe):  $($toDisableNow.Count)" -ForegroundColor Red
Write-Host "  To monitor:         $($toDisableIfLag.Count)" -ForegroundColor Yellow
Write-Host "  Target:             ≤ 80 enabled" -ForegroundColor Cyan
Write-Host ""

# Apply disable
if ($ApplyDisable -and $toDisableNow.Count -gt 0) {
    Write-Host "  Disabling extensions..." -ForegroundColor Yellow
    foreach ($ext in $toDisableNow) {
        Write-Host "    Disabling $ext..." -ForegroundColor Gray
        code-insiders --disable-extension $ext 2>$null
        if ($LASTEXITCODE -ne 0) {
            code --disable-extension $ext 2>$null
        }
    }
    Write-Host ""
    Write-Host "  ✅ Disabled $($toDisableNow.Count) extensions" -ForegroundColor Green
    Write-Host "  Restart VS Code to apply changes" -ForegroundColor Yellow
}

if (-not $ApplyDisable -and $toDisableNow.Count -gt 0) {
    Write-Host "  To apply, run:" -ForegroundColor Cyan
    Write-Host "    .\Audit-Extensions.ps1 -ApplyDisable" -ForegroundColor White
    Write-Host ""
}

# Generate disable commands
Write-Host "  ═══ MANUAL DISABLE COMMANDS ═══" -ForegroundColor Cyan
Write-Host "  # Safe to disable now:" -ForegroundColor Gray
foreach ($ext in $toDisableNow) {
    Write-Host "  code-insiders --disable-extension $ext" -ForegroundColor DarkGray
}
Write-Host ""
