# TerraFusion OS - Comprehensive Test Discovery (PowerShell)
# Catalogs tests across the repo and writes a deduped manifest + summary
param(
  [switch]$EmitWSL,
  [switch]$PerDirCounts
)

$ErrorActionPreference = 'Stop'
Write-Host "🔍 TerraFusion OS - Complete Test Discovery System"
Write-Host "=================================================="

# Resolve repository root based on this script's location
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir

$ArtifactsDir = Join-Path $RepoRoot 'artifacts'
$ManifestFile = Join-Path $ArtifactsDir 'test-manifest.txt'
$SummaryFile  = Join-Path $ArtifactsDir 'test-summary.txt'

# Helper: Convert Windows path to WSL-style /mnt/<drive>/...
function Convert-ToWSLPath {
  param([Parameter(Mandatory=$true)][string]$WinPath)
  if ([string]::IsNullOrWhiteSpace($WinPath)) { return $WinPath }
  $p = $WinPath -replace '\\','/'
  if ($p -match '^(?i)([A-Z]):') {
    $drive = $Matches[1].ToLower()
    $rest = $p.Substring(2)
    return "/mnt/$drive$rest"
  }
  return $p
}

New-Item -ItemType Directory -Force -Path $ArtifactsDir | Out-Null

Write-Host "📁 Repo Root: $RepoRoot"
Write-Host "📝 Manifest:  $ManifestFile"

Write-Host "📊 Discovering all test files across TerraFusion OS..."

# Directories to scan (aligned with TEST_REGISTRY.md)
$ScanDirs = @(
  $RepoRoot,                                 # Root orchestrators
  (Join-Path $RepoRoot 'championship'),      # Championship
  (Join-Path $RepoRoot 'scripts'),           # Production validation
  (Join-Path $RepoRoot 'infrastructure'),    # DevOps
  (Join-Path $RepoRoot 'tests'),             # Main tests
  (Join-Path $RepoRoot 'backend'),           # Backend & AI
  (Join-Path $RepoRoot 'apps'),              # Frontend
  (Join-Path $RepoRoot 'modules'),           # Modules
  (Join-Path $RepoRoot 'deployment'),        # Packaging
  (Join-Path $RepoRoot 'data'),              # County-specific
  (Join-Path $RepoRoot 'COMPLETE_TEST_SUITE'), # Complete test suite
  (Join-Path $RepoRoot 'src-enhanced'),      # Enhanced source
  (Join-Path $RepoRoot 'tools'),             # Tools
  (Join-Path $RepoRoot 'testing'),           # Testing meta
  (Join-Path $RepoRoot 'testing-coordination'), # Testing coordination
  (Join-Path $RepoRoot 'test-results'),      # Test results
  (Join-Path $RepoRoot 'test-plugin')        # Test plugin
)

# Expand dynamic test execution/discovery directories
$dynamicDirs = @()
try {
  $dynamicDirs += Get-ChildItem -Path $RepoRoot -Directory -Filter 'test-execution-*' -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName }
  $dynamicDirs += Get-ChildItem -Path $RepoRoot -Directory -Filter 'test-discovery-*' -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName }
} catch { }

# Merge, de-dup, and keep only existing directories
$ScanDirs = @($ScanDirs + $dynamicDirs) | Sort-Object -Unique | Where-Object { Test-Path $_ }

# Print scan directories clearly (avoid concatenated single-line output)
Write-Host "📂 Scan Directories:"
foreach ($sd in $ScanDirs) {
  Write-Host "  - $sd"
}

# Persist scan directories list for auditing
$ScanDirsFile = Join-Path $ArtifactsDir 'test-discovery-dirs.txt'
$ScanDirs | Set-Content -Encoding UTF8 -Path $ScanDirsFile
Write-Host "🧾 Saved scan directories to: $ScanDirsFile"

# Optional: Emit WSL-style directories list
if ($EmitWSL) {
  $ScanDirsWSL = $ScanDirs | ForEach-Object { Convert-ToWSLPath -WinPath $_ }
  $ScanDirsFileWSL = Join-Path $ArtifactsDir 'test-discovery-dirs-wsl.txt'
  $ScanDirsWSL | Set-Content -Encoding UTF8 -Path $ScanDirsFileWSL
  Write-Host "🐧 Saved WSL scan directories to: $ScanDirsFileWSL"
}

# Common test filename patterns
$Patterns = @(
  # General JS/TS
  '*.test.*','*.spec.*','*.bench.*','*.e2e.*','*.int.test.*',
  # C#
  '*Test.cs','*Tests.cs',
  # TS/TSX
  '*.test.ts','*.test.tsx','*.spec.ts','*.spec.tsx',
  # MJS
  '*.test.mjs','*.spec.mjs',
  # Python
  '*test*.py','*spec*.py','*_test.py','test_*.py'
)

# Exclusions
$ExcludeDirs = @('node_modules','.git','bin','obj','dist','build')

$results = New-Object System.Collections.Generic.List[string]

function Get-TestFilesInDir {
  param(
    [string]$Dir
  )
  if (-not (Test-Path $Dir)) { return }

  try {
    # Get all files once, then filter by patterns to avoid -Include quirks
    $files = Get-ChildItem -Path (Join-Path $Dir '*') -Recurse -File -ErrorAction SilentlyContinue |
      Where-Object {
        $full = $_.FullName
        foreach ($ex in $ExcludeDirs) {
          if ($full -like "*\$ex\*") { return $false }
        }
        return $true
      }

    foreach ($f in $files) {
      foreach ($pat in $Patterns) {
        if ($f.Name -like $pat) { $results.Add($f.FullName); break }
      }
    }
  } catch {
    # ignore
  }
}

foreach ($d in $ScanDirs) {
  if (Test-Path $d) {
    Write-Host "🔎 Scanning: $d"
    $before = $results.Count
    Get-TestFilesInDir -Dir $d
    $after = $results.Count
    $added = $after - $before
    Write-Host "   ➕ Found $added matching files in this directory"
  }
}

# Deduplicate and sort
$unique = $results | Sort-Object -Unique
$unique | Set-Content -Encoding UTF8 -Path $ManifestFile

# Optional: per-directory counts
if ($PerDirCounts) {
  $PerDirReport = @()
  foreach ($sd in $ScanDirs) {
    if (-not (Test-Path $sd)) { continue }
    $count = 0
    try {
      $files = Get-ChildItem -Path (Join-Path $sd '*') -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object {
          $full = $_.FullName
          foreach ($ex in $ExcludeDirs) { if ($full -like "*\$ex\*") { return $false } }
          return $true
        }
      foreach ($f in $files) {
        foreach ($pat in $Patterns) { if ($f.Name -like $pat) { $count++; break } }
      }
    } catch { }
    $PerDirReport += ("{0}`t{1}" -f $sd, $count)
  }
  $PerDirFile = Join-Path $ArtifactsDir 'test-per-dir-counts.txt'
  $PerDirReport | Set-Content -Encoding UTF8 -Path $PerDirFile
  Write-Host "🧮 Saved per-directory counts to: $PerDirFile"
}

$total = ($unique | Measure-Object).Count

@(
  'TerraFusion OS - Test Discovery Summary',
  "Generated: $(Get-Date)",
  '',
  "Total tests discovered: $total",
  "Manifest: $ManifestFile",
  '',
  'Next steps:',
  '  - npm test',
  '  - npm run championship:test',
  '  - npm run backend:test',
  '  - npm run frontend:test',
  '  - npm run test:e2e',
  '  - npm run test:integration',
  '  - npm run test:performance',
  '  - npm run test:security',
  '  - npm run test:ai-swarm'
) | Set-Content -Encoding UTF8 -Path $SummaryFile

Write-Host "✅ Discovery complete. Total tests: $total"
Write-Host "📄 Manifest: $ManifestFile"
Write-Host "📄 Summary:  $SummaryFile"
