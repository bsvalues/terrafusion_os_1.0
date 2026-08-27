<#
.SYNOPSIS
  Stage the exact canonical Gpt evidence-registry read module and frozen schema into the
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
  [string]$GptRepository = "https://github.com/bsvalues/terrafusion-gpt",
  [string]$ArtifactSlot,
  [string]$BuildRootBase = $env:TEMP,
  [string]$EnvironmentName = "Development",
  [switch]$TestOnlyInjectCandidateManifestTamper,
  [switch]$TestOnlyInjectCandidateStringArrayTamper,
  [switch]$TestOnlyInjectSourceModuleTamper,
  [switch]$TestOnlyInjectSourceSchemaTamper,
  [switch]$TestOnlyInjectSourceManifestTamper,
  [switch]$TestOnlyInjectExecutionManifestTamper,
  [switch]$TestOnlyInjectFailureDuringBackupVerification,
  [switch]$TestOnlyInjectFailureAfterPublish,
  [ValidateRange(0, 30000)][int]$TestOnlyHoldTransactionLockMilliseconds = 0
)

$ErrorActionPreference = "Stop"

$ExpectedGptCommit = "550b50f27af6f0911f16c973cbb6fc57a20eb15a"
$ExpectedRepository = "bsvalues/terrafusion-gpt"
$ExpectedSourceBranch = "main"
$Contract = "gpt.grounded-context@1.0.0"
$ArtifactType = "gpt.grounded-context.projection-module@1"
$ModulePathInSuite = "src/grounded-context/project-gpt-grounded-context.mjs"
$ModuleFilename = "project-gpt-grounded-context.mjs"
$ModuleSha256 = "cd2c6111ab0843d321bea8da5eff77cee89eaa1c721d93489d1985c6820f1beb"
$ModuleLength = 8578
$ModuleGitBlob = "d81a8135caea1685ce02efd5acfdf1f9dfdd930a"
$SchemaPathInSuite = "contract-compat/gpt.grounded-context.v1/gpt.grounded-context.v1.schema.json"
$SchemaFilename = "gpt.grounded-context.v1.schema.json"
$SchemaSha256 = "da9a923e2ef92f63a728edcb19d726a9a29ceb39203464dbe6ee426e94a69019"
$SchemaLength = 3555
$SchemaGitBlob = "42fc40dcb2d459a4b81fbaab4f71b33433402fb5"
$SourceManifestPathInSuite = "contract-compat/gpt.grounded-context.v1/manifest.json"
$SourceManifestLength = 4954
$SourceManifestSha256 = "b2c679b3ebb70c9e055cc80a7923a215a7c9c60753d2f2c0984c89b246d81bc1"
$SourceManifestGitBlob = "fae097a93c2b7435de85e7643cdb15d4714ee9c8"
$ExecutionManifestPathInSuite = "canon/GPT_GROUNDED_CONTEXT_EXECUTION_MANIFEST.json"
$ExecutionManifestLength = 1618
$ExecutionManifestSha256 = "6d04e14674e4e91a1a5d12ba12f53684cbad0bcec17e4e53ec01d8287618794b"
$ExecutionManifestGitBlob = "7a9ca7bf114f34f2562102efa8817fd37506b614"
$PublishedManifestLength = 1685
$PublishedManifestSha256 = "f29c38f994edc434881e9d71de861e49c2ae300dcb0c1b3082fe206cf4a2ee75"
$ContractSourceSha = "3b588b231098e7e4ce25056a4025e6f10ffbd0d6"
$SourceDtoSha256 = "a4b28ea6e0aa4001cec938104127a46492c6d68bff18014154ca0e81035e023e"

$allowedEnvironments = @('Development', 'Test', 'Testing', 'CI', 'Local')
if (-not ($allowedEnvironments -icontains $EnvironmentName)) {
  throw "GPT_PRODUCTION_STAGE_REFUSED: staging is allowed only in Development, Test, Testing, CI, or Local; received $EnvironmentName"
}

$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$expectedArtifactSlot = Join-Path $sovereignRepository ".terrafusion\runtime\gpt\grounded-context"
$artifactParent = Split-Path -Parent $expectedArtifactSlot
if (-not $ArtifactSlot) { $ArtifactSlot = $expectedArtifactSlot }
if ($ArtifactSlot -ine $expectedArtifactSlot) {
  throw "GPT_ARTIFACT_SLOT_REFUSED: must be the ignored OS-managed path $expectedArtifactSlot"
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
    throw "GPT_IDENTITY_DECLARATION_INVALID: expected exactly one $Name declaration, found $($matches.Count)"
  }
  $actual = if ($matches[0].Groups[1].Success) { $matches[0].Groups[1].Value } else { $matches[0].Groups[2].Value }
  if ($actual -cne [string]$Expected) {
    throw "GPT_IDENTITY_DISAGREEMENT: $Name pins $actual, expected $Expected"
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

function Assert-FileIdentity {
  param([string]$Path,[long]$Length,[string]$Sha256,[string]$GitBlob,[string]$Repository,[string]$ErrorCode)
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "${ErrorCode}_MISSING: $Path" }
  Assert-NoReparsePoint $Path "${ErrorCode}_REPARSE_POINT_REFUSED"
  if ((Get-Item -LiteralPath $Path).Length -ne $Length) { throw "${ErrorCode}_LENGTH_MISMATCH" }
  if ((Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() -cne $Sha256) {
    throw "${ErrorCode}_HASH_MISMATCH"
  }
  if ((Get-GitScalar $Repository @('hash-object',$Path)) -cne $GitBlob) {
    throw "${ErrorCode}_GIT_BLOB_MISMATCH"
  }
}

function Test-CanonicalGptOrigin {
  param([string]$Origin)
  return $Origin -match '^https://github\.com/bsvalues/terrafusion-gpt(?:\.git)?/?$' -or
    $Origin -match '^git@github\.com:bsvalues/terrafusion-gpt(?:\.git)?/?$' -or
    $Origin -match '^ssh://git@github\.com/bsvalues/terrafusion-gpt(?:\.git)?/?$'
}

function Get-DirectoryFileHashes {
  param([string]$Directory)
  $hashes = [ordered]@{}
  if (-not (Test-Path -LiteralPath $Directory -PathType Container)) { return $hashes }
  Assert-NoReparsePoint $Directory "GPT_SLOT_REPARSE_POINT_REFUSED"
  foreach ($entry in Get-ChildItem -LiteralPath $Directory -Force -Recurse) {
    if (($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
      throw "GPT_SLOT_REPARSE_POINT_REFUSED: $($entry.FullName)"
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
    'artifactType','commit','contract','contractSourceSha','executionManifestGitBlob','executionManifestLength',
    'executionManifestPath','executionManifestSha256','moduleFilename','moduleGitBlob','moduleLength','modulePath',
    'moduleSha256','repository','schemaFilename','schemaGitBlob','schemaLength','schemaPath','schemaSha256',
    'schemaVersion','sourceDtoSha256','sourceBranch','sourceManifestGitBlob','sourceManifestLength',
    'sourceManifestPath','sourceManifestSha256','transport'
  ) | Sort-Object
  $actualProperties = @($manifest.psobject.Properties.Name | Sort-Object)
  $stringProperties = @(
    'artifactType','commit','contract','contractSourceSha','executionManifestGitBlob','executionManifestPath',
    'executionManifestSha256','moduleFilename','moduleGitBlob','modulePath','moduleSha256','repository',
    'schemaFilename','schemaGitBlob','schemaPath','schemaSha256','sourceBranch','sourceDtoSha256',
    'sourceManifestGitBlob','sourceManifestPath','sourceManifestSha256','transport'
  )
  $invalidStringTypes = @($stringProperties | Where-Object { $manifest.psobject.Properties[$_].Value -isnot [string] })
  if (($actualProperties -join '|') -cne ($expectedProperties -join '|') -or
      $invalidStringTypes.Count -ne 0 -or
      $manifest.schemaVersion -isnot [long] -or $manifest.moduleLength -isnot [long] -or
      $manifest.schemaLength -isnot [long] -or $manifest.sourceManifestLength -isnot [long] -or
      $manifest.executionManifestLength -isnot [long] -or $manifest.schemaVersion -ne 1 -or
      $manifest.artifactType -cne $ArtifactType -or
      $manifest.contract -cne $Contract -or $manifest.repository -cne $ExpectedRepository -or
      $manifest.sourceBranch -cne $ExpectedSourceBranch -or $manifest.commit -cne $ExpectedGptCommit -or
      $manifest.modulePath -cne $ModulePathInSuite -or $manifest.moduleFilename -cne $ModuleFilename -or
      $manifest.moduleLength -ne $ModuleLength -or $manifest.moduleSha256 -cne $ModuleSha256 -or
      $manifest.moduleGitBlob -cne $ModuleGitBlob -or
      $manifest.schemaPath -cne $SchemaPathInSuite -or $manifest.schemaFilename -cne $SchemaFilename -or
      $manifest.schemaLength -ne $SchemaLength -or $manifest.schemaSha256 -cne $SchemaSha256 -or
      $manifest.schemaGitBlob -cne $SchemaGitBlob -or
      $manifest.sourceManifestPath -cne $SourceManifestPathInSuite -or
      $manifest.sourceManifestLength -ne $SourceManifestLength -or
      $manifest.sourceManifestSha256 -cne $SourceManifestSha256 -or
      $manifest.sourceManifestGitBlob -cne $SourceManifestGitBlob -or
      $manifest.executionManifestPath -cne $ExecutionManifestPathInSuite -or
      $manifest.executionManifestLength -ne $ExecutionManifestLength -or
      $manifest.executionManifestSha256 -cne $ExecutionManifestSha256 -or
      $manifest.executionManifestGitBlob -cne $ExecutionManifestGitBlob -or
      $manifest.contractSourceSha -cne $ContractSourceSha -or
      $manifest.sourceDtoSha256 -cne $SourceDtoSha256 -or
      $manifest.transport -cne 'local-os-managed-artifact-slot') {
    throw $ErrorCode
  }
}

$optionsFile = Join-Path $sovereignRepository "backend\src\TerraFusion.API\Configuration\GptGroundedContextRuntimeOptions.cs"
if (-not (Test-Path -LiteralPath $optionsFile -PathType Leaf)) {
  throw "GPT_OPTIONS_MISSING: $optionsFile"
}
$optionsSource = Get-Content -LiteralPath $optionsFile -Raw
Assert-NoReparseAncestors $optionsFile "GPT_OPTIONS_REPARSE_POINT_REFUSED"
Assert-NoReparseAncestors $artifactParent "GPT_ARTIFACT_PARENT_REPARSE_POINT_REFUSED"
Assert-NoReparseAncestors $ArtifactSlot "GPT_ARTIFACT_SLOT_REPARSE_POINT_REFUSED"
Assert-NoReparseAncestors $BuildRootBase "GPT_BUILD_ROOT_REPARSE_POINT_REFUSED"
$artifactVolume = [IO.Path]::GetPathRoot([IO.Path]::GetFullPath($ArtifactSlot))
$buildRootVolume = [IO.Path]::GetPathRoot([IO.Path]::GetFullPath($BuildRootBase))
if (-not $artifactVolume.Equals($buildRootVolume, [StringComparison]::OrdinalIgnoreCase)) {
  throw "GPT_BUILD_ROOT_VOLUME_MISMATCH: backup and artifact slot must share a filesystem volume"
}
if (Test-PathOverlap $BuildRootBase $ArtifactSlot) {
  throw "GPT_BUILD_ROOT_SLOT_OVERLAP_REFUSED: the build root and live artifact slot must be disjoint"
}
if (Test-PathOverlap $BuildRootBase $sovereignRepository) {
  throw "GPT_BUILD_ROOT_REPOSITORY_OVERLAP_REFUSED: the build root must be outside the sovereign repository"
}

@{
  ExpectedArtifactType = $ArtifactType; ExpectedContract = $Contract;
  ExpectedRepository = $ExpectedRepository; ExpectedSourceBranch = $ExpectedSourceBranch; ExpectedCommit = $ExpectedGptCommit;
  ExpectedModulePath = $ModulePathInSuite; ExpectedModuleFilename = $ModuleFilename;
  ExpectedModuleSha256 = $ModuleSha256; ExpectedModuleGitBlob = $ModuleGitBlob; ExpectedModuleLength = $ModuleLength;
  ExpectedSchemaPath = $SchemaPathInSuite; ExpectedSchemaFilename = $SchemaFilename;
  ExpectedSchemaSha256 = $SchemaSha256; ExpectedSchemaGitBlob = $SchemaGitBlob; ExpectedSchemaLength = $SchemaLength;
  ExpectedSourceManifestPath = $SourceManifestPathInSuite; ExpectedSourceManifestLength = $SourceManifestLength;
  ExpectedSourceManifestSha256 = $SourceManifestSha256; ExpectedSourceManifestGitBlob = $SourceManifestGitBlob;
  ExpectedExecutionManifestPath = $ExecutionManifestPathInSuite; ExpectedExecutionManifestLength = $ExecutionManifestLength;
  ExpectedExecutionManifestSha256 = $ExecutionManifestSha256; ExpectedExecutionManifestGitBlob = $ExecutionManifestGitBlob;
  ExpectedPublishedManifestLength = $PublishedManifestLength; ExpectedPublishedManifestSha256 = $PublishedManifestSha256;
  ExpectedContractSourceSha = $ContractSourceSha; ExpectedSourceDtoSha256 = $SourceDtoSha256;
  ExpectedTransport = "local-os-managed-artifact-slot";
  ArtifactSlotRelativePath = ".terrafusion/runtime/gpt/grounded-context"
}.GetEnumerator() | ForEach-Object {
  Assert-NoReparsePoint $optionsFile "GPT_OPTIONS_REPARSE_POINT_REFUSED"
  Get-Constant $optionsSource $_.Key $_.Value
}

$proofRoot = Join-Path $BuildRootBase ("{0}-{1}" -f [DateTimeOffset]::UtcNow.ToString("yyyyMMddTHHmmssfffZ"), [guid]::NewGuid().ToString("N"))
$suiteSource = Join-Path $proofRoot "gpt-source"
$candidate = Join-Path $proofRoot "candidate-artifact"
$backupSlot = Join-Path $proofRoot "previous-artifact"
if (Test-Path -LiteralPath $proofRoot) { throw "GPT_PROOF_ROOT_COLLISION: $proofRoot" }
New-Item -ItemType Directory -Path $proofRoot,$candidate -Force | Out-Null
Assert-NoReparseAncestors $proofRoot "GPT_PROOF_ROOT_REPARSE_POINT_REFUSED"
Assert-NoReparseAncestors $candidate "GPT_CANDIDATE_REPARSE_POINT_REFUSED"

try {
$fetchRepository = $GptRepository
$declaredOrigin = if (Test-Path -LiteralPath $GptRepository -PathType Container) {
  $fetchRepository = (Resolve-Path -LiteralPath $GptRepository).Path
  Assert-NoReparseAncestors $fetchRepository "GPT_SOURCE_REPARSE_POINT_REFUSED"
  Get-GitScalar $fetchRepository @("remote", "get-url", "origin")
} else { $GptRepository }
if (-not (Test-CanonicalGptOrigin $declaredOrigin)) {
  throw "GPT_REPOSITORY_IDENTITY_MISMATCH: expected $ExpectedRepository, resolved $declaredOrigin"
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
Invoke-Checked "git" @("fetch", "--depth", "1", "origin", $ExpectedGptCommit) $suiteSource
Invoke-Checked "git" @("checkout", "--detach", $ExpectedGptCommit) $suiteSource
Assert-NoReparsePoint $suiteSource "GPT_SOURCE_REPARSE_POINT_REFUSED"
if ((Get-GitScalar $suiteSource @("rev-parse", "HEAD")) -ine $ExpectedGptCommit) {
  throw "GPT_SOURCE_REVISION_DRIFT"
}
$protectedMainHead = Get-GitScalar $suiteSource @("rev-parse", "refs/remotes/origin/$ExpectedSourceBranch")
& git -C $suiteSource merge-base --is-ancestor $ExpectedGptCommit "refs/remotes/origin/$ExpectedSourceBranch"
$ancestryExitCode = $LASTEXITCODE
if ($ancestryExitCode -eq 1) {
  throw "GPT_SOURCE_NOT_ON_PROTECTED_MAIN: $ExpectedGptCommit is not reachable from $ExpectedSourceBranch at $protectedMainHead"
}
if ($ancestryExitCode -ne 0) {
  throw "GPT_PROTECTED_MAIN_ANCESTRY_CHECK_FAILED: git exited $ancestryExitCode"
}

$sourceModule = Join-Path $suiteSource ($ModulePathInSuite -replace '/', '\')
$sourceSchema = Join-Path $suiteSource ($SchemaPathInSuite -replace '/', '\')
$sourceManifest = Join-Path $suiteSource ($SourceManifestPathInSuite -replace '/', '\')
$executionManifest = Join-Path $suiteSource ($ExecutionManifestPathInSuite -replace '/', '\')
if ($TestOnlyInjectSourceModuleTamper) { Add-Content -LiteralPath $sourceModule -Value 'tamper' -Encoding utf8 }
if ($TestOnlyInjectSourceSchemaTamper) { Add-Content -LiteralPath $sourceSchema -Value 'tamper' -Encoding utf8 }
if ($TestOnlyInjectSourceManifestTamper) { Add-Content -LiteralPath $sourceManifest -Value 'tamper' -Encoding utf8 }
if ($TestOnlyInjectExecutionManifestTamper) { Add-Content -LiteralPath $executionManifest -Value 'tamper' -Encoding utf8 }
Assert-FileIdentity $sourceModule $ModuleLength $ModuleSha256 $ModuleGitBlob $suiteSource 'GPT_MODULE_IDENTITY'
Assert-FileIdentity $sourceSchema $SchemaLength $SchemaSha256 $SchemaGitBlob $suiteSource 'GPT_SCHEMA_IDENTITY'
Assert-FileIdentity $sourceManifest $SourceManifestLength $SourceManifestSha256 $SourceManifestGitBlob $suiteSource 'GPT_SOURCE_MANIFEST_IDENTITY'
Assert-FileIdentity $executionManifest $ExecutionManifestLength $ExecutionManifestSha256 $ExecutionManifestGitBlob $suiteSource 'GPT_EXECUTION_MANIFEST_IDENTITY'
$sourceManifestJson = Get-Content -LiteralPath $sourceManifest -Raw | ConvertFrom-Json
$sourceSchemaEntry = @($sourceManifestJson.artifacts | Where-Object {
  $_.path -ceq $SchemaFilename -and $_.kind -ceq 'schema'
})
if ($sourceManifestJson.schemaVersion -cne '1.0.0' -or
    $sourceManifestJson.contract -cne $Contract -or
    $sourceManifestJson.sourceRepository -cne 'bsvalues/terrafusion_os_1.0' -or
    $sourceManifestJson.sourceSha -cne $ContractSourceSha -or
    $sourceManifestJson.sourceDto.path -cne 'backend/src/TerraFusion.Abstractions/DTOs/GptGroundedContextDto.cs' -or
    $sourceManifestJson.sourceDto.sha256 -cne $SourceDtoSha256 -or
    $sourceSchemaEntry.Count -ne 1 -or $sourceSchemaEntry[0].sha256 -cne $SchemaSha256) {
  throw "GPT_SOURCE_MANIFEST_PROVENANCE_MISMATCH"
}
$executionManifestJson = Get-Content -LiteralPath $executionManifest -Raw | ConvertFrom-Json
if ($executionManifestJson.schemaVersion -ne 1 -or $executionManifestJson.artifactType -cne $ArtifactType -or
    $executionManifestJson.contract -cne $Contract -or $executionManifestJson.repository -cne $ExpectedRepository -or
    $executionManifestJson.sourceBranch -cne $ExpectedSourceBranch -or
    $executionManifestJson.sourceCommit -cne 'e0856e46807844a95d57aaef49d3350c1bc38a33' -or
    $executionManifestJson.moduleGitBlob -cne $ModuleGitBlob -or
    $executionManifestJson.moduleLength -ne $ModuleLength -or $executionManifestJson.moduleSha256 -cne $ModuleSha256 -or
    $executionManifestJson.schemaGitBlob -cne $SchemaGitBlob -or
    $executionManifestJson.schemaLength -ne $SchemaLength -or $executionManifestJson.schemaSha256 -cne $SchemaSha256 -or
    $executionManifestJson.sourceManifestGitBlob -cne $SourceManifestGitBlob -or
    $executionManifestJson.sourceManifestLength -ne $SourceManifestLength -or
    $executionManifestJson.sourceManifestSha256 -cne $SourceManifestSha256 -or
    $executionManifestJson.contractSourceSha -cne $ContractSourceSha -or
    $executionManifestJson.sourceDtoSha256 -cne $SourceDtoSha256 -or
    $executionManifestJson.lineEnding -cne 'lf' -or $executionManifestJson.materialization -cne 'exact-git-blob' -or
    $executionManifestJson.transport -cne 'local-os-managed-artifact-slot') {
  throw 'GPT_EXECUTION_MANIFEST_PROVENANCE_MISMATCH'
}

Copy-Item -LiteralPath $sourceModule -Destination (Join-Path $candidate $ModuleFilename)
Copy-Item -LiteralPath $sourceSchema -Destination (Join-Path $candidate $SchemaFilename)
[ordered]@{
  schemaVersion=1; artifactType=$ArtifactType; contract=$Contract;
  repository=$ExpectedRepository; sourceBranch=$ExpectedSourceBranch; commit=$ExpectedGptCommit;
  modulePath=$ModulePathInSuite; moduleFilename=$ModuleFilename; moduleLength=$ModuleLength; moduleSha256=$ModuleSha256; moduleGitBlob=$ModuleGitBlob;
  schemaPath=$SchemaPathInSuite; schemaFilename=$SchemaFilename; schemaLength=$SchemaLength; schemaSha256=$SchemaSha256; schemaGitBlob=$SchemaGitBlob;
  sourceManifestPath=$SourceManifestPathInSuite; sourceManifestLength=$SourceManifestLength;
  sourceManifestSha256=$SourceManifestSha256; sourceManifestGitBlob=$SourceManifestGitBlob;
  executionManifestPath=$ExecutionManifestPathInSuite; executionManifestLength=$ExecutionManifestLength;
  executionManifestSha256=$ExecutionManifestSha256; executionManifestGitBlob=$ExecutionManifestGitBlob;
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
Assert-ManifestIdentity (Join-Path $candidate 'manifest.json') "GPT_CANDIDATE_MANIFEST_IDENTITY_MISMATCH"
$candidateManifestFile = Get-Item -LiteralPath (Join-Path $candidate 'manifest.json')
$candidateManifestHash = (Get-FileHash -LiteralPath $candidateManifestFile.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
if ($candidateManifestFile.Length -ne $PublishedManifestLength -or $candidateManifestHash -cne $PublishedManifestSha256) {
  throw "GPT_CANDIDATE_PUBLISHED_MANIFEST_BYTE_IDENTITY_MISMATCH: expected $PublishedManifestLength/$PublishedManifestSha256, found $($candidateManifestFile.Length)/$candidateManifestHash"
}
$candidateInventory = Get-ExactArtifactInventory $candidate $expectedCandidateNames "GPT_CANDIDATE_INVENTORY_MISMATCH"
if ((Get-FileHash (Join-Path $candidate $ModuleFilename) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ModuleSha256 -or
    (Get-FileHash (Join-Path $candidate $SchemaFilename) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $SchemaSha256) {
  throw "GPT_CANDIDATE_IDENTITY_MISMATCH"
}

$transactionMutexName = 'Global\TerraFusion.GptGroundedContextRuntime.ArtifactSlot'
$transactionMutex = [Threading.Mutex]::new($false, $transactionMutexName)
$transactionLockHeld = $false
try {
  try {
    $transactionLockHeld = $transactionMutex.WaitOne(0)
  } catch [Threading.AbandonedMutexException] {
    $transactionLockHeld = $true
  }
  if (-not $transactionLockHeld) {
    throw "GPT_STAGE_LOCK_UNAVAILABLE: another Gpt staging transaction owns the artifact slot"
  }
  if ($TestOnlyHoldTransactionLockMilliseconds -gt 0) {
    Start-Sleep -Milliseconds $TestOnlyHoldTransactionLockMilliseconds
  }

  $slotPathExists = Test-Path -LiteralPath $ArtifactSlot
  $slotExisted = Test-Path -LiteralPath $ArtifactSlot -PathType Container
  if ($slotPathExists -and -not $slotExisted) { throw "GPT_ARTIFACT_SLOT_INVALID" }
  $previousInventory = if ($slotExisted) { Get-DirectoryFileHashes $ArtifactSlot } else { [ordered]@{} }
  if ($slotExisted) {
    $backupMoved = $false
    try {
      Move-Item -LiteralPath $ArtifactSlot -Destination $backupSlot
      $backupMoved = $true
      if ($TestOnlyInjectFailureDuringBackupVerification) {
        throw "GPT_TEST_INJECTED_BACKUP_VERIFICATION_FAILURE"
      }
      Assert-InventoryEqual (Get-DirectoryFileHashes $backupSlot) $previousInventory "GPT_BACKUP_HASH_MISMATCH"
    } catch {
      $backupFailure = $_
      if (-not $backupMoved) { throw }
      Move-Item -LiteralPath $backupSlot -Destination $ArtifactSlot
      try {
        Assert-InventoryEqual (Get-DirectoryFileHashes $ArtifactSlot) $previousInventory "GPT_BACKUP_RESTORED_UNVERIFIABLE"
      } catch {
        throw "GPT_BACKUP_RESTORED_UNVERIFIABLE: $($_.Exception.Message); original failure: $backupFailure"
      }
      throw "GPT_BACKUP_VALIDATION_FAILED_RESTORED: $backupFailure"
    }
  }

  try {
    if (-not (Test-Path -LiteralPath $artifactParent -PathType Container)) {
      New-Item -ItemType Directory -Path $artifactParent -Force | Out-Null
    }
    Copy-Item -LiteralPath $candidate -Destination $ArtifactSlot -Recurse
    $publishedInventory = Get-ExactArtifactInventory $ArtifactSlot $expectedCandidateNames "GPT_PUBLISHED_INVENTORY_MISMATCH"
    Assert-InventoryEqual $publishedInventory $candidateInventory "GPT_PUBLISHED_CANDIDATE_INVENTORY_MISMATCH"
    if ($publishedInventory[$ModuleFilename] -cne $ModuleSha256 -or
        $publishedInventory[$SchemaFilename] -cne $SchemaSha256) {
      throw "GPT_PUBLISHED_IDENTITY_MISMATCH"
    }
    Assert-ManifestIdentity (Join-Path $ArtifactSlot 'manifest.json') "GPT_PUBLISHED_MANIFEST_MISMATCH"
    if ($TestOnlyInjectFailureAfterPublish) {
      throw "GPT_TEST_INJECTED_PUBLICATION_FAILURE"
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
        throw "GPT_ROLLBACK_BLOCKED_BY_FAILED_PUBLICATION_CLEANUP: $cleanupFailure; original failure: $stageFailure"
      }
      throw "GPT_STAGE_FAILED_PARTIAL_SLOT_REMAINS: $cleanupFailure; original failure: $stageFailure"
    }
    if ($slotExisted) {
      Move-Item -LiteralPath $backupSlot -Destination $ArtifactSlot
      Assert-InventoryEqual (Get-DirectoryFileHashes $ArtifactSlot) $previousInventory "GPT_ROLLBACK_FAILED"
      throw "GPT_STAGE_FAILED_ROLLED_BACK: $stageFailure"
    }
    throw "GPT_STAGE_FAILED_SLOT_REMOVED: $stageFailure"
  }

  [pscustomobject]@{
    artifactType=$ArtifactType;
    suiteRepository=$ExpectedRepository; fetchTransport=$fetchRepository;
    sourceBranch=$ExpectedSourceBranch; protectedMainHead=$protectedMainHead;
    suiteCommit=$ExpectedGptCommit; contract=$Contract;
    modulePath=$ModulePathInSuite; moduleLength=$ModuleLength; moduleSha256=$ModuleSha256;
    schemaPath=$SchemaPathInSuite; schemaLength=$SchemaLength; schemaSha256=$SchemaSha256;
    sourceManifestLength=$SourceManifestLength; sourceManifestSha256=$SourceManifestSha256;
    sourceManifestGitBlob=$SourceManifestGitBlob; executionManifestLength=$ExecutionManifestLength;
    executionManifestSha256=$ExecutionManifestSha256; executionManifestGitBlob=$ExecutionManifestGitBlob;
    contractSourceSha=$ContractSourceSha;
    sourceDtoSha256=$SourceDtoSha256; artifactSlot=$ArtifactSlot;
    manifestPath=(Join-Path $ArtifactSlot 'manifest.json');
    publishedManifestLength=(Get-Item -LiteralPath (Join-Path $ArtifactSlot 'manifest.json')).Length;
    publishedManifestSha256=(Get-FileHash -LiteralPath (Join-Path $ArtifactSlot 'manifest.json') -Algorithm SHA256).Hash.ToLowerInvariant();
    runtimeAdopted=$false;
    rollbackSlot=if($slotExisted){$backupSlot}else{$null};
    rollbackHashes=if($slotExisted){$previousInventory}else{$null}
  } | ConvertTo-Json -Depth 5
} finally {
  if ($transactionLockHeld) { $transactionMutex.ReleaseMutex() }
  $transactionMutex.Dispose()
}
} finally {
  # Source and candidate data are ephemeral. A prior whole-slot backup remains only after a
  # successful replacement because its exact path and hashes are part of the rollback receipt.
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
