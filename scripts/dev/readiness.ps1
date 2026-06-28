[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"
$hardFailures = 0
$repoRoot = $null

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

function Get-CommandText {
    param([Parameter(Mandatory = $true)][string[]]$Command)

    try {
        $output = & $Command[0] @($Command | Select-Object -Skip 1) 2>&1
        $lines = ($output | ForEach-Object { $_.ToString().Trim() }) | Where-Object { $_ }
        return [string]::Join("`n", $lines)
    }
    catch {
        return $_.Exception.Message
    }
}

function Test-Tool {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string[]]$VersionCommand,
        [ValidateSet("PASS", "WARN", "FAIL")][string]$MissingLevel = "WARN"
    )

    $cmd = Get-Command -Name $Name -ErrorAction SilentlyContinue
    if (-not $cmd) {
        Write-Result $MissingLevel "$Name is not available on PATH."
        return $false
    }

    $version = Get-CommandText -Command $VersionCommand
    if ($LASTEXITCODE -ne 0) {
        Write-Result $MissingLevel "$Name is available, but its version command failed. $version"
        return $false
    }

    Write-Result "PASS" "$Name available. $version"
    return $true
}

Write-Result "INFO" "TerraFusion local readiness check is read-only. It does not install, restore, start services, read secrets, or modify files."
Write-Result "INFO" "Current path: $(Get-Location)"

$gitAvailable = Test-Tool -Name "git" -VersionCommand @("git", "--version") -MissingLevel "FAIL"
if ($gitAvailable) {
    $topLevel = Get-CommandText -Command @("git", "rev-parse", "--show-toplevel")
    if ($LASTEXITCODE -eq 0 -and $topLevel) {
        $repoRoot = $topLevel.Trim()
        Write-Result "PASS" "Git repository root: $topLevel"
    }
    else {
        Write-Result "FAIL" "Current path is not inside a Git worktree."
    }

    $branch = Get-CommandText -Command @("git", "branch", "--show-current")
    Write-Result "INFO" "Git branch: $branch"

    $status = Get-CommandText -Command @("git", "status", "--short", "--branch")
    if ($status -match "`n|\s[A-Z?]{1,2}\s") {
        Write-Result "WARN" "Git status is not clean. Review before editing: $status"
    }
    else {
        Write-Result "PASS" "Git status checked: $status"
    }
}

Test-Tool -Name "node" -VersionCommand @("node", "--version") | Out-Null
Test-Tool -Name "pnpm" -VersionCommand @("pnpm", "--version") | Out-Null
Test-Tool -Name "dotnet" -VersionCommand @("dotnet", "--version") | Out-Null

$dockerAvailable = Test-Tool -Name "docker" -VersionCommand @("docker", "--version")
if ($dockerAvailable) {
    $dockerVersion = Get-CommandText -Command @("docker", "version", "--format", "{{.Server.Version}}")
    if ($LASTEXITCODE -eq 0 -and $dockerVersion) {
        Write-Result "PASS" "Docker engine reachable. Server version: $dockerVersion"
    }
    else {
        Write-Result "WARN" "Docker CLI exists, but Docker Desktop/engine is not reachable."
    }

    $composeVersion = Get-CommandText -Command @("docker", "compose", "version")
    if ($LASTEXITCODE -eq 0 -and $composeVersion) {
        Write-Result "PASS" "Docker Compose available. $composeVersion"
    }
    else {
        Write-Result "WARN" "Docker Compose command is unavailable or not working."
    }
}

$requiredPaths = @(
    "AGENTS.md",
    "docs/onboarding/DEVELOPER_ONBOARDING.md",
    "docs/onboarding/DOCKER_DEV.md",
    "docs/onboarding/DOCKER_TROUBLESHOOTING.md",
    "docs/agents/DEVOPS_AGENT_HANDOFF_TEMPLATE.md",
    "docker/dev/compose.yaml",
    "docker/dev/.env.example"
)

foreach ($path in $requiredPaths) {
    $resolvedPath = if ($repoRoot) { Join-Path -Path $repoRoot -ChildPath $path } else { $path }
    if (Test-Path -LiteralPath $resolvedPath) {
        Write-Result "PASS" "Required path exists: $path"
    }
    else {
        Write-Result "FAIL" "Required path missing: $path"
    }
}

$envPath = "docker/dev/.env"
$resolvedEnvPath = if ($repoRoot) { Join-Path -Path $repoRoot -ChildPath $envPath } else { $envPath }
if (Test-Path -LiteralPath $resolvedEnvPath) {
    Write-Result "INFO" "Local Docker env file exists: $envPath"
}
else {
    Write-Result "WARN" "Local Docker env file is absent. Use placeholders from docker/dev/.env.example if a local .env is needed."
}

$azAvailable = Test-Tool -Name "az" -VersionCommand @("az", "version", "--output", "tsv")
if ($azAvailable) {
    $azDevops = Get-CommandText -Command @("az", "extension", "show", "--name", "azure-devops", "--query", "version", "-o", "tsv")
    if ($LASTEXITCODE -eq 0 -and $azDevops) {
        Write-Result "PASS" "Azure DevOps CLI extension available. Version: $azDevops"
    }
    else {
        Write-Result "WARN" "Azure CLI exists, but azure-devops extension was not found."
    }
}

if ($hardFailures -gt 0) {
    Write-Host "FAIL: Readiness completed with $hardFailures hard failure(s)."
    exit 1
}

Write-Result "PASS" "Readiness completed with no hard failures."
exit 0
