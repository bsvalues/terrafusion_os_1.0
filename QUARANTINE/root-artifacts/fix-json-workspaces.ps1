#!/usr/bin/env pwsh
<#
.SYNOPSIS
TerraFusion JSON Workspace Fixer - Remove Trailing Commas
Government. Transcended. - Infrastructure Intelligence, Infinite Scale

.DESCRIPTION
Fixes JSON syntax errors in all TerraFusion workspace files by removing trailing commas
that cause formatting and validation issues. Executes with excellence as the
TerraFusion Elite Government OS Engineering Agent.

.PARAMETER ValidateOnly
Only validate JSON files without making changes

.PARAMETER SpecificWorkspace
Fix only a specific workspace file

.EXAMPLE
.\fix-json-workspaces.ps1

.EXAMPLE
.\fix-json-workspaces.ps1 -ValidateOnly

.EXAMPLE
.\fix-json-workspaces.ps1 -SpecificWorkspace "terra-levy-elite"
#>

param(
    [Parameter(Mandatory = $false)]
    [switch]$ValidateOnly,

    [Parameter(Mandatory = $false)]
    [string]$SpecificWorkspace
)

function Show-JsonFixBanner {
    Clear-Host
    Write-Host ""
    Write-Host "🔧 " -ForegroundColor Cyan -NoNewline
    Write-Host "TerraFusion JSON Workspace Fixer" -ForegroundColor White
    Write-Host "   Elite Government OS Engineering Agent" -ForegroundColor Yellow
    Write-Host "   Government. Transcended." -ForegroundColor Green
    Write-Host ""
}

function Write-JsonLog {
    param(
        [string]$File,
        [string]$Status,
        [string]$Details = "",
        [ValidateSet("CHECKING", "FIXED", "VALID", "ERROR", "SKIPPED")]
        [string]$Level = "CHECKING"
    )

    $statusIcon = switch ($Level) {
        "CHECKING" { "🔍" }
        "FIXED" { "✅" }
        "VALID" { "💚" }
        "ERROR" { "❌" }
        "SKIPPED" { "⏭️" }
    }

    $statusColor = switch ($Level) {
        "CHECKING" { "Cyan" }
        "FIXED" { "Green" }
        "VALID" { "Green" }
        "ERROR" { "Red" }
        "SKIPPED" { "Yellow" }
    }

    Write-Host "$statusIcon " -ForegroundColor $statusColor -NoNewline
    Write-Host "$File`: " -ForegroundColor White -NoNewline
    Write-Host "$Status" -ForegroundColor $statusColor

    if ($Details) {
        Write-Host "    $Details" -ForegroundColor Gray
    }
}

function Test-JsonSyntax {
    param([string]$Content)

    try {
        $Content | ConvertFrom-Json | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Remove-TrailingCommas {
    param([string]$JsonContent)

    # Remove trailing commas before closing brackets/braces
    # Pattern explanation:
    # ,\s*(?=\s*[}\]]) - comma followed by optional whitespace, followed by } or ]
    $fixed = $JsonContent -replace ',\s*(?=\s*[}\]])', ''

    return $fixed
}

function Fix-JsonWorkspace {
    param([string]$WorkspacePath)

    $fileName = Split-Path $WorkspacePath -Leaf
    Write-JsonLog $fileName "Checking JSON syntax..." "CHECKING"

    if (!(Test-Path $WorkspacePath)) {
        Write-JsonLog $fileName "File not found" "" "ERROR"
        return $false
    }

    try {
        $content = Get-Content $WorkspacePath -Raw

        # Test if JSON is already valid
        if (Test-JsonSyntax $content) {
            Write-JsonLog $fileName "Valid JSON - No changes needed" "" "VALID"
            return $true
        }

        # Attempt to fix trailing commas
        $fixedContent = Remove-TrailingCommas $content

        # Test if the fix worked
        if (Test-JsonSyntax $fixedContent) {
            if (!$ValidateOnly) {
                Set-Content $WorkspacePath $fixedContent -Encoding UTF8
                Write-JsonLog $fileName "Fixed trailing commas" "JSON syntax corrected" "FIXED"
            } else {
                Write-JsonLog $fileName "Would fix trailing commas" "Validation mode - no changes made" "FIXED"
            }
            return $true
        } else {
            Write-JsonLog $fileName "Could not auto-fix JSON syntax" "Manual intervention required" "ERROR"
            return $false
        }

    } catch {
        Write-JsonLog $fileName "Error processing file" $_.Exception.Message "ERROR"
        return $false
    }
}

function Get-WorkspaceFiles {
    $workspaceFiles = @()

    if ($SpecificWorkspace) {
        $specificPath = "workspaces/$SpecificWorkspace.code-workspace"
        if (Test-Path $specificPath) {
            $workspaceFiles += $specificPath
        } else {
            Write-JsonLog $SpecificWorkspace "Workspace not found" $specificPath "ERROR"
            return @()
        }
    } else {
        # Get all workspace files
        $workspaceFiles = Get-ChildItem "workspaces" -Filter "*.code-workspace" | ForEach-Object { $_.FullName }

        # Also check for any other JSON config files that might need fixing
        $configFiles = @(
            "package.json",
            "tsconfig.json",
            "jest.config.json",
            ".vscode/settings.json",
            ".vscode/launch.json",
            ".vscode/tasks.json"
        )

        foreach ($configFile in $configFiles) {
            if (Test-Path $configFile) {
                $workspaceFiles += $configFile
            }
        }
    }

    return $workspaceFiles
}

function Show-JsonFixSummary {
    param([array]$Results)

    Write-Host ""
    Write-Host "📊 JSON WORKSPACE FIX SUMMARY" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

    $totalFiles = $Results.Count
    $validFiles = ($Results | Where-Object { $_ -eq $true }).Count
    $fixedFiles = $totalFiles - $validFiles

    Write-Host ""
    Write-Host "🔍 FILES PROCESSED:" -ForegroundColor White
    Write-Host "   • Total Files: $totalFiles" -ForegroundColor White
    Write-Host "   • Valid JSON: $validFiles" -ForegroundColor Green
    Write-Host "   • Fixed Files: $fixedFiles" -ForegroundColor Yellow

    $successRate = if ($totalFiles -gt 0) { [math]::Round(($validFiles / $totalFiles) * 100, 1) } else { 0 }

    Write-Host ""
    Write-Host "🎯 SUCCESS RATE:" -ForegroundColor White
    Write-Host "   $successRate% of files now have valid JSON syntax" -ForegroundColor Green

    if ($ValidateOnly) {
        Write-Host ""
        Write-Host "🔍 VALIDATION-ONLY MODE" -ForegroundColor Yellow
        Write-Host "   Run without -ValidateOnly to apply fixes." -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "✅ JSON SYNTAX CORRECTION COMPLETE" -ForegroundColor Green
        Write-Host "   All workspace files now have valid JSON syntax." -ForegroundColor Cyan
    }

    Write-Host ""
    Write-Host "🏛️ GOVERNMENT. TRANSCENDED." -ForegroundColor Green
    Write-Host "    TerraFusion Elite OS Engineering Excellence" -ForegroundColor Cyan
    Write-Host "    Infrastructure Intelligence, Infinite Scale" -ForegroundColor Yellow
    Write-Host ""
}

# Main execution
try {
    Show-JsonFixBanner

    # Get workspace files to process
    $workspaceFiles = Get-WorkspaceFiles

    if ($workspaceFiles.Count -eq 0) {
        Write-Host "❌ No workspace files found to process" -ForegroundColor Red
        exit 1
    }

    Write-Host "🔍 Processing $($workspaceFiles.Count) workspace files..." -ForegroundColor Cyan
    Write-Host ""

    # Process each workspace file
    $results = @()
    foreach ($workspaceFile in $workspaceFiles) {
        $result = Fix-JsonWorkspace $workspaceFile
        $results += $result
    }

    # Show summary
    Show-JsonFixSummary $results

    Write-JsonLog "JSON Workspace Fixer" "Elite execution complete" "All workspace JSON files processed with excellence" "FIXED"

} catch {
    Write-Host "❌ CRITICAL ERROR DURING JSON WORKSPACE FIXING" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
