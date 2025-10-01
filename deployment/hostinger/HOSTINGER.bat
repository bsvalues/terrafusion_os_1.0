@echo off
:: TerraFusionMarket.io - Hostinger Manager
:: One-click deployment and management

color 0B
title TerraFusionMarket.io - Hostinger Control

cls
echo.
echo ========================================================================
echo                    TERRAFUSIONMARKET.IO - HOSTINGER                    
echo                         Cloud Deployment Manager                        
echo ========================================================================
echo.

:MENU
echo.
echo   [1] Check Site Status      [5] Setup Analytics
echo   [2] Build for Deploy       [6] Monitor Performance
echo   [3] Deploy to Hostinger    [7] Setup GitHub Deploy
echo   [4] Setup CDN              [8] Full Setup
echo.
echo   [Q] Quit
echo.
echo ========================================================================
set /p choice="Select: "

if "%choice%"=="1" (
    echo.
    powershell -ExecutionPolicy Bypass -File "hostinger\deploy-to-hostinger.ps1" status
    pause
    cls
    goto MENU
)

if "%choice%"=="2" (
    echo.
    powershell -ExecutionPolicy Bypass -File "hostinger\deploy-to-hostinger.ps1" build
    pause
    cls
    goto MENU
)

if "%choice%"=="3" (
    echo.
    powershell -ExecutionPolicy Bypass -File "hostinger\deploy-to-hostinger.ps1" deploy
    pause
    cls
    goto MENU
)

if "%choice%"=="4" (
    echo.
    powershell -ExecutionPolicy Bypass -File "hostinger\deploy-to-hostinger.ps1" cdn
    pause
    cls
    goto MENU
)

if "%choice%"=="5" (
    echo.
    powershell -ExecutionPolicy Bypass -File "hostinger\deploy-to-hostinger.ps1" analytics
    pause
    cls
    goto MENU
)

if "%choice%"=="6" (
    echo.
    powershell -ExecutionPolicy Bypass -File "hostinger\deploy-to-hostinger.ps1" monitor
    pause
    cls
    goto MENU
)

if "%choice%"=="7" (
    echo.
    powershell -ExecutionPolicy Bypass -File "hostinger\deploy-to-hostinger.ps1" github
    pause
    cls
    goto MENU
)

if "%choice%"=="8" (
    echo.
    echo [*] Running FULL SETUP...
    powershell -ExecutionPolicy Bypass -File "hostinger\deploy-to-hostinger.ps1" full
    pause
    cls
    goto MENU
)

if /i "%choice%"=="Q" exit

echo [!] Invalid choice
timeout /t 2 >nul
cls
goto MENU
