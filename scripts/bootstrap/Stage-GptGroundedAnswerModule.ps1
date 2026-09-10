<#
.SYNOPSIS
Stages only the exact protected GPT answer module, all transitive dependencies and specification.
.DESCRIPTION
Reads immutable Git blobs from a canonical local suite checkout. Does not mutate that checkout,
activate providers, change configuration, install dependencies or overwrite an existing slot.
Candidate publication is an atomic directory rename; failed candidates remain recoverable.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$SuiteRepository,
    [ValidateSet('Development', 'Test', 'Testing', 'CI', 'Local')][string]$EnvironmentName = 'Development'
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$commit = 'afbcba88c7606e78d3705010b39bcb0527270134'
$repository = 'bsvalues/terrafusion-gpt'
$contract = 'gpt.grounded-answer@1.0.0'
$specHash = '880f16bf0722732c46cf2d2dc9d4dbf8cdcb29dbb22cbc11a15700c91d38bd82'
$inventory = @(
    @{ Path = 'src/grounded-answer/project-gpt-grounded-answer.mjs'; Length = 8570; Sha256 = '27e405d5dd494553c87fc5e676dbad6a80fcbe22162ea0bc2506184e25b78a5f' },
    @{ Path = 'src/grounded-context/project-gpt-grounded-context.mjs'; Length = 8578; Sha256 = 'cd2c6111ab0843d321bea8da5eff77cee89eaa1c721d93489d1985c6820f1beb' },
    @{ Path = 'contract-compat/gpt.grounded-context.v1/gpt.grounded-context.v1.schema.json'; Length = 3555; Sha256 = 'da9a923e2ef92f63a728edcb19d726a9a29ceb39203464dbe6ee426e94a69019' },
    @{ Path = 'operations/work-orders/EO-TF-GPT-GROUNDED-RUNTIME-001.md'; Length = 6700; Sha256 = $specHash },
    @{ Path = 'canon/GPT_GROUNDED_ANSWER_EXECUTION_MANIFEST.json'; Length = 1197; Sha256 = 'cd5c413b0141712dfa4011c48fe5f5eb14e927b0cbbbac15f4e017485c50d853' }
)

function Assert-NoLinks([string]$Path) {
    $cursor = [IO.Path]::GetFullPath($Path)
    while ($cursor) {
        if (Test-Path -LiteralPath $cursor) {
            if ((Get-Item -LiteralPath $cursor -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
                throw 'GPT_ANSWER_REPARSE_REFUSED'
            }
        }
        $parent = [IO.Directory]::GetParent($cursor)
        if ($null -eq $parent) { break }
        $cursor = $parent.FullName
    }
}
function Git-Scalar([string[]]$Arguments) {
    $value = & git -C $SuiteRepository @Arguments
    if ($LASTEXITCODE -ne 0) { throw "GPT_ANSWER_GIT_FAILED:$LASTEXITCODE" }
    return ($value -join "`n").Trim()
}
function Assert-Bytes([byte[]]$Bytes, $Artifact) {
    if ($Bytes.Length -ne $Artifact.Length) { throw 'GPT_ANSWER_LENGTH_MISMATCH' }
    $actual = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($Bytes)).ToLowerInvariant()
    if ($actual -cne $Artifact.Sha256) { throw 'GPT_ANSWER_HASH_MISMATCH' }
}
function Read-GitBlob([string]$Path) {
    $start = [Diagnostics.ProcessStartInfo]::new('git')
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    foreach ($argument in @('-C', $SuiteRepository, 'cat-file', 'blob', "${commit}:$Path")) { $start.ArgumentList.Add($argument) }
    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $start
    $bytes = [IO.MemoryStream]::new()
    try {
        if (-not $process.Start()) { throw 'GPT_ANSWER_GIT_START_FAILED' }
        $errors = $process.StandardError.ReadToEndAsync()
        $process.StandardOutput.BaseStream.CopyTo($bytes)
        $process.WaitForExit()
        if ($process.ExitCode -ne 0 -or $errors.GetAwaiter().GetResult().Length -ne 0) { throw 'GPT_ANSWER_BLOB_FAILED' }
        return ,$bytes.ToArray()
    } finally { $bytes.Dispose(); $process.Dispose() }
}
function Assert-Slot([string]$Directory, [byte[]]$Receipt) {
    Assert-NoLinks $Directory
    foreach ($entry in Get-ChildItem -LiteralPath $Directory -Recurse -Force) {
        if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'GPT_ANSWER_REPARSE_REFUSED' }
    }
    $files = @(Get-ChildItem -LiteralPath $Directory -Recurse -File -Force)
    if ($files.Count -ne $inventory.Count + 1) { throw 'GPT_ANSWER_SLOT_INVENTORY_MISMATCH' }
    foreach ($artifact in $inventory) {
        $path = Join-Path $Directory $artifact.Path
        Assert-NoLinks $path
        Assert-Bytes ([IO.File]::ReadAllBytes($path)) $artifact
    }
    $actualReceipt = [IO.File]::ReadAllBytes((Join-Path $Directory 'adoption.json'))
    if ([Convert]::ToBase64String($actualReceipt) -cne [Convert]::ToBase64String($Receipt)) { throw 'GPT_ANSWER_ADOPTION_MISMATCH' }
}

$SuiteRepository = (Resolve-Path -LiteralPath $SuiteRepository).Path
Assert-NoLinks $SuiteRepository
$origin = Git-Scalar @('remote', 'get-url', 'origin')
if ($origin -notmatch '^(https://github\.com/|git@github\.com:|ssh://git@github\.com/)bsvalues/terrafusion-gpt(?:\.git)?/?$') {
    throw 'GPT_ANSWER_SOURCE_ORIGIN_REFUSED'
}
if ((Git-Scalar @('rev-parse', "${commit}^{commit}")) -cne $commit) { throw 'GPT_ANSWER_COMMIT_MISMATCH' }
$sovereign = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$slot = Join-Path $sovereign '.terrafusion/runtime/gpt/grounded-answer'
$staging = Join-Path $sovereign '.terrafusion/runtime/gpt/grounded-answer-staging'
Assert-NoLinks $slot
Assert-NoLinks $staging
$receipt = [Text.UTF8Encoding]::new($false).GetBytes((([ordered]@{
    sourceCommit = $commit; repository = $repository; contract = $contract; specificationSha256 = $specHash
} | ConvertTo-Json -Compress) + "`n"))
if (Test-Path -LiteralPath $slot) {
    Assert-Slot $slot $receipt
    Write-Output "GPT_ANSWER_ALREADY_STAGED:$commit"
    return
}
# Take all verified Git-byte snapshots before creating any candidate.
$snapshots = @{}
foreach ($artifact in $inventory) {
    [byte[]]$bytes = Read-GitBlob $artifact.Path
    Assert-Bytes $bytes $artifact
    $snapshots[$artifact.Path] = $bytes
}
$null = New-Item -ItemType Directory -Path $staging -Force
$candidate = Join-Path $staging ([Guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $candidate
try {
    foreach ($artifact in $inventory) {
        $destination = Join-Path $candidate $artifact.Path
        $null = New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force
        [IO.File]::WriteAllBytes($destination, $snapshots[$artifact.Path])
    }
    [IO.File]::WriteAllBytes((Join-Path $candidate 'adoption.json'), $receipt)
    Assert-Slot $candidate $receipt
    Assert-NoLinks $slot
    # No overwrite/recursive deletion. A competing publisher makes this rename fail closed.
    [IO.Directory]::Move($candidate, $slot)
    Assert-Slot $slot $receipt
    Write-Output "GPT_ANSWER_STAGED:$commit"
} catch {
    Write-Warning "GPT_ANSWER_STAGE_FAILED; existing slot not overwritten; candidate retained at $candidate"
    throw
}
