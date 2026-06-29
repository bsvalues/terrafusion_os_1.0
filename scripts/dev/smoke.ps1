[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"
$hardFailures = 0

function Write-Result {
    param(
        [Parameter(Mandatory = $true)][ValidateSet("PASS", "WARN", "FAIL", "INFO")][string]$Level,
        [Parameter(Mandatory = $true)][string]$Message
    )

    Write-Host "$Level`: $Message"
    if ($Level -eq "FAIL") {
        $script:hardFailures++
    }
}

function Invoke-SmokeStep {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$ScriptPath
    )

    Write-Result "INFO" "Running smoke step: $Name"
    & pwsh -NoProfile -ExecutionPolicy Bypass -File $ScriptPath
    if ($LASTEXITCODE -eq 0) {
        Write-Result "PASS" "$Name completed."
    }
    else {
        Write-Result "FAIL" "$Name failed with exit code $LASTEXITCODE."
    }
}

function Get-RepoRoot {
    try {
        $root = & git rev-parse --show-toplevel 2>&1
        if ($LASTEXITCODE -eq 0 -and $root) {
            return $root.ToString().Trim()
        }
    }
    catch {
        return $null
    }

    return $null
}

Write-Result "INFO" "TerraFusion local smoke gate is read-only."
Write-Result "INFO" "It does not install packages, create env files, start Docker services, run migrations, read secrets, or mutate Git."
Write-Result "INFO" "Current path: $(Get-Location)"

$repoRoot = Get-RepoRoot
if (-not $repoRoot) {
    Write-Result "FAIL" "Current path is not inside a Git worktree."
}
else {
    Write-Result "PASS" "Git repository root: $repoRoot"

    $readiness = Join-Path -Path $repoRoot -ChildPath "scripts/dev/readiness.ps1"
    $bootstrap = Join-Path -Path $repoRoot -ChildPath "scripts/dev/bootstrap.ps1"

    if (-not (Test-Path -LiteralPath $readiness)) {
        Write-Result "FAIL" "Missing readiness script: scripts/dev/readiness.ps1"
    }
    else {
        Invoke-SmokeStep -Name "readiness" -ScriptPath $readiness
    }

    if (-not (Test-Path -LiteralPath $bootstrap)) {
        Write-Result "FAIL" "Missing bootstrap script: scripts/dev/bootstrap.ps1"
    }
    else {
        Invoke-SmokeStep -Name "bootstrap inspect" -ScriptPath $bootstrap
    }
}

if ($hardFailures -gt 0) {
    Write-Host "FAIL: Local smoke gate completed with $hardFailures hard failure(s)."
    exit 1
}

Write-Result "PASS" "Local smoke gate completed with no hard failures."
exit 0
