Write-Host "=== TerraFusion OS System Status Check ===" -ForegroundColor Cyan
Write-Host ""

# Check versions
Write-Host "📦 Checking versions..." -ForegroundColor Yellow
Write-Host "Node: $(node --version)" -ForegroundColor Green
Write-Host "npm: $(npm --version)" -ForegroundColor Green
Write-Host "dotnet: $(dotnet --version)" -ForegroundColor Green
Write-Host ""

# Check Docker
Write-Host "🐳 Checking Docker..." -ForegroundColor Yellow
$dockerStatus = docker ps --format "table {{.Names}}`t{{.Status}}" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker is running" -ForegroundColor Green
    Write-Host $dockerStatus
} else {
    Write-Host "❌ Docker is not running or not installed" -ForegroundColor Red
}
Write-Host ""

# Check PostgreSQL
Write-Host "💾 Checking PostgreSQL..." -ForegroundColor Yellow
$pgStatus = docker exec terrafusion-postgres pg_isready 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL is not running" -ForegroundColor Red
}
Write-Host ""

# Check Redis
Write-Host "📡 Checking Redis..." -ForegroundColor Yellow
$redisStatus = docker exec terrafusion-redis redis-cli ping 2>$null
if ($redisStatus -eq "PONG") {
    Write-Host "✅ Redis is ready" -ForegroundColor Green
} else {
    Write-Host "❌ Redis is not running" -ForegroundColor Red
}
Write-Host ""

# Check backend build
Write-Host "🔨 Checking backend build..." -ForegroundColor Yellow
Set-Location backend 2>$null
$buildOutput = dotnet build --no-restore 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backend builds successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Backend has build errors" -ForegroundColor Red
    $errors = $buildOutput | Select-String "error" | Select-Object -First 5
    $errors | ForEach-Object { Write-Host $_ -ForegroundColor Red }
}
Set-Location .. 2>$null
Write-Host ""

# Check frontend
Write-Host "⚛️ Checking frontend..." -ForegroundColor Yellow
if (Test-Path "frontend/node_modules") {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend dependencies missing" -ForegroundColor Red
}

# Check if frontend is running
$nodeProcess = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcess) {
    Write-Host "✅ Node.js process is running (PID: $($nodeProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "⚠️ No Node.js process found" -ForegroundColor Yellow
}

# Try to access frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend is accessible at http://localhost:3000" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Frontend not accessible at http://localhost:3000" -ForegroundColor Yellow
}
Write-Host ""

# Check backend API
Write-Host "🔌 Checking backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend API is accessible at http://localhost:5000" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Backend API not accessible at http://localhost:5000" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "=== Check Complete ===" -ForegroundColor Cyan
Write-Host ""

# Summary
$issues = @()
if (-not (docker ps 2>$null)) { $issues += "Docker not running" }
if (-not (docker exec terrafusion-postgres pg_isready 2>$null)) { $issues += "PostgreSQL not ready" }
if (-not (docker exec terrafusion-redis redis-cli ping 2>$null)) { $issues += "Redis not ready" }

if ($issues.Count -eq 0) {
    Write-Host "✅ All systems operational!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run 'npm run dev' from root to start full stack" -ForegroundColor White
    Write-Host "2. Access frontend at http://localhost:3000" -ForegroundColor White
    Write-Host "3. Access backend API at http://localhost:5000" -ForegroundColor White
} else {
    Write-Host "⚠️ Issues detected:" -ForegroundColor Yellow
    $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Fix these issues before proceeding." -ForegroundColor Yellow
}
