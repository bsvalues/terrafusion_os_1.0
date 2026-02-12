<#
.SYNOPSIS
  Run quarantine governance gates locally.
.DESCRIPTION
  Executes the three governance checks that SEAL enforces in CI:
    1. Repo shape guard (root spine allowlist)
    2. Quarantine plan --check (no pending moves)
    3. Quarantine + platform test suites
.EXAMPLE
  pwsh tools/dev/governance.ps1
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "`n🔒 Quarantine Governance Gates" -ForegroundColor Cyan
Write-Host ("═" * 60)

# Gate 1: Repo shape guard
Write-Host "`n[1/3] Repo shape guard..." -ForegroundColor Yellow
node scripts/repo-shape-guard.mjs
if ($LASTEXITCODE -ne 0) { Write-Error "Repo shape guard FAILED"; exit 1 }

# Gate 2: Quarantine plan --check
Write-Host "`n[2/3] Quarantine plan --check..." -ForegroundColor Yellow
node scripts/quarantine/plan.mjs --check
if ($LASTEXITCODE -ne 0) { Write-Error "Quarantine plan check FAILED"; exit 1 }

# Gate 3: Test suites
Write-Host "`n[3/3] Governance test suites..." -ForegroundColor Yellow
node --test scripts/quarantine/__tests__/*.test.mjs os-platform/core/tests/phase83-tools.test.mjs
if ($LASTEXITCODE -ne 0) { Write-Error "Governance tests FAILED"; exit 1 }

Write-Host "`n✅ All governance gates passed" -ForegroundColor Green
