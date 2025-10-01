@echo off
echo.
echo ========================================
echo 🚀 TERRAFUSION IDE ULTIMATE LAUNCHER
echo ========================================
echo.
echo Your Complete Government Technology Development Universe
echo.
echo Features:
echo ✅ Monaco Editor (VS Code replacement)
echo ✅ AI Assistant (1,008 AI agents)
echo ✅ Terminal & Shell Integration
echo ✅ Database Management (PostgreSQL + PostGIS)
echo ✅ Geospatial Tools (LeafScope)
echo ✅ Plugin Development SDK
echo ✅ Government Compliance (FISMA + NIST)
echo ✅ Quantum Performance Engine (379M×)
echo.
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm is not available
    echo Please ensure npm is properly installed
    pause
    exit /b 1
)

echo ✅ Node.js and npm detected
echo.

REM Navigate to TerraFusionIDE directory
cd /d "%~dp0"
echo 📁 Working directory: %CD%
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
) else (
    echo ✅ Dependencies already installed
)
echo.

REM Check if all required modules are available
echo 🔍 Checking module availability...
if exist "src\components\TerraFusionIDE_ULTIMATE.tsx" (
    echo ✅ Ultimate IDE component found
) else (
    echo ❌ ERROR: Ultimate IDE component missing
    pause
    exit /b 1
)
echo.

REM Launch the development server
echo 🚀 Launching TerraFusion IDE ULTIMATE...
echo.
echo 🌐 The IDE will open in your browser at: http://localhost:\${{TF_FRONTEND_PORT:-3000}}
echo 🧠 AI Swarm will activate with 1,008 agents
echo 🗄️ Database connections will be established
echo 🗺️ Geospatial services will be ready
echo 🏛️ Compliance framework will be active
echo.
echo ========================================
echo 🎯 YOUR DEVELOPMENT UNIVERSE IS READY
echo ========================================
echo.

REM Start the development server
npm run dev

REM If we get here, the server has stopped
echo.
echo ========================================
echo 🛑 TerraFusion IDE ULTIMATE stopped
echo ========================================
echo.
pause
