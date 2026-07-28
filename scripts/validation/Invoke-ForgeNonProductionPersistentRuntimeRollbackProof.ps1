[CmdletBinding()]
param(
    [string]$SharedForgeCheckout = 'D:\terrafusion-forge',
    [string]$ForgeProofWorktree = 'D:\.codex-worktrees\sr-006c-forge-proof',
    [string]$ProofRootBase = 'D:\tf-build\sr-006c-persistent-runtime-rollback'
)

$ErrorActionPreference = 'Stop'
$expectedForgeCommit = '24059c3642339f36877cb454ca63683180915b71'
$authorizedSovereignBase = '6f868cd6bd02fb29fbf544a6f8493e9e7fcec1a6'
$priorArtifactSha256 = '7fc77d5f475581ceaa87501d4c521e005857c8cfd85334ab09569d92ae716e88'
$expectedSourceHashes = [ordered]@{
    'kernels/terraforge.kernel.valuation/Cargo.toml' = '1d0997f80c718be5bcb4bcbe687f93786bac326975da22026ed738bff60489f0'
    'kernels/terraforge.kernel.valuation/Cargo.lock' = 'a85a0b72850254f85b74a988ae73cb18dfae97d1cfc28d764a626075d44c80b9'
    'kernels/terraforge.kernel.valuation/build.rs' = 'af474e3d6639701f5d5d2bbed509b742b7c988015c6fb96164baf740bd088e4f'
    'kernels/terraforge.kernel.valuation/src/main.rs' = '29fa8345e4921e1fa21cf7745142ec49c42b9b32f88c8a001fbb914f50ed77d9'
}

$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$proofRoot = Join-Path $ProofRootBase ([DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssfffZ'))
$proofWorktreeCreated = $false
$environmentRestored = $false
$disposableDirectoryRemoved = $false
$result = $null
$sharedForgeHeadBefore = $null
$sharedForgeStatusBefore = $null
$preservedEnvironment = @{}
$environmentNames = @(
    'CARGO_TARGET_DIR',
    'DOTNET_CLI_HOME',
    'NUGET_PACKAGES',
    'NUGET_HTTP_CACHE_PATH',
    'TEMP',
    'TMP',
    'DOTNET_ENVIRONMENT',
    'ASPNETCORE_ENVIRONMENT',
    'TERRAFUSION_FORGE_REHEARSAL_CONFIG_PATH',
    'TERRAFUSION_FORGE_REHEARSAL_EXPECTED_SHA256',
    'TERRAFUSION_FORGE_REHEARSAL_HOST'
)

foreach ($name in $environmentNames) {
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
        throw "git -C $Repository $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
    }
    return ($value -join "`n").Trim()
}

function Get-TrackedAppSettingsHashes {
    param([Parameter(Mandatory)][string]$Repository)

    $hashes = [ordered]@{}
    $paths = @(& git -C $Repository ls-files ':(glob)backend/**/appsettings*.json')
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to enumerate tracked appsettings files.'
    }
    foreach ($path in $paths) {
        $hashes[$path] = (
            Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $Repository $path)
        ).Hash.ToLowerInvariant()
    }
    return $hashes
}

function Assert-HashMapsEqual {
    param(
        [Parameter(Mandatory)]$Expected,
        [Parameter(Mandatory)]$Actual,
        [Parameter(Mandatory)][string]$Label
    )

    if (($Expected | ConvertTo-Json -Compress) -ne ($Actual | ConvertTo-Json -Compress)) {
        throw "$Label changed during the rehearsal."
    }
}

function Set-RehearsalConfig {
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$KernelPath
    )

    [ordered]@{
        RustKernels = [ordered]@{
            ValuationKernelPath = $KernelPath
        }
    } | ConvertTo-Json -Depth 3 |
        Set-Content -LiteralPath $Path -Encoding utf8
}

function Invoke-RehearsalHost {
    param(
        [Parameter(Mandatory)][string]$HostLabel,
        [Parameter(Mandatory)][string]$ExpectedSha256,
        [Parameter(Mandatory)][string]$ConfigPath,
        [Parameter(Mandatory)][string]$Project,
        [Parameter(Mandatory)][string]$ArtifactsPath
    )

    $env:DOTNET_ENVIRONMENT = 'ForgeRehearsal'
    $env:ASPNETCORE_ENVIRONMENT = 'ForgeRehearsal'
    $env:TERRAFUSION_FORGE_REHEARSAL_CONFIG_PATH = $ConfigPath
    $env:TERRAFUSION_FORGE_REHEARSAL_EXPECTED_SHA256 = $ExpectedSha256
    $env:TERRAFUSION_FORGE_REHEARSAL_HOST = $HostLabel
    Invoke-Checked -Command dotnet -Arguments @(
        'test',
        $Project,
        '-c',
        'Release',
        '--no-restore',
        '--artifacts-path',
        $ArtifactsPath,
        '--filter',
        'FullyQualifiedName~LocalForgePersistentRuntimeSelection_BindsDisposableConfiguration'
    )
}

try {
    $sovereignHead = Get-GitScalar -Repository $sovereignRepository -Arguments @('rev-parse', 'HEAD')
    & git -C $sovereignRepository merge-base --is-ancestor $authorizedSovereignBase $sovereignHead
    if ($LASTEXITCODE -ne 0) {
        throw "Sovereign HEAD $sovereignHead does not descend from $authorizedSovereignBase."
    }
    $sovereignStatusBefore =
        Get-GitScalar -Repository $sovereignRepository -Arguments @('status', '--short')
    $appSettingsHashesBefore = Get-TrackedAppSettingsHashes -Repository $sovereignRepository

    $sharedForgeHeadBefore =
        Get-GitScalar -Repository $SharedForgeCheckout -Arguments @('rev-parse', 'HEAD')
    $sharedForgeStatusBefore =
        Get-GitScalar -Repository $SharedForgeCheckout -Arguments @('status', '--short')
    if ($sharedForgeStatusBefore) {
        throw "Shared Forge checkout is not clean: $sharedForgeStatusBefore"
    }
    & git -C $SharedForgeCheckout cat-file -e "$expectedForgeCommit`^{commit}"
    if ($LASTEXITCODE -ne 0) {
        throw "Exact Forge commit is unavailable: $expectedForgeCommit."
    }
    if (Test-Path -LiteralPath $ForgeProofWorktree) {
        throw "Forge proof worktree path already exists: $ForgeProofWorktree"
    }
    $nugetGlobalOutput = (& dotnet nuget locals global-packages --list) -join "`n"
    if ($LASTEXITCODE -ne 0 -or
        $nugetGlobalOutput -notmatch '^global-packages:\s*(?<path>.+)$') {
        throw 'Unable to resolve the existing local NuGet global-packages source.'
    }
    $nugetOfflineSource = $Matches.path.Trim()
    if (-not [IO.Path]::IsPathFullyQualified($nugetOfflineSource) -or
        -not (Test-Path -LiteralPath $nugetOfflineSource)) {
        throw "NuGet offline source is unavailable: $nugetOfflineSource"
    }

    Invoke-Checked -Command git -Arguments @(
        '-C', $SharedForgeCheckout, 'worktree', 'add', '--detach',
        $ForgeProofWorktree, $expectedForgeCommit
    )
    $proofWorktreeCreated = $true
    $forgeHead = Get-GitScalar -Repository $ForgeProofWorktree -Arguments @('rev-parse', 'HEAD')
    $forgeStatus = Get-GitScalar -Repository $ForgeProofWorktree -Arguments @('status', '--short')
    if ($forgeHead -ne $expectedForgeCommit -or $forgeStatus) {
        throw 'Forge proof worktree identity or cleanliness check failed.'
    }

    New-Item -ItemType Directory -Force -Path $proofRoot | Out-Null
    $forgeTarget = Join-Path $proofRoot 'forge-target'
    $sovereignTarget = Join-Path $proofRoot 'sovereign-target'
    $transfer = Join-Path $proofRoot 'transfer'
    $dotnetArtifacts = Join-Path $proofRoot 'dotnet-artifacts'
    $dotnetHome = Join-Path $proofRoot 'dotnet-home'
    $nugetPackages = Join-Path $proofRoot 'nuget'
    $nugetHttp = Join-Path $proofRoot 'nuget-http'
    $temp = Join-Path $proofRoot 'tmp'
    New-Item -ItemType Directory -Force -Path @(
        $transfer, $dotnetArtifacts, $dotnetHome, $nugetPackages, $nugetHttp, $temp
    ) | Out-Null

    $sourceHashes = [ordered]@{}
    foreach ($relativePath in $expectedSourceHashes.Keys) {
        $sourceHash = (
            Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $ForgeProofWorktree $relativePath)
        ).Hash.ToLowerInvariant()
        if ($sourceHash -ne $expectedSourceHashes[$relativePath]) {
            throw "Forge source hash drift for $relativePath."
        }
        $sourceHashes[$relativePath] = $sourceHash
    }

    $forgeManifest = Join-Path $ForgeProofWorktree 'kernels\terraforge.kernel.valuation\Cargo.toml'
    $env:CARGO_TARGET_DIR = $forgeTarget
    Invoke-Checked cargo test --offline --locked --manifest-path $forgeManifest
    Invoke-Checked cargo build --release --offline --locked --manifest-path $forgeManifest
    $forgeBinary = Join-Path $forgeTarget 'release\terraforge-kernel-valuation.exe'
    if (-not (Test-Path -LiteralPath $forgeBinary)) {
        throw "Forge build did not produce $forgeBinary."
    }
    $artifactPath = Join-Path $transfer 'terraforge-kernel-valuation.exe'
    Copy-Item -LiteralPath $forgeBinary -Destination $artifactPath
    $forgeSha256 = (
        Get-FileHash -Algorithm SHA256 -LiteralPath $artifactPath
    ).Hash.ToLowerInvariant()

    $sovereignSource = Join-Path $proofRoot 'sovereign-source'
    Copy-Item -Recurse -LiteralPath (
        Join-Path $sovereignRepository 'packages\terrabuild\kernels\terraforge.kernel.valuation'
    ) -Destination $sovereignSource
    $sovereignManifest = Join-Path $sovereignSource 'Cargo.toml'
    $env:CARGO_TARGET_DIR = $sovereignTarget
    Invoke-Checked cargo build --release --offline --manifest-path $sovereignManifest
    $sovereignBinary = Join-Path $sovereignTarget 'release\terraforge-kernel-valuation.exe'
    if (-not (Test-Path -LiteralPath $sovereignBinary)) {
        throw "Sovereign build did not produce $sovereignBinary."
    }
    $sovereignSha256 = (
        Get-FileHash -Algorithm SHA256 -LiteralPath $sovereignBinary
    ).Hash.ToLowerInvariant()

    $rustc = (rustc --version --verbose) -join "`n"
    $cargoVersion = (cargo --version) -join "`n"
    $rustTargetLine = $rustc -split "`n" |
        Where-Object { $_ -like 'host:*' } |
        Select-Object -First 1
    if ([string]::IsNullOrWhiteSpace($rustTargetLine)) {
        throw 'Unable to capture the Rust host target.'
    }
    $rustTarget = $rustTargetLine.Substring('host:'.Length).Trim()
    $reproducibility = if ($forgeSha256 -eq $priorArtifactSha256) {
        'REPRODUCIBLE_BINARY_BUILD'
    }
    else {
        'BINARY_HASH_CHANGED_REPRODUCIBILITY_NOT_CLAIMED'
    }
    $manifestPath = Join-Path $transfer 'manifest.json'
    [ordered]@{
        schemaVersion = 1
        repository = 'bsvalues/terrafusion-forge'
        commit = $forgeHead
        target = $rustTarget
        transport = 'local-disposable-directory'
        kernelSourceHashes = $sourceHashes
        buildCommand =
            'cargo build --release --locked --manifest-path kernels/terraforge.kernel.valuation/Cargo.toml'
        toolchain = [ordered]@{ rustc = $rustc; cargo = $cargoVersion }
        executableFilename = 'terraforge-kernel-valuation.exe'
        executablePath = $artifactPath
        executableSha256 = $forgeSha256
        priorExecutableSha256 = $priorArtifactSha256
        reproducibilityClassification = $reproducibility
        nugetRestoreSource = $nugetOfflineSource
        nugetRestoreNetworkRequired = $false
        sovereignExecutablePath = $sovereignBinary
        sovereignComparisonBinarySha256 = $sovereignSha256
    } | ConvertTo-Json -Depth 8 |
        Set-Content -LiteralPath $manifestPath -Encoding utf8

    $manifestProof = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
    if ($manifestProof.commit -ne $expectedForgeCommit -or
        $manifestProof.executablePath -ne $artifactPath -or
        $manifestProof.executableSha256 -ne (
            Get-FileHash -Algorithm SHA256 -LiteralPath $artifactPath
        ).Hash.ToLowerInvariant() -or
        $manifestProof.sovereignExecutablePath -ne $sovereignBinary -or
        $manifestProof.sovereignComparisonBinarySha256 -ne $sovereignSha256) {
        throw 'Disposable Forge manifest verification failed.'
    }

    $configPath = Join-Path $transfer 'appsettings.ForgeRehearsal.local.json'
    Set-RehearsalConfig -Path $configPath -KernelPath $artifactPath
    $forgeConfigSha256 = (
        Get-FileHash -Algorithm SHA256 -LiteralPath $configPath
    ).Hash.ToLowerInvariant()

    $env:DOTNET_CLI_HOME = $dotnetHome
    $env:NUGET_PACKAGES = $nugetPackages
    $env:NUGET_HTTP_CACHE_PATH = $nugetHttp
    $env:TEMP = $temp
    $env:TMP = $temp
    $testProject =
        Join-Path $sovereignRepository 'backend\TerraFusion.API.Tests\TerraFusion.API.Tests.csproj'
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

    Invoke-RehearsalHost `
        -HostLabel 'A' `
        -ExpectedSha256 $forgeSha256 `
        -ConfigPath $configPath `
        -Project $testProject `
        -ArtifactsPath $dotnetArtifacts
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $configPath).Hash.ToLowerInvariant() -ne
        $forgeConfigSha256) {
        throw 'Host A changed the persisted Forge configuration.'
    }
    Invoke-RehearsalHost `
        -HostLabel 'B' `
        -ExpectedSha256 $forgeSha256 `
        -ConfigPath $configPath `
        -Project $testProject `
        -ArtifactsPath $dotnetArtifacts
    if ((Get-FileHash -Algorithm SHA256 -LiteralPath $configPath).Hash.ToLowerInvariant() -ne
        $forgeConfigSha256) {
        throw 'Host B changed the persisted Forge configuration.'
    }

    Set-RehearsalConfig -Path $configPath -KernelPath $sovereignBinary
    $rollbackConfig = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json
    if ($rollbackConfig.RustKernels.ValuationKernelPath -ne $sovereignBinary -or
        $rollbackConfig.RustKernels.ValuationKernelPath -eq $artifactPath) {
        throw 'Rollback configuration does not select only the sovereign executable.'
    }
    Invoke-RehearsalHost `
        -HostLabel 'C' `
        -ExpectedSha256 $sovereignSha256 `
        -ConfigPath $configPath `
        -Project $testProject `
        -ArtifactsPath $dotnetArtifacts

    $appSettingsHashesAfter = Get-TrackedAppSettingsHashes -Repository $sovereignRepository
    Assert-HashMapsEqual `
        -Expected $appSettingsHashesBefore `
        -Actual $appSettingsHashesAfter `
        -Label 'Tracked appsettings hashes'
    $backendSourceDelta = @(
        git -C $sovereignRepository diff $authorizedSovereignBase --name-only -- 'backend/src'
    )
    if ($LASTEXITCODE -ne 0 -or $backendSourceDelta.Count -gt 0) {
        throw "backend/src delta detected: $($backendSourceDelta -join ', ')"
    }
    $sharedForgeHeadAfter =
        Get-GitScalar -Repository $SharedForgeCheckout -Arguments @('rev-parse', 'HEAD')
    $sharedForgeStatusAfter =
        Get-GitScalar -Repository $SharedForgeCheckout -Arguments @('status', '--short')
    if ($sharedForgeHeadAfter -ne $sharedForgeHeadBefore -or
        $sharedForgeStatusAfter -ne $sharedForgeStatusBefore) {
        throw 'Shared Forge checkout changed during rehearsal.'
    }
    $sovereignStatusAfter =
        Get-GitScalar -Repository $sovereignRepository -Arguments @('status', '--short')
    if ($sovereignStatusAfter -ne $sovereignStatusBefore) {
        throw 'The sovereign worktree changed during rehearsal execution.'
    }

    $result = [ordered]@{
        result = 'PASS'
        terminalCondition =
            'FORGE_NONPRODUCTION_PERSISTENT_RUNTIME_ADOPTION_AND_ROLLBACK_PROVEN'
        forgeCommit = $forgeHead
        forgeArtifactSha256 = $forgeSha256
        sovereignArtifactSha256 = $sovereignSha256
        forgeSourceHashes = $sourceHashes
        reproducibilityClassification = $reproducibility
        hostAForgeSelection = 'PASS'
        hostBForgeSelectionAfterRestart = 'PASS'
        hostCResetToSovereignAfterRollback = 'PASS'
        acceptedBehavior = 'PASS'
        typedFailClosedBehavior = 'PASS'
        canonicalConfigurationChanged = $false
        backendSourceChanged = $false
        sharedForgeCheckoutChanged = $false
        persistentRuntimeChanged = $false
    }
}
finally {
    try {
        & dotnet build-server shutdown | Out-Null
    }
    catch {
        # Cleanup remains authoritative.
    }
    foreach ($name in $preservedEnvironment.Keys) {
        if ($preservedEnvironment[$name].Exists) {
            [Environment]::SetEnvironmentVariable(
                $name, $preservedEnvironment[$name].Value, 'Process')
        }
        else {
            [Environment]::SetEnvironmentVariable($name, $null, 'Process')
        }
    }
    $environmentRestored = $true

    if ($proofWorktreeCreated) {
        Invoke-Checked -Command git -Arguments @(
            '-C', $SharedForgeCheckout, 'worktree', 'remove', $ForgeProofWorktree
        )
        Invoke-Checked -Command git -Arguments @(
            '-C', $SharedForgeCheckout, 'worktree', 'prune'
        )
    }
    if (Test-Path -LiteralPath $proofRoot) {
        foreach ($attempt in 1..10) {
            try {
                Remove-Item -LiteralPath $proofRoot -Recurse -Force
                break
            }
            catch {
                if ($attempt -eq 10) {
                    throw
                }
                Start-Sleep -Seconds 1
            }
        }
    }
    if ((Test-Path -LiteralPath $proofRoot) -or
        (Test-Path -LiteralPath $ForgeProofWorktree)) {
        throw 'Disposable rehearsal residue remains.'
    }
    $disposableDirectoryRemoved = $true
}

if ($null -ne $result) {
    $result.environmentRestored = $environmentRestored
    $result.disposableDirectoryRemoved = $disposableDirectoryRemoved
    $result | ConvertTo-Json -Depth 8
}
