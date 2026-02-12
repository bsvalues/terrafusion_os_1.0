# Run Electron with verbose logging and capture output to logs/electron-start-capture.log
param()

Set-StrictMode -Version Latest

# Ensure logs dir exists
$logDir = Join-Path $PSScriptRoot 'logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

$env:ELECTRON_ENABLE_LOGGING = '1'
$env:ELECTRON_ENABLE_STACK_DUMPING = '1'

# Run electron in this directory (script lives in terrafusion-cos/electron)
$electronCmd = 'npx electron main.js'
Write-Output "Running: $electronCmd"

# Start Electron and capture stdout/stderr to a file
Invoke-Expression "$electronCmd 2>&1 | Tee-Object -FilePath (Join-Path $logDir 'electron-start-capture.log')"