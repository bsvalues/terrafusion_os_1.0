<#
.SYNOPSIS
  Run quarantine governance gates locally.
.DESCRIPTION
  Executes the governance checks that SEAL enforces in CI:
    1. Repo shape guard (root spine allowlist)
    2. Quarantine plan --check (no pending moves)
    3. Quarantine toolchain tests (23 tests / 4 suites)
    4. Phase83 platform tests (32 tests / 11 suites)
    5. Workflow path integrity (13 tests / 5 suites)
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
Write-Host "`n[1/5] Repo shape guard..." -ForegroundColor Yellow
node scripts/repo-shape-guard.mjs
if ($LASTEXITCODE -ne 0) { Write-Error "Repo shape guard FAILED"; exit 1 }

# Gate 2: Quarantine plan --check
Write-Host "`n[2/5] Quarantine plan --check..." -ForegroundColor Yellow
node scripts/quarantine/plan.mjs --check
if ($LASTEXITCODE -ne 0) { Write-Error "Quarantine plan check FAILED"; exit 1 }

# Gate 3: Quarantine toolchain tests (23 tests / 4 suites)
Write-Host "`n[3/5] Quarantine toolchain tests (23t/4s)..." -ForegroundColor Yellow
node --test scripts/quarantine/__tests__/*.test.mjs
if ($LASTEXITCODE -ne 0) { Write-Error "Quarantine toolchain tests FAILED"; exit 1 }

# Gate 4: Phase83 platform tests (32 tests / 11 suites)
Write-Host "`n[4/5] Phase83 platform tests (32t/11s)..." -ForegroundColor Yellow
node --test os-platform/core/tests/phase83-tools.test.mjs
if ($LASTEXITCODE -ne 0) { Write-Error "Phase83 platform tests FAILED"; exit 1 }

# Gate 5: Workflow path integrity (13 tests / 5 suites)
Write-Host "`n[5/5] Workflow path integrity (13t/5s)..." -ForegroundColor Yellow
node --test scripts/governance/__tests__/workflow-paths.test.mjs
if ($LASTEXITCODE -ne 0) { Write-Error "Workflow path integrity FAILED"; exit 1 }

Write-Host "`n✅ All governance gates passed (68 tests / 20 suites)" -ForegroundColor Green
