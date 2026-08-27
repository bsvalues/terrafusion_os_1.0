<#
.SYNOPSIS
  Stages the exact protected-main Dossier mutation-decision module and frozen schema.

.DESCRIPTION
  Publishes exactly the module, schema, and generated provenance manifest to the ignored
  OS-managed mutation slot. The transaction moves and hash-verifies any prior slot before
  publication and restores it on failure. This script performs no runtime adoption.

  The exact WO-SR-011E reviewed tree is protected on Dossier main and all source and generated
  manifest identities are pinned below.
#>
[CmdletBinding()]
param(
  [string]$DossierRepository = 'https://github.com/bsvalues/terrafusion-dossier',
  [string]$ArtifactSlot,
  [string]$BuildRootBase = $env:TEMP,
  [string]$EnvironmentName = 'Development',
  [switch]$TestOnlyInjectCandidateManifestTamper,
  [switch]$TestOnlyInjectFailureDuringBackupVerification,
  [switch]$TestOnlyInjectFailureAfterPublish,
  [ValidateRange(0,30000)][int]$TestOnlyHoldTransactionLockMilliseconds = 0
)

$ErrorActionPreference = 'Stop'

$ExpectedDossierCommit = '2c709fe2286b5c1e6bde43fcbc2a35111a456092'
$PublishedManifestSha256 = '425d36d660ed2d46616a645d014dfa2906cfbac424b4ec0a6d7692ec43ba2716'
$PublishedManifestLength = 1493

$ExpectedRepository = 'bsvalues/terrafusion-dossier'
$ExpectedSourceBranch = 'main'
$ArtifactType = 'dossier.mutation-decision.decision-module@1'
$Contract = 'dossier.mutation-decision@1.0.0'
$ModulePathInSuite = 'src/mutation-decision/decide-dossier-mutation.mjs'
$ModuleFilename = 'decide-dossier-mutation.mjs'
$ModuleLength = 18366
$ModuleSha256 = 'b314d94ac5cd1ed88d7c841f8a87d3263e7a8adf21c4d5d465003c015c66f277'
$ModuleGitBlob = 'c9080b4fac4bb6abc42cfa870e2c36df1ddac6fc'
$SchemaPathInSuite = 'contract-compat/dossier.mutation-decision.v1/dossier.mutation-decision.v1.schema.json'
$SchemaFilename = 'dossier.mutation-decision.v1.schema.json'
$SchemaLength = 18611
$SchemaSha256 = '48db4388e76c91ca10e2caad54c814e0eb4fee7908e219e4186a3823d30e62a3'
$SchemaGitBlob = '42fb0ce560a407ccee27ffd55f3d074dac182243'
$SourceManifestPathInSuite = 'contract-compat/dossier.mutation-decision.v1/manifest.json'
$SourceManifestLength = 6921
$SourceManifestSha256 = 'dd9dfd1f0d6e31689ebbc90e2e7f1674be55b54eff433ec15d041b565d4f2444'
$SourceManifestGitBlob = 'fa128c254b38366133d5017e50e7c7226f37401f'
$ContractSourceSha = '7cb96bf2ea5efea7caccae6d6e8c9f81f672412e'
$ContractReviewedHeadSha = '285c458e66d47c109b31ee6b67a82b9ce24b8f55'
$SourceDtoSha256 = '58919613fb6da88763cfa12113c3950790c6daa8526ac7151c569320f3258f9a'

$allowedEnvironments = @('Development','Test','Testing','CI','Local')
if (-not ($allowedEnvironments -icontains $EnvironmentName)) {
  throw "DOSSIER_MUTATION_PRODUCTION_STAGE_REFUSED: received $EnvironmentName"
}

$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$expectedArtifactSlot = Join-Path $sovereignRepository '.terrafusion\runtime\dossier\mutation-decision'
$artifactParent = Split-Path -Parent $expectedArtifactSlot
if (-not $ArtifactSlot) { $ArtifactSlot = $expectedArtifactSlot }
$ArtifactSlot = [IO.Path]::GetFullPath($ArtifactSlot)
if ($ArtifactSlot -ine [IO.Path]::GetFullPath($expectedArtifactSlot)) {
  throw "DOSSIER_MUTATION_ARTIFACT_SLOT_REFUSED: must be $expectedArtifactSlot"
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
  Assert-NoReparsePoint $Directory 'DOSSIER_MUTATION_SLOT_REPARSE_POINT_REFUSED'
  foreach ($entry in Get-ChildItem -LiteralPath $Directory -Force -Recurse) {
    if ($entry.Attributes.HasFlag([IO.FileAttributes]::ReparsePoint)) {
      throw "DOSSIER_MUTATION_SLOT_REPARSE_POINT_REFUSED: $($entry.FullName)"
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
  if ((Get-Item -LiteralPath $Path).Length -ne $Length) { throw "DOSSIER_MUTATION_SOURCE_LENGTH_MISMATCH: $Path" }
  if ((Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() -cne $Sha256) {
    throw "DOSSIER_MUTATION_SOURCE_HASH_MISMATCH: $Path"
  }
  if ((Get-GitScalar $Repository @('hash-object',$Path)) -cne $GitBlob) {
    throw "DOSSIER_MUTATION_SOURCE_BLOB_MISMATCH: $Path"
  }
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
  $stringNames = @($expectedNames | Where-Object { $_ -notin @('schemaVersion','moduleLength','schemaLength','sourceManifestLength') })
  $invalidStringTypes = @($stringNames | Where-Object { $manifest.psobject.Properties[$_].Value -isnot [string] })
  if (($actualNames -join '|') -cne ($expectedNames -join '|') -or $invalidStringTypes.Count -ne 0 -or
      $manifest.schemaVersion -isnot [long] -or $manifest.moduleLength -isnot [long] -or
      $manifest.schemaLength -isnot [long] -or $manifest.sourceManifestLength -isnot [long] -or
      $manifest.schemaVersion -ne 1 -or $manifest.artifactType -cne $ArtifactType -or
      $manifest.contract -cne $Contract -or $manifest.repository -cne $ExpectedRepository -or
      $manifest.sourceBranch -cne $ExpectedSourceBranch -or $manifest.commit -cne $ExpectedDossierCommit -or
      $manifest.modulePath -cne $ModulePathInSuite -or $manifest.moduleFilename -cne $ModuleFilename -or
      $manifest.moduleLength -ne $ModuleLength -or $manifest.moduleSha256 -cne $ModuleSha256 -or
      $manifest.moduleGitBlob -cne $ModuleGitBlob -or $manifest.schemaPath -cne $SchemaPathInSuite -or
      $manifest.schemaFilename -cne $SchemaFilename -or $manifest.schemaLength -ne $SchemaLength -or
      $manifest.schemaSha256 -cne $SchemaSha256 -or $manifest.schemaGitBlob -cne $SchemaGitBlob -or
      $manifest.sourceManifestPath -cne $SourceManifestPathInSuite -or
      $manifest.sourceManifestLength -ne $SourceManifestLength -or
      $manifest.sourceManifestSha256 -cne $SourceManifestSha256 -or
      $manifest.sourceManifestGitBlob -cne $SourceManifestGitBlob -or
      $manifest.contractSourceSha -cne $ContractSourceSha -or
      $manifest.contractReviewedHeadSha -cne $ContractReviewedHeadSha -or
      $manifest.sourceDtoSha256 -cne $SourceDtoSha256 -or
      $manifest.transport -cne 'local-os-managed-artifact-slot') { throw $ErrorCode }
}

Assert-NoReparseAncestors $ArtifactSlot 'DOSSIER_MUTATION_ARTIFACT_SLOT_REPARSE_POINT_REFUSED'
Assert-NoReparseAncestors $BuildRootBase 'DOSSIER_MUTATION_BUILD_ROOT_REPARSE_POINT_REFUSED'
if ([IO.Path]::GetPathRoot($ArtifactSlot) -ine [IO.Path]::GetPathRoot([IO.Path]::GetFullPath($BuildRootBase))) {
  throw 'DOSSIER_MUTATION_BUILD_ROOT_VOLUME_MISMATCH'
}
if (Test-PathOverlap $BuildRootBase $ArtifactSlot) { throw 'DOSSIER_MUTATION_BUILD_ROOT_SLOT_OVERLAP_REFUSED' }
if (Test-PathOverlap $BuildRootBase $sovereignRepository) { throw 'DOSSIER_MUTATION_BUILD_ROOT_REPOSITORY_OVERLAP_REFUSED' }

$proofRoot = Join-Path $BuildRootBase ([DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')+'-'+[Guid]::NewGuid().ToString('N'))
$suiteSource = Join-Path $proofRoot 'dossier-source'
$candidate = Join-Path $proofRoot 'candidate-artifact'
$backupSlot = Join-Path $proofRoot 'previous-artifact'
New-Item -ItemType Directory -Path $proofRoot,$candidate -Force | Out-Null

try {
  $fetchRepository = $DossierRepository
  $declaredOrigin = if (Test-Path -LiteralPath $DossierRepository -PathType Container) {
    $fetchRepository = (Resolve-Path -LiteralPath $DossierRepository).Path
    Assert-NoReparseAncestors $fetchRepository 'DOSSIER_MUTATION_SOURCE_REPARSE_POINT_REFUSED'
    Get-GitScalar $fetchRepository @('remote','get-url','origin')
  } else { $DossierRepository }
  if (-not (Test-CanonicalDossierOrigin $declaredOrigin)) {
    throw "DOSSIER_MUTATION_REPOSITORY_IDENTITY_MISMATCH: $declaredOrigin"
  }
  $cloneArguments = if (Test-Path -LiteralPath $fetchRepository -PathType Container) {
    @('-c',"safe.directory=$fetchRepository",'clone','--no-checkout','--filter=blob:none',$fetchRepository,$suiteSource)
  } else { @('clone','--no-checkout','--filter=blob:none',$fetchRepository,$suiteSource) }
  Invoke-Checked git $cloneArguments $proofRoot
  Invoke-Checked git @('config','core.longpaths','true') $suiteSource
  Invoke-Checked git @('config','core.autocrlf','false') $suiteSource
  Invoke-Checked git @('config','core.eol','lf') $suiteSource
  Invoke-Checked git @('sparse-checkout','init','--no-cone') $suiteSource
  Invoke-Checked git @('sparse-checkout','set','--no-cone',$ModulePathInSuite,$SchemaPathInSuite,$SourceManifestPathInSuite) $suiteSource
  Invoke-Checked git @('fetch','origin',"+refs/heads/${ExpectedSourceBranch}:refs/remotes/origin/${ExpectedSourceBranch}") $suiteSource
  Invoke-Checked git @('fetch','--depth','1','origin',$ExpectedDossierCommit) $suiteSource
  Invoke-Checked git @('checkout','--detach',$ExpectedDossierCommit) $suiteSource
  if ((Get-GitScalar $suiteSource @('rev-parse','HEAD')) -cne $ExpectedDossierCommit) { throw 'DOSSIER_MUTATION_SOURCE_REVISION_DRIFT' }
  $protectedMainHead = Get-GitScalar $suiteSource @('rev-parse',"refs/remotes/origin/$ExpectedSourceBranch")
  & git -C $suiteSource merge-base --is-ancestor $ExpectedDossierCommit "refs/remotes/origin/$ExpectedSourceBranch"
  if ($LASTEXITCODE -eq 1) { throw 'DOSSIER_MUTATION_SOURCE_NOT_ON_PROTECTED_MAIN' }
  if ($LASTEXITCODE -ne 0) { throw 'DOSSIER_MUTATION_PROTECTED_MAIN_ANCESTRY_CHECK_FAILED' }

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
    throw 'DOSSIER_MUTATION_SOURCE_MANIFEST_PROVENANCE_MISMATCH'
  }

  Copy-Item -LiteralPath $sourceModule -Destination (Join-Path $candidate $ModuleFilename)
  Copy-Item -LiteralPath $sourceSchema -Destination (Join-Path $candidate $SchemaFilename)
  [ordered]@{
    schemaVersion=1;artifactType=$ArtifactType;contract=$Contract;repository=$ExpectedRepository;
    sourceBranch=$ExpectedSourceBranch;commit=$ExpectedDossierCommit;
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
  Assert-PublishedManifest (Join-Path $candidate 'manifest.json') 'DOSSIER_MUTATION_CANDIDATE_MANIFEST_IDENTITY_MISMATCH'
  $candidateManifest = Get-Item -LiteralPath (Join-Path $candidate 'manifest.json')
  $candidateManifestSha256 = (Get-FileHash -LiteralPath $candidateManifest.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($candidateManifest.Length -ne $PublishedManifestLength -or $candidateManifestSha256 -cne $PublishedManifestSha256) {
    throw 'DOSSIER_MUTATION_CANDIDATE_PUBLISHED_MANIFEST_BYTE_IDENTITY_MISMATCH'
  }
  $expectedNames = @($ModuleFilename,$SchemaFilename,'manifest.json')
  $candidateInventory = Get-ExactInventory $candidate $expectedNames 'DOSSIER_MUTATION_CANDIDATE_INVENTORY_MISMATCH'

  $transactionMutex = [Threading.Mutex]::new($false,'Local\TerraFusion.DossierMutationDecision.ArtifactSlot')
  $transactionLockHeld = $false
  try {
    try { $transactionLockHeld = $transactionMutex.WaitOne(0) }
    catch [Threading.AbandonedMutexException] { $transactionLockHeld = $true }
    if (-not $transactionLockHeld) { throw 'DOSSIER_MUTATION_STAGE_LOCK_UNAVAILABLE' }
    if ($TestOnlyHoldTransactionLockMilliseconds) { Start-Sleep -Milliseconds $TestOnlyHoldTransactionLockMilliseconds }

    $slotPathExists = Test-Path -LiteralPath $ArtifactSlot
    $slotExisted = Test-Path -LiteralPath $ArtifactSlot -PathType Container
    if ($slotPathExists -and -not $slotExisted) { throw 'DOSSIER_MUTATION_ARTIFACT_SLOT_INVALID' }
    $previousInventory = if ($slotExisted) { Get-DirectoryFileHashes $ArtifactSlot } else { [ordered]@{} }
    if ($slotExisted) {
      $backupMoved = $false
      try {
        Move-Item -LiteralPath $ArtifactSlot -Destination $backupSlot
        $backupMoved = $true
        if ($TestOnlyInjectFailureDuringBackupVerification) { throw 'DOSSIER_MUTATION_TEST_INJECTED_BACKUP_VERIFICATION_FAILURE' }
        Assert-InventoryEqual (Get-DirectoryFileHashes $backupSlot) $previousInventory 'DOSSIER_MUTATION_BACKUP_HASH_MISMATCH'
      } catch {
        $backupFailure = $_
        if (-not $backupMoved) { throw }
        Move-Item -LiteralPath $backupSlot -Destination $ArtifactSlot
        Assert-InventoryEqual (Get-DirectoryFileHashes $ArtifactSlot) $previousInventory 'DOSSIER_MUTATION_BACKUP_RESTORED_UNVERIFIABLE'
        throw "DOSSIER_MUTATION_BACKUP_VALIDATION_FAILED_RESTORED: $backupFailure"
      }
    }
    try {
      if (-not (Test-Path -LiteralPath $artifactParent -PathType Container)) {
        New-Item -ItemType Directory -Path $artifactParent -Force | Out-Null
      }
      Copy-Item -LiteralPath $candidate -Destination $ArtifactSlot -Recurse
      $publishedInventory = Get-ExactInventory $ArtifactSlot $expectedNames 'DOSSIER_MUTATION_PUBLISHED_INVENTORY_MISMATCH'
      Assert-InventoryEqual $publishedInventory $candidateInventory 'DOSSIER_MUTATION_PUBLISHED_CANDIDATE_INVENTORY_MISMATCH'
      Assert-PublishedManifest (Join-Path $ArtifactSlot 'manifest.json') 'DOSSIER_MUTATION_PUBLISHED_MANIFEST_MISMATCH'
      if ($TestOnlyInjectFailureAfterPublish) { throw 'DOSSIER_MUTATION_TEST_INJECTED_PUBLICATION_FAILURE' }
    } catch {
      $stageFailure = $_
      $cleanupFailure = $null
      if (Test-Path -LiteralPath $ArtifactSlot) {
        try { Remove-Item -LiteralPath $ArtifactSlot -Recurse -Force -ErrorAction Stop }
        catch { $cleanupFailure = $_ }
      }
      if (Test-Path -LiteralPath $ArtifactSlot) {
        if ($slotExisted) { throw "DOSSIER_MUTATION_ROLLBACK_BLOCKED_BY_FAILED_PUBLICATION_CLEANUP: $cleanupFailure; original failure: $stageFailure" }
        throw "DOSSIER_MUTATION_STAGE_FAILED_PARTIAL_SLOT_REMAINS: $cleanupFailure; original failure: $stageFailure"
      }
      if ($slotExisted) {
        Move-Item -LiteralPath $backupSlot -Destination $ArtifactSlot
        Assert-InventoryEqual (Get-DirectoryFileHashes $ArtifactSlot) $previousInventory 'DOSSIER_MUTATION_ROLLBACK_FAILED'
        throw "DOSSIER_MUTATION_STAGE_FAILED_ROLLED_BACK: $stageFailure"
      }
      throw "DOSSIER_MUTATION_STAGE_FAILED_SLOT_REMOVED: $stageFailure"
    }

    $manifestFile = Get-Item -LiteralPath (Join-Path $ArtifactSlot 'manifest.json')
    [pscustomobject]@{
      artifactType=$ArtifactType;suiteRepository=$ExpectedRepository;fetchTransport=$fetchRepository;
      sourceBranch=$ExpectedSourceBranch;protectedMainHead=$protectedMainHead;suiteCommit=$ExpectedDossierCommit;
      contract=$Contract;modulePath=$ModulePathInSuite;moduleLength=$ModuleLength;moduleSha256=$ModuleSha256;
      moduleGitBlob=$ModuleGitBlob;schemaPath=$SchemaPathInSuite;schemaLength=$SchemaLength;
      schemaSha256=$SchemaSha256;schemaGitBlob=$SchemaGitBlob;sourceManifestLength=$SourceManifestLength;
      sourceManifestSha256=$SourceManifestSha256;sourceManifestGitBlob=$SourceManifestGitBlob;
      artifactSlot=$ArtifactSlot;manifestPath=$manifestFile.FullName;
      publishedManifestSha256=(Get-FileHash -LiteralPath $manifestFile.FullName -Algorithm SHA256).Hash.ToLowerInvariant();
      publishedManifestLength=$manifestFile.Length;runtimeAdopted=$false;
      rollbackSlot=if($slotExisted){$backupSlot}else{$null};
      rollbackHashes=if($slotExisted){$previousInventory}else{$null}
    } | ConvertTo-Json -Depth 6
  } finally {
    if ($transactionLockHeld) { $transactionMutex.ReleaseMutex() }
    $transactionMutex.Dispose()
  }
} finally {
  foreach ($ephemeralPath in @($suiteSource,$candidate)) {
    if (Test-Path -LiteralPath $ephemeralPath) { Remove-Item -LiteralPath $ephemeralPath -Recurse -Force -ErrorAction Stop }
  }
  if ((Test-Path -LiteralPath $proofRoot -PathType Container) -and @(Get-ChildItem -LiteralPath $proofRoot -Force).Count -eq 0) {
    Remove-Item -LiteralPath $proofRoot -Force -ErrorAction Stop
  }
}
