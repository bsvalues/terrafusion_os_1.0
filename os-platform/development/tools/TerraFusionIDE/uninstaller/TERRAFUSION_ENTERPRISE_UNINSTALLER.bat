@echo off
setlocal enabledelayedexpansion

:: TerraFusion IDE ULTIMATE POWER - Enterprise Uninstaller
:: Complete system cleanup and removal

:: Set console title
title TerraFusion IDE ULTIMATE POWER - Enterprise Uninstaller

:: Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ This uninstaller requires administrator privileges
    echo 🌟 Please run as Administrator and try again
    pause
    exit /b 1
)

:: Clear screen and show uninstaller
cls
echo.
echo ========================================
echo 🗑️  TERRAFUSION IDE ULTIMATE POWER 🗑️
echo ========================================
echo 🌟 Enterprise Uninstaller
echo 🌟 Complete System Cleanup and Removal
echo.

echo ⚠️  WARNING: This will completely remove TerraFusion IDE ULTIMATE POWER
echo ⚠️  This includes all data, configurations, and integrations
echo.
echo 🌟 Are you sure you want to proceed with the uninstallation?
echo.
set /p CONFIRM="Type 'YES' to confirm uninstallation: "

if /i not "%CONFIRM%"=="YES" (
    echo.
    echo 🌟 Uninstallation cancelled
    echo 🌟 TerraFusion IDE ULTIMATE POWER remains installed
    pause
    exit /b 0
)

echo.
echo 🚀 Starting enterprise uninstallation...
echo.

:: Stop TerraFusion IDE Service
echo [1/8] 🔧 Stopping TerraFusion IDE Service...
sc stop "TerraFusionIDEService" >nul 2>&1
sc delete "TerraFusionIDEService" >nul 2>&1
echo ✅ TerraFusion IDE Service removed
echo.

:: Remove Desktop Shortcut
echo [2/8] 🖥️  Removing Desktop Shortcut...
if exist "%USERPROFILE%\Desktop\TerraFusion IDE ULTIMATE POWER.lnk" (
    del "%USERPROFILE%\Desktop\TerraFusion IDE ULTIMATE POWER.lnk"
    echo ✅ Desktop shortcut removed
) else (
    echo ℹ️  Desktop shortcut not found
)
echo.

:: Remove Start Menu Entry
echo [3/8] 📁 Removing Start Menu Entry...
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\TerraFusion" (
    rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\TerraFusion"
    echo ✅ Start menu entry removed
) else (
    echo ℹ️  Start menu entry not found
)
echo.

:: Remove File Associations
echo [4/8] 📁 Removing File Associations...
assoc .tf= >nul 2>&1
assoc .gov= >nul 2>&1
assoc .compliance= >nul 2>&1
echo ✅ File associations removed
echo.

:: Remove Registry Entries
echo [5/8] 🗄️  Removing Registry Entries...
reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\TerraFusion" /f >nul 2>&1
echo ✅ Registry entries removed
echo.

:: Remove Environment Variables
echo [6/8] 🌍 Removing Environment Variables...
setx TERRAFUSION_IDE_PATH "" /M >nul 2>&1
setx TERRAFUSION_AI_SWARM "" /M >nul 2>&1
setx TERRAFUSION_COMPLIANCE "" /M >nul 2>&1
echo ✅ Environment variables removed
echo.

:: Remove TerraFusion IDE Files
echo [7/8] 🗂️  Removing TerraFusion IDE Files...
if exist "C:\TerraFusion\IDE" (
    rmdir /s /q "C:\TerraFusion\IDE"
    echo ✅ TerraFusion IDE files removed
) else (
    echo ℹ️  TerraFusion IDE directory not found
)

if exist "C:\TerraFusion" (
    rmdir /s /q "C:\TerraFusion"
    echo ✅ TerraFusion directory removed
)
echo.

:: Optional: Remove Dependencies
echo [8/8] 🔍 Checking for Dependencies...
echo.
echo 🌟 The following enterprise dependencies remain installed:
echo 🌟 You can manually remove them if no longer needed:
echo.

if exist "C:\Program Files\nodejs\node.exe" (
    echo 📦 Node.js Enterprise (LTS)
    echo 🌟 Location: C:\Program Files\nodejs\
    echo 🌟 Command to remove: msiexec /x {nodejs-guid} /quiet
)

if exist "C:\Program Files\Git\bin\git.exe" (
    echo 🔧 Git Enterprise
    echo 🌟 Location: C:\Program Files\Git\
    echo 🌟 Command to remove: C:\Program Files\Git\unins000.exe /VERYSILENT
)

if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    echo 🗄️ PostgreSQL Enterprise + PostGIS
    echo 🌟 Location: C:\Program Files\PostgreSQL\
    echo 🌟 Command to remove: C:\Program Files\PostgreSQL\15\unins000.exe /mode unattended
)

if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    echo 🐳 Docker Desktop Enterprise
    echo 🌟 Location: C:\Program Files\Docker\
    echo 🌟 Command to remove: C:\Program Files\Docker\Docker\Docker Desktop Installer.exe uninstall
)

echo.

:: Uninstallation Complete
echo ========================================
echo 🎯 UNINSTALLATION COMPLETE! 🎯
echo ========================================
echo.
echo 🌟 TerraFusion IDE ULTIMATE POWER has been completely removed
echo 🌟 All shortcuts, services, and integrations have been cleaned up
echo.
echo 🚀 What was removed:
echo   ✅ TerraFusion IDE Service
echo   ✅ Desktop Shortcut
echo   ✅ Start Menu Entry
echo   ✅ File Associations
echo   ✅ Registry Entries
echo   ✅ Environment Variables
echo   ✅ All IDE Files and Directories
echo.
echo 🌟 Dependencies remain installed (see above for removal instructions)
echo 🌟 You can reinstall TerraFusion IDE ULTIMATE POWER at any time
echo.
echo 🚀 Thank you for using TerraFusion IDE ULTIMATE POWER!
echo 🌟 We hope to see you again in the future
echo.
pause
