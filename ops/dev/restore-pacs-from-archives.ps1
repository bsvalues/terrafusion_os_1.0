<#
.SYNOPSIS
  TerraFusion: Restore PACS clone from data\benton archives into Docker SQL Server.
.DESCRIPTION
  Deterministic restore pipeline:
  1) Verifies Docker engine is reachable
  2) Extracts .rar/.zip/.7z archives using Docker (no local 7z needed)
  3) Finds the largest .bak (or reports .mdf/.ldf)
  4) Starts a fresh SQL Server 2022 container with persistent volumes
  5) Copies .bak into the container
  6) Runs RESTORE FILELISTONLY to discover logical file names
  7) Restores database as pacs_oltp
  8) Runs sanity query (SELECT 1 + database existence)

  SAFE: Does not touch existing containers unless -RemoveExistingContainer is set.
  SECURE: SA password must be provided via parameter. Never generated or echoed.

  Usage:
    pwsh -NoProfile -File ops/dev/restore-pacs-from-archives.ps1 `
      -SaPassword "YourStr0ng!Pass" `
      -RemoveExistingContainer -RemoveExistingVolumes
#>

param(
  [Parameter(Mandatory=$true)]
  [string]$SaPassword,
  [string]$RepoRoot = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)),
  [string]$DataDirRelative = "data\benton",
  [string]$ExtractDirName = "extracted",
  [string]$ContainerName = "tf-mssql",
  [string]$SqlImage = "mcr.microsoft.com/mssql/server:2022-latest",
  [string]$DbName = "pacs_oltp",
  [switch]$RemoveExistingContainer,
  [switch]$RemoveExistingVolumes
)

$ErrorActionPreference = "Stop"

function Fail([string]$msg) { Write-Error $msg; exit 1 }
function Info([string]$msg) { Write-Host $msg }

# --- Preconditions ---
try {
  $ver = docker version --format "{{.Server.Version}}" 2>&1
  if ($LASTEXITCODE -ne 0) { throw "exit $LASTEXITCODE" }
  Info "Docker Engine: $ver"
} catch {
  Fail "Docker engine not reachable. Start Docker Desktop and re-run."
}

$DataDir = Join-Path $RepoRoot $DataDirRelative
if (-not (Test-Path $DataDir)) { Fail "Data dir not found: $DataDir" }

$ExtractDir = Join-Path $DataDir $ExtractDirName
New-Item -ItemType Directory -Force -Path $ExtractDir | Out-Null

if ($SaPassword.Length -lt 8) {
  Fail "SA password must be at least 8 characters and meet SQL Server complexity requirements."
}

# --- Identify archives ---
$archives = Get-ChildItem $DataDir -File -Force |
  Where-Object { $_.Extension -in ".rar", ".zip", ".7z" -and $_.Length -gt 0 }
if (-not $archives) { Fail "No non-empty archives found in $DataDir." }

Info "`nArchives found:"
$archives | Sort-Object Length -Descending |
  Select-Object Name, @{N='GB';E={[math]::Round($_.Length/1GB,2)}}, LastWriteTime |
  Format-Table -AutoSize

# --- Extract using Docker (no local tools required) ---
Info "Extracting archives via Docker..."
Info "  Source: $DataDir"
Info "  Target: $ExtractDir"

foreach ($a in $archives) {
  Info "`n  Extracting: $($a.Name) ($([math]::Round($a.Length/1GB,2)) GB)"

  # Use unrar for .rar (handles RAR5 modern compression), 7z for .zip/.7z
  # Single-line bash to avoid Windows CRLF breaking Linux shell
  if ($a.Extension -eq ".rar") {
    $bashCmd = "apt-get update -qq >/dev/null 2>&1 && apt-get install -qq -y unrar >/dev/null 2>&1 && unrar x -o+ '/data/$($a.Name)' /extract/"
  } else {
    $bashCmd = "apt-get update -qq >/dev/null 2>&1 && apt-get install -qq -y p7zip-full >/dev/null 2>&1 && 7z x '/data/$($a.Name)' -o/extract -y"
  }
  docker run --rm -v "${DataDir}:/data:ro" -v "${ExtractDir}:/extract" ubuntu:22.04 bash -c $bashCmd 2>&1 | ForEach-Object { Info "    $_" }

  if ($LASTEXITCODE -ne 0) {
    Fail "Extraction failed for $($a.Name) (exit code $LASTEXITCODE)."
  }
}

# --- Find .bak ---
Info "`nSearching for backup artifacts..."
$bakFiles = Get-ChildItem $ExtractDir -Recurse -Force -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -eq ".bak" }
$mdfFiles = Get-ChildItem $ExtractDir -Recurse -Force -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -in ".mdf", ".ndf" }
$ldfFiles = Get-ChildItem $ExtractDir -Recurse -Force -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension -eq ".ldf" }

$bak = $null
if ($bakFiles) {
  $bak = $bakFiles | Sort-Object Length -Descending | Select-Object -First 1
  Info "Selected .bak: $($bak.Name) ($([math]::Round($bak.Length/1GB,2)) GB)"
} elseif ($mdfFiles -and $ldfFiles) {
  Info "Found MDF/LDF files (no .bak):"
  $mdfFiles | ForEach-Object { Info "  MDF: $($_.FullName) ($([math]::Round($_.Length/1GB,2)) GB)" }
  $ldfFiles | ForEach-Object { Info "  LDF: $($_.FullName) ($([math]::Round($_.Length/1GB,2)) GB)" }
  Fail "Attach-from-MDF not supported by this script. Export a .bak and re-run."
} else {
  Info "`nExtracted contents:"
  Get-ChildItem $ExtractDir -Recurse -Force -File |
    Select-Object FullName, @{N='MB';E={[math]::Round($_.Length/1MB,1)}} |
    Format-Table -AutoSize
  Fail "No .bak, .mdf, or .ldf found after extraction."
}

# --- Container/Volume lifecycle ---
$volData = "tf_mssql_data_pacs"

$existing = docker ps -a --format "{{.Names}}" 2>$null | Select-String -SimpleMatch $ContainerName
if ($existing) {
  if ($RemoveExistingContainer) {
    Info "`nRemoving existing container: $ContainerName"
    docker rm -f $ContainerName 2>$null | Out-Null
  } else {
    Fail "Container '$ContainerName' already exists. Re-run with -RemoveExistingContainer to replace it."
  }
}

if ($RemoveExistingVolumes) {
  Info "Removing existing volumes: $volData"
  docker volume rm $volData 2>$null | Out-Null
}

docker volume create $volData 2>$null | Out-Null

# --- Start SQL Server (mount extract dir as /backup read-only — no docker cp needed) ---
Info "`nStarting SQL Server container: $ContainerName"
docker run -d --name $ContainerName `
  -e "ACCEPT_EULA=Y" `
  -e "MSSQL_PID=Developer" `
  -e "MSSQL_SA_PASSWORD=$SaPassword" `
  -p "1433:1433" `
  -v "${volData}:/var/opt/mssql" `
  -v "${ExtractDir}:/backup:ro" `
  $SqlImage 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) { Fail "Failed to start SQL Server container." }

# Wait for SQL Server to accept connections
Info "Waiting for SQL Server to accept connections..."
$sqlcmd = "/opt/mssql-tools18/bin/sqlcmd"
$ready = $false
for ($i = 1; $i -le 30; $i++) {
  Start-Sleep -Seconds 3
  $probe = docker exec $ContainerName $sqlcmd -S localhost -U sa -P $SaPassword -C -Q "SELECT 1" 2>$null
  if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  Info "  Attempt $i/30..."
}
if (-not $ready) {
  Info "`n--- Container Logs (last 50 lines) ---"
  docker logs $ContainerName --tail 50
  Fail "SQL Server did not accept connections within 90 seconds."
}
Info "SQL Server is ready."

# --- RESTORE FILELISTONLY (backup mounted at /backup/) ---
$bakPath = "/backup/$($bak.Name)"
Info "`nReading logical file names (RESTORE FILELISTONLY)..."
$filelist = docker exec $ContainerName $sqlcmd -S localhost -U sa -P $SaPassword -C -Q "SET NOCOUNT ON; RESTORE FILELISTONLY FROM DISK = N'$bakPath';" 2>&1
if ($LASTEXITCODE -ne 0) {
  Info ($filelist | Out-String)
  Fail "RESTORE FILELISTONLY failed."
}

# Parse logical names from tabular output
$lines = $filelist -split "`n" | Where-Object { $_.Trim().Length -gt 0 }
$mdfRow = $lines | Where-Object { $_ -match "\.mdf" } | Select-Object -First 1
$ldfRow = $lines | Where-Object { $_ -match "\.ldf" } | Select-Object -First 1

if (-not $mdfRow -or -not $ldfRow) {
  Info "`n--- FILELISTONLY raw output ---"
  Info ($filelist | Out-String)
  Fail "Could not parse logical file names. See raw output above."
}

$logicalData = ($mdfRow.Trim() -split "\s+")[0]
$logicalLog  = ($ldfRow.Trim() -split "\s+")[0]
Info "  Logical data: $logicalData"
Info "  Logical log:  $logicalLog"

# --- RESTORE DATABASE ---
$dataTarget = "/var/opt/mssql/${DbName}.mdf"
$logTarget  = "/var/opt/mssql/${DbName}_log.ldf"

Info "`nRestoring database '$DbName'..."
$restore = docker exec $ContainerName $sqlcmd -S localhost -U sa -P $SaPassword -C -Q "
RESTORE DATABASE [$DbName]
FROM DISK = N'$bakPath'
WITH MOVE N'$logicalData' TO N'$dataTarget',
     MOVE N'$logicalLog'  TO N'$logTarget',
     RECOVERY, REPLACE;" 2>&1

if ($LASTEXITCODE -ne 0) {
  Info ($restore | Out-String)
  Fail "RESTORE DATABASE failed."
}
Info "Restore completed."

# --- Sanity check ---
Info "`nSanity check..."
$check = docker exec $ContainerName $sqlcmd -S localhost -U sa -P $SaPassword -C -Q "SET NOCOUNT ON; SELECT name FROM sys.databases WHERE name = '$DbName'; SELECT 1 AS ok;" 2>&1
if ($LASTEXITCODE -ne 0 -or $check -notmatch $DbName) {
  Info ($check | Out-String)
  Fail "Sanity check failed."
}

Info "`n============================================================"
Info "SUCCESS: $DbName restored and verified."
Info "============================================================"
Info ""
Info "Connection string for TerraFusion (PacsSqlAdapter reads ConnectionStrings:PacsConnection):"
Info "  Server=localhost,1433;Database=$DbName;User Id=sa;Password=<secret>;TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS;"
Info ""
Info "Set via environment variable:"
Info '  $env:ConnectionStrings__PacsConnection = "Server=localhost,1433;Database=pacs_oltp;User Id=sa;Password=<secret>;TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS;"'
