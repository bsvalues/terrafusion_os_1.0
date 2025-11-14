Write-Host "🎯 CHAMPIONSHIP DEPLOYMENT - Strategic Service Isolation" -ForegroundColor Cyan
cd "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.API"

# Disable all HarrisPACS-dependent files
Write-Host "📦 Isolating HarrisPACS module..." -ForegroundColor Yellow
$filesToDisable = @(
    "Services\ProductionPACSDataEngine.cs",
    "Controllers\ProductionPACSIntegrationController.cs",
    "Services\IHarrisPACSIntegrationService.cs"
)

foreach ($file in $filesToDisable) {
    if (Test-Path $file) {
        Move-Item $file "$file.disabled" -Force -ErrorAction SilentlyContinue
        Write-Host "  ✅ Disabled $file" -ForegroundColor Green
    }
}

Write-Host "
🔨 Building TerraFusion.API (Core Services)..." -ForegroundColor Cyan
cd ..
dotnet build TerraFusion.API\TerraFusion.API.csproj --no-restore 2>&1 | Select-String "Build succeeded|Build FAILED|^\s+\d+ Error"

Write-Host "
🚀 Starting TerraFusion Backend API..." -ForegroundColor Green
