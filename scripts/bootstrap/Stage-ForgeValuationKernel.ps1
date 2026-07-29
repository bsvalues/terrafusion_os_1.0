[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$ForgeRepository,
    [string]$BuildRootBase = 'D:\tf-build\sr-006-forge-canonical-cutover',
    [string]$ArtifactSlot
)

$ErrorActionPreference = 'Stop'
$expectedForgeCommit = '24059c3642339f36877cb454ca63683180915b71'
$expectedRepository = 'bsvalues/terrafusion-forge'
$expectedBlobIds = [ordered]@{
    'kernels/terraforge.kernel.valuation/Cargo.toml' = '8a0d20eca94a182e8578e97aee3cc9674adaf523'
    'kernels/terraforge.kernel.valuation/Cargo.lock' = 'c6b4e7359ab11e5abafe0dab8272904e13bb868f'
    'kernels/terraforge.kernel.valuation/build.rs' = 'b61e54c728d8aa3d020c232b17921ee06fc80fd7'
    'kernels/terraforge.kernel.valuation/src/main.rs' = 'f108a3daab0ace2b67f4dadb766e9634947f625c'
}
$expectedBlobSha256 = [ordered]@{
    'kernels/terraforge.kernel.valuation/Cargo.toml' =
        'c27750c78f2ddf77e5cfca3fc6a020bd2bf5ddecb97fa10e44d2e20d2c5e2358'
    'kernels/terraforge.kernel.valuation/Cargo.lock' =
        '087367b4a37c7a55700b4f9bec1ac073d5c6e8cc3932f1a4220a9abbba0b48bd'
    'kernels/terraforge.kernel.valuation/build.rs' =
        '9220a3d4c6011d835c4fd45ef07cf34a109fe434527926d4e12848ebbae921f6'
    'kernels/terraforge.kernel.valuation/src/main.rs' =
        '3dbad9a2c89c061fccdfc2a0d05d7074a6b397bc05da6ee5e9a23844d209f4ae'
}

$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
if ([string]::IsNullOrWhiteSpace($ArtifactSlot)) {
    $ArtifactSlot = Join-Path $sovereignRepository '.terrafusion\runtime\forge\valuation'
}
$ArtifactSlot = [IO.Path]::GetFullPath($ArtifactSlot)
$expectedArtifactSlot = [IO.Path]::GetFullPath(
    (Join-Path $sovereignRepository '.terrafusion\runtime\forge\valuation')
)
if ($ArtifactSlot -ne $expectedArtifactSlot) {
    throw "Artifact slot must be the ignored OS-managed path: $expectedArtifactSlot"
}

$proofRoot = Join-Path $BuildRootBase ([DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssfffZ'))
$forgeWorktree = Join-Path $proofRoot 'forge-source'
$forgeTarget = Join-Path $proofRoot 'forge-target'
$costTarget = Join-Path $proofRoot 'cost-target'
$dotnetArtifacts = Join-Path $proofRoot 'dotnet-artifacts'
$dotnetHome = Join-Path $proofRoot 'dotnet-home'
$nugetPackages = Join-Path $proofRoot 'nuget'
$nugetHttp = Join-Path $proofRoot 'nuget-http'
$temp = Join-Path $proofRoot 'tmp'
$forgeWorktreeCreated = $false
$cleanupErrors = [Collections.Generic.List[string]]::new()
$result = $null

$preservedEnvironment = @{}
foreach ($name in @(
        'CARGO_TARGET_DIR',
        'DOTNET_CLI_USE_MSBUILD_SERVER',
        'DOTNET_CLI_HOME',
        'NUGET_PACKAGES',
        'NUGET_HTTP_CACHE_PATH',
        'TEMP',
        'TMP',
        'TERRAFUSION_FORGE_CANONICAL_KERNEL_PATH',
        'TERRAFUSION_FORGE_CANONICAL_MANIFEST_PATH',
        'TERRAFUSION_SOVEREIGN_COST_KERNEL_PATH'
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

function Get-GitBlobSha256 {
    param(
        [Parameter(Mandatory)]
        [string]$Repository,
        [Parameter(Mandatory)]
        [string]$RevisionPath
    )

    $startInfo = [Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = 'git'
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $startInfo.ArgumentList.Add('-C')
    $startInfo.ArgumentList.Add($Repository)
    $startInfo.ArgumentList.Add('cat-file')
    $startInfo.ArgumentList.Add('blob')
    $startInfo.ArgumentList.Add($RevisionPath)
    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $startInfo
    if (-not $process.Start()) {
        throw "Unable to start git cat-file for $RevisionPath."
    }
    $sha256 = [Security.Cryptography.SHA256]::Create()
    try {
        $hash = $sha256.ComputeHash($process.StandardOutput.BaseStream)
        $stderr = $process.StandardError.ReadToEnd()
        $process.WaitForExit()
        if ($process.ExitCode -ne 0) {
            throw "git cat-file failed for $RevisionPath`: $stderr"
        }
        return [Convert]::ToHexString($hash).ToLowerInvariant()
    }
    finally {
        $sha256.Dispose()
        $process.Dispose()
    }
}

try {
    $sovereignStatus = Get-GitScalar -Repository $sovereignRepository -Arguments @(
        'status', '--short'
    )
    if ($sovereignStatus) {
        throw "Sovereign worktree must be clean before staging: $sovereignStatus"
    }
    $ignored = (& git -C $sovereignRepository check-ignore (
        Join-Path $ArtifactSlot 'manifest.json'
    ))
    if ($LASTEXITCODE -ne 0) {
        throw "Artifact slot is not ignored by Git: $ArtifactSlot"
    }

    $origin = Get-GitScalar -Repository $ForgeRepository -Arguments @('remote', 'get-url', 'origin')
    if ($origin -notmatch '(^|[:/])bsvalues/terrafusion-forge(\.git)?$') {
        throw "Unexpected Forge origin: $origin"
    }
    & git -C $ForgeRepository cat-file -e "$expectedForgeCommit`^{commit}"
    if ($LASTEXITCODE -ne 0) {
        throw "Exact Forge commit is unavailable: $expectedForgeCommit"
    }

    New-Item -ItemType Directory -Force -Path @(
        $proofRoot,
        $forgeTarget,
        $costTarget,
        $dotnetArtifacts,
        $dotnetHome,
        $nugetPackages,
        $nugetHttp,
        $temp,
        $ArtifactSlot
    ) | Out-Null

    Invoke-Checked -Command git -Arguments @(
        '-C', $ForgeRepository, 'worktree', 'add', '--detach',
        $forgeWorktree, $expectedForgeCommit
    )
    $forgeWorktreeCreated = $true

    $forgeHead = Get-GitScalar -Repository $forgeWorktree -Arguments @('rev-parse', 'HEAD')
    $forgeStatus = Get-GitScalar -Repository $forgeWorktree -Arguments @('status', '--short')
    if ($forgeHead -ne $expectedForgeCommit -or $forgeStatus) {
        throw 'Detached Forge build worktree is not exact and clean.'
    }

    $sourceHashes = [ordered]@{}
    foreach ($relativePath in $expectedBlobIds.Keys) {
        $blobId = Get-GitScalar -Repository $forgeWorktree -Arguments @(
            'rev-parse', "HEAD:$relativePath"
        )
        if ($blobId -ne $expectedBlobIds[$relativePath]) {
            throw "Forge blob identity drift for $relativePath."
        }
        $blobSha256 = Get-GitBlobSha256 `
            -Repository $forgeWorktree `
            -RevisionPath "HEAD:$relativePath"
        if ($blobSha256 -ne $expectedBlobSha256[$relativePath]) {
            throw "Forge canonical blob SHA-256 drift for $relativePath."
        }
        $sourceHashes[$relativePath] = $blobSha256
    }

    $forgeManifest = Join-Path $forgeWorktree 'kernels\terraforge.kernel.valuation\Cargo.toml'
    $env:CARGO_TARGET_DIR = $forgeTarget
    Invoke-Checked cargo test --offline --locked --manifest-path $forgeManifest
    Invoke-Checked cargo build --release --offline --locked --manifest-path $forgeManifest
    $builtExecutable = Join-Path $forgeTarget 'release\terraforge-kernel-valuation.exe'
    if (-not (Test-Path -LiteralPath $builtExecutable)) {
        throw "Forge build did not produce $builtExecutable."
    }

    $executablePath = Join-Path $ArtifactSlot 'terraforge-kernel-valuation.exe'
    Copy-Item -LiteralPath $builtExecutable -Destination $executablePath -Force
    $executableSha256 = (
        Get-FileHash -Algorithm SHA256 -LiteralPath $executablePath
    ).Hash.ToLowerInvariant()

    $rustc = (rustc --version --verbose) -join "`n"
    if ($LASTEXITCODE -ne 0) { throw 'Unable to capture rustc version.' }
    $cargoVersion = (cargo --version) -join "`n"
    if ($LASTEXITCODE -ne 0) { throw 'Unable to capture cargo version.' }
    $targetLine = $rustc -split "`n" |
        Where-Object { $_ -like 'host:*' } |
        Select-Object -First 1
    if ([string]::IsNullOrWhiteSpace($targetLine)) {
        throw 'Unable to capture the Rust host target.'
    }

    $manifestPath = Join-Path $ArtifactSlot 'manifest.json'
    [ordered]@{
        schemaVersion = 1
        repository = $expectedRepository
        commit = $expectedForgeCommit
        transport = 'local-os-managed-artifact-slot'
        target = $targetLine.Substring('host:'.Length).Trim()
        sourceBlobSha256 = $sourceHashes
        buildCommand =
            'cargo build --release --offline --locked --manifest-path kernels/terraforge.kernel.valuation/Cargo.toml'
        toolchain = [ordered]@{
            rustc = $rustc
            cargo = $cargoVersion
        }
        executableFilename = 'terraforge-kernel-valuation.exe'
        executableSha256 = $executableSha256
    } | ConvertTo-Json -Depth 8 |
        Set-Content -LiteralPath $manifestPath -Encoding utf8

    $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
    if ($manifest.repository -ne $expectedRepository -or
        $manifest.commit -ne $expectedForgeCommit -or
        $manifest.transport -ne 'local-os-managed-artifact-slot' -or
        $manifest.executableFilename -ne (Split-Path -Leaf $executablePath) -or
        $manifest.executableSha256 -ne (
            Get-FileHash -Algorithm SHA256 -LiteralPath $executablePath
        ).Hash.ToLowerInvariant()) {
        throw 'Staged Forge manifest verification failed.'
    }

    $env:CARGO_TARGET_DIR = $costTarget
    Invoke-Checked cargo build --release --offline --locked --manifest-path (
        Join-Path $sovereignRepository 'packages\terrabuild\kernels\Cargo.toml'
    )
    $costExecutable = Join-Path $costTarget 'release\terraforge-kernel-cost.exe'
    if (-not (Test-Path -LiteralPath $costExecutable)) {
        throw "Sovereign cost build did not produce $costExecutable."
    }

    $nugetOutput = (& dotnet nuget locals global-packages --list) -join "`n"
    if ($LASTEXITCODE -ne 0 -or $nugetOutput -notmatch '^global-packages:\s*(?<path>.+)$') {
        throw 'Unable to resolve the local NuGet global-packages source.'
    }
    $nugetOfflineSource = $Matches.path.Trim()
    if (-not (Test-Path -LiteralPath $nugetOfflineSource)) {
        throw "Local NuGet source is unavailable: $nugetOfflineSource"
    }

    $env:DOTNET_CLI_HOME = $dotnetHome
    $env:DOTNET_CLI_USE_MSBUILD_SERVER = '0'
    $env:NUGET_PACKAGES = $nugetPackages
    $env:NUGET_HTTP_CACHE_PATH = $nugetHttp
    $env:TEMP = $temp
    $env:TMP = $temp
    $env:TERRAFUSION_FORGE_CANONICAL_KERNEL_PATH = $executablePath
    $env:TERRAFUSION_FORGE_CANONICAL_MANIFEST_PATH = $manifestPath
    $env:TERRAFUSION_SOVEREIGN_COST_KERNEL_PATH = $costExecutable

    $testProject = Join-Path `
        $sovereignRepository `
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
            'FullyQualifiedName~RealKernels_ComputeExpectedValue|' +
            'FullyQualifiedName~ValuationKernel_'
        ),
        '-p:UseSharedCompilation=false',
        '-nodeReuse:false'
    )

    $result = [ordered]@{
        result = 'PASS'
        terminalCondition = 'FORGE_CANONICAL_LOCAL_ARTIFACT_STAGED_AND_VERIFIED'
        forgeCommit = $expectedForgeCommit
        sourceBlobSha256 = $sourceHashes
        executableSha256 = $executableSha256
        artifactSlot = '.terrafusion/runtime/forge/valuation'
        acceptedBehavior = 'PASS'
        missingManifestFailClosed = 'PASS'
        mismatchedArtifactFailClosed = 'PASS'
        mismatchedSourceHashFailClosed = 'PASS'
        costKernelPreserved = 'PASS'
        networkArtifactTransferUsed = $false
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

    if ($forgeWorktreeCreated) {
        try {
            Invoke-Checked -Command git -Arguments @(
                '-C', $ForgeRepository, 'worktree', 'remove', $forgeWorktree
            )
            Invoke-Checked -Command git -Arguments @(
                '-C', $ForgeRepository, 'worktree', 'prune'
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
    throw "Staging cleanup failed: $($cleanupErrors -join '; ')"
}
if ($null -ne $result) {
    $result | ConvertTo-Json -Depth 8
}
