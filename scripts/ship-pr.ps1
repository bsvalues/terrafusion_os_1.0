# scripts/ship-pr.ps1
# Purpose: push current branch, create PR if needed, enable auto-merge.
#          No browser required. `gh` CLI does all the work.
# Use for: any change that must pass required remote CI checks before merge.
# Requires: gh auth login (run once)
# Merge policy: --merge (adjust to --squash or --rebase to match repo setting)

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
if ($currentBranch -eq "main") { throw "Refusing to create a PR from main." }

# Push branch (--force-with-lease is safe for solo dev feature branches)
Exec "git push -u origin $currentBranch"

# Check for existing PR
$null = gh pr view $currentBranch --json number 2>$null
$prExists = $LASTEXITCODE -eq 0

if (-not $prExists) {
  $title = (git log -1 --pretty=%s).Trim()
  $body = "Automated solo-dev PR.`n`nLocal pre-push gate passed. Awaiting required remote checks."
  Exec "gh pr create --base main --head $currentBranch --title `"$title`" --body `"$body`""
}

# Auto-merge when checks pass — no browser required
Exec "gh pr merge $currentBranch --merge --auto --delete-branch"

Write-Host "PR automation complete. The robot signed its own hallway pass."
