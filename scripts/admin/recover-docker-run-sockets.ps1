#requires -Version 5.1
<#
.SYNOPSIS
  Recover Docker Desktop from the recurring post-shutdown/resume AF_UNIX
  stale-socket wedge, then (optionally) relaunch it.

.DESCRIPTION
  Known operational failure mode (observed 2026-05-28 and 2026-06-03):
  after a laptop shutdown/resume — especially when Docker's WSL data disk
  lives on an external/relocated drive — Docker Desktop's Linux engine
  fails to start with:

    starting services: initializing Inference manager: listening on
    unix://<HOME>\AppData\Local\Docker\run\dockerInference: remove ...:
    The file cannot be accessed by the system.
    (listener: The filename, directory name, or volume label syntax is
    incorrect.)

  (The Secrets Engine socket at <HOME>\AppData\Local\docker-secrets-engine\
  engine.sock can wedge the same way.) The engine tries to bind/replace an
  orphaned AF_UNIX socket reparse-point and cannot. Process restarts alone
  do NOT clear it; the proven fix is to QUARANTINE (rename) the wedged
  socket directories so Docker recreates clean ones on next launch.

  This script does the minimum, safe, proven recovery:
    1. Stop Docker Desktop + backend processes.
    2. wsl --shutdown (releases handles on the engine VHDX / sockets).
    3. Rename (NOT delete) the wedged run + secrets-engine dirs to
       *.bad-<timestamp> so Docker recreates them. Renaming avoids the
       "cannot delete wedged reparse point" problem and preserves the old
       dirs for forensics.
    4. Optionally relaunch Docker Desktop (-Launch).

  SAFE: never deletes data, never touches the WSL data disk / its junction,
  never touches container volumes. Only the ephemeral per-run socket dirs
  are renamed. If Docker is healthy, the script detects that and exits
  without action unless -Force is given.

.PARAMETER Launch
  After cleanup, start Docker Desktop and wait for the engine to respond.

.PARAMETER Force
  Run the cleanup even if Docker currently looks healthy.

.EXAMPLE
  pwsh scripts/dev/recover-docker-run-sockets.ps1 -Launch
#>
[CmdletBinding()]
param(
    [switch]$Launch,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$run     = Join-Path $env:LOCALAPPDATA 'Docker\run'
$secrets = Join-Path $env:LOCALAPPDATA 'docker-secrets-engine'
$dockerDesktop = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

function Test-DockerHealthy {
    try {
        $v = & docker version --format '{{.Server.Version}}' 2>$null
        return -not [string]::IsNullOrWhiteSpace($v)
    } catch { return $false }
}

Write-Host "== recover-docker-run-sockets =="

if (-not $Force -and (Test-DockerHealthy)) {
    Write-Host "Docker engine already healthy; nothing to do (use -Force to clean anyway)."
    return
}

Write-Host "1/4 Stopping Docker Desktop + backend processes..."
Get-Process 'Docker Desktop','com.docker.backend','com.docker.build' -ErrorAction SilentlyContinue |
    Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 4

Write-Host "2/4 wsl --shutdown (release engine/socket handles)..."
& wsl.exe --shutdown 2>&1 | Out-Null
Start-Sleep -Seconds 4

Write-Host "3/4 Quarantining wedged socket dirs (rename, not delete)..."
foreach ($dir in @($run, $secrets)) {
    if (Test-Path -LiteralPath $dir) {
        $bad = "$dir.bad-$stamp"
        try {
            Rename-Item -LiteralPath $dir -NewName (Split-Path $bad -Leaf) -ErrorAction Stop
            Write-Host ("   quarantined: {0} -> {1}" -f $dir, (Split-Path $bad -Leaf))
        } catch {
            Write-Warning ("   could not rename {0}: {1}" -f $dir, $_.Exception.Message)
        }
    } else {
        Write-Host ("   absent (ok): {0}" -f $dir)
    }
}

if (-not $Launch) {
    Write-Host "4/4 Skipped launch (-Launch not set). Start Docker Desktop manually."
    return
}

Write-Host "4/4 Launching Docker Desktop + waiting for engine..."
Start-Process $dockerDesktop | Out-Null

$deadline = (Get-Date).AddMinutes(5)
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 10
    if (Test-DockerHealthy) {
        $v = & docker version --format '{{.Server.Version}}' 2>$null
        Write-Host ("Docker engine UP (server {0})." -f $v)
        return
    }
}
Write-Warning "Engine did not respond within 5 min. Check Docker Desktop log:"
Write-Warning "  $env:LOCALAPPDATA\Docker\log\host\com.docker.backend.exe.log"
exit 1
