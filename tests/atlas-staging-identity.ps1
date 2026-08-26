[CmdletBinding()]
param(
  [string]$AtlasRepository = "https://github.com/bsvalues/terrafusion-atlas",
  [string]$ProofRootBase = (Join-Path $env:TEMP "atlas-staging-identity"),
  [switch]$PreservePublishedArtifact,
  [switch]$OfflineGuardsOnly
)

$ErrorActionPreference = "Stop"
$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$stager = Join-Path $sovereignRepository "scripts\bootstrap\Stage-AtlasProjectionModule.ps1"
$artifactSlot = Join-Path $sovereignRepository ".terrafusion\runtime\atlas\spatial-read"
$artifactParent = Split-Path -Parent $artifactSlot
$expectedHash = "3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46"
$runRoot = Join-Path $ProofRootBase ([guid]::NewGuid().ToString("N"))
$stagerBuildRoot = Join-Path $runRoot "stager-runs"
$originalSlot = Join-Path $runRoot "original-slot"
$hadOriginalSlot = Test-Path -LiteralPath $artifactSlot
$originalMoved = $false

function Invoke-Stager {
  param([switch]$InjectBackupFailure, [switch]$InjectPublishFailure)
  $output = & $stager -AtlasRepository $AtlasRepository -BuildRootBase $stagerBuildRoot `
    -TestOnlyInjectFailureDuringBackupVerification:$InjectBackupFailure `
    -TestOnlyInjectFailureAfterPublish:$InjectPublishFailure
  if ($LASTEXITCODE -ne 0) { throw "Atlas stager failed with exit code $LASTEXITCODE" }
  return ($output -join "`n") | ConvertFrom-Json
}

function Assert-Equal {
  param($Actual, $Expected, [string]$Label)
  if ($Actual -ne $Expected) { throw "$Label expected '$Expected', measured '$Actual'" }
}

function Get-Inventory {
  param([string]$Directory)
  $inventory = [ordered]@{}
  foreach ($file in Get-ChildItem -LiteralPath $Directory -File -Recurse | Sort-Object FullName) {
    $relative = [IO.Path]::GetRelativePath($Directory, $file.FullName).Replace('\', '/')
    $inventory[$relative] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  }
  return $inventory
}

function Assert-InventoryEqual {
  param($Actual, $Expected, [string]$Label)
  $actualJson = $Actual | ConvertTo-Json -Compress
  $expectedJson = $Expected | ConvertTo-Json -Compress
  if ($actualJson -ne $expectedJson) { throw "$Label inventory mismatch: expected $expectedJson, measured $actualJson" }
}

$optionsFile = Join-Path $sovereignRepository "backend\src\TerraFusion.API\Configuration\AtlasProjectionOptions.cs"
$optionsSource = Get-Content -LiteralPath $optionsFile -Raw
$runtimePinPattern = '(?m)^[ \t]*public[ \t]+const[ \t]+string[ \t]+ExpectedModuleSha256[ \t]*=[ \t\r\n]*"([0-9a-fA-F]{64})"[ \t]*;[ \t\r]*$'
$runtimePinMatches = [regex]::Matches($optionsSource, $runtimePinPattern)
if ($runtimePinMatches.Count -ne 1) {
  throw "Expected exactly one public const string AtlasProjectionOptions.ExpectedModuleSha256 declaration; found $($runtimePinMatches.Count)."
}
Assert-Equal $runtimePinMatches[0].Groups[1].Value.ToLowerInvariant() $expectedHash "runtime module hash pin"

if ($OfflineGuardsOnly) {
  try {
    $parseErrors = @()
    [System.Management.Automation.Language.Parser]::ParseFile($stager, [ref]$null, [ref]$parseErrors) | Out-Null
    if ($parseErrors.Count) { throw "Atlas stager parse failed: $($parseErrors -join '; ')" }
    $rejection = $null
    try {
      & $stager -AtlasRepository "https://evil.example/bsvalues/terrafusion-atlas" -BuildRootBase $runRoot
    } catch {
      $rejection = $_.Exception.Message
    }
    if ($rejection -notmatch "ATLAS_REPOSITORY_IDENTITY_MISMATCH") {
      throw "Strict canonical-origin guard failed: $rejection"
    }
    [pscustomobject]@{
      result = "PASS"
      terminalCondition = "ATLAS_STAGING_OFFLINE_GUARDS_PROVEN"
      powerShellParse = $true
      runtimeModuleHashPinVerified = $true
      untrustedOriginRejectedBeforeFetch = $true
      privateSuiteCredentialRequired = $false
    } | ConvertTo-Json -Depth 4
  } finally {
    if (Test-Path -LiteralPath $runRoot) {
      Remove-Item -LiteralPath $runRoot -Recurse -Force
    }
  }
  return
}

New-Item -ItemType Directory -Path $runRoot, $stagerBuildRoot -Force | Out-Null
try {
  if ($hadOriginalSlot) {
    if (Test-Path -LiteralPath $originalSlot) { throw "Unique original-slot collision: $originalSlot" }
    Move-Item -LiteralPath $artifactSlot -Destination $originalSlot
    $originalMoved = $true
  }
  if (Test-Path -LiteralPath $artifactParent -PathType Container) {
    $remainingParentEntry = Get-ChildItem -LiteralPath $artifactParent -Force | Select-Object -First 1
    if ($remainingParentEntry) {
      throw "Clean-parent bootstrap proof requires an otherwise empty Atlas runtime parent; found $($remainingParentEntry.FullName)."
    }
    Remove-Item -LiteralPath $artifactParent -Force
  }
  if (Test-Path -LiteralPath $artifactParent) {
    throw "Clean-parent bootstrap precondition failed: $artifactParent still exists."
  }

  $freshFailure = $null
  try {
    $null = Invoke-Stager -InjectPublishFailure
  } catch {
    $freshFailure = $_.Exception.Message
  }
  if ($freshFailure -notmatch "ATLAS_STAGE_FAILED_SLOT_REMOVED" -or
      $freshFailure -notmatch "ATLAS_TEST_INJECTED_PUBLICATION_FAILURE") {
    throw "Fresh-slot publication failure was not reported as cleaned up: $freshFailure"
  }
  if (Test-Path -LiteralPath $artifactSlot) {
    throw "Fresh-slot publication failure left a partial artifact slot behind."
  }
  if (-not (Test-Path -LiteralPath $artifactParent -PathType Container)) {
    throw "Fresh-slot publication did not bootstrap the canonical runtime parent."
  }

  $first = Invoke-Stager
  Assert-Equal $first.suiteRepository "bsvalues/terrafusion-atlas" "canonical repository"
  Assert-Equal $first.suiteCommit "6736a53980c73d2b503ec71a440ad8e02aa43782" "canonical commit"
  Assert-Equal $first.sha256 $expectedHash "receipt module hash"
  Assert-Equal $first.rollbackSlot $null "fresh-stage rollback slot"

  Set-Content -LiteralPath (Join-Path $artifactSlot "rollback-sentinel.txt") -Value "whole-slot-rollback-proof" -Encoding utf8
  $preFailureInventory = Get-Inventory $artifactSlot
  $backupFailure = $null
  try {
    $null = Invoke-Stager -InjectBackupFailure
  } catch {
    $backupFailure = $_.Exception.Message
  }
  if ($backupFailure -notmatch "ATLAS_BACKUP_VALIDATION_FAILED_RESTORED" -or
      $backupFailure -notmatch "ATLAS_TEST_INJECTED_BACKUP_VERIFICATION_FAILURE") {
    throw "Backup-verification failure did not restore the slot: $backupFailure"
  }
  Assert-InventoryEqual (Get-Inventory $artifactSlot) $preFailureInventory "backup-verification failure restored whole-slot"

  $failure = $null
  try {
    $null = Invoke-Stager -InjectPublishFailure
  } catch {
    $failure = $_.Exception.Message
  }
  if ($failure -notmatch "ATLAS_STAGE_FAILED_ROLLED_BACK" -or
      $failure -notmatch "ATLAS_TEST_INJECTED_PUBLICATION_FAILURE") {
    throw "Automatic rollback was not observed through the stager catch path: $failure"
  }
  $restoredInventory = Get-Inventory $artifactSlot
  Assert-InventoryEqual $restoredInventory $preFailureInventory "automatic restored whole-slot"

  $second = Invoke-Stager
  if (-not (Test-Path -LiteralPath $second.rollbackSlot -PathType Container)) {
    throw "Second stage did not produce a real rollback directory."
  }
  $receiptInventory = [ordered]@{}
  foreach ($entry in $second.rollbackHashes.psobject.Properties) {
    $receiptInventory[$entry.Name] = $entry.Value
    $backupFile = Join-Path $second.rollbackSlot ($entry.Name -replace "/", "\")
    if (-not (Test-Path -LiteralPath $backupFile -PathType Leaf)) {
      throw "Rollback file is missing: $($entry.Name)"
    }
    $backupHash = (Get-FileHash -LiteralPath $backupFile -Algorithm SHA256).Hash.ToLowerInvariant()
    Assert-Equal $backupHash $entry.Value "rollback hash for $($entry.Name)"
  }
  $backupInventory = Get-Inventory $second.rollbackSlot
  Assert-InventoryEqual $backupInventory $preFailureInventory "backup whole-slot"
  Assert-InventoryEqual $receiptInventory $backupInventory "receipt whole-slot"

  $publishedModule = Join-Path $artifactSlot "project-atlas-feature.mjs"
  $publishedManifest = Join-Path $artifactSlot "manifest.json"
  Assert-Equal (Get-Item -LiteralPath $publishedModule).Length 917 "published module length"
  Assert-Equal (Get-FileHash -LiteralPath $publishedModule -Algorithm SHA256).Hash.ToLowerInvariant() $expectedHash "published module hash"
  $manifest = Get-Content -LiteralPath $publishedManifest -Raw | ConvertFrom-Json
  Assert-Equal $manifest.repository "bsvalues/terrafusion-atlas" "manifest repository"
  Assert-Equal $manifest.commit "6736a53980c73d2b503ec71a440ad8e02aa43782" "manifest commit"
  Assert-Equal $manifest.moduleSha256 $expectedHash "manifest module hash"

  [pscustomobject]@{
    result = "PASS"
    terminalCondition = "ATLAS_STAGING_PROVENANCE_AND_ROLLBACK_PROVEN"
    moduleLength = 917
    moduleSha256 = $expectedHash
    canonicalRepository = "bsvalues/terrafusion-atlas"
    canonicalCommit = "6736a53980c73d2b503ec71a440ad8e02aa43782"
    backupContentsVerified = $true
    rollbackExecuted = $true
    rollbackHashesVerified = $true
    automaticFailureRollbackVerified = $true
    cleanParentBootstrapVerified = $true
    freshFailureSlotRemovalVerified = $true
    backupVerificationFailureRollbackVerified = $true
  } | ConvertTo-Json -Depth 4
}
finally {
  if (-not $PreservePublishedArtifact -and (Test-Path -LiteralPath $artifactSlot)) {
    Remove-Item -LiteralPath $artifactSlot -Recurse -Force
  }
  if ($originalMoved) {
    if (Test-Path -LiteralPath $artifactSlot) {
      Remove-Item -LiteralPath $artifactSlot -Recurse -Force
    }
    if (-not (Test-Path -LiteralPath $artifactParent -PathType Container)) {
      New-Item -ItemType Directory -Path $artifactParent -Force | Out-Null
    }
    Move-Item -LiteralPath $originalSlot -Destination $artifactSlot
    $originalMoved = $false
  } elseif (-not $PreservePublishedArtifact -and
      (Test-Path -LiteralPath $artifactParent -PathType Container) -and
      -not (Get-ChildItem -LiteralPath $artifactParent -Force | Select-Object -First 1)) {
    Remove-Item -LiteralPath $artifactParent -Force
  }
  if (Test-Path -LiteralPath $runRoot) {
    Remove-Item -LiteralPath $runRoot -Recurse -Force
  }
}
