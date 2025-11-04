<#
.SYNOPSIS
    Fix embedded git repositories by removing their .git directories

.DESCRIPTION
    The migrated systems contain .git directories, making them embedded repositories.
    This script removes those .git directories to convert them to regular directories.

.NOTES
    TerraFusion Elite Government OS Engineering Agent
    Evidence-Based | Data-Driven | Machine Precision
#>

$ErrorActionPreference = "Stop"

Write-Host "🔧 Fixing Embedded Git Repositories..." -ForegroundColor Cyan
Write-Host ""

# List of embedded repos detected by git add
$embeddedRepos = @(
    "applications/bcbs-gis-pro-production",
    "applications/bcbs-webhub-production",
    "applications/bs-income-valuation-production",
    "applications/mcp-servers-production",
    "applications/system-prompts-ai-tools",
    "applications/terra-agent-production",
    "applications/terra-assistant-production/TerraFusionAssistant",
    "applications/terra-build-actual",
    "applications/terra-dashboard-production/TerraFusionDashboard",
    "applications/terra-enterprise",
    "applications/terra-miner-production/TerraMiner",
    "applications/terra-permit-production",
    "applications/terra-pilt-production",
    "applications/terra-playground-production",
    "applications/terra-primeview-production",
    "applications/terra-pro-production",
    "applications/terra-prof-production",
    "applications/terra-proplus-production",
    "applications/terra-sync-production",
    "applications/terra-v0demo-production",
    "costforge-ai-workspace",
    "terrabuild-modernization",
    "workspaces/AIDATACONNECT/AIDataConnect"
)

$fixed = 0
$skipped = 0

foreach ($repo in $embeddedRepos) {
    $gitDir = Join-Path $PSScriptRoot "..\$repo\.git"

    if (Test-Path $gitDir) {
        Write-Host "  Removing .git from: $repo" -ForegroundColor Yellow
        Remove-Item -Path $gitDir -Recurse -Force -ErrorAction SilentlyContinue
        $fixed++
    } else {
        Write-Host "  Already fixed: $repo" -ForegroundColor Gray
        $skipped++
    }
}

Write-Host ""
Write-Host "✅ Embedded repository fix complete!" -ForegroundColor Green
Write-Host "  Fixed: $fixed repositories" -ForegroundColor Cyan
Write-Host "  Already clean: $skipped repositories" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 Ready for git add -A" -ForegroundColor Green
