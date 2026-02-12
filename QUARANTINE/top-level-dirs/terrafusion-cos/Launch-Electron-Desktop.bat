@echo off
REM TerraFusion cOS Electron Desktop Launcher
REM Professional Government Operating System with CostForge Integration
REM "Government. Transcended."

echo.
echo ================================================================
echo   🏛️ TerraFusion cOS - Government Operating System
echo   Professional Electron Desktop Shell with CostForge AI
echo   "Government. Transcended."
echo ================================================================
echo.

REM Set working directory to TerraFusion cOS
cd /d "%~dp0"

REM Check Node.js installation
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found! Please install Node.js 18+ and try again.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing TerraFusion cOS dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if Electron is installed
npx electron --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Electron...
    npm install electron --save-dev
    if errorlevel 1 (
        echo ❌ Failed to install Electron
        pause
        exit /b 1
    )
)

REM Check if UI files exist
if not exist "ui\index.html" (
    echo ❌ UI files not found! Please ensure ui/index.html exists.
    pause
    exit /b 1
)

REM Check if Electron main file exists
if not exist "electron\main.js" (
    echo ❌ Electron main file not found! Please ensure electron/main.js exists.
    pause
    exit /b 1
)

REM Launch TerraFusion cOS Electron Desktop
echo 🚀 Launching TerraFusion cOS Electron Desktop...
echo    Desktop Shell: Professional Government Interface
echo    CostForge Integration: Active
echo    Security Level: Government Grade
echo    Framework: Electron
echo.

REM Launch Electron
npx electron .

REM Handle exit
if errorlevel 1 (
    echo ❌ TerraFusion cOS Electron Desktop failed to launch
    echo.
    echo Troubleshooting:
    echo 1. Ensure Node.js 18+ is installed
    echo 2. Check that all dependencies are installed (npm install)
    echo 3. Verify UI files exist in ui/ directory
    echo 4. Check Electron main file exists in electron/ directory
    echo 5. Try running: npx electron --version
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ TerraFusion cOS Electron Desktop closed
pause







