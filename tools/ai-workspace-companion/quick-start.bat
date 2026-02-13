@echo off
REM TerraFusion OS 1.0 AI Workspace Companion Agent - Quick Start Script (Windows)
REM This script automatically installs dependencies and launches your AI companion

echo 🚀 TERRAFUSION OS 1.0 AI WORKSPACE COMPANION AGENT
echo ==================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: This script must be run from the ai-workspace-companion directory
    echo    Please run: cd ai-workspace-companion ^&^& quick-start.bat
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed
    echo    Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% lss 18 (
    echo ❌ Error: Node.js version 18+ is required
    echo    Current version: 
    node --version
    echo    Please upgrade Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version
echo ✅ npm version: 
npm --version
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully
echo.

REM Check if ts-node is available
npx ts-node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: ts-node is not available
    echo    Please install ts-node: npm install -g ts-node
    pause
    exit /b 1
)

echo ✅ ts-node is available
echo.

REM Launch the companion agent
echo 🤖 Launching AI Workspace Companion Agent...
echo    Press Ctrl+C to stop the agent
echo.

REM Launch with development mode for better debugging
call npm run companion:dev

pause
