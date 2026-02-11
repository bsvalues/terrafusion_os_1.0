<#
.SYNOPSIS
  TerraFusion OS – Verify all gates.
  Runs type-check, phase83 tests, and endpoint smoke checks.
  Exit 0 = all green. Non-zero = failures.
#>
$ErrorActionPreference = 'Continue'
$fail = 0

Write-Host "`n=== TerraFusion OS Verify ===" -ForegroundColor Cyan

# --- Gate 1: type-check ---
Write-Host "`n-- Gate 1: type-check --"
pnpm -w run type-check 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host "  FAILED" -ForegroundColor Red; $fail++ }
else                      { Write-Host "  PASSED" -ForegroundColor Green }

# --- Gate 2: phase83 tools ---
Write-Host "`n-- Gate 2: phase83 tools --"
node --test os-platform/core/tests/phase83-tools.test.mjs 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host "  FAILED" -ForegroundColor Red; $fail++ }
else                      { Write-Host "  PASSED" -ForegroundColor Green }

# --- Gate 3: endpoint smoke ---
Write-Host "`n-- Gate 3: endpoint smoke --"
$endpoints = @(
    @{ Url='http://localhost:8080/';            Label='8080 frontend' }
    @{ Url='http://localhost:8080/api/health';  Label='8080/api/health' }
    @{ Url='http://localhost:8006/docs';        Label='8006 cortex docs' }
)
foreach ($ep in $endpoints) {
    try {
        $r = Invoke-WebRequest -Uri $ep.Url -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { Write-Host "  [PASS] $($ep.Label)" -ForegroundColor Green }
        else { Write-Host "  [FAIL] $($ep.Label) -> $($r.StatusCode)" -ForegroundColor Red; $fail++ }
    } catch {
        Write-Host "  [FAIL] $($ep.Label) -> $_" -ForegroundColor Red; $fail++
    }
}

# --- Summary ---
Write-Host "`n================================"
if ($fail -eq 0) { Write-Host "ALL GATES GREEN" -ForegroundColor Green }
else              { Write-Host "$fail GATE(S) FAILED" -ForegroundColor Red }
Write-Host ""
exit $fail
