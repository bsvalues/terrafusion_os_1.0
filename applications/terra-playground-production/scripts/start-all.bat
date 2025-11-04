@echo off
setlocal enabledelayedexpansion

echo TerraFusion System Startup Script
echo ==============================

REM Check for administrator privileges
net session >nul 2>&1
if errorlevel 1 (
    echo This script requires administrator privileges.
    echo Please run as administrator.
    pause
    exit /b 1
)

REM Load environment variables
if exist ".env" (
    for /f "tokens=*" %%a in (.env) do set %%a
)

REM Security setup check
if not exist "%APPDATA%\TerraFusion\security\cert.pem" (
    echo Running security setup...
    call scripts\security-setup.bat
    if errorlevel 1 (
        echo Security setup failed. Please check logs.
        exit /b 1
    )
)

REM Start components in order
echo Starting TerraFusion components...

REM Start backend first
echo Starting backend...
call scripts\start-backend.bat
if errorlevel 1 (
    echo Backend startup failed.
    exit /b 1
)

REM Start frontend
echo Starting frontend...
call scripts\start-frontend.bat
if errorlevel 1 (
    echo Frontend startup failed.
    exit /b 1
)

REM Start AI agents
echo Starting AI agents...
call scripts\start-agents.bat
if errorlevel 1 (
    echo AI agents startup failed.
    exit /b 1
)

REM System health check
echo Performing system health check...
node scripts\health-check.js
if errorlevel 1 (
    echo System health check failed. Please check logs.
    exit /b 1
)

echo TerraFusion system started successfully!
echo Frontend: https://localhost:3000
echo Backend: https://localhost:4000
echo AI Agents: https://localhost:5000

REM Keep console window open
pause 