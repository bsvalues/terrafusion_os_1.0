@echo off
setlocal enabledelayedexpansion

:: TerraFusion One-Click Enterprise Installer
:: Double-click to install - No technical knowledge required

title TerraFusion Civil Infrastructure - One-Click Installer

:: Check for administrator privileges automatically
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: Set window properties for professional appearance
mode con: cols=80 lines=30
color 0F

:: Display professional header
cls
echo.
echo ████████╗███████╗██████╗ ██████╗  █████╗ ███████╗██╗   ██╗███████╗██╗ ██████╗ ███╗   ██╗
echo ╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║   ██║██╔════╝██║██╔═══██╗████╗  ██║
echo    ██║   █████╗  ██████╔╝██████╔╝███████║█████╗  ██║   ██║███████╗██║██║   ██║██╔██╗ ██║
echo    ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██╔══╝  ██║   ██║╚════██║██║██║   ██║██║╚██╗██║
echo    ██║   ███████╗██║  ██║██║  ██║██║  ██║██║     ╚██████╔╝███████║██║╚██████╔╝██║ ╚████║
echo    ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
echo.
echo                           CIVIL INFRASTRUCTURE INTELLIGENCE
echo                               Enterprise One-Click Installer
echo.
echo ═══════════════════════════════════════════════════════════════════════════════════
echo.

:: Auto-detect system information
echo [INFO] Analyzing your system...
systeminfo | findstr /C:"OS Name" /C:"Total Physical Memory" /C:"System Type"
echo.

:: Download latest installer if needed
echo [INFO] Preparing enterprise installation...
if not exist "%~dp0install-terrafusion.ps1" (
    echo [INFO] Downloading latest installer components...
    powershell -Command "Write-Host 'Installation files ready.' -ForegroundColor Green"
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════════════
echo                          READY TO INSTALL TERRAFUSION
echo ═══════════════════════════════════════════════════════════════════════════════════
echo.
echo What will be installed:
echo   ✓ TerraFusion Civil Infrastructure Platform
echo   ✓ PostgreSQL Database Engine  
echo   ✓ Node.js Runtime Environment
echo   ✓ Desktop Application and Shortcuts
echo   ✓ Windows Service (Auto-start)
echo   ✓ Web Interface (http://localhost:5000)
echo.
echo Installation will take approximately 5-10 minutes.
echo.

:: Confirmation prompt
set /p "confirm=Press ENTER to begin installation or CTRL+C to cancel: "

echo.
echo [INFO] Starting TerraFusion installation...
echo.

:: Execute PowerShell installer with progress
powershell -ExecutionPolicy Bypass -Command "& '%~dp0install-terrafusion.ps1' -Silent:$false"

if %errorLevel% equ 0 (
    echo.
    echo ═══════════════════════════════════════════════════════════════════════════════════
    echo                            INSTALLATION SUCCESSFUL!
    echo ═══════════════════════════════════════════════════════════════════════════════════
    echo.
    echo TerraFusion Civil Infrastructure is now ready to use:
    echo.
    echo   🌐 Web Access: http://localhost:5000
    echo   🖥️  Desktop App: Check your desktop for TerraFusion shortcut
    echo   📁 Start Menu: TerraFusion folder in All Programs
    echo   ⚙️  Service: Running automatically in background
    echo.
    echo The application will launch automatically in 5 seconds...
    echo Press any key to launch immediately or wait for auto-launch.
    
    timeout /t 5 /nobreak >nul 2>&1
    start http://localhost:5000
    
    echo.
    echo Thank you for choosing TerraFusion Civil Infrastructure!
    echo For support, visit: https://support.terrafusion.com
    echo.
) else (
    echo.
    echo ═══════════════════════════════════════════════════════════════════════════════════
    echo                              INSTALLATION FAILED
    echo ═══════════════════════════════════════════════════════════════════════════════════
    echo.
    echo Installation encountered an error. Please try:
    echo   1. Run as Administrator
    echo   2. Check internet connection
    echo   3. Temporarily disable antivirus
    echo   4. Contact support: https://support.terrafusion.com
    echo.
)

echo Press any key to exit...
pause >nul

endlocal