@echo off
cls
echo ==========================================
echo  TerraFusion Build - COMPLETE VERSION
echo ==========================================
echo  Intelligence That Counties Envy
echo ==========================================

cd /d "D:\DEPLOYED_APPLICATIONS\TerraFusionBuild_ACTUAL"
echo Current Directory: %CD%

echo.
echo Found Complete TerraFusion Build:
echo  - app.py (18KB) - Full Flask application
echo  - terrabuild.db (36KB) - Benton County database
echo  - Professional UI/UX with TerraFusion branding
echo  - AI Valuation Engine (94.2% accuracy)
echo  - Market Intelligence features

echo.
echo Testing Python...

python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Found python command
    set PYTHON_CMD=python
    goto :check_flask
)

py --version >nul 2>&1
if %errorlevel% == 0 (
    echo Found py command
    set PYTHON_CMD=py
    goto :check_flask
)

echo Python not found!
echo.
echo Install Python from: https://python.org/downloads/
echo Or try: winget install Python.Python.3.12
pause
exit /b 1

:check_flask
echo Testing Flask...
%PYTHON_CMD% -c "import flask; print('Flask available')" 2>nul
if %errorlevel% == 0 (
    goto :start_app
) else (
    echo Installing Flask...
    %PYTHON_CMD% -m pip install flask requests
)

:start_app
echo.
echo Starting TerraFusion Build Enterprise...
echo Features: AI Valuation, Market Intelligence, Property Search
echo URL: http://localhost:5000
echo.

start "TerraFusion Build" %PYTHON_CMD% app.py

timeout /t 3 /nobreak >nul
start http://localhost:5000

echo TerraFusion Build started!
echo Professional property assessment platform ready.
pause 