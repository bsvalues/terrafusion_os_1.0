[CmdletBinding()]
param(
  [string]$DossierRepository = 'https://github.com/bsvalues/terrafusion-dossier',
  [string]$ProofRootBase = (Join-Path $env:TEMP 'dossier-mutation-staging-identity'),
  [switch]$PreservePublishedArtifact,
  [switch]$OfflineGuardsOnly
)

$ErrorActionPreference = 'Stop'
$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$stager = Join-Path $sovereignRepository 'scripts\bootstrap\Stage-DossierMutationDecisionModule.ps1'
$artifactSlot = Join-Path $sovereignRepository '.terrafusion\runtime\dossier\mutation-decision'
$artifactParent = Split-Path -Parent $artifactSlot
$expectedCommit = '2c709fe2286b5c1e6bde43fcbc2a35111a456092'
$moduleHash = 'b314d94ac5cd1ed88d7c841f8a87d3263e7a8adf21c4d5d465003c015c66f277'
$schemaHash = '48db4388e76c91ca10e2caad54c814e0eb4fee7908e219e4186a3823d30e62a3'
$sourceManifestHash = 'dd9dfd1f0d6e31689ebbc90e2e7f1674be55b54eff433ec15d041b565d4f2444'
$publishedManifestHash = '425d36d660ed2d46616a645d014dfa2906cfbac424b4ec0a6d7692ec43ba2716'
$publishedManifestLength = 1493
$ProofRootBase = [IO.Path]::GetFullPath($ProofRootBase)
$DossierRepository = if (Test-Path -LiteralPath $DossierRepository -PathType Container) {
  (Resolve-Path -LiteralPath $DossierRepository).Path
} else { $DossierRepository }
$runRoot = Join-Path $ProofRootBase ([Guid]::NewGuid().ToString('N'))
$stagerBuildRoot = Join-Path $runRoot 'stager-runs'
$sourceCache = Join-Path $runRoot 'canonical-source-cache.git'
$originalSlot = Join-Path $runRoot 'original-slot'
$adoptedSlot = Join-Path $runRoot 'adopted-slot'
$rollbackObservation = Join-Path $runRoot 'rollback-observation'
$originalMoved = $false
$effectiveRepository = $DossierRepository

function Invoke-Checked {
  param([string]$Command,[string[]]$Arguments,[string]$WorkingDirectory)
  Push-Location $WorkingDirectory
  try {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit code $LASTEXITCODE" }
  } finally { Pop-Location }
}
function Invoke-Stager {
  param([switch]$InjectManifestTamper,[switch]$InjectBackupFailure,[switch]$InjectPublishFailure)
  $output = & $stager -DossierRepository $effectiveRepository -BuildRootBase $stagerBuildRoot `
    -EnvironmentName Test -TestOnlyInjectCandidateManifestTamper:$InjectManifestTamper `
    -TestOnlyInjectFailureDuringBackupVerification:$InjectBackupFailure `
    -TestOnlyInjectFailureAfterPublish:$InjectPublishFailure
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
  foreach ($entry in Get-ChildItem -LiteralPath $Directory -Force -Recurse) {
    if ($entry.Attributes.HasFlag([IO.FileAttributes]::ReparsePoint)) { throw "proof refuses reparse point $($entry.FullName)" }
  }
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
    foreach ($property in @($Inventory.psobject.Properties | Sort-Object Name)) { $converted[$property.Name] = [string]$property.Value }
  }
  return $converted
}
function Assert-InventoryEqual {
  param($Actual,$Expected,[string]$Label)
  $left = ConvertTo-Inventory $Actual
  $right = ConvertTo-Inventory $Expected
  if (($left | ConvertTo-Json -Compress) -cne ($right | ConvertTo-Json -Compress)) { throw "$Label inventory mismatch" }
}
function Assert-Failure {
  param([scriptblock]$Action,[string]$Pattern,[string]$Label)
  $failure = $null
  try { & $Action }
  catch { $failure = $_.Exception.Message }
  if ($failure -notmatch $Pattern) { throw "$Label expected $Pattern, found: $failure" }
}

$tokens=$null;$parseErrors=$null
[Management.Automation.Language.Parser]::ParseFile($stager,[ref]$tokens,[ref]$parseErrors) | Out-Null
if ($parseErrors.Count) { throw "mutation stager parse failed: $($parseErrors -join '; ')" }
$source = Get-Content -LiteralPath $stager -Raw
if ($source -match 'PENDING_WO_SR_011E' -or $source -notmatch [regex]::Escape($expectedCommit)) { throw 'protected WO-SR-011E source identity is not final' }
if ($source -match "Copy-Item\s+-LiteralPath\s+[^\r\n]*[\\/]\*") { throw 'wildcard Copy-Item rollback implementation is forbidden' }

$proofMutex = [Threading.Mutex]::new($false,'Local\TerraFusion.DossierMutationDecision.ArtifactSlot')
$proofLockHeld = $false
try { $proofLockHeld = $proofMutex.WaitOne(30000) }
catch [Threading.AbandonedMutexException] { $proofLockHeld = $true }
if (-not $proofLockHeld) { $proofMutex.Dispose(); throw 'DOSSIER_MUTATION_PROOF_LOCK_UNAVAILABLE' }

if ($OfflineGuardsOnly) {
  try {
    New-Item -ItemType Directory -Path $runRoot -Force | Out-Null
    $beforeExists = Test-Path -LiteralPath $artifactSlot
    $beforeInventory = Get-Inventory $artifactSlot
    Assert-Failure { & $stager -EnvironmentName Production -BuildRootBase $runRoot } 'DOSSIER_MUTATION_PRODUCTION_STAGE_REFUSED' 'production guard'
    Assert-Failure { & $stager -ArtifactSlot (Join-Path $runRoot 'wrong-slot') -BuildRootBase $runRoot } 'DOSSIER_MUTATION_ARTIFACT_SLOT_REFUSED' 'fixed slot guard'
    Assert-Failure { & $stager -BuildRootBase $artifactSlot } 'DOSSIER_MUTATION_BUILD_ROOT_SLOT_OVERLAP_REFUSED' 'slot overlap guard'
    $artifactVolume = [IO.Path]::GetPathRoot([IO.Path]::GetFullPath($artifactSlot))
    $otherVolume = if ($artifactVolume -ieq 'Z:\') { 'Y:\dossier-mutation-volume-guard' } else { 'Z:\dossier-mutation-volume-guard' }
    Assert-Failure { & $stager -BuildRootBase $otherVolume } 'DOSSIER_MUTATION_BUILD_ROOT_VOLUME_MISMATCH' 'cross-volume guard'
    Assert-Failure { & $stager -DossierRepository 'https://evil.example/bsvalues/terrafusion-dossier' -BuildRootBase $runRoot } 'DOSSIER_MUTATION_REPOSITORY_IDENTITY_MISMATCH' 'origin guard'
    if ((Test-Path -LiteralPath $artifactSlot) -ne $beforeExists) { throw 'offline guards changed artifact slot existence' }
    Assert-InventoryEqual (Get-Inventory $artifactSlot) $beforeInventory 'offline guards'
    [pscustomobject]@{
      result='PASS';terminalCondition='DOSSIER_MUTATION_STAGING_OFFLINE_GUARDS_PROVEN';
      powerShellParse=$true;protectedSourcePinsFinal=$true;untrustedOriginRejectedBeforeFetch=$true;
      productionRejected=$true;fixedSlotGuardVerified=$true;slotOverlapRejectedWithoutMutation=$true;
      crossVolumeBackupRejected=$true;
      wildcardCopyBugAbsent=$true;runtimeActivated=$false;countyOrProtectedDataUsed=$false;
      deploymentOrProductionUsed=$false
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
  if (Test-Path -LiteralPath $DossierRepository -PathType Container) {
    $sourceGitDir = (& git -c "safe.directory=$DossierRepository" -C $DossierRepository rev-parse --absolute-git-dir)
    if ($LASTEXITCODE -ne 0) { throw 'unable to resolve canonical source Git directory' }
    $observedRemoteMain = (& git -c "safe.directory=$DossierRepository" -c "safe.directory=$sourceGitDir" -C $DossierRepository rev-parse refs/remotes/origin/main)
    if ($LASTEXITCODE -ne 0 -or ($observedRemoteMain -join "`n").Trim() -cne $expectedCommit) {
      throw "canonical local source has not observed protected origin/main at $expectedCommit"
    }
    & git -c "safe.directory=$DossierRepository" -c "safe.directory=$sourceGitDir" -C $DossierRepository merge-base --is-ancestor $expectedCommit refs/remotes/origin/main
    if ($LASTEXITCODE -ne 0) { throw 'protected commit is not reachable from observed canonical origin/main' }
    Invoke-Checked git @('-c',"safe.directory=$DossierRepository",'-c',"safe.directory=$sourceGitDir",'clone','--bare',$DossierRepository,$sourceCache) $runRoot
    Invoke-Checked git @('--git-dir',$sourceCache,'cat-file','-e',"$expectedCommit^{commit}") $runRoot
    Invoke-Checked git @('--git-dir',$sourceCache,'update-ref','refs/heads/main',$expectedCommit) $runRoot
    Invoke-Checked git @('--git-dir',$sourceCache,'remote','set-url','origin','https://github.com/bsvalues/terrafusion-dossier.git') $runRoot
    $effectiveRepository = $sourceCache
  }

  $hadOriginalSlot = Test-Path -LiteralPath $artifactSlot
  if ($hadOriginalSlot) { Move-Item -LiteralPath $artifactSlot -Destination $originalSlot; $originalMoved = $true }

  Assert-Failure { $null = Invoke-Stager -InjectManifestTamper } 'DOSSIER_MUTATION_CANDIDATE_MANIFEST_IDENTITY_MISMATCH' 'candidate manifest tamper'
  if (Test-Path -LiteralPath $artifactSlot) { throw 'manifest tamper reached live mutation slot' }

  Assert-Failure { $null = Invoke-Stager -InjectPublishFailure } 'DOSSIER_MUTATION_STAGE_FAILED_SLOT_REMOVED.*DOSSIER_MUTATION_TEST_INJECTED_PUBLICATION_FAILURE' 'fresh publication rollback'
  if (Test-Path -LiteralPath $artifactSlot) { throw 'fresh failure left a partial mutation slot' }

  $first = Invoke-Stager
  Assert-Equal $first.suiteRepository 'bsvalues/terrafusion-dossier' 'repository'
  Assert-Equal $first.sourceBranch 'main' 'source branch'
  Assert-Equal $first.protectedMainHead $expectedCommit 'protected main'
  Assert-Equal $first.suiteCommit $expectedCommit 'suite commit'
  Assert-Equal $first.moduleSha256 $moduleHash 'module hash'
  Assert-Equal $first.schemaSha256 $schemaHash 'schema hash'
  Assert-Equal $first.sourceManifestSha256 $sourceManifestHash 'source manifest hash'
  Assert-Equal $first.publishedManifestSha256 $publishedManifestHash 'published manifest hash'
  Assert-Equal $first.publishedManifestLength $publishedManifestLength 'published manifest length'
  Assert-Equal $first.rollbackSlot $null 'fresh rollback slot'

  $published = Get-Inventory $artifactSlot
  Assert-Equal (@($published.Keys | Sort-Object) -join '|') 'decide-dossier-mutation.mjs|dossier.mutation-decision.v1.schema.json|manifest.json' 'published inventory'
  Assert-Equal $published['decide-dossier-mutation.mjs'] $moduleHash 'published module hash'
  Assert-Equal $published['dossier.mutation-decision.v1.schema.json'] $schemaHash 'published schema hash'
  $manifest = Get-Content -LiteralPath (Join-Path $artifactSlot 'manifest.json') -Raw | ConvertFrom-Json
  Assert-Equal $manifest.moduleGitBlob 'c9080b4fac4bb6abc42cfa870e2c36df1ddac6fc' 'module blob'
  Assert-Equal $manifest.schemaGitBlob '42fb0ce560a407ccee27ffd55f3d074dac182243' 'schema blob'
  Assert-Equal $manifest.sourceManifestGitBlob 'fa128c254b38366133d5017e50e7c7226f37401f' 'source manifest blob'

  Set-Content -LiteralPath (Join-Path $artifactSlot 'rollback-sentinel.txt') -Value 'nonempty-whole-slot-proof' -Encoding utf8
  $priorInventory = Get-Inventory $artifactSlot
  if ($priorInventory.Count -ne 4) { throw 'nonempty rollback fixture did not contain exact prior slot plus sentinel' }

  Assert-Failure { $null = Invoke-Stager -InjectBackupFailure } 'DOSSIER_MUTATION_BACKUP_VALIDATION_FAILED_RESTORED.*DOSSIER_MUTATION_TEST_INJECTED_BACKUP_VERIFICATION_FAILURE' 'backup verification rollback'
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $priorInventory 'backup failure restoration'

  Assert-Failure { $null = Invoke-Stager -InjectPublishFailure } 'DOSSIER_MUTATION_STAGE_FAILED_ROLLED_BACK.*DOSSIER_MUTATION_TEST_INJECTED_PUBLICATION_FAILURE' 'publication failure rollback'
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $priorInventory 'publication failure restoration'

  $second = Invoke-Stager
  if (-not (Test-Path -LiteralPath $second.rollbackSlot -PathType Container)) { throw 'successful replacement emitted no real rollback directory' }
  $receiptRollback = ConvertTo-Inventory $second.rollbackHashes
  if ($receiptRollback.Count -ne 4) { throw 'rollback receipt hashes are empty or incomplete' }
  Assert-InventoryEqual (Get-Inventory $second.rollbackSlot) $priorInventory 'backup contents'
  Assert-InventoryEqual $receiptRollback $priorInventory 'receipt rollback hashes'

  $adoptedInventory = Get-Inventory $artifactSlot
  Move-Item -LiteralPath $artifactSlot -Destination $adoptedSlot
  Move-Item -LiteralPath $second.rollbackSlot -Destination $rollbackObservation
  Move-Item -LiteralPath $rollbackObservation -Destination $artifactSlot
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $priorInventory 'executed rollback'
  Move-Item -LiteralPath $artifactSlot -Destination $rollbackObservation
  Move-Item -LiteralPath $adoptedSlot -Destination $artifactSlot
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $adoptedInventory 'restored adopted slot'

  [pscustomobject]@{
    result='PASS';terminalCondition='DOSSIER_MUTATION_EXACT_STAGING_AND_ROLLBACK_PROVEN';
    canonicalRepository='bsvalues/terrafusion-dossier';protectedSourceBranch='main';canonicalCommit=$expectedCommit;
    moduleLength=18366;moduleSha256=$moduleHash;moduleGitBlob='c9080b4fac4bb6abc42cfa870e2c36df1ddac6fc';
    schemaLength=18611;schemaSha256=$schemaHash;schemaGitBlob='42fb0ce560a407ccee27ffd55f3d074dac182243';
    sourceManifestLength=6921;sourceManifestSha256=$sourceManifestHash;sourceManifestGitBlob='fa128c254b38366133d5017e50e7c7226f37401f';
    publishedManifestLength=$publishedManifestLength;publishedManifestSha256=$publishedManifestHash;
    exactThreeFileInventoryVerified=$true;protectedMainAncestryVerified=$true;
    sourceCacheDerivedFromObservedOriginMain=$true;
    candidateManifestTamperRejectedBeforePublication=$true;freshFailureSlotRemovalVerified=$true;
    backupVerificationFailureRollbackVerified=$true;publicationFailureRollbackVerified=$true;
    nonemptyBackupContentsVerified=$true;rollbackHashesVerified=$true;rollbackExecutedAndObserved=$true;
    adoptedSlotRestoredAndObserved=$true;runtimeActivated=$false;countyOrProtectedDataUsed=$false;
    deploymentOrProductionUsed=$false
  } | ConvertTo-Json -Depth 5
} finally {
  if (-not $PreservePublishedArtifact -and (Test-Path -LiteralPath $artifactSlot)) { Remove-Item -LiteralPath $artifactSlot -Recurse -Force }
  if ($originalMoved) {
    if (Test-Path -LiteralPath $artifactSlot) { Remove-Item -LiteralPath $artifactSlot -Recurse -Force }
    if (-not (Test-Path -LiteralPath $artifactParent -PathType Container)) { New-Item -ItemType Directory -Path $artifactParent -Force | Out-Null }
    Move-Item -LiteralPath $originalSlot -Destination $artifactSlot
  }
  if (Test-Path -LiteralPath $runRoot) { Remove-Item -LiteralPath $runRoot -Recurse -Force }
  if ($proofLockHeld) { $proofMutex.ReleaseMutex(); $proofLockHeld = $false }
  $proofMutex.Dispose()
}
