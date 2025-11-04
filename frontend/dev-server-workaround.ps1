# TerraFusion Development Server Workaround
# Addresses Vite port binding issues in Windows environment

Write-Host "🏛️ TerraFusion OS - Development Server Startup" -ForegroundColor Cyan
Write-Host "Government. Transcended." -ForegroundColor Green

# Build production version
Write-Host "`n📦 Building production assets..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green

    # Start backup HTTP server on port 8002
    Write-Host "`n🚀 Starting backup development server on port 8002..." -ForegroundColor Yellow

    # Navigate to build output
    Set-Location ../native-shell/ui

    # Start Node.js serve
    npx serve . -l 8002 --single
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
