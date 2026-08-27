[CmdletBinding()]
param(
    [string]$DaisRepository = 'https://github.com/bsvalues/terrafusion-dais',
    [string]$DotNetExecutable,
    [string]$NuGetPackagesPath,
    [string]$ProofRootBase,
    [switch]$RecoverySelfTest
)

$ErrorActionPreference = 'Stop'
$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$expectedSovereignBase = 'acf4abc5959f468c6a43a00b09cead5d55679795'
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
$testRoot = Join-Path ([IO.Path]::GetTempPath()) "tf-dais-010g-$runId"
$mutationStageRoot = Join-Path ([IO.Path]::GetTempPath()) "tfd010g-mutation-$runId"
$workflowStageRoot = Join-Path ([IO.Path]::GetTempPath()) "tfd010g-workflow-$runId"
$durableRunRoot = Join-Path $durableProofBase "mutation-$runId"
$durableMutationRollbackSlot = Join-Path $durableRunRoot 'previous-mutation-artifact'
$durableWorkflowRollbackSlot = Join-Path $durableRunRoot 'previous-workflow-artifact'
$adoptedMutationDuringRollback = Join-Path $durableRunRoot 'adopted-mutation-during-rollback'
$mutationStageReceipt = $null
$workflowStageReceipt = $null
$mutationStageAttempted = $false
$workflowStageAttempted = $false
$mutationOriginalExisted = $false
$workflowOriginalExisted = $false
$mutationOriginalInventory = $null
$workflowOriginalInventory = $null
$mutationStageRootSafeToDelete = $false
$workflowStageRootSafeToDelete = $false
$mutationMutex = $null
$workflowMutex = $null
$mutationMutexHeld = $false
$workflowMutexHeld = $false
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
    if (-not (Test-Path -LiteralPath $Directory -PathType Container)) {
        throw "$Label directory is absent."
    }
    $expectedInventory = ConvertTo-Inventory $Expected
    $actualInventory = ConvertTo-Inventory (Get-Inventory $Directory)
    if ($null -ne (Compare-Object @($expectedInventory.Keys) @($actualInventory.Keys))) { throw "$Label paths differ." }
    foreach ($name in $expectedInventory.Keys) {
        if ($actualInventory[$name] -cne $expectedInventory[$name]) { throw "$Label hash mismatch for $name." }
    }
}

function Assert-InventoriesEqual {
    param([Parameter(Mandatory)]$Actual,[Parameter(Mandatory)]$Expected,[Parameter(Mandatory)][string]$Label)
    $actualInventory = ConvertTo-Inventory $Actual
    $expectedInventory = ConvertTo-Inventory $Expected
    if ($null -ne (Compare-Object @($actualInventory.Keys) @($expectedInventory.Keys))) {
        throw "$Label paths differ."
    }
    foreach ($name in $expectedInventory.Keys) {
        if ($actualInventory[$name] -cne $expectedInventory[$name]) {
            throw "$Label hash mismatch for $name."
        }
    }
}

function Test-Inventory {
    param([Parameter(Mandatory)][string]$Directory,[Parameter(Mandatory)]$Expected)
    try { Assert-Inventory $Directory $Expected 'Inventory probe'; return $true }
    catch { return $false }
}

function Get-ReceiptFromOutput {
    param([Parameter(Mandatory)]$Output)
    $lines = @($Output)
    $start = 0
    while ($start -lt $lines.Count -and -not $lines[$start].TrimStart().StartsWith('{',[StringComparison]::Ordinal)) { $start++ }
    if ($start -ge $lines.Count) { throw 'Dais staging did not emit a JSON receipt.' }
    return ($lines[$start..($lines.Count-1)] -join "`n") | ConvertFrom-Json
}

function Get-UniqueRollbackSlot {
    param([Parameter(Mandatory)][string]$StageRoot)
    if (-not (Test-Path -LiteralPath $StageRoot -PathType Container)) { return $null }
    $candidates = @(Get-ChildItem -LiteralPath $StageRoot -Directory -Recurse -Force |
        Where-Object { $_.Name -ceq 'previous-artifact' })
    if ($candidates.Count -gt 1) { throw "Multiple rollback slots found under $StageRoot." }
    if ($candidates.Count -eq 1) { return $candidates[0].FullName }
    return $null
}

function Restore-StagedSlot {
    param(
        [Parameter(Mandatory)][string]$LiveSlot,
        [Parameter(Mandatory)][string]$DurableRollbackSlot,
        [Parameter(Mandatory)][string]$StageRoot,
        $Receipt,
        [Parameter(Mandatory)][bool]$OriginalExisted,
        $OriginalInventory,
        [Parameter(Mandatory)][string]$Label)
    New-Item -ItemType Directory -Path $durableRunRoot -Force | Out-Null
    $originalRollback = if ($null -ne $Receipt -and
        -not [string]::IsNullOrWhiteSpace([string]$Receipt.rollbackSlot)) {
        [IO.Path]::GetFullPath([string]$Receipt.rollbackSlot)
    } else { Get-UniqueRollbackSlot $StageRoot }
    $backup = if (Test-Path -LiteralPath $DurableRollbackSlot -PathType Container) {
        $DurableRollbackSlot
    } elseif ($null -ne $originalRollback -and
        (Test-Path -LiteralPath $originalRollback -PathType Container)) {
        $originalRollback
    } else { $null }
    $expected = if ($OriginalExisted) {
        if ($null -eq $OriginalInventory) { throw "$Label original inventory anchor is missing." }
        $OriginalInventory
    } else { $null }
    if ($null -ne $Receipt -and $null -ne $Receipt.rollbackHashes) {
        if (-not $OriginalExisted) { throw "$Label receipt reported rollback hashes for an originally absent slot." }
        Assert-InventoriesEqual $Receipt.rollbackHashes $expected "$Label receipt versus pre-stage anchor"
    }

    if ($OriginalExisted -and
        (Test-Path -LiteralPath $LiveSlot -PathType Container) -and
        (Test-Inventory $LiveSlot $expected)) {
        return 'PREVIOUS_SLOT_ALREADY_LIVE_AND_HASH_VERIFIED'
    }
    if (-not $OriginalExisted -and -not (Test-Path -LiteralPath $LiveSlot)) {
        return 'PREVIOUS_SLOT_ALREADY_ABSENT'
    }
    if ($OriginalExisted -and $null -eq $backup) {
        throw "$Label rollback custody was lost before recovery."
    }
    if ($OriginalExisted) {
        Assert-Inventory $backup $expected "$Label rollback backup versus pre-stage anchor"
    } elseif ($null -ne $backup) {
        throw "$Label discovered a rollback backup for an originally absent slot."
    }
    if (Test-Path -LiteralPath $LiveSlot) {
        $failed = Join-Path $durableRunRoot (
            'failed-'+$Label.ToLowerInvariant().Replace(' ','-')+'-'+[Guid]::NewGuid().ToString('N'))
        Move-Item -LiteralPath $LiveSlot -Destination $failed
    }
    if (-not $OriginalExisted) {
        return 'PREVIOUS_SLOT_WAS_ABSENT_AND_PUBLISHED_SLOT_WAS_REMOVED'
    }
    Move-Item -LiteralPath $backup -Destination $LiveSlot
    Assert-Inventory $LiveSlot $expected "$Label restored rollback slot"
    return 'PREVIOUS_SLOT_RESTORED_AND_HASH_VERIFIED'
}

function Invoke-IndependentRecoveries {
    param([scriptblock]$WorkflowAction,[scriptblock]$MutationAction)
    $failures = [Collections.Generic.List[Exception]]::new()
    $workflowResult = 'NOT_REQUIRED'
    $mutationResult = 'NOT_REQUIRED'
    if ($null -ne $WorkflowAction) {
        try { $workflowResult = & $WorkflowAction }
        catch { $failures.Add($_.Exception) }
    }
    if ($null -ne $MutationAction) {
        try { $mutationResult = & $MutationAction }
        catch { $failures.Add($_.Exception) }
    }
    return [pscustomobject]@{
        WorkflowResult=$workflowResult
        MutationResult=$mutationResult
        Failures=$failures
    }
}

function Invoke-RecoverySelfTest {
    $selfTestRoot = Join-Path ([IO.Path]::GetTempPath()) ('tf-dais-recovery-selftest-'+[Guid]::NewGuid().ToString('N'))
    $savedDurableRunRoot = $script:durableRunRoot
    try {
        New-Item -ItemType Directory -Path $selfTestRoot -Force | Out-Null
        $script:durableRunRoot = Join-Path $selfTestRoot 'receipts'

        $receiptLossRoot = Join-Path $selfTestRoot 'receipt-loss'
        $receiptLossLive = Join-Path $receiptLossRoot 'live'
        $receiptLossStage = Join-Path $receiptLossRoot 'stage'
        $receiptLossBackup = Join-Path $receiptLossStage 'previous-artifact'
        New-Item -ItemType Directory -Path $receiptLossLive,$receiptLossBackup -Force | Out-Null
        Set-Content -LiteralPath (Join-Path $receiptLossBackup 'original.txt') -Value 'original' -NoNewline
        $receiptLossAnchor = Get-Inventory $receiptLossBackup
        Set-Content -LiteralPath (Join-Path $receiptLossLive 'adopted.txt') -Value 'adopted' -NoNewline
        $receiptLossResult = Restore-StagedSlot $receiptLossLive (Join-Path $receiptLossRoot 'durable') `
            $receiptLossStage $null $true $receiptLossAnchor 'receipt-loss self-test'
        Assert-Inventory $receiptLossLive $receiptLossAnchor 'Receipt-loss recovery self-test'

        $corruptRoot = Join-Path $selfTestRoot 'corrupt-custody'
        $corruptLive = Join-Path $corruptRoot 'live'
        $corruptStage = Join-Path $corruptRoot 'stage'
        $corruptBackup = Join-Path $corruptStage 'previous-artifact'
        $corruptAnchorSource = Join-Path $corruptRoot 'anchor'
        New-Item -ItemType Directory -Path $corruptLive,$corruptBackup,$corruptAnchorSource -Force | Out-Null
        Set-Content -LiteralPath (Join-Path $corruptLive 'adopted.txt') -Value 'adopted' -NoNewline
        Set-Content -LiteralPath (Join-Path $corruptBackup 'original.txt') -Value 'corrupt' -NoNewline
        Set-Content -LiteralPath (Join-Path $corruptAnchorSource 'original.txt') -Value 'original' -NoNewline
        $corruptRefused = $false
        try {
            Restore-StagedSlot $corruptLive (Join-Path $corruptRoot 'durable') $corruptStage $null `
                $true (Get-Inventory $corruptAnchorSource) 'corrupt-custody self-test' | Out-Null
        } catch { $corruptRefused = $true }
        if (-not $corruptRefused -or -not (Test-Path -LiteralPath (Join-Path $corruptLive 'adopted.txt'))) {
            throw 'Corrupt rollback custody was not refused before changing the live slot.'
        }

        $absentRoot = Join-Path $selfTestRoot 'originally-absent'
        $absentLive = Join-Path $absentRoot 'live'
        $absentStage = Join-Path $absentRoot 'stage'
        New-Item -ItemType Directory -Path $absentLive,$absentStage -Force | Out-Null
        Set-Content -LiteralPath (Join-Path $absentLive 'adopted.txt') -Value 'adopted' -NoNewline
        $absentResult = Restore-StagedSlot $absentLive (Join-Path $absentRoot 'durable') `
            $absentStage $null $false $null 'originally-absent self-test'
        if (Test-Path -LiteralPath $absentLive) { throw 'Originally absent slot was not restored to absence.' }

        $emptyRoot = Join-Path $selfTestRoot 'existing-empty'
        $emptyLive = Join-Path $emptyRoot 'live'
        $emptyStage = Join-Path $emptyRoot 'stage'
        $emptyBackup = Join-Path $emptyStage 'previous-artifact'
        New-Item -ItemType Directory -Path $emptyBackup -Force | Out-Null
        $emptyResult = Restore-StagedSlot $emptyLive (Join-Path $emptyRoot 'durable') `
            $emptyStage $null $true (Get-Inventory $emptyBackup) 'existing-empty self-test'
        if (-not (Test-Path -LiteralPath $emptyLive -PathType Container)) {
            throw 'Existing empty slot was not restored as a directory.'
        }

        $script:mutationCoordinatorObserved = $false
        $coordinated = Invoke-IndependentRecoveries `
            -WorkflowAction { throw 'synthetic workflow recovery failure' } `
            -MutationAction { $script:mutationCoordinatorObserved = $true; throw 'synthetic mutation recovery failure' }
        if (-not $script:mutationCoordinatorObserved -or $coordinated.Failures.Count -ne 2) {
            throw 'Independent recovery coordination did not run both recoveries and collect both failures.'
        }

        [ordered]@{
            result='PASS';receiptLossRecovery=$receiptLossResult;corruptCustodyRefused=$corruptRefused;
            originallyAbsentRecovery=$absentResult;existingEmptyRecovery=$emptyResult;
            independentRecoveryFailuresCollected=$coordinated.Failures.Count
        } | ConvertTo-Json
    }
    finally {
        $script:durableRunRoot = $savedDurableRunRoot
        if (Test-Path -LiteralPath $selfTestRoot) { Remove-Item -LiteralPath $selfTestRoot -Recurse -Force }
    }
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

if ($RecoverySelfTest) {
    Invoke-RecoverySelfTest
    return
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
    # Fixed acquisition order prevents cross-proof deadlocks. Both stagers run in this
    # PowerShell process/thread, so their same-name mutex acquisition is recursive and the
    # outer ownership remains held through tests, observed rollback, restoration, and cleanup.
    $mutationMutex = [Threading.Mutex]::new(
        $false,
        'Local\TerraFusion.DaisAppealMutation.ArtifactSlot')
    $workflowMutex = [Threading.Mutex]::new(
        $false,
        'Local\TerraFusion.DaisAppealWorkflow.ArtifactSlot')
    try { $mutationMutexHeld = $mutationMutex.WaitOne([TimeSpan]::FromSeconds(30)) }
    catch [Threading.AbandonedMutexException] { $mutationMutexHeld = $true }
    if (-not $mutationMutexHeld) { throw 'Timed out acquiring the mutation artifact custody lock.' }
    try { $workflowMutexHeld = $workflowMutex.WaitOne([TimeSpan]::FromSeconds(30)) }
    catch [Threading.AbandonedMutexException] { $workflowMutexHeld = $true }
    if (-not $workflowMutexHeld) { throw 'Timed out acquiring the workflow artifact custody lock.' }

    if (-not (Test-Path -LiteralPath $mutationSlot -PathType Container)) {
        New-Item -ItemType Directory -Path $mutationSlot -Force | Out-Null
        [ordered]@{mode='Disabled';reason='pre-adoption rollback sentinel';schemaVersion=1} |
            ConvertTo-Json | Set-Content -LiteralPath (Join-Path $mutationSlot 'disabled-marker.json') -Encoding utf8
    }
    $mutationOriginalExisted = Test-Path -LiteralPath $mutationSlot -PathType Container
    $mutationOriginalInventory = if ($mutationOriginalExisted) { Get-Inventory $mutationSlot } else { $null }
    $workflowOriginalExisted = Test-Path -LiteralPath $workflowSlot -PathType Container
    $workflowOriginalInventory = if ($workflowOriginalExisted) { Get-Inventory $workflowSlot } else { $null }

    $mutationStageAttempted = $true
    $mutationOutput = & (Join-Path $sovereignRepository 'scripts\bootstrap\Stage-DaisAppealMutationModule.ps1') -DaisRepository $DaisRepository -BuildRootBase $mutationStageRoot
    if ($LASTEXITCODE -ne 0) { throw 'Dais mutation canonical staging failed.' }
    $mutationStageReceipt = Get-ReceiptFromOutput $mutationOutput
    if ($mutationStageReceipt.suiteCommit -cne $expectedDaisCommit -or
        $mutationStageReceipt.moduleSha256 -cne $expectedModuleSha256 -or
        $mutationStageReceipt.schemaSha256 -cne $expectedSchemaSha256 -or
        $mutationStageReceipt.publishedManifestSha256 -cne $expectedManifestSha256 -or
        $mutationStageReceipt.publishedManifestLength -ne 1465) { throw 'Dais mutation stage receipt identity mismatch.' }
    if ([IO.Path]::GetFullPath($mutationStageReceipt.artifactSlot) -ine $mutationSlot) { throw 'Mutation stage used a noncanonical slot.' }
    if ([string]::IsNullOrWhiteSpace($mutationStageReceipt.rollbackSlot) -or $null -eq $mutationStageReceipt.rollbackHashes) { throw 'Mutation proof requires a nonempty prior rollback slot.' }
    Assert-InventoriesEqual $mutationStageReceipt.rollbackHashes $mutationOriginalInventory 'Mutation receipt versus pre-stage anchor'
    Assert-Inventory ([IO.Path]::GetFullPath($mutationStageReceipt.rollbackSlot)) $mutationStageReceipt.rollbackHashes 'Original mutation rollback slot'
    Move-Item -LiteralPath ([IO.Path]::GetFullPath($mutationStageReceipt.rollbackSlot)) -Destination $durableMutationRollbackSlot
    Assert-Inventory $durableMutationRollbackSlot $mutationStageReceipt.rollbackHashes 'Durable mutation rollback slot'
    $mutationStageRootSafeToDelete = $true
    $publishedMutationInventory = Get-Inventory $mutationSlot
    if ((@($publishedMutationInventory.Keys | Sort-Object) -join '|') -cne
        'dais.appeal-mutation.v1.schema.json|decide-dais-appeal-mutation.mjs|manifest.json') {
        throw 'Published mutation slot does not contain the exact three-file inventory.'
    }

    $workflowStageAttempted = $true
    $workflowOutput = & (Join-Path $sovereignRepository 'scripts\bootstrap\Stage-DaisAppealWorkflowModule.ps1') -DaisRepository $DaisRepository -BuildRootBase $workflowStageRoot
    if ($LASTEXITCODE -ne 0) { throw 'Dais workflow canonical staging failed.' }
    $workflowStageReceipt = Get-ReceiptFromOutput $workflowOutput
    if ($null -ne $workflowStageReceipt.rollbackSlot) {
        if (-not $workflowOriginalExisted) { throw 'Workflow receipt reported rollback custody for an originally absent slot.' }
        Assert-InventoriesEqual $workflowStageReceipt.rollbackHashes $workflowOriginalInventory 'Workflow receipt versus pre-stage anchor'
        Assert-Inventory ([IO.Path]::GetFullPath($workflowStageReceipt.rollbackSlot)) $workflowStageReceipt.rollbackHashes 'Original workflow rollback slot'
        Move-Item -LiteralPath ([IO.Path]::GetFullPath($workflowStageReceipt.rollbackSlot)) -Destination $durableWorkflowRollbackSlot
        Assert-Inventory $durableWorkflowRollbackSlot $workflowStageReceipt.rollbackHashes 'Durable workflow rollback slot'
    } elseif ($workflowOriginalExisted) {
        throw 'Workflow receipt omitted rollback custody for an existing original slot.'
    }
    $workflowStageRootSafeToDelete = $true

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
    $integrationTestProject = Join-Path $sovereignRepository 'backend\tests\TerraFusion.Integration.Tests\TerraFusion.Integration.Tests.csproj'
    $resultsDirectory = Join-Path $testRoot 'test-results'
    $artifacts = Join-Path $testRoot 'artifacts'

    Invoke-Checked $DotNetExecutable @(
        'test',$testProject,'-c','Release','--artifacts-path',$artifacts,'--results-directory',$resultsDirectory,
        '--logger','trx;LogFileName=dais-mutation-adoption.trx','--filter',
        'FullyQualifiedName~DaisAppealMutation|FullyQualifiedName~AppealServiceTests|FullyQualifiedName~DaisEndpointContractTests',
        '/warnaserror','-p:UseSharedCompilation=false','-nodeReuse:false','-p:NuGetAudit=false'
    )
    $focused = Read-TrxCounters (Join-Path $resultsDirectory 'dais-mutation-adoption.trx')
    if ($focused.Total -lt 56 -or $focused.Executed -ne $focused.Total -or $focused.Passed -ne $focused.Total -or $focused.Failed -ne 0 -or $focused.Skipped -ne 0) {
        throw "Mutation runtime tests were $($focused.Total)/$($focused.Executed)/$($focused.Passed)/$($focused.Failed)/$($focused.Skipped)."
    }

    Invoke-Checked $DotNetExecutable @(
        'test',$integrationTestProject,'-c','Release','--artifacts-path',$artifacts,
        '--results-directory',$resultsDirectory,'--logger','trx;LogFileName=dais-mutation-concurrency.trx',
        '--filter','FullyQualifiedName~DaisMutationSqliteLifecycleTests','/warnaserror',
        '-p:UseSharedCompilation=false','-nodeReuse:false','-p:NuGetAudit=false'
    )
    $concurrency = Read-TrxCounters (Join-Path $resultsDirectory 'dais-mutation-concurrency.trx')
    if ($concurrency.Total -ne 2 -or $concurrency.Executed -ne 2 -or $concurrency.Passed -ne 2 -or $concurrency.Failed -ne 0 -or $concurrency.Skipped -ne 0) {
        throw "Mutation concurrency tests were $($concurrency.Total)/$($concurrency.Executed)/$($concurrency.Passed)/$($concurrency.Failed)/$($concurrency.Skipped); expected 2/2/2/0/0."
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
        focusedTestsSkipped=$focused.Skipped;concurrencyTestsTotal=$concurrency.Total;
        concurrencyTestsExecuted=$concurrency.Executed;concurrencyTestsPassed=$concurrency.Passed;
        concurrencyTestsFailed=$concurrency.Failed;concurrencyTestsSkipped=$concurrency.Skipped;durableReceipt=$receiptPath;
        durableMutationRollbackSlot=$durableMutationRollbackSlot;rollbackInventory=$mutationStageReceipt.rollbackHashes;
        countyOrProtectedDataUsed=$false;deploymentOrProductionUsed=$false
    }
    $temporaryReceipt = Join-Path $durableRunRoot ('runtime-adoption-receipt.'+[Guid]::NewGuid().ToString('N')+'.tmp')
    $result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $temporaryReceipt -Encoding utf8
    Move-Item -LiteralPath $temporaryReceipt -Destination $receiptPath
}
catch {
    $proofFailure = $_
    $workflowRecoveryAction = if ($workflowStageAttempted) {
        {
            $workflowRecovery = Restore-StagedSlot $workflowSlot $durableWorkflowRollbackSlot $workflowStageRoot `
                $workflowStageReceipt $workflowOriginalExisted $workflowOriginalInventory 'workflow artifact'
            $script:workflowStageRootSafeToDelete = $true
            $workflowRecovery
        }
    } else { $null }
    $mutationRecoveryAction = if ($mutationStageAttempted) {
        {
            $mutationRecovery = Restore-StagedSlot $mutationSlot $durableMutationRollbackSlot $mutationStageRoot `
                $mutationStageReceipt $mutationOriginalExisted $mutationOriginalInventory 'mutation artifact'
            $script:mutationStageRootSafeToDelete = $true
            $mutationRecovery
        }
    } else { $null }
    $coordinatedRecovery = Invoke-IndependentRecoveries $workflowRecoveryAction $mutationRecoveryAction
    $recoveryFailures = $coordinatedRecovery.Failures
    $workflowRecovery = $coordinatedRecovery.WorkflowResult
    $mutationRecovery = $coordinatedRecovery.MutationResult
    try {
        New-Item -ItemType Directory -Path $durableRunRoot -Force | Out-Null
        [ordered]@{result='FAIL';receiptState='TERMINAL_FAILURE';terminalCondition=$terminalCondition;
            failure=$proofFailure.Exception.Message;recoveryFailures=@($recoveryFailures | ForEach-Object Message);
            workflowRecovery=$workflowRecovery;mutationRecovery=$mutationRecovery;
            mutationStageRootPreserved=-not $mutationStageRootSafeToDelete;
            workflowStageRootPreserved=-not $workflowStageRootSafeToDelete;
            countyOrProtectedDataUsed=$false;deploymentOrProductionUsed=$false} |
            ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $durableRunRoot 'runtime-adoption-failure.json') -Encoding utf8
    } catch {
        $recoveryFailures.Add($_.Exception)
    }
    if ($recoveryFailures.Count -gt 0) {
        throw [AggregateException]::new(
            'Dais mutation proof failed and rollback recovery did not complete.',
            [Exception[]]@($proofFailure.Exception)+[Exception[]]@($recoveryFailures))
    }
    throw $proofFailure
}
finally {
    foreach ($name in @('DOTNET_CLI_HOME','DOTNET_CLI_TELEMETRY_OPTOUT','DOTNET_NOLOGO','DOTNET_CLI_USE_MSBUILD_SERVER','NUGET_PACKAGES','NUGET_HTTP_CACHE_PATH','TERRAFUSION_DAIS_MUTATION_HOST_MODULE_PATH','TERRAFUSION_DAIS_MUTATION_HOST_SCHEMA_PATH','TERRAFUSION_DAIS_HOST_MODULE_PATH','TERRAFUSION_DAIS_HOST_SCHEMA_PATH')) {
        [Environment]::SetEnvironmentVariable($name,$null,'Process')
    }
    try { if (Test-Path -LiteralPath $testRoot) { Remove-Item -LiteralPath $testRoot -Recurse -Force } } catch { }
    try { if ($mutationStageRootSafeToDelete -and (Test-Path -LiteralPath $mutationStageRoot)) { Remove-Item -LiteralPath $mutationStageRoot -Recurse -Force } } catch { }
    try { if ($workflowStageRootSafeToDelete -and (Test-Path -LiteralPath $workflowStageRoot)) { Remove-Item -LiteralPath $workflowStageRoot -Recurse -Force } } catch { }
    if ($workflowMutexHeld) { $workflowMutex.ReleaseMutex() }
    if ($mutationMutexHeld) { $mutationMutex.ReleaseMutex() }
    if ($null -ne $workflowMutex) { $workflowMutex.Dispose() }
    if ($null -ne $mutationMutex) { $mutationMutex.Dispose() }
}

if ($null -ne $result) { $result | ConvertTo-Json -Depth 8 }
