<#
.SYNOPSIS
  Stage the exact canonical Dossier evidence-registry read module and frozen schema into the
  ignored OS-managed artifact slot with verified whole-slot rollback.

.DESCRIPTION
  The source checkout is detached at one protected-main commit with line-ending conversion disabled.
  Module, schema, and source-manifest identities are verified before publication. The published slot
  contains exactly the module, schema, and a generated provenance manifest. This Work Order refuses
  Production and performs no runtime activation, custody mutation, persistence, authentication, or
  county-data operation.
#>
[CmdletBinding()]
param(
  [string]$DossierRepository = "https://github.com/bsvalues/terrafusion-dossier",
  [string]$ArtifactSlot,
  [string]$BuildRootBase = $env:TEMP,
  [string]$EnvironmentName = "Development",
  [switch]$TestOnlyInjectCandidateManifestTamper,
  [switch]$TestOnlyInjectCandidateStringArrayTamper,
  [switch]$TestOnlyInjectFailureDuringBackupVerification,
  [switch]$TestOnlyInjectFailureAfterPublish,
  [ValidateRange(0, 30000)][int]$TestOnlyHoldTransactionLockMilliseconds = 0
)

$ErrorActionPreference = "Stop"

$ExpectedDossierCommit = "7558cfebfeea0c7b536251769b1d779c4558a763"
$ExpectedRepository = "bsvalues/terrafusion-dossier"
$ExpectedSourceBranch = "main"
$Contract = "dossier.evidence-registry-read@1.0.0"
$ModulePathInSuite = "src/evidence-registry/project-dossier-evidence-registry-read.mjs"
$ModuleFilename = "project-dossier-evidence-registry-read.mjs"
$ModuleSha256 = "bb0427d6634412d86be92a2ef5f6f0bfcdf97ee054887a42d59c2a0bc0127a8b"
$ModuleLength = 8901
$SchemaPathInSuite = "contract-compat/dossier.evidence-registry-read.v1/dossier.evidence-registry-read.v1.schema.json"
$SchemaFilename = "dossier.evidence-registry-read.v1.schema.json"
$SchemaSha256 = "f658bc2bda718f58bd0353e9635524d5dbd376be515b543da3442b0094e52270"
$SchemaLength = 2851
$SourceManifestPathInSuite = "contract-compat/dossier.evidence-registry-read.v1/manifest.json"
$SourceManifestSha256 = "0c8310e45a02face985fd9d628f16ff26bfac6b078107fa8f96e6f22f1ebcb07"
$ContractSourceSha = "cfcd460d6387c7dc5aefbc83a389e74333cf0201"
$SourceDtoSha256 = "414fd158cd7a0f1e483ab44a83b93a64e4180300561f53088830583220566b7f"

$allowedEnvironments = @('Development', 'Test', 'Testing', 'CI', 'Local')
if (-not ($allowedEnvironments -icontains $EnvironmentName)) {
  throw "DOSSIER_PRODUCTION_STAGE_REFUSED: staging is allowed only in Development, Test, Testing, CI, or Local; received $EnvironmentName"
}

$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$expectedArtifactSlot = Join-Path $sovereignRepository ".terrafusion\runtime\dossier\evidence-registry-read"
$artifactParent = Split-Path -Parent $expectedArtifactSlot
if (-not $ArtifactSlot) { $ArtifactSlot = $expectedArtifactSlot }
if ($ArtifactSlot -ine $expectedArtifactSlot) {
  throw "DOSSIER_ARTIFACT_SLOT_REFUSED: must be the ignored OS-managed path $expectedArtifactSlot"
}

function Assert-NoReparsePoint {
  param([string]$Path, [string]$ErrorCode)
  if (-not (Test-Path -LiteralPath $Path)) { return }
  $item = Get-Item -LiteralPath $Path -Force
  if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
    throw "${ErrorCode}: reparse points are refused at $Path"
  }
}

function Assert-NoReparseAncestors {
  param([string]$Path, [string]$ErrorCode)
  $cursor = [IO.Path]::GetFullPath($Path)
  while ($cursor) {
    Assert-NoReparsePoint $cursor $ErrorCode
    $parent = [IO.Directory]::GetParent($cursor)
    if ($null -eq $parent) { break }
    $cursor = $parent.FullName
  }
}

function Test-PathOverlap {
  param([string]$First, [string]$Second)
  $trim = [char[]]@('\', '/')
  $firstFull = [IO.Path]::GetFullPath($First).TrimEnd($trim)
  $secondFull = [IO.Path]::GetFullPath($Second).TrimEnd($trim)
  if ($firstFull.Equals($secondFull, [StringComparison]::OrdinalIgnoreCase)) { return $true }
  $separator = [IO.Path]::DirectorySeparatorChar
  return $firstFull.StartsWith("$secondFull$separator", [StringComparison]::OrdinalIgnoreCase) -or
    $secondFull.StartsWith("$firstFull$separator", [StringComparison]::OrdinalIgnoreCase)
}

function Get-Constant {
  param([string]$Source, [string]$Name, [string]$Expected)
  $escaped = [regex]::Escape($Name)
  $pattern = '(?m)^[ \t]*public[ \t]+const[ \t]+(?:string|int)[ \t]+' + $escaped + '[ \t]*=[ \t\r\n]*(?:"([^"]+)"|([0-9]+))[ \t]*;[ \t\r]*$'
  $matches = [regex]::Matches($Source, $pattern)
  if ($matches.Count -ne 1) {
    throw "DOSSIER_IDENTITY_DECLARATION_INVALID: expected exactly one $Name declaration, found $($matches.Count)"
  }
  $actual = if ($matches[0].Groups[1].Success) { $matches[0].Groups[1].Value } else { $matches[0].Groups[2].Value }
  if ($actual -cne [string]$Expected) {
    throw "DOSSIER_IDENTITY_DISAGREEMENT: $Name pins $actual, expected $Expected"
  }
}

function Invoke-Checked {
  param([string]$Command, [string[]]$Arguments, [string]$WorkingDirectory)
  Push-Location $WorkingDirectory
  try {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "$Command $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
    }
  } finally { Pop-Location }
}

function Get-GitScalar {
  param([string]$Repository, [string[]]$Arguments)
  $value = & git -c safe.directory=$Repository -C $Repository @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "git -C $Repository $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
  }
  return ($value -join "`n").Trim()
}

function Test-CanonicalDossierOrigin {
  param([string]$Origin)
  return $Origin -match '^https://github\.com/bsvalues/terrafusion-dossier(?:\.git)?/?$' -or
    $Origin -match '^git@github\.com:bsvalues/terrafusion-dossier(?:\.git)?/?$' -or
    $Origin -match '^ssh://git@github\.com/bsvalues/terrafusion-dossier(?:\.git)?/?$'
}

function Get-DirectoryFileHashes {
  param([string]$Directory)
  $hashes = [ordered]@{}
  if (-not (Test-Path -LiteralPath $Directory -PathType Container)) { return $hashes }
  Assert-NoReparsePoint $Directory "DOSSIER_SLOT_REPARSE_POINT_REFUSED"
  foreach ($entry in Get-ChildItem -LiteralPath $Directory -Force -Recurse) {
    if (($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw "DOSSIER_SLOT_REPARSE_POINT_REFUSED: $($entry.FullName)"
    }
  }
  foreach ($file in Get-ChildItem -LiteralPath $Directory -File -Recurse | Sort-Object FullName) {
    $relative = [IO.Path]::GetRelativePath($Directory, $file.FullName).Replace('\', '/')
    $hashes[$relative] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  }
  return $hashes
}

function Assert-InventoryEqual {
  param($Actual, $Expected, [string]$ErrorCode)
  if (($Actual | ConvertTo-Json -Compress) -cne ($Expected | ConvertTo-Json -Compress)) {
    throw $ErrorCode
  }
}

function Get-ExactArtifactInventory {
  param([string]$Directory, [string[]]$ExpectedNames, [string]$ErrorCode)
  Assert-NoReparseAncestors $Directory "${ErrorCode}_REPARSE_POINT"
  $entries = @(Get-ChildItem -LiteralPath $Directory -Force)
  if (@($entries | Where-Object { -not $_.PSIsContainer -and ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0 }).Count -ne $entries.Count) {
    throw "${ErrorCode}: only regular top-level files are allowed"
  }
  $actualNames = @($entries | ForEach-Object Name | Sort-Object)
  $sortedExpected = @($ExpectedNames | Sort-Object)
  if (($actualNames -join '|') -cne ($sortedExpected -join '|')) {
    throw "${ErrorCode}: exact file set mismatch"
  }
  return Get-DirectoryFileHashes $Directory
}

function Assert-ManifestIdentity {
  param([string]$Path, [string]$ErrorCode)
  $manifest = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
  $expectedProperties = @(
    'artifactType','commit','contract','contractSourceSha','moduleFilename','moduleLength','modulePath','moduleSha256',
    'repository','schemaFilename','schemaLength','schemaPath','schemaSha256','schemaVersion','sourceDtoSha256',
    'sourceBranch','sourceManifestPath','sourceManifestSha256','transport'
  ) | Sort-Object
  $actualProperties = @($manifest.psobject.Properties.Name | Sort-Object)
  $stringProperties = @(
    'artifactType','commit','contract','contractSourceSha','moduleFilename','modulePath','moduleSha256','repository',
    'schemaFilename','schemaPath','schemaSha256','sourceBranch','sourceDtoSha256','sourceManifestPath','sourceManifestSha256','transport'
  )
  $invalidStringTypes = @($stringProperties | Where-Object { $manifest.psobject.Properties[$_].Value -isnot [string] })
  if (($actualProperties -join '|') -cne ($expectedProperties -join '|') -or
      $invalidStringTypes.Count -ne 0 -or
      $manifest.schemaVersion -isnot [long] -or $manifest.moduleLength -isnot [long] -or
      $manifest.schemaLength -isnot [long] -or $manifest.schemaVersion -ne 1 -or
      $manifest.artifactType -cne 'dossier.evidence-registry-read.projection-module@1' -or
      $manifest.contract -cne $Contract -or $manifest.repository -cne $ExpectedRepository -or
      $manifest.sourceBranch -cne $ExpectedSourceBranch -or $manifest.commit -cne $ExpectedDossierCommit -or
      $manifest.modulePath -cne $ModulePathInSuite -or $manifest.moduleFilename -cne $ModuleFilename -or
      $manifest.moduleLength -ne $ModuleLength -or $manifest.moduleSha256 -cne $ModuleSha256 -or
      $manifest.schemaPath -cne $SchemaPathInSuite -or $manifest.schemaFilename -cne $SchemaFilename -or
      $manifest.schemaLength -ne $SchemaLength -or $manifest.schemaSha256 -cne $SchemaSha256 -or
      $manifest.sourceManifestPath -cne $SourceManifestPathInSuite -or
      $manifest.sourceManifestSha256 -cne $SourceManifestSha256 -or
      $manifest.contractSourceSha -cne $ContractSourceSha -or
      $manifest.sourceDtoSha256 -cne $SourceDtoSha256 -or
      $manifest.transport -cne 'local-os-managed-artifact-slot') {
    throw $ErrorCode
  }
}

$optionsFile = Join-Path $sovereignRepository "backend\src\TerraFusion.API\Configuration\DossierEvidenceRegistryReadOptions.cs"
if (-not (Test-Path -LiteralPath $optionsFile -PathType Leaf)) {
  throw "DOSSIER_OPTIONS_MISSING: $optionsFile"
}
$optionsSource = Get-Content -LiteralPath $optionsFile -Raw
Assert-NoReparseAncestors $optionsFile "DOSSIER_OPTIONS_REPARSE_POINT_REFUSED"
Assert-NoReparseAncestors $artifactParent "DOSSIER_ARTIFACT_PARENT_REPARSE_POINT_REFUSED"
Assert-NoReparseAncestors $ArtifactSlot "DOSSIER_ARTIFACT_SLOT_REPARSE_POINT_REFUSED"
Assert-NoReparseAncestors $BuildRootBase "DOSSIER_BUILD_ROOT_REPARSE_POINT_REFUSED"
$artifactVolume = [IO.Path]::GetPathRoot([IO.Path]::GetFullPath($ArtifactSlot))
$buildRootVolume = [IO.Path]::GetPathRoot([IO.Path]::GetFullPath($BuildRootBase))
if (-not $artifactVolume.Equals($buildRootVolume, [StringComparison]::OrdinalIgnoreCase)) {
  throw "DOSSIER_BUILD_ROOT_VOLUME_MISMATCH: backup and artifact slot must share a filesystem volume"
}
if (Test-PathOverlap $BuildRootBase $ArtifactSlot) {
  throw "DOSSIER_BUILD_ROOT_SLOT_OVERLAP_REFUSED: the build root and live artifact slot must be disjoint"
}
if (Test-PathOverlap $BuildRootBase $sovereignRepository) {
  throw "DOSSIER_BUILD_ROOT_REPOSITORY_OVERLAP_REFUSED: the build root must be outside the sovereign repository"
}

@{
  ExpectedArtifactType = "dossier.evidence-registry-read.projection-module@1"; ExpectedContract = $Contract;
  ExpectedRepository = $ExpectedRepository; ExpectedSourceBranch = $ExpectedSourceBranch; ExpectedCommit = $ExpectedDossierCommit;
  ExpectedModulePath = $ModulePathInSuite; ExpectedModuleFilename = $ModuleFilename;
  ExpectedModuleSha256 = $ModuleSha256; ExpectedModuleLength = $ModuleLength;
  ExpectedSchemaPath = $SchemaPathInSuite; ExpectedSchemaFilename = $SchemaFilename;
  ExpectedSchemaSha256 = $SchemaSha256; ExpectedSchemaLength = $SchemaLength;
  ExpectedSourceManifestPath = $SourceManifestPathInSuite; ExpectedSourceManifestSha256 = $SourceManifestSha256;
  ExpectedContractSourceSha = $ContractSourceSha; ExpectedSourceDtoSha256 = $SourceDtoSha256;
  ExpectedTransport = "local-os-managed-artifact-slot";
  ArtifactSlotRelativePath = ".terrafusion/runtime/dossier/evidence-registry-read"
}.GetEnumerator() | ForEach-Object {
  Assert-NoReparsePoint $optionsFile "DOSSIER_OPTIONS_REPARSE_POINT_REFUSED"
  Get-Constant $optionsSource $_.Key $_.Value
}

$proofRoot = Join-Path $BuildRootBase ("{0}-{1}" -f [DateTimeOffset]::UtcNow.ToString("yyyyMMddTHHmmssfffZ"), [guid]::NewGuid().ToString("N"))
$suiteSource = Join-Path $proofRoot "dossier-source"
$candidate = Join-Path $proofRoot "candidate-artifact"
$backupSlot = Join-Path $proofRoot "previous-artifact"
if (Test-Path -LiteralPath $proofRoot) { throw "DOSSIER_PROOF_ROOT_COLLISION: $proofRoot" }
New-Item -ItemType Directory -Path $proofRoot,$candidate -Force | Out-Null
Assert-NoReparseAncestors $proofRoot "DOSSIER_PROOF_ROOT_REPARSE_POINT_REFUSED"
Assert-NoReparseAncestors $candidate "DOSSIER_CANDIDATE_REPARSE_POINT_REFUSED"

$fetchRepository = $DossierRepository
$declaredOrigin = if (Test-Path -LiteralPath $DossierRepository -PathType Container) {
  $fetchRepository = (Resolve-Path -LiteralPath $DossierRepository).Path
  Assert-NoReparseAncestors $fetchRepository "DOSSIER_SOURCE_REPARSE_POINT_REFUSED"
  Get-GitScalar $fetchRepository @("remote", "get-url", "origin")
} else { $DossierRepository }
if (-not (Test-CanonicalDossierOrigin $declaredOrigin)) {
  throw "DOSSIER_REPOSITORY_IDENTITY_MISMATCH: expected $ExpectedRepository, resolved $declaredOrigin"
}
$cloneArguments = if (Test-Path -LiteralPath $fetchRepository -PathType Container) {
  @("-c", "safe.directory=$fetchRepository", "-c", "safe.directory=$(Join-Path $fetchRepository '.git')", "clone", "--no-checkout", "--filter=blob:none", $fetchRepository, $suiteSource)
} else {
  @("clone", "--no-checkout", "--filter=blob:none", $fetchRepository, $suiteSource)
}
Invoke-Checked "git" $cloneArguments $proofRoot
Invoke-Checked "git" @("config", "core.longpaths", "true") $suiteSource
Invoke-Checked "git" @("config", "core.autocrlf", "false") $suiteSource
Invoke-Checked "git" @("config", "core.eol", "lf") $suiteSource
Invoke-Checked "git" @("fetch", "origin", "+refs/heads/${ExpectedSourceBranch}:refs/remotes/origin/${ExpectedSourceBranch}") $suiteSource
Invoke-Checked "git" @("fetch", "--depth", "1", "origin", $ExpectedDossierCommit) $suiteSource
Invoke-Checked "git" @("checkout", "--detach", $ExpectedDossierCommit) $suiteSource
Assert-NoReparsePoint $suiteSource "DOSSIER_SOURCE_REPARSE_POINT_REFUSED"
if ((Get-GitScalar $suiteSource @("rev-parse", "HEAD")) -ine $ExpectedDossierCommit) {
  throw "DOSSIER_SOURCE_REVISION_DRIFT"
}
$protectedMainHead = Get-GitScalar $suiteSource @("rev-parse", "refs/remotes/origin/$ExpectedSourceBranch")
& git -C $suiteSource merge-base --is-ancestor $ExpectedDossierCommit "refs/remotes/origin/$ExpectedSourceBranch"
$ancestryExitCode = $LASTEXITCODE
if ($ancestryExitCode -eq 1) {
  throw "DOSSIER_SOURCE_NOT_ON_PROTECTED_MAIN: $ExpectedDossierCommit is not reachable from $ExpectedSourceBranch at $protectedMainHead"
}
if ($ancestryExitCode -ne 0) {
  throw "DOSSIER_PROTECTED_MAIN_ANCESTRY_CHECK_FAILED: git exited $ancestryExitCode"
}

$sourceModule = Join-Path $suiteSource ($ModulePathInSuite -replace '/', '\')
$sourceSchema = Join-Path $suiteSource ($SchemaPathInSuite -replace '/', '\')
$sourceManifest = Join-Path $suiteSource ($SourceManifestPathInSuite -replace '/', '\')
foreach ($source in @($sourceModule,$sourceSchema,$sourceManifest)) {
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
    throw "DOSSIER_SOURCE_ARTIFACT_MISSING: $source"
  }
  Assert-NoReparsePoint $source "DOSSIER_SOURCE_REPARSE_POINT_REFUSED"
}
if ((Get-Item -LiteralPath $sourceModule).Length -ne $ModuleLength -or
    (Get-FileHash $sourceModule -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ModuleSha256) {
  throw "DOSSIER_MODULE_IDENTITY_MISMATCH"
}
if ((Get-Item -LiteralPath $sourceSchema).Length -ne $SchemaLength -or
    (Get-FileHash $sourceSchema -Algorithm SHA256).Hash.ToLowerInvariant() -ne $SchemaSha256) {
  throw "DOSSIER_SCHEMA_IDENTITY_MISMATCH"
}
if ((Get-FileHash $sourceManifest -Algorithm SHA256).Hash.ToLowerInvariant() -ne $SourceManifestSha256) {
  throw "DOSSIER_SOURCE_MANIFEST_IDENTITY_MISMATCH"
}
$sourceManifestJson = Get-Content -LiteralPath $sourceManifest -Raw | ConvertFrom-Json
$sourceSchemaEntry = @($sourceManifestJson.artifacts | Where-Object {
  $_.path -ceq $SchemaFilename -and $_.kind -ceq 'schema'
})
if ($sourceManifestJson.schemaVersion -cne '1.0.0' -or
    $sourceManifestJson.contract -cne $Contract -or
    $sourceManifestJson.sourceRepository -cne 'bsvalues/terrafusion_os_1.0' -or
    $sourceManifestJson.sourceSha -cne $ContractSourceSha -or
    $sourceManifestJson.sourceDto.path -cne 'backend/src/TerraFusion.Abstractions/DTOs/DossierEvidenceRegistryReadDto.cs' -or
    $sourceManifestJson.sourceDto.sha256 -cne $SourceDtoSha256 -or
    $sourceSchemaEntry.Count -ne 1 -or $sourceSchemaEntry[0].sha256 -cne $SchemaSha256) {
  throw "DOSSIER_SOURCE_MANIFEST_PROVENANCE_MISMATCH"
}

Copy-Item -LiteralPath $sourceModule -Destination (Join-Path $candidate $ModuleFilename)
Copy-Item -LiteralPath $sourceSchema -Destination (Join-Path $candidate $SchemaFilename)
[ordered]@{
  schemaVersion=1; artifactType="dossier.evidence-registry-read.projection-module@1"; contract=$Contract;
  repository=$ExpectedRepository; sourceBranch=$ExpectedSourceBranch; commit=$ExpectedDossierCommit;
  modulePath=$ModulePathInSuite; moduleFilename=$ModuleFilename; moduleLength=$ModuleLength; moduleSha256=$ModuleSha256;
  schemaPath=$SchemaPathInSuite; schemaFilename=$SchemaFilename; schemaLength=$SchemaLength; schemaSha256=$SchemaSha256;
  sourceManifestPath=$SourceManifestPathInSuite; sourceManifestSha256=$SourceManifestSha256;
  contractSourceSha=$ContractSourceSha; sourceDtoSha256=$SourceDtoSha256;
  transport="local-os-managed-artifact-slot"
} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $candidate "manifest.json") -Encoding utf8
$expectedCandidateNames = @($ModuleFilename,$SchemaFilename,'manifest.json') | Sort-Object
if ($TestOnlyInjectCandidateManifestTamper) {
  $tamperedManifest = Get-Content -LiteralPath (Join-Path $candidate 'manifest.json') -Raw | ConvertFrom-Json
  $tamperedManifest.moduleLength = [string]$ModuleLength
  $tamperedManifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $candidate 'manifest.json') -Encoding utf8
}
if ($TestOnlyInjectCandidateStringArrayTamper) {
  $tamperedManifest = Get-Content -LiteralPath (Join-Path $candidate 'manifest.json') -Raw | ConvertFrom-Json
  $tamperedManifest.repository = @($ExpectedRepository)
  $tamperedManifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $candidate 'manifest.json') -Encoding utf8
}
Assert-ManifestIdentity (Join-Path $candidate 'manifest.json') "DOSSIER_CANDIDATE_MANIFEST_IDENTITY_MISMATCH"
$candidateInventory = Get-ExactArtifactInventory $candidate $expectedCandidateNames "DOSSIER_CANDIDATE_INVENTORY_MISMATCH"
if ((Get-FileHash (Join-Path $candidate $ModuleFilename) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ModuleSha256 -or
    (Get-FileHash (Join-Path $candidate $SchemaFilename) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $SchemaSha256) {
  throw "DOSSIER_CANDIDATE_IDENTITY_MISMATCH"
}

$transactionMutexName = 'Local\TerraFusion.DossierEvidenceRegistryRead.ArtifactSlot'
$transactionMutex = [Threading.Mutex]::new($false, $transactionMutexName)
$transactionLockHeld = $false
try {
  try {
    $transactionLockHeld = $transactionMutex.WaitOne(0)
  } catch [Threading.AbandonedMutexException] {
    $transactionLockHeld = $true
  }
  if (-not $transactionLockHeld) {
    throw "DOSSIER_STAGE_LOCK_UNAVAILABLE: another Dossier staging transaction owns the artifact slot"
  }
  if ($TestOnlyHoldTransactionLockMilliseconds -gt 0) {
    Start-Sleep -Milliseconds $TestOnlyHoldTransactionLockMilliseconds
  }

  $slotPathExists = Test-Path -LiteralPath $ArtifactSlot
  $slotExisted = Test-Path -LiteralPath $ArtifactSlot -PathType Container
  if ($slotPathExists -and -not $slotExisted) { throw "DOSSIER_ARTIFACT_SLOT_INVALID" }
  $previousInventory = if ($slotExisted) { Get-DirectoryFileHashes $ArtifactSlot } else { [ordered]@{} }
  if ($slotExisted) {
    $backupMoved = $false
    try {
      Move-Item -LiteralPath $ArtifactSlot -Destination $backupSlot
      $backupMoved = $true
      if ($TestOnlyInjectFailureDuringBackupVerification) {
        throw "DOSSIER_TEST_INJECTED_BACKUP_VERIFICATION_FAILURE"
      }
      Assert-InventoryEqual (Get-DirectoryFileHashes $backupSlot) $previousInventory "DOSSIER_BACKUP_HASH_MISMATCH"
    } catch {
      $backupFailure = $_
      if (-not $backupMoved) { throw }
      Move-Item -LiteralPath $backupSlot -Destination $ArtifactSlot
      try {
        Assert-InventoryEqual (Get-DirectoryFileHashes $ArtifactSlot) $previousInventory "DOSSIER_BACKUP_RESTORED_UNVERIFIABLE"
      } catch {
        throw "DOSSIER_BACKUP_RESTORED_UNVERIFIABLE: $($_.Exception.Message); original failure: $backupFailure"
      }
      throw "DOSSIER_BACKUP_VALIDATION_FAILED_RESTORED: $backupFailure"
    }
  }

  try {
    if (-not (Test-Path -LiteralPath $artifactParent -PathType Container)) {
      New-Item -ItemType Directory -Path $artifactParent -Force | Out-Null
    }
    Copy-Item -LiteralPath $candidate -Destination $ArtifactSlot -Recurse
    $publishedInventory = Get-ExactArtifactInventory $ArtifactSlot $expectedCandidateNames "DOSSIER_PUBLISHED_INVENTORY_MISMATCH"
    Assert-InventoryEqual $publishedInventory $candidateInventory "DOSSIER_PUBLISHED_CANDIDATE_INVENTORY_MISMATCH"
    if ($publishedInventory[$ModuleFilename] -cne $ModuleSha256 -or
        $publishedInventory[$SchemaFilename] -cne $SchemaSha256) {
      throw "DOSSIER_PUBLISHED_IDENTITY_MISMATCH"
    }
    Assert-ManifestIdentity (Join-Path $ArtifactSlot 'manifest.json') "DOSSIER_PUBLISHED_MANIFEST_MISMATCH"
    if ($TestOnlyInjectFailureAfterPublish) {
      throw "DOSSIER_TEST_INJECTED_PUBLICATION_FAILURE"
    }
  } catch {
    $stageFailure = $_
    $cleanupFailure = $null
    if (Test-Path -LiteralPath $ArtifactSlot) {
      try {
        Remove-Item -LiteralPath $ArtifactSlot -Recurse -Force -ErrorAction Stop
      } catch { $cleanupFailure = $_ }
    }
    if (Test-Path -LiteralPath $ArtifactSlot) {
      if ($slotExisted) {
        throw "DOSSIER_ROLLBACK_BLOCKED_BY_FAILED_PUBLICATION_CLEANUP: $cleanupFailure; original failure: $stageFailure"
      }
      throw "DOSSIER_STAGE_FAILED_PARTIAL_SLOT_REMAINS: $cleanupFailure; original failure: $stageFailure"
    }
    if ($slotExisted) {
      Move-Item -LiteralPath $backupSlot -Destination $ArtifactSlot
      Assert-InventoryEqual (Get-DirectoryFileHashes $ArtifactSlot) $previousInventory "DOSSIER_ROLLBACK_FAILED"
      throw "DOSSIER_STAGE_FAILED_ROLLED_BACK: $stageFailure"
    }
    throw "DOSSIER_STAGE_FAILED_SLOT_REMOVED: $stageFailure"
  }

  [pscustomobject]@{
    artifactType="dossier.evidence-registry-read.projection-module@1";
    suiteRepository=$ExpectedRepository; fetchTransport=$fetchRepository;
    sourceBranch=$ExpectedSourceBranch; protectedMainHead=$protectedMainHead;
    suiteCommit=$ExpectedDossierCommit; contract=$Contract;
    modulePath=$ModulePathInSuite; moduleLength=$ModuleLength; moduleSha256=$ModuleSha256;
    schemaPath=$SchemaPathInSuite; schemaLength=$SchemaLength; schemaSha256=$SchemaSha256;
    sourceManifestSha256=$SourceManifestSha256; contractSourceSha=$ContractSourceSha;
    sourceDtoSha256=$SourceDtoSha256; artifactSlot=$ArtifactSlot;
    manifestPath=(Join-Path $ArtifactSlot 'manifest.json'); runtimeAdopted=$false;
    rollbackSlot=if($slotExisted){$backupSlot}else{$null};
    rollbackHashes=if($slotExisted){$previousInventory}else{$null}
  } | ConvertTo-Json -Depth 5
} finally {
  if ($transactionLockHeld) { $transactionMutex.ReleaseMutex() }
  $transactionMutex.Dispose()
}
