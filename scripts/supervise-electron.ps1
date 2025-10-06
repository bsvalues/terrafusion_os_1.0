# Supervisor script for Electron on Windows - simple restart loop with crash protection
param(
  [string]$RepoRoot = "${PSScriptRoot}\..",
  [int]$MaxRestarts = 5,
  [int]$WindowSeconds = 60
)

$cwd = Resolve-Path $RepoRoot
Set-Location $cwd
$logDir = Join-Path $cwd 'terrafusion-cos\logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

$restartCount = 0
while ($true) {
  Write-Output "Starting Electron (restartCount=$restartCount)"
  $p = Start-Process -FilePath 'npx.cmd' -ArgumentList 'electron .' -WorkingDirectory (Join-Path $cwd 'terrafusion-cos') -NoNewWindow -PassThru
  $p.WaitForExit()
  $exit = $p.ExitCode
  Write-Output "Electron exited with code $exit"

  # Rotate logs before restart to avoid runaway growth
  $mainLog = Join-Path $logDir 'electron-main.log'
  if (Test-Path $mainLog) {
    $ts = Get-Date -Format yyyyMMddHHmmss
    $bak = Join-Path $logDir "electron-main.$ts.log"
    try { Move-Item $mainLog $bak -Force } catch { }
  }

  $restartCount++
  if ($restartCount -ge $MaxRestarts) {
    Write-Output "Max restarts reached ($MaxRestarts). Not restarting."
    break
  }
  Start-Sleep -Seconds $WindowSeconds
}
