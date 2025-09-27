@echo off
title TerraFusionMarket.io - Hostinger Deployment Manager
color 0B

:MENU
cls
echo.
echo ========================================================================
echo           TERRAFUSIONMARKET.IO - HOSTINGER DEPLOYMENT MANAGER
echo ========================================================================
echo.
echo   FTP Server: 82.198.236.1
echo   Username: u240968583.terrafusionmarket.io
echo   Domain: terrafusionmarket.io
echo.
echo ========================================================================
echo.
echo   [1] Build Deployment Package
echo   [2] Deploy via PowerShell FTP (Recommended)
echo   [3] Create FileZilla Configuration
echo   [4] Create Manual Upload Batch
echo   [5] Test FTP Connection
echo   [6] Check Site Status
echo   [7] Setup Cloudflare CDN
echo   [8] Monitor Performance
echo   [9] Full Deployment (Build + Deploy)
echo.
echo   [0] Exit
echo.
echo ========================================================================
echo.
set /p choice="Select Option: "

if "%choice%"=="1" goto BUILD
if "%choice%"=="2" goto DEPLOY
if "%choice%"=="3" goto FILEZILLA
if "%choice%"=="4" goto BATCH
if "%choice%"=="5" goto TEST
if "%choice%"=="6" goto STATUS
if "%choice%"=="7" goto CLOUDFLARE
if "%choice%"=="8" goto MONITOR
if "%choice%"=="9" goto FULL
if "%choice%"=="0" exit

goto MENU

:BUILD
cls
echo.
echo [*] Building Deployment Package...
echo.
powershell -ExecutionPolicy Bypass -File "hostinger\deploy-hostinger.ps1" build
echo.
pause
goto MENU

:DEPLOY
cls
echo.
echo [*] Starting FTP Deployment...
echo.
echo NOTE: You will be prompted for your FTP password
echo.
powershell -ExecutionPolicy Bypass -File "hostinger\deploy-ftp.ps1" deploy
echo.
pause
goto MENU

:FILEZILLA
cls
echo.
echo [*] Creating FileZilla Configuration...
echo.
powershell -ExecutionPolicy Bypass -File "hostinger\deploy-ftp.ps1" filezilla
echo.
echo Import the XML file in FileZilla: File -^> Import Settings
echo.
pause
goto MENU

:BATCH
cls
echo.
echo [*] Creating Manual Upload Batch Script...
echo.
powershell -ExecutionPolicy Bypass -File "hostinger\deploy-ftp.ps1" batch
echo.
echo Run the created batch file to upload manually
echo.
pause
goto MENU

:TEST
cls
echo.
echo [*] Testing FTP Connection...
echo.
powershell -ExecutionPolicy Bypass -File "hostinger\deploy-ftp.ps1" test
echo.
pause
goto MENU

:STATUS
cls
echo.
echo [*] Checking Site Status...
echo.
powershell -ExecutionPolicy Bypass -File "hostinger\deploy-hostinger.ps1" status
echo.
pause
goto MENU

:CLOUDFLARE
cls
echo.
echo [*] Cloudflare CDN Setup Instructions...
echo.
powershell -ExecutionPolicy Bypass -File "hostinger\cloudflare-setup.ps1" setup
echo.
pause
goto MENU

:MONITOR
cls
echo.
echo [*] Monitoring Site Performance...
echo.
powershell -ExecutionPolicy Bypass -File "hostinger\deploy-hostinger.ps1" monitor
echo.
pause
goto MENU

:FULL
cls
echo.
echo [*] FULL DEPLOYMENT PROCESS
echo =============================
echo.
echo Step 1: Building package...
powershell -ExecutionPolicy Bypass -File "hostinger\deploy-hostinger.ps1" build
echo.
echo Step 2: Testing connection...
powershell -ExecutionPolicy Bypass -File "hostinger\deploy-ftp.ps1" test
echo.
echo Step 3: Starting deployment...
echo NOTE: Enter your FTP password when prompted
echo.
powershell -ExecutionPolicy Bypass -File "hostinger\deploy-ftp.ps1" deploy
echo.
echo Deployment process complete!
echo.
pause
goto MENU
