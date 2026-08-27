[CmdletBinding()]
param(
    [string]$DaisRepository = 'https://github.com/bsvalues/terrafusion-dais',
    [string]$DotNetExecutable,
    [string]$NuGetPackagesPath,
    [string]$ProofRootBase
)

$ErrorActionPreference = 'Stop'
$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$expectedSovereignBase = '52744220509a54b6544e0fa193b6d09e8d93c159'
$expectedDaisCommit = '8a9cfc608bcda835126db2054bb7ba7ecf185275'
$expectedModuleSha256 = '779ef37435e2deb8f181b3c34e0712c35829b7a123f047752fc5bf09de331ff2'
$expectedSchemaSha256 = 'db8f1c93a598da7f9c454d5a43c275b849f2de8fc036e9be28c5c1da44432ce2'
$expectedManifestSha256 = 'c858e7cd390502bf1461cf7af6302916a7c437f5f4f47b17d379f49af114b825'
$terminalCondition = 'DAIS_APPEAL_MUTATION_LOCAL_EXACT_RUNTIME_ADOPTED_ROLLBACK_EXECUTED_AND_DUPLICATE_JUDGMENT_RETIRED'
$mutationSlot = [IO.Path]::GetFullPath((Join-Path $sovereignRepository '.terrafusion\runtime\dais\appeal-mutation'))
$workflowSlot = [IO.Path]::GetFullPath((Join-Path $sovereignRepository '.terrafusion\runtime\dais\appeal-workflow'))
$receiptsBase = [IO.Path]::GetFullPath((Join-Path $sovereignRepository '.terrafusion\runtime\dais\adoption-receipts'))
$durableProofBase = if ([string]::IsNullOrWhiteSpace($ProofRootBase)) { $receiptsBase } else { [IO.Path]::GetFullPath($ProofRootBase) }
$runId = [DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + [Guid]::NewGuid().ToString('N')
$testRoot = Join-Path ([IO.Path]::GetTempPath()) "tf-dais-010f-$runId"
$mutationStageRoot = Join-Path ([IO.Path]::GetTempPath()) "tfd010f-mutation-$runId"
$workflowStageRoot = Join-Path ([IO.Path]::GetTempPath()) "tfd010f-workflow-$runId"
$durableRunRoot = Join-Path $durableProofBase "mutation-$runId"
$durableMutationRollbackSlot = Join-Path $durableRunRoot 'previous-mutation-artifact'
$durableWorkflowRollbackSlot = Join-Path $durableRunRoot 'previous-workflow-artifact'
$adoptedMutationDuringRollback = Join-Path $durableRunRoot 'adopted-mutation-during-rollback'
$mutationStageReceipt = $null
$workflowStageReceipt = $null
$mutationStagePublished = $false
$workflowStagePublished = $false
$result = $null

function Invoke-Checked {
    param([Parameter(Mandatory)][string]$Command,[Parameter(ValueFromRemainingArguments)][string[]]$Arguments)
    $output = & $Command @Arguments
    if ($null -ne $output) { $output | Out-Host }
    if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit code $LASTEXITCODE." }
}

function Get-Inventory {
    param([Parameter(Mandatory)][string]$Directory)
    $inventory = [ordered]@{}
    if (-not (Test-Path -LiteralPath $Directory -PathType Container)) { return $inventory }
    foreach ($entry in Get-ChildItem -LiteralPath $Directory -Force -Recurse) {
        if ($entry.Attributes.HasFlag([IO.FileAttributes]::ReparsePoint)) {
            throw "Reparse-point artifact entry refused: $($entry.FullName)"
        }
    }
    foreach ($file in Get-ChildItem -LiteralPath $Directory -File -Recurse | Sort-Object FullName) {
        $relative = [IO.Path]::GetRelativePath($Directory,$file.FullName).Replace('\','/')
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
    param([Parameter(Mandatory)][string]$Directory,[Parameter(Mandatory)]$Expected,[Parameter(Mandatory)][string]$Label)
    $expectedInventory = ConvertTo-Inventory $Expected
    $actualInventory = ConvertTo-Inventory (Get-Inventory $Directory)
    if ($null -ne (Compare-Object @($expectedInventory.Keys) @($actualInventory.Keys))) { throw "$Label paths differ." }
    foreach ($name in $expectedInventory.Keys) {
        if ($actualInventory[$name] -cne $expectedInventory[$name]) { throw "$Label hash mismatch for $name." }
    }
}

function Get-ReceiptFromOutput {
    param([Parameter(Mandatory)]$Output)
    $lines = @($Output)
    $start = 0
    while ($start -lt $lines.Count -and -not $lines[$start].TrimStart().StartsWith('{',[StringComparison]::Ordinal)) { $start++ }
    if ($start -ge $lines.Count) { throw 'Dais staging did not emit a JSON receipt.' }
    return ($lines[$start..($lines.Count-1)] -join "`n") | ConvertFrom-Json
}

function Read-TrxCounters {
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "Required TRX was not emitted: $Path" }
    [xml]$trx = Get-Content -LiteralPath $Path -Raw
    $counters = $trx.TestRun.ResultSummary.Counters
    return [pscustomobject]@{
        Total=[int]$counters.total; Executed=[int]$counters.executed; Passed=[int]$counters.passed;
        Failed=[int]$counters.failed; Skipped=[int]$counters.total-[int]$counters.executed
    }
}

function Invoke-ObservedTest {
    param([Parameter(Mandatory)][string]$Label,[Parameter(Mandatory)][string]$FullyQualifiedName)
    $trxName = "$Label.trx"
    Invoke-Checked $DotNetExecutable @(
        'test',$testProject,'-c','Release','--no-build','--no-restore','--artifacts-path',$artifacts,
        '--results-directory',$resultsDirectory,'--logger',"trx;LogFileName=$trxName",'--filter',
        "FullyQualifiedName=$FullyQualifiedName",'-p:NuGetAudit=false','-p:UseSharedCompilation=false','-nodeReuse:false'
    )
    $observed = Read-TrxCounters (Join-Path $resultsDirectory $trxName)
    if ($observed.Total -ne 1 -or $observed.Executed -ne 1 -or $observed.Passed -ne 1 -or $observed.Failed -ne 0 -or $observed.Skipped -ne 0) {
        throw "$Label observed $($observed.Total)/$($observed.Executed)/$($observed.Passed)/$($observed.Failed)/$($observed.Skipped); expected 1/1/1/0/0."
    }
    return 'PASS'
}

function Get-SovereignChangeSnapshot {
    $entries = @(git -c "safe.directory=$sovereignRepository" -C $sovereignRepository status --porcelain=v1 --untracked-files=all)
    if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect sovereign worktree status.' }
    return @($entries | Sort-Object)
}

try {
    $receiptsPrefix = $receiptsBase.TrimEnd('\') + '\'
    if ($durableProofBase -ine $receiptsBase -and -not $durableProofBase.StartsWith($receiptsPrefix,[StringComparison]::OrdinalIgnoreCase)) {
        throw 'ProofRootBase must remain within the ignored governed Dais adoption-receipts root.'
    }
    if ([IO.Path]::GetPathRoot($durableProofBase) -ine [IO.Path]::GetPathRoot($mutationSlot)) { throw 'Proof and mutation slot must use the same volume.' }
    foreach ($target in @($durableProofBase,$mutationSlot,$workflowSlot)) {
        if ($target -ine $sovereignRepository -and -not $target.StartsWith($sovereignRepository.TrimEnd('\')+'\',[StringComparison]::OrdinalIgnoreCase)) {
            throw "Governed proof path escaped the sovereign repository: $target"
        }
    }

    $sovereignHead = (git -c "safe.directory=$sovereignRepository" -C $sovereignRepository rev-parse HEAD).Trim()
    Invoke-Checked git @('-c',"safe.directory=$sovereignRepository",'-C',$sovereignRepository,'merge-base','--is-ancestor',$expectedSovereignBase,$sovereignHead)
    $changesBefore = @(Get-SovereignChangeSnapshot)
    if ($changesBefore.Count -ne 0) { throw 'Dais mutation adoption proof requires a clean committed sovereign revision.' }

    $development = Get-Content -LiteralPath (Join-Path $sovereignRepository 'backend\src\TerraFusion.API\appsettings.Development.json') -Raw | ConvertFrom-Json
    $base = Get-Content -LiteralPath (Join-Path $sovereignRepository 'backend\src\TerraFusion.API\appsettings.json') -Raw | ConvertFrom-Json
    if ($development.DaisAppealMutation.Mode -ne 'LocalExact' -or $development.DaisAppealMutation.TimeoutSeconds -ne 30) { throw 'Development does not persist mutation LocalExact with timeout 30.' }
    foreach ($redirect in @('ModulePath','SchemaPath','NodeExecutablePath')) {
        if ($development.DaisAppealMutation.PSObject.Properties.Name -contains $redirect) { throw "Development exposes forbidden mutation $redirect redirect." }
    }
    if ($null -ne $base.DaisAppealMutation -and $base.DaisAppealMutation.Mode -eq 'LocalExact') { throw 'Base configuration enables mutation LocalExact.' }
    $productionPath = Join-Path $sovereignRepository 'backend\src\TerraFusion.API\appsettings.Production.json'
    if (Test-Path -LiteralPath $productionPath) {
        $production = Get-Content -LiteralPath $productionPath -Raw | ConvertFrom-Json
        if ($null -ne $production.DaisAppealMutation -and $production.DaisAppealMutation.Mode -eq 'LocalExact') { throw 'Production configuration enables mutation LocalExact.' }
    }

    New-Item -ItemType Directory -Path $durableRunRoot,$testRoot,$mutationStageRoot,$workflowStageRoot -Force | Out-Null
    if (-not (Test-Path -LiteralPath $mutationSlot -PathType Container)) {
        New-Item -ItemType Directory -Path $mutationSlot -Force | Out-Null
        [ordered]@{mode='Disabled';reason='pre-adoption rollback sentinel';schemaVersion=1} |
            ConvertTo-Json | Set-Content -LiteralPath (Join-Path $mutationSlot 'disabled-marker.json') -Encoding utf8
    }

    $mutationOutput = & pwsh -NoProfile -File (Join-Path $sovereignRepository 'scripts\bootstrap\Stage-DaisAppealMutationModule.ps1') -DaisRepository $DaisRepository -BuildRootBase $mutationStageRoot
    if ($LASTEXITCODE -ne 0) { throw 'Dais mutation canonical staging failed.' }
    $mutationStagePublished = $true
    $mutationStageReceipt = Get-ReceiptFromOutput $mutationOutput
    if ($mutationStageReceipt.suiteCommit -cne $expectedDaisCommit -or
        $mutationStageReceipt.moduleSha256 -cne $expectedModuleSha256 -or
        $mutationStageReceipt.schemaSha256 -cne $expectedSchemaSha256 -or
        $mutationStageReceipt.publishedManifestSha256 -cne $expectedManifestSha256 -or
        $mutationStageReceipt.publishedManifestLength -ne 1465) { throw 'Dais mutation stage receipt identity mismatch.' }
    if ([IO.Path]::GetFullPath($mutationStageReceipt.artifactSlot) -ine $mutationSlot) { throw 'Mutation stage used a noncanonical slot.' }
    if ([string]::IsNullOrWhiteSpace($mutationStageReceipt.rollbackSlot) -or $null -eq $mutationStageReceipt.rollbackHashes) { throw 'Mutation proof requires a nonempty prior rollback slot.' }
    Assert-Inventory ([IO.Path]::GetFullPath($mutationStageReceipt.rollbackSlot)) $mutationStageReceipt.rollbackHashes 'Original mutation rollback slot'
    Move-Item -LiteralPath ([IO.Path]::GetFullPath($mutationStageReceipt.rollbackSlot)) -Destination $durableMutationRollbackSlot
    Assert-Inventory $durableMutationRollbackSlot $mutationStageReceipt.rollbackHashes 'Durable mutation rollback slot'
    $publishedMutationInventory = Get-Inventory $mutationSlot
    if ((@($publishedMutationInventory.Keys | Sort-Object) -join '|') -cne
        'dais.appeal-mutation.v1.schema.json|decide-dais-appeal-mutation.mjs|manifest.json') {
        throw 'Published mutation slot does not contain the exact three-file inventory.'
    }

    $workflowOutput = & pwsh -NoProfile -File (Join-Path $sovereignRepository 'scripts\bootstrap\Stage-DaisAppealWorkflowModule.ps1') -DaisRepository $DaisRepository -BuildRootBase $workflowStageRoot
    if ($LASTEXITCODE -ne 0) { throw 'Dais workflow canonical staging failed.' }
    $workflowStageReceipt = Get-ReceiptFromOutput $workflowOutput
    $workflowStagePublished = $true
    if ($null -ne $workflowStageReceipt.rollbackSlot) {
        Assert-Inventory ([IO.Path]::GetFullPath($workflowStageReceipt.rollbackSlot)) $workflowStageReceipt.rollbackHashes 'Original workflow rollback slot'
        Move-Item -LiteralPath ([IO.Path]::GetFullPath($workflowStageReceipt.rollbackSlot)) -Destination $durableWorkflowRollbackSlot
        Assert-Inventory $durableWorkflowRollbackSlot $workflowStageReceipt.rollbackHashes 'Durable workflow rollback slot'
    }

    if ([string]::IsNullOrWhiteSpace($DotNetExecutable)) { $DotNetExecutable = (Get-Command dotnet -ErrorAction Stop).Source }
    $DotNetExecutable = [IO.Path]::GetFullPath($DotNetExecutable)
    if (-not (Test-Path -LiteralPath $DotNetExecutable -PathType Leaf)) { throw 'DotNetExecutable is unavailable.' }
    $env:DOTNET_CLI_HOME = Join-Path $testRoot 'dotnet-home'
    $env:DOTNET_CLI_TELEMETRY_OPTOUT='1'; $env:DOTNET_NOLOGO='1'; $env:DOTNET_CLI_USE_MSBUILD_SERVER='0'
    $env:NUGET_HTTP_CACHE_PATH = Join-Path $testRoot 'nuget-http'
    if (-not [string]::IsNullOrWhiteSpace($NuGetPackagesPath)) { $env:NUGET_PACKAGES=[IO.Path]::GetFullPath($NuGetPackagesPath) }
    $env:TERRAFUSION_DAIS_MUTATION_HOST_MODULE_PATH = Join-Path $mutationSlot 'decide-dais-appeal-mutation.mjs'
    $env:TERRAFUSION_DAIS_MUTATION_HOST_SCHEMA_PATH = Join-Path $mutationSlot 'dais.appeal-mutation.v1.schema.json'
    $env:TERRAFUSION_DAIS_HOST_MODULE_PATH = Join-Path $workflowSlot 'project-dais-appeal-workflow.mjs'
    $env:TERRAFUSION_DAIS_HOST_SCHEMA_PATH = Join-Path $workflowSlot 'dais.appeal-workflow.v1.schema.json'
    $testProject = Join-Path $sovereignRepository 'backend\tests\TerraFusion.Unit.Tests\TerraFusion.Unit.Tests.csproj'
    $resultsDirectory = Join-Path $testRoot 'test-results'
    $artifacts = Join-Path $testRoot 'artifacts'

    Invoke-Checked $DotNetExecutable @(
        'test',$testProject,'-c','Release','--artifacts-path',$artifacts,'--results-directory',$resultsDirectory,
        '--logger','trx;LogFileName=dais-mutation-adoption.trx','--filter',
        'FullyQualifiedName~DaisAppealMutation|FullyQualifiedName~AppealServiceTests|FullyQualifiedName~DaisEndpointContractTests',
        '/warnaserror','-p:UseSharedCompilation=false','-nodeReuse:false','-p:NuGetAudit=false'
    )
    $focused = Read-TrxCounters (Join-Path $resultsDirectory 'dais-mutation-adoption.trx')
    if ($focused.Total -lt 55 -or $focused.Executed -ne $focused.Total -or $focused.Passed -ne $focused.Total -or $focused.Failed -ne 0 -or $focused.Skipped -ne 0) {
        throw "Mutation runtime tests were $($focused.Total)/$($focused.Executed)/$($focused.Passed)/$($focused.Failed)/$($focused.Skipped)."
    }

    $registrationStart = Invoke-ObservedTest 'configured-fresh-start-restart' 'TerraFusion.Unit.Tests.Dais.DaisAppealMutationRuntimeRegistrationTests.DevelopmentLocalExact_FreshStartAndRestart_ResolvesAndExecutesExactStagedPort'
    $exactControllerLifecycle = Invoke-ObservedTest 'exact-controller-lifecycle' 'TerraFusion.Unit.Tests.Stage2.DaisEndpointContractTests.DaisController_ExactStagedMutationRuntime_CreatesTransitionsPersistsSqlite_AndReadsThroughWorkflowConsumer'
    $tamperRefusal = Invoke-ObservedTest 'tamper-before-save' 'TerraFusion.Unit.Tests.Stage2.DaisEndpointContractTests.DaisMutation_ManifestModuleOrSchemaTamper_FailsBeforeAppealSave'
    $disabledSelection = Invoke-ObservedTest 'disabled-selection' 'TerraFusion.Unit.Tests.Dais.DaisAppealMutationRuntimeRegistrationTests.Disabled_RegistersFailClosedDecisionPortAndOptions'
    $productionRefusal = Invoke-ObservedTest 'production-refusal' 'TerraFusion.Unit.Tests.Dais.DaisAppealMutationRuntimeRegistrationTests.LocalExact_IsRejectedOutsideDevelopment'

    Move-Item -LiteralPath $mutationSlot -Destination $adoptedMutationDuringRollback
    Move-Item -LiteralPath $durableMutationRollbackSlot -Destination $mutationSlot
    Assert-Inventory $mutationSlot $mutationStageReceipt.rollbackHashes 'Observed byte-identical mutation rollback'
    $rollbackExecution = 'PASS - prior Disabled/artifact slot restored and hash verified'
    Move-Item -LiteralPath $mutationSlot -Destination $durableMutationRollbackSlot
    Move-Item -LiteralPath $adoptedMutationDuringRollback -Destination $mutationSlot
    Assert-Inventory $mutationSlot $publishedMutationInventory 'Restored adopted mutation slot'
    $adoptionRestoration = 'PASS - adopted exact mutation slot restored and hash verified'

    $changesAfter = @(Get-SovereignChangeSnapshot)
    if ($null -ne (Compare-Object $changesBefore $changesAfter)) { throw 'Tracked or untracked sovereign state drifted during mutation adoption proof.' }
    $receiptPath = Join-Path $durableRunRoot 'runtime-adoption-receipt.json'
    $result = [ordered]@{
        result='PASS';receiptState='LOCAL_TERMINAL_PROOF_SUCCESS';terminalCondition=$terminalCondition;
        sovereignHead=$sovereignHead;daisCommit=$expectedDaisCommit;mutationArtifactSlot=$mutationSlot;
        moduleSha256=$expectedModuleSha256;schemaSha256=$expectedSchemaSha256;manifestSha256=$expectedManifestSha256;
        persistentDevelopmentSelection=$true;configurableArtifactRedirectDenied=$true;
        configuredFreshStartAndRestart=$registrationStart;exactControllerLifecycle=$exactControllerLifecycle;
        manifestModuleSchemaTamperBeforeSave=$tamperRefusal;disabledSelectionRollback=$disabledSelection;
        productionSelectionRefusal=$productionRefusal;artifactRollbackExecution=$rollbackExecution;
        adoptedArtifactRestoration=$adoptionRestoration;focusedTestsTotal=$focused.Total;
        focusedTestsExecuted=$focused.Executed;focusedTestsPassed=$focused.Passed;focusedTestsFailed=$focused.Failed;
        focusedTestsSkipped=$focused.Skipped;durableReceipt=$receiptPath;
        durableMutationRollbackSlot=$durableMutationRollbackSlot;rollbackInventory=$mutationStageReceipt.rollbackHashes;
        countyOrProtectedDataUsed=$false;deploymentOrProductionUsed=$false
    }
    $temporaryReceipt = Join-Path $durableRunRoot ('runtime-adoption-receipt.'+[Guid]::NewGuid().ToString('N')+'.tmp')
    $result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $temporaryReceipt -Encoding utf8
    Move-Item -LiteralPath $temporaryReceipt -Destination $receiptPath
}
catch {
    $proofFailure = $_
    try {
        if ($workflowStagePublished -and $null -ne $workflowStageReceipt) {
            if (Test-Path -LiteralPath $workflowSlot) {
                $failedWorkflow = Join-Path $durableRunRoot ('failed-workflow-artifact-'+[Guid]::NewGuid().ToString('N'))
                Move-Item -LiteralPath $workflowSlot -Destination $failedWorkflow
            }
            if (Test-Path -LiteralPath $durableWorkflowRollbackSlot -PathType Container) {
                Move-Item -LiteralPath $durableWorkflowRollbackSlot -Destination $workflowSlot
                Assert-Inventory $workflowSlot $workflowStageReceipt.rollbackHashes 'Failure-path restored workflow slot'
            }
        }
        if ($mutationStagePublished -and $null -ne $mutationStageReceipt -and (Test-Path -LiteralPath $durableMutationRollbackSlot -PathType Container)) {
            if (Test-Path -LiteralPath $mutationSlot) {
                $failedArtifact = Join-Path $durableRunRoot ('failed-mutation-artifact-'+[Guid]::NewGuid().ToString('N'))
                Move-Item -LiteralPath $mutationSlot -Destination $failedArtifact
            }
            Move-Item -LiteralPath $durableMutationRollbackSlot -Destination $mutationSlot
            Assert-Inventory $mutationSlot $mutationStageReceipt.rollbackHashes 'Failure-path restored mutation slot'
        }
        New-Item -ItemType Directory -Path $durableRunRoot -Force | Out-Null
        [ordered]@{result='FAIL';receiptState='TERMINAL_FAILURE';terminalCondition=$terminalCondition;failure=$proofFailure.Exception.Message;countyOrProtectedDataUsed=$false;deploymentOrProductionUsed=$false} |
            ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $durableRunRoot 'runtime-adoption-failure.json') -Encoding utf8
    } catch { }
    throw $proofFailure
}
finally {
    foreach ($name in @('DOTNET_CLI_HOME','DOTNET_CLI_TELEMETRY_OPTOUT','DOTNET_NOLOGO','DOTNET_CLI_USE_MSBUILD_SERVER','NUGET_PACKAGES','NUGET_HTTP_CACHE_PATH','TERRAFUSION_DAIS_MUTATION_HOST_MODULE_PATH','TERRAFUSION_DAIS_MUTATION_HOST_SCHEMA_PATH','TERRAFUSION_DAIS_HOST_MODULE_PATH','TERRAFUSION_DAIS_HOST_SCHEMA_PATH')) {
        [Environment]::SetEnvironmentVariable($name,$null,'Process')
    }
    foreach ($path in @($testRoot,$mutationStageRoot,$workflowStageRoot)) {
        try { if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Recurse -Force } } catch { }
    }
}

if ($null -ne $result) { $result | ConvertTo-Json -Depth 8 }
