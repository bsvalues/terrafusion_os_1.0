# e2e-wireup.ps1
param(
  [int]$BackendWaitSeconds = 3,
  [int]$ViteWaitSeconds = 2,
  [int]$AuthWaitSeconds = 6
)

$ErrorActionPreference = 'Continue'

function Start-LoggedProcess {
  param(
    [string]$Title,
    [string]$FilePath,
    [string]$Arguments,
    [string]$WorkingDirectory
  )
  Write-Host "==> $Title" -ForegroundColor Cyan
  Start-Process -FilePath $FilePath -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory | Out-Null
}

# Resolve repo root relative to script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir '..')

# Launch backend (.NET hub on ws://localhost:\${{TF_PORT_7000:-7000}}/terrafusion/core)
Start-LoggedProcess -Title 'Boot: backend hub' -FilePath 'pwsh' -Arguments '-NoExit -Command "dotnet run"' -WorkingDirectory (Join-Path $RepoRoot 'backend/TerraFusion.API')
Start-Sleep -Seconds $BackendWaitSeconds

# Launch Vite dev server (http://localhost:\${{TF_PORT_7000:-7000}})
Start-LoggedProcess -Title 'Boot: frontend (vite dev)' -FilePath 'pwsh' -Arguments '-NoExit -Command "npm run dev"' -WorkingDirectory (Join-Path $RepoRoot 'frontend')
Start-Sleep -Seconds $ViteWaitSeconds

# Launch Electron shell
Start-LoggedProcess -Title 'Boot: electron shell' -FilePath 'pwsh' -Arguments '-NoExit -Command "npm run electron"' -WorkingDirectory (Join-Path $RepoRoot 'frontend')

Write-Host "⏳ Waiting for SignalR auth..." -ForegroundColor Yellow
Start-Sleep -Seconds $AuthWaitSeconds

Write-Host "✅ Expect 7000 (hub) and 3000 (vite) open." -ForegroundColor Green
Write-Host "Tip: In Electron devtools console, run: electronAPI.getOSConnectionState()" -ForegroundColor DarkGray
