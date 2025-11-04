@echo off
setlocal enabledelayedexpansion

echo TerraFusion Backend Startup Script
echo ===============================

REM Security checks
if not exist "%APPDATA%\TerraFusion\security\cert.pem" (
    echo Security certificates not found. Please run security-setup.bat first.
    exit /b 1
)

REM Environment validation
if not defined NODE_ENV (
    set NODE_ENV=production
)

REM Port validation
set PORT=4000
netstat -ano | findstr ":%PORT%" >nul
if not errorlevel 1 (
    echo Port %PORT% is already in use. Please free up the port or modify the configuration.
    exit /b 1
)

REM Database connection check
echo Checking database connection...
node scripts/check-db.js
if errorlevel 1 (
    echo Database connection failed. Please check configuration.
    exit /b 1
)

REM Start backend with security measures
echo Starting TerraFusion Backend...
start /B npm run start:backend -- --port %PORT% --https --cert "%APPDATA%\TerraFusion\security\cert.pem" --key "%APPDATA%\TerraFusion\security\key.pem"

REM Health check
timeout /t 10 /nobreak
curl -k https://localhost:%PORT%/health
if errorlevel 1 (
    echo Backend failed to start properly. Check logs for details.
    exit /b 1
)

echo Backend started successfully on port %PORT% 