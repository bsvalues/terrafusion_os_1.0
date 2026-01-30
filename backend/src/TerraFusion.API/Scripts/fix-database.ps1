# Database Fix Script for TerraFusion OS
# Purpose: Fix migration conflicts and clean duplicate modules

Write-Host "🔧 TerraFusion Database Fix Script" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# Stop the API if running
Write-Host "`n📦 Stopping TerraFusion API..." -ForegroundColor Yellow
$apiProcess = Get-Process dotnet -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*TerraFusion.API*"}
if ($apiProcess) {
    $apiProcess | Stop-Process -Force
    Write-Host "✅ API stopped" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

# Backup database
$dbPath = "terrafusion.db"
$backupPath = "terrafusion_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').db"

if (Test-Path $dbPath) {
    Write-Host "`n📂 Creating database backup..." -ForegroundColor Yellow
    Copy-Item $dbPath $backupPath
    Write-Host "✅ Backup created: $backupPath" -ForegroundColor Green
}

# Delete the problematic database to start fresh
Write-Host "`n🗑️  Removing corrupted database..." -ForegroundColor Yellow
if (Test-Path $dbPath) {
    Remove-Item $dbPath -Force
    Write-Host "✅ Old database removed" -ForegroundColor Green
}

# Remove migrations history
if (Test-Path "Migrations") {
    Write-Host "`n🧹 Cleaning migration files..." -ForegroundColor Yellow
    Remove-Item "Migrations" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Migration files cleaned" -ForegroundColor Green
}

Write-Host "`n✨ Database reset complete!" -ForegroundColor Green
Write-Host "   Run 'dotnet run' to recreate with clean migrations" -ForegroundColor Cyan
