[CmdletBinding()]
param(
    [string]$DossierRepository = 'https://github.com/bsvalues/terrafusion-dossier',
    [string]$DotNetExecutable,
    [string]$NuGetPackagesPath,
    [string]$ProofRootBase
)

$ErrorActionPreference = 'Stop'
$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$expectedSovereignBase = '5182742d756cea6a939bb12489e660d83b9593b6'
$expectedDossierCommit = '7558cfebfeea0c7b536251769b1d779c4558a763'
$expectedModuleSha256 = 'bb0427d6634412d86be92a2ef5f6f0bfcdf97ee054887a42d59c2a0bc0127a8b'
$expectedSchemaSha256 = 'f658bc2bda718f58bd0353e9635524d5dbd376be515b543da3442b0094e52270'
$expectedManifestSha256 = 'a093ebf132709bdf0cb434a5acffb7c60a749008e24abab96e828f0dd2c7bea4'
$terminalCondition = 'DOSSIER_PERSISTENT_LOCAL_EXACT_RUNTIME_ADOPTED_ROLLBACK_EXECUTED_AND_LEGACY_SEMANTIC_FALLBACK_RETIRED'
$artifactSlot = [IO.Path]::GetFullPath((Join-Path $sovereignRepository '.terrafusion\runtime\dossier\evidence-registry-read'))
$receiptsBase = [IO.Path]::GetFullPath((Join-Path $sovereignRepository '.terrafusion\runtime\dossier\adoption-receipts'))
$durableProofBase = if ([string]::IsNullOrWhiteSpace($ProofRootBase)) { $receiptsBase } else { [IO.Path]::GetFullPath($ProofRootBase) }
$runId = [DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + [Guid]::NewGuid().ToString('N')
$testRoot = Join-Path ([IO.Path]::GetTempPath()) "tf-dossier-011b-$runId"
$stageRoot = Join-Path ([IO.Path]::GetTempPath()) "tfd011b-stage-$runId"
$durableRunRoot = Join-Path $durableProofBase $runId
$durableRollbackSlot = Join-Path $durableRunRoot 'previous-artifact'
$adoptedArtifact = Join-Path $durableRunRoot 'adopted-artifact-during-rollback'
$stageReceipt = $null
$stagePublished = $false
$preserveStageRoot = $false
$originalRollbackSlot = $null
$result = $null

function Invoke-Checked {
    param([Parameter(Mandatory)][string]$Command, [Parameter(ValueFromRemainingArguments)][string[]]$Arguments)
    $commandOutput = & $Command @Arguments
    if ($null -ne $commandOutput) { $commandOutput | Out-Host }
    if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit code $LASTEXITCODE." }
}

function Get-Inventory {
    param([Parameter(Mandatory)][string]$Directory)
    $inventory = [ordered]@{}
    if (-not (Test-Path -LiteralPath $Directory -PathType Container)) { return $inventory }
    foreach ($file in Get-ChildItem -LiteralPath $Directory -File -Recurse | Sort-Object FullName) {
        $relative = [IO.Path]::GetRelativePath($Directory, $file.FullName).Replace('\', '/')
        $inventory[$relative] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    return $inventory
}

function ConvertTo-Inventory {
    param([Parameter(Mandatory)]$Inventory)
    $converted = [ordered]@{}
    if ($Inventory -is [System.Collections.IDictionary]) {
        foreach ($key in @($Inventory.Keys | Sort-Object)) { $converted[[string]$key] = ([string]$Inventory[$key]).ToLowerInvariant() }
    } else {
        foreach ($property in @($Inventory.PSObject.Properties | Sort-Object Name)) { $converted[$property.Name] = ([string]$property.Value).ToLowerInvariant() }
    }
    return $converted
}

function Assert-Inventory {
    param([Parameter(Mandatory)][string]$Directory, [Parameter(Mandatory)]$Expected, [Parameter(Mandatory)][string]$Label)
    $expectedInventory = ConvertTo-Inventory $Expected
    $actualInventory = ConvertTo-Inventory (Get-Inventory $Directory)
    if ($null -ne (Compare-Object @($expectedInventory.Keys) @($actualInventory.Keys))) { throw "$Label paths differ." }
    foreach ($name in $expectedInventory.Keys) {
        if ($actualInventory[$name] -cne $expectedInventory[$name]) { throw "$Label hash mismatch for $name." }
    }
}

function Test-Inventory {
    param([Parameter(Mandatory)][string]$Directory, [Parameter(Mandatory)]$Expected)
    try { Assert-Inventory $Directory $Expected 'Inventory probe'; return $true } catch { return $false }
}

function Get-ReceiptFromOutput {
    param([Parameter(Mandatory)]$Output)
    $lines = @($Output)
    $start = 0
    while ($start -lt $lines.Count -and -not $lines[$start].TrimStart().StartsWith('{', [StringComparison]::Ordinal)) { $start++ }
    if ($start -ge $lines.Count) { throw 'Dossier staging did not emit a JSON receipt.' }
    return ($lines[$start..($lines.Count - 1)] -join "`n") | ConvertFrom-Json
}

function Get-SovereignChangeSnapshot {
    $entries = @(git -C $sovereignRepository status --porcelain=v1 --untracked-files=all)
    if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect sovereign worktree status.' }
    return @($entries | Sort-Object)
}

function Assert-NoReparsePath {
    param([Parameter(Mandatory)][string]$Root, [Parameter(Mandatory)][string]$Target)
    $canonicalRoot = [IO.Path]::GetFullPath($Root).TrimEnd('\')
    $canonicalTarget = [IO.Path]::GetFullPath($Target)
    if ($canonicalTarget -ine $canonicalRoot -and -not $canonicalTarget.StartsWith($canonicalRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw "Path escaped its required root: $canonicalTarget" }
    $current = $canonicalRoot
    foreach ($component in [IO.Path]::GetRelativePath($canonicalRoot, $canonicalTarget).Split('\', [StringSplitOptions]::RemoveEmptyEntries)) {
        $current = Join-Path $current $component
        if (Test-Path -LiteralPath $current) {
            if ((Get-Item -LiteralPath $current -Force).Attributes.HasFlag([IO.FileAttributes]::ReparsePoint)) { throw "Reparse-point path component refused: $current" }
        }
    }
}

function Read-TrxCounters {
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "Required TRX was not emitted: $Path" }
    [xml]$trx = Get-Content -LiteralPath $Path -Raw
    $counters = $trx.TestRun.ResultSummary.Counters
    return [pscustomobject]@{ Total=[int]$counters.total; Executed=[int]$counters.executed; Passed=[int]$counters.passed; Failed=[int]$counters.failed; Skipped=[int]$counters.total-[int]$counters.executed }
}

function Invoke-ObservedTest {
    param([Parameter(Mandatory)][string]$Label, [Parameter(Mandatory)][string]$FullyQualifiedName)
    $trxName = "$Label.trx"
    Invoke-Checked $DotNetExecutable @(
        'test', $testProject, '-c', 'Release', '--no-build', '--no-restore',
        '--artifacts-path', $artifacts, '--results-directory', $resultsDirectory,
        '--logger', "trx;LogFileName=$trxName", '--filter', "FullyQualifiedName=$FullyQualifiedName",
        '-p:NuGetAudit=false', '-p:UseSharedCompilation=false', '-nodeReuse:false'
    )
    $observed = Read-TrxCounters (Join-Path $resultsDirectory $trxName)
    if ($observed.Total -ne 1 -or $observed.Executed -ne 1 -or $observed.Passed -ne 1 -or $observed.Failed -ne 0 -or $observed.Skipped -ne 0) {
        throw "$Label observed total=$($observed.Total) executed=$($observed.Executed) passed=$($observed.Passed) failed=$($observed.Failed) skipped=$($observed.Skipped); expected 1/1/1/0/0."
    }
    return 'PASS'
}

try {
    $receiptsPrefix = $receiptsBase.TrimEnd('\') + '\'
    if ($durableProofBase -ine $receiptsBase -and -not $durableProofBase.StartsWith($receiptsPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'ProofRootBase must remain within the ignored governed Dossier adoption-receipts root.' }
    if ([IO.Path]::GetPathRoot($durableProofBase) -ine [IO.Path]::GetPathRoot($artifactSlot)) { throw 'Dossier proof and live slot must use the same volume.' }
    if ($durableProofBase.StartsWith($artifactSlot.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase) -or $artifactSlot.StartsWith($durableProofBase.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Dossier proof storage and live artifact slot must be disjoint.' }
    Assert-NoReparsePath $sovereignRepository $durableProofBase
    Assert-NoReparsePath $sovereignRepository $artifactSlot

    $sovereignHead = (git -C $sovereignRepository rev-parse HEAD).Trim()
    Invoke-Checked git @('-C', $sovereignRepository, 'merge-base', '--is-ancestor', $expectedSovereignBase, $sovereignHead)
    $changesBefore = @(Get-SovereignChangeSnapshot)
    if ($changesBefore.Count -ne 0) {
        throw 'Dossier runtime adoption proof requires a clean committed sovereign revision.'
    }
    $development = Get-Content -LiteralPath (Join-Path $sovereignRepository 'backend\src\TerraFusion.API\appsettings.Development.json') -Raw | ConvertFrom-Json
    $base = Get-Content -LiteralPath (Join-Path $sovereignRepository 'backend\src\TerraFusion.API\appsettings.json') -Raw | ConvertFrom-Json
    if ($development.DossierEvidenceRegistryRead.Mode -ne 'LocalExact' -or $development.DossierEvidenceRegistryRead.TimeoutSeconds -ne 30) { throw 'Development does not persist Dossier LocalExact with the bounded timeout.' }
    foreach ($redirect in @('ModulePath','SchemaPath','NodeExecutablePath')) { if ($development.DossierEvidenceRegistryRead.PSObject.Properties.Name -contains $redirect) { throw "Development configuration exposes forbidden $redirect redirect." } }
    if ($null -ne $base.DossierEvidenceRegistryRead -and $base.DossierEvidenceRegistryRead.Mode -eq 'LocalExact') { throw 'Base configuration enables Dossier LocalExact.' }
    $productionPath = Join-Path $sovereignRepository 'backend\src\TerraFusion.API\appsettings.Production.json'
    if (Test-Path -LiteralPath $productionPath) {
        $production = Get-Content -LiteralPath $productionPath -Raw | ConvertFrom-Json
        if ($null -ne $production.DossierEvidenceRegistryRead -and $production.DossierEvidenceRegistryRead.Mode -eq 'LocalExact') { throw 'Production configuration enables Dossier LocalExact.' }
    }

    New-Item -ItemType Directory -Path $durableProofBase,$testRoot,$stageRoot -Force | Out-Null
    Assert-NoReparsePath $sovereignRepository $durableProofBase
    $stageOutput = & pwsh -NoProfile -File (Join-Path $sovereignRepository 'scripts\bootstrap\Stage-DossierEvidenceRegistryReadModule.ps1') -DossierRepository $DossierRepository -BuildRootBase $stageRoot
    if ($LASTEXITCODE -ne 0) { throw 'Dossier canonical staging failed.' }
    $stagePublished = $true
    $preserveStageRoot = $true
    $stageReceipt = Get-ReceiptFromOutput $stageOutput
    if ($stageReceipt.suiteCommit -ne $expectedDossierCommit -or $stageReceipt.moduleSha256 -ne $expectedModuleSha256 -or $stageReceipt.schemaSha256 -ne $expectedSchemaSha256) { throw 'Dossier stage receipt identity mismatch.' }
    if ([IO.Path]::GetFullPath($stageReceipt.artifactSlot) -ine $artifactSlot) { throw 'Dossier stage receipt used a noncanonical slot.' }
    if ([string]::IsNullOrWhiteSpace($stageReceipt.rollbackSlot) -or $null -eq $stageReceipt.rollbackHashes) { throw 'Dossier proof requires a real prior rollback slot.' }
    $originalRollbackSlot = [IO.Path]::GetFullPath($stageReceipt.rollbackSlot)
    $canonicalStageRoot = [IO.Path]::GetFullPath($stageRoot).TrimEnd('\') + '\'
    if (-not $originalRollbackSlot.StartsWith($canonicalStageRoot,[StringComparison]::OrdinalIgnoreCase)) { throw 'Dossier rollback slot escaped the staging transaction root.' }
    Assert-Inventory $originalRollbackSlot $stageReceipt.rollbackHashes 'Original Dossier rollback backup'
    New-Item -ItemType Directory -Path $durableRunRoot -Force | Out-Null
    Move-Item -LiteralPath $originalRollbackSlot -Destination $durableRollbackSlot
    Assert-Inventory $durableRollbackSlot $stageReceipt.rollbackHashes 'Durable Dossier rollback backup'
    $stageReceipt.rollbackSlot = $durableRollbackSlot
    $preserveStageRoot = $false

    $modulePath = Join-Path $artifactSlot 'project-dossier-evidence-registry-read.mjs'
    $schemaPath = Join-Path $artifactSlot 'dossier.evidence-registry-read.v1.schema.json'
    $manifestPath = Join-Path $artifactSlot 'manifest.json'
    if ((Get-FileHash $modulePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedModuleSha256) { throw 'Published Dossier module hash mismatch.' }
    if ((Get-FileHash $schemaPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedSchemaSha256) { throw 'Published Dossier schema hash mismatch.' }
    if ((Get-FileHash $manifestPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expectedManifestSha256) { throw 'Published Dossier manifest hash mismatch.' }
    $publishedInventory = Get-Inventory $artifactSlot

    if ([string]::IsNullOrWhiteSpace($DotNetExecutable)) { $DotNetExecutable = (Get-Command dotnet -ErrorAction Stop).Source }
    $DotNetExecutable = [IO.Path]::GetFullPath($DotNetExecutable)
    if (-not (Test-Path -LiteralPath $DotNetExecutable -PathType Leaf)) { throw 'DotNetExecutable is unavailable.' }
    $env:DOTNET_CLI_HOME = Join-Path $testRoot 'dotnet-home'
    $env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'; $env:DOTNET_NOLOGO = '1'; $env:DOTNET_CLI_USE_MSBUILD_SERVER = '0'
    $env:NUGET_HTTP_CACHE_PATH = Join-Path $testRoot 'nuget-http'
    if (-not [string]::IsNullOrWhiteSpace($NuGetPackagesPath)) { $env:NUGET_PACKAGES = [IO.Path]::GetFullPath($NuGetPackagesPath) }
    $env:TERRAFUSION_DOSSIER_HOST_MODULE_PATH = [IO.Path]::GetFullPath($modulePath)
    $env:TERRAFUSION_DOSSIER_HOST_SCHEMA_PATH = [IO.Path]::GetFullPath($schemaPath)
    $testProject = Join-Path $sovereignRepository 'backend\tests\TerraFusion.Unit.Tests\TerraFusion.Unit.Tests.csproj'
    $resultsDirectory = Join-Path $testRoot 'test-results'
    $artifacts = Join-Path $testRoot 'artifacts'

    Invoke-Checked $DotNetExecutable @(
        'test',$testProject,'-c','Release','--artifacts-path',$artifacts,'--results-directory',$resultsDirectory,
        '--logger','trx;LogFileName=dossier-runtime-adoption.trx','--filter',
        'FullyQualifiedName~DossierEvidenceRegistryReadProcessHostTests|FullyQualifiedName~DossierEvidenceRegistryReadRuntimeRegistrationTests|FullyQualifiedName~DossierEvidenceRegistryReadConsumerTests|FullyQualifiedName~DossierEvidenceRegistryReadControllerTests',
        '/warnaserror','-p:UseSharedCompilation=false','-nodeReuse:false','-p:NuGetAudit=false'
    )
    $focused = Read-TrxCounters (Join-Path $resultsDirectory 'dossier-runtime-adoption.trx')
    if ($focused.Total -lt 90 -or $focused.Executed -ne $focused.Total -or $focused.Passed -ne $focused.Total -or $focused.Failed -ne 0 -or $focused.Skipped -ne 0) { throw "Dossier runtime tests were total=$($focused.Total) executed=$($focused.Executed) passed=$($focused.Passed) failed=$($focused.Failed) skipped=$($focused.Skipped)." }

    $configuredHostTest = 'TerraFusion.Unit.Tests.Dossier.DossierEvidenceRegistryReadRuntimeRegistrationTests.ConfiguredDevelopmentHost_StartsAndExecutesExactRuntime'
    $runtimeStartA = Invoke-ObservedTest 'runtime-start-a' $configuredHostTest
    $runtimeRestartB = Invoke-ObservedTest 'runtime-restart-b' $configuredHostTest
    $disabledRollback = Invoke-ObservedTest 'disabled-selection' 'TerraFusion.Unit.Tests.Dossier.DossierEvidenceRegistryReadRuntimeRegistrationTests.ConfiguredDevelopmentHost_DisabledSelectionStartsWithoutRuntime'
    $restoredStart = Invoke-ObservedTest 'restored-localexact' $configuredHostTest
    $exactControllerPath = Invoke-ObservedTest 'controller-consumer-path' 'TerraFusion.Unit.Tests.Dossier.DossierEvidenceRegistryReadControllerTests.CanonicalRouteUsesRuntimeConsumerWithExactScopedPage'
    $productionRefusal = Invoke-ObservedTest 'production-refusal' 'TerraFusion.Unit.Tests.Dossier.DossierEvidenceRegistryReadRuntimeRegistrationTests.ProductionRefusesLocalExactBeforeArtifactResolution'
    $manifestTamper = Invoke-ObservedTest 'manifest-tamper' 'TerraFusion.Unit.Tests.Dossier.DossierEvidenceRegistryReadRuntimeRegistrationTests.InvocationWrapper_ReverifiesExactManifestBytesAndRefusesBeforeProcessStart'
    $moduleSchemaTamper = Invoke-ObservedTest 'module-schema-tamper' 'TerraFusion.Unit.Tests.Dossier.DossierEvidenceRegistryReadRuntimeRegistrationTests.InvocationWrapper_ReverifiesBothModuleAndSchemaBytes'

    Move-Item -LiteralPath $artifactSlot -Destination $adoptedArtifact
    Move-Item -LiteralPath $durableRollbackSlot -Destination $artifactSlot
    Assert-Inventory $artifactSlot $stageReceipt.rollbackHashes 'Observed byte-identical Dossier rollback'
    $rollbackExecution = 'PASS - prior slot restored and hash verified'
    Move-Item -LiteralPath $artifactSlot -Destination $durableRollbackSlot
    Move-Item -LiteralPath $adoptedArtifact -Destination $artifactSlot
    Assert-Inventory $artifactSlot $publishedInventory 'Restored adopted Dossier artifact'
    $adoptionRestoration = 'PASS - adopted slot restored and hash verified'

    $changesAfter = @(Get-SovereignChangeSnapshot)
    if ($null -ne (Compare-Object $changesBefore $changesAfter)) { throw 'Tracked or untracked sovereign worktree state drifted during the runtime proof.' }
    if (Test-Path -LiteralPath $testRoot) { Remove-Item -LiteralPath $testRoot -Recurse -Force }
    if (Test-Path -LiteralPath $stageRoot) { Remove-Item -LiteralPath $stageRoot -Recurse -Force }

    $receiptPath = Join-Path $durableRunRoot 'runtime-adoption-receipt.json'
    $result = [ordered]@{
        result='PASS'; receiptState='LOCAL_TERMINAL_PROOF_SUCCESS'; terminalCondition=$terminalCondition
        sovereignHead=$sovereignHead; dossierCommit=$expectedDossierCommit; artifactSlot=$artifactSlot
        moduleSha256=$expectedModuleSha256; schemaSha256=$expectedSchemaSha256; manifestSha256=$expectedManifestSha256
        persistentDevelopmentSelection=$true; configurableArtifactRedirectDenied=$true
        runtimeStartA=$runtimeStartA; runtimeRestartB=$runtimeRestartB; disabledSelectionRollback=$disabledRollback; restoredSelectionStart=$restoredStart
        manifestTamperAfterConstruction=$manifestTamper; moduleAndSchemaTamperAfterConstruction=$moduleSchemaTamper
        productionSelection=$productionRefusal; controllerConsumerPathInvoked=$exactControllerPath
        artifactRollbackExecution=$rollbackExecution; adoptedArtifactRestoration=$adoptionRestoration
        focusedTestsTotal=$focused.Total; focusedTestsExecuted=$focused.Executed; focusedTestsPassed=$focused.Passed; focusedTestsFailed=$focused.Failed; focusedTestsSkipped=$focused.Skipped
        durableReceipt=$receiptPath; durableArtifactRollbackSlot=$durableRollbackSlot; rollbackInventory=$stageReceipt.rollbackHashes
        countyOrProtectedDataUsed=$false; deploymentOrProductionUsed=$false
    }
    $temporaryReceipt = Join-Path $durableRunRoot ('runtime-adoption-receipt.'+[Guid]::NewGuid().ToString('N')+'.tmp')
    $result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $temporaryReceipt -Encoding utf8
    Move-Item -LiteralPath $temporaryReceipt -Destination $receiptPath
}
catch {
    $proofFailure = $_
    $restoreState = 'NOT_REQUIRED_OR_STAGING_NOT_PUBLISHED'
    $recoveryPath = $null
    try {
        if ($stagePublished -and $null -eq $stageReceipt) {
            $preserveStageRoot=$true; $restoreState='AMBIGUOUS_STAGER_RECEIPT_TRANSACTION_ROOT_PRESERVED'; $recoveryPath=$stageRoot
        } elseif ($stagePublished) {
            New-Item -ItemType Directory -Path $durableRunRoot -Force | Out-Null
            if (Test-Inventory $artifactSlot $stageReceipt.rollbackHashes) {
                $restoreState='PREVIOUS_ARTIFACT_ALREADY_LIVE_AND_HASH_VERIFIED'
            } else {
                $backup = if (Test-Path -LiteralPath $durableRollbackSlot -PathType Container) { $durableRollbackSlot } elseif ($null -ne $originalRollbackSlot -and (Test-Path -LiteralPath $originalRollbackSlot -PathType Container)) { $originalRollbackSlot } else { $null }
                if ($null -eq $backup) { throw 'No verified prior Dossier slot remained available for failure recovery.' }
                Assert-Inventory $backup $stageReceipt.rollbackHashes 'Failure-path Dossier rollback backup'
                if (Test-Path -LiteralPath $artifactSlot) {
                    $failedArtifact=Join-Path $durableRunRoot ('failed-published-artifact-'+[Guid]::NewGuid().ToString('N'))
                    Move-Item -LiteralPath $artifactSlot -Destination $failedArtifact
                    $recoveryPath=$failedArtifact
                }
                Move-Item -LiteralPath $backup -Destination $artifactSlot
                Assert-Inventory $artifactSlot $stageReceipt.rollbackHashes 'Restored Dossier artifact slot'
                $restoreState='PREVIOUS_ARTIFACT_RESTORED_AND_HASH_VERIFIED'
            }
        }
    } catch { $preserveStageRoot=$true; $restoreState='RESTORE_FAILED_RECOVERY_STATE_PRESERVED'; $recoveryPath=$durableRunRoot }
    try {
        New-Item -ItemType Directory -Path $durableRunRoot -Force | Out-Null
        $failureReceipt=[ordered]@{result='FAIL';receiptState='TERMINAL_FAILURE';terminalCondition=$terminalCondition;sovereignHead=$sovereignHead;dossierCommit=$expectedDossierCommit;failure=$proofFailure.Exception.Message;restoreState=$restoreState;recoveryPath=$recoveryPath;countyOrProtectedDataUsed=$false;deploymentOrProductionUsed=$false}
        $failureTemporary=Join-Path $durableRunRoot ('runtime-adoption-failure.'+[Guid]::NewGuid().ToString('N')+'.tmp')
        $failureReceipt|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $failureTemporary -Encoding utf8
        Move-Item -LiteralPath $failureTemporary -Destination (Join-Path $durableRunRoot 'runtime-adoption-failure.json')
    } catch { $preserveStageRoot=$true }
    throw $proofFailure
}
finally {
    foreach($name in @('DOTNET_CLI_HOME','DOTNET_CLI_TELEMETRY_OPTOUT','DOTNET_NOLOGO','DOTNET_CLI_USE_MSBUILD_SERVER','NUGET_PACKAGES','NUGET_HTTP_CACHE_PATH','TERRAFUSION_DOSSIER_HOST_MODULE_PATH','TERRAFUSION_DOSSIER_HOST_SCHEMA_PATH')){[Environment]::SetEnvironmentVariable($name,$null,'Process')}
    try{if(Test-Path -LiteralPath $testRoot){Remove-Item -LiteralPath $testRoot -Recurse -Force}}catch{}
    try{if(-not $preserveStageRoot -and (Test-Path -LiteralPath $stageRoot)){Remove-Item -LiteralPath $stageRoot -Recurse -Force}}catch{}
}

if($null -ne $result){$result|ConvertTo-Json -Depth 8}
