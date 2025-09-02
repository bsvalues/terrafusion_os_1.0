@echo off
REM TerraFusion OS 1.0 Windows Deployment Script
REM Migrated from Enterprise Installer

setlocal enabledelayedexpansion

echo ========================================
echo TerraFusion OS 1.0 Windows Deployment
echo ========================================

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script requires administrator privileges
    echo Please run as administrator
    pause
    exit /b 1
)

REM Set deployment variables
set INSTALL_DIR=C:\Program Files\TerraFusion OS
set DATA_DIR=C:\ProgramData\TerraFusion
set SERVICE_NAME=TerraFusionOS

echo Checking system requirements...

REM Check Windows version
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
if "%VERSION%" lss "10.0" (
    echo ERROR: Windows 10 or higher required
    pause
    exit /b 1
)

REM Check available disk space (minimum 10GB)
for /f "tokens=3" %%a in ('dir /-c %SystemDrive%\ ^| find "bytes free"') do set FREESPACE=%%a
set /a FREESPACE_GB=%FREESPACE:~0,-9%
if %FREESPACE_GB% lss 10 (
    echo ERROR: Insufficient disk space. 10GB required, %FREESPACE_GB%GB available
    pause
    exit /b 1
)

echo System requirements met. Proceeding with installation...

REM Create installation directories
echo Creating installation directories...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%DATA_DIR%\logs" mkdir "%DATA_DIR%\logs"
if not exist "%DATA_DIR%\database" mkdir "%DATA_DIR%\database"

REM Install .NET 8.0 Runtime if not present
echo Checking .NET 8.0 Runtime...
dotnet --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Installing .NET 8.0 Runtime...
    powershell -Command "Invoke-WebRequest -Uri 'https://download.microsoft.com/download/6/0/f/60f856b2-ec1b-4c5c-bc4d-9905b8f2f0a5/dotnet-runtime-8.0.0-win-x64.exe' -OutFile 'dotnet-runtime.exe'"
    dotnet-runtime.exe /quiet
    del dotnet-runtime.exe
)

REM Install Node.js if not present
echo Checking Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Installing Node.js...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi' -OutFile 'nodejs.msi'"
    msiexec /i nodejs.msi /quiet
    del nodejs.msi
)

REM Copy application files
echo Copying application files...
xcopy /E /I /Y "%~dp0..\backend" "%INSTALL_DIR%\backend"
xcopy /E /I /Y "%~dp0..\frontend" "%INSTALL_DIR%\frontend"
xcopy /E /I /Y "%~dp0..\scripts" "%INSTALL_DIR%\scripts"

REM Install Windows Service
echo Installing TerraFusion OS service...
sc create "%SERVICE_NAME%" binPath= "\"%INSTALL_DIR%\backend\TerraFusion.API.exe\"" start= auto
sc description "%SERVICE_NAME%" "TerraFusion OS Backend Service"

REM Create desktop shortcuts
echo Creating desktop shortcuts...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%PUBLIC%\Desktop\TerraFusion OS.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\scripts\start-dev.bat'; $Shortcut.Save()"

REM Configure firewall
echo Configuring Windows Firewall...
netsh advfirewall firewall add rule name="TerraFusion OS Backend" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="TerraFusion OS Frontend" dir=in action=allow protocol=TCP localport=3000

REM Set registry entries
echo Setting registry entries...
reg add "HKLM\SOFTWARE\TerraFusion\OS" /v "InstallPath" /t REG_SZ /d "%INSTALL_DIR%" /f
reg add "HKLM\SOFTWARE\TerraFusion\OS" /v "Version" /t REG_SZ /d "1.0.0" /f
reg add "HKLM\SOFTWARE\TerraFusion\OS" /v "DataPath" /t REG_SZ /d "%DATA_DIR%" /f

REM Start services
echo Starting TerraFusion OS service...
sc start "%SERVICE_NAME%"

echo ========================================
echo TerraFusion OS 1.0 Installation Complete
echo ========================================
echo.
echo Installation Directory: %INSTALL_DIR%
echo Data Directory: %DATA_DIR%
echo Service Name: %SERVICE_NAME%
echo.
echo Access the application at: http://localhost:3000
echo Backend API at: http://localhost:5000
echo.
echo Desktop shortcut created for easy access.
echo.
pause
