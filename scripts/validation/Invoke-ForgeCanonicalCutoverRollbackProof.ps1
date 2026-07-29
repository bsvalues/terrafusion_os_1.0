[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$CutoverCommit,
    [string]$ProofRootBase = 'D:\tf-build\sr-006-forge-cutover-rollback'
)

$ErrorActionPreference = 'Stop'
$repository = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$authorizedCutoverBase = '4e6a810c73b0e9e165a4e496f17dd9da44ec2449'
$proofRoot = Join-Path $ProofRootBase ([DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssfffZ'))
$rollbackWorktree = Join-Path $proofRoot 'sovereign-rollback'
$cargoTarget = Join-Path $rollbackWorktree 'packages\terrabuild\kernels\target'
$dotnetArtifacts = Join-Path $rollbackWorktree '.rollback-artifacts'
$dotnetHome = Join-Path $proofRoot 'dotnet-home'
$nugetPackages = Join-Path $proofRoot 'nuget'
$nugetHttp = Join-Path $proofRoot 'nuget-http'
$temp = Join-Path $proofRoot 'tmp'
$worktreeCreated = $false
$cleanupErrors = [Collections.Generic.List[string]]::new()
$result = $null
$expectedSourceBlobIds = [ordered]@{
    'packages/terrabuild/kernels/terraforge.kernel.valuation/Cargo.toml' =
        '8a0d20eca94a182e8578e97aee3cc9674adaf523'
    'packages/terrabuild/kernels/terraforge.kernel.valuation/build.rs' =
        'b61e54c728d8aa3d020c232b17921ee06fc80fd7'
    'packages/terrabuild/kernels/terraforge.kernel.valuation/src/main.rs' =
        'f108a3daab0ace2b67f4dadb766e9634947f625c'
}

$preservedEnvironment = @{}
foreach ($name in @(
        'CARGO_TARGET_DIR',
        'DOTNET_CLI_USE_MSBUILD_SERVER',
        'DOTNET_CLI_HOME',
        'NUGET_PACKAGES',
        'NUGET_HTTP_CACHE_PATH',
        'TEMP',
        'TMP'
    )) {
    $preservedEnvironment[$name] = @{
        Exists = Test-Path "Env:$name"
        Value = [Environment]::GetEnvironmentVariable($name, 'Process')
    }
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory)]
        [string]$Command,
        [Parameter(ValueFromRemainingArguments)]
        [string[]]$Arguments
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Command failed with exit code $LASTEXITCODE."
    }
}

function Get-GitScalar {
    param(
        [Parameter(Mandatory)]
        [string]$Repository,
        [Parameter(Mandatory)]
        [string[]]$Arguments
    )

    $value = (& git -C $Repository @Arguments)
    if ($LASTEXITCODE -ne 0) {
        throw "git -C $Repository $($Arguments -join ' ') failed."
    }
    return ($value -join "`n").Trim()
}

function Get-LocalNuGetSource {
    $lines = @(& dotnet nuget locals global-packages --list)
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to query the local NuGet global-packages source.'
    }
    $entry = $lines |
        Where-Object { $_ -match '^\s*global-packages:\s*(.+?)\s*$' } |
        Select-Object -First 1
    if ($null -eq $entry) {
        throw 'Unable to resolve the local NuGet global-packages source.'
    }
    $path = ([regex]::Match(
        $entry,
        '^\s*global-packages:\s*(.+?)\s*$'
    )).Groups[1].Value
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Local NuGet source is unavailable: $path"
    }
    return [IO.Path]::GetFullPath($path)
}

try {
    & git -C $repository cat-file -e "$CutoverCommit`^{commit}"
    if ($LASTEXITCODE -ne 0) {
        throw "Cutover commit does not exist: $CutoverCommit"
    }
    & git -C $repository merge-base --is-ancestor $authorizedCutoverBase $CutoverCommit
    if ($LASTEXITCODE -ne 0) {
        throw "Cutover commit does not descend from $authorizedCutoverBase."
    }
    $cutoverCommits = @(
        & git -C $repository rev-list "$authorizedCutoverBase..$CutoverCommit"
    )
    if ($LASTEXITCODE -ne 0 -or $cutoverCommits.Count -eq 0) {
        throw 'No cutover commits were found for rollback.'
    }

    New-Item -ItemType Directory -Force -Path @(
        $proofRoot,
        $dotnetHome,
        $nugetPackages,
        $nugetHttp,
        $temp
    ) | Out-Null
    Invoke-Checked -Command git -Arguments @(
        '-C', $repository, 'worktree', 'add', '--detach', '--no-checkout',
        $rollbackWorktree, $CutoverCommit
    )
    $worktreeCreated = $true
    Invoke-Checked -Command git -Arguments @(
        '-C', $rollbackWorktree, 'sparse-checkout', 'set', '--no-cone',
        '/.gitignore', '/backend/', '/packages/', '/scripts/'
    )
    Invoke-Checked -Command git -Arguments @(
        '-C', $rollbackWorktree, 'checkout', '--detach', '--quiet', $CutoverCommit
    )
    New-Item -ItemType Directory -Force -Path $dotnetArtifacts | Out-Null

    foreach ($commit in $cutoverCommits) {
        Invoke-Checked -Command git -Arguments @(
            '-C', $rollbackWorktree, 'revert', '--no-commit', $commit
        )
    }

    foreach ($relativePath in $expectedSourceBlobIds.Keys) {
        if (-not (Test-Path -LiteralPath (Join-Path $rollbackWorktree $relativePath))) {
            throw "Rollback did not restore $relativePath."
        }
        $blobId = Get-GitScalar -Repository $rollbackWorktree -Arguments @(
            'hash-object', $relativePath
        )
        if ($blobId -ne $expectedSourceBlobIds[$relativePath]) {
            throw "Rollback restored an unexpected source blob for $relativePath."
        }
    }

    $workspaceManifest = Join-Path $rollbackWorktree 'packages\terrabuild\kernels\Cargo.toml'
    $workspaceText = Get-Content -Raw -LiteralPath $workspaceManifest
    if ($workspaceText -notmatch '"terraforge\.kernel\.valuation"') {
        throw 'Rollback did not restore the sovereign valuation workspace member.'
    }
    $workspaceLock = Get-Content -Raw -LiteralPath (
        Join-Path $rollbackWorktree 'packages\terrabuild\kernels\Cargo.lock'
    )
    if ($workspaceLock -notmatch 'name\s*=\s*"terraforge-kernel-valuation"') {
        throw 'Rollback did not restore the sovereign valuation lock entry.'
    }
    $appSettings = Get-Content -Raw -LiteralPath (
        Join-Path $rollbackWorktree 'backend\src\TerraFusion.API\appsettings.json'
    ) | ConvertFrom-Json
    if ($appSettings.RustKernels.ValuationKernelPath -ne
        '../../packages/terrabuild/kernels/target/release/terraforge-kernel-valuation.exe') {
        throw 'Rollback did not restore the sovereign valuation runtime path.'
    }

    $env:CARGO_TARGET_DIR = $cargoTarget
    Invoke-Checked -Command cargo -Arguments @(
        'test', '--offline', '--manifest-path', $workspaceManifest
    )
    Invoke-Checked -Command cargo -Arguments @(
        'build', '--release', '--offline', '--manifest-path', $workspaceManifest
    )

    $nugetOfflineSource = Get-LocalNuGetSource
    $env:DOTNET_CLI_HOME = $dotnetHome
    $env:DOTNET_CLI_USE_MSBUILD_SERVER = '0'
    $env:NUGET_PACKAGES = $nugetPackages
    $env:NUGET_HTTP_CACHE_PATH = $nugetHttp
    $env:TEMP = $temp
    $env:TMP = $temp
    $testProject = Join-Path `
        $rollbackWorktree `
        'backend\TerraFusion.API.Tests\TerraFusion.API.Tests.csproj'
    Invoke-Checked -Command dotnet -Arguments @(
        'restore',
        $testProject,
        '--source',
        $nugetOfflineSource,
        '--packages',
        $nugetPackages,
        '--artifacts-path',
        $dotnetArtifacts,
        '--no-cache'
    )
    Invoke-Checked -Command dotnet -Arguments @(
        'test',
        $testProject,
        '-c',
        'Release',
        '--no-restore',
        '--artifacts-path',
        $dotnetArtifacts,
        '--filter',
        (
            'FullyQualifiedName~RustKernelProcessHostTests|' +
            'FullyQualifiedName~RealKernels_ComputeExpectedValue'
        ),
        '-p:UseSharedCompilation=false',
        '-nodeReuse:false'
    )

    $result = [ordered]@{
        result = 'PASS'
        terminalCondition = 'FORGE_CUTOVER_REPOSITORY_ROLLBACK_PROVEN'
        cutoverCommit = $CutoverCommit
        restoredCommit = $authorizedCutoverBase
        reversedCommits = $cutoverCommits
        sovereignValuationSourceRestored = $true
        sovereignRuntimePathRestored = $true
        cargoWorkspaceRestored = $true
        cargoTests = 'PASS'
        backendFocusedTests = 'PASS'
        productionOrProtectedResourcesUsed = $false
    }
}
finally {
    foreach ($name in $preservedEnvironment.Keys) {
        if ($preservedEnvironment[$name].Exists) {
            [Environment]::SetEnvironmentVariable(
                $name,
                $preservedEnvironment[$name].Value,
                'Process')
        }
        else {
            [Environment]::SetEnvironmentVariable($name, $null, 'Process')
        }
    }

    if ($worktreeCreated) {
        try {
            Invoke-Checked -Command git -Arguments @(
                '-C', $repository, 'worktree', 'remove', '--force', $rollbackWorktree
            )
            Invoke-Checked -Command git -Arguments @(
                '-C', $repository, 'worktree', 'prune'
            )
        }
        catch {
            $cleanupErrors.Add($_.Exception.Message)
        }
    }
    if (Test-Path -LiteralPath $proofRoot) {
        $removed = $false
        for ($attempt = 1; $attempt -le 5 -and -not $removed; $attempt++) {
            try {
                Remove-Item -LiteralPath $proofRoot -Recurse -Force
                $removed = $true
            }
            catch {
                if ($attempt -eq 5) {
                    $cleanupErrors.Add($_.Exception.Message)
                }
                else {
                    Start-Sleep -Seconds $attempt
                }
            }
        }
    }
}

if ($cleanupErrors.Count -gt 0) {
    throw "Rollback cleanup failed: $($cleanupErrors -join '; ')"
}
if ($null -ne $result) {
    $result | ConvertTo-Json -Depth 8
}
