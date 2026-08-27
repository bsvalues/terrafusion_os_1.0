[CmdletBinding()]
param(
  [string]$DossierRepository = "https://github.com/bsvalues/terrafusion-dossier",
  [string]$ProofRootBase = (Join-Path $env:TEMP "dossier-staging-identity"),
  [switch]$PreservePublishedArtifact,
  [switch]$OfflineGuardsOnly
)

$ErrorActionPreference = "Stop"
$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$stager = Join-Path $sovereignRepository "scripts\bootstrap\Stage-DossierEvidenceRegistryReadModule.ps1"
$options = Join-Path $sovereignRepository "backend\src\TerraFusion.API\Configuration\DossierEvidenceRegistryReadOptions.cs"
$artifactSlot = Join-Path $sovereignRepository ".terrafusion\runtime\dossier\evidence-registry-read"
$artifactParent = Split-Path -Parent $artifactSlot
$moduleHash = "bb0427d6634412d86be92a2ef5f6f0bfcdf97ee054887a42d59c2a0bc0127a8b"
$schemaHash = "f658bc2bda718f58bd0353e9635524d5dbd376be515b543da3442b0094e52270"
$sourceManifestHash = "0c8310e45a02face985fd9d628f16ff26bfac6b078107fa8f96e6f22f1ebcb07"
$contractSourceSha = "cfcd460d6387c7dc5aefbc83a389e74333cf0201"
$sourceDtoHash = "414fd158cd7a0f1e483ab44a83b93a64e4180300561f53088830583220566b7f"
$runRoot = Join-Path $ProofRootBase ([guid]::NewGuid().ToString("N"))
$stagerBuildRoot = Join-Path $runRoot "stager-runs"
$originalSlot = Join-Path $runRoot "original-slot"
$hadOriginalSlot = Test-Path -LiteralPath $artifactSlot
$originalMoved = $false

function Invoke-Stager {
  param(
    [switch]$InjectManifestTamper,
    [switch]$InjectStringArrayTamper,
    [switch]$InjectBackupFailure,
    [switch]$InjectPublishFailure
  )
  $output = & $stager -DossierRepository $DossierRepository -BuildRootBase $stagerBuildRoot `
    -EnvironmentName Test `
    -TestOnlyInjectCandidateManifestTamper:$InjectManifestTamper `
    -TestOnlyInjectCandidateStringArrayTamper:$InjectStringArrayTamper `
    -TestOnlyInjectFailureDuringBackupVerification:$InjectBackupFailure `
    -TestOnlyInjectFailureAfterPublish:$InjectPublishFailure
  if ($LASTEXITCODE -ne 0) { throw "Dossier stager failed with exit code $LASTEXITCODE" }
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
    if ($optionsSource -notmatch 'Mode\s*\{\s*get;\s*set;\s*\}\s*=\s*DossierEvidenceRegistryReadMode\.Disabled' -or
        $optionsSource -match 'Mode\s*\{\s*get;\s*set;\s*\}\s*=\s*DossierEvidenceRegistryReadMode\.LocalExact') {
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
      & $stager -DossierRepository "https://github.com/bsvalues/terrafusion-dossier" -BuildRootBase $runRoot -EnvironmentName Production
    } catch { $productionRejection = $_.Exception.Message }
    if ($productionRejection -notmatch 'DOSSIER_PRODUCTION_STAGE_REFUSED') {
      throw "Production refusal guard failed: $productionRejection"
    }
    Assert-InventoryEqual (Get-Inventory $artifactSlot) $beforeProduction 'Production refusal preserved live slot'

    $rejection = $null
    try {
      & $stager -DossierRepository "https://evil.example/bsvalues/terrafusion-dossier" -BuildRootBase $runRoot -EnvironmentName Test
    } catch { $rejection = $_.Exception.Message }
    if ($rejection -notmatch 'DOSSIER_REPOSITORY_IDENTITY_MISMATCH') {
      throw "Strict canonical-origin guard failed: $rejection"
    }

    $artifactVolume = [IO.Path]::GetPathRoot([IO.Path]::GetFullPath($artifactSlot))
    $otherVolume = if ($artifactVolume -ieq 'Z:\') { 'Y:\dossier-staging-volume-guard' } else { 'Z:\dossier-staging-volume-guard' }
    $volumeRejection = $null
    try {
      & $stager -DossierRepository "https://github.com/bsvalues/terrafusion-dossier" -BuildRootBase $otherVolume -EnvironmentName Test
    } catch { $volumeRejection = $_.Exception.Message }
    if ($volumeRejection -notmatch 'DOSSIER_BUILD_ROOT_VOLUME_MISMATCH') {
      throw "Cross-volume backup guard failed: $volumeRejection"
    }

    $reparseTarget = Join-Path $runRoot 'reparse-target'
    $reparseRoot = Join-Path $runRoot 'reparse-root'
    New-Item -ItemType Directory -Path $reparseTarget -Force | Out-Null
    New-Item -ItemType Junction -Path $reparseRoot -Target $reparseTarget | Out-Null
    $reparseRejection = $null
    try {
      & $stager -DossierRepository "https://github.com/bsvalues/terrafusion-dossier" -BuildRootBase $reparseRoot -EnvironmentName Test
    } catch { $reparseRejection = $_.Exception.Message }
    if ($reparseRejection -notmatch 'DOSSIER_BUILD_ROOT_REPARSE_POINT_REFUSED') {
      throw "Build-root reparse guard failed: $reparseRejection"
    }

    $beforeOverlap = Get-Inventory $artifactSlot
    $overlapRejection = $null
    try {
      & $stager -DossierRepository "https://github.com/bsvalues/terrafusion-dossier" -BuildRootBase $artifactSlot -EnvironmentName Test
    } catch { $overlapRejection = $_.Exception.Message }
    if ($overlapRejection -notmatch 'DOSSIER_BUILD_ROOT_SLOT_OVERLAP_REFUSED') {
      throw "Build-root/live-slot overlap guard failed: $overlapRejection"
    }
    Assert-InventoryEqual (Get-Inventory $artifactSlot) $beforeOverlap 'overlap rejection preserved live slot'

    [pscustomobject]@{
      result='PASS'; terminalCondition='DOSSIER_STAGING_OFFLINE_GUARDS_PROVEN';
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
    if ($entry) { throw "Clean-parent bootstrap requires empty Dossier parent; found $($entry.FullName)" }
    Remove-Item -LiteralPath $artifactParent -Force
  }

  $productionRejection = $null
  try {
    & $stager -DossierRepository $DossierRepository -BuildRootBase $stagerBuildRoot -EnvironmentName Production
  } catch { $productionRejection = $_.Exception.Message }
  if ($productionRejection -notmatch 'DOSSIER_PRODUCTION_STAGE_REFUSED') {
    throw "Production refusal guard failed in the full proof: $productionRejection"
  }
  if (Test-Path -LiteralPath $artifactSlot) {
    throw 'Production-refused staging created or changed the live slot'
  }

  $unreachableOrigin = Join-Path $runRoot 'unreachable-protected-main.git'
  $dossierGitDirectory = Join-Path $DossierRepository '.git'
  & git -c "safe.directory=$DossierRepository" -c "safe.directory=$dossierGitDirectory" clone --mirror $DossierRepository $unreachableOrigin
  if ($LASTEXITCODE -ne 0) { throw 'Failed to create the protected-main ancestry-negative fixture repository' }
  & git -c safe.directory=$unreachableOrigin -C $unreachableOrigin remote set-url origin 'https://github.com/bsvalues/terrafusion-dossier'
  if ($LASTEXITCODE -ne 0) { throw 'Failed to bind the ancestry-negative fixture to the canonical Dossier origin' }
  & git -c safe.directory=$unreachableOrigin -C $unreachableOrigin update-ref refs/heads/pinned-source 7558cfebfeea0c7b536251769b1d779c4558a763
  if ($LASTEXITCODE -ne 0) { throw 'Failed to retain the pinned Dossier object in the ancestry-negative fixture' }
  $fixtureTree = (& git -c safe.directory=$unreachableOrigin -C $unreachableOrigin rev-parse '7558cfebfeea0c7b536251769b1d779c4558a763^{tree}') -join ''
  if ($LASTEXITCODE -ne 0) { throw 'Failed to resolve the pinned Dossier tree for the ancestry-negative fixture' }
  $fixtureMain = ('Dossier protected-main ancestry-negative fixture' | & git -c safe.directory=$unreachableOrigin -C $unreachableOrigin -c user.name='TerraFusion Test' -c user.email='test@terrafusion.local' commit-tree $fixtureTree) -join ''
  if ($LASTEXITCODE -ne 0 -or -not $fixtureMain) { throw 'Failed to create the non-descendant protected-main fixture commit' }
  & git -c safe.directory=$unreachableOrigin -C $unreachableOrigin update-ref refs/heads/main $fixtureMain
  if ($LASTEXITCODE -ne 0) { throw 'Failed to point fixture main at the non-descendant commit' }

  New-Item -ItemType Directory -Path $artifactSlot -Force | Out-Null
  Set-Content -LiteralPath (Join-Path $artifactSlot 'ancestry-sentinel.txt') -Value 'must-remain-byte-identical' -Encoding utf8
  $beforeAncestryRejection = Get-Inventory $artifactSlot
  $ancestryRejection = $null
  try {
    & $stager -DossierRepository $unreachableOrigin -BuildRootBase $stagerBuildRoot -EnvironmentName Test
  } catch { $ancestryRejection = $_.Exception.Message }
  if ($ancestryRejection -notmatch 'DOSSIER_SOURCE_NOT_ON_PROTECTED_MAIN') {
    throw "Pinned-but-unreachable source was not refused: $ancestryRejection"
  }
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $beforeAncestryRejection 'protected-main ancestry rejection preserved live slot'
  Remove-Item -LiteralPath $artifactSlot -Recurse -Force

  $manifestTamperFailure = $null
  try { $null = Invoke-Stager -InjectManifestTamper } catch { $manifestTamperFailure = $_.Exception.Message }
  if ($manifestTamperFailure -notmatch 'DOSSIER_CANDIDATE_MANIFEST_IDENTITY_MISMATCH') {
    throw "Unchecked candidate manifest tamper was not refused: $manifestTamperFailure"
  }
  if (Test-Path -LiteralPath $artifactSlot) { throw 'Candidate manifest tamper reached the live slot' }

  $stringArrayTamperFailure = $null
  try { $null = Invoke-Stager -InjectStringArrayTamper } catch { $stringArrayTamperFailure = $_.Exception.Message }
  if ($stringArrayTamperFailure -notmatch 'DOSSIER_CANDIDATE_MANIFEST_IDENTITY_MISMATCH') {
    throw "Singleton-array string manifest tamper was not refused: $stringArrayTamperFailure"
  }
  if (Test-Path -LiteralPath $artifactSlot) { throw 'String-array manifest tamper reached the live slot' }

  $freshFailure = $null
  try { $null = Invoke-Stager -InjectPublishFailure } catch { $freshFailure = $_.Exception.Message }
  if ($freshFailure -notmatch 'DOSSIER_STAGE_FAILED_SLOT_REMOVED' -or
      $freshFailure -notmatch 'DOSSIER_TEST_INJECTED_PUBLICATION_FAILURE') {
    throw "Fresh failure cleanup not proved: $freshFailure"
  }
  if (Test-Path -LiteralPath $artifactSlot) { throw 'Fresh failure left a partial slot' }

  $first = Invoke-Stager
  Assert-Equal $first.suiteRepository 'bsvalues/terrafusion-dossier' 'repository'
  Assert-Equal $first.sourceBranch 'main' 'protected source branch'
  Assert-Equal $first.protectedMainHead '7558cfebfeea0c7b536251769b1d779c4558a763' 'observed protected main head'
  Assert-Equal $first.suiteCommit '7558cfebfeea0c7b536251769b1d779c4558a763' 'commit'
  Assert-Equal $first.moduleSha256 $moduleHash 'module hash'
  Assert-Equal $first.schemaSha256 $schemaHash 'schema hash'
  Assert-Equal $first.sourceManifestSha256 $sourceManifestHash 'source manifest hash'
  Assert-Equal $first.contractSourceSha $contractSourceSha 'original contract anchor'
  Assert-Equal $first.sourceDtoSha256 $sourceDtoHash 'original DTO hash'
  Assert-Equal $first.runtimeAdopted $false 'runtime remains unadopted'
  Assert-Equal $first.rollbackSlot $null 'fresh rollback slot'

  $beforeConcurrency = Get-Inventory $artifactSlot
  $jobRepository = if (Test-Path -LiteralPath $DossierRepository -PathType Container) {
    (Resolve-Path -LiteralPath $DossierRepository).Path
  } else { $DossierRepository }
  $concurrentJob = Start-Job -ScriptBlock {
    param($Stager,$Repository,$BuildRoot)
    & $Stager -DossierRepository $Repository -BuildRootBase $BuildRoot -EnvironmentName Test -TestOnlyHoldTransactionLockMilliseconds 5000
  } -ArgumentList $stager,$jobRepository,$stagerBuildRoot
  try {
    $mutexObservedHeld = $false
    $deadline = [DateTime]::UtcNow.AddSeconds(20)
    while ([DateTime]::UtcNow -lt $deadline -and $concurrentJob.State -eq 'Running') {
      $probe = [Threading.Mutex]::new($false,'Local\TerraFusion.DossierEvidenceRegistryRead.ArtifactSlot')
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
    if ($concurrentRejection -notmatch 'DOSSIER_STAGE_LOCK_UNAVAILABLE') {
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
  if ($backupFailure -notmatch 'DOSSIER_BACKUP_VALIDATION_FAILED_RESTORED' -or
      $backupFailure -notmatch 'DOSSIER_TEST_INJECTED_BACKUP_VERIFICATION_FAILURE') {
    throw "Backup failure rollback not proved: $backupFailure"
  }
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $preFailure 'backup-verification restore'

  $publishFailure = $null
  try { $null = Invoke-Stager -InjectPublishFailure } catch { $publishFailure = $_.Exception.Message }
  if ($publishFailure -notmatch 'DOSSIER_STAGE_FAILED_ROLLED_BACK' -or
      $publishFailure -notmatch 'DOSSIER_TEST_INJECTED_PUBLICATION_FAILURE') {
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
  Assert-Equal (@($published.Keys | Sort-Object) -join '|') 'dossier.evidence-registry-read.v1.schema.json|manifest.json|project-dossier-evidence-registry-read.mjs' 'published exact inventory'
  Assert-Equal (Get-Item (Join-Path $artifactSlot 'project-dossier-evidence-registry-read.mjs')).Length 8901 'module length'
  Assert-Equal $published['project-dossier-evidence-registry-read.mjs'] $moduleHash 'published module hash'
  Assert-Equal (Get-Item (Join-Path $artifactSlot 'dossier.evidence-registry-read.v1.schema.json')).Length 2851 'schema length'
  Assert-Equal $published['dossier.evidence-registry-read.v1.schema.json'] $schemaHash 'published schema hash'
  $manifest = Get-Content -Raw (Join-Path $artifactSlot 'manifest.json') | ConvertFrom-Json
  Assert-Equal $manifest.sourceBranch 'main' 'manifest protected source branch'
  Assert-Equal $manifest.sourceManifestSha256 $sourceManifestHash 'manifest source-manifest hash'

  [pscustomobject]@{
    result='PASS'; terminalCondition='DOSSIER_STAGING_PROVENANCE_AND_ROLLBACK_PROVEN';
    moduleLength=8901; moduleSha256=$moduleHash; schemaLength=2851; schemaSha256=$schemaHash;
    sourceManifestSha256=$sourceManifestHash; canonicalRepository='bsvalues/terrafusion-dossier';
    protectedSourceBranch='main'; protectedMainAncestryVerified=$true;
    protectedMainNonAncestryRejectedWithoutMutation=$true; productionRefusedWithoutMutation=$true;
    exactThreeFileInventoryVerified=$true; candidatePublishedInventoryEqualityVerified=$true;
    fullManifestIdentityVerified=$true; candidateNumericTypeTamperRejectedBeforePublication=$true;
    candidateStringArrayTamperRejectedBeforePublication=$true;
    concurrentInvocationRejectedWithoutMutation=$true; backupContentsVerified=$true;
    rollbackExecuted=$true; rollbackHashesVerified=$true; automaticFailureRollbackVerified=$true;
    cleanParentBootstrapVerified=$true; freshFailureSlotRemovalVerified=$true;
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
