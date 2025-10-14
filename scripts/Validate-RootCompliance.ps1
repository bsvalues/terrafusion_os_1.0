#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Root Directory Compliance Validator
    
.DESCRIPTION
    Enterprise-grade validation system that checks root directory compliance
    against TerraFusion standards. Can be run manually, via CI/CD, or as a 
    pre-commit hook.
    
.PARAMETER Action
    The validation action: Check, Report, or Enforce
    
.PARAMETER ExitOnFail
    Exit with non-zero code if violations found (for CI/CD)
    
.PARAMETER AutoFix
    Automatically move violating files (uses Organize-RootDirectory.ps1)
    
.PARAMETER Webhook
    Optional webhook URL to send violation reports
    
.EXAMPLE
    .\Validate-RootCompliance.ps1 -Action Check
    Check compliance and report violations
    
.EXAMPLE
    .\Validate-RootCompliance.ps1 -Action Enforce -AutoFix
    Check and automatically fix violations
    
.EXAMPLE
    .\Validate-RootCompliance.ps1 -Action Check -ExitOnFail
    Check compliance, exit with error code if violations found (CI/CD mode)
    
.NOTES
    Author: TerraFusion OS - MIT/PhD Systems Engineering Team
    Version: 1.0.0
    Date: October 12, 2025
#>

[CmdletBinding()]
param(
    [ValidateSet('Check', 'Report', 'Enforce')]
    [string]$Action = 'Check',
    [switch]$ExitOnFail,
    [switch]$AutoFix,
    [string]$Webhook
)

$ErrorActionPreference = "Stop"
$script:RootPath = Split-Path -Parent $PSScriptRoot
$script:ViolationCount = 0
$script:Violations = @()

# ============================================================================
# COMPLIANCE RULES
# ============================================================================

$script:AllowedPatterns = @(
    # Core build configuration
    '^package\.json$',
    '^package-lock\.json$',
    '^tsconfig.*\.json$',
    '^vitest\.config\.ts$',
    '^playwright\.config\.ts$',
    '^playwright\.mcp\.config\.ts$',
    '^jest\.integration\.config\.ts$',
    '^stryker\.conf\.json$',
    '^nodemon\.json$',
    
    # Linting and formatting
    '^\.eslintrc\.json$',
    '^\.eslintignore$',
    '^\.prettierrc$',
    '^\.lintstagedrc\.json$',
    '^\.editorconfig$',
    
    # Git configuration
    '^\.gitignore$',
    '^\.gitattributes$',
    '^\.gitmodules$',
    
    # Environment management
    '^\.npmrc$',
    '^\.nvmrc$',
    '^\.yamllint\.yml$',
    '^\.env$',
    '^\.env\.example$',
    '^\.env\.template$',
    '^\.env\.(development|production)$',
    
    # Docker (main only)
    '^docker-compose\.yml$',
    '^Dockerfile\.frontend$',
    '^\.dockerignore$',
    
    # .NET configuration
    '^global\.json$',
    
    # Build tools
    '^Makefile$',
    '^webpack\.production\.config\.js$',
    
    # Documentation (core only)
    '^README\.md$',
    '^LICENSE$',
    '^START_HERE\.md$',
    
    # Workspace
    '^TerraFusion_OS_1\.0\.code-workspace$',
    '^\.workspace\.env$',
    '^\.workspace-map\.json$',
    
    # Temporary files (should be in .gitignore but allowed)
    '^\.session_history$',
    '^terrafusion-os\.pid$',
    
    # Example files (should move eventually)
    '\.EXAMPLE$',
    
    # Old backups (should archive)
    '^README_OLD_BACKUP\.md$',
    
    # Legacy .env files (should move to config/counties)
    '^\.env\.vim$',
    
    # Binary signatures (unclear purpose - investigate)
    '^sig\.bin$'
)

$script:ViolationPatterns = @(
    @{
        Pattern     = '^[╔✅🎊🎯🚀].*\.(md|txt)$'
        Reason      = 'Emoji-marked completion documents belong in docs/milestones/'
        Destination = 'docs/milestones/'
    }
    @{
        Pattern     = '.*_(COMPLETE|SUCCESS|READY)\.(md|txt)$'
        Reason      = 'Completion markers belong in docs/milestones/'
        Destination = 'docs/milestones/'
    }
    @{
        Pattern     = '.*_(DASHBOARD|STATUS)\.(md|txt)$'
        Reason      = 'Dashboard and status files belong in docs/operations/'
        Destination = 'docs/operations/'
    }
    @{
        Pattern     = '.*_(REPORT|AUDIT|ANALYSIS).*\.md$'
        Reason      = 'Reports and analysis belong in docs/reports/'
        Destination = 'docs/reports/'
    }
    @{
        Pattern     = '^PHASE_.*\.md$'
        Reason      = 'Phase documents belong in docs/phases/'
        Destination = 'docs/phases/'
    }
    @{
        Pattern     = '.*_(GUIDE|WORKFLOW).*\.md$'
        Reason      = 'Guides and workflows belong in docs/guides/'
        Destination = 'docs/guides/'
    }
    @{
        Pattern     = '.*ARCHITECTURE.*\.md$'
        Reason      = 'Architecture documents belong in docs/architecture/'
        Destination = 'docs/architecture/'
    }
    @{
        Pattern     = '^(ai-|claude-).*\.(json|js)$'
        Reason      = 'AI configuration files belong in config/ai/'
        Destination = 'config/ai/'
    }
    @{
        Pattern     = '.*-county-config\.json$'
        Reason      = 'County configuration files belong in config/counties/'
        Destination = 'config/counties/'
    }
    @{
        Pattern     = '^docker-compose\..*\.yml$'
        Reason      = 'Docker Compose variants belong in config/docker/'
        Destination = 'config/docker/'
    }
    @{
        Pattern     = '\.(ps1|sh)$'
        Reason      = 'Scripts belong in scripts/'
        Destination = 'scripts/'
    }
    @{
        Pattern     = '^design-.*\.(html|css)$'
        Reason      = 'Design files belong in design/'
        Destination = 'design/'
    }
    @{
        Pattern     = '.*workflow.*\.yml$'
        Reason      = 'Workflow files belong in .github/workflows/'
        Destination = '.github/workflows/'
    }
    @{
        Pattern     = '^(jobs|runs?|last_run|latest_run).*\.(json|txt)$'
        Reason      = 'Run data files belong in data/temp/'
        Destination = 'data/temp/'
    }
    @{
        Pattern     = '^(test-|.*-test)\.(ts|js|cjs)$'
        Reason      = 'Test files belong in tests/ or should be removed'
        Destination = 'tests/'
    }
    @{
        Pattern     = '\.html$'
        Reason      = 'HTML files (except index.html) belong in appropriate subdirectories'
        Destination = 'frontend/public/ or design/'
    }
)

# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

function Test-FileCompliance {
    param([string]$FileName)
    
    # Check if file matches allowed patterns
    foreach ($pattern in $script:AllowedPatterns) {
        if ($FileName -match $pattern) {
            return @{ Compliant = $true }
        }
    }
    
    # Check if file matches violation patterns
    foreach ($rule in $script:ViolationPatterns) {
        if ($FileName -match $rule.Pattern) {
            return @{
                Compliant   = $false
                Reason      = $rule.Reason
                Destination = $rule.Destination
                Pattern     = $rule.Pattern
            }
        }
    }
    
    # Unknown file type - flag for review
    return @{
        Compliant   = $false
        Reason      = 'File type not recognized in TerraFusion standards'
        Destination = 'Unknown - requires manual review'
        Pattern     = 'Unknown'
    }
}

function Get-ComplianceReport {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                            ║" -ForegroundColor Cyan
    Write-Host "║         🏛️  Root Directory Compliance Validator            ║" -ForegroundColor Cyan
    Write-Host "║                                                            ║" -ForegroundColor Cyan
    Write-Host "║              TerraFusion OS Standards v1.0                 ║" -ForegroundColor Cyan
    Write-Host "║                                                            ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
    
    # Get all files in root
    $rootFiles = Get-ChildItem -Path $script:RootPath -File | 
        Where-Object { $_.Name -notmatch '\.pid$' }
    
    $compliant = @()
    $violations = @()
    
    foreach ($file in $rootFiles) {
        $check = Test-FileCompliance -FileName $file.Name
        
        if ($check.Compliant) {
            $compliant += $file
        }
        else {
            $violations += @{
                File        = $file
                Reason      = $check.Reason
                Destination = $check.Destination
                Pattern     = $check.Pattern
            }
            $script:ViolationCount++
        }
    }
    
    $script:Violations = $violations
    
    # Report
    Write-Host "📊 Compliance Summary:" -ForegroundColor Cyan
    Write-Host "═" * 70 -ForegroundColor Cyan
    Write-Host "  Total Files:      $($rootFiles.Count)" -ForegroundColor White
    Write-Host "  Compliant:        $($compliant.Count)" -ForegroundColor Green
    Write-Host "  Violations:       $($violations.Count)" -ForegroundColor $(if ($violations.Count -gt 0) { 'Red' } else { 'Green' })
    Write-Host "═" * 70 -ForegroundColor Cyan
    
    if ($violations.Count -gt 0) {
        Write-Host "`n⚠️  Violations Found:`n" -ForegroundColor Yellow
        
        # Group by destination
        $grouped = $violations | Group-Object -Property { $_.Destination }
        
        foreach ($group in $grouped) {
            Write-Host "  📁 Should move to: $($group.Name)" -ForegroundColor Yellow
            foreach ($item in $group.Group) {
                Write-Host "     ❌ $($item.File.Name)" -ForegroundColor Red
                if ($VerbosePreference -eq 'Continue') {
                    Write-Host "        Reason: $($item.Reason)" -ForegroundColor DarkGray
                }
            }
            Write-Host ""
        }
        
        Write-Host "💡 Recommendations:" -ForegroundColor Cyan
        Write-Host "   1. Run: .\scripts\Organize-RootDirectory.ps1 -DryRun" -ForegroundColor White
        Write-Host "   2. Review the proposed changes" -ForegroundColor White
        Write-Host "   3. Run: .\scripts\Organize-RootDirectory.ps1" -ForegroundColor White
        Write-Host "   Or use: .\scripts\Validate-RootCompliance.ps1 -AutoFix`n" -ForegroundColor White
    }
    else {
        Write-Host "`n✅ Perfect! Root directory is fully compliant.`n" -ForegroundColor Green
    }
    
    return @{
        TotalFiles   = $rootFiles.Count
        Compliant    = $compliant.Count
        Violations   = $violations.Count
        Details      = $violations
    }
}

function Invoke-AutoFix {
    Write-Host "`n🔧 Auto-Fix Mode: Running Organize-RootDirectory.ps1...`n" -ForegroundColor Yellow
    
    $orgScript = Join-Path $script:RootPath "scripts/Organize-RootDirectory.ps1"
    
    if (-not (Test-Path $orgScript)) {
        Write-Host "❌ Error: Organize-RootDirectory.ps1 not found at $orgScript" -ForegroundColor Red
        return $false
    }
    
    try {
        & $orgScript -ConflictStrategy Rename
        return $true
    }
    catch {
        Write-Host "❌ Error during auto-fix: $_" -ForegroundColor Red
        return $false
    }
}

function Send-WebhookNotification {
    param(
        [string]$Url,
        [hashtable]$Report
    )
    
    if (-not $Url) {
        return
    }
    
    $payload = @{
        timestamp   = (Get-Date).ToString("o")
        repository  = "terrafusion_os_1.0"
        action      = $Action
        total_files = $Report.TotalFiles
        compliant   = $Report.Compliant
        violations  = $Report.Violations
        status      = if ($Report.Violations -eq 0) { "PASS" } else { "FAIL" }
        details     = $Report.Details | ForEach-Object {
            @{
                file        = $_.File.Name
                reason      = $_.Reason
                destination = $_.Destination
            }
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        Invoke-RestMethod -Uri $Url -Method Post -Body $payload -ContentType "application/json"
        Write-Host "✅ Webhook notification sent" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Failed to send webhook: $_" -ForegroundColor Yellow
    }
}

function Export-ComplianceReport {
    param([hashtable]$Report)
    
    $reportDir = Join-Path $script:RootPath "logs/compliance"
    if (-not (Test-Path $reportDir)) {
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $reportPath = Join-Path $reportDir "compliance-report-${timestamp}.json"
    
    $Report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
    
    Write-Host "📄 Detailed report saved: $reportPath`n" -ForegroundColor Cyan
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

function Invoke-ComplianceValidation {
    $report = Get-ComplianceReport
    
    Export-ComplianceReport -Report $report
    
    if ($Webhook) {
        Send-WebhookNotification -Url $Webhook -Report $report
    }
    
    if ($Action -eq 'Enforce' -and $report.Violations -gt 0) {
        if ($AutoFix) {
            $success = Invoke-AutoFix
            if ($success) {
                Write-Host "✅ Auto-fix completed. Re-running validation...`n" -ForegroundColor Green
                Start-Sleep -Seconds 2
                $report = Get-ComplianceReport
            }
        }
        else {
            Write-Host "⚠️  Enforce mode requires -AutoFix flag to automatically fix violations.`n" -ForegroundColor Yellow
        }
    }
    
    if ($ExitOnFail -and $report.Violations -gt 0) {
        Write-Host "❌ Compliance check failed. Exiting with error code." -ForegroundColor Red
        exit 1
    }
    
    if ($report.Violations -eq 0) {
        Write-Host "🎉 All systems green! Root directory meets TerraFusion standards.`n" -ForegroundColor Green
        exit 0
    }
    else {
        exit 0  # Don't fail by default, just report
    }
}

# Execute
Invoke-ComplianceValidation
