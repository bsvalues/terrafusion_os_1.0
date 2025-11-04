@echo off
title TerraFusion Playground - Enterprise Application Launcher
color 0A

echo.
echo ===============================================
echo  TerraFusion Playground - Starting...
echo  Intelligence That Counties Envy
echo ===============================================
echo.

REM Change to the playground directory
cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo Starting TerraFusion Playground Backend Server...
echo.

REM Start the playground
python start_playground.py

echo.
echo TerraFusion Playground has stopped.
pause 