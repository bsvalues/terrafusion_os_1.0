[CmdletBinding()]
param(
    [string]$AtlasRepository = 'C:\Users\bsval\terrafusion-atlas',
    [string]$ProofRootBase = 'E:\tf-build\sr-007a-local-shadow',
    [string]$DotnetRootBase = 'C:\tf-build\sr-007a-local-shadow-dotnet',
    [string]$NuGetPackagesPath
)

$ErrorActionPreference = 'Stop'
$expectedSovereignBase = '12019bce0850b28ded91e5e820d0f54d202a14cc'
$expectedAtlasCommit = '6c530f1b6b77d59225353dede929c0688f1587da'
$moduleRelativePath = 'src/spatial-read/project-atlas-feature.mjs'
$expectedModuleSha256 = '3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46'
$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runId = (
    [DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') +
    '-' +
    [Guid]::NewGuid().ToString('N')
)
$proofRoot = Join-Path $ProofRootBase $runId
$dotnetRoot = Join-Path $DotnetRootBase $runId
$dotnetArtifacts = Join-Path $dotnetRoot 'artifacts'
$dotnetHome = Join-Path $dotnetRoot 'dotnet-home'
$nugetPackages = if ([string]::IsNullOrWhiteSpace($NuGetPackagesPath)) {
    $null
}
else {
    [IO.Path]::GetFullPath($NuGetPackagesPath)
}
$nugetHttp = Join-Path $dotnetRoot 'nuget-http'
$temp = Join-Path $dotnetRoot 'tmp'
$atlasWorktree = Join-Path $proofRoot 'atlas-worktree'
$exchangeRoot = Join-Path $proofRoot 'exchange'
$copiedModule = Join-Path $exchangeRoot 'project-atlas-feature.mjs'
$manifestPath = Join-Path $exchangeRoot 'manifest.json'
$result = $null
$atlasWorktreeRegistered = $false
$preservedEnvironment = @{}
$cleanupErrors = [Collections.Generic.List[string]]::new()

foreach ($name in @(
        'DOTNET_CLI_HOME',
        'DOTNET_CLI_TELEMETRY_OPTOUT',
        'DOTNET_NOLOGO',
        'DOTNET_SKIP_FIRST_TIME_EXPERIENCE',
        'DOTNET_CLI_USE_MSBUILD_SERVER',
        'NUGET_PACKAGES',
        'NUGET_HTTP_CACHE_PATH',
        'TEMP',
        'TMP',
        'TERRAFUSION_ATLAS_SHADOW_MODULE_PATH',
        'TERRAFUSION_ATLAS_SHADOW_PROOF_ROOT'
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

function Remove-OwnedDirectory {
    param(
        [Parameter(Mandatory)]
        [string]$Path,
        [switch]$Recurse
    )

    for ($attempt = 1; $attempt -le 5; $attempt++) {
        if (-not (Test-Path -LiteralPath $Path)) {
            return
        }
        try {
            Remove-Item -LiteralPath $Path -Force -Recurse:$Recurse
            return
        }
        catch {
            if ($attempt -eq 5) {
                $cleanupErrors.Add("$Path`: $($_.Exception.Message)")
                return
            }
            Start-Sleep -Milliseconds (250 * $attempt)
        }
    }
}

try {
    $currentHead = (git -C $sovereignRepository rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to resolve the sovereign candidate HEAD.'
    }
    git -C $sovereignRepository merge-base --is-ancestor $expectedSovereignBase $currentHead
    if ($LASTEXITCODE -ne 0) {
        throw "Sovereign HEAD $currentHead does not descend from $expectedSovereignBase."
    }

    $atlasRoot = (git -C $AtlasRepository rev-parse --show-toplevel).Trim()
    if ($LASTEXITCODE -ne 0 -or
        [System.IO.Path]::GetFullPath($atlasRoot) -ne
        [System.IO.Path]::GetFullPath($AtlasRepository)) {
        throw 'AtlasRepository is not the canonical shared Atlas checkout.'
    }

    $atlasRemote = (git -C $AtlasRepository remote get-url origin).Trim()
    if ($LASTEXITCODE -ne 0 -or
        $atlasRemote -notmatch '(^|[:/])bsvalues/terrafusion-atlas(\.git)?$') {
        throw "Unexpected Atlas origin: $atlasRemote"
    }

    $sharedStatus = @(git -C $AtlasRepository status --short)
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to inspect the shared Atlas checkout.'
    }
    if ($sharedStatus.Count -gt 0) {
        throw 'The shared Atlas checkout is not clean and read-only.'
    }

    $atlasOriginMain = (git -C $AtlasRepository rev-parse origin/main).Trim()
    if ($LASTEXITCODE -ne 0 -or $atlasOriginMain -ne $expectedAtlasCommit) {
        throw "Atlas origin/main must equal $expectedAtlasCommit; found $atlasOriginMain."
    }

    if ((Test-Path -LiteralPath $proofRoot) -or (Test-Path -LiteralPath $dotnetRoot)) {
        throw 'The invocation-owned proof or .NET directory already exists.'
    }
    $ownedDirectories = @(
        $proofRoot,
        $exchangeRoot,
        $dotnetArtifacts,
        $dotnetHome,
        $nugetHttp,
        $temp
    )
    if ($null -ne $nugetPackages) {
        $ownedDirectories += $nugetPackages
    }
    New-Item -ItemType Directory -Force -Path $ownedDirectories | Out-Null
    Invoke-Checked -Command git -Arguments @(
        '-C',
        $AtlasRepository,
        'worktree',
        'add',
        '--detach',
        $atlasWorktree,
        $expectedAtlasCommit
    )
    $atlasWorktreeRegistered = $true

    $moduleSource = Join-Path $atlasWorktree $moduleRelativePath
    $sourceSha256 = (
        Get-FileHash -Algorithm SHA256 -LiteralPath $moduleSource
    ).Hash.ToLowerInvariant()
    if ($sourceSha256 -ne $expectedModuleSha256) {
        throw "Atlas source module hash mismatch: $sourceSha256."
    }

    Copy-Item -LiteralPath $moduleSource -Destination $copiedModule
    $copiedSha256 = (
        Get-FileHash -Algorithm SHA256 -LiteralPath $copiedModule
    ).Hash.ToLowerInvariant()
    if ($copiedSha256 -ne $expectedModuleSha256) {
        throw "Disposable Atlas module hash mismatch: $copiedSha256."
    }

    $nodeVersion = (& node --version).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to capture the local Node version.'
    }
    $manifest = [ordered]@{
        schemaVersion = 1
        repository = 'bsvalues/terrafusion-atlas'
        commit = $expectedAtlasCommit
        sovereignBase = $expectedSovereignBase
        sovereignHead = $currentHead
        sourcePath = $moduleRelativePath
        sourceSha256 = $sourceSha256
        copiedSha256 = $copiedSha256
        nodeVersion = $nodeVersion
        generatedAtUtc = [DateTimeOffset]::UtcNow.ToString('O')
        transport = 'local-disposable-directory'
        atlasWorktree = $atlasWorktree
        copiedModule = $copiedModule
        manifestPath = $manifestPath
        dotnetArtifacts = $dotnetArtifacts
    }
    $manifest | ConvertTo-Json -Depth 8 |
        Set-Content -LiteralPath $manifestPath -Encoding utf8

    $manifestProof = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
    if ($manifestProof.commit -ne $expectedAtlasCommit -or
        $manifestProof.sourcePath -ne $moduleRelativePath -or
        $manifestProof.sourceSha256 -ne $expectedModuleSha256 -or
        $manifestProof.copiedSha256 -ne $expectedModuleSha256) {
        throw 'Disposable Atlas projection manifest verification failed.'
    }

    $env:TERRAFUSION_ATLAS_SHADOW_MODULE_PATH = $copiedModule
    $env:TERRAFUSION_ATLAS_SHADOW_PROOF_ROOT = $proofRoot
    $localNuGetSource = Get-LocalNuGetSource
    if ($null -eq $nugetPackages) {
        $nugetPackages = $localNuGetSource
    }
    $env:DOTNET_CLI_HOME = $dotnetHome
    $env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
    $env:DOTNET_NOLOGO = '1'
    $env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = '1'
    $env:DOTNET_CLI_USE_MSBUILD_SERVER = '0'
    $env:NUGET_PACKAGES = $nugetPackages
    $env:NUGET_HTTP_CACHE_PATH = $nugetHttp
    $env:TEMP = $temp
    $env:TMP = $temp
    $testProject = Join-Path `
        $sovereignRepository `
        'backend\tests\TerraFusion.Unit.Tests\TerraFusion.Unit.Tests.csproj'
    Invoke-Checked -Command dotnet -Arguments @(
        'restore',
        $testProject,
        '--source',
        $localNuGetSource,
        '--packages',
        $nugetPackages,
        '--artifacts-path',
        $dotnetArtifacts,
        '--no-cache',
        '--disable-parallel',
        '/m:1'
    )
    Invoke-Checked -Command dotnet -Arguments @(
        'build',
        $testProject,
        '-c',
        'Release',
        '--no-restore',
        '--artifacts-path',
        $dotnetArtifacts,
        '/warnaserror',
        '-p:UseSharedCompilation=false',
        '-nodeReuse:false',
        '/m:1'
    )
    Invoke-Checked -Command dotnet -Arguments @(
        'test',
        $testProject,
        '-c',
        'Release',
        '--no-restore',
        '--no-build',
        '--artifacts-path',
        $dotnetArtifacts,
        '--filter',
        'FullyQualifiedName~AtlasLocalSovereignShadowProjectionTests'
    )

    $protectedDelta = @(
        git -C $sovereignRepository diff $expectedSovereignBase --name-only -- 'backend/src'
    )
    $protectedUntracked = @(
        git -C $sovereignRepository status --porcelain=v1 --untracked-files=all -- 'backend/src'
    )
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to inspect protected backend source changes.'
    }
    $atlasStatusAfter = @(git -C $AtlasRepository status --short)
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to recheck the shared Atlas checkout.'
    }
    if (
        $protectedDelta.Count -gt 0 -or
        $protectedUntracked.Count -gt 0 -or
        $atlasStatusAfter.Count -gt 0
    ) {
        throw 'Protected backend source or shared Atlas checkout changed during proof.'
    }

    $result = [ordered]@{
        result = 'PASS'
        atlasCommit = $expectedAtlasCommit
        moduleSha256 = $copiedSha256
        realAdapterPolygon = 'PASS'
        syntheticPoint = 'PASS'
        syntheticUnavailable = 'PASS'
        identityAndGeometryFailClosed = 'PASS'
        crossLaneFieldsExcluded = 'PASS'
        deterministicNormalizedOutput = 'PASS'
        tamperRejectedBeforeExecution = 'PASS'
        sharedAtlasCheckoutChanged = $false
        backendSourceChanged = $false
        runtimeAdopted = $false
        networkIsolation = 'local NuGet source plus Node permission and network-denial boundary'
        networkOrInstallUsed = $false
    }
}
finally {
    foreach ($name in $preservedEnvironment.Keys) {
        if ($preservedEnvironment[$name].Exists) {
            [Environment]::SetEnvironmentVariable(
                $name,
                $preservedEnvironment[$name].Value,
                'Process'
            )
        }
        else {
            [Environment]::SetEnvironmentVariable($name, $null, 'Process')
        }
    }

    if ($atlasWorktreeRegistered) {
        git -C $AtlasRepository worktree remove --force $atlasWorktree 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw 'Failed to remove the disposable Atlas proof worktree.'
        }
    }
    git -C $AtlasRepository worktree prune
    if ($LASTEXITCODE -ne 0) {
        throw 'Failed to prune Atlas proof worktree metadata.'
    }
    if (Test-Path -LiteralPath $proofRoot) {
        Remove-OwnedDirectory -Path $proofRoot -Recurse
    }
    if (
        (Test-Path -LiteralPath $ProofRootBase) -and
        @(Get-ChildItem -LiteralPath $ProofRootBase -Force).Count -eq 0
    ) {
        Remove-OwnedDirectory -Path $ProofRootBase
    }
    if (Test-Path -LiteralPath $dotnetRoot) {
        Remove-OwnedDirectory -Path $dotnetRoot -Recurse
    }
    if (
        (Test-Path -LiteralPath $DotnetRootBase) -and
        @(Get-ChildItem -LiteralPath $DotnetRootBase -Force).Count -eq 0
    ) {
        Remove-OwnedDirectory -Path $DotnetRootBase
    }
    if ($cleanupErrors.Count -gt 0) {
        throw "Proof cleanup failed: $($cleanupErrors -join '; ')"
    }
}

if ($null -ne $result) {
    $result.disposableStateRemoved = (
        -not (Test-Path -LiteralPath $proofRoot) -and
        -not (Test-Path -LiteralPath $ProofRootBase) -and
        -not (Test-Path -LiteralPath $dotnetRoot) -and
        -not (Test-Path -LiteralPath $DotnetRootBase)
    )
    $result | ConvertTo-Json -Depth 8
}
