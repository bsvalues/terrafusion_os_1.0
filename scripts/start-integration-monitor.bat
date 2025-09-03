@echo off
REM #######################################################################
REM TerraFusion OS 1.0 - Integration Monitor Starter
REM Keeps EVERYTHING working together as one unified system
REM #######################################################################

setlocal EnableDelayedExpansion

REM Colors for output
set "RED=[91m"
set "GREEN=[92m"
set "BLUE=[94m"
set "CYAN=[96m"
set "YELLOW=[93m"
set "PURPLE=[95m"
set "NC=[0m"

echo %CYAN%
echo ████████╗███████╗██████╗ ██████╗  █████╗ ███████╗██╗   ██╗███████╗██╗ ██████╗ ███╗   ██╗
echo ╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║   ██║██╔════╝██║██╔═══██╗████╗  ██║
echo    ██║   █████╗  ██████╔╝██████╔╝███████║█████╗  ██║   ██║███████╗██║██║   ██║██╔██╗ ██║
echo    ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██╔══╝  ██║   ██║╚════██╗██║██║   ██║██║╚██╗██║
echo    ██║   ███████╗██║  ██║██║  ██║██║  ██║██║     ╚██████╔╝███████╗██║╚██████╔╝██║ ╚████║
echo    ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
echo %NC%
echo %PURPLE%                           Government. Transcended.%NC%
echo %CYAN%                          OS Integration Monitor%NC%
echo.

echo %BLUE%============================================%NC%
echo %BLUE% Starting TerraFusion OS Integration Monitor%NC%
echo %BLUE%============================================%NC%

echo %GREEN%[INFO]%NC% Checking Node.js installation...
where node >nul 2>nul
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Node.js is required but not installed
    echo %YELLOW%[INFO]%NC% Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo %GREEN%[INFO]%NC% Node.js found

echo %GREEN%[INFO]%NC% Starting TerraFusion OS Integration Monitor...
echo %YELLOW%[INFO]%NC% This will monitor how EVERYTHING works together as one unified system
echo.

REM Change to the scripts directory and run the monitor
cd /d "%~dp0"
node terrafusion-os-integration-monitor.js

echo.
echo %GREEN%[INFO]%NC% Integration monitor stopped
echo %YELLOW%[INFO]%NC% Thank you for keeping TerraFusion OS unified! 🏆
pause
