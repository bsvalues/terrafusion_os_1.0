param(
  [string]$Root = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

function NowStamp { Get-Date -Format "yyyyMMdd_HHmmss" }

# Hard exclusions (we do not scan noise)
$Exclude = "\\(node_modules|bin|obj|dist|\.git|_ARCHIVE|stubs|root_history)\\"

$OutDir = Join-Path $Root ("registry\deep-sector-scan-" + (NowStamp))
if (-not (Test-Path "registry")) { New-Item -ItemType Directory "registry" | Out-Null }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Write-Host "--- OPERATION: DEEP SECTOR SCAN ---" -ForegroundColor Cyan
Write-Host ("Root: " + $Root) -ForegroundColor Gray
Write-Host ("Output: " + $OutDir) -ForegroundColor Gray

# -----------------------------
# 1) GOVERNMENT / MODULE ROOT DISCOVERY (marker-based)
# -----------------------------
Write-Host "`n[1/3] Scanning module roots (marker-based)..." -ForegroundColor Yellow

$markerFiles = @(
  "tf.plugin.json",
  "module.json",
  "project.json",
  "nx.json",
  "*.csproj",
  "*.sln",
  "package.json",
  "Cargo.toml"
)

$files = @()
foreach ($m in $markerFiles) {
  $files += Get-ChildItem -Path $Root -Recurse -File -Filter $m -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch $Exclude }
}

# Determine module roots
$moduleRoots = $files |
  Select-Object -ExpandProperty DirectoryName -Unique |
  Sort-Object

# Classify by top-level folder
function TopLevel([string]$full) {
  $rel = $full.Replace($Root, "").TrimStart("\")
  if ($rel -match "^[^\\]+") { return $Matches[0] }
  return "(root)"
}

$moduleRows = foreach ($d in $moduleRoots) {
  $top = TopLevel $d
  [PSCustomObject]@{
    TopLevel = $top
    Path = $d.Replace($Root, ".")
  }
}

$moduleRows | Export-Csv -NoTypeInformation -Path (Join-Path $OutDir "MODULE_ROOTS.csv")
$moduleCount = $moduleRows.Count
Write-Host ("✅ Module roots discovered: " + $moduleCount) -ForegroundColor Green

# -----------------------------
# 2) RUST CRATE CATALOG (Cargo.toml)
# -----------------------------
Write-Host "`n[2/3] Scanning Rust crates (Cargo.toml)..." -ForegroundColor Yellow

$cargos = Get-ChildItem -Path $Root -Recurse -File -Filter "Cargo.toml" -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch $Exclude }

function ReadCrateName([string]$cargoPath) {
  try {
    $txt = Get-Content $cargoPath -Raw
    # crude but effective regex for TOML name
    if ($txt -match '(?ms)^\s*name\s*=\s*"(.*?)"\s*$') { return $Matches[1] }
  } catch {}
  return ""
}

function RustCategory([string]$path) {
  $p = ($path -replace "\\","/").ToLowerInvariant()
  if ($p -match "/src-tauri/") { return "tauri-shell" }
  if ($p -match "/backend/") { return "backend-rust" }
  if ($p -match "/os-platform/") { return "os-platform-rust" }
  if ($p -match "/tools/") { return "tooling-rust" }
  if ($p -match "/deployment/") { return "deployment-rust" }
  if ($p -match "/archive/") { return "archived-rust" }
  return "other-rust"
}

$crateRows = foreach ($c in $cargos) {
  $name = ReadCrateName $c.FullName
  [PSCustomObject]@{
    Category = RustCategory $c.FullName
    CrateName = $name
    Path = $c.FullName.Replace($Root, ".")
    Directory = (Split-Path $c.FullName -Parent).Replace($Root, ".")
  }
}

$crateRows | Export-Csv -NoTypeInformation -Path (Join-Path $OutDir "RUST_CRATES.csv")
$crateCount = $crateRows.Count
Write-Host ("✅ Rust crates discovered: " + $crateCount) -ForegroundColor Green

# -----------------------------
# 3) GOVERNMENT CORE DEPTH
# -----------------------------
Write-Host "`n[3/3] Locating Government Core (deep)..." -ForegroundColor Yellow

# Search for likely gov-core roots
$govCandidates = @(
  "marketplace\government-core",
  "modules\government-core",
  "applications\government-core",
  "os-platform\government-core",
  "terrafusion-cos\cama"
) | ForEach-Object { Join-Path $Root $_ } | Where-Object { Test-Path $_ }

$govReport = @()
foreach ($g in $govCandidates) {
  $dirs = Get-ChildItem -Path $g -Recurse -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch $Exclude }
  $govReport += [PSCustomObject]@{
    Candidate = $g.Replace($Root, ".")
    DirectoryCount = $dirs.Count
  }
}

$govReport | Export-Csv -NoTypeInformation -Path (Join-Path $OutDir "GOV_CORE_CANDIDATES.csv")
Write-Host "✅ Gov Core Candidates scanned." -ForegroundColor Green

# -----------------------------
# Write Manifest
# -----------------------------
$md = @()
$md += "# Deep Sector Scan Manifest"
$md += ""
$md += "**Generated:** $(Get-Date)"
$md += ""
$md += "## Summary"
$md += "- Module roots discovered: **$moduleCount**"
$md += "- Rust crates discovered: **$crateCount**"
$md += ""
$md += "## Module Roots by Top-Level"
$moduleRows | Group-Object TopLevel | Sort-Object Count -Descending | ForEach-Object {
  $md += "- **$($_.Name)**: $($_.Count)"
}
$md += ""
$md += "## Rust Crates by Category"
$crateRows | Group-Object Category | Sort-Object Count -Descending | ForEach-Object {
  $md += "- **$($_.Name)**: $($_.Count)"
}
$md += ""
$md += "## Gov Core Candidates"
$govReport | ForEach-Object {
    $md += "- **$($_.Candidate)**: $($_.DirectoryCount) subdirectories"
}

$mdPath = Join-Path $OutDir "DEEP_SECTOR_MANIFEST.md"
$md -join "`n" | Set-Content -Path $mdPath -Encoding UTF8

Write-Host "`n📄 Manifest written: $mdPath" -ForegroundColor Cyan
Write-Host "DONE." -ForegroundColor Cyan
