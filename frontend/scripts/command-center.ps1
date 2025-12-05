Param(
    [string]$Env = "dev",
    [switch]$DryRun
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Resolve-Path "$scriptDir/../.."

# Run everything from the frontend root so relative paths work as expected
Set-Location "$rootDir/frontend"

# Pick the package manager: prefer pnpm if available, otherwise fall back to npm
$packageManager = $null
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    $packageManager = "pnpm"
} elseif (Get-Command npm -ErrorAction SilentlyContinue) {
    $packageManager = "npm"
} else {
    Write-Error "No supported package manager found. Install pnpm or npm and try again."
    exit 1
}

# Lightweight install on first run
if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules not found. Installing dependencies with $packageManager..." -ForegroundColor Yellow
    if ($packageManager -eq "pnpm") {
        pnpm install
    } else {
        npm install
    }
}

# Surface the desired environment to the dev server if needed
$env:NODE_ENV = $Env

Write-Host "Starting frontend dev server with $packageManager ($Env environment)..." -ForegroundColor Cyan
if ($DryRun) {
    Write-Host "Dry run enabled. Skipping dev server launch." -ForegroundColor Yellow
    exit 0
}

if ($packageManager -eq "pnpm") {
    pnpm dev
} else {
    npm run dev
}
