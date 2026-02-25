<#
.SYNOPSIS
    TerraFusion OS — Platform Verification (run this first)
.DESCRIPTION
    Verifies the platform boots, compiles, and passes tests.
    No Docker required for this step — just Node, pnpm, and .NET 8 SDK.
    PACS data proof is separate (scripts 0-3).
#>
$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path "$PSScriptRoot/../..").Path

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TerraFusion OS — Platform Verification                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$results = @()
$allPassed = $true

function Record($name, $passed, $detail) {
    $script:results += [PSCustomObject]@{ Check = $name; Passed = $passed; Detail = $detail }
    if (-not $passed) { $script:allPassed = $false }
    $color = if ($passed) { "Green" } else { "Red" }
    $icon = if ($passed) { "PASS" } else { "FAIL" }
    Write-Host "  [$icon] $name — $detail" -ForegroundColor $color
}

# ── Prerequisites ─────────────────────────────────────────────────────────────
Write-Host "  Checking prerequisites..." -ForegroundColor Yellow

$nodeVersion = node --version 2>$null
if ($nodeVersion) { Record "Node.js" $true $nodeVersion }
else { Record "Node.js" $false "not found" }

$pnpmVersion = pnpm --version 2>$null
if ($pnpmVersion) { Record "pnpm" $true "v$pnpmVersion" }
else { Record "pnpm" $false "not found — install: npm i -g pnpm" }

$dotnetVersion = dotnet --version 2>$null
if ($dotnetVersion) { Record ".NET SDK" $true $dotnetVersion }
else { Record ".NET SDK" $false "not found" }

$dockerVersion = docker version --format '{{.Server.Version}}' 2>$null
if ($dockerVersion) { Record "Docker" $true "v$dockerVersion" }
else { Record "Docker" $false "not running (needed for PACS only)" }

Write-Host ""

# ── Core Governance Gates ─────────────────────────────────────────────────────
Write-Host "  Running governance gates..." -ForegroundColor Yellow

Push-Location $repoRoot
try {
    # Type-check (core)
    $tcOut = pnpm run type-check 2>&1 | Out-String
    $tcPass = $LASTEXITCODE -eq 0
    Record "Core type-check" $tcPass "tsconfig.core.json"

    # Phase 83 tests
    $p83Out = node --test os-platform/core/tests/phase83-tools.test.mjs 2>&1 | Out-String
    $p83Pass = $p83Out -match "fail 0"
    $p83Count = if ($p83Out -match "pass (\d+)") { "$($Matches[1]) tests" } else { "unknown" }
    Record "Phase 83 governance" $p83Pass $p83Count

    # Unit tests (vitest)
    $unitRaw = pnpm run test:unit 2>&1 | Out-String
    $unitOut = $unitRaw -replace '\x1b\[[0-9;]*m',''   # strip ANSI color codes
    $unitPass = $unitOut -match "Tests\s+\d+ passed"
    $unitCount = if ($unitOut -match "Tests\s+(\d+) passed") { "$($Matches[1]) tests" } else { "unknown" }
    Record "Unit tests" $unitPass $unitCount
} finally { Pop-Location }

Write-Host ""

# ── Backend Build ─────────────────────────────────────────────────────────────
Write-Host "  Building .NET backend..." -ForegroundColor Yellow

Push-Location (Join-Path $repoRoot "backend")
try {
    $buildOut = dotnet build TerraFusion.sln 2>&1 | Out-String
    $buildPass = $buildOut -match "Build succeeded" -and $buildOut -match "0 Error"
    $warnMatch = if ($buildOut -match "(\d+) Warning") { "$($Matches[1]) warnings" } else { "0 warnings" }
    Record "Backend build" $buildPass $warnMatch
} finally { Pop-Location }

Write-Host ""

# ── Frontend Type-Check ───────────────────────────────────────────────────────
Write-Host "  Checking frontend TypeScript..." -ForegroundColor Yellow

Push-Location (Join-Path $repoRoot "frontend")
try {
    $feOut = pnpm exec tsc --noEmit 2>&1 | Out-String
    $feErrors = ($feOut -split "`n" | Where-Object { $_ -match "error TS" }).Count
    $fePass = $feErrors -eq 0
    Record "Frontend type-check" $fePass "717 files, $feErrors errors"
} finally { Pop-Location }

Write-Host ""

# ── Frontend Dev Server (quick boot test) ─────────────────────────────────────
Write-Host "  Testing frontend dev server boot..." -ForegroundColor Yellow

Push-Location (Join-Path $repoRoot "frontend")
try {
    $viteProc = Start-Process -FilePath "pnpm" `
        -ArgumentList "exec","vite","--host" `
        -PassThru -WindowStyle Hidden -RedirectStandardError "$env:TEMP\vite-err.txt"

    $viteUp = $false
    $waited = 0
    while ($waited -lt 15) {
        Start-Sleep -Seconds 1
        $waited++
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -ErrorAction Stop
            if ($r.StatusCode -eq 200) { $viteUp = $true; break }
        } catch {}
    }

    Record "Frontend dev server" $viteUp "port 5173, ${waited}s to boot"

    if ($viteProc -and -not $viteProc.HasExited) {
        Stop-Process -Id $viteProc.Id -Force -ErrorAction SilentlyContinue
    }
} finally { Pop-Location }

Write-Host ""

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Results                                                       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$passCount = ($results | Where-Object { $_.Passed }).Count
$totalCount = $results.Count

foreach ($r in $results) {
    $icon = if ($r.Passed) { "[OK]" } else { "[!!]" }
    $color = if ($r.Passed) { "Green" } else { "Red" }
    Write-Host "  $icon $($r.Check): $($r.Detail)" -ForegroundColor $color
}

Write-Host ""
if ($allPassed) {
    Write-Host "  $passCount/$totalCount PASSED — platform is live." -ForegroundColor Green
    Write-Host ""
    Write-Host "  Next steps:" -ForegroundColor White
    Write-Host "    • Read docs/daniel/01-pilot-one-pager.md" -ForegroundColor Gray
    Write-Host "    • For PACS data proof:  pwsh 0_restore.ps1 → 1 → 2 → 3" -ForegroundColor Gray
    Write-Host "    • Frontend dev server:  pnpm -C frontend exec vite --host" -ForegroundColor Gray
    Write-Host "    • Backend API:          cd backend && dotnet run --project src/TerraFusion.API/TerraFusion.API.csproj" -ForegroundColor Gray
    exit 0
} else {
    Write-Host "  $passCount/$totalCount passed. Fix failures above before continuing." -ForegroundColor Red
    exit 1
}
