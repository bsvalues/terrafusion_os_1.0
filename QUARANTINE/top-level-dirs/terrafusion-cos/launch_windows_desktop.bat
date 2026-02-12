@echo off
REM TerraFusion cOS Windows Desktop Launcher
REM Professional Government Operating System with CostForge Integration
REM "Government. Transcended."

echo.
echo ================================================================
echo   🏛️ TerraFusion cOS - Government Operating System
echo   Professional Desktop Shell with CostForge AI Integration
echo   "Government. Transcended."
echo ================================================================
echo.

REM Set working directory to TerraFusion cOS
cd /d "%~dp0"

REM Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.8+ and try again.
    echo    Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/update dependencies
echo 📚 Installing TerraFusion cOS dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Install additional desktop dependencies
echo 🖥️ Installing desktop shell dependencies...
pip install tkinter matplotlib pillow numpy requests
if errorlevel 1 (
    echo ⚠️ Some desktop dependencies failed to install, continuing...
)

REM Check CostForge integration
echo 🔍 Checking CostForge AI integration...
if exist "costforge_ai_terrafusion_module.py" (
    echo ✅ CostForge AI module found
) else (
    echo ⚠️ CostForge AI module not found
)

REM Launch TerraFusion cOS Desktop Shell
echo.
echo 🚀 Launching TerraFusion cOS Desktop Shell...
echo    Desktop Shell: Advanced Native Interface
echo    CostForge Integration: Active
echo    Security Level: Government Grade
echo.

REM Launch the advanced desktop shell with CostForge integration
python desktop/advanced_desktop_shell.py

REM If the above fails, try the basic shell
if errorlevel 1 (
    echo ⚠️ Advanced shell failed, trying basic shell...
    python desktop/shell_main.py
)

REM If both fail, show error
if errorlevel 1 (
    echo ❌ Failed to launch desktop shell
    echo.
    echo Troubleshooting:
    echo 1. Ensure Python 3.8+ is installed
    echo 2. Check that all dependencies are installed
    echo 3. Verify tkinter is available (usually included with Python)
    echo 4. Try running: python -c "import tkinter; print('tkinter OK')"
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ TerraFusion cOS Desktop Shell closed
pause







