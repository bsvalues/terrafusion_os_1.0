<#
.SYNOPSIS
Stage the exact protected Atlas spatial anomaly module and specification into its OS-owned slot.
Uses existing local artifact staging semantics: Git blobs, pinned bytes, recoverable publication.
No provider, runtime launch, mutable-source copy, or frozen contract modification.
#>
param(
  [Parameter(Mandatory = $true)][string]$AtlasRepository,
  [string]$NodeExecutable = 'node',
  [switch]$TestOnlyInjectFailureAfterPublish
)
$ErrorActionPreference = 'Stop'
$osRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$suiteRoot = (Resolve-Path -LiteralPath $AtlasRepository).Path
$runtimeModule = Join-Path $osRoot 'os-platform/core/pilot/atlas-spatial-anomaly-process.mjs'
$manifestScript = 'import {pathToFileURL} from "node:url"; const m=await import(pathToFileURL(process.argv[1]).href); process.stdout.write(JSON.stringify(m.atlasSpatialAnomalyManifest()));'
$manifestJson = & $NodeExecutable --input-type=module -e $manifestScript $runtimeModule
if ($LASTEXITCODE -ne 0) { throw 'ATLAS_PROTECTED_PIN_UNAVAILABLE' }
$manifest = $manifestJson | ConvertFrom-Json
if ($manifest.source.commit -cnotmatch '^[a-f0-9]{40}$' -or $manifest.source.repository -ne 'bsvalues/terrafusion-atlas') {
  throw 'ATLAS_PROTECTED_PIN_INVALID'
}
$origin = & git -C $suiteRoot remote get-url origin
if ($LASTEXITCODE -ne 0 -or $origin -notmatch '^(https://github\.com/|git@github\.com:)bsvalues/terrafusion-atlas(?:\.git)?/?$') {
  throw 'ATLAS_REPOSITORY_IDENTITY_MISMATCH'
}

function Read-GitBlob([string]$RelativePath) {
  $start = [Diagnostics.ProcessStartInfo]::new('git')
  $start.UseShellExecute = $false
  $start.CreateNoWindow = $true
  $start.RedirectStandardOutput = $true
  $start.RedirectStandardError = $true
  foreach ($argument in @('-C', $suiteRoot, 'show', ($manifest.source.commit + ':' + $RelativePath))) {
    $start.ArgumentList.Add($argument)
  }
  $process = [Diagnostics.Process]::Start($start)
  $errors = $process.StandardError.ReadToEndAsync()
  $buffer = [IO.MemoryStream]::new()
  try {
    $process.StandardOutput.BaseStream.CopyTo($buffer)
    $process.WaitForExit()
    if ($process.ExitCode -ne 0) { throw "ATLAS_PINNED_BLOB_UNAVAILABLE: $RelativePath" }
    if ($buffer.Length -gt 1MB) { throw 'ATLAS_ARTIFACT_SIZE_LIMIT' }
    return ,$buffer.ToArray()
  } finally { $buffer.Dispose(); $process.Dispose() }
}
function Get-BytesHash([byte[]]$Bytes) {
  return [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($Bytes)).ToLowerInvariant()
}
$inventoryBytes = Read-GitBlob 'operations/evidence/EO-TF-ATLAS-SPATIAL-ANOMALY-001.md'
$inventoryText = [Text.Encoding]::UTF8.GetString($inventoryBytes)
$matches = [regex]::Matches($inventoryText, '(?s)```json\r?\n(.*?)\r?\n```')
if ($matches.Count -ne 1) { throw 'ATLAS_PORTABLE_INVENTORY_INVALID' }
$inventory = $matches[0].Groups[1].Value | ConvertFrom-Json
if ($inventory.inventoryVersion -ne 1 -or $inventory.capability -ne $manifest.capability -or
    $inventory.entrypoint -ne $manifest.entrypoint -or $inventory.exportName -ne $manifest.exportName -or
    @($inventory.runtimeArtifacts).Count -ne 1 -or @($inventory.transitiveDependencies).Count -ne 0 -or
    $inventory.runtimeArtifacts[0].path -ne $manifest.runtimeArtifacts[0].path -or
    $inventory.runtimeArtifacts[0].sha256 -ne $manifest.runtimeArtifacts[0].sha256 -or
    $inventory.specification.path -ne $manifest.specification.path -or
    $inventory.specification.sha256 -ne $manifest.specification.sha256) { throw 'ATLAS_PORTABLE_INVENTORY_MISMATCH' }

$moduleBytes = Read-GitBlob $manifest.entrypoint
$specBytes = Read-GitBlob $manifest.specification.path
if ((Get-BytesHash $moduleBytes) -ne $manifest.runtimeArtifacts[0].sha256 -or
    (Get-BytesHash $specBytes) -ne $manifest.specification.sha256) { throw 'ATLAS_SOURCE_HASH_MISMATCH' }

$atlasRoot = [IO.Path]::GetFullPath((Join-Path $osRoot '.terrafusion/runtime/atlas'))
$slot = Join-Path $atlasRoot 'spatial-anomaly'
$staging = Join-Path $atlasRoot 'spatial-anomaly-staging'
$invocations = Join-Path $atlasRoot 'spatial-anomaly-invocations'
function Assert-OwnedPath([string]$Target) {
  $absolute = [IO.Path]::GetFullPath($Target)
  if (-not $absolute.StartsWith($atlasRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'ATLAS_PATH_OUTSIDE_OWNED_RUNTIME'
  }
  $cursor = $absolute
  while ($cursor -and $cursor.Length -ge $osRoot.Length) {
    if (Test-Path -LiteralPath $cursor) {
      $item = Get-Item -LiteralPath $cursor -Force
      if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'ATLAS_REPARSE_PATH_REFUSED' }
    }
    $cursor = Split-Path -Parent $cursor
  }
}
foreach ($target in @($slot, $staging, $invocations)) { Assert-OwnedPath $target }
New-Item -ItemType Directory -Path $staging, $invocations -Force | Out-Null
$receipt = Join-Path $staging ([Guid]::NewGuid().ToString('N'))
$candidate = Join-Path $receipt 'candidate'
$backup = Join-Path $receipt 'previous'
$failedPublication = Join-Path $receipt 'failed-publication'
foreach ($target in @($receipt, $candidate, $backup, $failedPublication)) { Assert-OwnedPath $target }
New-Item -ItemType Directory -Path (Join-Path $candidate 'src/spatial-anomaly'), (Join-Path $candidate 'operations/work-orders') -Force | Out-Null
[IO.File]::WriteAllBytes((Join-Path $candidate $manifest.entrypoint), $moduleBytes)
[IO.File]::WriteAllBytes((Join-Path $candidate $manifest.specification.path), $specBytes)
[IO.File]::WriteAllText((Join-Path $candidate 'manifest.json'), $manifestJson, [Text.UTF8Encoding]::new($false))

function Get-Inventory([string]$Directory) {
  $result = [ordered]@{}
  foreach ($file in Get-ChildItem -LiteralPath $Directory -Recurse -Force | Sort-Object FullName) {
    if ($file.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'ATLAS_SLOT_REPARSE_REFUSED' }
    if ($file.PSIsContainer) { continue }
    $result[[IO.Path]::GetRelativePath($Directory, $file.FullName)] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
  }
  return ($result | ConvertTo-Json -Compress)
}
$previous = if (Test-Path -LiteralPath $slot) { Get-Inventory $slot } else { $null }
$backupMoved = $false
$publicationMoved = $false
try {
  if ($null -ne $previous) {
    Assert-OwnedPath $slot; Assert-OwnedPath $backup
    Move-Item -LiteralPath $slot -Destination $backup
    $backupMoved = $true
    if ((Get-Inventory $backup) -cne $previous) { throw 'ATLAS_BACKUP_INTEGRITY_MISMATCH' }
  }
  Assert-OwnedPath $candidate; Assert-OwnedPath $slot
  Move-Item -LiteralPath $candidate -Destination $slot
  $publicationMoved = $true
  if ((Get-FileHash -LiteralPath (Join-Path $slot $manifest.entrypoint) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $manifest.runtimeArtifacts[0].sha256 -or
      (Get-FileHash -LiteralPath (Join-Path $slot $manifest.specification.path) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $manifest.specification.sha256 -or
      [IO.File]::ReadAllText((Join-Path $slot 'manifest.json')) -cne $manifestJson) { throw 'ATLAS_PUBLICATION_INTEGRITY_MISMATCH' }
  if ($TestOnlyInjectFailureAfterPublish) { throw 'ATLAS_INJECTED_PUBLICATION_FAILURE' }
} catch {
  $cause = $_
  if ($publicationMoved -and (Test-Path -LiteralPath $slot)) {
    Assert-OwnedPath $slot; Assert-OwnedPath $failedPublication
    Move-Item -LiteralPath $slot -Destination $failedPublication
  }
  if ($backupMoved) {
    Assert-OwnedPath $backup; Assert-OwnedPath $slot
    Move-Item -LiteralPath $backup -Destination $slot
    if ((Get-Inventory $slot) -cne $previous) { throw 'ATLAS_ROLLBACK_INTEGRITY_FAILED' }
  }
  throw "ATLAS_STAGE_FAILED_ROLLED_BACK: $cause"
}
[pscustomobject]@{ status = 'STAGED'; sourceCommit = $manifest.source.commit; moduleSha256 = $manifest.runtimeArtifacts[0].sha256;
  specificationSha256 = $manifest.specification.sha256; artifactSlot = $slot; preservedBackup = $(if ($backupMoved) { $backup } else { $null }) } | ConvertTo-Json
