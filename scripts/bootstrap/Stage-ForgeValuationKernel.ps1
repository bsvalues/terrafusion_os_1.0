[CmdletBinding(DefaultParameterSetName = 'Valuation')]
param(
    [Parameter(Mandatory, ParameterSetName = 'Valuation')]
    [string]$ForgeRepository,
    [Parameter(Mandatory, ParameterSetName = 'CostIncome')]
    [switch]$CostIncome,
    [Parameter(Mandatory, ParameterSetName = 'CostIncome')]
    [string]$ArtifactArchive,
    [Parameter(Mandatory, ParameterSetName = 'CostIncome')]
    [string]$ProducerReceipt,
    [string]$BuildRootBase = 'D:\tf-build\sr-006-forge-canonical-cutover',
    [string]$NuGetPackagesPath,
    [string]$ArtifactSlot
)

$ErrorActionPreference = 'Stop'

# Native intake uses the existing merged-main Actions artifact, not a local build,
# Linux OCI extraction, or a caller-supplied admission policy. Historical code below
# this explicit branch retains its original source-build/default valuation behavior.
function Get-ForgeCostIncomePins([string]$OptionsPath) {
    $text = [IO.File]::ReadAllText($OptionsPath)
    $pins = @{}
    foreach ($name in @('CanonicalSourceCommit','ProducerCommit','ProducerManifestSha256','ExecutableSha256',
        'SpecificationSha256','SourceClosureSha256','DependencyClosureSha256','Target','WorkflowRunId',
        'WorkflowRunAttempt','ArtifactId','ArchiveSha256','ReceiptSha256')) {
        $matches = [regex]::Matches($text, ('public const string ForgeCostIncome' + $name + ' = "([^"]*)";'))
        if ($matches.Count -ne 1) { throw 'Cost/Income immutable admission declaration is missing or ambiguous.' }
        $value = $matches[0].Groups[1].Value
        $pattern = if ($name -in @('CanonicalSourceCommit','ProducerCommit')) { '^[a-f0-9]{40}$' }
            elseif ($name -eq 'Target') { '^x86_64-pc-windows-msvc$' }
            elseif ($name -in @('WorkflowRunId','WorkflowRunAttempt','ArtifactId')) { '^[1-9][0-9]{0,19}$' }
            else { '^[a-f0-9]{64}$' }
        if ($value -cnotmatch $pattern) { throw "Cost/Income artifact is not independently admitted: $name." }
        $pins[$name] = $value
    }
    if ($pins.CanonicalSourceCommit -cne $pins.ProducerCommit -or
        $pins.CanonicalSourceCommit -ceq '24059c3642339f36877cb454ca63683180915b71') { throw 'Invalid new capability source identity.' }
    return $pins
}

function Assert-ForgeCostIncomeReceipt($Receipt, [hashtable]$Pins) {
    $expected = @{
        schemaVersion = 1; transport = 'github-actions-windows-artifact@1'
        repository = 'bsvalues/terrafusion-forge'; workflowPath = '.github/workflows/suite-ci.yml'
        event = 'push'; branch = 'main'; conclusion = 'success'
        runId = $Pins.WorkflowRunId; runAttempt = $Pins.WorkflowRunAttempt; artifactId = $Pins.ArtifactId
        artifactName = ('terraforge-valuation-kernel-windows-x64-' + $Pins.CanonicalSourceCommit)
        protectedCommit = $Pins.CanonicalSourceCommit; archiveSha256 = $Pins.ArchiveSha256
        manifestSha256 = $Pins.ProducerManifestSha256; executableSha256 = $Pins.ExecutableSha256
    }
    foreach ($key in $expected.Keys) {
        if ($null -eq $Receipt[$key] -or $Receipt[$key] -cne $expected[$key]) { throw "Native artifact receipt mismatch: $key." }
        if ($key -ne 'schemaVersion' -and $Receipt[$key] -isnot [string]) { throw "Native artifact receipt type mismatch: $key." }
    }
}

function Assert-ForgeCostIncomePath([string]$Path) {
    $current = [IO.Path]::GetFullPath($Path)
    while ($current) {
        if (Test-Path -LiteralPath $current) {
            if (((Get-Item -Force -LiteralPath $current).Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
                throw 'Native artifact paths must not traverse reparse points.'
            }
        }
        $current = [IO.Path]::GetDirectoryName($current)
    }
}

function Expand-ForgeCostIncomeArchive([string]$ArchivePath, [string]$Destination, [hashtable]$Pins) {
    Assert-ForgeCostIncomePath $ArchivePath
    Assert-ForgeCostIncomePath $Destination
    if (Test-Path -LiteralPath $Destination) { throw 'Candidate destination must be new.' }
    $inputStream = [IO.File]::Open($ArchivePath, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::Read)
    try {
        if ($inputStream.Length -le 0 -or $inputStream.Length -gt 64MB) { throw 'Archive exceeds native intake bounds.' }
        $digest = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($inputStream)).ToLowerInvariant()
        if ($digest -cne $Pins.ArchiveSha256) { throw 'Downloaded archive identity mismatch.' }
        $inputStream.Position = 0
        $zip = [IO.Compression.ZipArchive]::new($inputStream, [IO.Compression.ZipArchiveMode]::Read, $true)
        try {
            if ($zip.Entries.Count -ne 2) { throw 'Archive must contain exactly the manifest and executable.' }
            $seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
            foreach ($entry in $zip.Entries) {
                if ($entry.FullName -cnotin @('manifest.json','terraforge-kernel-valuation.exe') -or
                    -not $seen.Add($entry.FullName)) { throw 'Unexpected, duplicate, or unsafe ZIP path.' }
                $unixType = ($entry.ExternalAttributes -shr 16) -band 0xF000
                if (($unixType -ne 0 -and $unixType -ne 0x8000) -or
                    ($entry.ExternalAttributes -band 0x410) -ne 0) { throw 'ZIP links or directories are forbidden.' }
                $limit = if ($entry.FullName -ceq 'manifest.json') { 1MB } else { 32MB }
                if ($entry.Length -le 0 -or $entry.Length -gt $limit) { throw 'ZIP entry exceeds native intake bounds.' }
            }
            New-Item -ItemType Directory -Path $Destination | Out-Null
            foreach ($entry in $zip.Entries) {
                $path = Join-Path $Destination $entry.FullName
                $source = $entry.Open()
                $output = [IO.File]::Open($path, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
                try {
                    $buffer = [byte[]]::new(65536); $count = 0L
                    while (($read = $source.Read($buffer, 0, $buffer.Length)) -gt 0) {
                        $count += $read
                        if ($count -gt $entry.Length) { throw 'ZIP expanded length mismatch.' }
                        $output.Write($buffer, 0, $read)
                    }
                    if ($count -ne $entry.Length) { throw 'ZIP truncated entry.' }
                } finally { $output.Dispose(); $source.Dispose() }
                $expected = if ($entry.FullName -ceq 'manifest.json') { $Pins.ProducerManifestSha256 } else { $Pins.ExecutableSha256 }
                if ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -cne $expected) {
                    throw 'Extracted artifact identity mismatch.'
                }
            }
        } finally { $zip.Dispose() }
    } finally { $inputStream.Dispose() }
}

function Get-ForgeCostIncomeLinesHash([string[]]$Lines) {
    [Array]::Sort($Lines, [StringComparer]::Ordinal)
    return [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData(
        [Text.Encoding]::UTF8.GetBytes(($Lines -join "`n") + "`n"))).ToLowerInvariant()
}

function Assert-ForgeCostIncomeManifest($Manifest, [hashtable]$Pins) {
    $specPath = 'operations/work-orders/EO-TF-FORGE-COST-INCOME-001.md'
    $expected = @{ schemaVersion = 1; repository = 'bsvalues/terrafusion-forge'
        producerCommit = $Pins.ProducerCommit; canonicalSourceCommit = $Pins.CanonicalSourceCommit
        commit = $Pins.CanonicalSourceCommit; workflow = 'suite-ci'; workflowRunId = $Pins.WorkflowRunId
        artifactName = ('terraforge-valuation-kernel-windows-x64-' + $Pins.CanonicalSourceCommit)
        target = 'x86_64-pc-windows-msvc'; executableFilename = 'terraforge-kernel-valuation.exe'; executableSha256 = $Pins.ExecutableSha256 }
    foreach ($key in $expected.Keys) {
        if ($null -eq $Manifest[$key] -or $Manifest[$key] -cne $expected[$key]) { throw "Native manifest mismatch: $key." }
    }
    if ($Manifest.capabilityExchanges.Count -ne 2 -or $Manifest.capabilityExchanges[0] -cne 'forge.cost@1.0.0' -or
        $Manifest.capabilityExchanges[1] -cne 'forge.income@1.0.0') { throw 'Capability exchange mismatch.' }
    $spec = $Manifest.specification
    if ($spec.path -cne $specPath -or $spec.sha256 -cne $Pins.SpecificationSha256 -or
        $spec.sourceCommit -cne $Pins.CanonicalSourceCommit -or $spec.authorityRepository -cne 'bsvalues/terrafusion_os_1.0' -or
        $spec.workOrder -cne 'WO-EO-TF-FORGE-COST-INCOME-001') { throw 'Specification identity mismatch.' }
    $paths = @('Cargo.toml','Cargo.lock','build.rs','src/main.rs','src/approaches.rs','tests/approaches.rs') |
        ForEach-Object { 'kernels/terraforge.kernel.valuation/' + $_ }
    $paths += $specPath
    $files = $Manifest.canonicalSourceIntegrity.files
    if ($files.Count -ne 7 -or $Manifest.kernelSourceHashes.Count -ne 7) { throw 'Incomplete source closure.' }
    $sourceLines = foreach ($path in $paths) {
        if ($files[$path] -cnotmatch '^[a-f0-9]{64}$' -or $Manifest.kernelSourceHashes[$path] -cne $files[$path]) {
            throw 'Missing or mismatched source module hash.'
        }
        $path + ':' + $files[$path]
    }
    if ($files[$specPath] -cne $Pins.SpecificationSha256 -or
        (Get-ForgeCostIncomeLinesHash $sourceLines) -cne $Pins.SourceClosureSha256) { throw 'Source closure identity mismatch.' }
    if ($Manifest.dependencyClosure.Count -lt 1 -or $Manifest.dependencyClosure.Count -gt 512) { throw 'Incomplete dependency closure.' }
    $seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    $dependencyLines = foreach ($dependency in $Manifest.dependencyClosure) {
        if ($dependency.name -cnotmatch '^[A-Za-z0-9_-]{1,128}$' -or $dependency.version -cnotmatch '^[A-Za-z0-9.+-]{1,128}$' -or
            $dependency.source -cne 'registry+https://github.com/rust-lang/crates.io-index' -or $dependency.checksum -cnotmatch '^[a-f0-9]{64}$' -or
            -not $seen.Add($dependency.name + '@' + $dependency.version)) { throw 'Invalid or duplicate locked dependency.' }
        $dependency.name + '@' + $dependency.version + '|' + $dependency.source + '|' + $dependency.checksum
    }
    if ((Get-ForgeCostIncomeLinesHash @($dependencyLines)) -cne $Pins.DependencyClosureSha256) { throw 'Dependency closure identity mismatch.' }
    # The exact manifest hash, admitted independently with the producer receipt,
    # also binds the unchanged frozen contracts. The process host checks those fields.
}

function Assert-ForgeCostIncomePair([string]$Directory, [hashtable]$Pins) {
    Assert-ForgeCostIncomePath $Directory
    $expected = @{ 'manifest.json' = $Pins.ProducerManifestSha256
        'terraforge-kernel-valuation.exe' = $Pins.ExecutableSha256; 'receipt.json' = $Pins.ReceiptSha256 }
    $files = @(Get-ChildItem -LiteralPath $Directory -Force)
    if ($files.Count -ne 3) { throw 'Native artifact slot must contain exactly the pair and receipt.' }
    foreach ($file in $files) {
        if ($file.PSIsContainer -or ($file.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0 -or
            $file.Name -cnotin @('manifest.json','terraforge-kernel-valuation.exe','receipt.json') -or
            (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant() -cne $expected[$file.Name]) {
            throw 'Native artifact pair or receipt changed.'
        }
    }
}

function Publish-ForgeCostIncomeCandidate([string]$Repository, [string]$ProofRoot, [hashtable]$Pins) {
    $root = [IO.Path]::GetFullPath((Join-Path $Repository '.terrafusion/runtime/forge'))
    $slot = Join-Path $root 'cost-income'
    $stagingRoot = Join-Path $root 'cost-income-staging'
    $proof = [IO.Path]::GetFullPath($ProofRoot)
    if ([IO.Path]::GetDirectoryName($proof) -cne $stagingRoot -or
        [IO.Path]::GetFileName($proof) -cnotmatch '^run-[a-f0-9]{32}$') { throw 'Invalid isolated staging root.' }
    Assert-ForgeCostIncomePath $proof
    Assert-ForgeCostIncomePath $slot
    $candidate = Join-Path $proof 'candidate'
    $previous = Join-Path $proof 'previous'
    $failed = Join-Path $proof 'failed'
    if ((Test-Path -LiteralPath $previous) -or (Test-Path -LiteralPath $failed)) { throw 'Staging run was already used.' }
    Assert-ForgeCostIncomePair $candidate $Pins
    $backedUp = $false
    if (Test-Path -LiteralPath $slot) {
        # No recursive move of a foreign/link-bearing tree. Preserve an older complete
        # pair, even if it predates this admission, so failure can restore those bytes.
        $oldFiles = @(Get-ChildItem -LiteralPath $slot -Force)
        if ($oldFiles.Count -ne 3 -or @($oldFiles | Where-Object {
            $_.PSIsContainer -or ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0 -or
            $_.Name -cnotin @('manifest.json','terraforge-kernel-valuation.exe','receipt.json')
        }).Count) { throw 'Existing slot is not an isolated native artifact triple.' }
        Move-Item -LiteralPath $slot -Destination $previous
        $backedUp = $true
    }
    try {
        Copy-Item -LiteralPath $candidate -Destination $slot -Recurse
        Assert-ForgeCostIncomePair $slot $Pins
    } catch {
        # All targets are exact children of the validated managed paths. Retain failed
        # and previous evidence rather than deleting any material artifact bytes.
        if (Test-Path -LiteralPath $slot) { Move-Item -LiteralPath $slot -Destination $failed }
        if ($backedUp) { Move-Item -LiteralPath $previous -Destination $slot }
        throw
    }
}

if ($CostIncome) {
    if (-not $IsWindows) { throw 'This mode admits native Windows Actions artifacts only.' }
    $repository = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
    $pins = Get-ForgeCostIncomePins (Join-Path $repository 'backend/src/TerraFusion.API/Configuration/RustKernelsOptions.cs')
    $status = @(& git -C $repository status --porcelain --untracked-files=all)
    if ($LASTEXITCODE -ne 0 -or $status.Count) { throw 'Sovereign worktree must be clean before native intake.' }
    $slot = [IO.Path]::GetFullPath((Join-Path $repository '.terrafusion/runtime/forge/cost-income'))
    if ($ArtifactSlot -and [IO.Path]::GetFullPath($ArtifactSlot) -cne $slot) { throw 'Cost/Income artifact slot cannot be redirected.' }
    $stagingRoot = [IO.Path]::GetFullPath((Join-Path $repository '.terrafusion/runtime/forge/cost-income-staging'))
    foreach ($path in @($slot, $stagingRoot)) {
        Assert-ForgeCostIncomePath $path
        & git -C $repository check-ignore --quiet -- (Join-Path $path 'receipt.json')
        if ($LASTEXITCODE -ne 0) { throw 'Native artifact and staging slots must already be ignored.' }
    }
    Assert-ForgeCostIncomePath $ProducerReceipt
    $receiptStream = [IO.File]::Open($ProducerReceipt, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::Read)
    try {
        if ($receiptStream.Length -le 0 -or $receiptStream.Length -gt 64KB) { throw 'Producer receipt exceeds bounds.' }
        $receiptBytes = [byte[]]::new($receiptStream.Length)
        $receiptStream.ReadExactly($receiptBytes, 0, $receiptBytes.Length)
    } finally { $receiptStream.Dispose() }
    if ([Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($receiptBytes)).ToLowerInvariant() -cne $pins.ReceiptSha256) {
        throw 'Receipt bytes do not match independently admitted evidence.'
    }
    $receipt = [Text.Encoding]::UTF8.GetString($receiptBytes).TrimStart([char]0xFEFF) | ConvertFrom-Json -AsHashtable
    Assert-ForgeCostIncomeReceipt $receipt $pins
    New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null
    $lock = [IO.File]::Open((Join-Path $stagingRoot 'intake.lock'), [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
    try {
        $proof = Join-Path $stagingRoot ('run-' + [Guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $proof | Out-Null
        $candidate = Join-Path $proof 'candidate'
        Expand-ForgeCostIncomeArchive $ArtifactArchive $candidate $pins
        [IO.File]::WriteAllBytes((Join-Path $candidate 'receipt.json'), $receiptBytes)
        $manifest = Get-Content -LiteralPath (Join-Path $candidate 'manifest.json') -Raw | ConvertFrom-Json -AsHashtable
        Assert-ForgeCostIncomeManifest $manifest $pins
        Publish-ForgeCostIncomeCandidate $repository $proof $pins
        [ordered]@{ result = 'PASS'; terminalCondition = 'FORGE_COST_INCOME_NATIVE_ARTIFACT_STAGED'
            protectedCommit = $pins.CanonicalSourceCommit; runId = $pins.WorkflowRunId; runAttempt = $pins.WorkflowRunAttempt
            artifactId = $pins.ArtifactId; archiveSha256 = $pins.ArchiveSha256; manifestSha256 = $pins.ProducerManifestSha256
            executableSha256 = $pins.ExecutableSha256; receiptSha256 = $pins.ReceiptSha256
            artifactSlot = '.terrafusion/runtime/forge/cost-income'; retainedEvidence = $proof
            sourceBuildUsed = $false; linuxDeploymentClaimed = $false; runtimeAcceptance = 'NOT_RUN'
        } | ConvertTo-Json -Depth 5
    } finally { $lock.Dispose() }
    return
}

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
$nugetPackages = if ([string]::IsNullOrWhiteSpace($NuGetPackagesPath)) {
    Join-Path $proofRoot 'nuget'
}
else {
    [IO.Path]::GetFullPath($NuGetPackagesPath)
}
$nugetHttp = Join-Path $proofRoot 'nuget-http'
$temp = Join-Path $proofRoot 'tmp'
$candidateArtifactSlot = Join-Path $proofRoot 'candidate-artifact'
$artifactParent = Split-Path -Parent $ArtifactSlot
$backupSlot = Join-Path $proofRoot 'previous-artifact'
$artifactBackedUp = $false
$artifactPublished = $false
$cleanupErrors = [Collections.Generic.List[string]]::new()
$stagingError = $null
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
        'GIT_CONFIG_COUNT',
        'GIT_CONFIG_KEY_0',
        'GIT_CONFIG_VALUE_0',
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
        $stderrTask = $process.StandardError.ReadToEndAsync()
        $hash = $sha256.ComputeHash($process.StandardOutput.BaseStream)
        $process.WaitForExit()
        $stderr = $stderrTask.GetAwaiter().GetResult()
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
    $sovereignStatus = Get-GitScalar -Repository $sovereignRepository -Arguments @(
        'status', '--short'
    )
    if ($sovereignStatus) {
        throw "Sovereign worktree must be clean before staging: $sovereignStatus"
    }
    & git -C $sovereignRepository check-ignore (
        Join-Path $ArtifactSlot 'manifest.json'
    ) | Out-Null
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
        $candidateArtifactSlot
    ) | Out-Null

    Invoke-Checked -Command git -Arguments @(
        'clone', '--shared', '--no-checkout', $ForgeRepository, $forgeWorktree
    )
    $env:GIT_CONFIG_COUNT = '1'
    $env:GIT_CONFIG_KEY_0 = 'safe.directory'
    $env:GIT_CONFIG_VALUE_0 = $forgeWorktree
    Invoke-Checked -Command git -Arguments @(
        '-C', $forgeWorktree, 'checkout', '--detach', '--quiet', $expectedForgeCommit
    )

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
    Invoke-Checked -Command cargo -Arguments @(
        'test', '--offline', '--locked', '--manifest-path', $forgeManifest
    )
    Invoke-Checked -Command cargo -Arguments @(
        'build', '--release', '--offline', '--locked', '--manifest-path', $forgeManifest
    )
    $builtExecutable = Join-Path $forgeTarget 'release\terraforge-kernel-valuation.exe'
    if (-not (Test-Path -LiteralPath $builtExecutable)) {
        throw "Forge build did not produce $builtExecutable."
    }

    $executablePath = Join-Path $candidateArtifactSlot 'terraforge-kernel-valuation.exe'
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

    $manifestPath = Join-Path $candidateArtifactSlot 'manifest.json'
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
    Invoke-Checked -Command cargo -Arguments @(
        'build',
        '--release',
        '--offline',
        '--locked',
        '--manifest-path',
        (Join-Path $sovereignRepository 'packages\terrabuild\kernels\Cargo.toml')
    )
    $costExecutable = Join-Path $costTarget 'release\terraforge-kernel-cost.exe'
    if (-not (Test-Path -LiteralPath $costExecutable)) {
        throw "Sovereign cost build did not produce $costExecutable."
    }

    $nugetOfflineSource = Get-LocalNuGetSource

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
        'build',
        $testProject,
        '-c',
        'Release',
        '--no-restore',
        '--artifacts-path',
        $dotnetArtifacts,
        '/warnaserror',
        '-p:CopyLocalLockFileAssemblies=false',
        '-p:UseSharedCompilation=false',
        '-nodeReuse:false'
    )
    $testOutput = Join-Path `
        $dotnetArtifacts `
        'bin\TerraFusion.API.Tests\release'
    [ordered]@{
        runtimeOptions = [ordered]@{
            additionalProbingPaths = @($nugetPackages)
        }
    } | ConvertTo-Json -Depth 4 |
        Set-Content -LiteralPath (
            Join-Path $testOutput 'TerraFusion.API.Tests.runtimeconfig.dev.json'
        ) -Encoding utf8
    Invoke-Checked -Command dotnet -Arguments @(
        'test',
        $testProject,
        '-c',
        'Release',
        '--no-build',
        '--no-restore',
        '--artifacts-path',
        $dotnetArtifacts,
        '--filter',
        (
            'FullyQualifiedName~RealKernels_ComputeExpectedValue|' +
            'FullyQualifiedName~RealKernels_SameInputProducesSameOutput|' +
            'FullyQualifiedName~ValuationKernel_'
        ),
        '-p:CopyLocalLockFileAssemblies=false',
        '-p:UseSharedCompilation=false',
        '-nodeReuse:false'
    )

    New-Item -ItemType Directory -Force -Path $artifactParent | Out-Null
    $liveExecutable = Join-Path $ArtifactSlot 'terraforge-kernel-valuation.exe'
    $liveManifest = Join-Path $ArtifactSlot 'manifest.json'
    $pairAlreadyCurrent =
        (Test-Path -LiteralPath $liveExecutable) -and
        (Test-Path -LiteralPath $liveManifest) -and
        ((Get-FileHash -Algorithm SHA256 -LiteralPath $liveExecutable).Hash -eq
            (Get-FileHash -Algorithm SHA256 -LiteralPath $executablePath).Hash) -and
        ((Get-FileHash -Algorithm SHA256 -LiteralPath $liveManifest).Hash -eq
            (Get-FileHash -Algorithm SHA256 -LiteralPath $manifestPath).Hash)
    if (-not $pairAlreadyCurrent) {
        if (Test-Path -LiteralPath $ArtifactSlot) {
            Move-Item -LiteralPath $ArtifactSlot -Destination $backupSlot
            $artifactBackedUp = $true
        }
        try {
            Copy-Item -LiteralPath $candidateArtifactSlot -Destination $ArtifactSlot -Recurse
            if ((Get-FileHash -Algorithm SHA256 -LiteralPath $liveExecutable).Hash -ne
                    (Get-FileHash -Algorithm SHA256 -LiteralPath $executablePath).Hash -or
                (Get-FileHash -Algorithm SHA256 -LiteralPath $liveManifest).Hash -ne
                    (Get-FileHash -Algorithm SHA256 -LiteralPath $manifestPath).Hash) {
                throw 'Published Forge artifact pair failed post-copy verification.'
            }
        }
        catch {
            if (Test-Path -LiteralPath $ArtifactSlot) {
                Remove-Item -LiteralPath $ArtifactSlot -Recurse -Force
            }
            if ($artifactBackedUp) {
                Move-Item -LiteralPath $backupSlot -Destination $ArtifactSlot
                $artifactBackedUp = $false
            }
            throw
        }
        $artifactPublished = $true
    }
    if ($artifactBackedUp) {
        Remove-Item -LiteralPath $backupSlot -Recurse -Force
        $artifactBackedUp = $false
    }

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
catch {
    $stagingError = $_
}
finally {
    if ($artifactBackedUp -and -not (Test-Path -LiteralPath $ArtifactSlot)) {
        try {
            Move-Item -LiteralPath $backupSlot -Destination $ArtifactSlot
            $artifactBackedUp = $false
        }
        catch {
            $cleanupErrors.Add($_.Exception.Message)
        }
    }
    if ($artifactPublished -and (Test-Path -LiteralPath $backupSlot)) {
        try {
            Remove-Item -LiteralPath $backupSlot -Recurse -Force
        }
        catch {
            $cleanupErrors.Add($_.Exception.Message)
        }
    }
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

    if (Test-Path -LiteralPath $proofRoot) {
        $removed = $false
        for ($attempt = 1; $attempt -le 12 -and -not $removed; $attempt++) {
            try {
                Remove-Item -LiteralPath $proofRoot -Recurse -Force
                $removed = $true
            }
            catch {
                if ($attempt -eq 12) {
                    $cleanupErrors.Add($_.Exception.Message)
                }
                else {
                    Start-Sleep -Seconds ([Math]::Min($attempt * 2, 15))
                }
            }
        }
    }
}

if ($null -ne $stagingError) {
    if ($cleanupErrors.Count -gt 0) {
        throw [InvalidOperationException]::new(
            (
                "Staging failed: $($stagingError.Exception.Message) " +
                "Cleanup also failed: $($cleanupErrors -join '; ')"
            ),
            $stagingError.Exception)
    }
    throw $stagingError
}
if ($cleanupErrors.Count -gt 0) {
    throw "Staging cleanup failed: $($cleanupErrors -join '; ')"
}
if ($null -ne $result) {
    $result | ConvertTo-Json -Depth 8
}
