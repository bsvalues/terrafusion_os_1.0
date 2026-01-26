<# ============================================================================

  TerraFusion OS — Governance Self Check (Local Mirror of CI Guards)
  File: scripts/governance-self-check.ps1

  Goals:
    - Non-mutating: only reads files, prints findings, returns exit code.
    - Mirrors CI intent: drift guards, single-sourcing checks, registry sanity.
    - Fail-fast by default; use -NoFailFast to collect all failures.

  Usage:
    pwsh -File scripts/governance-self-check.ps1
    pwsh -File scripts/governance-self-check.ps1 -NoFailFast
    pwsh -File scripts/governance-self-check.ps1 -RepoRoot C:\path\to\repo

============================================================================ #>

[CmdletBinding()]
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [switch]$NoFailFast,
  [switch]$Quiet
)

$ErrorActionPreference = "Stop"

function Write-Ok($msg)   { if (-not $Quiet) { Write-Host "✅ $msg" -ForegroundColor Green } }
function Write-Warn($msg) { if (-not $Quiet) { Write-Host "⚠️  $msg" -ForegroundColor Yellow } }
function Write-Info($msg) { if (-not $Quiet) { Write-Host "ℹ️  $msg" -ForegroundColor Cyan } }
function Write-Bad($msg)  { if (-not $Quiet) { Write-Host "❌ $msg" -ForegroundColor Red } }

$failures = New-Object System.Collections.Generic.List[string]

function Fail($msg) {
  $failures.Add($msg) | Out-Null
  Write-Bad $msg
  if (-not $NoFailFast) { throw $msg }
}

function Assert-FileExists([string]$path, [string]$nameForMsg) {
  if (-not (Test-Path $path)) {
    Fail "$nameForMsg missing: $path"
  }
}

function Read-Text([string]$path) {
  return Get-Content -LiteralPath $path -Raw
}

function Try-ReadJson([string]$path) {
  try {
    $raw = Get-Content -LiteralPath $path -Raw
    return $raw | ConvertFrom-Json
  } catch {
    Fail "Invalid JSON in: $path ($($_.Exception.Message))"
  }
}

function Get-Workflows([string]$root) {
  $wfDir = Join-Path $root ".github/workflows"
  if (-not (Test-Path $wfDir)) { return @() }
  return Get-ChildItem -LiteralPath $wfDir -Recurse -File |
    Where-Object { $_.Name -match "\.(yml|yaml)$" }
}

function Find-Any([string]$text, [string[]]$patterns) {
  foreach ($p in $patterns) {
    if ($text -match $p) { return $true }
  }
  return $false
}

function Count-Matches([string]$text, [string]$pattern) {
  return ([regex]::Matches($text, $pattern)).Count
}

# -------------------------
# Boot
# -------------------------
Write-Info "Governance Self Check"
Write-Info "RepoRoot: $RepoRoot"

# -------------------------
# Canonical registry (machine-readable)
# -------------------------
$registryPath = Join-Path $RepoRoot "docs/ci/canonical-paths.json"
Assert-FileExists $registryPath "canonical-paths registry"
$registry = Try-ReadJson $registryPath

Write-Ok "canonical-paths.json parses"

# Optional: minimal shape sanity (don't overfit—keep forward-compatible)
if (-not $registry) { Fail "canonical-paths.json is empty or null" }

# -------------------------
# Snyk exclusions drift guard
# -------------------------
$snykPath = Join-Path $RepoRoot ".snyk"
Assert-FileExists $snykPath ".snyk exclusions file"
$snykText = Read-Text $snykPath

# Critical patterns (escape as regex)
# NOTE: These are "must contain" signatures used by CI snyk_drift_guard.
$criticalSnykRegex = @(
  "championship-deployment",
  "government-edition-enhanced-MARKED-FOR-REVIEW",
  "PRODUCTION",
  "deployment/\*\*/package\.json"
)

foreach ($rx in $criticalSnykRegex) {
  if ($snykText -notmatch $rx) {
    Fail ".snyk missing critical exclusion signature: /$rx/"
  }
}
Write-Ok ".snyk critical exclusion signatures present"

# -------------------------
# Workflow scans
# -------------------------
$workflows = Get-Workflows $RepoRoot
if ($workflows.Count -eq 0) {
  Fail "No workflows found under .github/workflows — expected CI guard workflows to exist"
}
Write-Ok "Found $($workflows.Count) workflow file(s)"

# -------------------------
# Guard 1: Canonical .NET test command enforcement
#   RULE: Only .github/workflows/dotnet-test.yml may contain actual `dotnet test` execution
#   EXCEPTION: ci.yml allowed because it contains the drift_guard job that must reference
#              'dotnet test' as a string to detect violations (guard logic, not execution)
#   Legacy: other workflows with dotnet test are reported as warnings (drift)
# -------------------------

# Use registry if available
$requiredCallers = @()
$allowedDirect = @()
try {
  if ($registry.dotnet) {
    if ($registry.dotnet.requiredCallers) { $requiredCallers = @($registry.dotnet.requiredCallers) }
    if ($registry.dotnet.allowedDirectTestWorkflows) { $allowedDirect = @($registry.dotnet.allowedDirectTestWorkflows) }
  }
} catch { }

# Fallback if registry lacks dotnet section
if ($requiredCallers.Count -eq 0) {
  $requiredCallers = @(
    ".github/workflows/ci.yml",
    ".github/workflows/ci-cd-main.yml",
    ".github/workflows/ci-verified.yml"
  )
  Write-Warn "Registry lacks dotnet.requiredCallers; using defaults."
}

# Canonical allowlist: dotnet-test.yml (execution) + ci.yml (guard detection logic)
if ($allowedDirect.Count -eq 0) {
  $allowedDirect = @("dotnet-test", "ci")
  Write-Warn "Registry lacks dotnet.allowedDirectTestWorkflows; using defaults."
}

# Check required callers use the reusable workflow
$reusablePattern = "uses:\s*\./\.github/workflows/dotnet-test\.yml"
foreach ($caller in $requiredCallers) {
  $callerPath = Join-Path $RepoRoot $caller
  if (Test-Path $callerPath) {
    $txt = Read-Text $callerPath
    if ($txt -notmatch $reusablePattern) {
      Fail "Required workflow $caller does not call reusable dotnet-test.yml"
    }
  } else {
    Write-Warn "Required workflow $caller not found (may be expected in some configurations)"
  }
}
Write-Ok "Required workflows call reusable dotnet-test.yml"

# Report legacy drift (warnings, not failures)
# Any workflow matching 'dotnet test' that isn't in allowedDirect is drift
$legacyDrift = @()
foreach ($wf in $workflows) {
  $txt = Read-Text $wf.FullName
  if ($txt -match "\bdotnet\s+test\b") {
    $name = $wf.BaseName
    $isAllowed = $false
    foreach ($token in $allowedDirect) {
      # Exact match for 'ci' to avoid matching 'ci-cd-pipeline' etc
      if ($token -eq "ci" -and $name -eq "ci") { $isAllowed = $true; break }
      elseif ($token -ne "ci" -and $name -like "*$token*") { $isAllowed = $true; break }
    }
    if (-not $isAllowed) {
      $legacyDrift += $wf.Name
    }
  }
}

if ($legacyDrift.Count -gt 0) {
  Write-Warn "Legacy dotnet test drift in $($legacyDrift.Count) workflow(s): $($legacyDrift -join ', ')"
  Write-Warn "Migrate to reusable dotnet-test.yml or add to allowedDirectTestWorkflows in canonical-paths.json"
}

# -------------------------
# Guard 2: PR hint single-source enforcement
#   Must: at least one workflow references CiHints project
#   Must NOT: inline 'contains(drift|guard)' style heuristics in ci-verified.yml
#   NOTE: ci.yml contains the guard LOGIC that detects bad patterns - that's allowed
# -------------------------
$ciHintsPattern = "TerraFusion\.CiHints\.csproj"
$badHintHeuristics = @(
  # "contains(…)" patterns that drift into workflows
  "(?i)contains\([^\)]*(drift|guard)[^\)]*\)"
)

# Only check ci-verified.yml for inline heuristics (mirrors CI hint_drift_guard scope)
$ciVerifiedPath = Join-Path $RepoRoot ".github/workflows/ci-verified.yml"
if (Test-Path $ciVerifiedPath) {
  $ciVerifiedText = Read-Text $ciVerifiedPath
  foreach ($bad in $badHintHeuristics) {
    if ($ciVerifiedText -match $bad) {
      Fail "Inline PR hint heuristic found in ci-verified.yml (pattern: $bad). Must be single-sourced via CiHints."
    }
  }
}

$ciHintsRefs = 0
foreach ($wf in $workflows) {
  $txt = Read-Text $wf.FullName
  $ciHintsRefs += Count-Matches $txt $ciHintsPattern
}

if ($ciHintsRefs -lt 1) {
  Fail "No workflow references $ciHintsPattern — expected hint_drift_guard single-source invocation to exist"
}
Write-Ok "CiHints referenced in workflows (count=$ciHintsRefs) and no inline heuristics in ci-verified.yml"

# -------------------------
# Guard 3: Discoverability artifacts exist
# -------------------------
$docsIndex = Join-Path $RepoRoot "docs/ci/README.md"
$dotnetMemo = Join-Path $RepoRoot "docs/ci/CANONICAL_DOTNET_TESTING.md"
$branchHygiene = Join-Path $RepoRoot "docs/ci/BRANCH_HYGIENE.md"

Assert-FileExists $docsIndex "docs/ci index"
Assert-FileExists $dotnetMemo "canonical dotnet memo"
Assert-FileExists $branchHygiene "branch hygiene policy"
Write-Ok "Governance docs present (index + memo + hygiene)"

# -------------------------
# Results
# -------------------------
if ($failures.Count -eq 0) {
  Write-Host ""
  Write-Ok "GOVERNANCE SELF-CHECK: PASS"
  exit 0
} else {
  Write-Host ""
  Write-Bad "GOVERNANCE SELF-CHECK: FAIL ($($failures.Count) issue(s))"
  foreach ($f in $failures) { Write-Host " - $f" -ForegroundColor Red }
  exit 1
}
