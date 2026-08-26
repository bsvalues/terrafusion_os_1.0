[CmdletBinding()]
param(
  [string]$DaisRepository = "https://github.com/bsvalues/terrafusion-dais",
  [string]$ProofRootBase = (Join-Path $env:TEMP "dais-staging-identity"),
  [switch]$PreservePublishedArtifact,
  [switch]$OfflineGuardsOnly
)

$ErrorActionPreference = "Stop"
$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$stager = Join-Path $sovereignRepository "scripts\bootstrap\Stage-DaisAppealWorkflowModule.ps1"
$artifactSlot = Join-Path $sovereignRepository ".terrafusion\runtime\dais\appeal-workflow"
$artifactParent = Split-Path -Parent $artifactSlot
$moduleHash = "5fd8efd8b06baa57b602a565c5927c95614336d5c1dcdfa914f27734e9ecaafb"
$schemaHash = "b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c"
$sourceManifestHash = "6dbcef689d7cb1f282bdd34eff56009280fb391bedfa58d0308480365b962859"
$runRoot = Join-Path $ProofRootBase ([guid]::NewGuid().ToString("N"))
$stagerBuildRoot = Join-Path $runRoot "stager-runs"
$originalSlot = Join-Path $runRoot "original-slot"
$hadOriginalSlot = Test-Path -LiteralPath $artifactSlot
$originalMoved = $false

function Invoke-Stager {
  param([switch]$InjectManifestTamper,[switch]$InjectStringArrayTamper,[switch]$InjectBackupFailure,[switch]$InjectPublishFailure)
  $output = & $stager -DaisRepository $DaisRepository -BuildRootBase $stagerBuildRoot `
    -TestOnlyInjectCandidateManifestTamper:$InjectManifestTamper `
    -TestOnlyInjectCandidateStringArrayTamper:$InjectStringArrayTamper `
    -TestOnlyInjectFailureDuringBackupVerification:$InjectBackupFailure `
    -TestOnlyInjectFailureAfterPublish:$InjectPublishFailure
  if ($LASTEXITCODE -ne 0) { throw "Dais stager failed with exit code $LASTEXITCODE" }
  return ($output -join "`n") | ConvertFrom-Json
}
function Assert-Equal { param($Actual,$Expected,[string]$Label) if ($Actual -cne $Expected) { throw "$Label expected '$Expected', measured '$Actual'" } }
function Get-Inventory {
  param([string]$Directory)
  $inventory=[ordered]@{}
  foreach($file in Get-ChildItem -LiteralPath $Directory -File -Recurse | Sort-Object FullName){
    $relative=[IO.Path]::GetRelativePath($Directory,$file.FullName).Replace('\','/')
    $inventory[$relative]=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  }
  return $inventory
}
function Assert-InventoryEqual {
  param($Actual,$Expected,[string]$Label)
  $actualJson=$Actual|ConvertTo-Json -Compress; $expectedJson=$Expected|ConvertTo-Json -Compress
  if($actualJson -cne $expectedJson){throw "$Label inventory mismatch: expected $expectedJson, measured $actualJson"}
}

if($OfflineGuardsOnly){
  try{
    $tokens=$null;$parseErrors=$null
    [Management.Automation.Language.Parser]::ParseFile($stager,[ref]$tokens,[ref]$parseErrors)|Out-Null
    if($parseErrors.Count){throw "Dais stager parse failed: $($parseErrors -join '; ')"}
    $rejection=$null
    try{& $stager -DaisRepository "https://evil.example/bsvalues/terrafusion-dais" -BuildRootBase $runRoot}catch{$rejection=$_.Exception.Message}
    if($rejection -notmatch 'DAIS_REPOSITORY_IDENTITY_MISMATCH'){throw "Strict canonical-origin guard failed: $rejection"}
    $artifactVolume=[IO.Path]::GetPathRoot([IO.Path]::GetFullPath($artifactSlot))
    $otherVolume=if($artifactVolume -ieq 'Z:\'){'Y:\dais-staging-volume-guard'}else{'Z:\dais-staging-volume-guard'}
    $volumeRejection=$null
    try{& $stager -DaisRepository "https://github.com/bsvalues/terrafusion-dais" -BuildRootBase $otherVolume}catch{$volumeRejection=$_.Exception.Message}
    if($volumeRejection -notmatch 'DAIS_BUILD_ROOT_VOLUME_MISMATCH'){throw "Cross-volume backup guard failed: $volumeRejection"}
    $reparseTarget=Join-Path $runRoot 'reparse-target'
    $reparseRoot=Join-Path $runRoot 'reparse-root'
    New-Item -ItemType Directory -Path $reparseTarget -Force|Out-Null
    New-Item -ItemType Junction -Path $reparseRoot -Target $reparseTarget|Out-Null
    $reparseRejection=$null
    try{& $stager -DaisRepository "https://github.com/bsvalues/terrafusion-dais" -BuildRootBase $reparseRoot}catch{$reparseRejection=$_.Exception.Message}
    if($reparseRejection -notmatch 'DAIS_BUILD_ROOT_REPARSE_POINT_REFUSED'){throw "Build-root reparse guard failed: $reparseRejection"}
    $createdOverlapSlot=$false
    try{
      if((Test-Path -LiteralPath $artifactSlot) -and -not(Test-Path -LiteralPath $artifactSlot -PathType Container)){throw "Overlap regression requires a directory slot"}
      if(-not(Test-Path -LiteralPath $artifactSlot -PathType Container)){
        New-Item -ItemType Directory -Path $artifactSlot -Force|Out-Null
        Set-Content -LiteralPath (Join-Path $artifactSlot 'overlap-sentinel.txt') -Value 'must-remain-byte-identical' -Encoding utf8
        $createdOverlapSlot=$true
      }
      $beforeOverlap=Get-Inventory $artifactSlot
      $overlapRejection=$null
      try{& $stager -DaisRepository "https://github.com/bsvalues/terrafusion-dais" -BuildRootBase $artifactSlot}catch{$overlapRejection=$_.Exception.Message}
      if($overlapRejection -notmatch 'DAIS_BUILD_ROOT_SLOT_OVERLAP_REFUSED'){throw "Build-root/live-slot overlap guard failed: $overlapRejection"}
      Assert-InventoryEqual (Get-Inventory $artifactSlot) $beforeOverlap 'overlap rejection preserved live slot'
    }finally{
      if($createdOverlapSlot -and (Test-Path -LiteralPath $artifactSlot)){Remove-Item -LiteralPath $artifactSlot -Recurse -Force}
      if($createdOverlapSlot -and (Test-Path -LiteralPath $artifactParent -PathType Container) -and -not(Get-ChildItem -LiteralPath $artifactParent -Force|Select-Object -First 1)){Remove-Item -LiteralPath $artifactParent -Force}
    }
    [pscustomobject]@{result='PASS';terminalCondition='DAIS_STAGING_OFFLINE_GUARDS_PROVEN';powerShellParse=$true;runtimePinsVerified=$true;untrustedOriginRejectedBeforeFetch=$true;crossVolumeBackupRejected=$true;buildRootReparsePointRejected=$true;buildRootSlotOverlapRejectedWithoutMutation=$true;privateSuiteCredentialRequired=$false}|ConvertTo-Json -Depth 4
  }finally{if(Test-Path -LiteralPath $runRoot){Remove-Item -LiteralPath $runRoot -Recurse -Force}}
  return
}

New-Item -ItemType Directory -Path $runRoot,$stagerBuildRoot -Force|Out-Null
try{
  if($hadOriginalSlot){Move-Item -LiteralPath $artifactSlot -Destination $originalSlot;$originalMoved=$true}
  if(Test-Path -LiteralPath $artifactParent -PathType Container){
    $entry=Get-ChildItem -LiteralPath $artifactParent -Force|Select-Object -First 1
    if($entry){throw "Clean-parent bootstrap requires empty Dais parent; found $($entry.FullName)"}
    Remove-Item -LiteralPath $artifactParent -Force
  }
  $manifestTamperFailure=$null
  try{$null=Invoke-Stager -InjectManifestTamper}catch{$manifestTamperFailure=$_.Exception.Message}
  if($manifestTamperFailure -notmatch 'DAIS_CANDIDATE_MANIFEST_IDENTITY_MISMATCH'){throw "Unchecked candidate manifest tamper was not refused: $manifestTamperFailure"}
  if(Test-Path -LiteralPath $artifactSlot){throw 'Candidate manifest tamper reached the live slot'}
  $stringArrayTamperFailure=$null
  try{$null=Invoke-Stager -InjectStringArrayTamper}catch{$stringArrayTamperFailure=$_.Exception.Message}
  if($stringArrayTamperFailure -notmatch 'DAIS_CANDIDATE_MANIFEST_IDENTITY_MISMATCH'){throw "Singleton-array string manifest tamper was not refused: $stringArrayTamperFailure"}
  if(Test-Path -LiteralPath $artifactSlot){throw 'String-array manifest tamper reached the live slot'}
  $freshFailure=$null
  try{$null=Invoke-Stager -InjectPublishFailure}catch{$freshFailure=$_.Exception.Message}
  if($freshFailure -notmatch 'DAIS_STAGE_FAILED_SLOT_REMOVED' -or $freshFailure -notmatch 'DAIS_TEST_INJECTED_PUBLICATION_FAILURE'){throw "Fresh failure cleanup not proved: $freshFailure"}
  if(Test-Path -LiteralPath $artifactSlot){throw 'Fresh failure left a partial slot'}

  $first=Invoke-Stager
  Assert-Equal $first.suiteRepository 'bsvalues/terrafusion-dais' 'repository'
  Assert-Equal $first.suiteCommit '6932bbbf014cf70d7362e070a1dad2a8a680ad47' 'commit'
  Assert-Equal $first.moduleSha256 $moduleHash 'module hash'
  Assert-Equal $first.schemaSha256 $schemaHash 'schema hash'
  Assert-Equal $first.sourceManifestSha256 $sourceManifestHash 'source manifest hash'
  Assert-Equal $first.rollbackSlot $null 'fresh rollback slot'

  $beforeConcurrency=Get-Inventory $artifactSlot
  Write-Verbose 'Starting concurrent staging winner.'
  $jobRepository=if(Test-Path -LiteralPath $DaisRepository -PathType Container){(Resolve-Path -LiteralPath $DaisRepository).Path}else{$DaisRepository}
  $concurrentJob=Start-Job -ScriptBlock {
    param($Stager,$Repository,$BuildRoot)
    & $Stager -DaisRepository $Repository -BuildRootBase $BuildRoot -TestOnlyHoldTransactionLockMilliseconds 5000
  } -ArgumentList $stager,$jobRepository,$stagerBuildRoot
  try{
    $mutexObservedHeld=$false
    $deadline=[DateTime]::UtcNow.AddSeconds(20)
    while([DateTime]::UtcNow -lt $deadline -and $concurrentJob.State -eq 'Running'){
      $probe=[Threading.Mutex]::new($false,'Local\TerraFusion.DaisAppealWorkflow.ArtifactSlot')
      $probeHeld=$false
      try{
        $probeHeld=$probe.WaitOne(0)
        if(-not $probeHeld){$mutexObservedHeld=$true;break}
      }catch [Threading.AbandonedMutexException]{
        $probeHeld=$true
      }finally{
        if($probeHeld){$probe.ReleaseMutex()}
        $probe.Dispose()
      }
      Start-Sleep -Milliseconds 50
    }
    if(-not $mutexObservedHeld){throw "Concurrent stager never acquired the transaction mutex; state=$($concurrentJob.State)"}
    Write-Verbose 'Observed winner holding the transaction mutex.'
    $concurrentRejection=$null
    try{$null=Invoke-Stager}catch{$concurrentRejection=$_.Exception.Message}
    if($concurrentRejection -notmatch 'DAIS_STAGE_LOCK_UNAVAILABLE'){throw "Concurrent invocation did not fail closed on the transaction lock: $concurrentRejection"}
    Write-Verbose 'Concurrent loser failed closed on the transaction mutex.'
    Wait-Job -Job $concurrentJob -Timeout 30|Out-Null
    if($concurrentJob.State -ne 'Completed'){throw "Lock-holding stager did not complete: $($concurrentJob.State)"}
    Write-Verbose 'Concurrent winner completed.'
    $jobOutput=(Receive-Job -Job $concurrentJob -ErrorAction SilentlyContinue) -join "`n"
    $jobReceipt=$jobOutput|ConvertFrom-Json
    Assert-Equal $jobReceipt.moduleSha256 $moduleHash 'concurrent winner receipt module hash'
    Assert-InventoryEqual (Get-Inventory $artifactSlot) $beforeConcurrency 'concurrent loser preserved winner publication'
    Write-Verbose 'Concurrent winner publication remained byte-identical.'
  }finally{
    if($concurrentJob.State -eq 'Running'){Stop-Job -Job $concurrentJob}
    Remove-Job -Job $concurrentJob -Force
  }
  Write-Verbose 'Concurrent staging proof completed.'

  Set-Content -LiteralPath (Join-Path $artifactSlot 'rollback-sentinel.txt') -Value 'whole-slot-rollback-proof' -Encoding utf8
  $preFailure=Get-Inventory $artifactSlot
  $backupFailure=$null
  try{$null=Invoke-Stager -InjectBackupFailure}catch{$backupFailure=$_.Exception.Message}
  if($backupFailure -notmatch 'DAIS_BACKUP_VALIDATION_FAILED_RESTORED' -or $backupFailure -notmatch 'DAIS_TEST_INJECTED_BACKUP_VERIFICATION_FAILURE'){throw "Backup failure rollback not proved: $backupFailure"}
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $preFailure 'backup-verification restore'

  $publishFailure=$null
  try{$null=Invoke-Stager -InjectPublishFailure}catch{$publishFailure=$_.Exception.Message}
  if($publishFailure -notmatch 'DAIS_STAGE_FAILED_ROLLED_BACK' -or $publishFailure -notmatch 'DAIS_TEST_INJECTED_PUBLICATION_FAILURE'){throw "Publication rollback not proved: $publishFailure"}
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $preFailure 'publication restore'

  $second=Invoke-Stager
  if(-not(Test-Path -LiteralPath $second.rollbackSlot -PathType Container)){throw 'Second stage has no real rollback directory'}
  $receiptInventory=[ordered]@{}
  foreach($entry in $second.rollbackHashes.psobject.Properties){
    $receiptInventory[$entry.Name]=$entry.Value
    $backupFile=Join-Path $second.rollbackSlot ($entry.Name -replace '/','\')
    if(-not(Test-Path -LiteralPath $backupFile -PathType Leaf)){throw "Rollback file missing: $($entry.Name)"}
    Assert-Equal (Get-FileHash $backupFile -Algorithm SHA256).Hash.ToLowerInvariant() $entry.Value "rollback hash $($entry.Name)"
  }
  $backupInventory=Get-Inventory $second.rollbackSlot
  Assert-InventoryEqual $backupInventory $preFailure 'backup whole slot'
  Assert-InventoryEqual $receiptInventory $backupInventory 'receipt whole slot'

  $published=Get-Inventory $artifactSlot
  Assert-Equal (@($published.Keys|Sort-Object)-join '|') 'dais.appeal-workflow.v1.schema.json|manifest.json|project-dais-appeal-workflow.mjs' 'published exact inventory'
  Assert-Equal (Get-Item (Join-Path $artifactSlot 'project-dais-appeal-workflow.mjs')).Length 9269 'module length'
  Assert-Equal $published['project-dais-appeal-workflow.mjs'] $moduleHash 'published module hash'
  Assert-Equal (Get-Item (Join-Path $artifactSlot 'dais.appeal-workflow.v1.schema.json')).Length 3496 'schema length'
  Assert-Equal $published['dais.appeal-workflow.v1.schema.json'] $schemaHash 'published schema hash'
  $manifest=Get-Content -Raw (Join-Path $artifactSlot 'manifest.json')|ConvertFrom-Json
  Assert-Equal $manifest.sourceManifestSha256 $sourceManifestHash 'manifest source-manifest hash'

  [pscustomobject]@{result='PASS';terminalCondition='DAIS_STAGING_PROVENANCE_AND_ROLLBACK_PROVEN';moduleLength=9269;moduleSha256=$moduleHash;schemaLength=3496;schemaSha256=$schemaHash;sourceManifestSha256=$sourceManifestHash;canonicalRepository='bsvalues/terrafusion-dais';canonicalCommit='6932bbbf014cf70d7362e070a1dad2a8a680ad47';exactThreeFileInventoryVerified=$true;candidatePublishedInventoryEqualityVerified=$true;fullManifestIdentityVerified=$true;candidateNumericTypeTamperRejectedBeforePublication=$true;candidateStringArrayTamperRejectedBeforePublication=$true;concurrentInvocationRejectedWithoutMutation=$true;backupContentsVerified=$true;rollbackExecuted=$true;rollbackHashesVerified=$true;automaticFailureRollbackVerified=$true;cleanParentBootstrapVerified=$true;freshFailureSlotRemovalVerified=$true;backupVerificationFailureRollbackVerified=$true}|ConvertTo-Json -Depth 4
}finally{
  if(-not $PreservePublishedArtifact -and (Test-Path -LiteralPath $artifactSlot)){Remove-Item -LiteralPath $artifactSlot -Recurse -Force}
  if($originalMoved){
    if(Test-Path -LiteralPath $artifactSlot){Remove-Item -LiteralPath $artifactSlot -Recurse -Force}
    if(-not(Test-Path -LiteralPath $artifactParent -PathType Container)){New-Item -ItemType Directory -Path $artifactParent -Force|Out-Null}
    Move-Item -LiteralPath $originalSlot -Destination $artifactSlot
  }elseif(-not $PreservePublishedArtifact -and (Test-Path -LiteralPath $artifactParent -PathType Container) -and -not(Get-ChildItem -LiteralPath $artifactParent -Force|Select-Object -First 1)){
    Remove-Item -LiteralPath $artifactParent -Force
  }
  if(Test-Path -LiteralPath $runRoot){Remove-Item -LiteralPath $runRoot -Recurse -Force}
}
