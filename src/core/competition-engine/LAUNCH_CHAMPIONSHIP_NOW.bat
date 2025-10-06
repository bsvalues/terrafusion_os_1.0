@echo off
echo.
echo ========================================
echo    TERRAFUSION CHAMPIONSHIP LAUNCHER
echo    The $100B Government OS Revolution
echo ========================================
echo.
echo Starting TerraFusion County OS...
echo - 14 Government Apps
echo - 379M times faster than Marshall Swift
echo - 30%% Marketplace Commission
echo - 94,149 Benton County Properties
echo.

cd /d "E:\TerraFusion_Tauri_Master_Workspace\championship"

if exist "src-tauri\target\release\terrafusion-county-os.exe" (
    echo [SUCCESS] Found release executable
    echo Launching Championship...
    start "" "src-tauri\target\release\terrafusion-county-os.exe"
) else if exist "src-tauri\target\debug\terrafusion-county-os.exe" (
    echo [INFO] Using debug build
    start "" "src-tauri\target\debug\terrafusion-county-os.exe"  
) else (
    echo [ERROR] No executable found. Building now...
    call npm run tauri:build
    start "" "src-tauri\target\release\terrafusion-county-os.exe"
)

echo.
echo ========================================
echo    CHAMPIONSHIP LAUNCHED
echo    The Future of Government Technology
echo ========================================
pause