@echo off
title TerraFusion OS 1.0 - Quick Launch
color 0A

echo.
echo ===============================================
echo   TerraFusion OS 1.0 - Government AI Platform
echo ===============================================
echo.

echo [1] Start Development Environment
echo [2] Run System Validation
echo [3] Run Data Migration
echo [4] Run Module Migration
echo [5] Build Production Version
echo [6] Launch Desktop Shell Only
echo [7] View System Documentation
echo [8] Exit
echo.

set /p choice="Select option (1-8): "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto validate
if "%choice%"=="3" goto migrate_data
if "%choice%"=="4" goto migrate_modules
if "%choice%"=="5" goto build
if "%choice%"=="6" goto electron
if "%choice%"=="7" goto docs
if "%choice%"=="8" goto exit

echo Invalid choice. Please try again.
pause
goto start

:dev
echo.
echo Starting TerraFusion OS Development Environment...
echo Backend: .NET 8.0 API (https://localhost:5001)
echo Frontend: React 18 PWA (http://localhost:3000)
echo.
npm run dev
goto end

:validate
echo.
echo Running System Validation...
powershell -ExecutionPolicy Bypass -File ".\migration\validate-system.ps1" -Verbose
pause
goto start

:migrate_data
echo.
echo Running Data Migration...
powershell -ExecutionPolicy Bypass -File ".\migration\consolidate-data.ps1"
pause
goto start

:migrate_modules
echo.
echo Running Module Migration...
powershell -ExecutionPolicy Bypass -File ".\migration\migrate-modules.ps1"
pause
goto start

:build
echo.
echo Building Production Version...
npm run deploy:windows
pause
goto start

:electron
echo.
echo Launching Desktop Shell...
cd frontend
npm run electron
goto end

:docs
echo.
echo Opening Documentation...
start README.md
start docs\GETTING_STARTED.md
goto start

:exit
echo.
echo Thank you for using TerraFusion OS 1.0!
exit /b 0

:end
pause
