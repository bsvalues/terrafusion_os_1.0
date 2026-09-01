<#
.SYNOPSIS
  Stage the exact canonical Dais appeal-workflow module and frozen schema into the ignored
  OS-managed artifact slot with whole-slot rollback.

.DESCRIPTION
  The source checkout is detached at one protected-main commit with line-ending conversion disabled.
  Module, schema, and source-manifest identities are verified before publication. The published slot
  contains exactly the module, schema, and a generated provenance manifest. Runtime activation is not
  performed by this Work Order.
#>
[CmdletBinding()]
param(
  [string]$DaisRepository = "https://github.com/bsvalues/terrafusion-dais",
  [string]$ArtifactSlot,
  [string]$BuildRootBase = $env:TEMP,
  [switch]$TestOnlyInjectCandidateManifestTamper,
  [switch]$TestOnlyInjectCandidateStringArrayTamper,
  [switch]$TestOnlyInjectFailureDuringBackupVerification,
  [switch]$TestOnlyInjectFailureAfterPublish,
  [ValidateRange(0, 30000)][int]$TestOnlyHoldTransactionLockMilliseconds = 0
)

$ErrorActionPreference = "Stop"

$ExpectedDaisCommit = "6932bbbf014cf70d7362e070a1dad2a8a680ad47"
$ExpectedRepository = "bsvalues/terrafusion-dais"
$ExpectedSourceBranch = "main"
$Contract = "dais.appeal-workflow@1.0.0"
$ModulePathInSuite = "src/appeal-workflow/project-dais-appeal-workflow.mjs"
$ModuleFilename = "project-dais-appeal-workflow.mjs"
$ModuleSha256 = "5fd8efd8b06baa57b602a565c5927c95614336d5c1dcdfa914f27734e9ecaafb"
$ModuleLength = 9269
$SchemaPathInSuite = "contract-compat/dais.appeal-workflow.v1/dais.appeal-workflow.v1.schema.json"
$SchemaFilename = "dais.appeal-workflow.v1.schema.json"
$SchemaSha256 = "b66579eda680849b9bfc998c9cb89b33079ff3ef87a20ad499643b5f9249dd8c"
$SchemaLength = 3496
$SourceManifestPathInSuite = "contract-compat/dais.appeal-workflow.v1/manifest.json"
$SourceManifestSha256 = "6dbcef689d7cb1f282bdd34eff56009280fb391bedfa58d0308480365b962859"
$ContractSourceSha = "e57b1eca9c3291d10203efaa1fd586bcbce13f94"
$SourceDtoSha256 = "c9bb02054fc5a211ed609a3e9d7fe604e34cd0613701a57f6f2788d312348f47"

$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$expectedArtifactSlot = Join-Path $sovereignRepository ".terrafusion\runtime\dais\appeal-workflow"
$artifactParent = Split-Path -Parent $expectedArtifactSlot
if (-not $ArtifactSlot) { $ArtifactSlot = $expectedArtifactSlot }
if ($ArtifactSlot -ine $expectedArtifactSlot) {
  throw "DAIS_ARTIFACT_SLOT_REFUSED: must be the ignored OS-managed path $expectedArtifactSlot"
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
    throw "DAIS_IDENTITY_DECLARATION_INVALID: expected exactly one $Name declaration, found $($matches.Count)"
  }
  $actual = if ($matches[0].Groups[1].Success) { $matches[0].Groups[1].Value } else { $matches[0].Groups[2].Value }
  if ($actual -cne [string]$Expected) { throw "DAIS_IDENTITY_DISAGREEMENT: $Name pins $actual, expected $Expected" }
}

function Invoke-Checked {
  param([string]$Command, [string[]]$Arguments, [string]$WorkingDirectory)
  Push-Location $WorkingDirectory
  try {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command $($Arguments -join ' ') failed with exit code $LASTEXITCODE." }
  } finally { Pop-Location }
}

function Get-GitScalar {
  param([string]$Repository, [string[]]$Arguments)
  $value = & git -c safe.directory=$Repository -C $Repository @Arguments
  if ($LASTEXITCODE -ne 0) { throw "git -C $Repository $($Arguments -join ' ') failed with exit code $LASTEXITCODE." }
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
  Assert-NoReparsePoint $Directory "DAIS_SLOT_REPARSE_POINT_REFUSED"
  foreach ($entry in Get-ChildItem -LiteralPath $Directory -Force -Recurse) {
    if (($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw "DAIS_SLOT_REPARSE_POINT_REFUSED: $($entry.FullName)"
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
  if (($Actual | ConvertTo-Json -Compress) -cne ($Expected | ConvertTo-Json -Compress)) { throw $ErrorCode }
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
  if (($actualNames -join '|') -cne ($sortedExpected -join '|')) { throw "${ErrorCode}: exact file set mismatch" }
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
      $manifest.schemaLength -isnot [long] -or
      $manifest.schemaVersion -ne 1 -or $manifest.artifactType -cne 'dais.appeal-workflow.projection-module@1' -or
      $manifest.contract -cne $Contract -or $manifest.repository -cne $ExpectedRepository -or
      $manifest.sourceBranch -cne $ExpectedSourceBranch -or
      $manifest.commit -cne $ExpectedDaisCommit -or $manifest.modulePath -cne $ModulePathInSuite -or
      $manifest.moduleFilename -cne $ModuleFilename -or $manifest.moduleLength -ne $ModuleLength -or
      $manifest.moduleSha256 -cne $ModuleSha256 -or $manifest.schemaPath -cne $SchemaPathInSuite -or
      $manifest.schemaFilename -cne $SchemaFilename -or $manifest.schemaLength -ne $SchemaLength -or
      $manifest.schemaSha256 -cne $SchemaSha256 -or $manifest.sourceManifestPath -cne $SourceManifestPathInSuite -or
      $manifest.sourceManifestSha256 -cne $SourceManifestSha256 -or $manifest.contractSourceSha -cne $ContractSourceSha -or
      $manifest.sourceDtoSha256 -cne $SourceDtoSha256 -or $manifest.transport -cne 'local-os-managed-artifact-slot') {
    throw $ErrorCode
  }
}

$optionsFile = Join-Path $sovereignRepository "backend\src\TerraFusion.API\Configuration\DaisAppealWorkflowOptions.cs"
if (-not (Test-Path -LiteralPath $optionsFile -PathType Leaf)) { throw "DAIS_OPTIONS_MISSING: $optionsFile" }
$optionsSource = Get-Content -LiteralPath $optionsFile -Raw
Assert-NoReparseAncestors $optionsFile "DAIS_OPTIONS_REPARSE_POINT_REFUSED"
Assert-NoReparseAncestors $artifactParent "DAIS_ARTIFACT_PARENT_REPARSE_POINT_REFUSED"
Assert-NoReparseAncestors $ArtifactSlot "DAIS_ARTIFACT_SLOT_REPARSE_POINT_REFUSED"
Assert-NoReparseAncestors $BuildRootBase "DAIS_BUILD_ROOT_REPARSE_POINT_REFUSED"
$artifactVolume = [IO.Path]::GetPathRoot([IO.Path]::GetFullPath($ArtifactSlot))
$buildRootVolume = [IO.Path]::GetPathRoot([IO.Path]::GetFullPath($BuildRootBase))
if (-not $artifactVolume.Equals($buildRootVolume, [StringComparison]::OrdinalIgnoreCase)) {
  throw "DAIS_BUILD_ROOT_VOLUME_MISMATCH: backup and artifact slot must share a filesystem volume"
}
if (Test-PathOverlap $BuildRootBase $ArtifactSlot) {
  throw "DAIS_BUILD_ROOT_SLOT_OVERLAP_REFUSED: the build root and live artifact slot must be disjoint"
}
if (Test-PathOverlap $BuildRootBase $sovereignRepository) {
  throw "DAIS_BUILD_ROOT_REPOSITORY_OVERLAP_REFUSED: the build root must be outside the sovereign repository"
}

@{
  ExpectedArtifactType = "dais.appeal-workflow.projection-module@1"; ExpectedContract = $Contract;
  ExpectedRepository = $ExpectedRepository; ExpectedSourceBranch = $ExpectedSourceBranch; ExpectedCommit = $ExpectedDaisCommit;
  ExpectedModulePath = $ModulePathInSuite; ExpectedModuleFilename = $ModuleFilename;
  ExpectedModuleSha256 = $ModuleSha256; ExpectedModuleLength = $ModuleLength;
  ExpectedSchemaPath = $SchemaPathInSuite; ExpectedSchemaFilename = $SchemaFilename;
  ExpectedSchemaSha256 = $SchemaSha256; ExpectedSchemaLength = $SchemaLength;
  ExpectedSourceManifestPath = $SourceManifestPathInSuite; ExpectedSourceManifestSha256 = $SourceManifestSha256;
  ExpectedContractSourceSha = $ContractSourceSha; ExpectedSourceDtoSha256 = $SourceDtoSha256;
  ExpectedTransport = "local-os-managed-artifact-slot"; ArtifactSlotRelativePath = ".terrafusion/runtime/dais/appeal-workflow"
}.GetEnumerator() | ForEach-Object { Assert-NoReparsePoint $optionsFile "DAIS_OPTIONS_REPARSE_POINT_REFUSED"; Get-Constant $optionsSource $_.Key $_.Value }

$proofRoot = Join-Path $BuildRootBase ([DateTimeOffset]::UtcNow.ToString("yyyyMMddTHHmmssfffZ"))
$suiteSource = Join-Path $proofRoot "dais-source"
$candidate = Join-Path $proofRoot "candidate-artifact"
$backupSlot = Join-Path $proofRoot "previous-artifact"
if (Test-Path -LiteralPath $proofRoot) { throw "DAIS_PROOF_ROOT_COLLISION: $proofRoot" }
New-Item -ItemType Directory -Path $proofRoot,$candidate -Force | Out-Null
Assert-NoReparseAncestors $proofRoot "DAIS_PROOF_ROOT_REPARSE_POINT_REFUSED"
Assert-NoReparseAncestors $candidate "DAIS_CANDIDATE_REPARSE_POINT_REFUSED"

$fetchRepository = $DaisRepository
$declaredOrigin = if (Test-Path -LiteralPath $DaisRepository -PathType Container) {
  $fetchRepository = (Resolve-Path -LiteralPath $DaisRepository).Path
  Assert-NoReparseAncestors $fetchRepository "DAIS_SOURCE_REPARSE_POINT_REFUSED"
  Get-GitScalar $fetchRepository @("remote", "get-url", "origin")
} else { $DaisRepository }
if (-not (Test-CanonicalDaisOrigin $declaredOrigin)) {
  throw "DAIS_REPOSITORY_IDENTITY_MISMATCH: expected $ExpectedRepository, resolved $declaredOrigin"
}
$cloneArguments = if (Test-Path -LiteralPath $fetchRepository -PathType Container) {
  @("-c", "safe.directory=$fetchRepository", "-c", "safe.directory=$(Join-Path $fetchRepository '.git')", "clone", "--no-checkout", "--filter=blob:none", $fetchRepository, $suiteSource)
} else {
  @("clone", "--no-checkout", "--filter=blob:none", $fetchRepository, $suiteSource)
}
Invoke-Checked "git" $cloneArguments $proofRoot
Invoke-Checked "git" @("config", "core.autocrlf", "false") $suiteSource
Invoke-Checked "git" @("config", "core.eol", "lf") $suiteSource
Invoke-Checked "git" @("fetch", "origin", "+refs/heads/${ExpectedSourceBranch}:refs/remotes/origin/${ExpectedSourceBranch}") $suiteSource
Invoke-Checked "git" @("fetch", "--depth", "1", "origin", $ExpectedDaisCommit) $suiteSource
Invoke-Checked "git" @("checkout", "--detach", $ExpectedDaisCommit) $suiteSource
Assert-NoReparsePoint $suiteSource "DAIS_SOURCE_REPARSE_POINT_REFUSED"
if ((Get-GitScalar $suiteSource @("rev-parse", "HEAD")) -ine $ExpectedDaisCommit) { throw "DAIS_SOURCE_REVISION_DRIFT" }
$protectedMainHead = Get-GitScalar $suiteSource @("rev-parse", "refs/remotes/origin/$ExpectedSourceBranch")
& git -C $suiteSource merge-base --is-ancestor $ExpectedDaisCommit "refs/remotes/origin/$ExpectedSourceBranch"
$ancestryExitCode = $LASTEXITCODE
if ($ancestryExitCode -eq 1) {
  throw "DAIS_SOURCE_NOT_ON_PROTECTED_MAIN: $ExpectedDaisCommit is not reachable from $ExpectedSourceBranch at $protectedMainHead"
}
if ($ancestryExitCode -ne 0) { throw "DAIS_PROTECTED_MAIN_ANCESTRY_CHECK_FAILED: git exited $ancestryExitCode" }

$sourceModule = Join-Path $suiteSource ($ModulePathInSuite -replace '/', '\')
$sourceSchema = Join-Path $suiteSource ($SchemaPathInSuite -replace '/', '\')
$sourceManifest = Join-Path $suiteSource ($SourceManifestPathInSuite -replace '/', '\')
foreach ($source in @($sourceModule,$sourceSchema,$sourceManifest)) {
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "DAIS_SOURCE_ARTIFACT_MISSING: $source" }
  Assert-NoReparsePoint $source "DAIS_SOURCE_REPARSE_POINT_REFUSED"
}
if ((Get-Item -LiteralPath $sourceModule).Length -ne $ModuleLength -or (Get-FileHash $sourceModule -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ModuleSha256) { throw "DAIS_MODULE_IDENTITY_MISMATCH" }
if ((Get-Item -LiteralPath $sourceSchema).Length -ne $SchemaLength -or (Get-FileHash $sourceSchema -Algorithm SHA256).Hash.ToLowerInvariant() -ne $SchemaSha256) { throw "DAIS_SCHEMA_IDENTITY_MISMATCH" }
if ((Get-FileHash $sourceManifest -Algorithm SHA256).Hash.ToLowerInvariant() -ne $SourceManifestSha256) { throw "DAIS_SOURCE_MANIFEST_IDENTITY_MISMATCH" }
$sourceManifestJson = Get-Content -LiteralPath $sourceManifest -Raw | ConvertFrom-Json
$sourceSchemaEntry = @($sourceManifestJson.artifacts | Where-Object { $_.path -ceq $SchemaFilename -and $_.kind -ceq 'schema' })
if ($sourceManifestJson.contract -cne $Contract -or $sourceManifestJson.sourceSha -cne $ContractSourceSha -or
    $sourceManifestJson.sourceDto.sha256 -cne $SourceDtoSha256 -or $sourceSchemaEntry.Count -ne 1 -or
    $sourceSchemaEntry[0].sha256 -cne $SchemaSha256) { throw "DAIS_SOURCE_MANIFEST_PROVENANCE_MISMATCH" }

Copy-Item -LiteralPath $sourceModule -Destination (Join-Path $candidate $ModuleFilename)
Copy-Item -LiteralPath $sourceSchema -Destination (Join-Path $candidate $SchemaFilename)
[ordered]@{
  schemaVersion=1; artifactType="dais.appeal-workflow.projection-module@1"; contract=$Contract;
  repository=$ExpectedRepository; sourceBranch=$ExpectedSourceBranch; commit=$ExpectedDaisCommit;
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
Assert-ManifestIdentity (Join-Path $candidate 'manifest.json') "DAIS_CANDIDATE_MANIFEST_IDENTITY_MISMATCH"
$candidateInventory = Get-ExactArtifactInventory $candidate $expectedCandidateNames "DAIS_CANDIDATE_INVENTORY_MISMATCH"
if ((Get-FileHash (Join-Path $candidate $ModuleFilename) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ModuleSha256 -or
    (Get-FileHash (Join-Path $candidate $SchemaFilename) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $SchemaSha256) { throw "DAIS_CANDIDATE_IDENTITY_MISMATCH" }

$transactionMutexName = 'Local\TerraFusion.DaisAppealWorkflow.ArtifactSlot'
$transactionMutex = [Threading.Mutex]::new($false, $transactionMutexName)
$transactionLockHeld = $false
try {
  try {
    $transactionLockHeld = $transactionMutex.WaitOne(0)
  } catch [Threading.AbandonedMutexException] {
    $transactionLockHeld = $true
  }
  if (-not $transactionLockHeld) { throw "DAIS_STAGE_LOCK_UNAVAILABLE: another Dais staging transaction owns the artifact slot" }
  if ($TestOnlyHoldTransactionLockMilliseconds -gt 0) { Start-Sleep -Milliseconds $TestOnlyHoldTransactionLockMilliseconds }

$slotPathExists = Test-Path -LiteralPath $ArtifactSlot
$slotExisted = Test-Path -LiteralPath $ArtifactSlot -PathType Container
if ($slotPathExists -and -not $slotExisted) { throw "DAIS_ARTIFACT_SLOT_INVALID" }
$previousInventory = if ($slotExisted) { Get-DirectoryFileHashes $ArtifactSlot } else { [ordered]@{} }
if ($slotExisted) {
  $backupMoved = $false
  try {
    Move-Item -LiteralPath $ArtifactSlot -Destination $backupSlot
    $backupMoved = $true
    if ($TestOnlyInjectFailureDuringBackupVerification) { throw "DAIS_TEST_INJECTED_BACKUP_VERIFICATION_FAILURE" }
    Assert-InventoryEqual (Get-DirectoryFileHashes $backupSlot) $previousInventory "DAIS_BACKUP_HASH_MISMATCH"
  } catch {
    $backupFailure = $_
    if (-not $backupMoved) { throw }
    Move-Item -LiteralPath $backupSlot -Destination $ArtifactSlot
    try { Assert-InventoryEqual (Get-DirectoryFileHashes $ArtifactSlot) $previousInventory "DAIS_BACKUP_RESTORED_UNVERIFIABLE" }
    catch { throw "DAIS_BACKUP_RESTORED_UNVERIFIABLE: $($_.Exception.Message); original failure: $backupFailure" }
    throw "DAIS_BACKUP_VALIDATION_FAILED_RESTORED: $backupFailure"
  }
}

try {
  if (-not (Test-Path -LiteralPath $artifactParent -PathType Container)) { New-Item -ItemType Directory -Path $artifactParent -Force | Out-Null }
  Copy-Item -LiteralPath $candidate -Destination $ArtifactSlot -Recurse
  $publishedInventory = Get-ExactArtifactInventory $ArtifactSlot $expectedCandidateNames "DAIS_PUBLISHED_INVENTORY_MISMATCH"
  Assert-InventoryEqual $publishedInventory $candidateInventory "DAIS_PUBLISHED_CANDIDATE_INVENTORY_MISMATCH"
  if ($publishedInventory[$ModuleFilename] -cne $ModuleSha256 -or $publishedInventory[$SchemaFilename] -cne $SchemaSha256) { throw "DAIS_PUBLISHED_IDENTITY_MISMATCH" }
  Assert-ManifestIdentity (Join-Path $ArtifactSlot 'manifest.json') "DAIS_PUBLISHED_MANIFEST_MISMATCH"
  if ($TestOnlyInjectFailureAfterPublish) { throw "DAIS_TEST_INJECTED_PUBLICATION_FAILURE" }
} catch {
  $stageFailure = $_
  $cleanupFailure = $null
  if (Test-Path -LiteralPath $ArtifactSlot) { try { Remove-Item -LiteralPath $ArtifactSlot -Recurse -Force -ErrorAction Stop } catch { $cleanupFailure = $_ } }
  if (Test-Path -LiteralPath $ArtifactSlot) {
    if ($slotExisted) { throw "DAIS_ROLLBACK_BLOCKED_BY_FAILED_PUBLICATION_CLEANUP: $cleanupFailure; original failure: $stageFailure" }
    throw "DAIS_STAGE_FAILED_PARTIAL_SLOT_REMAINS: $cleanupFailure; original failure: $stageFailure"
  }
  if ($slotExisted) {
    Move-Item -LiteralPath $backupSlot -Destination $ArtifactSlot
    Assert-InventoryEqual (Get-DirectoryFileHashes $ArtifactSlot) $previousInventory "DAIS_ROLLBACK_FAILED"
    throw "DAIS_STAGE_FAILED_ROLLED_BACK: $stageFailure"
  }
  throw "DAIS_STAGE_FAILED_SLOT_REMOVED: $stageFailure"
}

[pscustomobject]@{
  artifactType="dais.appeal-workflow.projection-module@1"; suiteRepository=$ExpectedRepository;
  fetchTransport=$fetchRepository; sourceBranch=$ExpectedSourceBranch; protectedMainHead=$protectedMainHead; suiteCommit=$ExpectedDaisCommit; contract=$Contract;
  modulePath=$ModulePathInSuite; moduleLength=$ModuleLength; moduleSha256=$ModuleSha256;
  schemaPath=$SchemaPathInSuite; schemaLength=$SchemaLength; schemaSha256=$SchemaSha256;
  sourceManifestSha256=$SourceManifestSha256; artifactSlot=$ArtifactSlot;
  manifestPath=(Join-Path $ArtifactSlot 'manifest.json');
  rollbackSlot=if($slotExisted){$backupSlot}else{$null}; rollbackHashes=if($slotExisted){$previousInventory}else{$null}
} | ConvertTo-Json -Depth 5
} finally {
  if ($transactionLockHeld) { $transactionMutex.ReleaseMutex() }
  $transactionMutex.Dispose()
}
