#!/usr/bin/env pwsh
<#
.SYNOPSIS
  TerraFusion Full-Stack Application Launcher

.DESCRIPTION
  Starts the complete integrated full-stack application:
  - React Frontend (http://localhost:5173)
  - Rust Backend (http://localhost:8787)
  - PostgreSQL Database
  - Redis Cache

.PARAMETER Environment
  Development or Production (default: development)

.PARAMETER BuildFresh
  Rebuild Docker images from scratch

.EXAMPLE
  .\start-full-stack.ps1
  .\start-full-stack.ps1 -Environment production -BuildFresh
#>

param(
  [string]$Environment = "development",
  [switch]$BuildFresh = $false
)

$ErrorActionPreference = "Stop"
$PSStyle.OutputRendering = [System.Management.Automation.OutputRendering]::Ansi

# Colors
$cyan = "`e[36m"
$green = "`e[32m"
$yellow = "`e[33m"
$red = "`e[31m"
$reset = "`e[0m"

Write-Host "$cyan
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     🚀 TERRAFUSION FULL-STACK APPLICATION LAUNCHER 🚀        ║
║                                                                ║
║  React Frontend (5173) + Rust Backend (8787) + DB + Cache    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
$reset" -NoNewline

Write-Host "$green✓$reset Environment: $Environment" -ForegroundColor Cyan
Write-Host "$green✓$reset Build Fresh: $(if ($BuildFresh) { 'Yes' } else { 'No' })" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check prerequisites
Write-Host "$yellow[1/5]$reset Checking prerequisites..." -ForegroundColor Yellow

$checks = @(
  @{ Name = "Docker"; Command = { docker --version } },
  @{ Name = "Docker Compose"; Command = { docker compose version } }
)

foreach ($check in $checks) {
  try {
    $output = & $check.Command 2>&1
    Write-Host "$green✓$reset $($check.Name): $(($output -split '\n')[0])" -ForegroundColor Green
  }
  catch {
    Write-Host "$red✗$reset $($check.Name) not found!" -ForegroundColor Red
    exit 1
  }
}

Write-Host ""

# Step 2: Install frontend dependencies
Write-Host "$yellow[2/5]$reset Installing frontend dependencies..." -ForegroundColor Yellow

if (Test-Path "./frontend/node_modules" -PathType Container) {
  Write-Host "$green✓$reset Dependencies already installed" -ForegroundColor Green
}
else {
  try {
    Push-Location "./frontend"
    npm install --silent | Out-Null
    Pop-Location
    Write-Host "$green✓$reset Dependencies installed" -ForegroundColor Green
  }
  catch {
    Write-Host "$red✗$reset Failed to install dependencies" -ForegroundColor Red
    exit 1
  }
}

Write-Host ""

# Step 3: Build or pull images
Write-Host "$yellow[3/5]$reset $(if ($BuildFresh) { 'Building Docker images' } else { 'Pulling Docker images' })..." -ForegroundColor Yellow

try {
  if ($BuildFresh) {
    Write-Host "  Building backend image..." -ForegroundColor Cyan
    docker build -f Dockerfile.backend -t terrafusion-ide-backend:latest . | Out-Null
    Write-Host "  Building frontend image..." -ForegroundColor Cyan
    docker build -f frontend/Dockerfile -t terrafusion-frontend:latest . | Out-Null
    Write-Host "$green✓$reset Images built successfully" -ForegroundColor Green
  }
  else {
    Write-Host "$green✓$reset Using existing images" -ForegroundColor Green
  }
}
catch {
  Write-Host "$red✗$reset Failed to build images" -ForegroundColor Red
  exit 1
}

Write-Host ""

# Step 4: Start services
Write-Host "$yellow[4/5]$reset Starting TerraFusion services..." -ForegroundColor Yellow

try {
  # Stop any existing containers first
  Write-Host "  Stopping existing containers..." -ForegroundColor Cyan
  docker compose -f docker-compose.full-stack.yml down --remove-orphans 2>$null | Out-Null

  # Start new containers
  Write-Host "  Starting services..." -ForegroundColor Cyan
  docker compose -f docker-compose.full-stack.yml up -d

  Write-Host "$green✓$reset Services started" -ForegroundColor Green
}
catch {
  Write-Host "$red✗$reset Failed to start services" -ForegroundColor Red
  exit 1
}

Write-Host ""

# Step 5: Verify services
Write-Host "$yellow[5/5]$reset Verifying services..." -ForegroundColor Yellow

$services = @(
  @{ Name = "Backend API"; Port = 8787; Path = "/api/health" },
  @{ Name = "Frontend"; Port = 5173; Path = "/" }
)

$maxAttempts = 30
$attempt = 0

foreach ($service in $services) {
  $healthy = $false

  Write-Host "  Checking $($service.Name)..." -ForegroundColor Cyan

  while ($attempt -lt $maxAttempts -and -not $healthy) {
    try {
      $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)$($service.Path)" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
      if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 304) {
        $healthy = $true
      }
    }
    catch {
      $attempt++
      Start-Sleep -Seconds 1
    }
  }

  if ($healthy) {
    Write-Host "$green✓$reset $($service.Name) is healthy (http://localhost:$($service.Port)$($service.Path))" -ForegroundColor Green
  }
  else {
    Write-Host "$red✗$reset $($service.Name) failed to start" -ForegroundColor Red
  }

  $attempt = 0
}

Write-Host ""
Write-Host "$cyan
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║       ✅ TERRAFUSION FULL-STACK APPLICATION IS RUNNING ✅    ║
║                                                                ║
║  Frontend:  http://localhost:5173  (React IDE)               ║
║  Backend:   http://localhost:8787  (Rust API)                ║
║  Database:  localhost:5432         (PostgreSQL)              ║
║  Cache:     localhost:6379         (Redis)                   ║
║                                                                ║
║  TRY THIS: Click 'Run Task' in the UI to test integration    ║
║                                                                ║
║  Stop services:  docker compose -f docker-compose.full-stack.yml down
║  View logs:      docker compose -f docker-compose.full-stack.yml logs -f
║                                                                ║
║         Government. Transcended. ✨                          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
$reset"

# Show logs
Write-Host ""
Write-Host "Showing live logs (press Ctrl+C to stop)..." -ForegroundColor Yellow
Write-Host ""

docker compose -f docker-compose.full-stack.yml logs -f
