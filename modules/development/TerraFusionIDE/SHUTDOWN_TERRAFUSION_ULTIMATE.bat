@echo off
title TerraFusion Ultimate IDE - Graceful Shutdown
color 0C

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                    🛑 TERRAFUSION ULTIMATE IDE 🛑                           ║
echo ║                           GRACEFUL SHUTDOWN                                 ║
echo ║                                                                              ║
echo ║  "Safely stopping all services and preserving your work"                   ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

echo 🔍 Checking for running TerraFusion services...
echo.

REM Check for backend API
netstat -an | findstr ":5000" >nul 2>&1
if %errorlevel% equ 0 (
    echo 🔌 Backend API detected on port 5000
    set "BACKEND_RUNNING=true"
) else (
    echo ℹ️  Backend API not running
    set "BACKEND_RUNNING=false"
)

REM Check for frontend IDE
netstat -an | findstr ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo 🌐 Frontend IDE detected on port 5173
    set "FRONTEND_RUNNING=true"
) else (
    echo ℹ️  Frontend IDE not running
    set "FRONTEND_RUNNING=false"
)

if "%BACKEND_RUNNING%"=="false" && "%FRONTEND_RUNNING%"=="false" (
    echo.
    echo ℹ️  No TerraFusion services are currently running.
    echo.
    pause
    exit /b 0
)

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                           🛑 SHUTDOWN SEQUENCE                             ║
echo ╚══════════════════════════════════════════════════════════════════════════════╗
echo.

REM Step 1: Stop Frontend IDE
if "%FRONTEND_RUNNING%"=="true" (
    echo [1/2] 🛑 Stopping Frontend IDE...
    echo.
    echo Terminating React development server on port 5173...
    
    REM Find and kill the frontend process
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173"') do (
        echo Stopping process PID: %%a
        taskkill /PID %%a /F >nul 2>&1
    )
    
    echo ⏳ Waiting for frontend to stop...
    timeout /t 3 /nobreak >nul
    
    REM Verify frontend stopped
    netstat -an | findstr ":5173" >nul 2>&1
    if %errorlevel% neq 0 (
        echo ✅ Frontend IDE stopped successfully
    ) else (
        echo ⚠️  Frontend may still be running, please check manually
    )
) else (
    echo [1/2] ✅ Frontend IDE not running
)

echo.

REM Step 2: Stop Backend API
if "%BACKEND_RUNNING%"=="true" (
    echo [2/2] 🛑 Stopping Backend API...
    echo.
    echo Terminating .NET API on port 5000...
    
    REM Find and kill the backend process
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000"') do (
        echo Stopping process PID: %%a
        taskkill /PID %%a /F >nul 2>&1
    )
    
    echo ⏳ Waiting for backend to stop...
    timeout /t 5 /nobreak >nul
    
    REM Verify backend stopped
    netstat -an | findstr ":5000" >nul 2>&1
    if %errorlevel% neq 0 (
        echo ✅ Backend API stopped successfully
    ) else (
        echo ⚠️  Backend may still be running, please check manually
    )
) else (
    echo [2/2] ✅ Backend API not running
)

echo.

REM Final verification
echo 🔍 Final verification of service status...
echo.

netstat -an | findstr ":5000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ Backend API still running on port 5000
    set "BACKEND_STILL_RUNNING=true"
) else (
    echo ✅ Backend API confirmed stopped
    set "BACKEND_STILL_RUNNING=false"
)

netstat -an | findstr ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ Frontend IDE still running on port 5173
    set "FRONTEND_STILL_RUNNING=true"
) else (
    echo ✅ Frontend IDE confirmed stopped
    set "FRONTEND_STILL_RUNNING=false"
)

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                           🎯 SHUTDOWN STATUS                               ║
echo ╚══════════════════════════════════════════════════════════════════════════════╗
echo.

if "%BACKEND_STILL_RUNNING%"=="false" && "%FRONTEND_STILL_RUNNING%"=="false" (
    echo 🎉 All TerraFusion services stopped successfully!
    echo.
    echo ✅ Backend API: Stopped
    echo ✅ Frontend IDE: Stopped
    echo.
    echo 🚀 Ready for next launch with START_TERRAFUSION_ULTIMATE.bat
) else (
    echo ⚠️  Some services may still be running:
    echo.
    if "%BACKEND_STILL_RUNNING%"=="true" (
        echo ❌ Backend API: Still running on port 5000
    ) else (
        echo ✅ Backend API: Stopped
    )
    
    if "%FRONTEND_STILL_RUNNING%"=="true" (
        echo ❌ Frontend IDE: Still running on port 5173
    ) else (
        echo ✅ Frontend IDE: Stopped
    )
    echo.
    echo 💡 You may need to manually stop these services or restart your computer.
)

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                           🔧 TROUBLESHOOTING                               ║
echo ╚══════════════════════════════════════════════════════════════════════════════╗
echo.
echo If services are still running:
echo 1. Open Task Manager (Ctrl+Shift+Esc)
echo 2. Look for processes named "dotnet" or "node"
echo 3. End those processes manually
echo 4. Or restart your computer for a complete cleanup
echo.

echo Press any key to exit...
pause >nul

exit /b 0
