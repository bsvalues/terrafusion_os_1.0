[CmdletBinding()]
param(
    [string]$AtlasRepository = 'C:\Users\bsval\.codex-reference\terrafusion-atlas-sr007b-lf',
    [string]$BuildRootBase = 'E:\tf-build\sr-007b-unwired-process-host',
    [string]$NuGetPackagesPath,
    [string]$NuGetSourcePath
)

$ErrorActionPreference = 'Stop'
$expectedSovereignBase = 'e4157f69a692a830caea96644cf07e6b85f28271'
$expectedAtlasCommit = '6c530f1b6b77d59225353dede929c0688f1587da'
$moduleRelativePath = 'src/spatial-read/project-atlas-feature.mjs'
$expectedModuleSha256 = '3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46'
$sovereignRepository = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runId = [DateTimeOffset]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + [Guid]::NewGuid().ToString('N')
$buildRoot = Join-Path $BuildRootBase $runId
$artifacts = Join-Path $buildRoot 'artifacts'
$dotnetHome = Join-Path $buildRoot 'dotnet-home'
$nugetHttp = Join-Path $buildRoot 'nuget-http'
$temp = Join-Path $buildRoot 'tmp'
$result = $null
$preservedEnvironment = @{}
$authorizedSovereignPaths = @(
    '.governance/owner-decisions.json',
    'backend/src/TerraFusion.API/Services/Atlas/AtlasProjectionProcessHost.cs',
    'backend/src/TerraFusion.API/Services/Atlas/IAtlasProjectionProcessHost.cs',
    'backend/tests/TerraFusion.Unit.Tests/Atlas/AtlasProjectionProcessHostTests.cs',
    'docs/brain/workorders/PROGRAM_PLAYBOOK_REGISTER.md',
    'docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md',
    'docs/brain/workorders/active/WO-SR-007B-atlas-unwired-projection-process-host-foundation.md',
    'docs/brain/workorders/evidence/WO-SR-007B-ATLAS-UNWIRED-PROJECTION-PROCESS-HOST-FOUNDATION.md',
    'docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md',
    'docs/brain/workorders/goal-loop/GOAL_COMMANDS.md',
    'docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md',
    'docs/brain/workorders/programs/five-suite-federated-repository-buildout.md',
    'docs/brain/workorders/registry/work-order-registry.seed.json',
    'scripts/validation/Invoke-AtlasUnwiredProjectionProcessHostProof.ps1'
)

foreach ($name in @(
        'DOTNET_CLI_HOME',
        'DOTNET_CLI_TELEMETRY_OPTOUT',
        'DOTNET_NOLOGO',
        'DOTNET_SKIP_FIRST_TIME_EXPERIENCE',
        'DOTNET_CLI_USE_MSBUILD_SERVER',
        'NUGET_PACKAGES',
        'NUGET_HTTP_CACHE_PATH',
        'TEMP',
        'TMP',
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

function Get-NodeExecutable {
    $path = @(& node -p 'process.execPath') | Select-Object -First 1
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($path)) {
        throw 'Unable to resolve the real Node executable through process.execPath.'
    }

    $resolved = [IO.Path]::GetFullPath($path.Trim())
    if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
        throw "Resolved Node executable is unavailable: $resolved"
    }
    return $resolved
}

function Get-LocalNuGetPackages {
    $entry = @(& dotnet nuget locals global-packages --list) |
        Where-Object { $_ -match '^\s*global-packages:\s*(.+?)\s*$' } |
        Select-Object -First 1
    if ($LASTEXITCODE -ne 0 -or $null -eq $entry) {
        throw 'Unable to resolve the local NuGet package cache.'
    }

    $path = ([regex]::Match($entry, '^\s*global-packages:\s*(.+?)\s*$')).Groups[1].Value
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Local NuGet package cache is unavailable: $path"
    }

    return [IO.Path]::GetFullPath($path)
}

function Assert-LocalFixedDirectory {
    param(
        [Parameter(Mandatory)]
        [string]$Path,
        [Parameter(Mandatory)]
        [string]$Purpose
    )

    $resolved = [IO.Path]::GetFullPath($Path)
    if (-not (Test-Path -LiteralPath $resolved -PathType Container)) {
        throw "$Purpose directory is unavailable: $resolved"
    }
    if ($resolved.StartsWith('\\', [StringComparison]::Ordinal)) {
        throw "$Purpose must not use a UNC path: $resolved"
    }

    $root = [IO.Path]::GetPathRoot($resolved)
    $drive = [IO.DriveInfo]::new($root)
    if ($drive.DriveType -ne [IO.DriveType]::Fixed) {
        throw "$Purpose must use a local fixed drive: $resolved ($($drive.DriveType))"
    }

    return $resolved
}

function Get-SovereignChangedPaths {
    $entries = @(git -C $sovereignRepository status --porcelain=v1 --untracked-files=all)
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to inspect sovereign worktree status.'
    }

    return @($entries | ForEach-Object {
            $path = $_.Substring(3).Replace('\\', '/')
            if ($path.Contains(' -> ')) {
                $path = $path.Split(' -> ')[-1]
            }
            $path
        } | Sort-Object -Unique)
}

function Assert-AuthorizedSovereignPaths {
    param(
        [Parameter(Mandatory)]
        [string[]]$Paths
    )

    $unauthorized = @($Paths | Where-Object { $_ -notin $authorizedSovereignPaths })
    if ($unauthorized.Count -gt 0) {
        throw "Unauthorized sovereign paths changed: $($unauthorized -join '; ')"
    }
}

try {
    $sovereignHead = (git -C $sovereignRepository rev-parse HEAD).Trim()
    Invoke-Checked -Command git -Arguments @(
        '-C',
        $sovereignRepository,
        'merge-base',
        '--is-ancestor',
        $expectedSovereignBase,
        $sovereignHead
    )
    $sovereignChangesBefore = @(Get-SovereignChangedPaths)
    Assert-AuthorizedSovereignPaths -Paths $sovereignChangesBefore

    $atlasRoot = (git -C $AtlasRepository rev-parse --show-toplevel).Trim()
    if ([IO.Path]::GetFullPath($atlasRoot) -ne [IO.Path]::GetFullPath($AtlasRepository)) {
        throw 'AtlasRepository does not identify the disposable LF checkout root.'
    }
    $atlasHead = (git -C $AtlasRepository rev-parse HEAD).Trim()
    if ($atlasHead -ne $expectedAtlasCommit) {
        throw "Atlas HEAD mismatch: $atlasHead"
    }
    $atlasStatus = @(git -C $AtlasRepository status --short)
    if ($atlasStatus.Count -gt 0) {
        throw 'Disposable Atlas checkout is not clean.'
    }
    $autocrlf = (git -C $AtlasRepository config --get core.autocrlf).Trim()
    $coreEol = (git -C $AtlasRepository config --get core.eol).Trim()
    if ($autocrlf -ne 'false' -or $coreEol -ne 'lf') {
        throw "Atlas checkout must use core.autocrlf=false and core.eol=lf; found $autocrlf/$coreEol."
    }

    $modulePath = [IO.Path]::GetFullPath((Join-Path $AtlasRepository $moduleRelativePath))
    $moduleSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $modulePath).Hash.ToLowerInvariant()
    if ($moduleSha256 -ne $expectedModuleSha256) {
        throw "Atlas module hash mismatch: $moduleSha256"
    }

    if (Test-Path -LiteralPath $buildRoot) {
        throw "Invocation-owned build root already exists: $buildRoot"
    }
    New-Item -ItemType Directory -Force -Path $artifacts, $dotnetHome, $nugetHttp, $temp | Out-Null

    $discoveredNuGetPackages = Get-LocalNuGetPackages
    $localNuGetPackages = if ([string]::IsNullOrWhiteSpace($NuGetPackagesPath)) {
        $discoveredNuGetPackages
    }
    else {
        $NuGetPackagesPath
    }
    $localNuGetSource = if ([string]::IsNullOrWhiteSpace($NuGetSourcePath)) {
        $discoveredNuGetPackages
    }
    else {
        $NuGetSourcePath
    }
    $localNuGetPackages = Assert-LocalFixedDirectory -Path $localNuGetPackages -Purpose 'NuGet package cache'
    $localNuGetSource = Assert-LocalFixedDirectory -Path $localNuGetSource -Purpose 'Offline NuGet source'

    $env:DOTNET_CLI_HOME = $dotnetHome
    $env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
    $env:DOTNET_NOLOGO = '1'
    $env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = '1'
    $env:DOTNET_CLI_USE_MSBUILD_SERVER = '0'
    $env:NUGET_PACKAGES = $localNuGetPackages
    $env:NUGET_HTTP_CACHE_PATH = $nugetHttp
    $env:TEMP = $temp
    $env:TMP = $temp
    $env:TERRAFUSION_ATLAS_HOST_MODULE_PATH = $modulePath
    $env:TERRAFUSION_ATLAS_NODE_PATH = Get-NodeExecutable

    $backendSolution = Join-Path $sovereignRepository 'backend\TerraFusion.sln'
    $testProject = Join-Path $sovereignRepository 'backend\tests\TerraFusion.Unit.Tests\TerraFusion.Unit.Tests.csproj'
    Invoke-Checked -Command dotnet -Arguments @(
        'restore',
        $backendSolution,
        '--source',
        $localNuGetSource,
        '--packages',
        $localNuGetPackages,
        '--artifacts-path',
        $artifacts,
        '--no-cache',
        '--disable-parallel',
        '/m:1'
    )
    Invoke-Checked -Command dotnet -Arguments @(
        'build',
        $backendSolution,
        '-c',
        'Release',
        '--no-restore',
        '--artifacts-path',
        $artifacts,
        '/warnaserror',
        '-p:UseSharedCompilation=false',
        '-nodeReuse:false',
        '/m:1'
    )
    Invoke-Checked -Command dotnet -Arguments @(
        'restore',
        $testProject,
        '--source',
        $localNuGetSource,
        '--packages',
        $localNuGetPackages,
        '--artifacts-path',
        $artifacts,
        '--no-cache',
        '--disable-parallel',
        '/m:1'
    )
    Invoke-Checked -Command dotnet -Arguments @(
        'build',
        $testProject,
        '-c',
        'Release',
        '--no-restore',
        '--artifacts-path',
        $artifacts,
        '/warnaserror',
        '-p:UseSharedCompilation=false',
        '-nodeReuse:false',
        '/m:1'
    )
    Invoke-Checked -Command dotnet -Arguments @(
        'test',
        $testProject,
        '-c',
        'Release',
        '--no-restore',
        '--no-build',
        '--artifacts-path',
        $artifacts,
        '--filter',
        'FullyQualifiedName~AtlasProjectionProcessHostTests'
    )

    $atlasStatusAfter = @(git -C $AtlasRepository status --short)
    if ($atlasStatusAfter.Count -gt 0) {
        throw 'Disposable Atlas checkout changed during proof.'
    }
    $sovereignChangesAfter = @(Get-SovereignChangedPaths)
    Assert-AuthorizedSovereignPaths -Paths $sovereignChangesAfter
    if ((Compare-Object $sovereignChangesBefore $sovereignChangesAfter).Count -gt 0) {
        throw 'Sovereign worktree changed during restore/build/test proof.'
    }

    $result = [ordered]@{
        result = 'PASS'
        sovereignHead = $sovereignHead
        atlasCommit = $atlasHead
        atlasModule = $moduleRelativePath
        atlasModuleSha256 = $moduleSha256
        atlasCoreAutocrlf = $autocrlf
        atlasCoreEol = $coreEol
        atlasCheckoutClean = $true
        nodeExecutable = $env:TERRAFUSION_ATLAS_NODE_PATH
        backendSolutionBuild = 'PASS - 0 warnings, 0 errors'
        focusedTests = 'PASS'
        runtimeConsumers = 0
        dependencyInjectionRegistrations = 0
        atlasRepositoryChanged = $false
        runtimeAdopted = $false
    }
}
finally {
    foreach ($name in $preservedEnvironment.Keys) {
        if ($preservedEnvironment[$name].Exists) {
            [Environment]::SetEnvironmentVariable($name, $preservedEnvironment[$name].Value, 'Process')
        }
        else {
            [Environment]::SetEnvironmentVariable($name, $null, 'Process')
        }
    }

    if (Test-Path -LiteralPath $buildRoot) {
        Remove-Item -LiteralPath $buildRoot -Recurse -Force
    }
}

if ($null -ne $result) {
    $result.disposableBuildStateRemoved = -not (Test-Path -LiteralPath $buildRoot)
    $result | ConvertTo-Json -Depth 6
}
