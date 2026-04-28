Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir '..\..\..')).Path

Push-Location $repoRoot
try {
  & node 'os-platform/core/pilot/local-agent-release-proof-wrapper.mjs'
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}