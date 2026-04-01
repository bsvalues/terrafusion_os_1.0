# TerraFusionGama Production Build Script
# This script creates a production build and prepares for deployment

Write-Host "🏗️ TerraFusionGama Production Build" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan; Write-Host ("=" * 60) -ForegroundColor Cyan

# Clean previous build
Write-Host "🧹 Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Removed .next directory" -ForegroundColor Green
}

# Install dependencies
Write-Host ""
Write-Host "📦 Verifying dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Run build
Write-Host ""
Write-Host "⚡ Building Next.js application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completed successfully" -ForegroundColor Green

# Verify build
Write-Host ""
Write-Host "🔍 Verifying build..." -ForegroundColor Yellow
if (Test-Path ".next/BUILD_ID") {
    $buildId = Get-Content ".next/BUILD_ID"
    Write-Host "✅ Build ID: $buildId" -ForegroundColor Green
}
else {
    Write-Host "❌ BUILD_ID not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Production build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  • Test production build: npm start" -ForegroundColor Gray
Write-Host "  • Launch Electron: electron ." -ForegroundColor Gray
Write-Host "  • Deploy to Vercel: vercel --prod" -ForegroundColor Gray
