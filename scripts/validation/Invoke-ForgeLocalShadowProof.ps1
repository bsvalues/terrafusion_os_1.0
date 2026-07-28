[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$ForgeRepository,
    [string]$ExpectedForgeCommit = '24059c3642339f36877cb454ca63683180915b71',
    [string]$ProofRootBase = 'D:\tf-build\sr-006a-local-shadow'
)

$ErrorActionPreference = 'Stop'
$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$proofRoot = Join-Path $ProofRootBase ([DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssfffZ'))
$result = $null

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

try {
    $forgeHead = (git -C $ForgeRepository rev-parse HEAD).Trim()
    if ($LASTEXITCODE -ne 0 -or $forgeHead -ne $ExpectedForgeCommit) {
        throw "Forge worktree must be pinned to $ExpectedForgeCommit; found $forgeHead."
    }
    if (git -C $ForgeRepository status --short) {
        throw "Forge proof worktree is not clean."
    }

    New-Item -ItemType Directory -Force -Path $proofRoot | Out-Null
    $forgeTarget = Join-Path $proofRoot 'forge-target'
    $sovereignTarget = Join-Path $proofRoot 'sovereign-target'
    $transfer = Join-Path $proofRoot 'transfer'
    $dotnetArtifacts = Join-Path $proofRoot 'dotnet-artifacts'
    New-Item -ItemType Directory -Force -Path $transfer | Out-Null

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
    $artifactSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $artifactPath).Hash.ToLowerInvariant()

    $sourceFiles = @(
        'kernels/terraforge.kernel.valuation/Cargo.toml',
        'kernels/terraforge.kernel.valuation/Cargo.lock',
        'kernels/terraforge.kernel.valuation/build.rs',
        'kernels/terraforge.kernel.valuation/src/main.rs'
    )
    $sourceHashes = [ordered]@{}
    foreach ($relativePath in $sourceFiles) {
        $sourceHashes[$relativePath] = (
            Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $ForgeRepository $relativePath)
        ).Hash.ToLowerInvariant()
    }

    $rustc = (rustc --version --verbose) -join "`n"
    if ($LASTEXITCODE -ne 0) { throw 'Unable to capture rustc version.' }
    $cargo = (cargo --version) -join "`n"
    if ($LASTEXITCODE -ne 0) { throw 'Unable to capture cargo version.' }
    $manifest = [ordered]@{
        schemaVersion = 1
        repository = 'bsvalues/terrafusion-forge'
        commit = $forgeHead
        transport = 'local-disposable-directory'
        kernelSourceHashes = $sourceHashes
        buildCommand = 'cargo build --release --locked --manifest-path kernels/terraforge.kernel.valuation/Cargo.toml'
        toolchain = [ordered]@{
            rustc = $rustc
            cargo = $cargo
        }
        executableFilename = 'terraforge-kernel-valuation.exe'
        executableSha256 = $artifactSha256
    }
    $manifestPath = Join-Path $transfer 'manifest.json'
    $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding utf8

    $manifestProof = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
    $verifiedSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $artifactPath).Hash.ToLowerInvariant()
    if ($manifestProof.commit -ne $ExpectedForgeCommit -or
        $manifestProof.executableSha256 -ne $verifiedSha256) {
        throw 'Local artifact provenance or SHA-256 verification failed.'
    }

    $sovereignSource = Join-Path $proofRoot 'sovereign-source'
    Copy-Item `
        -Path (Join-Path $sovereignRepository 'packages\terrabuild\kernels\terraforge.kernel.valuation') `
        -Destination $sovereignSource `
        -Recurse
    $sovereignManifest = Join-Path $sovereignSource 'Cargo.toml'
    $env:CARGO_TARGET_DIR = $sovereignTarget
    Invoke-Checked cargo generate-lockfile --offline --manifest-path $sovereignManifest
    Invoke-Checked cargo test --locked --offline --manifest-path $sovereignManifest
    Invoke-Checked cargo build --release --locked --offline --manifest-path $sovereignManifest
    $sovereignBinary = Join-Path $sovereignTarget 'release\terraforge-kernel-valuation.exe'
    if (-not (Test-Path -LiteralPath $sovereignBinary)) {
        throw "Sovereign build did not produce $sovereignBinary."
    }

    $env:TERRAFUSION_FORGE_SHADOW_KERNEL_PATH = $artifactPath
    $env:TERRAFUSION_SOVEREIGN_VALUATION_KERNEL_PATH = $sovereignBinary
    Invoke-Checked -Command dotnet -Arguments @(
        'test',
        (Join-Path $sovereignRepository 'backend\TerraFusion.API.Tests\TerraFusion.API.Tests.csproj'),
        '-c',
        'Release',
        '--artifacts-path',
        $dotnetArtifacts,
        '--filter',
        'FullyQualifiedName~LocalForgeShadowKernel_MatchesSovereignAcceptedAndFailClosedBehavior'
    )

    $protectedDelta = @(
        git -C $sovereignRepository diff --name-only -- `
            'backend/src' `
            ':(glob)backend/**/appsettings*.json'
    )
    if ($protectedDelta.Count -gt 0) {
        throw "Protected runtime/configuration delta detected: $($protectedDelta -join ', ')"
    }

    $result = [ordered]@{
        result = 'PASS'
        forgeCommit = $forgeHead
        localArtifactSha256 = $verifiedSha256
        forgeSourceHashes = $sourceHashes
        acceptedParity = 'PASS'
        failClosedParity = 'PASS'
        deterministicNormalizedOutput = 'PASS'
        configuredRuntimeChanged = $false
        disposableDirectoryRemoved = $true
    }
}
finally {
    Remove-Item Env:CARGO_TARGET_DIR -ErrorAction SilentlyContinue
    Remove-Item Env:TERRAFUSION_FORGE_SHADOW_KERNEL_PATH -ErrorAction SilentlyContinue
    Remove-Item Env:TERRAFUSION_SOVEREIGN_VALUATION_KERNEL_PATH -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $proofRoot) {
        Remove-Item -LiteralPath $proofRoot -Recurse -Force
    }
}

if ($null -ne $result) {
    $result | ConvertTo-Json -Depth 8
}
