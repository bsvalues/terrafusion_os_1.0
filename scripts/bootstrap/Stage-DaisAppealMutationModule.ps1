<#
.SYNOPSIS
  Stages the exact protected-main Dais appeal-mutation module and frozen schema.

.DESCRIPTION
  Publishes exactly the module, schema, and generated provenance manifest to the ignored
  OS-managed mutation slot. The transaction moves and hash-verifies any prior slot before
  publication and restores it on failure. This script does not activate a runtime.
#>
[CmdletBinding()]
param(
  [string]$DaisRepository = 'https://github.com/bsvalues/terrafusion-dais',
  [string]$ArtifactSlot,
  [string]$BuildRootBase = $env:TEMP,
  [switch]$TestOnlyInjectCandidateManifestTamper,
  [switch]$TestOnlyInjectFailureDuringBackupVerification,
  [switch]$TestOnlyInjectFailureAfterPublish,
  [ValidateRange(0,30000)][int]$TestOnlyHoldTransactionLockMilliseconds = 0
)

$ErrorActionPreference = 'Stop'
$ExpectedDaisCommit = '8a9cfc608bcda835126db2054bb7ba7ecf185275'
$ExpectedRepository = 'bsvalues/terrafusion-dais'
$ExpectedSourceBranch = 'main'
$ArtifactType = 'dais.appeal-mutation.decision-module@1'
$Contract = 'dais.appeal-mutation@1.0.0'
$ModulePathInSuite = 'src/appeal-mutation/decide-dais-appeal-mutation.mjs'
$ModuleFilename = 'decide-dais-appeal-mutation.mjs'
$ModuleLength = 11009
$ModuleSha256 = '779ef37435e2deb8f181b3c34e0712c35829b7a123f047752fc5bf09de331ff2'
$ModuleGitBlob = '1c718ddd351e0f414cf09421d3377b5892938e97'
$SchemaPathInSuite = 'contract-compat/dais.appeal-mutation.v1/dais.appeal-mutation.v1.schema.json'
$SchemaFilename = 'dais.appeal-mutation.v1.schema.json'
$SchemaLength = 7950
$SchemaSha256 = 'db8f1c93a598da7f9c454d5a43c275b849f2de8fc036e9be28c5c1da44432ce2'
$SchemaGitBlob = 'ed8ba582bd8fbe949e7b12f80dd5850e127e7820'
$SourceManifestPathInSuite = 'contract-compat/dais.appeal-mutation.v1/manifest.json'
$SourceManifestLength = 5724
$SourceManifestSha256 = '8f4b6ae6bd445b6a4f563f549e6ffb7d04f65e3d3c981e0556e9436744e61ef8'
$SourceManifestGitBlob = 'd947da54c73f4d741d957b85c81e09ebfe2a522c'
$PublishedManifestSha256 = 'c858e7cd390502bf1461cf7af6302916a7c437f5f4f47b17d379f49af114b825'
$PublishedManifestLength = 1465
$ContractSourceSha = '52744220509a54b6544e0fa193b6d09e8d93c159'
$ContractReviewedHeadSha = '377ed29b84c4f46b623f61a64d7644f911f76db6'
$SourceDtoSha256 = '3c32db475a04cd08dd380b13cfeb9cdd6f793445f67981a009992845727cf843'

$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$expectedArtifactSlot = Join-Path $sovereignRepository '.terrafusion\runtime\dais\appeal-mutation'
$artifactParent = Split-Path -Parent $expectedArtifactSlot
if (-not $ArtifactSlot) { $ArtifactSlot = $expectedArtifactSlot }
$ArtifactSlot = [IO.Path]::GetFullPath($ArtifactSlot)
if ($ArtifactSlot -ine [IO.Path]::GetFullPath($expectedArtifactSlot)) {
  throw "DAIS_MUTATION_ARTIFACT_SLOT_REFUSED: must be $expectedArtifactSlot"
}

function Assert-NoReparsePoint {
  param([string]$Path,[string]$ErrorCode)
  if (-not (Test-Path -LiteralPath $Path)) { return }
  if ((Get-Item -LiteralPath $Path -Force).Attributes.HasFlag([IO.FileAttributes]::ReparsePoint)) {
    throw "${ErrorCode}: reparse point refused at $Path"
  }
}
function Assert-NoReparseAncestors {
  param([string]$Path,[string]$ErrorCode)
  $cursor = [IO.Path]::GetFullPath($Path)
  while ($cursor) {
    Assert-NoReparsePoint $cursor $ErrorCode
    $parent = [IO.Directory]::GetParent($cursor)
    if ($null -eq $parent) { break }
    $cursor = $parent.FullName
  }
}
function Test-PathOverlap {
  param([string]$First,[string]$Second)
  $trim = [char[]]@('\','/')
  $firstFull = [IO.Path]::GetFullPath($First).TrimEnd($trim)
  $secondFull = [IO.Path]::GetFullPath($Second).TrimEnd($trim)
  if ($firstFull.Equals($secondFull,[StringComparison]::OrdinalIgnoreCase)) { return $true }
  $separator = [IO.Path]::DirectorySeparatorChar
  return $firstFull.StartsWith("$secondFull$separator",[StringComparison]::OrdinalIgnoreCase) -or
    $secondFull.StartsWith("$firstFull$separator",[StringComparison]::OrdinalIgnoreCase)
}
function Invoke-Checked {
  param([string]$Command,[string[]]$Arguments,[string]$WorkingDirectory)
  Push-Location $WorkingDirectory
  try {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit code $LASTEXITCODE" }
  } finally { Pop-Location }
}
function Get-GitScalar {
  param([string]$Repository,[string[]]$Arguments)
  $value = & git -c safe.directory=$Repository -C $Repository @Arguments
  if ($LASTEXITCODE -ne 0) { throw "git $($Arguments -join ' ') failed" }
  return ($value -join "`n").Trim()
}
function Test-CanonicalDaisOrigin {
  param([string]$Origin)
  return $Origin -match '^https://github\.com/bsvalues/terrafusion-dais(?:\.git)?/?$' -or
    $Origin -match '^git@github\.com:bsvalues/terrafusion-dais(?:\.git)?/?$' -or
    $Origin -match '^ssh://git@github\.com/bsvalues/terrafusion-dais(?:\.git)?/?$'
}
function Get-DirectoryFileHashes {
  param([string]$Directory)
  $hashes = [ordered]@{}
  if (-not (Test-Path -LiteralPath $Directory -PathType Container)) { return $hashes }
  Assert-NoReparsePoint $Directory 'DAIS_MUTATION_SLOT_REPARSE_POINT_REFUSED'
  foreach ($entry in Get-ChildItem -LiteralPath $Directory -Force -Recurse) {
    if ($entry.Attributes.HasFlag([IO.FileAttributes]::ReparsePoint)) {
      throw "DAIS_MUTATION_SLOT_REPARSE_POINT_REFUSED: $($entry.FullName)"
    }
  }
  foreach ($file in Get-ChildItem -LiteralPath $Directory -File -Recurse | Sort-Object FullName) {
    $relative = [IO.Path]::GetRelativePath($Directory,$file.FullName).Replace('\','/')
    $hashes[$relative] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  }
  return $hashes
}
function Assert-InventoryEqual {
  param($Actual,$Expected,[string]$ErrorCode)
  if (($Actual | ConvertTo-Json -Compress) -cne ($Expected | ConvertTo-Json -Compress)) {
    throw $ErrorCode
  }
}
function Get-ExactInventory {
  param([string]$Directory,[string[]]$ExpectedNames,[string]$ErrorCode)
  Assert-NoReparseAncestors $Directory "${ErrorCode}_REPARSE_POINT"
  $entries = @(Get-ChildItem -LiteralPath $Directory -Force)
  if (@($entries | Where-Object { $_.PSIsContainer -or $_.Attributes.HasFlag([IO.FileAttributes]::ReparsePoint) }).Count) {
    throw "${ErrorCode}: only regular top-level files are allowed"
  }
  if ((@($entries.Name | Sort-Object) -join '|') -cne (@($ExpectedNames | Sort-Object) -join '|')) {
    throw "${ErrorCode}: exact file set mismatch"
  }
  return Get-DirectoryFileHashes $Directory
}
function Assert-FileIdentity {
  param([string]$Path,[long]$Length,[string]$Sha256,[string]$GitBlob,[string]$Repository)
  if ((Get-Item -LiteralPath $Path).Length -ne $Length) { throw "DAIS_MUTATION_SOURCE_LENGTH_MISMATCH: $Path" }
  if ((Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() -cne $Sha256) {
    throw "DAIS_MUTATION_SOURCE_HASH_MISMATCH: $Path"
  }
  if ((Get-GitScalar $Repository @('hash-object',$Path)) -cne $GitBlob) {
    throw "DAIS_MUTATION_SOURCE_BLOB_MISMATCH: $Path"
  }
}
function Get-Constant {
  param([string]$Source,[string]$Name,[string]$Expected)
  $escaped = [regex]::Escape($Name)
  $pattern = '(?ms)public\s+const\s+(?:string|int)\s+'+$escaped+'\s*=\s*(?:"([^"]+)"|([0-9]+))\s*;'
  $matches = [regex]::Matches($Source,$pattern)
  if ($matches.Count -ne 1) { throw "DAIS_MUTATION_IDENTITY_DECLARATION_INVALID: $Name" }
  $actual = if ($matches[0].Groups[1].Success) { $matches[0].Groups[1].Value } else { $matches[0].Groups[2].Value }
  if ($actual -cne [string]$Expected) { throw "DAIS_MUTATION_IDENTITY_DISAGREEMENT: $Name" }
}
function Assert-PublishedManifest {
  param([string]$Path,[string]$ErrorCode)
  $manifest = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
  $expectedNames = @(
    'artifactType','commit','contract','contractReviewedHeadSha','contractSourceSha','moduleFilename',
    'moduleGitBlob','moduleLength','modulePath','moduleSha256','repository','schemaFilename',
    'schemaGitBlob','schemaLength','schemaPath','schemaSha256','schemaVersion','sourceBranch',
    'sourceDtoSha256','sourceManifestGitBlob','sourceManifestLength','sourceManifestPath',
    'sourceManifestSha256','transport'
  ) | Sort-Object
  $actualNames = @($manifest.psobject.Properties.Name | Sort-Object)
  $stringNames = @(
    'artifactType','commit','contract','contractReviewedHeadSha','contractSourceSha','moduleFilename',
    'moduleGitBlob','modulePath','moduleSha256','repository','schemaFilename','schemaGitBlob',
    'schemaPath','schemaSha256','sourceBranch','sourceDtoSha256','sourceManifestGitBlob',
    'sourceManifestPath','sourceManifestSha256','transport'
  )
  $invalidStringTypes = @($stringNames | Where-Object {
    $manifest.psobject.Properties[$_].Value -isnot [string]
  })
  if (($actualNames -join '|') -cne ($expectedNames -join '|') -or
      $invalidStringTypes.Count -ne 0 -or
      $manifest.schemaVersion -isnot [long] -or
      $manifest.moduleLength -isnot [long] -or
      $manifest.schemaLength -isnot [long] -or
      $manifest.sourceManifestLength -isnot [long] -or
      $manifest.schemaVersion -ne 1 -or
      $manifest.artifactType -cne $ArtifactType -or $manifest.contract -cne $Contract -or
      $manifest.repository -cne $ExpectedRepository -or $manifest.sourceBranch -cne $ExpectedSourceBranch -or
      $manifest.commit -cne $ExpectedDaisCommit -or $manifest.modulePath -cne $ModulePathInSuite -or
      $manifest.moduleFilename -cne $ModuleFilename -or $manifest.moduleLength -ne $ModuleLength -or
      $manifest.moduleSha256 -cne $ModuleSha256 -or $manifest.moduleGitBlob -cne $ModuleGitBlob -or
      $manifest.schemaPath -cne $SchemaPathInSuite -or $manifest.schemaFilename -cne $SchemaFilename -or
      $manifest.schemaLength -ne $SchemaLength -or $manifest.schemaSha256 -cne $SchemaSha256 -or
      $manifest.schemaGitBlob -cne $SchemaGitBlob -or
      $manifest.sourceManifestPath -cne $SourceManifestPathInSuite -or
      $manifest.sourceManifestLength -ne $SourceManifestLength -or
      $manifest.sourceManifestSha256 -cne $SourceManifestSha256 -or
      $manifest.sourceManifestGitBlob -cne $SourceManifestGitBlob -or
      $manifest.contractSourceSha -cne $ContractSourceSha -or
      $manifest.contractReviewedHeadSha -cne $ContractReviewedHeadSha -or
      $manifest.sourceDtoSha256 -cne $SourceDtoSha256 -or
      $manifest.transport -cne 'local-os-managed-artifact-slot') { throw $ErrorCode }
}

$optionsFile = Join-Path $sovereignRepository 'backend\src\TerraFusion.API\Configuration\DaisAppealMutationOptions.cs'
$optionsSource = Get-Content -LiteralPath $optionsFile -Raw
@{
  ExpectedArtifactType=$ArtifactType;ExpectedContract=$Contract;ExpectedRepository=$ExpectedRepository;
  ExpectedSourceBranch=$ExpectedSourceBranch;ExpectedCommit=$ExpectedDaisCommit;
  ExpectedModulePath=$ModulePathInSuite;ExpectedModuleFilename=$ModuleFilename;
  ExpectedModuleSha256=$ModuleSha256;ExpectedModuleGitBlob=$ModuleGitBlob;ExpectedModuleLength=$ModuleLength;
  ExpectedSchemaPath=$SchemaPathInSuite;ExpectedSchemaFilename=$SchemaFilename;
  ExpectedSchemaSha256=$SchemaSha256;ExpectedSchemaGitBlob=$SchemaGitBlob;ExpectedSchemaLength=$SchemaLength;
  ExpectedSourceManifestPath=$SourceManifestPathInSuite;ExpectedSourceManifestSha256=$SourceManifestSha256;
  ExpectedSourceManifestGitBlob=$SourceManifestGitBlob;ExpectedSourceManifestLength=$SourceManifestLength;
  ExpectedPublishedManifestSha256=$PublishedManifestSha256;ExpectedPublishedManifestLength=$PublishedManifestLength;
  ExpectedContractSourceSha=$ContractSourceSha;ExpectedContractReviewedHeadSha=$ContractReviewedHeadSha;
  ExpectedSourceDtoSha256=$SourceDtoSha256;ExpectedTransport='local-os-managed-artifact-slot';
  ArtifactSlotRelativePath='.terrafusion/runtime/dais/appeal-mutation'
}.GetEnumerator() | ForEach-Object { Get-Constant $optionsSource $_.Key $_.Value }

Assert-NoReparseAncestors $optionsFile 'DAIS_MUTATION_OPTIONS_REPARSE_POINT_REFUSED'
Assert-NoReparseAncestors $ArtifactSlot 'DAIS_MUTATION_ARTIFACT_SLOT_REPARSE_POINT_REFUSED'
Assert-NoReparseAncestors $BuildRootBase 'DAIS_MUTATION_BUILD_ROOT_REPARSE_POINT_REFUSED'
if ([IO.Path]::GetPathRoot($ArtifactSlot) -ine [IO.Path]::GetPathRoot([IO.Path]::GetFullPath($BuildRootBase))) {
  throw 'DAIS_MUTATION_BUILD_ROOT_VOLUME_MISMATCH'
}
if (Test-PathOverlap $BuildRootBase $ArtifactSlot) { throw 'DAIS_MUTATION_BUILD_ROOT_SLOT_OVERLAP_REFUSED' }
if (Test-PathOverlap $BuildRootBase $sovereignRepository) { throw 'DAIS_MUTATION_BUILD_ROOT_REPOSITORY_OVERLAP_REFUSED' }

$proofRoot = Join-Path $BuildRootBase ([DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')+'-'+[Guid]::NewGuid().ToString('N'))
$suiteSource = Join-Path $proofRoot 'dais-source'
$candidate = Join-Path $proofRoot 'candidate-artifact'
$backupSlot = Join-Path $proofRoot 'previous-artifact'
New-Item -ItemType Directory -Path $proofRoot,$candidate -Force | Out-Null

try {
$fetchRepository = $DaisRepository
$declaredOrigin = if (Test-Path -LiteralPath $DaisRepository -PathType Container) {
  $fetchRepository = (Resolve-Path -LiteralPath $DaisRepository).Path
  Assert-NoReparseAncestors $fetchRepository 'DAIS_MUTATION_SOURCE_REPARSE_POINT_REFUSED'
  Get-GitScalar $fetchRepository @('remote','get-url','origin')
} else { $DaisRepository }
if (-not (Test-CanonicalDaisOrigin $declaredOrigin)) {
  throw "DAIS_MUTATION_REPOSITORY_IDENTITY_MISMATCH: $declaredOrigin"
}
$cloneArguments = if (Test-Path -LiteralPath $fetchRepository -PathType Container) {
  @('-c',"safe.directory=$fetchRepository",'clone','--no-checkout','--filter=blob:none',$fetchRepository,$suiteSource)
} else { @('clone','--no-checkout','--filter=blob:none',$fetchRepository,$suiteSource) }
Invoke-Checked git $cloneArguments $proofRoot
Invoke-Checked git @('config','core.autocrlf','false') $suiteSource
Invoke-Checked git @('config','core.eol','lf') $suiteSource
Invoke-Checked git @('sparse-checkout','init','--no-cone') $suiteSource
Invoke-Checked git @(
  'sparse-checkout','set','--no-cone',
  $ModulePathInSuite,$SchemaPathInSuite,$SourceManifestPathInSuite
) $suiteSource
Invoke-Checked git @('fetch','origin',"+refs/heads/${ExpectedSourceBranch}:refs/remotes/origin/${ExpectedSourceBranch}") $suiteSource
Invoke-Checked git @('fetch','--depth','1','origin',$ExpectedDaisCommit) $suiteSource
Invoke-Checked git @('checkout','--detach',$ExpectedDaisCommit) $suiteSource
if ((Get-GitScalar $suiteSource @('rev-parse','HEAD')) -cne $ExpectedDaisCommit) { throw 'DAIS_MUTATION_SOURCE_REVISION_DRIFT' }
$protectedMainHead = Get-GitScalar $suiteSource @('rev-parse',"refs/remotes/origin/$ExpectedSourceBranch")
& git -C $suiteSource merge-base --is-ancestor $ExpectedDaisCommit "refs/remotes/origin/$ExpectedSourceBranch"
if ($LASTEXITCODE -eq 1) { throw 'DAIS_MUTATION_SOURCE_NOT_ON_PROTECTED_MAIN' }
if ($LASTEXITCODE -ne 0) { throw 'DAIS_MUTATION_PROTECTED_MAIN_ANCESTRY_CHECK_FAILED' }

$sourceModule = Join-Path $suiteSource ($ModulePathInSuite.Replace('/','\'))
$sourceSchema = Join-Path $suiteSource ($SchemaPathInSuite.Replace('/','\'))
$sourceManifest = Join-Path $suiteSource ($SourceManifestPathInSuite.Replace('/','\'))
Assert-FileIdentity $sourceModule $ModuleLength $ModuleSha256 $ModuleGitBlob $suiteSource
Assert-FileIdentity $sourceSchema $SchemaLength $SchemaSha256 $SchemaGitBlob $suiteSource
Assert-FileIdentity $sourceManifest $SourceManifestLength $SourceManifestSha256 $SourceManifestGitBlob $suiteSource
$sourceManifestJson = Get-Content -LiteralPath $sourceManifest -Raw | ConvertFrom-Json
$schemaEntry = @($sourceManifestJson.artifacts | Where-Object { $_.path -ceq $SchemaFilename -and $_.kind -ceq 'schema' })
if ($sourceManifestJson.contract -cne $Contract -or
    $sourceManifestJson.sourceRepository -cne 'bsvalues/terrafusion_os_1.0' -or
    $sourceManifestJson.sourceSha -cne $ContractSourceSha -or
    $sourceManifestJson.sourcePrHeadSha -cne $ContractReviewedHeadSha -or
    $sourceManifestJson.publicationStatus -cne 'planned_not_published' -or
    $sourceManifestJson.sourceDto.sha256 -cne $SourceDtoSha256 -or
    $schemaEntry.Count -ne 1 -or $schemaEntry[0].sha256 -cne $SchemaSha256) {
  throw 'DAIS_MUTATION_SOURCE_MANIFEST_PROVENANCE_MISMATCH'
}

Copy-Item -LiteralPath $sourceModule -Destination (Join-Path $candidate $ModuleFilename)
Copy-Item -LiteralPath $sourceSchema -Destination (Join-Path $candidate $SchemaFilename)
[ordered]@{
  schemaVersion=1;artifactType=$ArtifactType;contract=$Contract;repository=$ExpectedRepository;
  sourceBranch=$ExpectedSourceBranch;commit=$ExpectedDaisCommit;
  modulePath=$ModulePathInSuite;moduleFilename=$ModuleFilename;moduleLength=$ModuleLength;
  moduleSha256=$ModuleSha256;moduleGitBlob=$ModuleGitBlob;
  schemaPath=$SchemaPathInSuite;schemaFilename=$SchemaFilename;schemaLength=$SchemaLength;
  schemaSha256=$SchemaSha256;schemaGitBlob=$SchemaGitBlob;
  sourceManifestPath=$SourceManifestPathInSuite;sourceManifestLength=$SourceManifestLength;
  sourceManifestSha256=$SourceManifestSha256;sourceManifestGitBlob=$SourceManifestGitBlob;
  contractSourceSha=$ContractSourceSha;contractReviewedHeadSha=$ContractReviewedHeadSha;
  sourceDtoSha256=$SourceDtoSha256;transport='local-os-managed-artifact-slot'
} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $candidate 'manifest.json') -Encoding utf8
if ($TestOnlyInjectCandidateManifestTamper) {
  $tamper = Get-Content -LiteralPath (Join-Path $candidate 'manifest.json') -Raw | ConvertFrom-Json
  $tamper.moduleLength = [string]$ModuleLength
  $tamper | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $candidate 'manifest.json') -Encoding utf8
}
Assert-PublishedManifest (Join-Path $candidate 'manifest.json') 'DAIS_MUTATION_CANDIDATE_MANIFEST_IDENTITY_MISMATCH'
$candidateManifest = Get-Item -LiteralPath (Join-Path $candidate 'manifest.json')
$candidateManifestSha256 = (Get-FileHash -LiteralPath $candidateManifest.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
if ($candidateManifest.Length -ne $PublishedManifestLength -or $candidateManifestSha256 -cne $PublishedManifestSha256) {
  throw "DAIS_MUTATION_CANDIDATE_PUBLISHED_MANIFEST_BYTE_IDENTITY_MISMATCH: expected $PublishedManifestLength/$PublishedManifestSha256, found $($candidateManifest.Length)/$candidateManifestSha256"
}
$expectedNames = @($ModuleFilename,$SchemaFilename,'manifest.json')
$candidateInventory = Get-ExactInventory $candidate $expectedNames 'DAIS_MUTATION_CANDIDATE_INVENTORY_MISMATCH'

$transactionMutex = [Threading.Mutex]::new($false,'Local\TerraFusion.DaisAppealMutation.ArtifactSlot')
$transactionLockHeld = $false
try {
  try { $transactionLockHeld = $transactionMutex.WaitOne(0) }
  catch [Threading.AbandonedMutexException] { $transactionLockHeld = $true }
  if (-not $transactionLockHeld) { throw 'DAIS_MUTATION_STAGE_LOCK_UNAVAILABLE' }
  if ($TestOnlyHoldTransactionLockMilliseconds) { Start-Sleep -Milliseconds $TestOnlyHoldTransactionLockMilliseconds }

  $slotPathExists = Test-Path -LiteralPath $ArtifactSlot
  $slotExisted = Test-Path -LiteralPath $ArtifactSlot -PathType Container
  if ($slotPathExists -and -not $slotExisted) { throw 'DAIS_MUTATION_ARTIFACT_SLOT_INVALID' }
  $previousInventory = if ($slotExisted) { Get-DirectoryFileHashes $ArtifactSlot } else { [ordered]@{} }
  if ($slotExisted) {
    $backupMoved = $false
    try {
      Move-Item -LiteralPath $ArtifactSlot -Destination $backupSlot
      $backupMoved = $true
      if ($TestOnlyInjectFailureDuringBackupVerification) { throw 'DAIS_MUTATION_TEST_INJECTED_BACKUP_VERIFICATION_FAILURE' }
      Assert-InventoryEqual (Get-DirectoryFileHashes $backupSlot) $previousInventory 'DAIS_MUTATION_BACKUP_HASH_MISMATCH'
    } catch {
      $backupFailure = $_
      if (-not $backupMoved) { throw }
      Move-Item -LiteralPath $backupSlot -Destination $ArtifactSlot
      Assert-InventoryEqual (Get-DirectoryFileHashes $ArtifactSlot) $previousInventory 'DAIS_MUTATION_BACKUP_RESTORED_UNVERIFIABLE'
      throw "DAIS_MUTATION_BACKUP_VALIDATION_FAILED_RESTORED: $backupFailure"
    }
  }
  try {
    if (-not (Test-Path -LiteralPath $artifactParent -PathType Container)) {
      New-Item -ItemType Directory -Path $artifactParent -Force | Out-Null
    }
    Copy-Item -LiteralPath $candidate -Destination $ArtifactSlot -Recurse
    $publishedInventory = Get-ExactInventory $ArtifactSlot $expectedNames 'DAIS_MUTATION_PUBLISHED_INVENTORY_MISMATCH'
    Assert-InventoryEqual $publishedInventory $candidateInventory 'DAIS_MUTATION_PUBLISHED_CANDIDATE_INVENTORY_MISMATCH'
    Assert-PublishedManifest (Join-Path $ArtifactSlot 'manifest.json') 'DAIS_MUTATION_PUBLISHED_MANIFEST_MISMATCH'
    if ($TestOnlyInjectFailureAfterPublish) { throw 'DAIS_MUTATION_TEST_INJECTED_PUBLICATION_FAILURE' }
  } catch {
    $stageFailure = $_
    $cleanupFailure = $null
    if (Test-Path -LiteralPath $ArtifactSlot) {
      try { Remove-Item -LiteralPath $ArtifactSlot -Recurse -Force -ErrorAction Stop }
      catch { $cleanupFailure = $_ }
    }
    if (Test-Path -LiteralPath $ArtifactSlot) {
      if ($slotExisted) {
        throw "DAIS_MUTATION_ROLLBACK_BLOCKED_BY_FAILED_PUBLICATION_CLEANUP: $cleanupFailure; original failure: $stageFailure"
      }
      throw "DAIS_MUTATION_STAGE_FAILED_PARTIAL_SLOT_REMAINS: $cleanupFailure; original failure: $stageFailure"
    }
    if ($slotExisted) {
      Move-Item -LiteralPath $backupSlot -Destination $ArtifactSlot
      Assert-InventoryEqual (Get-DirectoryFileHashes $ArtifactSlot) $previousInventory 'DAIS_MUTATION_ROLLBACK_FAILED'
      throw "DAIS_MUTATION_STAGE_FAILED_ROLLED_BACK: $stageFailure"
    }
    throw "DAIS_MUTATION_STAGE_FAILED_SLOT_REMOVED: $stageFailure"
  }

  $manifestFile = Get-Item -LiteralPath (Join-Path $ArtifactSlot 'manifest.json')
  [pscustomobject]@{
    artifactType=$ArtifactType;suiteRepository=$ExpectedRepository;fetchTransport=$fetchRepository;
    sourceBranch=$ExpectedSourceBranch;protectedMainHead=$protectedMainHead;suiteCommit=$ExpectedDaisCommit;
    contract=$Contract;modulePath=$ModulePathInSuite;moduleLength=$ModuleLength;moduleSha256=$ModuleSha256;
    moduleGitBlob=$ModuleGitBlob;schemaPath=$SchemaPathInSuite;schemaLength=$SchemaLength;
    schemaSha256=$SchemaSha256;schemaGitBlob=$SchemaGitBlob;sourceManifestLength=$SourceManifestLength;
    sourceManifestSha256=$SourceManifestSha256;sourceManifestGitBlob=$SourceManifestGitBlob;
    artifactSlot=$ArtifactSlot;manifestPath=$manifestFile.FullName;
    publishedManifestSha256=(Get-FileHash -LiteralPath $manifestFile.FullName -Algorithm SHA256).Hash.ToLowerInvariant();
    publishedManifestLength=$manifestFile.Length;
    rollbackSlot=if($slotExisted){$backupSlot}else{$null};
    rollbackHashes=if($slotExisted){$previousInventory}else{$null}
  } | ConvertTo-Json -Depth 6
} finally {
  if ($transactionLockHeld) { $transactionMutex.ReleaseMutex() }
  $transactionMutex.Dispose()
}
} finally {
  # Source and candidate data are always ephemeral. A previous-artifact directory is deliberately
  # retained when present because it is the rollback slot returned to the operator.
  foreach ($ephemeralPath in @($suiteSource,$candidate)) {
    if (Test-Path -LiteralPath $ephemeralPath) {
      Remove-Item -LiteralPath $ephemeralPath -Recurse -Force -ErrorAction Stop
    }
  }
  if ((Test-Path -LiteralPath $proofRoot -PathType Container) -and
      @(Get-ChildItem -LiteralPath $proofRoot -Force).Count -eq 0) {
    Remove-Item -LiteralPath $proofRoot -Force -ErrorAction Stop
  }
}
