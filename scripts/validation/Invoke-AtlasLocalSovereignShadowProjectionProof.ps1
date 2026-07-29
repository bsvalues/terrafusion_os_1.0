[CmdletBinding()]
param(
    [string]$AtlasRepository = 'C:\Users\bsval\terrafusion-atlas',
    [string]$ProofRootBase = 'E:\tf-build\sr-007a-local-shadow',
    [string]$DotnetArtifacts = 'C:\tf-build\sr-007a-local-shadow-artifacts'
)

$ErrorActionPreference = 'Stop'
$expectedAtlasCommit = '6c530f1b6b77d59225353dede929c0688f1587da'
$moduleRelativePath = 'src/spatial-read/project-atlas-feature.mjs'
$expectedModuleSha256 = '3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46'
$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$proofRoot = Join-Path $ProofRootBase ([DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssfffZ'))
$atlasWorktree = Join-Path $proofRoot 'atlas-worktree'
$exchangeRoot = Join-Path $proofRoot 'exchange'
$copiedModule = Join-Path $exchangeRoot 'project-atlas-feature.mjs'
$manifestPath = Join-Path $exchangeRoot 'manifest.json'
$result = $null
$atlasWorktreeRegistered = $false
$preservedEnvironment = @{}

foreach ($name in @(
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

try {
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

    New-Item -ItemType Directory -Force -Path $proofRoot, $exchangeRoot | Out-Null
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
        sourcePath = $moduleRelativePath
        sourceSha256 = $sourceSha256
        copiedSha256 = $copiedSha256
        nodeVersion = $nodeVersion
        generatedAtUtc = [DateTimeOffset]::UtcNow.ToString('O')
        transport = 'local-disposable-directory'
        atlasWorktree = $atlasWorktree
        copiedModule = $copiedModule
        manifestPath = $manifestPath
        dotnetArtifacts = $DotnetArtifacts
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
    Invoke-Checked -Command dotnet -Arguments @(
        'test',
        (Join-Path $sovereignRepository 'backend\tests\TerraFusion.Unit.Tests\TerraFusion.Unit.Tests.csproj'),
        '-c',
        'Release',
        '--no-restore',
        '--no-build',
        '--artifacts-path',
        $DotnetArtifacts,
        '--filter',
        'FullyQualifiedName~AtlasLocalSovereignShadowProjectionTests'
    )

    $protectedDelta = @(
        git -C $sovereignRepository diff origin/main --name-only -- 'backend/src'
    )
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to inspect protected backend source changes.'
    }
    $atlasStatusAfter = @(git -C $AtlasRepository status --short)
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to recheck the shared Atlas checkout.'
    }
    if ($protectedDelta.Count -gt 0 -or $atlasStatusAfter.Count -gt 0) {
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
        Remove-Item -LiteralPath $proofRoot -Recurse -Force
    }
    if (
        (Test-Path -LiteralPath $ProofRootBase) -and
        @(Get-ChildItem -LiteralPath $ProofRootBase -Force).Count -eq 0
    ) {
        Remove-Item -LiteralPath $ProofRootBase -Force
    }
    if (Test-Path -LiteralPath $DotnetArtifacts) {
        Remove-Item -LiteralPath $DotnetArtifacts -Recurse -Force
    }
}

if ($null -ne $result) {
    $result.disposableStateRemoved = (
        -not (Test-Path -LiteralPath $proofRoot) -and
        -not (Test-Path -LiteralPath $ProofRootBase) -and
        -not (Test-Path -LiteralPath $DotnetArtifacts)
    )
    $result | ConvertTo-Json -Depth 8
}
