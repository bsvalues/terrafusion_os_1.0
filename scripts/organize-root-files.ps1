#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Organizes root directory files into proper documentation structure
.DESCRIPTION
    Moves misplaced files from root into organized documentation suite.
    Prevents AI agents from leaving files in root.
.NOTES
    Author: TerraFusion OS Team
    Date: October 12, 2025
#>

param(
    [switch]$DryRun,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$rootPath = Split-Path -Parent $PSScriptRoot

Write-Host "🗂️  TerraFusion Root Directory Organizer" -ForegroundColor Cyan
Write-Host "=" * 60

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No files will be moved" -ForegroundColor Yellow
    Write-Host ""
}

# Define target directories
$targetDirs = @{
    "milestones"       = "docs/milestones"
    "phases"           = "docs/phases"
    "reports"          = "docs/reports"
    "operations"       = "docs/operations"
    "guides"           = "docs/guides"
    "architecture"     = "docs/architecture"
    "config_ai"        = "config/ai"
    "config_counties"  = "config/counties"
    "config_docker"    = "config/docker"
    "scripts_admin"    = "scripts/admin"
    "scripts_data"     = "scripts/data"
    "design"           = "design"
    "workflows"        = ".github/workflows"
    "data_temp"        = "data/temp"
    "archive_text"     = "archive/text-files"
}

# Create target directories if they don't exist
foreach ($dir in $targetDirs.Values) {
    $fullPath = Join-Path $rootPath $dir
    if (-not (Test-Path $fullPath)) {
        Write-Host "📁 Creating directory: $dir" -ForegroundColor Green
        if (-not $DryRun) {
            New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        }
    }
}

# Define file move mappings
$fileMappings = @(
    # Milestone/Completion Documents
    @{ Pattern = "╔═══╗_*.txt"; Target = "milestones"; Description = "Milestone completion" }
    @{ Pattern = "✅_*.md"; Target = "milestones"; Description = "Completion markers" }
    @{ Pattern = "🎊_*.md"; Target = "milestones"; Description = "Success markers" }
    @{ Pattern = "🎯_*.md"; Target = "milestones"; Description = "Goal markers" }
    @{ Pattern = "🚀_*.md"; Target = "milestones"; Description = "Launch markers" }
    @{ Pattern = "*_COMPLETE.md"; Target = "milestones"; Description = "Completion docs" }
    @{ Pattern = "DAY_*_COMPLETE.md"; Target = "milestones"; Description = "Daily completions" }
    @{ Pattern = "EXECUTION_COMPLETE_*.md"; Target = "milestones"; Description = "Execution completions" }
    
    # Phase Documents
    @{ Pattern = "PHASE_*.md"; Target = "phases"; Description = "Phase documents" }
    @{ Pattern = "*WORKSPACE_ORGANIZATION*.md"; Target = "phases"; Description = "Organization plans" }
    
    # Reports & Analysis
    @{ Pattern = "*_REPORT.md"; Target = "reports"; Description = "Report documents" }
    @{ Pattern = "*_ANALYSIS.md"; Target = "reports"; Description = "Analysis documents" }
    @{ Pattern = "*_AUDIT*.md"; Target = "reports"; Description = "Audit documents" }
    @{ Pattern = "*_GAP_ANALYSIS.md"; Target = "reports"; Description = "Gap analysis" }
    @{ Pattern = "*_CLEANUP_*.md"; Target = "reports"; Description = "Cleanup reports" }
    @{ Pattern = "*_INVESTIGATION*.md"; Target = "reports"; Description = "Investigations" }
    @{ Pattern = "*_ARCHAEOLOGY*.md"; Target = "reports"; Description = "Archaeological analysis" }
    @{ Pattern = "DATABASE_CLEANUP*.md"; Target = "reports"; Description = "Database cleanup" }
    
    # Dashboards & Status
    @{ Pattern = "*_DASHBOARD*.md"; Target = "operations"; Description = "Dashboard documents" }
    @{ Pattern = "*_DASHBOARD*.txt"; Target = "operations"; Description = "Dashboard text files" }
    @{ Pattern = "*_STATUS*.md"; Target = "operations"; Description = "Status documents" }
    @{ Pattern = "*OPERATIONAL*.md"; Target = "operations"; Description = "Operational docs" }
    @{ Pattern = "*READINESS*.md"; Target = "operations"; Description = "Readiness docs" }
    @{ Pattern = "*CERTIFICATION*.md"; Target = "operations"; Description = "Certification docs" }
    
    # Guides & Documentation
    @{ Pattern = "*_GUIDE.md"; Target = "guides"; Description = "Guide documents" }
    @{ Pattern = "LAUNCH_*.md"; Target = "guides"; Description = "Launch guides" }
    @{ Pattern = "NEXT_STEPS*.md"; Target = "guides"; Description = "Next steps" }
    @{ Pattern = "*WORKFLOW*.md"; Target = "guides"; Description = "Workflow guides" }
    @{ Pattern = "WHAT_TO_DO*.md"; Target = "guides"; Description = "Action guides" }
    @{ Pattern = "*_JOURNEY.md"; Target = "guides"; Description = "Journey docs" }
    @{ Pattern = "*_TRUTH.md"; Target = "guides"; Description = "Truth docs" }
    @{ Pattern = "*_WAY_*.md"; Target = "guides"; Description = "Way docs" }
    @{ Pattern = "REVISED_*.md"; Target = "guides"; Description = "Revised plans" }
    
    # Architecture Documents
    @{ Pattern = "*ARCHITECTURE*.md"; Target = "architecture"; Description = "Architecture docs" }
    @{ Pattern = "*ECOSYSTEM*.md"; Target = "architecture"; Description = "Ecosystem docs" }
    @{ Pattern = "CORRECT_UNDERSTANDING*.md"; Target = "architecture"; Description = "Understanding docs" }
    
    # AI Configuration
    @{ Pattern = "ai-*.json"; Target = "config_ai"; Description = "AI configurations" }
    @{ Pattern = "*-config-v*.json"; Target = "config_ai"; Description = "Versioned configs" }
    @{ Pattern = "claude-*.js"; Target = "config_ai"; Description = "Claude configs" }
    @{ Pattern = "prompt.json"; Target = "config_ai"; Description = "Prompt configs" }
    
    # County Configurations
    @{ Pattern = "*-county-config.json"; Target = "config_counties"; Description = "County configs" }
    @{ Pattern = ".env.benton*"; Target = "config_counties"; Description = "Benton env files" }
    @{ Pattern = ".env.asotin"; Target = "config_counties"; Description = "Asotin env files" }
    @{ Pattern = ".env.cowlitz"; Target = "config_counties"; Description = "Cowlitz env files" }
    @{ Pattern = ".env.franklin"; Target = "config_counties"; Description = "Franklin env files" }
    @{ Pattern = ".env.yakima"; Target = "config_counties"; Description = "Yakima env files" }
    
    # Docker Compose Variants
    @{ Pattern = "docker-compose.*.yml"; Target = "config_docker"; Description = "Docker compose variants" }
    
    # Scripts
    @{ Pattern = "*.ps1"; Target = "scripts_admin"; Description = "PowerShell scripts" }
    @{ Pattern = "*EXTRACTION*.sh"; Target = "scripts_admin"; Description = "Extraction scripts" }
    @{ Pattern = "fix-*.py"; Target = "scripts_data"; Description = "Data fix scripts" }
    @{ Pattern = "validate-*.sh"; Target = "scripts_admin"; Description = "Validation scripts" }
    
    # Design Files
    @{ Pattern = "design-system*.html"; Target = "design"; Description = "Design system demos" }
    @{ Pattern = "design-system*.css"; Target = "design"; Description = "Design system styles" }
    @{ Pattern = "*_SHOWCASE.html"; Target = "design"; Description = "Showcase files" }
    @{ Pattern = "ui-server.js"; Target = "design"; Description = "UI server" }
    
    # Workflow Files
    @{ Pattern = "*workflow*.yml"; Target = "workflows"; Description = "Workflow files" }
    
    # Data/Output Files
    @{ Pattern = "jobs*.json"; Target = "data_temp"; Description = "Job data" }
    @{ Pattern = "jobs*.txt"; Target = "data_temp"; Description = "Job output" }
    @{ Pattern = "*run*.json"; Target = "data_temp"; Description = "Run data" }
    @{ Pattern = "*run*.txt"; Target = "data_temp"; Description = "Run logs" }
    @{ Pattern = "run*.html"; Target = "data_temp"; Description = "Run pages" }
    @{ Pattern = "validation_output.txt"; Target = "data_temp"; Description = "Validation output" }
    @{ Pattern = "revolution-log.txt"; Target = "data_temp"; Description = "Revolution log" }
    @{ Pattern = "msg.txt"; Target = "data_temp"; Description = "Message files" }
    @{ Pattern = "merge_message.txt"; Target = "data_temp"; Description = "Merge messages" }
    
    # Misc Text Files
    @{ Pattern = "*.txt"; Target = "archive_text"; Description = "Text files" }
    
    # Registry/Catalog
    @{ Pattern = "*.csv"; Target = "config_ai"; Description = "Registry files" }
)

# Statistics
$stats = @{
    Moved     = 0
    Skipped   = 0
    Errors    = 0
    Protected = 0
}

# Protected files that should never be moved
$protectedFiles = @(
    "README.md", "LICENSE", "package.json", "package-lock.json",
    "tsconfig.json", "vitest.config.ts", "Makefile", ".gitignore",
    ".editorconfig", ".prettierrc", ".eslintrc.json", "global.json",
    "docker-compose.yml", "Dockerfile.frontend", ".dockerignore",
    "nodemon.json", "playwright.config.ts", "jest.integration.config.ts",
    ".npmrc", ".nvmrc", "START_HERE.md", "TerraFusion_OS_1.0.code-workspace"
)

function Move-FileToTarget {
    param(
        [string]$SourceFile,
        [string]$TargetSubDir,
        [string]$Description
    )
    
    $fileName = Split-Path -Leaf $SourceFile
    
    # Check if file is protected
    if ($protectedFiles -contains $fileName) {
        if ($Verbose) {
            Write-Host "  🛡️  Protected: $fileName" -ForegroundColor DarkGray
        }
        $stats.Protected++
        return
    }
    
    $targetDir = Join-Path $rootPath $targetDirs[$TargetSubDir]
    $targetFile = Join-Path $targetDir $fileName
    
    if (Test-Path $SourceFile) {
        # Check if target already exists
        if (Test-Path $targetFile) {
            Write-Host "  ⚠️  Skipped (exists): $fileName → $TargetSubDir" -ForegroundColor Yellow
            $stats.Skipped++
        }
        else {
            Write-Host "  📦 Moving: $fileName → $TargetSubDir" -ForegroundColor Green
            if ($Verbose) {
                Write-Host "     Description: $Description" -ForegroundColor DarkGray
            }
            
            if (-not $DryRun) {
                try {
                    Move-Item -Path $SourceFile -Destination $targetFile -Force
                    $stats.Moved++
                }
                catch {
                    Write-Host "  ❌ Error moving $fileName : $_" -ForegroundColor Red
                    $stats.Errors++
                }
            }
            else {
                $stats.Moved++
            }
        }
    }
}

Write-Host ""
Write-Host "📋 Processing file mappings..." -ForegroundColor Cyan

foreach ($mapping in $fileMappings) {
    $files = Get-ChildItem -Path $rootPath -Filter $mapping.Pattern -File -ErrorAction SilentlyContinue
    
    foreach ($file in $files) {
        Move-FileToTarget -SourceFile $file.FullName -TargetSubDir $mapping.Target -Description $mapping.Description
    }
}

# Summary
Write-Host ""
Write-Host "=" * 60
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Moved:     $($stats.Moved)" -ForegroundColor Green
Write-Host "  ⚠️  Skipped:   $($stats.Skipped)" -ForegroundColor Yellow
Write-Host "  ❌ Errors:    $($stats.Errors)" -ForegroundColor Red
Write-Host "  🛡️  Protected: $($stats.Protected)" -ForegroundColor Blue
Write-Host ""

if ($DryRun) {
    Write-Host "💡 Run without -DryRun to actually move files" -ForegroundColor Yellow
}
else {
    Write-Host "✅ Root directory organization complete!" -ForegroundColor Green
}

Write-Host ""
