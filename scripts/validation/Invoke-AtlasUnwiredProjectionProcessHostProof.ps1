[CmdletBinding()]
param(
    [string]$AtlasRepository = 'C:\Users\bsval\.codex-reference\terrafusion-atlas-sr007b-lf',
    [string]$BuildRootBase = 'E:\tf-build\sr-007b-unwired-process-host',
    [string]$NuGetPackagesPath
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
    $command = Get-Command node.exe -ErrorAction Stop
    return [IO.Path]::GetFullPath($command.Source)
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

    $localNuGetPackages = Get-LocalNuGetPackages
    if (-not [string]::IsNullOrWhiteSpace($NuGetPackagesPath)) {
        $localNuGetPackages = [IO.Path]::GetFullPath($NuGetPackagesPath)
    }

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

    $testProject = Join-Path $sovereignRepository 'backend\tests\TerraFusion.Unit.Tests\TerraFusion.Unit.Tests.csproj'
    Invoke-Checked -Command dotnet -Arguments @(
        'restore',
        $testProject,
        '--source',
        $localNuGetPackages,
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
    $changedPaths = @(git -C $sovereignRepository status --short --untracked-files=all)
    $unauthorized = @($changedPaths | Where-Object {
            $_ -notmatch 'backend/src/TerraFusion.API/Services/Atlas/(IAtlasProjectionProcessHost|AtlasProjectionProcessHost)\.cs$' -and
            $_ -notmatch 'backend/tests/TerraFusion.Unit.Tests/Atlas/AtlasProjectionProcessHostTests\.cs$' -and
            $_ -notmatch 'scripts/validation/Invoke-AtlasUnwiredProjectionProcessHostProof\.ps1$' -and
            $_ -notmatch 'docs/brain/workorders/' -and
            $_ -notmatch '\.governance/owner-decisions\.json$'
        })
    if ($unauthorized.Count -gt 0) {
        throw "Unauthorized sovereign paths changed: $($unauthorized -join '; ')"
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
        backendBuild = 'PASS - 0 warnings, 0 errors'
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
