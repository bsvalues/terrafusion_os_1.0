# =============================================================================
# PRODUCTION SMOKE VERIFICATION SCRIPT
# =============================================================================
# Operator-friendly wrapper for tf-runtime cert.
# This is the runbook step: "No certification, no traffic"
#
# Usage:
#   pwsh -NoProfile -File scripts/prod-smoke-verify.ps1 -BaseUrl https://tf.benton.county -Strict
#   pwsh -NoProfile -File scripts/prod-smoke-verify.ps1 -BaseUrl https://tf.benton.county -County benton
#
# Exit Codes:
#   0 - All checks passed, safe to open traffic
#   1 - Certification failed, DO NOT open traffic
#   2 - Runtime error (network, config, tool missing)
# =============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl,

    [Parameter(Mandatory=$false)]
    [string]$County = "benton",

    [Parameter(Mandatory=$false)]
    [switch]$Strict,

    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "artifacts/cert"
)

$ErrorActionPreference = "Stop"

# Set UTF-8 encoding
$env:PYTHONIOENCODING = "utf-8"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$RuntimeCertTool = Join-Path $ProjectRoot "tools/runtime-cert/tf-runtime.py"

# Banner
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       TERRAFUSION PRODUCTION SMOKE VERIFICATION                  ║" -ForegroundColor Cyan
Write-Host "║       'No certification, no traffic'                             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Validate inputs
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "   Target URL:    $BaseUrl"
Write-Host "   County:        $County"
Write-Host "   Strict Mode:   $($Strict.IsPresent)"
Write-Host "   Output Dir:    $OutputDir"
Write-Host ""

# Validate URL protocol
if (-not ($BaseUrl.StartsWith("http://") -or $BaseUrl.StartsWith("https://"))) {
    Write-Host "ERROR: Base URL must start with http:// or https://" -ForegroundColor Red
    exit 2
}

# Check tool exists
if (-not (Test-Path $RuntimeCertTool)) {
    Write-Host "ERROR: Runtime certification tool not found at $RuntimeCertTool" -ForegroundColor Red
    exit 2
}

# Build arguments
$certArgs = @("cert", $County, "--base-url", $BaseUrl, "--output", $OutputDir)
if ($Strict.IsPresent) {
    $certArgs += "--strict"
}

# Run certification
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Running certification checks..." -ForegroundColor Yellow
Write-Host ""

try {
    & python $RuntimeCertTool @certArgs
    $exitCode = $LASTEXITCODE
} catch {
    Write-Host "ERROR: Failed to execute certification tool: $_" -ForegroundColor Red
    exit 2
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Final verdict
switch ($exitCode) {
    0 {
        Write-Host ""
        Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║                    ✅ CERTIFICATION PASSED                       ║" -ForegroundColor Green
        Write-Host "║                                                                  ║" -ForegroundColor Green
        Write-Host "║   Safe to proceed:                                               ║" -ForegroundColor Green
        Write-Host "║   • Open ingress / switch DNS                                    ║" -ForegroundColor Green
        Write-Host "║   • Archive certification report                                 ║" -ForegroundColor Green
        Write-Host "║   • Update deployment log                                        ║" -ForegroundColor Green
        Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""

        # Show report location
        $latestReport = Get-ChildItem -Path $OutputDir -Directory | Sort-Object Name -Descending | Select-Object -First 1
        if ($latestReport) {
            $jsonReport = Join-Path $latestReport.FullName "cert.report.json"
            $mdReport = Join-Path $latestReport.FullName "cert.report.md"
            Write-Host "Reports archived at:" -ForegroundColor Cyan
            Write-Host "   JSON: $jsonReport"
            Write-Host "   Markdown: $mdReport"
        }
        Write-Host ""
        exit 0
    }
    1 {
        Write-Host ""
        Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Red
        Write-Host "║                    ❌ CERTIFICATION FAILED                       ║" -ForegroundColor Red
        Write-Host "║                                                                  ║" -ForegroundColor Red
        Write-Host "║   DO NOT open traffic. Required actions:                         ║" -ForegroundColor Red
        Write-Host "║   • Review check failures above                                  ║" -ForegroundColor Red
        Write-Host "║   • Fix underlying issues                                        ║" -ForegroundColor Red
        Write-Host "║   • Re-run certification                                         ║" -ForegroundColor Red
        Write-Host "║   • Only proceed when all checks pass                            ║" -ForegroundColor Red
        Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Red
        Write-Host ""
        exit 1
    }
    default {
        Write-Host ""
        Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
        Write-Host "║                    💥 CERTIFICATION ERROR                        ║" -ForegroundColor Magenta
        Write-Host "║                                                                  ║" -ForegroundColor Magenta
        Write-Host "║   Runtime error occurred (exit code: $exitCode)                        ║" -ForegroundColor Magenta
        Write-Host "║   • Check network connectivity to target                         ║" -ForegroundColor Magenta
        Write-Host "║   • Verify base URL is correct                                   ║" -ForegroundColor Magenta
        Write-Host "║   • Review error messages above                                  ║" -ForegroundColor Magenta
        Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
        Write-Host ""
        exit 2
    }
}
