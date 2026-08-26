[CmdletBinding()]
param(
    [string]$AtlasRepository = 'https://github.com/bsvalues/terrafusion-atlas',
    [string]$DotNetExecutable,
    [string]$NuGetPackagesPath,
    [string]$ProofRootBase
)

$ErrorActionPreference = 'Stop'
$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$expectedSovereignBase = '5a328e728852dc2bb933d704d0daa5c54750728c'
$expectedAtlasCommit = '6736a53980c73d2b503ec71a440ad8e02aa43782'
$expectedModuleSha256 = '3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46'
$durableProofBase = if ([string]::IsNullOrWhiteSpace($ProofRootBase)) {
    Join-Path $sovereignRepository '.terrafusion\runtime\atlas\adoption-receipts'
}
else {
    [IO.Path]::GetFullPath($ProofRootBase)
}
$runId = [DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + [Guid]::NewGuid().ToString('N')
$testRoot = Join-Path ([IO.Path]::GetTempPath()) "tf-atlas-007d-$runId"
$stageRoot = Join-Path ([IO.Path]::GetTempPath()) "tfa7d-stage-$runId"
$artifacts = Join-Path $testRoot 'artifacts'
$testResults = Join-Path $testRoot 'test-results'
$dotnetHome = Join-Path $testRoot 'dotnet-home'
$nugetHttp = Join-Path $testRoot 'nuget-http'
$preservedEnvironment = @{}
$result = $null
$stageReceipt = $null
$durableRunRoot = $null
$originalRollbackSlot = $null
$durableRollbackSlot = $null
$stagePublished = $false
$preserveStageRoot = $false
$expectedArtifactSlot = Join-Path $sovereignRepository '.terrafusion\runtime\atlas\spatial-read'

$authorizedSovereignPaths = @(
    '.governance/owner-decisions.json',
    '.gitignore',
    'PATH_CANON_REGISTER.md',
    'backend/src/TerraFusion.API/Configuration/AtlasProjectionOptions.cs',
    'backend/src/TerraFusion.API/Program.cs',
    'backend/src/TerraFusion.API/Services/Atlas/AtlasProjectionProcessHost.cs',
    'backend/src/TerraFusion.API/Services/Atlas/AtlasProjectionRuntimeRegistration.cs',
    'backend/src/TerraFusion.API/Services/Atlas/IAtlasProjectionProcessHost.cs',
    'backend/src/TerraFusion.API/appsettings.Development.json',
    'backend/tests/TerraFusion.Unit.Tests/Atlas/AtlasProjectionRuntimeRegistrationTests.cs',
    'docs/brain/workorders/active/WO-SR-007C-atlas-canonical-artifact-staging.md',
    'docs/brain/workorders/active/WO-SR-007D-atlas-persistent-runtime-adoption.md',
    'docs/brain/workorders/evidence/WO-SR-007C-ATLAS-CANONICAL-ARTIFACT-STAGING.md',
    'docs/brain/workorders/evidence/WO-SR-007D-ATLAS-PERSISTENT-RUNTIME-ADOPTION.md',
    'docs/brain/workorders/registry/work-order-registry.seed.json',
    'docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md',
    'docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md',
    'docs/brain/workorders/programs/five-suite-federated-repository-buildout.md',
    'docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md',
    'docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md',
    'docs/brain/workorders/goal-loop/GOAL_COMMANDS.md',
    'scripts/validation/Invoke-AtlasPersistentRuntimeAdoptionRollbackProof.ps1'
)

foreach ($name in @(
        'DOTNET_CLI_HOME',
        'DOTNET_CLI_TELEMETRY_OPTOUT',
        'DOTNET_NOLOGO',
        'DOTNET_CLI_USE_MSBUILD_SERVER',
        'NUGET_PACKAGES',
        'NUGET_HTTP_CACHE_PATH',
        'TERRAFUSION_ATLAS_RUNTIME_ROOT',
        'TERRAFUSION_ATLAS_HOST_MODULE_PATH',
        'TERRAFUSION_ATLAS_NODE_PATH'
    )) {
    $preservedEnvironment[$name] = @{
        Exists = Test-Path "Env:$name"
        Value = [Environment]::GetEnvironmentVariable($name, 'Process')
    }
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory)]
        [string]$Command,
        [Parameter(ValueFromRemainingArguments)]
        [string[]]$Arguments
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Command failed with exit code $LASTEXITCODE."
    }
}

function Get-SovereignChangedPaths {
    $entries = @(git -C $sovereignRepository status --porcelain=v1 --untracked-files=all)
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to inspect sovereign worktree status.'
    }

    return @($entries | ForEach-Object {
            $path = $_.Substring(3).Replace('\', '/')
            if ($path.Contains(' -> ')) {
                $path = $path.Split(' -> ')[-1]
            }
            $path
        } | Sort-Object -Unique)
}

function Assert-AuthorizedSovereignPaths {
    param([string[]]$Paths)

    $unauthorized = @($Paths | Where-Object { $_ -notin $authorizedSovereignPaths })
    if ($unauthorized.Count -gt 0) {
        throw "Unauthorized sovereign paths changed: $($unauthorized -join '; ')"
    }
}

function Get-DirectoryFileHashes {
    param([Parameter(Mandatory)][string]$Directory)

    $hashes = [ordered]@{}
    if (-not (Test-Path -LiteralPath $Directory -PathType Container)) {
        return $hashes
    }
    foreach ($file in Get-ChildItem -LiteralPath $Directory -File -Recurse | Sort-Object FullName) {
        $relative = [IO.Path]::GetRelativePath($Directory, $file.FullName).Replace('\', '/')
        $hashes[$relative] = (
            Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256
        ).Hash.ToLowerInvariant()
    }
    return $hashes
}

function ConvertTo-HashInventory {
    param([Parameter(Mandatory)]$Inventory)

    $converted = [ordered]@{}
    if ($Inventory -is [System.Collections.IDictionary]) {
        foreach ($key in @($Inventory.Keys | Sort-Object)) {
            $converted[[string]$key] = ([string]$Inventory[$key]).ToLowerInvariant()
        }
        return $converted
    }
    foreach ($property in @($Inventory.PSObject.Properties | Sort-Object Name)) {
        $converted[$property.Name] = ([string]$property.Value).ToLowerInvariant()
    }
    return $converted
}

function Assert-DirectoryHashInventory {
    param(
        [Parameter(Mandatory)][string]$Directory,
        [Parameter(Mandatory)]$Expected,
        [Parameter(Mandatory)][string]$Label
    )

    $expectedInventory = ConvertTo-HashInventory $Expected
    $actualInventory = ConvertTo-HashInventory (Get-DirectoryFileHashes $Directory)
    $expectedNames = @($expectedInventory.Keys)
    $actualNames = @($actualInventory.Keys)
    if ($null -ne (Compare-Object $expectedNames $actualNames)) {
        throw "$Label inventory paths do not match in both directions."
    }
    foreach ($name in $expectedNames) {
        if ($actualInventory[$name] -cne $expectedInventory[$name]) {
            throw "$Label hash mismatch for $name."
        }
    }
}

try {
    $sovereignHead = (git -C $sovereignRepository rev-parse HEAD).Trim()
    Invoke-Checked git @(
        '-C', $sovereignRepository, 'merge-base', '--is-ancestor',
        $expectedSovereignBase, $sovereignHead
    )
    $changesBefore = @(Get-SovereignChangedPaths)
    Assert-AuthorizedSovereignPaths $changesBefore

    $developmentSettingsPath = Join-Path $sovereignRepository `
        'backend\src\TerraFusion.API\appsettings.Development.json'
    $baseSettingsPath = Join-Path $sovereignRepository `
        'backend\src\TerraFusion.API\appsettings.json'
    $developmentSettings = Get-Content -LiteralPath $developmentSettingsPath -Raw | ConvertFrom-Json
    $baseSettings = Get-Content -LiteralPath $baseSettingsPath -Raw | ConvertFrom-Json
    if ($developmentSettings.AtlasProjection.Mode -ne 'LocalExact' -or
        $developmentSettings.AtlasProjection.TimeoutSeconds -ne 30) {
        throw 'Development does not persist the exact Atlas LocalExact selection.'
    }
    if ($developmentSettings.AtlasProjection.PSObject.Properties.Name -contains 'ModulePath' -or
        $developmentSettings.AtlasProjection.PSObject.Properties.Name -contains 'NodeExecutablePath') {
        throw 'Development configuration must not redirect the code-pinned artifact or Node path.'
    }
    if ($null -ne $baseSettings.AtlasProjection -and
        $baseSettings.AtlasProjection.Mode -eq 'LocalExact') {
        throw 'Base configuration must not enable Atlas LocalExact.'
    }
    $productionSettingsPath = Join-Path $sovereignRepository `
        'backend\src\TerraFusion.API\appsettings.Production.json'
    if (Test-Path -LiteralPath $productionSettingsPath) {
        $productionSettings = Get-Content -LiteralPath $productionSettingsPath -Raw | ConvertFrom-Json
        if ($null -ne $productionSettings.AtlasProjection -and
            $productionSettings.AtlasProjection.Mode -eq 'LocalExact') {
            throw 'Production configuration must not enable Atlas LocalExact.'
        }
    }

    New-Item -ItemType Directory -Path $durableProofBase, $testRoot, $stageRoot -Force | Out-Null
    $stageOutput = & pwsh -NoProfile -File (
        Join-Path $sovereignRepository 'scripts\bootstrap\Stage-AtlasProjectionModule.ps1'
    ) -AtlasRepository $AtlasRepository -BuildRootBase $stageRoot
    if ($LASTEXITCODE -ne 0) {
        throw 'Atlas canonical staging failed.'
    }
    # An exit-zero stager may already have replaced the live slot. Until its receipt is parsed and
    # any backup is durably relocated, the complete staging transaction root is protected recovery
    # state and must never be cleaned by this wrapper.
    $stagePublished = $true
    $preserveStageRoot = $true
    $jsonStart = 0
    while ($jsonStart -lt $stageOutput.Count -and
        -not $stageOutput[$jsonStart].TrimStart().StartsWith('{', [StringComparison]::Ordinal)) {
        $jsonStart++
    }
    if ($jsonStart -ge $stageOutput.Count) {
        throw 'Atlas staging did not emit a JSON receipt.'
    }
    $stageReceipt = ($stageOutput[$jsonStart..($stageOutput.Count - 1)] -join "`n") |
        ConvertFrom-Json
    if (-not [string]::IsNullOrWhiteSpace($stageReceipt.rollbackSlot)) {
        $rollbackCandidate = [IO.Path]::GetFullPath($stageReceipt.rollbackSlot)
        $canonicalStageRoot = [IO.Path]::GetFullPath($stageRoot).TrimEnd('\') + '\'
        if ($rollbackCandidate.StartsWith(
                $canonicalStageRoot,
                [StringComparison]::OrdinalIgnoreCase)) {
            $originalRollbackSlot = $rollbackCandidate
        }
    }
    if ($stageReceipt.suiteCommit -ne $expectedAtlasCommit -or
        $stageReceipt.sha256 -ne $expectedModuleSha256) {
        throw 'Atlas stage receipt did not match the canonical runtime identity.'
    }
    if ([IO.Path]::GetFullPath($stageReceipt.artifactSlot) -ine
        [IO.Path]::GetFullPath($expectedArtifactSlot)) {
        throw 'Atlas stage receipt did not identify the fixed sovereign artifact slot.'
    }
    $durableRunRoot = Join-Path $durableProofBase $runId
    New-Item -ItemType Directory -Path $durableRunRoot -Force | Out-Null
    if ([string]::IsNullOrWhiteSpace($stageReceipt.rollbackSlot) -or
        $null -eq $stageReceipt.rollbackHashes -or
        @($stageReceipt.rollbackHashes.PSObject.Properties).Count -eq 0) {
        throw 'Atlas runtime-adoption proof requires a prior artifact slot with rollback hashes.'
    }
    if ($null -eq $originalRollbackSlot) {
        throw 'Atlas rollback backup was not created inside the isolated staging root.'
    }
    Assert-DirectoryHashInventory `
        -Directory $originalRollbackSlot `
        -Expected $stageReceipt.rollbackHashes `
        -Label 'Original Atlas rollback backup'
    $durableRollbackSlot = Join-Path $durableRunRoot 'previous-artifact'
    Move-Item -LiteralPath $originalRollbackSlot -Destination $durableRollbackSlot
    if (Test-Path -LiteralPath $originalRollbackSlot) {
        throw 'Atlas rollback backup relocation left the original backup behind.'
    }
    Assert-DirectoryHashInventory `
        -Directory $durableRollbackSlot `
        -Expected $stageReceipt.rollbackHashes `
        -Label 'Durable Atlas rollback backup'
    $stageReceipt.rollbackSlot = $durableRollbackSlot
    $preserveStageRoot = $false

    $modulePath = [IO.Path]::GetFullPath($stageReceipt.artifactSlot + '\project-atlas-feature.mjs')
    $manifestPath = [IO.Path]::GetFullPath($stageReceipt.manifestPath)
    $moduleHash = (Get-FileHash -LiteralPath $modulePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($moduleHash -ne $expectedModuleSha256) {
        throw "Staged Atlas module hash mismatch: $moduleHash"
    }

    if ([string]::IsNullOrWhiteSpace($DotNetExecutable)) {
        $dotnetCommand = Get-Command dotnet -ErrorAction Stop
        $DotNetExecutable = $dotnetCommand.Source
    }
    $DotNetExecutable = [IO.Path]::GetFullPath($DotNetExecutable)
    if (-not (Test-Path -LiteralPath $DotNetExecutable -PathType Leaf)) {
        throw "DotNetExecutable is unavailable: $DotNetExecutable"
    }
    $nodeExecutable = @(& node -p 'process.execPath') | Select-Object -First 1
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($nodeExecutable)) {
        throw 'Unable to resolve the real Node executable.'
    }
    $nodeExecutable = [IO.Path]::GetFullPath($nodeExecutable.Trim())

    $env:DOTNET_CLI_HOME = $dotnetHome
    $env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
    $env:DOTNET_NOLOGO = '1'
    $env:DOTNET_CLI_USE_MSBUILD_SERVER = '0'
    $env:NUGET_HTTP_CACHE_PATH = $nugetHttp
    if (-not [string]::IsNullOrWhiteSpace($NuGetPackagesPath)) {
        $env:NUGET_PACKAGES = [IO.Path]::GetFullPath($NuGetPackagesPath)
    }
    $env:TERRAFUSION_ATLAS_RUNTIME_ROOT = $sovereignRepository
    $env:TERRAFUSION_ATLAS_HOST_MODULE_PATH = $modulePath
    $env:TERRAFUSION_ATLAS_NODE_PATH = $nodeExecutable

    $testProject = Join-Path $sovereignRepository `
        'backend\tests\TerraFusion.Unit.Tests\TerraFusion.Unit.Tests.csproj'
    Invoke-Checked $DotNetExecutable @(
        'test', $testProject,
        '-c', 'Release',
        '--artifacts-path', $artifacts,
        '--results-directory', $testResults,
        '--logger', 'trx;LogFileName=atlas-runtime-adoption.trx',
        '--filter',
        (
            'FullyQualifiedName~AtlasProjectionRuntimeRegistrationTests|' +
            'FullyQualifiedName~AtlasProjectionConsumerTests|' +
            'FullyQualifiedName~AtlasProjectionProcessHostTests|' +
            'FullyQualifiedName~ParcelGeometryControllerTests'
        ),
        '/warnaserror',
        '-p:UseSharedCompilation=false',
        '-nodeReuse:false'
    )

    $trxPath = Join-Path $testResults 'atlas-runtime-adoption.trx'
    if (-not (Test-Path -LiteralPath $trxPath -PathType Leaf)) {
        throw 'Atlas runtime proof did not emit its required TRX result.'
    }
    [xml]$trx = Get-Content -LiteralPath $trxPath -Raw
    $counters = $trx.TestRun.ResultSummary.Counters
    $testsTotal = [int]$counters.total
    $testsExecuted = [int]$counters.executed
    $testsPassed = [int]$counters.passed
    $testsFailed = [int]$counters.failed
    $testsSkipped = $testsTotal - $testsExecuted
    if ($testsTotal -ne 88 -or $testsExecuted -ne 88 -or $testsPassed -ne 88 -or
        $testsFailed -ne 0 -or $testsSkipped -ne 0) {
        throw "Atlas runtime TRX counts were total=$testsTotal executed=$testsExecuted " +
            "passed=$testsPassed failed=$testsFailed skipped=$testsSkipped; expected 88/88/88/0/0."
    }

    $changesAfter = @(Get-SovereignChangedPaths)
    Assert-AuthorizedSovereignPaths $changesAfter
    if ((Compare-Object $changesBefore $changesAfter).Count -gt 0) {
        throw 'Tracked sovereign worktree changes drifted during the runtime proof.'
    }

    $receiptPath = Join-Path $durableRunRoot 'runtime-adoption-receipt.json'
    $result = [ordered]@{
        result = 'PASS'
        receiptState = 'TERMINAL_SUCCESS'
        terminalCondition = 'ATLAS_PERSISTENT_LOCAL_RUNTIME_ADOPTION_AND_ROLLBACK_PROVEN'
        sovereignHead = $sovereignHead
        atlasCommit = $expectedAtlasCommit
        artifactSlot = $stageReceipt.artifactSlot
        manifestPath = $manifestPath
        moduleSha256 = $moduleHash
        persistentDevelopmentSelection = $true
        configurableArtifactRedirectDenied = $true
        runtimeStartA = 'PASS'
        runtimeRestartB = 'PASS'
        disabledSelectionRollback = 'PASS - no host or consumer registered'
        restoredSelectionStart = 'PASS'
        manifestTamperAfterConstruction = 'FAIL_CLOSED_BEFORE_PROCESS_START'
        moduleTamperAfterConstruction = 'FAIL_CLOSED_BEFORE_PROCESS_START'
        productionSelection = 'DISABLED'
        exactProcessHostInvoked = $true
        focusedTestsTotal = $testsTotal
        focusedTestsExecuted = $testsExecuted
        focusedTestsPassed = $testsPassed
        focusedTestsFailed = $testsFailed
        focusedTestsSkipped = $testsSkipped
        durableReceipt = $receiptPath
        durableArtifactRollbackSlot = $stageReceipt.rollbackSlot
        rollbackInventory = $stageReceipt.rollbackHashes
        countyOrProtectedDataUsed = $false
        deploymentOrProductionUsed = $false
    }
}
catch {
    $proofFailure = $_
    $restoreState = 'NOT_REQUIRED_OR_STAGING_NOT_PUBLISHED'
    $recoveryPath = $null
    try {
        if ($stagePublished -and $null -eq $stageReceipt) {
            $preserveStageRoot = $true
            $restoreState = 'AMBIGUOUS_STAGER_RECEIPT_TRANSACTION_ROOT_PRESERVED'
            $recoveryPath = $stageRoot
        }
        elseif ($stagePublished) {
            if ($null -eq $durableRunRoot) {
                $durableRunRoot = Join-Path $durableProofBase $runId
                New-Item -ItemType Directory -Path $durableRunRoot -Force | Out-Null
            }

            $backupPath = if ($null -ne $durableRollbackSlot -and
                (Test-Path -LiteralPath $durableRollbackSlot -PathType Container)) {
                $durableRollbackSlot
            }
            elseif ($null -ne $originalRollbackSlot -and
                (Test-Path -LiteralPath $originalRollbackSlot -PathType Container)) {
                $originalRollbackSlot
            }
            else {
                $null
            }

            if ($null -ne $backupPath) {
                Assert-DirectoryHashInventory `
                    -Directory $backupPath `
                    -Expected $stageReceipt.rollbackHashes `
                    -Label 'Failure-path Atlas rollback backup'
            }

            $failedArtifact = Join-Path $durableRunRoot 'failed-published-artifact'
            if (Test-Path -LiteralPath $failedArtifact) {
                throw "Failure quarantine already exists: $failedArtifact"
            }
            if (Test-Path -LiteralPath $expectedArtifactSlot) {
                Move-Item -LiteralPath $expectedArtifactSlot -Destination $failedArtifact
                $recoveryPath = $failedArtifact
            }

            if ($null -ne $backupPath) {
                Move-Item -LiteralPath $backupPath -Destination $expectedArtifactSlot
                Assert-DirectoryHashInventory `
                    -Directory $expectedArtifactSlot `
                    -Expected $stageReceipt.rollbackHashes `
                    -Label 'Restored Atlas artifact slot'
                $restoreState = 'PREVIOUS_ARTIFACT_RESTORED_AND_HASH_VERIFIED'
            }
            else {
                $restoreState = 'NEW_UNPROVEN_ARTIFACT_REMOVED_NO_PREVIOUS_SLOT'
            }
        }
    }
    catch {
        $preserveStageRoot = $true
        $restoreState = 'RESTORE_FAILED_BACKUP_PRESERVED'
        $recoveryPath = if ($null -ne $durableRollbackSlot -and
            (Test-Path -LiteralPath $durableRollbackSlot)) {
            $durableRollbackSlot
        }
        elseif ($null -ne $originalRollbackSlot -and
            (Test-Path -LiteralPath $originalRollbackSlot)) {
            $originalRollbackSlot
        }
        else {
            $stageRoot
        }
        $restoreFailure = $_.Exception.Message
    }

    try {
        if ($null -eq $durableRunRoot) {
            $durableRunRoot = Join-Path $durableProofBase $runId
            New-Item -ItemType Directory -Path $durableRunRoot -Force | Out-Null
        }
        $failureReceipt = [ordered]@{
            result = 'FAIL'
            receiptState = 'TERMINAL_FAILURE'
            sovereignHead = $sovereignHead
            atlasCommit = $expectedAtlasCommit
            failure = $proofFailure.Exception.Message
            restoreState = $restoreState
            restoreFailure = $restoreFailure
            recoveryPath = $recoveryPath
            stageRootPreserved = $preserveStageRoot
            countyOrProtectedDataUsed = $false
            deploymentOrProductionUsed = $false
        }
        $failureTemporaryPath = Join-Path $durableRunRoot (
            'runtime-adoption-failure.' + [Guid]::NewGuid().ToString('N') + '.tmp'
        )
        $failureReceipt | ConvertTo-Json -Depth 8 |
            Set-Content -LiteralPath $failureTemporaryPath -Encoding utf8
        Move-Item -LiteralPath $failureTemporaryPath -Destination (
            Join-Path $durableRunRoot 'runtime-adoption-failure.json'
        )
    }
    catch {
        $preserveStageRoot = $true
    }

    throw $proofFailure
}
finally {
    foreach ($name in $preservedEnvironment.Keys) {
        if ($preservedEnvironment[$name].Exists) {
            [Environment]::SetEnvironmentVariable(
                $name,
                $preservedEnvironment[$name].Value,
                'Process')
        }
        else {
            [Environment]::SetEnvironmentVariable($name, $null, 'Process')
        }
    }

    if (Test-Path -LiteralPath $testRoot) {
        Remove-Item -LiteralPath $testRoot -Recurse -Force
    }
    if (-not $preserveStageRoot -and (Test-Path -LiteralPath $stageRoot)) {
        Remove-Item -LiteralPath $stageRoot -Recurse -Force
    }
}

if ($null -ne $result) {
    $receiptTemporaryPath = Join-Path $durableRunRoot (
        'runtime-adoption-receipt.' + [Guid]::NewGuid().ToString('N') + '.tmp'
    )
    $result | ConvertTo-Json -Depth 8 |
        Set-Content -LiteralPath $receiptTemporaryPath -Encoding utf8
    Move-Item -LiteralPath $receiptTemporaryPath -Destination $receiptPath
    $result | ConvertTo-Json -Depth 8
}
