param([string]$AppName = "terra-permit")
$ErrorActionPreference = "Stop"

Write-Host "--- OPERATION: TARGET ANATOMY SCAN ($AppName) ---" -ForegroundColor Cyan
$Root = (Get-Location).Path
$AppDir = Get-ChildItem -Path "applications" -Filter "*$AppName*" | Select-Object -First 1

if (-not $AppDir) {
    Write-Error "Target application not found in applications/."
    exit 1
}

Write-Host "Target Locked: $($AppDir.FullName)" -ForegroundColor Green

# 1. Detect DNA (Languages)
$HasNode = Test-Path (Join-Path $AppDir.FullName "package.json")
$HasNet = (Get-ChildItem -Path $AppDir.FullName -Recurse -Filter "*.csproj").Count -gt 0
$HasRust = Test-Path (Join-Path $AppDir.FullName "Cargo.toml")
$HasPython = (Get-ChildItem -Path $AppDir.FullName -Recurse -Filter "*.py").Count -gt 0

Write-Host "`n[DNA Analysis]" -ForegroundColor Yellow
Write-Host "Node.js:  $HasNode"
Write-Host ".NET:     $HasNet"
Write-Host "Rust:     $HasRust"
Write-Host "Python:   $HasPython"

# 2. Analyze Integration Points
if ($HasNode) {
    $Pkg = Get-Content (Join-Path $AppDir.FullName "package.json") -Raw | ConvertFrom-Json
    Write-Host "`n[Node.js Metadata]" -ForegroundColor Cyan
    Write-Host "Name:    $($Pkg.name)"
    Write-Host "Version: $($Pkg.version)"
    Write-Host "Scripts: $($Pkg.scripts | ConvertTo-Json -Depth 1 -Compress)"
    
    # Check for build tool
    if ($Pkg.devDependencies.vite) { Write-Host "Build:   Vite Detected" -ForegroundColor Green }
    elseif ($Pkg.devDependencies.webpack) { Write-Host "Build:   Webpack Detected" -ForegroundColor Yellow }
}

# 3. Wiring Recommendation
Write-Host "`n[Engineering Recommendation]" -ForegroundColor Magenta
if ($HasNode -and -not $HasNet) {
    Write-Host "Type: Frontend Module / Node Service"
    Write-Host "Action: Integrate into Frontend Workspace or Docker Compose."
} elseif ($HasNet) {
    Write-Host "Type: Full Stack / Backend Service"
    Write-Host "Action: Verify Solution file and Port bindings."
} elseif ($HasRust) {
    Write-Host "Type: Sovereign Engine"
    Write-Host "Action: Check Tauri config or Cargo build."
}
