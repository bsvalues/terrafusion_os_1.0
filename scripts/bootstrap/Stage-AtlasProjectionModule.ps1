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

  ATLAS_MODULE_SHA256 is asserted equal to AtlasProjectionOptions.ExpectedModuleSha256 by
  tests/atlas-staging-identity, so the stager and the runtime can never disagree about which module
  identity is canonical.
#>
[CmdletBinding()]
param(
  [string]$AtlasRepository = "https://github.com/bsvalues/terrafusion-atlas",
  [string]$ArtifactSlot,
  [string]$BuildRootBase = $env:TEMP
)

$ErrorActionPreference = "Stop"

# Pinned canonical source. terrafusion-atlas main 6736a539 is the commit whose module hashes to the
# value AtlasProjectionOptions pins; both were measured byte-identical before this was written.
$ExpectedAtlasCommit = "6736a53980c73d2b503ec71a440ad8e02aa43782"
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
if ((Get-Content -LiteralPath $optionsFile -Raw) -notmatch [regex]::Escape($AtlasModuleSha256)) {
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

$proofRoot   = Join-Path $BuildRootBase ([DateTimeOffset]::UtcNow.ToString("yyyyMMddTHHmmssfffZ"))
$suiteSource = Join-Path $proofRoot "atlas-source"
$candidate   = Join-Path $proofRoot "candidate-artifact"
$backupSlot  = Join-Path $proofRoot "previous-artifact"
New-Item -ItemType Directory -Path $proofRoot, $candidate -Force | Out-Null

# ---- fetch the pinned canonical source -------------------------------------------------------
Invoke-Checked "git" @("clone", "--no-checkout", "--filter=blob:none", $AtlasRepository, $suiteSource) $proofRoot
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

# ---- publish with a restorable backup --------------------------------------------------------
$hadPrevious = Test-Path -LiteralPath $ArtifactSlot
if ($hadPrevious) {
  New-Item -ItemType Directory -Path $backupSlot -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $ArtifactSlot "*") -Destination $backupSlot -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $ArtifactSlot -Force | Out-Null
try {
  Copy-Item -LiteralPath $candidateModule -Destination $ArtifactSlot -Force
  $publishedHash = (Get-FileHash -LiteralPath (Join-Path $ArtifactSlot "project-atlas-feature.mjs") -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($publishedHash -ne $AtlasModuleSha256) { throw "ATLAS_PUBLISHED_HASH_MISMATCH: $publishedHash" }
} catch {
  if ($hadPrevious) {
    Copy-Item -LiteralPath (Join-Path $backupSlot "*") -Destination $ArtifactSlot -Recurse -Force -ErrorAction SilentlyContinue
    Write-Error "ATLAS_STAGE_FAILED_ROLLED_BACK: $_"
  } else {
    Remove-Item -LiteralPath $ArtifactSlot -Recurse -Force -ErrorAction SilentlyContinue
    Write-Error "ATLAS_STAGE_FAILED_SLOT_REMOVED: $_"
  }
  exit 1
}

[pscustomobject]@{
  artifactType    = "atlas.spatial-read.projection-module@1"
  suiteRepository = $AtlasRepository
  suiteCommit     = $ExpectedAtlasCommit
  modulePath      = $ModulePathInSuite
  sha256          = $AtlasModuleSha256
  artifactSlot    = $ArtifactSlot
  rollbackSlot    = if ($hadPrevious) { $backupSlot } else { $null }
} | ConvertTo-Json -Depth 4
