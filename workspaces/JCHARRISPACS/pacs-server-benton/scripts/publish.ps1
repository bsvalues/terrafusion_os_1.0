param(
    [string] $SqlServer = "localhost,1433",
    [string] $SaPassword = $env:SA_PASSWORD,
    [string] $BuildConfig = "Release"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-OrWarn($ScriptBlock) {
    try { & $ScriptBlock } catch { Write-Warning $_; throw }
}

function Find-Tool([string] $tool) {
    $p = (Get-Command $tool -ErrorAction SilentlyContinue).Source
    if (-not $p) { return $null }
    return $p
}

# Resolve root
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")

# Projects and targets
$projects = @(
    @{ Name = "DatabaseProjectpacs_oltp"; Path = "$repoRoot\DatabaseProjectpacs_oltp\DatabaseProjectpacs_oltp.sqlproj"; Db = "pacs_oltp" },
    @{ Name = "DatabaseProjectpacs_training"; Path = "$repoRoot\DatabaseProjectpacs_training\DatabaseProjectpacs_training.sqlproj"; Db = "PACS_Training" },
    @{ Name = "DatabaseProjectTAAppSvr"; Path = "$repoRoot\DatabaseProjectTAAppSvr\DatabaseProjectTAAppSvr.sqlproj"; Db = "TA_AppSvr" },
    @{ Name = "DatabaseProjectCIAPS"; Path = "$repoRoot\DatabaseProjectCIAPS\DatabaseProjectCIAPS.sqlproj"; Db = "CIAPS" },
    @{ Name = "DatabaseProjectweb_internet_benton"; Path = "$repoRoot\DatabaseProjectweb_internet_benton\DatabaseProjectweb_internet_benton.sqlproj"; Db = "Web_Internet_Benton" },
    @{ Name = "jcharrispacsSSISDB_project"; Path = "$repoRoot\jcharrispacsSSISDB_project\DatabaseProjectSSISDB\DatabaseProjectSSISDB.sqlproj"; Db = "SSISDB" }
)

# Tools
$dotnet = Find-Tool "dotnet"
if (-not $dotnet) { throw "dotnet SDK is required to build SQL projects (Microsoft.Build.Sql)." }

# Build and collect DACPACs
$artifacts = Join-Path $PSScriptRoot "..\artifacts"
New-Item -ItemType Directory -Force -Path $artifacts | Out-Null

foreach ($p in $projects) {
    Write-Host "Building $($p.Name)" -ForegroundColor Cyan
    & $dotnet build $p.Path -c $BuildConfig /nologo
    $dacpac = Get-ChildItem -Path (Split-Path $p.Path) -Recurse -Filter "*.dacpac" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $dacpac) { throw "No DACPAC produced for $($p.Name)." }
    Copy-Item $dacpac.FullName -Destination (Join-Path $artifacts ("$($p.Db).dacpac")) -Force
}

# SqlPackage
$sqlpackage = Find-Tool "SqlPackage"
if (-not $sqlpackage) { $sqlpackage = Find-Tool "SqlPackage.exe" }
if (-not $sqlpackage) { throw "SqlPackage not found on PATH. Install SQL Server Data-Tier Application Framework (DacFx)." }

function Publish-Dacpac([string] $db) {
    $dac = Join-Path $artifacts ("$db.dacpac")
    if (-not (Test-Path $dac)) { throw "DACPAC missing: $dac" }
    & $sqlpackage /Action:Publish /SourceFile:$dac /TargetServerName:$SqlServer /TargetDatabaseName:$db /TargetUser:sa /TargetPassword:$SaPassword /p:BlockOnPossibleDataLoss=false /p:CreateNewDatabase=false
}

# Publish in dependency order
Publish-Dacpac "pacs_oltp"
Publish-Dacpac "PACS_Training"
Publish-Dacpac "TA_AppSvr"
Publish-Dacpac "CIAPS"
Publish-Dacpac "Web_Internet_Benton"
Publish-Dacpac "SSISDB"

Write-Host "Publish complete." -ForegroundColor Green

