<#
.SYNOPSIS
  TerraFusion Docker PACS Doctor
.DESCRIPTION
  - Validates Docker engine connectivity
  - Lists containers/images/volumes
  - Searches volumes for SQL Server artifacts: .bak .mdf .ldf
  - Produces a short "likely PACS volume" report

  SAFE: Read-only. No deletes. No container stops.
  Requires: Docker CLI installed and engine reachable.
#>

$ErrorActionPreference = "Stop"

function Assert-DockerUp {
  try {
    $ver = docker version --format "{{.Server.Version}}" 2>&1
    if ($LASTEXITCODE -ne 0) { throw "exit $LASTEXITCODE" }
    Write-Host "Docker Engine: $ver"
  } catch {
    throw "Docker engine not reachable via CLI. Open Docker Desktop and ensure engine is started, then re-run. ($_)"
  }
}

function Write-Section($title) {
  Write-Host ""
  Write-Host "============================================================"
  Write-Host $title
  Write-Host "============================================================"
}

Assert-DockerUp

Write-Section "DOCKER INFO (summary)"
docker info --format @"
Server={{.ServerVersion}}
Driver={{.Driver}}
RootDir={{.DockerRootDir}}
Images={{.Images}}
Containers={{.Containers}}
"@

Write-Section "CONTAINERS (all)"
docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

Write-Section "IMAGES (top hits for sqlserver/pacs)"
$allImages = docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
$allImages | Select-String -Pattern "REPOSITORY|mssql|sqlserver|pacs|harris|postgres|postgis" -CaseSensitive:$false

Write-Section "ALL IMAGES"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

Write-Section "VOLUMES"
$volumes = @(docker volume ls --format "{{.Name}}" 2>&1)
if (-not $volumes -or $volumes.Count -eq 0) {
  Write-Host "No volumes found."
  Write-Section "SUMMARY"
  Write-Host "No Docker volumes exist. PACS clone is NOT in Docker."
  Write-Host "Next: restore from archives under data\benton (see restore-pacs-from-archives.ps1)."
  exit 0
}

Write-Host "VolumeCount=$($volumes.Count)"
$volumes | ForEach-Object { Write-Host "  $_" }

Write-Section "SYSTEM DF (volumes size hints)"
docker system df -v

Write-Section "VOLUME CONTENT SCAN (bak/mdf/ldf)"
# Scan each volume by mounting it read-only into a tiny Alpine container and running find.
# Read-only, safe, no mutations.
$results = New-Object System.Collections.Generic.List[object]

foreach ($v in $volumes) {
  Write-Host ""
  Write-Host "Scanning volume: $v"
  $findCmd = "find /v -maxdepth 6 -type f \( -iname '*.bak' -o -iname '*.mdf' -o -iname '*.ldf' -o -iname '*.ndf' \) 2>/dev/null | head -n 200"

  $out = docker run --rm -v "${v}:/v:ro" alpine:3.20 sh -c $findCmd 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  (scan failed or empty)"
    continue
  }
  if ($out) {
    foreach ($line in $out -split "`n") {
      $trimmed = $line.Trim()
      if ($trimmed.Length -gt 0) {
        $results.Add([pscustomobject]@{
          Volume = $v
          Path   = $trimmed
        })
      }
    }
  } else {
    Write-Host "  (no SQL artifacts)"
  }
}

Write-Section "RESULTS (likely PACS artifacts)"
if ($results.Count -eq 0) {
  Write-Host "No .bak/.mdf/.ldf found in Docker volumes."
  Write-Host ""
  Write-Host "This strongly suggests the PACS clone is NOT currently restored inside Docker volumes."
  Write-Host "Next: restore from archives under data\benton (see restore-pacs-from-archives.ps1)."
  exit 0
}

$results | Sort-Object Volume, Path | Format-Table -AutoSize

Write-Section "NEXT STEP (what to do with a hit)"
Write-Host @"
If you see a .bak/.mdf/.ldf path above:
1) Identify the volume name (Volume column)
2) We can mount that same volume into a SQL Server container or copy the .bak out.
3) Tell me the volume name + file path that looks like pacs_oltp,
   and I'll generate the exact restore commands.
"@
