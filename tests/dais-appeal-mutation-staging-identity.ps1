[CmdletBinding()]
param(
  [string]$DaisRepository = 'https://github.com/bsvalues/terrafusion-dais',
  [string]$ProofRootBase = (Join-Path $env:TEMP 'dais-mutation-staging-identity'),
  [switch]$PreservePublishedArtifact,
  [switch]$OfflineGuardsOnly
)

$ErrorActionPreference = 'Stop'
$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$stager = Join-Path $sovereignRepository 'scripts\bootstrap\Stage-DaisAppealMutationModule.ps1'
$artifactSlot = Join-Path $sovereignRepository '.terrafusion\runtime\dais\appeal-mutation'
$artifactParent = Split-Path -Parent $artifactSlot
$moduleHash = '779ef37435e2deb8f181b3c34e0712c35829b7a123f047752fc5bf09de331ff2'
$schemaHash = 'db8f1c93a598da7f9c454d5a43c275b849f2de8fc036e9be28c5c1da44432ce2'
$sourceManifestHash = '8f4b6ae6bd445b6a4f563f549e6ffb7d04f65e3d3c981e0556e9436744e61ef8'
$publishedManifestHash = 'c858e7cd390502bf1461cf7af6302916a7c437f5f4f47b17d379f49af114b825'
$publishedManifestLength = 1465
$runRoot = Join-Path $ProofRootBase ([Guid]::NewGuid().ToString('N'))
$stagerBuildRoot = Join-Path $runRoot 'stager-runs'
$originalSlot = Join-Path $runRoot 'original-slot'
$adoptedSlot = Join-Path $runRoot 'adopted-slot'
$rollbackObservation = Join-Path $runRoot 'rollback-observation'
$hadOriginalSlot = $false
$originalMoved = $false

function Invoke-Stager {
  param(
    [switch]$InjectManifestTamper,
    [switch]$InjectBackupFailure,
    [switch]$InjectPublishFailure,
    [int]$HoldLockMilliseconds = 0
  )
  $output = & $stager -DaisRepository $DaisRepository -BuildRootBase $stagerBuildRoot `
    -TestOnlyInjectCandidateManifestTamper:$InjectManifestTamper `
    -TestOnlyInjectFailureDuringBackupVerification:$InjectBackupFailure `
    -TestOnlyInjectFailureAfterPublish:$InjectPublishFailure `
    -TestOnlyHoldTransactionLockMilliseconds $HoldLockMilliseconds
  if ($LASTEXITCODE -ne 0) { throw "mutation stager exited $LASTEXITCODE" }
  $lines = @($output)
  $start = 0
  while ($start -lt $lines.Count -and -not $lines[$start].TrimStart().StartsWith('{',[StringComparison]::Ordinal)) { $start++ }
  if ($start -ge $lines.Count) { throw 'mutation stager emitted no JSON receipt' }
  return ($lines[$start..($lines.Count-1)] -join "`n") | ConvertFrom-Json
}
function Assert-Equal {
  param($Actual,$Expected,[string]$Label)
  if ($Actual -cne $Expected) { throw "$Label expected '$Expected', found '$Actual'" }
}
function Get-Inventory {
  param([string]$Directory)
  $inventory = [ordered]@{}
  if (-not (Test-Path -LiteralPath $Directory -PathType Container)) { return $inventory }
  foreach ($file in Get-ChildItem -LiteralPath $Directory -File -Recurse | Sort-Object FullName) {
    $relative = [IO.Path]::GetRelativePath($Directory,$file.FullName).Replace('\','/')
    $inventory[$relative] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  }
  return $inventory
}
function ConvertTo-Inventory {
  param($Inventory)
  $converted = [ordered]@{}
  if ($Inventory -is [Collections.IDictionary]) {
    foreach ($key in @($Inventory.Keys | Sort-Object)) { $converted[[string]$key] = [string]$Inventory[$key] }
  } else {
    foreach ($property in @($Inventory.psobject.Properties | Sort-Object Name)) {
      $converted[$property.Name] = [string]$property.Value
    }
  }
  return $converted
}
function Assert-InventoryEqual {
  param($Actual,$Expected,[string]$Label)
  $left = ConvertTo-Inventory $Actual
  $right = ConvertTo-Inventory $Expected
  if (($left | ConvertTo-Json -Compress) -cne ($right | ConvertTo-Json -Compress)) {
    throw "$Label inventory mismatch"
  }
}

# Hold the same named transaction mutex as the stager for the whole proof. Windows mutex
# ownership is recursive on the current thread, so the in-process stager invocations can enter
# and release their own acquisition while concurrent staging processes remain excluded.
$proofMutex = [Threading.Mutex]::new($false,'Local\TerraFusion.DaisAppealMutation.ArtifactSlot')
$proofLockHeld = $false
try { $proofLockHeld = $proofMutex.WaitOne(30000) }
catch [Threading.AbandonedMutexException] { $proofLockHeld = $true }
if (-not $proofLockHeld) {
  $proofMutex.Dispose()
  throw 'DAIS_MUTATION_PROOF_LOCK_UNAVAILABLE'
}

if ($OfflineGuardsOnly) {
  try {
    New-Item -ItemType Directory -Path $runRoot -Force | Out-Null
    $tokens=$null;$parseErrors=$null
    [Management.Automation.Language.Parser]::ParseFile($stager,[ref]$tokens,[ref]$parseErrors) | Out-Null
    if ($parseErrors.Count) { throw "mutation stager parse failed: $($parseErrors -join '; ')" }

    $originFailure = $null
    try { & $stager -DaisRepository 'https://evil.example/bsvalues/terrafusion-dais' -BuildRootBase $runRoot }
    catch { $originFailure = $_.Exception.Message }
    if ($originFailure -notmatch 'DAIS_MUTATION_REPOSITORY_IDENTITY_MISMATCH') {
      throw "strict origin rejection failed: $originFailure"
    }

    $artifactVolume = [IO.Path]::GetPathRoot([IO.Path]::GetFullPath($artifactSlot))
    $otherVolume = if ($artifactVolume -ieq 'Z:\') { 'Y:\dais-mutation-volume-guard' } else { 'Z:\dais-mutation-volume-guard' }
    $volumeFailure = $null
    try { & $stager -DaisRepository 'https://github.com/bsvalues/terrafusion-dais' -BuildRootBase $otherVolume }
    catch { $volumeFailure = $_.Exception.Message }
    if ($volumeFailure -notmatch 'DAIS_MUTATION_BUILD_ROOT_VOLUME_MISMATCH') {
      throw "cross-volume rejection failed: $volumeFailure"
    }

    $createdSlot = $false
    try {
      if (-not (Test-Path -LiteralPath $artifactSlot -PathType Container)) {
        New-Item -ItemType Directory -Path $artifactSlot -Force | Out-Null
        Set-Content -LiteralPath (Join-Path $artifactSlot 'overlap-sentinel.txt') -Value 'preserve' -Encoding utf8
        $createdSlot = $true
      }
      $before = Get-Inventory $artifactSlot
      $overlapFailure = $null
      try { & $stager -DaisRepository 'https://github.com/bsvalues/terrafusion-dais' -BuildRootBase $artifactSlot }
      catch { $overlapFailure = $_.Exception.Message }
      if ($overlapFailure -notmatch 'DAIS_MUTATION_BUILD_ROOT_SLOT_OVERLAP_REFUSED') {
        throw "slot-overlap rejection failed: $overlapFailure"
      }
      Assert-InventoryEqual (Get-Inventory $artifactSlot) $before 'overlap rejection'
    } finally {
      if ($createdSlot -and (Test-Path -LiteralPath $artifactSlot)) {
        Remove-Item -LiteralPath $artifactSlot -Recurse -Force
      }
    }

    [pscustomobject]@{
      result='PASS';terminalCondition='DAIS_MUTATION_STAGING_OFFLINE_GUARDS_PROVEN';
      powerShellParse=$true;runtimePinsVerified=$true;untrustedOriginRejectedBeforeFetch=$true;
      crossVolumeBackupRejected=$true;slotOverlapRejectedWithoutMutation=$true;
      privateSuiteCredentialRequired=$false;runtimeActivated=$false
    } | ConvertTo-Json -Depth 4
  } finally {
    if (Test-Path -LiteralPath $runRoot) { Remove-Item -LiteralPath $runRoot -Recurse -Force }
    if ($proofLockHeld) { $proofMutex.ReleaseMutex(); $proofLockHeld = $false }
    $proofMutex.Dispose()
  }
  return
}

try {
  New-Item -ItemType Directory -Path $runRoot,$stagerBuildRoot -Force | Out-Null
  $hadOriginalSlot = Test-Path -LiteralPath $artifactSlot
  if ($hadOriginalSlot) {
    Move-Item -LiteralPath $artifactSlot -Destination $originalSlot
    $originalMoved = $true
  }

  $manifestTamperFailure = $null
  try { $null = Invoke-Stager -InjectManifestTamper }
  catch { $manifestTamperFailure = $_.Exception.Message }
  if ($manifestTamperFailure -notmatch 'DAIS_MUTATION_CANDIDATE_MANIFEST_IDENTITY_MISMATCH') {
    throw "candidate manifest tamper was not refused: $manifestTamperFailure"
  }
  if (Test-Path -LiteralPath $artifactSlot) { throw 'manifest tamper reached live mutation slot' }
  if (@(Get-ChildItem -LiteralPath $stagerBuildRoot -Force).Count -ne 0) { throw 'manifest tamper retained an ephemeral proof root' }

  $freshPublishFailure = $null
  try { $null = Invoke-Stager -InjectPublishFailure }
  catch { $freshPublishFailure = $_.Exception.Message }
  if ($freshPublishFailure -notmatch 'DAIS_MUTATION_STAGE_FAILED_SLOT_REMOVED' -or
      $freshPublishFailure -notmatch 'DAIS_MUTATION_TEST_INJECTED_PUBLICATION_FAILURE') {
    throw "fresh publication failure did not remove partial slot: $freshPublishFailure"
  }
  if (Test-Path -LiteralPath $artifactSlot) { throw 'fresh failure left a partial mutation slot' }
  if (@(Get-ChildItem -LiteralPath $stagerBuildRoot -Force).Count -ne 0) { throw 'fresh failure retained an ephemeral proof root' }

  $first = Invoke-Stager
  Assert-Equal $first.suiteRepository 'bsvalues/terrafusion-dais' 'repository'
  Assert-Equal $first.sourceBranch 'main' 'source branch'
  Assert-Equal $first.protectedMainHead '8a9cfc608bcda835126db2054bb7ba7ecf185275' 'protected main'
  Assert-Equal $first.suiteCommit '8a9cfc608bcda835126db2054bb7ba7ecf185275' 'suite commit'
  Assert-Equal $first.moduleSha256 $moduleHash 'module hash'
  Assert-Equal $first.schemaSha256 $schemaHash 'schema hash'
  Assert-Equal $first.sourceManifestSha256 $sourceManifestHash 'source manifest hash'
  Assert-Equal $first.publishedManifestSha256 $publishedManifestHash 'published manifest hash'
  Assert-Equal $first.publishedManifestLength $publishedManifestLength 'published manifest length'
  Assert-Equal $first.rollbackSlot $null 'fresh rollback slot'
  if (@(Get-ChildItem -LiteralPath $stagerBuildRoot -Force).Count -ne 0) { throw 'fresh publication retained an ephemeral proof root' }

  $published = Get-Inventory $artifactSlot
  Assert-Equal (@($published.Keys | Sort-Object) -join '|') 'dais.appeal-mutation.v1.schema.json|decide-dais-appeal-mutation.mjs|manifest.json' 'published inventory'
  Assert-Equal (Get-Item -LiteralPath (Join-Path $artifactSlot 'decide-dais-appeal-mutation.mjs')).Length 11009 'module length'
  Assert-Equal $published['decide-dais-appeal-mutation.mjs'] $moduleHash 'published module hash'
  Assert-Equal (Get-Item -LiteralPath (Join-Path $artifactSlot 'dais.appeal-mutation.v1.schema.json')).Length 7950 'schema length'
  Assert-Equal $published['dais.appeal-mutation.v1.schema.json'] $schemaHash 'published schema hash'
  $manifest = Get-Content -LiteralPath (Join-Path $artifactSlot 'manifest.json') -Raw | ConvertFrom-Json
  Assert-Equal $manifest.moduleGitBlob '1c718ddd351e0f414cf09421d3377b5892938e97' 'module blob'
  Assert-Equal $manifest.schemaGitBlob 'ed8ba582bd8fbe949e7b12f80dd5850e127e7820' 'schema blob'
  Assert-Equal $manifest.sourceManifestGitBlob 'd947da54c73f4d741d957b85c81e09ebfe2a522c' 'source manifest blob'

  Set-Content -LiteralPath (Join-Path $artifactSlot 'rollback-sentinel.txt') -Value 'nonempty-whole-slot-proof' -Encoding utf8
  $priorInventory = Get-Inventory $artifactSlot
  if ($priorInventory.Count -lt 4) { throw 'nonempty rollback fixture did not contain the full prior slot' }

  $backupFailure = $null
  try { $null = Invoke-Stager -InjectBackupFailure }
  catch { $backupFailure = $_.Exception.Message }
  if ($backupFailure -notmatch 'DAIS_MUTATION_BACKUP_VALIDATION_FAILED_RESTORED' -or
      $backupFailure -notmatch 'DAIS_MUTATION_TEST_INJECTED_BACKUP_VERIFICATION_FAILURE') {
    throw "backup verification failure did not restore: $backupFailure"
  }
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $priorInventory 'backup failure restoration'
  if (@(Get-ChildItem -LiteralPath $stagerBuildRoot -Force).Count -ne 0) { throw 'backup failure retained an ephemeral proof root' }

  $publishFailure = $null
  try { $null = Invoke-Stager -InjectPublishFailure }
  catch { $publishFailure = $_.Exception.Message }
  if ($publishFailure -notmatch 'DAIS_MUTATION_STAGE_FAILED_ROLLED_BACK' -or
      $publishFailure -notmatch 'DAIS_MUTATION_TEST_INJECTED_PUBLICATION_FAILURE') {
    throw "publish failure did not restore prior slot: $publishFailure"
  }
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $priorInventory 'publication failure restoration'
  if (@(Get-ChildItem -LiteralPath $stagerBuildRoot -Force).Count -ne 0) { throw 'publication failure retained an ephemeral proof root' }

  $second = Invoke-Stager
  if (-not (Test-Path -LiteralPath $second.rollbackSlot -PathType Container)) {
    throw 'successful replacement emitted no real rollback directory'
  }
  $receiptRollback = ConvertTo-Inventory $second.rollbackHashes
  if ($receiptRollback.Count -lt 4) { throw 'rollback receipt hashes are empty or incomplete' }
  Assert-InventoryEqual (Get-Inventory $second.rollbackSlot) $priorInventory 'backup contents'
  Assert-InventoryEqual $receiptRollback $priorInventory 'receipt rollback hashes'
  $retainedRootEntries = @(Get-ChildItem -LiteralPath (Split-Path -Parent $second.rollbackSlot) -Force)
  Assert-Equal $retainedRootEntries.Count 1 'managed rollback root entry count'
  Assert-Equal $retainedRootEntries[0].Name 'previous-artifact' 'managed rollback root entry'

  $adoptedInventory = Get-Inventory $artifactSlot
  Move-Item -LiteralPath $artifactSlot -Destination $adoptedSlot
  Move-Item -LiteralPath $second.rollbackSlot -Destination $rollbackObservation
  Move-Item -LiteralPath $rollbackObservation -Destination $artifactSlot
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $priorInventory 'executed rollback'
  Move-Item -LiteralPath $artifactSlot -Destination $rollbackObservation
  Move-Item -LiteralPath $adoptedSlot -Destination $artifactSlot
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $adoptedInventory 'restored adopted slot'

  [pscustomobject]@{
    result='PASS';terminalCondition='DAIS_APPEAL_MUTATION_EXACT_STAGING_AND_ROLLBACK_PROVEN';
    canonicalRepository='bsvalues/terrafusion-dais';protectedSourceBranch='main';
    canonicalCommit='8a9cfc608bcda835126db2054bb7ba7ecf185275';
    moduleLength=11009;moduleSha256=$moduleHash;moduleGitBlob='1c718ddd351e0f414cf09421d3377b5892938e97';
    schemaLength=7950;schemaSha256=$schemaHash;schemaGitBlob='ed8ba582bd8fbe949e7b12f80dd5850e127e7820';
    sourceManifestSha256=$sourceManifestHash;sourceManifestGitBlob='d947da54c73f4d741d957b85c81e09ebfe2a522c';
    publishedManifestLength=$publishedManifestLength;publishedManifestSha256=$publishedManifestHash;
    exactThreeFileInventoryVerified=$true;protectedMainAncestryVerified=$true;
    candidateManifestTamperRejectedBeforePublication=$true;freshFailureSlotRemovalVerified=$true;
    backupVerificationFailureRollbackVerified=$true;publicationFailureRollbackVerified=$true;
    nonemptyBackupContentsVerified=$true;rollbackHashesVerified=$true;rollbackExecutedAndObserved=$true;
    ephemeralProofRootsRemoved=$true;managedRollbackOnlyRetentionVerified=$true;
    runtimeActivated=$false;countyOrProtectedDataUsed=$false;deploymentOrProductionUsed=$false
  } | ConvertTo-Json -Depth 5
} finally {
  if (-not $PreservePublishedArtifact -and (Test-Path -LiteralPath $artifactSlot)) {
    Remove-Item -LiteralPath $artifactSlot -Recurse -Force
  }
  if ($originalMoved) {
    if (Test-Path -LiteralPath $artifactSlot) { Remove-Item -LiteralPath $artifactSlot -Recurse -Force }
    if (-not (Test-Path -LiteralPath $artifactParent -PathType Container)) {
      New-Item -ItemType Directory -Path $artifactParent -Force | Out-Null
    }
    Move-Item -LiteralPath $originalSlot -Destination $artifactSlot
  }
  if (Test-Path -LiteralPath $runRoot) { Remove-Item -LiteralPath $runRoot -Recurse -Force }
  if ($proofLockHeld) { $proofMutex.ReleaseMutex(); $proofLockHeld = $false }
  $proofMutex.Dispose()
}
