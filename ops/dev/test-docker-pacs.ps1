<#
.SYNOPSIS
  Sanity checks for Docker + PACS restore readiness.
.DESCRIPTION
  Prevents us from lying to ourselves:
  1) Docker engine reachable?
  2) Volume enumeration works?
  3) docker system df works?
  4) data\benton archives present?
#>

$ErrorActionPreference = "Stop"
$failed = 0

function Test-Step($name, [scriptblock]$block) {
  try {
    & $block
    Write-Host "  PASS: $name"
  } catch {
    Write-Host "  FAIL: $name ($_)"
    $script:failed++
  }
}

Write-Host "Running Docker PACS sanity checks..."
Write-Host ""

# 1) Docker reachable
Test-Step "Docker engine reachable" {
  $ver = docker version --format "{{.Server.Version}}" 2>&1
  if ($LASTEXITCODE -ne 0) { throw "exit $LASTEXITCODE - $ver" }
}

# 2) Docker volumes enumerable
Test-Step "Docker volume ls works" {
  $null = docker volume ls --format "{{.Name}}" 2>&1
  if ($LASTEXITCODE -ne 0) { throw "exit $LASTEXITCODE" }
}

# 3) Docker system df works
Test-Step "Docker system df works" {
  $null = docker system df 2>&1
  if ($LASTEXITCODE -ne 0) { throw "exit $LASTEXITCODE" }
}

# 4) data\benton archives present
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$dataDir  = Join-Path $repoRoot "data\benton"
Test-Step "data\benton archives exist" {
  if (-not (Test-Path $dataDir)) { throw "directory missing: $dataDir" }
  $archives = Get-ChildItem $dataDir -File -Force | Where-Object { $_.Extension -in ".rar", ".zip", ".7z" -and $_.Length -gt 0 }
  if (-not $archives -or $archives.Count -eq 0) { throw "no non-empty archives found" }
  Write-Host "    Found $($archives.Count) archive(s): $($archives.Name -join ', ')"
}

Write-Host ""
if ($failed -eq 0) {
  Write-Host "ALL CHECKS PASSED ($failed failures)"
  exit 0
} else {
  Write-Host "FAILED: $failed check(s)"
  exit 1
}
