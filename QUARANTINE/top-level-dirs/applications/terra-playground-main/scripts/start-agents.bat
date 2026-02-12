@echo off
setlocal enabledelayedexpansion

echo TerraFusion AI Agents Startup Script
echo =================================

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
set PORT=5000
netstat -ano | findstr ":%PORT%" >nul
if not errorlevel 1 (
    echo Port %PORT% is already in use. Please free up the port or modify the configuration.
    exit /b 1
)

REM API key validation
if not defined TERRAFUSION_API_KEY (
    echo API key not found. Please set TERRAFUSION_API_KEY environment variable.
    exit /b 1
)

REM Start agents with security measures
echo Starting TerraFusion AI Agents...
start /B npm run start:agents -- --port %PORT% --https --cert "%APPDATA%\TerraFusion\security\cert.pem" --key "%APPDATA%\TerraFusion\security\key.pem"

REM Health check
timeout /t 10 /nobreak
curl -k https://localhost:%PORT%/health
if errorlevel 1 (
    echo Agents failed to start properly. Check logs for details.
    exit /b 1
)

echo AI Agents started successfully on port %PORT% 