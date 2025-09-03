Param(
    [switch]$Verify,
    [switch]$RunDiscovery
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir '..')
Set-Location $RepoRoot

$required = @(
    'AI_NAVIGATION.md',
    'START_HERE.md',
    'AI_AGENT_QUICK_START.md',
    'CLAUDE.md',
    'TEST_REGISTRY.md',
    'scripts/discover-all-tests.sh'
)

$missing = @()
foreach ($f in $required) {
    if (-not (Test-Path $f)) { $missing += $f }
}

if ($missing.Count -gt 0) {
    Write-Error ("Required files not found:`n" + ($missing | ForEach-Object { " - $_" } | Out-String))
}

Write-Output 'Single Entry Point: AI_NAVIGATION.md'
Write-Output ''
Write-Output 'Essential Reading Order:'
Write-Output '  1) START_HERE.md'
Write-Output '  2) AI_AGENT_QUICK_START.md'
Write-Output '  3) CLAUDE.md'
Write-Output '  4) TEST_REGISTRY.md'
Write-Output ''
Write-Output 'Most Important Facts:'
Write-Output ' - Tests are distributed across 10+ locations, not just /tests/'
Write-Output ' - 716 real tests are in /modules/testing-suite/ (91.9% pass rate)'
Write-Output ' - Mock tests live in /tests/mock_tests/'
Write-Output ' - Championship orchestrators are in the repository root'
Write-Output ' - Always read CLAUDE.md first for any development work'
Write-Output ''
Write-Output 'Critical Commands:'
Write-Output '  ./scripts/discover-all-tests.sh'
Write-Output '  cat CLAUDE.md'
Write-Output '  cat TEST_REGISTRY.md'
Write-Output '  ls modules/testing-suite/'
Write-Output ''
Write-Output 'Guidance for AI Agents:'
Write-Output '  Read AI_NAVIGATION.md first, then START_HERE.md, then CLAUDE.md.'
Write-Output '  Tests are distributed across 10+ locations — run ./scripts/discover-all-tests.sh'
Write-Output '  to find all 361 tests. The real tests (716) are in /modules/testing-suite/, not /tests/.'

if ($Verify) {
    Write-Output ''
    Write-Output 'Verifying key paths...'
    $paths = @('modules/testing-suite', 'tests/mock_tests')
    foreach ($p in $paths) {
        if (Test-Path $p) { Write-Output ("OK $p") } else { Write-Warning ("Missing directory: $p") }
    }
}

if ($RunDiscovery) {
    Write-Output ''
    Write-Output 'Running test discovery...'
    $bashCmd = Get-Command bash -ErrorAction SilentlyContinue
    if ($null -ne $bashCmd) {
        & bash ./scripts/discover-all-tests.sh | Out-Host
    } else {
        Write-Warning 'Bash not found. Skipping test discovery. Install Git Bash or WSL to enable discovery from PowerShell.'
    }
}

Write-Output ''
Write-Output 'Orientation complete.'


