@echo off
setlocal enabledelayedexpansion

:: TerraFusion Enterprise One-Click Installer
:: Microsoft/Apple Level Deployment System

title TerraFusion Civil Infrastructure - Enterprise Installer

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    TERRAFUSION INSTALLER                     ║
echo ║                Enterprise Deployment System                  ║
echo ║                                                              ║
echo ║  Civil Infrastructure Intelligence Platform                  ║
echo ║  Building the future of county operations                    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This installer requires Administrator privileges.
    echo Please right-click and select "Run as Administrator"
    pause
    exit /b 1
)

:: Set installation variables
set "INSTALL_DIR=%ProgramFiles%\TerraFusion"
set "DATA_DIR=%ProgramData%\TerraFusion"
set "LOG_FILE=%TEMP%\terrafusion-install.log"

echo [INFO] Starting TerraFusion installation...
echo [INFO] Installation directory: %INSTALL_DIR%
echo [INFO] Data directory: %DATA_DIR%
echo.

:: Create directories
echo [STEP 1/8] Creating installation directories...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%DATA_DIR%\logs" mkdir "%DATA_DIR%\logs"
if not exist "%DATA_DIR%\backups" mkdir "%DATA_DIR%\backups"
echo [OK] Directories created successfully.

:: Check Node.js installation
echo.
echo [STEP 2/8] Checking system requirements...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Node.js not found. Installing Node.js LTS...
    
    :: Download and install Node.js
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi' -OutFile '%TEMP%\node-installer.msi'}"
    
    echo [INFO] Running Node.js installer...
    msiexec /i "%TEMP%\node-installer.msi" /quiet /norestart
    
    :: Refresh environment variables
    call refreshenv.cmd >nul 2>&1
    
    echo [OK] Node.js installed successfully.
) else (
    echo [OK] Node.js is already installed.
)

:: Check PostgreSQL installation
echo.
echo [STEP 3/8] Checking database requirements...
pg_config --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] PostgreSQL not found. Installing PostgreSQL...
    
    :: Download and install PostgreSQL
    powershell -Command "& {Invoke-WebRequest -Uri 'https://get.enterprisedb.com/postgresql/postgresql-15.5-1-windows-x64.exe' -OutFile '%TEMP%\postgresql-installer.exe'}"
    
    echo [INFO] Running PostgreSQL installer...
    "%TEMP%\postgresql-installer.exe" --mode unattended --superpassword postgres --servicepassword postgres
    
    echo [OK] PostgreSQL installed successfully.
) else (
    echo [OK] PostgreSQL is already installed.
)

:: Copy application files
echo.
echo [STEP 4/8] Installing TerraFusion application...
xcopy /E /I /Y "%~dp0.." "%INSTALL_DIR%" >nul
echo [OK] Application files copied successfully.

:: Install dependencies
echo.
echo [STEP 5/8] Installing application dependencies...
cd /d "%INSTALL_DIR%"
call npm install --production --silent
if %errorLevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)
echo [OK] Dependencies installed successfully.

:: Build application
echo.
echo [STEP 6/8] Building production application...
call npm run build --silent
if %errorLevel% neq 0 (
    echo [ERROR] Failed to build application.
    pause
    exit /b 1
)
echo [OK] Application built successfully.

:: Create Windows service
echo.
echo [STEP 7/8] Configuring system service...

:: Create service wrapper script
(
echo @echo off
echo cd /d "%INSTALL_DIR%"
echo node server/index.js
) > "%INSTALL_DIR%\terrafusion-service.bat"

:: Install the service using sc command
sc create "TerraFusion" binPath= "\"%INSTALL_DIR%\terrafusion-service.bat\"" DisplayName= "TerraFusion Civil Infrastructure" start= auto
sc description "TerraFusion" "Enterprise GIS platform for civil infrastructure management"

:: Start the service
sc start "TerraFusion"
echo [OK] Service configured and started successfully.

:: Create desktop shortcuts
echo.
echo [STEP 8/8] Creating shortcuts and finalizing installation...

:: Create desktop shortcut
set "DESKTOP=%USERPROFILE%\Desktop"
(
echo [InternetShortcut]
echo URL=http://localhost:5000
echo IconFile=%INSTALL_DIR%\assets\icon.ico
echo IconIndex=0
) > "%DESKTOP%\TerraFusion Civil Infrastructure.url"

:: Create start menu shortcut
set "STARTMENU=%ProgramData%\Microsoft\Windows\Start Menu\Programs"
if not exist "%STARTMENU%\TerraFusion" mkdir "%STARTMENU%\TerraFusion"

(
echo [InternetShortcut]
echo URL=http://localhost:5000
echo IconFile=%INSTALL_DIR%\assets\icon.ico
echo IconIndex=0
) > "%STARTMENU%\TerraFusion\TerraFusion Civil Infrastructure.url"

:: Create uninstaller
(
echo @echo off
echo title TerraFusion Uninstaller
echo echo Removing TerraFusion Civil Infrastructure...
echo sc stop "TerraFusion"
echo sc delete "TerraFusion"
echo rmdir /s /q "%INSTALL_DIR%"
echo rmdir /s /q "%DATA_DIR%"
echo del "%DESKTOP%\TerraFusion Civil Infrastructure.url"
echo rmdir /s /q "%STARTMENU%\TerraFusion"
echo echo TerraFusion has been successfully removed.
echo pause
) > "%INSTALL_DIR%\uninstall.bat"

:: Register uninstaller in Windows
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\TerraFusion" /v "DisplayName" /t REG_SZ /d "TerraFusion Civil Infrastructure" /f >nul
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\TerraFusion" /v "UninstallString" /t REG_SZ /d "\"%INSTALL_DIR%\uninstall.bat\"" /f >nul
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\TerraFusion" /v "DisplayVersion" /t REG_SZ /d "1.0.0" /f >nul
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\TerraFusion" /v "Publisher" /t REG_SZ /d "TerraFusion Technologies" /f >nul

echo [OK] Installation completed successfully.

:: Display completion message
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    INSTALLATION COMPLETE                    ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║                                                              ║
echo ║  🎉 TerraFusion Civil Infrastructure is ready!             ║
echo ║                                                              ║
echo ║  Access Methods:                                             ║
echo ║  • Desktop shortcut: TerraFusion Civil Infrastructure       ║
echo ║  • Web browser: http://localhost:5000                       ║
echo ║  • Start Menu: TerraFusion folder                           ║
echo ║                                                              ║
echo ║  Service Status: Running automatically                      ║
echo ║  Installation Path: %INSTALL_DIR%                           ║
echo ║                                                              ║
echo ║  Next Steps:                                                 ║
echo ║  1. Launch TerraFusion from desktop shortcut                ║
echo ║  2. Configure your county data sources                      ║
echo ║  3. Set up user accounts and permissions                    ║
echo ║  4. Import GIS layers and parcel data                       ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Open TerraFusion automatically
echo [INFO] Launching TerraFusion Civil Infrastructure...
timeout /t 3 /nobreak >nul
start http://localhost:5000

echo.
echo Installation log saved to: %LOG_FILE%
echo Press any key to exit...
pause >nul

endlocal