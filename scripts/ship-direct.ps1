# scripts/ship-direct.ps1
# Purpose: fast-forward main with current branch and push. No browser required.
# Use for: docs-only, runbook, release-packet, and any change where the local
#           pre-push gate is the source of truth.
# Assumes: direct push to main is allowed (no PR branch-protection rule).

$ErrorActionPreference = "Stop"

function Exec([string]$cmd) {
  Write-Host ">> $cmd"
  Invoke-Expression $cmd
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed: $cmd"
  }
}

$currentBranch = git rev-parse --abbrev-ref HEAD
if (-not $currentBranch) { throw "Unable to determine current branch." }
if ($currentBranch -eq "main") { throw "Already on main — nothing to merge in." }

Exec "git fetch origin"
Exec "git checkout main"
Exec "git pull --ff-only origin main"
Exec "git merge --ff-only $currentBranch"
Exec "git push origin main"
Exec "git checkout $currentBranch"

Write-Host "Direct ship complete. The branch got on the bus and nobody had to clap."
