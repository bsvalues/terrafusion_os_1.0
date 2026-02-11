<#
.SYNOPSIS
  TerraFusion OS – System Doctor
  Checks prerequisites, container health, and endpoint availability.
#>
param([switch]$Verbose)

$ErrorActionPreference = 'Continue'
$pass = 0; $fail = 0

function Check($label, $test) {
    if (& $test) { Write-Host "  [PASS] $label" -ForegroundColor Green; $script:pass++ }
    else         { Write-Host "  [FAIL] $label" -ForegroundColor Red;   $script:fail++ }
}

Write-Host "`n=== TerraFusion OS Doctor ===" -ForegroundColor Cyan

# --- Prerequisites ---
Write-Host "`n-- Prerequisites --"
Check "Docker daemon" { (docker info 2>$null) -ne $null }
Check "Node >= 18"    { $v = (node -v 2>$null); $v -and [int]($v -replace 'v(\d+).*','$1') -ge 18 }
Check "pnpm"          { (Get-Command pnpm -ErrorAction SilentlyContinue) -ne $null }

# --- Compose file ---
$compose = Join-Path $PSScriptRoot "../../ops/prod/docker-compose.prod.server.yml"
Check "Compose file"  { Test-Path $compose }

# --- Container health ---
Write-Host "`n-- Containers --"
$containers = @(
    @{ Name='terrafusion-shield';          Expect='running' }
    @{ Name='terrafusion-soul';            Expect='running' }
    @{ Name='terrafusion-iron';            Expect='running' }
    @{ Name='terrafusion-cortex';          Expect='running' }
    @{ Name='terrafusion-substrate-cache'; Expect='running' }
)
foreach ($c in $containers) {
    $state = (docker inspect --format '{{.State.Status}}' $c.Name 2>$null)
    Check "$($c.Name) = $($c.Expect)" { $state -eq $c.Expect }
}

# --- Endpoints ---
Write-Host "`n-- Endpoints --"
$endpoints = @(
    @{ Url='http://localhost:8080/';            Label='Shield -> Soul (frontend)' }
    @{ Url='http://localhost:8080/api/health';  Label='Shield -> Iron (API health)' }
    @{ Url='http://localhost:8006/docs';        Label='Cortex (AI docs)' }
)
foreach ($ep in $endpoints) {
    Check $ep.Label {
        try { $r = Invoke-WebRequest -Uri $ep.Url -UseBasicParsing -TimeoutSec 5; $r.StatusCode -eq 200 }
        catch { $false }
    }
}

# --- Summary ---
Write-Host "`n================================"
if ($fail -eq 0) { Write-Host "ALL $pass CHECKS PASSED" -ForegroundColor Green }
else              { Write-Host "$fail FAILED / $($pass+$fail) total" -ForegroundColor Red }
Write-Host ""
exit $fail
