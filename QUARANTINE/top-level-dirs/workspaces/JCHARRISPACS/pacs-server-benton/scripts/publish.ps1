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
    # PACS_Training mirrors pacs_oltp schema — deploy from same DACPAC to avoid
    # build errors in pacs_training project (domain users in inline GRANT statements).
    # After build, the pacs_oltp DACPAC is also copied to PACS_Training.dacpac.
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
    $msbuildArgs = @(
        $p.Path,
        '-c', $BuildConfig,
        '/nologo',
        '/p:TreatTSqlWarningsAsErrors=false',
        '/p:SuppressMissingDependenciesErrors=true'
    )
    & $dotnet build @msbuildArgs
    $dacpac = Get-ChildItem -Path (Split-Path $p.Path) -Recurse -Filter "*.dacpac" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $dacpac) { throw "No DACPAC produced for $($p.Name)." }
    Copy-Item $dacpac.FullName -Destination (Join-Path $artifacts ("$($p.Db).dacpac")) -Force
    # PACS_Training uses the same schema as pacs_oltp — mirror the dacpac
    if ($p.Db -eq "pacs_oltp") {
        Copy-Item $dacpac.FullName -Destination (Join-Path $artifacts "PACS_Training.dacpac") -Force
        Write-Host "  [pacs_oltp dacpac also copied as PACS_Training.dacpac]" -ForegroundColor DarkGray
    }
}

# SqlPackage
$sqlpackage = Find-Tool "SqlPackage"
if (-not $sqlpackage) { $sqlpackage = Find-Tool "SqlPackage.exe" }
if (-not $sqlpackage) { throw "SqlPackage not found on PATH. Install SQL Server Data-Tier Application Framework (DacFx)." }

function Publish-Dacpac([string] $db) {
    $dac = Join-Path $artifacts ("$db.dacpac")
    if (-not (Test-Path $dac)) { throw "DACPAC missing: $dac" }
    & $sqlpackage /Action:Publish /SourceFile:$dac /TargetServerName:$SqlServer /TargetDatabaseName:$db /TargetUser:sa /TargetPassword:$SaPassword /p:BlockOnPossibleDataLoss=false /p:CreateNewDatabase=false /TargetTrustServerCertificate:true
}

# Publish in dependency order
Publish-Dacpac "pacs_oltp"
Publish-Dacpac "PACS_Training"
Publish-Dacpac "TA_AppSvr"
Publish-Dacpac "CIAPS"

# CIAPS post-deploy: synonyms reference pacs_oltp and cannot be in the DACPAC model.
# Run after CIAPS DACPAC so cross-DB synonyms exist for downstream databases.
$postCiaps = Join-Path $PSScriptRoot "..\..\scripts\sql\post_ciaps_deploy.sql"
if (Test-Path $postCiaps) {
    Write-Host "Running CIAPS post-deploy (synonyms)..." -ForegroundColor Cyan
    $sqlcmdPath = "sqlcmd"
    Get-Content $postCiaps | & $sqlcmdPath -S $SqlServer -U sa -P $SaPassword -C -d CIAPS
} else {
    Write-Warning "CIAPS post-deploy script not found: $postCiaps"
}

Publish-Dacpac "Web_Internet_Benton"
Publish-Dacpac "SSISDB"

Write-Host "Publish complete." -ForegroundColor Green

