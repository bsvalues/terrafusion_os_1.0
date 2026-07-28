[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$ForgeRepository,
    [string]$SharedForgeCheckout = 'D:\terrafusion-forge',
    [string]$ProofRootBase = 'D:\tf-build\sr-006b-runtime-rollback'
)

$ErrorActionPreference = 'Stop'
$expectedForgeCommit = '24059c3642339f36877cb454ca63683180915b71'
$authorizedSovereignBase = '0d1167fce6e887e1f49f4e75963f441e9f04ab06'
$priorArtifactSha256 = '7fc77d5f475581ceaa87501d4c521e005857c8cfd85334ab09569d92ae716e88'
$expectedSourceHashes = [ordered]@{
    'kernels/terraforge.kernel.valuation/Cargo.toml' = '1d0997f80c718be5bcb4bcbe687f93786bac326975da22026ed738bff60489f0'
    'kernels/terraforge.kernel.valuation/Cargo.lock' = 'a85a0b72850254f85b74a988ae73cb18dfae97d1cfc28d764a626075d44c80b9'
    'kernels/terraforge.kernel.valuation/build.rs' = 'af474e3d6639701f5d5d2bbed509b742b7c988015c6fb96164baf740bd088e4f'
    'kernels/terraforge.kernel.valuation/src/main.rs' = '29fa8345e4921e1fa21cf7745142ec49c42b9b32f88c8a001fbb914f50ed77d9'
}

$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$proofRoot = Join-Path $ProofRootBase ([DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssfffZ'))
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
    'TERRAFUSION_FORGE_RUNTIME_KERNEL_PATH',
    'TERRAFUSION_SOVEREIGN_VALUATION_KERNEL_PATH',
    'TERRAFUSION_FORGE_RUNTIME_KERNEL_SHA256',
    'TERRAFUSION_SOVEREIGN_VALUATION_KERNEL_SHA256'
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

try {
    $sovereignHead = Get-GitScalar -Repository $sovereignRepository -Arguments @('rev-parse', 'HEAD')
    & git -C $sovereignRepository merge-base --is-ancestor $authorizedSovereignBase $sovereignHead
    if ($LASTEXITCODE -ne 0) {
        throw "Sovereign HEAD $sovereignHead does not descend from authorized base $authorizedSovereignBase."
    }

    $forgeHead = Get-GitScalar -Repository $ForgeRepository -Arguments @('rev-parse', 'HEAD')
    if ($forgeHead -ne $expectedForgeCommit) {
        throw "Forge worktree must be pinned to $expectedForgeCommit; found $forgeHead."
    }
    $forgeStatus = Get-GitScalar -Repository $ForgeRepository -Arguments @('status', '--short')
    if ($forgeStatus) {
        throw "Forge proof worktree is not clean: $forgeStatus"
    }

    $sharedForgeHeadBefore =
        Get-GitScalar -Repository $SharedForgeCheckout -Arguments @('rev-parse', 'HEAD')
    $sharedForgeStatusBefore =
        Get-GitScalar -Repository $SharedForgeCheckout -Arguments @('status', '--short')
    if ($sharedForgeStatusBefore) {
        throw "Shared Forge checkout is not clean: $sharedForgeStatusBefore"
    }

    New-Item -ItemType Directory -Force -Path $proofRoot | Out-Null
    $forgeTarget = Join-Path $proofRoot 'forge-target'
    $transfer = Join-Path $proofRoot 'transfer'
    $dotnetArtifacts = Join-Path $proofRoot 'dotnet-artifacts'
    $dotnetHome = Join-Path $proofRoot 'dotnet-home'
    $nugetPackages = Join-Path $proofRoot 'nuget'
    $nugetHttp = Join-Path $proofRoot 'nuget-http'
    $temp = Join-Path $proofRoot 'tmp'
    New-Item -ItemType Directory -Force -Path @(
        $transfer,
        $dotnetArtifacts,
        $dotnetHome,
        $nugetPackages,
        $nugetHttp,
        $temp
    ) | Out-Null

    $sourceHashes = [ordered]@{}
    foreach ($relativePath in $expectedSourceHashes.Keys) {
        $sourceHash = (
            Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $ForgeRepository $relativePath)
        ).Hash.ToLowerInvariant()
        if ($sourceHash -ne $expectedSourceHashes[$relativePath]) {
            throw "Forge source hash drift for $relativePath. Expected $($expectedSourceHashes[$relativePath]); found $sourceHash."
        }
        $sourceHashes[$relativePath] = $sourceHash
    }

    $forgeManifest = Join-Path $ForgeRepository 'kernels\terraforge.kernel.valuation\Cargo.toml'
    $env:CARGO_TARGET_DIR = $forgeTarget
    Invoke-Checked cargo test --locked --manifest-path $forgeManifest
    Invoke-Checked cargo build --release --locked --manifest-path $forgeManifest

    $forgeBinary = Join-Path $forgeTarget 'release\terraforge-kernel-valuation.exe'
    if (-not (Test-Path -LiteralPath $forgeBinary)) {
        throw "Forge build did not produce $forgeBinary."
    }

    $artifactPath = Join-Path $transfer 'terraforge-kernel-valuation.exe'
    Copy-Item -LiteralPath $forgeBinary -Destination $artifactPath
    $artifactSha256 = (
        Get-FileHash -Algorithm SHA256 -LiteralPath $artifactPath
    ).Hash.ToLowerInvariant()

    $configuredSovereignTarget = Join-Path `
        $sovereignRepository `
        'packages\terrabuild\kernels\target'
    $sovereignBinary = Join-Path `
        $configuredSovereignTarget `
        'release\terraforge-kernel-valuation.exe'
    if (-not (Test-Path -LiteralPath $sovereignBinary)) {
        throw "Configured sovereign executable is missing: $sovereignBinary. Build the committed sovereign kernels before running this proof."
    }
    $sovereignSha256 = (
        Get-FileHash -Algorithm SHA256 -LiteralPath $sovereignBinary
    ).Hash.ToLowerInvariant()

    $rustc = (rustc --version --verbose) -join "`n"
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to capture rustc version.'
    }
    $rustTargetLine = $rustc -split "`n" |
        Where-Object { $_ -like 'host:*' } |
        Select-Object -First 1
    if ([string]::IsNullOrWhiteSpace($rustTargetLine)) {
        throw 'Unable to capture rustc host target.'
    }
    $rustTarget = $rustTargetLine.Substring('host:'.Length).Trim()
    $cargoVersion = (cargo --version) -join "`n"
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to capture cargo version.'
    }

    $reproducibility = if ($artifactSha256 -eq $priorArtifactSha256) {
        'REPRODUCIBLE_BINARY_BUILD'
    }
    else {
        'BINARY_HASH_CHANGED_REPRODUCIBILITY_NOT_CLAIMED'
    }
    $manifest = [ordered]@{
        schemaVersion = 1
        repository = 'bsvalues/terrafusion-forge'
        commit = $forgeHead
        target = $rustTarget
        transport = 'local-disposable-directory'
        kernelSourceHashes = $sourceHashes
        sourceInputDifference = 'NONE'
        buildCommand = 'cargo build --release --locked --manifest-path kernels/terraforge.kernel.valuation/Cargo.toml'
        toolchain = [ordered]@{
            rustc = $rustc
            cargo = $cargoVersion
        }
        priorToolchain = 'UNKNOWN_NOT_RETAINED_BY_WO-SR-006A'
        toolchainDifference = if ($reproducibility -eq 'REPRODUCIBLE_BINARY_BUILD') {
            'NONE_OBSERVED'
        }
        else {
            'UNKNOWN_BECAUSE_WO-SR-006A_DISPOSABLE_MANIFEST_DID_NOT_RETAIN_TOOLCHAIN'
        }
        executableFilename = 'terraforge-kernel-valuation.exe'
        executableSha256 = $artifactSha256
        priorExecutableSha256 = $priorArtifactSha256
        reproducibilityClassification = $reproducibility
        sovereignConfiguredExecutable = $sovereignBinary
        sovereignComparisonBinarySha256 = $sovereignSha256
    }
    $manifestPath = Join-Path $transfer 'manifest.json'
    $manifest | ConvertTo-Json -Depth 8 |
        Set-Content -LiteralPath $manifestPath -Encoding utf8

    $manifestProof = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
    $verifiedArtifactSha256 = (
        Get-FileHash -Algorithm SHA256 -LiteralPath $artifactPath
    ).Hash.ToLowerInvariant()
    if ($manifestProof.commit -ne $expectedForgeCommit -or
        $manifestProof.target -ne $rustTarget -or
        $manifestProof.executableSha256 -ne $verifiedArtifactSha256 -or
        $manifestProof.sovereignComparisonBinarySha256 -ne $sovereignSha256) {
        throw 'Local runtime rehearsal manifest verification failed.'
    }

    $env:DOTNET_CLI_HOME = $dotnetHome
    $env:NUGET_PACKAGES = $nugetPackages
    $env:NUGET_HTTP_CACHE_PATH = $nugetHttp
    $env:TEMP = $temp
    $env:TMP = $temp
    $env:TERRAFUSION_FORGE_RUNTIME_KERNEL_PATH = $artifactPath
    $env:TERRAFUSION_SOVEREIGN_VALUATION_KERNEL_PATH = $sovereignBinary
    $env:TERRAFUSION_FORGE_RUNTIME_KERNEL_SHA256 = $verifiedArtifactSha256
    $env:TERRAFUSION_SOVEREIGN_VALUATION_KERNEL_SHA256 = $sovereignSha256

    Invoke-Checked -Command dotnet -Arguments @(
        'test',
        (Join-Path $sovereignRepository 'backend\TerraFusion.API.Tests\TerraFusion.API.Tests.csproj'),
        '-c',
        'Release',
        '--artifacts-path',
        $dotnetArtifacts,
        '--filter',
        'FullyQualifiedName~LocalForgeRuntimeSelectionAndRollback_UsesClientHostBoundary'
    )

    $protectedDelta = @(
        git -C $sovereignRepository diff $authorizedSovereignBase --name-only -- `
            'backend/src' `
            ':(glob)backend/**/appsettings*.json'
    )
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to compute protected runtime/configuration delta (exit code $LASTEXITCODE)."
    }
    $untrackedProtected = @(
        git -C $sovereignRepository ls-files --others --exclude-standard -- `
            'backend/src' `
            ':(glob)backend/**/appsettings*.json'
    )
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to compute untracked protected runtime/configuration files (exit code $LASTEXITCODE)."
    }
    $protectedChanges = @($protectedDelta) + @($untrackedProtected)
    if ($protectedChanges.Count -gt 0) {
        throw "Protected runtime/configuration delta detected: $($protectedChanges -join ', ')"
    }

    $sharedForgeHeadAfter =
        Get-GitScalar -Repository $SharedForgeCheckout -Arguments @('rev-parse', 'HEAD')
    $sharedForgeStatusAfter =
        Get-GitScalar -Repository $SharedForgeCheckout -Arguments @('status', '--short')
    if ($sharedForgeHeadAfter -ne $sharedForgeHeadBefore -or
        $sharedForgeStatusAfter -ne $sharedForgeStatusBefore) {
        throw 'Shared Forge checkout changed during the local runtime rehearsal.'
    }

    $result = [ordered]@{
        result = 'PASS'
        terminalCondition =
            'FORGE_LOCAL_RUNTIME_SELECTION_AND_ROLLBACK_REHEARSAL_PROVEN_NO_PERSISTENT_SWITCH'
        forgeCommit = $forgeHead
        forgeArtifactSha256 = $verifiedArtifactSha256
        sovereignArtifactSha256 = $sovereignSha256
        forgeSourceHashes = $sourceHashes
        reproducibilityClassification = $reproducibility
        acceptedClientHostInvocation = 'PASS'
        failClosedHostInvocation = 'PASS'
        rollbackClientHostInvocation = 'PASS'
        selectedBinaryProvenance = 'PASS'
        persistentRuntimeChanged = $false
        sharedForgeCheckoutChanged = $false
        environmentRestored = $true
        disposableDirectoryRemoved = $true
    }
}
finally {
    try {
        & dotnet build-server shutdown | Out-Null
    }
    catch {
        # Cleanup below remains authoritative and fails if compiler processes retain proof files.
    }
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
    if (Test-Path -LiteralPath $proofRoot) {
        throw "Disposable proof directory remains: $proofRoot"
    }
}

if ($null -ne $result) {
    $result | ConvertTo-Json -Depth 8
}
