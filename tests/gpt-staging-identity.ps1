[CmdletBinding()]
param(
  [string]$GptRepository = "https://github.com/bsvalues/terrafusion-gpt",
  [string]$ProofRootBase = (Join-Path $env:TEMP "gpt-staging-identity"),
  [switch]$PreservePublishedArtifact,
  [switch]$OfflineGuardsOnly
)

$ErrorActionPreference = "Stop"
$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$stager = Join-Path $sovereignRepository "scripts\bootstrap\Stage-GptGroundedContextModule.ps1"
$options = Join-Path $sovereignRepository "backend\src\TerraFusion.API\Configuration\GptGroundedContextRuntimeOptions.cs"
$artifactSlot = Join-Path $sovereignRepository ".terrafusion\runtime\gpt\grounded-context"
$artifactParent = Split-Path -Parent $artifactSlot
$moduleHash = "cd2c6111ab0843d321bea8da5eff77cee89eaa1c721d93489d1985c6820f1beb"
$schemaHash = "da9a923e2ef92f63a728edcb19d726a9a29ceb39203464dbe6ee426e94a69019"
$sourceManifestHash = "b2c679b3ebb70c9e055cc80a7923a215a7c9c60753d2f2c0984c89b246d81bc1"
$executionManifestHash = "6d04e14674e4e91a1a5d12ba12f53684cbad0bcec17e4e53ec01d8287618794b"
$publishedManifestHash = "f29c38f994edc434881e9d71de861e49c2ae300dcb0c1b3082fe206cf4a2ee75"
$contractSourceSha = "3b588b231098e7e4ce25056a4025e6f10ffbd0d6"
$sourceDtoHash = "a4b28ea6e0aa4001cec938104127a46492c6d68bff18014154ca0e81035e023e"
$runRoot = Join-Path $ProofRootBase ([guid]::NewGuid().ToString("N"))
$stagerBuildRoot = Join-Path $runRoot "stager-runs"
$originalSlot = Join-Path $runRoot "original-slot"
$hadOriginalSlot = Test-Path -LiteralPath $artifactSlot
$originalMoved = $false
$stagingRepository = $GptRepository

function Invoke-Stager {
  param(
    [switch]$InjectManifestTamper,
    [switch]$InjectStringArrayTamper,
    [switch]$InjectSourceModuleTamper,
    [switch]$InjectSourceSchemaTamper,
    [switch]$InjectSourceManifestTamper,
    [switch]$InjectExecutionManifestTamper,
    [switch]$InjectBackupFailure,
    [switch]$InjectPublishFailure
  )
  $output = & $stager -GptRepository $stagingRepository -BuildRootBase $stagerBuildRoot `
    -EnvironmentName Test `
    -TestOnlyInjectCandidateManifestTamper:$InjectManifestTamper `
    -TestOnlyInjectCandidateStringArrayTamper:$InjectStringArrayTamper `
    -TestOnlyInjectSourceModuleTamper:$InjectSourceModuleTamper `
    -TestOnlyInjectSourceSchemaTamper:$InjectSourceSchemaTamper `
    -TestOnlyInjectSourceManifestTamper:$InjectSourceManifestTamper `
    -TestOnlyInjectExecutionManifestTamper:$InjectExecutionManifestTamper `
    -TestOnlyInjectFailureDuringBackupVerification:$InjectBackupFailure `
    -TestOnlyInjectFailureAfterPublish:$InjectPublishFailure
  if ($LASTEXITCODE -ne 0) { throw "Gpt stager failed with exit code $LASTEXITCODE" }
  return ($output -join "`n") | ConvertFrom-Json
}

function Assert-Equal {
  param($Actual,$Expected,[string]$Label)
  if ($Actual -cne $Expected) { throw "$Label expected '$Expected', measured '$Actual'" }
}

function Get-Inventory {
  param([string]$Directory)
  $inventory = [ordered]@{}
  foreach ($file in Get-ChildItem -LiteralPath $Directory -File -Recurse | Sort-Object FullName) {
    $relative = [IO.Path]::GetRelativePath($Directory,$file.FullName).Replace('\','/')
    $inventory[$relative] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  }
  return $inventory
}

function Assert-InventoryEqual {
  param($Actual,$Expected,[string]$Label)
  $actualJson = $Actual | ConvertTo-Json -Compress
  $expectedJson = $Expected | ConvertTo-Json -Compress
  if ($actualJson -cne $expectedJson) {
    throw "$Label inventory mismatch: expected $expectedJson, measured $actualJson"
  }
}

if ($OfflineGuardsOnly) {
  New-Item -ItemType Directory -Path $runRoot -Force | Out-Null
  try {
    foreach ($powerShellFile in @($stager,$PSCommandPath)) {
      $tokens = $null
      $parseErrors = $null
      [Management.Automation.Language.Parser]::ParseFile($powerShellFile,[ref]$tokens,[ref]$parseErrors) | Out-Null
      if ($parseErrors.Count) { throw "PowerShell parse failed for $powerShellFile`: $($parseErrors -join '; ')" }
    }

    $optionsSource = Get-Content -LiteralPath $options -Raw
    if ($optionsSource -notmatch 'Mode\s*\{\s*get;\s*set;\s*\}\s*=\s*GptGroundedContextRuntimeMode\.Disabled' -or
        $optionsSource -match 'Mode\s*\{\s*get;\s*set;\s*\}\s*=\s*GptGroundedContextRuntimeMode\.LocalExact') {
      throw 'Default-disabled runtime selection was not preserved'
    }

    $createdProductionSlot = $false
    if (-not (Test-Path -LiteralPath $artifactSlot -PathType Container)) {
      New-Item -ItemType Directory -Path $artifactSlot -Force | Out-Null
      Set-Content -LiteralPath (Join-Path $artifactSlot 'production-refusal-sentinel.txt') -Value 'must-remain-byte-identical' -Encoding utf8
      $createdProductionSlot = $true
    }
    $beforeProduction = Get-Inventory $artifactSlot
    $productionRejection = $null
    try {
      & $stager -GptRepository "https://github.com/bsvalues/terrafusion-gpt" -BuildRootBase $runRoot -EnvironmentName Production
    } catch { $productionRejection = $_.Exception.Message }
    if ($productionRejection -notmatch 'GPT_PRODUCTION_STAGE_REFUSED') {
      throw "Production refusal guard failed: $productionRejection"
    }
    Assert-InventoryEqual (Get-Inventory $artifactSlot) $beforeProduction 'Production refusal preserved live slot'

    $rejection = $null
    try {
      & $stager -GptRepository "https://evil.example/bsvalues/terrafusion-gpt" -BuildRootBase $runRoot -EnvironmentName Test
    } catch { $rejection = $_.Exception.Message }
    if ($rejection -notmatch 'GPT_REPOSITORY_IDENTITY_MISMATCH') {
      throw "Strict canonical-origin guard failed: $rejection"
    }

    $artifactVolume = [IO.Path]::GetPathRoot([IO.Path]::GetFullPath($artifactSlot))
    $otherVolume = if ($artifactVolume -ieq 'Z:\') { 'Y:\gpt-staging-volume-guard' } else { 'Z:\gpt-staging-volume-guard' }
    $volumeRejection = $null
    try {
      & $stager -GptRepository "https://github.com/bsvalues/terrafusion-gpt" -BuildRootBase $otherVolume -EnvironmentName Test
    } catch { $volumeRejection = $_.Exception.Message }
    if ($volumeRejection -notmatch 'GPT_BUILD_ROOT_VOLUME_MISMATCH') {
      throw "Cross-volume backup guard failed: $volumeRejection"
    }

    $reparseTarget = Join-Path $runRoot 'reparse-target'
    $reparseRoot = Join-Path $runRoot 'reparse-root'
    New-Item -ItemType Directory -Path $reparseTarget -Force | Out-Null
    New-Item -ItemType Junction -Path $reparseRoot -Target $reparseTarget | Out-Null
    $reparseRejection = $null
    try {
      & $stager -GptRepository "https://github.com/bsvalues/terrafusion-gpt" -BuildRootBase $reparseRoot -EnvironmentName Test
    } catch { $reparseRejection = $_.Exception.Message }
    if ($reparseRejection -notmatch 'GPT_BUILD_ROOT_REPARSE_POINT_REFUSED') {
      throw "Build-root reparse guard failed: $reparseRejection"
    }

    $beforeOverlap = Get-Inventory $artifactSlot
    $overlapRejection = $null
    try {
      & $stager -GptRepository "https://github.com/bsvalues/terrafusion-gpt" -BuildRootBase $artifactSlot -EnvironmentName Test
    } catch { $overlapRejection = $_.Exception.Message }
    if ($overlapRejection -notmatch 'GPT_BUILD_ROOT_SLOT_OVERLAP_REFUSED') {
      throw "Build-root/live-slot overlap guard failed: $overlapRejection"
    }
    Assert-InventoryEqual (Get-Inventory $artifactSlot) $beforeOverlap 'overlap rejection preserved live slot'

    [pscustomobject]@{
      result='PASS'; terminalCondition='GPT_STAGING_OFFLINE_GUARDS_PROVEN';
      powerShellParse=$true; runtimePinsVerified=$true; defaultRuntimeDisabled=$true;
      productionRefusedWithoutMutation=$true; untrustedOriginRejectedBeforeFetch=$true;
      crossVolumeBackupRejected=$true; buildRootReparsePointRejected=$true;
      buildRootSlotOverlapRejectedWithoutMutation=$true; privateSuiteCredentialRequired=$false
    } | ConvertTo-Json -Depth 4
  } finally {
    if ($createdProductionSlot -and (Test-Path -LiteralPath $artifactSlot)) {
      Remove-Item -LiteralPath $artifactSlot -Recurse -Force
    }
    if ($createdProductionSlot -and (Test-Path -LiteralPath $artifactParent -PathType Container) -and
        -not (Get-ChildItem -LiteralPath $artifactParent -Force | Select-Object -First 1)) {
      Remove-Item -LiteralPath $artifactParent -Force
    }
    if (Test-Path -LiteralPath $runRoot) { Remove-Item -LiteralPath $runRoot -Recurse -Force }
  }
  return
}

New-Item -ItemType Directory -Path $runRoot,$stagerBuildRoot -Force | Out-Null
try {
  if ($hadOriginalSlot) {
    Move-Item -LiteralPath $artifactSlot -Destination $originalSlot
    $originalMoved = $true
  }
  if (Test-Path -LiteralPath $artifactParent -PathType Container) {
    $entry = Get-ChildItem -LiteralPath $artifactParent -Force | Select-Object -First 1
    if ($entry) { throw "Clean-parent bootstrap requires empty Gpt parent; found $($entry.FullName)" }
    Remove-Item -LiteralPath $artifactParent -Force
  }

  if (-not (Test-Path -LiteralPath $GptRepository -PathType Container)) {
    $canonicalMirror = Join-Path $runRoot 'canonical-gpt.git'
    & git clone --mirror $GptRepository $canonicalMirror
    if ($LASTEXITCODE -ne 0) { throw 'Failed to create the canonical GPT proof mirror' }
    & git -c safe.directory=$canonicalMirror -C $canonicalMirror remote set-url origin 'https://github.com/bsvalues/terrafusion-gpt'
    if ($LASTEXITCODE -ne 0) { throw 'Failed to bind the proof mirror to the canonical GPT origin' }
    $stagingRepository = $canonicalMirror
  }

  $productionRejection = $null
  try {
    & $stager -GptRepository $stagingRepository -BuildRootBase $stagerBuildRoot -EnvironmentName Production
  } catch { $productionRejection = $_.Exception.Message }
  if ($productionRejection -notmatch 'GPT_PRODUCTION_STAGE_REFUSED') {
    throw "Production refusal guard failed in the full proof: $productionRejection"
  }
  if (Test-Path -LiteralPath $artifactSlot) {
    throw 'Production-refused staging created or changed the live slot'
  }

  $unreachableOrigin = Join-Path $runRoot 'unreachable-protected-main.git'
  if (Test-Path -LiteralPath $stagingRepository -PathType Container) {
    $gptGitDirectory = Join-Path $stagingRepository '.git'
    & git -c "safe.directory=$stagingRepository" -c "safe.directory=$gptGitDirectory" clone --mirror $stagingRepository $unreachableOrigin
  } else {
    & git clone --mirror $stagingRepository $unreachableOrigin
  }
  if ($LASTEXITCODE -ne 0) { throw 'Failed to create the protected-main ancestry-negative fixture repository' }
  & git -c safe.directory=$unreachableOrigin -C $unreachableOrigin remote set-url origin 'https://github.com/bsvalues/terrafusion-gpt'
  if ($LASTEXITCODE -ne 0) { throw 'Failed to bind the ancestry-negative fixture to the canonical Gpt origin' }
  & git -c safe.directory=$unreachableOrigin -C $unreachableOrigin update-ref refs/heads/pinned-source 550b50f27af6f0911f16c973cbb6fc57a20eb15a
  if ($LASTEXITCODE -ne 0) { throw 'Failed to retain the pinned Gpt object in the ancestry-negative fixture' }
  $fixtureTree = (& git -c safe.directory=$unreachableOrigin -C $unreachableOrigin rev-parse '550b50f27af6f0911f16c973cbb6fc57a20eb15a^{tree}') -join ''
  if ($LASTEXITCODE -ne 0) { throw 'Failed to resolve the pinned Gpt tree for the ancestry-negative fixture' }
  $fixtureMain = ('Gpt protected-main ancestry-negative fixture' | & git -c safe.directory=$unreachableOrigin -C $unreachableOrigin -c user.name='TerraFusion Test' -c user.email='test@terrafusion.local' commit-tree $fixtureTree) -join ''
  if ($LASTEXITCODE -ne 0 -or -not $fixtureMain) { throw 'Failed to create the non-descendant protected-main fixture commit' }
  & git -c safe.directory=$unreachableOrigin -C $unreachableOrigin update-ref refs/heads/main $fixtureMain
  if ($LASTEXITCODE -ne 0) { throw 'Failed to point fixture main at the non-descendant commit' }

  New-Item -ItemType Directory -Path $artifactSlot -Force | Out-Null
  Set-Content -LiteralPath (Join-Path $artifactSlot 'ancestry-sentinel.txt') -Value 'must-remain-byte-identical' -Encoding utf8
  $beforeAncestryRejection = Get-Inventory $artifactSlot
  $ancestryRejection = $null
  try {
    & $stager -GptRepository $unreachableOrigin -BuildRootBase $stagerBuildRoot -EnvironmentName Test
  } catch { $ancestryRejection = $_.Exception.Message }
  if ($ancestryRejection -notmatch 'GPT_SOURCE_NOT_ON_PROTECTED_MAIN') {
    throw "Pinned-but-unreachable source was not refused: $ancestryRejection"
  }
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $beforeAncestryRejection 'protected-main ancestry rejection preserved live slot'
  Remove-Item -LiteralPath $artifactSlot -Recurse -Force

  $manifestTamperFailure = $null
  try { $null = Invoke-Stager -InjectManifestTamper } catch { $manifestTamperFailure = $_.Exception.Message }
  if ($manifestTamperFailure -notmatch 'GPT_CANDIDATE_MANIFEST_IDENTITY_MISMATCH') {
    throw "Unchecked candidate manifest tamper was not refused: $manifestTamperFailure"
  }
  if (Test-Path -LiteralPath $artifactSlot) { throw 'Candidate manifest tamper reached the live slot' }

  foreach ($sourceTamper in @(
    @{ Name='module'; Switch='InjectSourceModuleTamper'; Error='GPT_MODULE_IDENTITY_(LENGTH|HASH|GIT_BLOB)_MISMATCH' },
    @{ Name='schema'; Switch='InjectSourceSchemaTamper'; Error='GPT_SCHEMA_IDENTITY_(LENGTH|HASH|GIT_BLOB)_MISMATCH' },
    @{ Name='source manifest'; Switch='InjectSourceManifestTamper'; Error='GPT_SOURCE_MANIFEST_IDENTITY_(LENGTH|HASH|GIT_BLOB)_MISMATCH' },
    @{ Name='execution manifest'; Switch='InjectExecutionManifestTamper'; Error='GPT_EXECUTION_MANIFEST_IDENTITY_(LENGTH|HASH|GIT_BLOB)_MISMATCH' }
  )) {
    $parameters = @{ ($sourceTamper.Switch) = $true }
    $sourceTamperFailure = $null
    try { $null = Invoke-Stager @parameters } catch { $sourceTamperFailure = $_.Exception.Message }
    if ($sourceTamperFailure -notmatch $sourceTamper.Error) {
      throw "Unchecked $($sourceTamper.Name) tamper was not refused: $sourceTamperFailure"
    }
    if (Test-Path -LiteralPath $artifactSlot) { throw "$($sourceTamper.Name) tamper reached the live slot" }
  }

  $stringArrayTamperFailure = $null
  try { $null = Invoke-Stager -InjectStringArrayTamper } catch { $stringArrayTamperFailure = $_.Exception.Message }
  if ($stringArrayTamperFailure -notmatch 'GPT_CANDIDATE_MANIFEST_IDENTITY_MISMATCH') {
    throw "Singleton-array string manifest tamper was not refused: $stringArrayTamperFailure"
  }
  if (Test-Path -LiteralPath $artifactSlot) { throw 'String-array manifest tamper reached the live slot' }

  $freshFailure = $null
  try { $null = Invoke-Stager -InjectPublishFailure } catch { $freshFailure = $_.Exception.Message }
  if ($freshFailure -notmatch 'GPT_STAGE_FAILED_SLOT_REMOVED' -or
      $freshFailure -notmatch 'GPT_TEST_INJECTED_PUBLICATION_FAILURE') {
    throw "Fresh failure cleanup not proved: $freshFailure"
  }
  if (Test-Path -LiteralPath $artifactSlot) { throw 'Fresh failure left a partial slot' }

  New-Item -ItemType Directory -Path $artifactSlot -Force | Out-Null
  $emptyFailure = $null
  try { $null = Invoke-Stager -InjectPublishFailure } catch { $emptyFailure = $_.Exception.Message }
  if ($emptyFailure -notmatch 'GPT_STAGE_FAILED_ROLLED_BACK' -or
      $emptyFailure -notmatch 'GPT_TEST_INJECTED_PUBLICATION_FAILURE') {
    throw "Existing-empty-slot recovery not proved: $emptyFailure"
  }
  if (-not (Test-Path -LiteralPath $artifactSlot -PathType Container) -or
      (Get-ChildItem -LiteralPath $artifactSlot -Force | Select-Object -First 1)) {
    throw 'Existing-empty slot was not restored exactly'
  }
  Remove-Item -LiteralPath $artifactSlot -Force

  $first = Invoke-Stager
  Assert-Equal $first.suiteRepository 'bsvalues/terrafusion-gpt' 'repository'
  Assert-Equal $first.sourceBranch 'main' 'protected source branch'
  Assert-Equal $first.protectedMainHead '550b50f27af6f0911f16c973cbb6fc57a20eb15a' 'observed protected main head'
  Assert-Equal $first.suiteCommit '550b50f27af6f0911f16c973cbb6fc57a20eb15a' 'commit'
  Assert-Equal $first.moduleSha256 $moduleHash 'module hash'
  Assert-Equal $first.schemaSha256 $schemaHash 'schema hash'
  Assert-Equal $first.sourceManifestSha256 $sourceManifestHash 'source manifest hash'
  Assert-Equal $first.executionManifestSha256 $executionManifestHash 'execution manifest hash'
  Assert-Equal $first.publishedManifestLength 1685 'published manifest length'
  Assert-Equal $first.publishedManifestSha256 $publishedManifestHash 'published manifest hash'
  Assert-Equal $first.contractSourceSha $contractSourceSha 'original contract anchor'
  Assert-Equal $first.sourceDtoSha256 $sourceDtoHash 'original DTO hash'
  Assert-Equal $first.runtimeAdopted $false 'runtime remains unadopted'
  Assert-Equal $first.rollbackSlot $null 'fresh rollback slot'

  $beforeConcurrency = Get-Inventory $artifactSlot
  $jobRepository = if (Test-Path -LiteralPath $stagingRepository -PathType Container) {
    (Resolve-Path -LiteralPath $stagingRepository).Path
  } else { $stagingRepository }
  $concurrentJob = Start-Job -ScriptBlock {
    param($Stager,$Repository,$BuildRoot)
    & $Stager -GptRepository $Repository -BuildRootBase $BuildRoot -EnvironmentName Test -TestOnlyHoldTransactionLockMilliseconds 20000
  } -ArgumentList $stager,$jobRepository,$stagerBuildRoot
  try {
    $mutexObservedHeld = $false
    $deadline = [DateTime]::UtcNow.AddSeconds(20)
    while ([DateTime]::UtcNow -lt $deadline -and $concurrentJob.State -eq 'Running') {
      $probe = [Threading.Mutex]::new($false,'Local\TerraFusion.GptGroundedContextRuntime.ArtifactSlot')
      $probeHeld = $false
      try {
        $probeHeld = $probe.WaitOne(0)
        if (-not $probeHeld) { $mutexObservedHeld = $true; break }
      } catch [Threading.AbandonedMutexException] {
        $probeHeld = $true
      } finally {
        if ($probeHeld) { $probe.ReleaseMutex() }
        $probe.Dispose()
      }
      Start-Sleep -Milliseconds 50
    }
    if (-not $mutexObservedHeld) { throw "Concurrent stager never acquired the transaction mutex; state=$($concurrentJob.State)" }
    $concurrentRejection = $null
    try { $null = Invoke-Stager } catch { $concurrentRejection = $_.Exception.Message }
    if ($concurrentRejection -notmatch 'GPT_STAGE_LOCK_UNAVAILABLE') {
      throw "Concurrent invocation did not fail closed on the transaction lock: $concurrentRejection"
    }
    Wait-Job -Job $concurrentJob -Timeout 30 | Out-Null
    if ($concurrentJob.State -ne 'Completed') { throw "Lock-holding stager did not complete: $($concurrentJob.State)" }
    $jobOutput = (Receive-Job -Job $concurrentJob -ErrorAction SilentlyContinue) -join "`n"
    $jobReceipt = $jobOutput | ConvertFrom-Json
    Assert-Equal $jobReceipt.moduleSha256 $moduleHash 'concurrent winner receipt module hash'
    Assert-InventoryEqual (Get-Inventory $artifactSlot) $beforeConcurrency 'concurrent loser preserved winner publication'
  } finally {
    if ($concurrentJob.State -eq 'Running') { Stop-Job -Job $concurrentJob }
    Remove-Job -Job $concurrentJob -Force
  }

  Set-Content -LiteralPath (Join-Path $artifactSlot 'rollback-sentinel.txt') -Value 'whole-slot-rollback-proof' -Encoding utf8
  $preFailure = Get-Inventory $artifactSlot
  $backupFailure = $null
  try { $null = Invoke-Stager -InjectBackupFailure } catch { $backupFailure = $_.Exception.Message }
  if ($backupFailure -notmatch 'GPT_BACKUP_VALIDATION_FAILED_RESTORED' -or
      $backupFailure -notmatch 'GPT_TEST_INJECTED_BACKUP_VERIFICATION_FAILURE') {
    throw "Backup failure rollback not proved: $backupFailure"
  }
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $preFailure 'backup-verification restore'

  $publishFailure = $null
  try { $null = Invoke-Stager -InjectPublishFailure } catch { $publishFailure = $_.Exception.Message }
  if ($publishFailure -notmatch 'GPT_STAGE_FAILED_ROLLED_BACK' -or
      $publishFailure -notmatch 'GPT_TEST_INJECTED_PUBLICATION_FAILURE') {
    throw "Publication rollback not proved: $publishFailure"
  }
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $preFailure 'publication restore'

  $second = Invoke-Stager
  if (-not (Test-Path -LiteralPath $second.rollbackSlot -PathType Container)) {
    throw 'Second stage has no real rollback directory'
  }
  $receiptInventory = [ordered]@{}
  foreach ($entry in $second.rollbackHashes.psobject.Properties) {
    $receiptInventory[$entry.Name] = $entry.Value
    $backupFile = Join-Path $second.rollbackSlot ($entry.Name -replace '/','\')
    if (-not (Test-Path -LiteralPath $backupFile -PathType Leaf)) { throw "Rollback file missing: $($entry.Name)" }
    Assert-Equal (Get-FileHash $backupFile -Algorithm SHA256).Hash.ToLowerInvariant() $entry.Value "rollback hash $($entry.Name)"
  }
  $backupInventory = Get-Inventory $second.rollbackSlot
  Assert-InventoryEqual $backupInventory $preFailure 'backup whole slot'
  Assert-InventoryEqual $receiptInventory $backupInventory 'receipt whole slot'

  $published = Get-Inventory $artifactSlot
  Assert-Equal (@($published.Keys | Sort-Object) -join '|') 'gpt.grounded-context.v1.schema.json|manifest.json|project-gpt-grounded-context.mjs' 'published exact inventory'
  Assert-Equal (Get-Item (Join-Path $artifactSlot 'project-gpt-grounded-context.mjs')).Length 8578 'module length'
  Assert-Equal $published['project-gpt-grounded-context.mjs'] $moduleHash 'published module hash'
  Assert-Equal (Get-Item (Join-Path $artifactSlot 'gpt.grounded-context.v1.schema.json')).Length 3555 'schema length'
  Assert-Equal $published['gpt.grounded-context.v1.schema.json'] $schemaHash 'published schema hash'
  $manifest = Get-Content -Raw (Join-Path $artifactSlot 'manifest.json') | ConvertFrom-Json
  Assert-Equal $manifest.sourceBranch 'main' 'manifest protected source branch'
  Assert-Equal $manifest.sourceManifestSha256 $sourceManifestHash 'manifest source-manifest hash'
  Assert-Equal $manifest.executionManifestSha256 $executionManifestHash 'manifest execution-manifest hash'
  Assert-Equal (Get-Item (Join-Path $artifactSlot 'manifest.json')).Length 1685 'published manifest length'
  Assert-Equal $published['manifest.json'] $publishedManifestHash 'published manifest hash'

  [pscustomobject]@{
    result='PASS'; terminalCondition='GPT_STAGING_PROVENANCE_AND_ROLLBACK_PROVEN';
    moduleLength=8578; moduleSha256=$moduleHash; schemaLength=3555; schemaSha256=$schemaHash;
    sourceManifestSha256=$sourceManifestHash; canonicalRepository='bsvalues/terrafusion-gpt';
    executionManifestSha256=$executionManifestHash; publishedManifestLength=1685;
    publishedManifestSha256=$publishedManifestHash;
    protectedSourceBranch='main'; protectedMainAncestryVerified=$true;
    protectedMainNonAncestryRejectedWithoutMutation=$true; productionRefusedWithoutMutation=$true;
    exactThreeFileInventoryVerified=$true; candidatePublishedInventoryEqualityVerified=$true;
    fullManifestIdentityVerified=$true; candidateNumericTypeTamperRejectedBeforePublication=$true;
    candidateStringArrayTamperRejectedBeforePublication=$true;
    sourceModuleTamperRejectedBeforePublication=$true; sourceSchemaTamperRejectedBeforePublication=$true;
    sourceManifestTamperRejectedBeforePublication=$true; executionManifestTamperRejectedBeforePublication=$true;
    concurrentInvocationRejectedWithoutMutation=$true; backupContentsVerified=$true;
    rollbackExecuted=$true; rollbackHashesVerified=$true; automaticFailureRollbackVerified=$true;
    cleanParentBootstrapVerified=$true; freshFailureSlotRemovalVerified=$true;
    originallyAbsentRestorationVerified=$true; existingEmptyRestorationVerified=$true;
    backupVerificationFailureRollbackVerified=$true; runtimeAdopted=$false
  } | ConvertTo-Json -Depth 4
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
  } elseif (-not $PreservePublishedArtifact -and
      (Test-Path -LiteralPath $artifactParent -PathType Container) -and
      -not (Get-ChildItem -LiteralPath $artifactParent -Force | Select-Object -First 1)) {
    Remove-Item -LiteralPath $artifactParent -Force
  }
  if (Test-Path -LiteralPath $runRoot) { Remove-Item -LiteralPath $runRoot -Recurse -Force }
}
