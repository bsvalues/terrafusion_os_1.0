@echo off
:: TerraFusion Ultimate Launcher
:: One command to rule them all

color 0B
title TerraFusion Control Center

echo.
echo  _____ _____ ____  ____     _     _____ _   _ ____ ___ ___  _   _ 
echo ^|_   _^| ____^|  _ \^|  _ \   / \   ^|  ___^| ^| ^| / ___^|_ _/ _ \^| \ ^| ^|
echo   ^| ^| ^|  _^| ^| ^|_) ^| ^|_) ^| / _ \  ^| ^|_  ^| ^| ^| \___ \^| ^| ^| ^| ^|  \^| ^|
echo   ^| ^| ^| ^|___^|  _ ^<^|  _ ^< / ___ \ ^|  _^| ^| ^|_^| ^|___) ^| ^| ^|_^| ^| ^|\  ^|
echo   ^|_^| ^|_____^|_^| \_\_^| \_/_/   \_\^|_^|    \___/^|____/___\___/^|_^| \_^|
echo.
echo                    AI-POWERED EMPIRE CONTROL
echo.

:MENU
echo ========================================================================
echo.
echo   [1] System Status        [5] Create Backup
echo   [2] Optimize System      [6] Empire Dashboard  
echo   [3] Start Services       [7] Shock and Awe Demo
echo   [4] Fix Issues           [8] Advanced PowerShell
echo.
echo   [Q] Quit
echo.
echo ========================================================================
set /p choice="Select: "

if "%choice%"=="1" (
    powershell -ExecutionPolicy Bypass -File "MANAGE.ps1" status
    pause
    cls
    goto MENU
)

if "%choice%"=="2" (
    powershell -ExecutionPolicy Bypass -File "MANAGE.ps1" optimize
    pause
    cls
    goto MENU
)

if "%choice%"=="3" (
    powershell -ExecutionPolicy Bypass -File "MANAGE.ps1" start
    echo.
    echo [+] Starting backend services...
    cd TerraFusionDevelopment\TerraFusion_Collections\backend
    start cmd /k "python app.py"
    cd ..\..\..
    echo [+] Services starting in background
    pause
    cls
    goto MENU
)

if "%choice%"=="4" (
    powershell -ExecutionPolicy Bypass -File "MANAGE.ps1" fix
    pause
    cls
    goto MENU
)

if "%choice%"=="5" (
    echo [*] Creating backup...
    xcopy /E /I /Y scripts scripts_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2% >nul 2>&1
    xcopy /E /I /Y shock-and-awe shock-and-awe_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2% >nul 2>&1
    echo [+] Backup created!
    pause
    cls
    goto MENU
)

if "%choice%"=="6" (
    echo [*] Opening Empire Dashboard...
    start shock-and-awe\empire-dashboard.html
    cls
    goto MENU
)

if "%choice%"=="7" (
    echo [*] Launching Shock and Awe Demo...
    start shock-and-awe\terrafusion-marketplace-landing.html
    cls
    goto MENU
)

if "%choice%"=="8" (
    start powershell -NoExit -Command "Write-Host 'TerraFusion PowerShell - Type: .\MANAGE.ps1 help' -ForegroundColor Cyan"
    cls
    goto MENU
)

if /i "%choice%"=="Q" exit

echo [!] Invalid choice
timeout /t 2 >nul
cls
goto MENU
