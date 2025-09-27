@echo off
:: TerraFusion Ultimate Control Center
:: One-click management for everything

color 0B
cls

echo.
echo ================================================================================
echo                     TERRAFUSION ULTIMATE CONTROL CENTER                        
echo                         AI-Powered Laptop Management                           
echo                           50,000+ AI Agents Ready                              
echo ================================================================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:MENU
echo.
echo   [1] Show System Status          - Complete health check
echo   [2] Optimize Everything         - AI-powered optimization  
echo   [3] Start All Services          - Launch TerraFusion empire
echo   [4] Stop All Services           - Shutdown everything
echo   [5] Create Backup               - Safety first
echo   [6] Monitor Mode                - Real-time monitoring
echo   [7] AI Assistant                - Talk to TerraFusion AI
echo   [8] Quick Fix                   - Auto-fix common issues
echo   [9] Update Everything           - Keep system current
echo   [0] Advanced Management         - PowerShell interface
echo.
echo   [Q] Quit
echo.
echo ================================================================================

set /p choice="Select option: "

if "%choice%"=="1" goto STATUS
if "%choice%"=="2" goto OPTIMIZE
if "%choice%"=="3" goto START
if "%choice%"=="4" goto STOP
if "%choice%"=="5" goto BACKUP
if "%choice%"=="6" goto MONITOR
if "%choice%"=="7" goto AI
if "%choice%"=="8" goto FIX
if "%choice%"=="9" goto UPDATE
if "%choice%"=="0" goto ADVANCED
if /i "%choice%"=="Q" goto END

echo Invalid choice. Please try again.
timeout /t 2 >nul
cls
goto MENU

:STATUS
echo.
echo [*] Checking system status...
powershell -ExecutionPolicy Bypass -File "management\terrafusion-auto-manager.ps1" status
pause
cls
goto MENU

:OPTIMIZE
echo.
echo [*] Running AI optimization...
powershell -ExecutionPolicy Bypass -File "management\terrafusion-auto-manager.ps1" optimize
pause
cls
goto MENU

:START
echo.
echo [*] Starting all TerraFusion services...
powershell -ExecutionPolicy Bypass -File "management\terrafusion-auto-manager.ps1" start all
echo.
echo [+] All services started! Opening dashboard...
timeout /t 3 >nul
start http://localhost:\${{TF_API_PORT:-5000}}
start http://localhost:\${{TF_API_PORT:-5000}}
pause
cls
goto MENU

:STOP
echo.
echo [*] Stopping all services...
powershell -ExecutionPolicy Bypass -File "management\terrafusion-auto-manager.ps1" stop
pause
cls
goto MENU

:BACKUP
echo.
echo [*] Creating backup...
powershell -ExecutionPolicy Bypass -File "management\terrafusion-auto-manager.ps1" backup
pause
cls
goto MENU

:MONITOR
echo.
echo [*] Starting monitoring mode (Press Ctrl+C to stop)...
powershell -ExecutionPolicy Bypass -File "management\terrafusion-auto-manager.ps1" monitor
cls
goto MENU

:AI
echo.
set /p command="Tell AI what to do: "
powershell -ExecutionPolicy Bypass -File "management\terrafusion-auto-manager.ps1" ai "%command%"
pause
cls
goto MENU

:FIX
echo.
echo [*] Running auto-fix...
powershell -ExecutionPolicy Bypass -File "management\terrafusion-auto-manager.ps1" ai "fix all issues"
pause
cls
goto MENU

:UPDATE
echo.
echo [*] Checking and installing updates...
powershell -ExecutionPolicy Bypass -File "management\terrafusion-auto-manager.ps1" update
powershell -ExecutionPolicy Bypass -File "management\terrafusion-auto-manager.ps1" update install
pause
cls
goto MENU

:ADVANCED
echo.
echo [*] Opening PowerShell management interface...
start powershell -NoExit -ExecutionPolicy Bypass -Command "cd '%~dp0'; .\management\terrafusion-auto-manager.ps1 help"
cls
goto MENU

:END
echo.
echo ================================================================================
echo                        TERRAFUSION EMPIRE NEVER SLEEPS                         
echo                              See you soon, Commander!                          
echo ================================================================================
echo.
timeout /t 3 >nul
exit
