@echo off
title TerraFusion Platform
color 0A

echo.
echo ===============================================
echo    🚀 TERRAFUSION PLATFORM LAUNCHER 🚀
echo ===============================================
echo.
echo Starting TerraFusion - The Future of Property Appraisal!
echo.
echo 📊 Initializing AI agents...
echo 🌐 Starting web server...
echo 📱 Preparing mobile sync...
echo.

cd /d "%~dp0"

echo Platform starting at: http://localhost:3000
echo Admin panel at: http://localhost:8080
echo.
echo ⚠️  Keep this window open while using TerraFusion
echo    Close this window to stop the platform
echo.

REM Wait a moment then open browser
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo 🚀 Opening TerraFusion in your web browser...
echo.

REM Start the platform
if exist terrafusion_rust (
    cd terrafusion_rust
    start /b cargo run --release -- run
    cd ..
)

if exist package.json (
    npm run dev
) else (
    echo Starting basic server...
    if exist server\index.ts (
        node server\index.ts
    ) else (
        echo ⚠️  Server files not found
        echo Please run the installer first
        pause
    )
) 