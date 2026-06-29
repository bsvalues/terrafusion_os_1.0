[CmdletBinding()]
param(
    [switch]$Help,

    [ValidateSet("inspect")]
    [string]$Mode = "inspect"
)

$ErrorActionPreference = "Continue"
$hardFailures = 0
$repoRoot = $null

function Show-Usage {
    Write-Host "TerraFusion local bootstrap"
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/bootstrap.ps1"
    Write-Host "  pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/bootstrap.ps1 -Mode inspect"
    Write-Host "  pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/dev/bootstrap.ps1 -Help"
    Write-Host ""
    Write-Host "Modes:"
    Write-Host "  inspect  Read-only prerequisite, repo, docs, env, and Docker Compose config checks."
    Write-Host ""
    Write-Host "Behavior:"
    Write-Host "  Read-only. Does not install packages, create env files, start Docker services, restore .NET packages,"
    Write-Host "  run migrations, read secrets, or mutate Git."
}

if ($Help) {
    Show-Usage
    exit 0
}

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
        $global:LASTEXITCODE = 0
        $output = & $Command[0] @($Command | Select-Object -Skip 1) 2>&1
        $lines = ($output | ForEach-Object { $_.ToString().Trim() }) | Where-Object { $_ }
        if (-not $lines) {
            return ""
        }

        return [string]::Join("`n", $lines)
    }
    catch {
        $global:LASTEXITCODE = 1
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

function Test-RequiredPath {
    param([Parameter(Mandatory = $true)][string]$Path)

    $resolvedPath = if ($repoRoot) { Join-Path -Path $repoRoot -ChildPath $Path } else { $Path }
    if (Test-Path -LiteralPath $resolvedPath) {
        Write-Result "PASS" "Required path exists: $Path"
        return $true
    }

    Write-Result "FAIL" "Required path missing: $Path"
    return $false
}

function Test-ComposeConfig {
    param(
        [string[]]$Profiles = @()
    )

    if (-not $repoRoot) {
        Write-Result "WARN" "Skipping Docker Compose config validation because the repository root could not be determined."
        return
    }

    $composeFile = Join-Path -Path $repoRoot -ChildPath "docker/dev/compose.yaml"
    $envFile = Join-Path -Path $repoRoot -ChildPath "docker/dev/.env.example"
    if (-not (Test-Path -LiteralPath $composeFile) -or -not (Test-Path -LiteralPath $envFile)) {
        Write-Result "WARN" "Skipping Docker Compose config validation because docker/dev/compose.yaml or docker/dev/.env.example is missing."
        return
    }

    $composeArgs = @("compose", "-f", $composeFile, "--env-file", $envFile)
    foreach ($profile in $Profiles) {
        $composeArgs += @("--profile", $profile)
    }
    $composeArgs += "config"

    $label = if ($Profiles.Count -gt 0) { "profile '$($Profiles -join ",")'" } else { "bare profile-gated" }
    $output = Get-CommandText -Command (@("docker") + $composeArgs)
    if ($LASTEXITCODE -eq 0) {
        Write-Result "PASS" "Docker Compose $label config validates."
    }
    else {
        Write-Result "WARN" "Docker Compose $label config failed. Review docs/onboarding/DOCKER_TROUBLESHOOTING.md. $output"
    }
}

Write-Result "INFO" "TerraFusion bootstrap mode: $Mode"
Write-Result "INFO" "Bootstrap inspect mode is read-only. It does not install, restore, start services, create env files, run migrations, read secrets, or mutate Git."
Write-Result "INFO" "Current path: $(Get-Location)"

$gitAvailable = Test-Tool -Name "git" -VersionCommand @("git", "--version") -MissingLevel "FAIL"
if ($gitAvailable) {
    $topLevel = Get-CommandText -Command @("git", "rev-parse", "--show-toplevel")
    if ($LASTEXITCODE -eq 0 -and $topLevel) {
        $repoRoot = $topLevel.Trim()
        Write-Result "PASS" "Git repository root: $repoRoot"
    }
    else {
        Write-Result "FAIL" "Current path is not inside a Git worktree."
    }

    $branch = Get-CommandText -Command @("git", "branch", "--show-current")
    if ($LASTEXITCODE -eq 0 -and $branch) {
        Write-Result "INFO" "Git branch: $branch"
    }
    else {
        $shortHead = Get-CommandText -Command @("git", "rev-parse", "--short", "HEAD")
        if ($LASTEXITCODE -eq 0 -and $shortHead) {
            Write-Result "INFO" "Git branch: detached HEAD at $shortHead"
        }
        else {
            Write-Result "WARN" "Git branch could not be determined."
        }
    }

    $status = Get-CommandText -Command @("git", "status", "--short", "--branch")
    if ($LASTEXITCODE -eq 0 -and $status) {
        if ($status -match "`n|\s[A-Z?]{1,2}\s") {
            Write-Result "WARN" "Git status is not clean. Review before editing: $status"
        }
        else {
            Write-Result "PASS" "Git status checked: $status"
        }
    }
    else {
        Write-Result "WARN" "Git status could not be determined."
    }
}

Test-Tool -Name "pwsh" -VersionCommand @("pwsh", "--version") | Out-Null
Test-Tool -Name "node" -VersionCommand @("node", "--version") | Out-Null
Test-Tool -Name "pnpm" -VersionCommand @("pnpm", "--version") | Out-Null
Test-Tool -Name "dotnet" -VersionCommand @("dotnet", "--version") | Out-Null

$dockerAvailable = Test-Tool -Name "docker" -VersionCommand @("docker", "--version")
if ($dockerAvailable) {
    $composeVersion = Get-CommandText -Command @("docker", "compose", "version")
    if ($LASTEXITCODE -eq 0 -and $composeVersion) {
        Write-Result "PASS" "Docker Compose available. $composeVersion"
    }
    else {
        Write-Result "WARN" "Docker Compose command is unavailable or not working."
    }
}

$requiredPaths = @(
    "docs/onboarding/DEV_SETUP.md",
    "docs/onboarding/DEVELOPER_ONBOARDING.md",
    "docs/onboarding/DOCKER_DEV.md",
    "docs/onboarding/DOCKER_TROUBLESHOOTING.md",
    "docker/dev/compose.yaml",
    "docker/dev/.env.example"
)

if ($repoRoot) {
    foreach ($path in $requiredPaths) {
        Test-RequiredPath -Path $path | Out-Null
    }

    $envPath = "docker/dev/.env"
    $resolvedEnvPath = Join-Path -Path $repoRoot -ChildPath $envPath
    if (Test-Path -LiteralPath $resolvedEnvPath) {
        Write-Result "INFO" "Local Docker env file exists: $envPath"
    }
    else {
        Write-Result "WARN" "Local Docker env file is absent. Use placeholders from docker/dev/.env.example if local Docker dev needs a .env file."
    }

    if ($dockerAvailable) {
        Test-ComposeConfig
        Test-ComposeConfig -Profiles @("tooling")
        Test-ComposeConfig -Profiles @("frontend")
        Test-ComposeConfig -Profiles @("backend")
    }
}
else {
    Write-Result "WARN" "Skipping repo-relative path checks because the repository root could not be determined."
}

Write-Result "INFO" "Next docs:"
Write-Result "INFO" "- docs/onboarding/DEV_SETUP.md"
Write-Result "INFO" "- docs/onboarding/DOCKER_DEV.md"
Write-Result "INFO" "- docs/onboarding/DOCKER_TROUBLESHOOTING.md"

if ($hardFailures -gt 0) {
    Write-Host "FAIL: Bootstrap inspect completed with $hardFailures hard failure(s)."
    exit 1
}

Write-Result "PASS" "Bootstrap inspect completed with no hard failures."
exit 0
