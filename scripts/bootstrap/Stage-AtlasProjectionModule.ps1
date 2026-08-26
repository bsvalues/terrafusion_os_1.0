<#
.SYNOPSIS
  Stage the canonical Atlas spatial-read projection module from bsvalues/terrafusion-atlas into the
  OS-managed runtime artifact slot, verified by exact commit and blob hash.

.DESCRIPTION
  WO-SR-007B built the process host and stopped deliberately: proven host, but no runtime consumer,
  no persistent selection, no ownership transfer, no cutover. This is the missing staging half, and
  it is what lets AtlasProjectionOptions.Mode leave Disabled against a real artifact rather than a
  test fixture.

  The pattern is Stage-ForgeValuationKernel.ps1: pinned repository, pinned commit, blob hash verified
  BEFORE publication, a backup slot so the previous artifact is restorable, and refusal on any drift.

  It is deliberately NOT Forge's deletion mechanics. Forge retired a byte-identical standalone crate;
  the program found Atlas had no safe direct-copy extraction boundary. So the sovereign
  AtlasSpatialReadAdapter and the frozen atlas.spatial-read contract stay OS-owned integration. What
  moves is canonical ownership of the projection capability, not the integration seam.

  The stager parses AtlasProjectionOptions.ExpectedModuleSha256 and refuses to fetch or publish if
  the runtime pin differs. It also publishes a manifest that binds the canonical repository, commit,
  module path, and module SHA-256 for the runtime-adoption gate.
#>
[CmdletBinding()]
param(
  [string]$AtlasRepository = "https://github.com/bsvalues/terrafusion-atlas",
  [string]$ArtifactSlot,
  [string]$BuildRootBase = $env:TEMP,
  [switch]$TestOnlyInjectFailureDuringBackupVerification,
  [switch]$TestOnlyInjectFailureAfterPublish
)

$ErrorActionPreference = "Stop"

# Pinned canonical source. terrafusion-atlas main 6736a539 is the commit whose module hashes to the
# value AtlasProjectionOptions pins; both were measured byte-identical before this was written.
$ExpectedAtlasCommit = "6736a53980c73d2b503ec71a440ad8e02aa43782"
$ExpectedRepository  = "bsvalues/terrafusion-atlas"
$ModulePathInSuite   = "src/spatial-read/project-atlas-feature.mjs"
$AtlasModuleSha256   = "3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46"

$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$expectedArtifactSlot = Join-Path $sovereignRepository ".terrafusion\runtime\atlas\spatial-read"

if (-not $ArtifactSlot) { $ArtifactSlot = $expectedArtifactSlot }
if ($ArtifactSlot -ine $expectedArtifactSlot) {
  throw "ATLAS_ARTIFACT_SLOT_REFUSED: must be the ignored OS-managed path $expectedArtifactSlot"
}

# The runtime is the single source of truth for module identity. A stager that carried its own
# independent hash could drift from the host that enforces it, which is the whole failure class.
$optionsFile = Join-Path $sovereignRepository "backend\src\TerraFusion.API\Configuration\AtlasProjectionOptions.cs"
if (-not (Test-Path -LiteralPath $optionsFile)) {
  throw "ATLAS_OPTIONS_MISSING: cannot cross-check module identity against $optionsFile"
}
$optionsSource = Get-Content -LiteralPath $optionsFile -Raw
$pinPattern = 'ExpectedModuleSha256\s*=\s*\r?\n?\s*"' + [regex]::Escape($AtlasModuleSha256) + '"'
if ($optionsSource -notmatch $pinPattern) {
  throw "ATLAS_IDENTITY_DISAGREEMENT: AtlasProjectionOptions does not pin $AtlasModuleSha256"
}

function Invoke-Checked {
  param([string]$Command, [string[]]$Arguments, [string]$WorkingDirectory)
  Push-Location $WorkingDirectory
  try {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command $($Arguments -join ' ') failed with exit code $LASTEXITCODE." }
  } finally { Pop-Location }
}

function Get-GitScalar {
  param([string]$Repository, [string[]]$Arguments)
  $value = & git -C $Repository @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "git -C $Repository $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
  }
  return ($value -join "`n").Trim()
}

function Test-CanonicalAtlasOrigin {
  param([string]$Origin)
  return $Origin -match '^https://github\.com/bsvalues/terrafusion-atlas(?:\.git)?/?$' -or
    $Origin -match '^git@github\.com:bsvalues/terrafusion-atlas(?:\.git)?/?$' -or
    $Origin -match '^ssh://git@github\.com/bsvalues/terrafusion-atlas(?:\.git)?/?$'
}

function Get-DirectoryFileHashes {
  param([string]$Directory)
  $hashes = [ordered]@{}
  if (-not (Test-Path -LiteralPath $Directory -PathType Container)) { return $hashes }
  foreach ($file in Get-ChildItem -LiteralPath $Directory -File -Recurse | Sort-Object FullName) {
    $relative = [IO.Path]::GetRelativePath($Directory, $file.FullName).Replace('\', '/')
    $hashes[$relative] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  }
  return $hashes
}

$proofRoot   = Join-Path $BuildRootBase ([DateTimeOffset]::UtcNow.ToString("yyyyMMddTHHmmssfffZ"))
$suiteSource = Join-Path $proofRoot "atlas-source"
$candidate   = Join-Path $proofRoot "candidate-artifact"
$backupSlot  = Join-Path $proofRoot "previous-artifact"
New-Item -ItemType Directory -Path $proofRoot, $candidate -Force | Out-Null

# ---- fetch the pinned canonical source -------------------------------------------------------
$declaredOrigin = if (Test-Path -LiteralPath $AtlasRepository -PathType Container) {
  Get-GitScalar $AtlasRepository @("remote", "get-url", "origin")
} else {
  $AtlasRepository
}
if (-not (Test-CanonicalAtlasOrigin $declaredOrigin)) {
  throw "ATLAS_REPOSITORY_IDENTITY_MISMATCH: expected $ExpectedRepository, resolved $declaredOrigin"
}
Invoke-Checked "git" @("clone", "--no-checkout", "--filter=blob:none", $AtlasRepository, $suiteSource) $proofRoot
Invoke-Checked "git" @("config", "core.autocrlf", "false") $suiteSource
Invoke-Checked "git" @("config", "core.eol", "lf") $suiteSource
Invoke-Checked "git" @("fetch", "--depth", "1", "origin", $ExpectedAtlasCommit) $suiteSource
Invoke-Checked "git" @("checkout", "--detach", $ExpectedAtlasCommit) $suiteSource

$head = (& git -C $suiteSource rev-parse HEAD).Trim()
if ($head -ine $ExpectedAtlasCommit) {
  throw "ATLAS_SOURCE_REVISION_DRIFT: expected $ExpectedAtlasCommit, resolved $head"
}

$sourceModule = Join-Path $suiteSource ($ModulePathInSuite -replace "/", "\")
if (-not (Test-Path -LiteralPath $sourceModule)) {
  throw "ATLAS_MODULE_MISSING: $ModulePathInSuite absent at $ExpectedAtlasCommit"
}

# ---- verify identity BEFORE publishing -------------------------------------------------------
$measured = (Get-FileHash -LiteralPath $sourceModule -Algorithm SHA256).Hash.ToLowerInvariant()
if ($measured -ne $AtlasModuleSha256) {
  throw "ATLAS_MODULE_HASH_MISMATCH: expected $AtlasModuleSha256, measured $measured"
}

$candidateModule = Join-Path $candidate "project-atlas-feature.mjs"
Copy-Item -LiteralPath $sourceModule -Destination $candidateModule -Force
$candidateHash = (Get-FileHash -LiteralPath $candidateModule -Algorithm SHA256).Hash.ToLowerInvariant()
if ($candidateHash -ne $AtlasModuleSha256) {
  throw "ATLAS_CANDIDATE_HASH_MISMATCH: the copy altered the module ($candidateHash)"
}

$candidateManifest = Join-Path $candidate "manifest.json"
[ordered]@{
  schemaVersion = 1
  artifactType = "atlas.spatial-read.projection-module@1"
  repository = $ExpectedRepository
  commit = $ExpectedAtlasCommit
  modulePath = $ModulePathInSuite
  moduleFilename = "project-atlas-feature.mjs"
  moduleSha256 = $AtlasModuleSha256
  transport = "local-os-managed-artifact-slot"
} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $candidateManifest -Encoding utf8

$manifest = Get-Content -LiteralPath $candidateManifest -Raw | ConvertFrom-Json
if ($manifest.repository -ne $ExpectedRepository -or
    $manifest.commit -ne $ExpectedAtlasCommit -or
    $manifest.modulePath -ne $ModulePathInSuite -or
    $manifest.moduleFilename -ne "project-atlas-feature.mjs" -or
    $manifest.moduleSha256 -ne $AtlasModuleSha256 -or
    $manifest.transport -ne "local-os-managed-artifact-slot") {
  throw "ATLAS_MANIFEST_IDENTITY_MISMATCH: candidate provenance manifest failed validation"
}

# ---- publish with a restorable backup --------------------------------------------------------
$slotPathExists = Test-Path -LiteralPath $ArtifactSlot
$slotExisted = Test-Path -LiteralPath $ArtifactSlot -PathType Container
if ($slotPathExists -and -not $slotExisted) {
  throw "ATLAS_ARTIFACT_SLOT_INVALID: $ArtifactSlot exists but is not a directory"
}
$previousInventory = if ($slotExisted) { Get-DirectoryFileHashes $ArtifactSlot } else { [ordered]@{} }
if ($slotExisted) {
  $backupMoved = $false
  try {
    Move-Item -LiteralPath $ArtifactSlot -Destination $backupSlot
    $backupMoved = $true
    if ($TestOnlyInjectFailureDuringBackupVerification) {
      throw "ATLAS_TEST_INJECTED_BACKUP_VERIFICATION_FAILURE"
    }
    $backupInventory = Get-DirectoryFileHashes $backupSlot
    if (($backupInventory | ConvertTo-Json -Compress) -ne ($previousInventory | ConvertTo-Json -Compress)) {
      throw "ATLAS_BACKUP_HASH_MISMATCH"
    }
  } catch {
    $backupFailure = $_
    if (-not $backupMoved) { throw }
    try {
      Move-Item -LiteralPath $backupSlot -Destination $ArtifactSlot
    } catch {
      throw "ATLAS_BACKUP_RESTORE_MOVE_FAILED: $($_.Exception.Message); original failure: $backupFailure"
    }
    try {
      $restoredAfterBackupFailure = Get-DirectoryFileHashes $ArtifactSlot
      if (($restoredAfterBackupFailure | ConvertTo-Json -Compress) -ne ($previousInventory | ConvertTo-Json -Compress)) {
        throw "restored inventory differs from the previous hashes"
      }
    } catch {
      throw "ATLAS_BACKUP_RESTORED_UNVERIFIABLE: $($_.Exception.Message); original failure: $backupFailure"
    }
    throw "ATLAS_BACKUP_VALIDATION_FAILED_RESTORED: $backupFailure"
  }
}
try {
  Copy-Item -LiteralPath $candidate -Destination $ArtifactSlot -Recurse
  $publishedHash = (Get-FileHash -LiteralPath (Join-Path $ArtifactSlot "project-atlas-feature.mjs") -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($publishedHash -ne $AtlasModuleSha256) { throw "ATLAS_PUBLISHED_HASH_MISMATCH: $publishedHash" }
  $publishedManifest = Get-Content -LiteralPath (Join-Path $ArtifactSlot "manifest.json") -Raw | ConvertFrom-Json
  if ($publishedManifest.repository -ne $ExpectedRepository -or
      $publishedManifest.commit -ne $ExpectedAtlasCommit -or
      $publishedManifest.moduleSha256 -ne $publishedHash) {
    throw "ATLAS_PUBLISHED_MANIFEST_MISMATCH: published provenance does not bind the module bytes"
  }
  if ($TestOnlyInjectFailureAfterPublish) {
    throw "ATLAS_TEST_INJECTED_PUBLICATION_FAILURE"
  }
} catch {
  $stageFailure = $_
  if (Test-Path -LiteralPath $ArtifactSlot) {
    Remove-Item -LiteralPath $ArtifactSlot -Recurse -Force -ErrorAction SilentlyContinue
  }
  if ($slotExisted) {
    Move-Item -LiteralPath $backupSlot -Destination $ArtifactSlot
    $restoredInventory = Get-DirectoryFileHashes $ArtifactSlot
    if (($restoredInventory | ConvertTo-Json -Compress) -ne ($previousInventory | ConvertTo-Json -Compress)) {
      throw "ATLAS_ROLLBACK_FAILED: restored artifact inventory does not match the previous hashes after: $stageFailure"
    }
    throw "ATLAS_STAGE_FAILED_ROLLED_BACK: $stageFailure"
  }
  throw "ATLAS_STAGE_FAILED_SLOT_REMOVED: $stageFailure"
}

[pscustomobject]@{
  artifactType    = "atlas.spatial-read.projection-module@1"
  suiteRepository = $ExpectedRepository
  fetchTransport   = $AtlasRepository
  suiteCommit     = $ExpectedAtlasCommit
  modulePath      = $ModulePathInSuite
  sha256          = $AtlasModuleSha256
  artifactSlot    = $ArtifactSlot
  manifestPath    = Join-Path $ArtifactSlot "manifest.json"
  rollbackSlot    = if ($slotExisted) { $backupSlot } else { $null }
  rollbackHashes  = if ($slotExisted) { $previousInventory } else { $null }
} | ConvertTo-Json -Depth 4
