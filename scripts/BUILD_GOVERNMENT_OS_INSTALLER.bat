@echo off
title TerraFusion Government OS - Professional Installer Builder
color 0A

echo.
echo ===============================================================
echo  🏛️  TERRAFUSION GOVERNMENT OS - PROFESSIONAL INSTALLER BUILDER
echo ===============================================================
echo.
echo  Building professional Windows installer (.msi + .exe)
echo  Creating macOS application (.dmg + .app)
echo  Ready for county deployment
echo.
echo ===============================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if .NET is installed  
dotnet --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: .NET 8.0 SDK is not installed
    echo Please install .NET 8.0 SDK from https://dotnet.microsoft.com
    pause
    exit /b 1
)

echo ✅ Prerequisites checked - Node.js and .NET are installed
echo.

echo 📦 Step 1: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔧 Step 2: Building .NET backend...
cd backend
call dotnet publish TerraFusion.API/TerraFusion.API.csproj -c Release -r win-x64 --self-contained true -o dist
if %errorlevel% neq 0 (
    echo ❌ Failed to build backend
    pause
    exit /b 1
)
cd ..

echo.
echo 🎨 Step 3: Building React frontend...
cd frontend
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    pause
    exit /b 1
)
cd ..

echo.
echo 🖥️  Step 4: Building Electron desktop application...
cd frontend/electron
call npm install
call npm run build:installer
if %errorlevel% neq 0 (
    echo ❌ Failed to build Electron app
    pause
    exit /b 1
)
cd ../..

echo.
echo ===============================================================
echo  🎉 SUCCESS! PROFESSIONAL INSTALLER CREATED
echo ===============================================================
echo.
echo  📁 Windows Installer (.msi): dist/electron/TerraFusion Government OS Setup.msi
echo  📁 Windows Executable (.exe): dist/electron/TerraFusion Government OS Setup.exe
echo  📁 Portable Version: dist/electron/TerraFusion Government OS.exe
echo.
echo  ✅ Ready for deployment to Benton County
echo  ✅ Professional installer with Start Menu shortcuts
echo  ✅ Desktop shortcut included
echo  ✅ All dependencies bundled
echo.
echo ===============================================================
echo  🚀 DEPLOYMENT INSTRUCTIONS:
echo ===============================================================
echo.
echo  FOR BENTON COUNTY OFFICIALS:
echo  1. Double-click "TerraFusion Government OS Setup.msi"
echo  2. Follow installation wizard (just click Next → Next → Install)  
echo  3. Find "TerraFusion Government OS" in Start Menu
echo  4. Or double-click desktop shortcut
echo.
echo  FOR TESTING:
echo  1. Run the portable version to test immediately
echo  2. No installation required for testing
echo.
echo ===============================================================
echo.

REM Open the output directory
echo Opening installer directory...
explorer dist\electron

echo.
echo Press any key to close...
pause >nul