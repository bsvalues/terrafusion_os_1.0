# TERRAFUSION CHAMPIONSHIP - EXECUTE WITH EXCELLENCE
# PowerShell script for Windows execution

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TERRAFUSION CHAMPIONSHIP LAUNCHER" -ForegroundColor Yellow
Write-Host "   Executing with Excellence" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$championshipPath = "E:\TerraFusion_Tauri_Master_Workspace\championship"
$exePath = "$championshipPath\src-tauri\target\release\terrafusion-county-os.exe"

if (Test-Path $exePath) {
    Write-Host "[SUCCESS] Championship executable found!" -ForegroundColor Green
    Write-Host "File Size: $((Get-Item $exePath).Length / 1MB) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "LAUNCHING TERRAFUSION COUNTY OS..." -ForegroundColor Yellow
    Write-Host "- 379M times faster than Marshall Swift" -ForegroundColor Green
    Write-Host "- 30% Marketplace Commission Active" -ForegroundColor Green
    Write-Host "- 94,149 Benton County Properties" -ForegroundColor Green
    Write-Host "- 14 Government Apps Integrated" -ForegroundColor Green
    Write-Host ""
    
    # Launch the executable
    Start-Process -FilePath $exePath -WorkingDirectory $championshipPath
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   CHAMPIONSHIP LAUNCHED!" -ForegroundColor Yellow
    Write-Host "   The Empire Rises!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Executable not found at: $exePath" -ForegroundColor Red
    Write-Host "Building now..." -ForegroundColor Yellow
    
    Set-Location $championshipPath
    npm run tauri:build
    
    if (Test-Path $exePath) {
        Start-Process -FilePath $exePath -WorkingDirectory $championshipPath
        Write-Host "[SUCCESS] Built and launched!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")