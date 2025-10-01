@echo off
REM 🏆 Benton County Championship Demo Launcher
REM Starts the complete TerraFusion ecosystem

echo 🏆 Starting Benton County Championship Demo...

REM Navigate to demo directory  
cd /d "%~dp0"

REM Check if demo server is already running
curl -s http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/demo/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Demo server already running on port \${{TF_FRONTEND_PORT:-3000}}
) else (
    echo 🚀 Starting demo server...
    start /b node demo-server.js
    
    REM Wait for server to be ready
    echo ⏳ Waiting for demo server to start...
    timeout /t 5 /nobreak >nul
    
    curl -s http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/demo/health >nul 2>&1
    if %errorlevel% == 0 (
        echo ✅ Demo server ready on port \${{TF_FRONTEND_PORT:-3000}}
    ) else (
        echo ❌ Demo server failed to start
        pause
        exit /b 1
    )
)

REM Launch TerraFusion Launcher
echo 🚀 Launching TerraFusion Launcher...
if exist "..\launcher-v3\src-tauri\target\release\terrafusion-launcher.exe" (
    start "" "..\launcher-v3\src-tauri\target\release\terrafusion-launcher.exe"
) else (
    echo ⚠️ TerraFusion Launcher not found
    echo 📖 Opening demo in browser instead...
    start http://localhost:\${{TF_FRONTEND_PORT:-3000}}
)

echo 🏆 Championship Demo Ready!
echo 📊 Demo URL: http://localhost:\${{TF_FRONTEND_PORT:-3000}}
echo 📈 API Endpoints:
echo    - Overview: http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/demo/overview
echo    - Properties: http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/demo/properties
echo    - Scenarios: http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/demo/scenarios
echo    - Marketplace: http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/demo/marketplace
echo    - Monitoring: http://localhost:\${{TF_FRONTEND_PORT:-3000}}/api/monitoring/performance

pause