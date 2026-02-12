@echo off
REM TerraFusion cOS CostForge-Integrated Desktop Launcher
REM Quick launcher for Windows desktop environment

echo.
echo 🏛️ TerraFusion cOS - CostForge Integration
echo.

cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.8+
    pause
    exit /b 1
)

REM Launch CostForge-integrated desktop shell
echo 🚀 Launching TerraFusion cOS with CostForge AI...
python desktop/costforge_integrated_shell.py

if errorlevel 1 (
    echo ⚠️ CostForge shell failed, trying advanced shell...
    python desktop/advanced_desktop_shell.py
)

if errorlevel 1 (
    echo ⚠️ Advanced shell failed, trying basic shell...
    python desktop/shell_main.py
)

pause







