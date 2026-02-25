<#
.SYNOPSIS
  Restore PACS from data\benton archives into a local SQL Server container.
.DESCRIPTION
  Assumptions:
  - You have a PACS backup archive (RAR/ZIP) under data\benton
  - You can extract it (7z recommended)
  - You want SQL Server running in Docker with a persisted volume

  This script:
  1) Verifies docker
  2) Creates volumes
  3) Starts SQL Server container
  4) Gives you exact commands to copy in .bak and RESTORE

  It does NOT perform RESTORE automatically because RESTORE requires
  knowing logical file names. We keep it safe and deterministic.

  SECURITY: SA password is read from environment variable TF_MSSQL_SA_PASSWORD.
  If not set, the script prompts interactively. Secrets are never echoed or logged.
#>

$ErrorActionPreference = "Stop"

function Assert-DockerUp {
  $ver = docker version --format "{{.Server.Version}}" 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Docker engine not reachable. Ensure Docker Desktop engine is started."
  }
  Write-Host "Docker Engine: $ver"
}

function Require-Tool($name, $hint) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if (-not $cmd) { throw "Missing tool: $name. $hint" }
}

Assert-DockerUp

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$dataDir  = Join-Path $repoRoot "data\benton"

if (-not (Test-Path $dataDir)) { throw "Not found: $dataDir" }

Write-Host "Looking for PACS archives in: $dataDir"
$archives = Get-ChildItem $dataDir -File -Force | Where-Object { $_.Extension -in ".rar", ".zip", ".7z" -and $_.Length -gt 0 }

if (-not $archives) {
  throw "No non-empty archives (.rar/.zip/.7z) found in $dataDir"
}

$archives | Sort-Object Length -Descending | Select-Object Name, @{N="SizeGB";E={[math]::Round($_.Length/1GB,2)}}, LastWriteTime | Format-Table -AutoSize

Write-Host "Pick the archive that contains the SQL Server backup (.bak) or data files (.mdf/.ldf)."
$extractDir = Join-Path $dataDir "extracted"
Write-Host "Recommended extraction target: $extractDir"
Write-Host ""

# Check for extraction tools
$sevenZip = Get-Command "7z" -ErrorAction SilentlyContinue
if (-not $sevenZip) {
  Write-Host "[WARN] 7z not found. Install 7-Zip and ensure '7z' is in PATH to extract .rar archives."
  Write-Host "  Download: https://www.7-zip.org/"
  Write-Host "  After install, add to PATH: C:\Program Files\7-Zip"
} else {
  New-Item -ItemType Directory -Force -Path $extractDir | Out-Null
  Write-Host "Example extraction command (choose which archive):"
  foreach ($a in $archives) {
    Write-Host "  7z x `"$($a.FullName)`" -o`"$extractDir`" -y"
  }
}

Write-Host ""

# SA password: read from env or prompt (never generate weak passwords, never echo)
$saPassword = $env:TF_MSSQL_SA_PASSWORD
if (-not $saPassword) {
  Write-Host "Set TF_MSSQL_SA_PASSWORD environment variable with your SQL Server SA password."
  Write-Host "Requirements: 8+ chars, uppercase, lowercase, digit, special char."
  Write-Host ""
  Write-Host 'Example:  $env:TF_MSSQL_SA_PASSWORD = "YourStr0ng!Pass"'
  Write-Host "Then re-run this script."
  Write-Host ""
  $securePass = Read-Host -Prompt "Or enter SA password now (will not be stored)" -AsSecureString
  $saPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
  )
  if ($saPassword.Length -lt 8) { throw "SA password must be at least 8 characters." }
}

# Create volumes for SQL Server
$volData = "tf_mssql_data"
$volBak  = "tf_mssql_backup"

docker volume create $volData 2>$null | Out-Null
docker volume create $volBak  2>$null | Out-Null
Write-Host "Volumes ready: $volData, $volBak"

$containerName = "tf-mssql"
$existing = docker ps -a --format "{{.Names}}" | Select-String -SimpleMatch $containerName
if ($existing) {
  Write-Host "Container '$containerName' already exists. Skipping creation."
  Write-Host "To recreate: docker rm -f $containerName"
} else {
  docker run -d --name $containerName `
    -e "ACCEPT_EULA=Y" `
    -e "MSSQL_SA_PASSWORD=$saPassword" `
    -p "1433:1433" `
    -v "${volData}:/var/opt/mssql" `
    -v "${volBak}:/var/opt/mssql/backup" `
    "mcr.microsoft.com/mssql/server:2022-latest" | Out-Null
  Write-Host "Started: $containerName (SQL Server 2022)"
}

Write-Host ""
Write-Host "============================================================"
Write-Host "NEXT STEPS"
Write-Host "============================================================"
Write-Host ""
Write-Host "1) Extract archive (if not done):"
if ($sevenZip) {
  Write-Host "   7z x `"$($archives[0].FullName)`" -o`"$extractDir`" -y"
} else {
  Write-Host "   Install 7-Zip, then: 7z x <archive> -o`"$extractDir`" -y"
}
Write-Host ""
Write-Host "2) Copy .bak into container:"
Write-Host "   docker cp `"$extractDir\YOUR_BACKUP.bak`" ${containerName}:/var/opt/mssql/backup/"
Write-Host ""
Write-Host "3) Discover logical file names (required for RESTORE):"
Write-Host "   docker exec -it $containerName /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P `"`$env:TF_MSSQL_SA_PASSWORD`" -C -Q `"RESTORE FILELISTONLY FROM DISK = N'/var/opt/mssql/backup/YOUR_BACKUP.bak'`""
Write-Host ""
Write-Host "4) Restore (template -- replace logical names from step 3):"
Write-Host "   docker exec -it $containerName /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P `"`$env:TF_MSSQL_SA_PASSWORD`" -C -Q `""
Write-Host "     RESTORE DATABASE pacs_oltp"
Write-Host "     FROM DISK = N'/var/opt/mssql/backup/YOUR_BACKUP.bak'"
Write-Host "     WITH MOVE N'<LogicalDataName>' TO N'/var/opt/mssql/pacs_oltp.mdf',"
Write-Host "          MOVE N'<LogicalLogName>'  TO N'/var/opt/mssql/pacs_oltp_log.ldf',"
Write-Host "          RECOVERY, REPLACE`""
Write-Host ""
Write-Host "5) Wire TerraFusion adapter:"
Write-Host "   Set connection string: Server=localhost,1433;Database=pacs_oltp;User Id=sa;Password=<secret>;TrustServerCertificate=True"
Write-Host "   Update appsettings.Development.json or set env var PACS__ConnectionString"
