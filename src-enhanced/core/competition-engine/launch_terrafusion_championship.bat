@echo off
REM #######################################################################
REM TerraFusion Championship Launch Script (Windows)
REM Government. Transcended.
REM 
REM This script launches the complete TerraFusion County OS with all
REM 14 applications accessible through the Marketplace launcher
REM #######################################################################

setlocal EnableDelayedExpansion

REM Colors for output (Windows)
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
echo    ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██╔══╝  ██║   ██║╚════██║██║██║   ██║██║╚██╗██║
echo    ██║   ███████╗██║  ██║██║  ██║██║  ██║██║     ╚██████╔╝███████║██║╚██████╔╝██║ ╚████║
echo    ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
echo %NC%
echo %PURPLE%                           Government. Transcended.%NC%
echo %CYAN%                          Championship Edition 2025%NC%
echo.

REM Check if we're in the correct directory
if not exist "src-tauri\Cargo.toml" (
    echo %RED%[ERROR]%NC% Not in TerraFusion Championship directory!
    echo %RED%[ERROR]%NC% Please run this script from the championship directory
    pause
    exit /b 1
)

echo %GREEN%[INFO]%NC% Directory structure verified

REM Check for npm
where npm >nul 2>nul
if errorlevel 1 (
    echo %RED%[ERROR]%NC% npm is required but not installed
    pause
    exit /b 1
)

REM Check for cargo
where cargo >nul 2>nul
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Rust/Cargo is required but not installed
    pause
    exit /b 1
)

echo %GREEN%[INFO]%NC% Dependencies verified

REM Handle command line arguments
if "%1"=="--quick" goto QUICK_LAUNCH
if "%1"=="--verify" goto VERIFY_APPS
if "%1"=="--build" goto BUILD_ONLY
if "%1"=="--help" goto SHOW_HELP

REM Full launch sequence
:FULL_LAUNCH
echo %BLUE%============================================%NC%
echo %BLUE% Setting Up Dependencies%NC%
echo %BLUE%============================================%NC%

echo %GREEN%[INFO]%NC% Installing frontend dependencies...
call npm install --silent
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Failed to install frontend dependencies
    pause
    exit /b 1
)

echo %GREEN%[INFO]%NC% Installing Rust dependencies...
cd src-tauri
cargo fetch --quiet
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Failed to install Rust dependencies
    pause
    exit /b 1
)
cd ..

echo %BLUE%============================================%NC%
echo %BLUE% Building TerraFusion County OS%NC%
echo %BLUE%============================================%NC%

echo %GREEN%[INFO]%NC% Building frontend...
call npm run build --silent
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Frontend build failed
    pause
    exit /b 1
)

echo %GREEN%[INFO]%NC% Building Rust backend...
cd src-tauri
cargo build --quiet
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Rust backend build failed
    pause
    exit /b 1
)
cd ..

echo %GREEN%[INFO]%NC% ✓ TerraFusion County OS built successfully

goto VERIFY_AND_LAUNCH

:VERIFY_APPS
echo %BLUE%============================================%NC%
echo %BLUE% Verifying TerraFusion Applications%NC%
echo %BLUE%============================================%NC%

set verified_count=0
for %%a in (01-terra-agent 02-terra-flow 03-web-audit-tracker 04-terra-levy 05-terra-miner 06-terra-fusion-sync 07-gispro 08-costforge-ai 09-property-workbench 10-terra-insight 11-terra-fusion-dashboard 12-terra-fusion-assessor 13-marketplace 14-terra-collections) do (
    if exist "apps\%%a" (
        echo %GREEN%[INFO]%NC% ✓ %%a verified
        set /a verified_count+=1
    ) else (
        echo %YELLOW%[WARNING]%NC% ⚠ %%a directory not found
    )
)

echo %GREEN%[INFO]%NC% Verified !verified_count!/14 applications

if !verified_count! equ 14 (
    echo %GREEN%[INFO]%NC% 🏆 All 14 TerraFusion applications verified!
)

if "%1"=="--verify" (
    pause
    exit /b 0
)
goto SYSTEM_INFO

:BUILD_ONLY
goto FULL_LAUNCH

:VERIFY_AND_LAUNCH
call :VERIFY_APPS

:SYSTEM_INFO
echo %BLUE%============================================%NC%
echo %BLUE% TerraFusion System Information%NC%
echo %BLUE%============================================%NC%

echo %CYAN%Main Executable:%NC% src-tauri\target\debug\terrafusion-county-os.exe
echo %CYAN%Primary Interface:%NC% Marketplace Launcher (App #13)
echo %CYAN%Commission Model:%NC% 30%% marketplace revenue
echo %CYAN%Total Applications:%NC% 14 (all hot-swappable modules)
echo %CYAN%Branding:%NC% Transcendence - Government. Transcended.
echo %CYAN%Colors:%NC% Cosmic Blue (#0891b2), Quantum Teal (#00d2ff), Neural Purple (#667eea)
echo.

if "%1"=="--build" (
    echo %GREEN%[INFO]%NC% 🏆 Build complete! Use --quick to launch.
    pause
    exit /b 0
)

:LAUNCH_APP
echo %BLUE%============================================%NC%
echo %BLUE% Launching TerraFusion Championship System%NC%
echo %BLUE%============================================%NC%

echo %GREEN%[INFO]%NC% Starting TerraFusion County OS with Marketplace launcher...
echo %GREEN%[INFO]%NC% The marketplace will serve as the master control center
echo %GREEN%[INFO]%NC% All 14 applications will be accessible as hot-swappable modules
echo.
echo %PURPLE%🚀 Launching Government. Transcended. 🚀%NC%
echo.

cd src-tauri
if exist "target\debug\terrafusion-county-os.exe" (
    start "" "target\debug\terrafusion-county-os.exe"
    echo %GREEN%[INFO]%NC% TerraFusion County OS launched successfully!
) else (
    echo %RED%[ERROR]%NC% Executable not found! Please build first.
    pause
    exit /b 1
)
cd ..
goto END

:QUICK_LAUNCH
echo %BLUE%============================================%NC%
echo %BLUE% TerraFusion Championship Quick Launch%NC%
echo %BLUE%============================================%NC%
echo %GREEN%[INFO]%NC% Skipping build steps - launching existing executable...

cd src-tauri
if exist "target\debug\terrafusion-county-os.exe" (
    start "" "target\debug\terrafusion-county-os.exe"
    echo %GREEN%[INFO]%NC% TerraFusion County OS launched successfully!
) else (
    echo %RED%[ERROR]%NC% No executable found! Run without --quick to build first.
    pause
    exit /b 1
)
cd ..
goto END

:SHOW_HELP
echo %CYAN%TerraFusion Championship Launch Script%NC%
echo.
echo Usage: %0 [OPTIONS]
echo.
echo Options:
echo   --quick    Quick launch (skip build steps)
echo   --verify   Verify applications only
echo   --build    Build only (don't launch)
echo   --help     Show this help message
echo.
echo %PURPLE%Government. Transcended.%NC%
pause
goto END

:END
echo.
echo %GREEN%[INFO]%NC% Script completed successfully!
pause