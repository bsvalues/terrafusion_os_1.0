@echo off
title TerraFusion Executive Command Center Dashboard - FIXED
color 0B

echo.
echo ████████╗███████╗██████╗ ██████╗  █████╗ ███████╗██╗   ██╗███████╗██╗ ██████╗ ███╗   ██╗
echo ╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║   ██║██╔════╝██║██╔═══██╗████╗  ██║
echo    ██║   █████╗  ██████╔╝██████╔╝███████║█████╗  ██║   ██║███████╗██║██║   ██║██╔██╗ ██║
echo    ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██╔══╝  ██║   ██║╚════██║██║██║   ██║██║╚██╗██║
echo    ██║   ███████╗██║  ██║██║  ██║██║  ██║██║     ╚██████╔╝███████║██║╚██████╔╝██║ ╚████║
echo    ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
echo.
echo                     🌟 EXECUTIVE COMMAND CENTER DASHBOARD 🌟
echo                          FIXED CONFIGURATION VERSION
echo.
echo ═══════════════════════════════════════════════════════════════════════════════════════════
echo 🚀 Starting TerraFusion Executive Command Center Dashboard...
echo 📊 Application Cards ^& Launch Controls
echo 📈 Auto-Refreshing Status Displays  
echo 🎮 Interactive Command Hub
echo ✅ FIXED: Environment variables properly configured
echo ═══════════════════════════════════════════════════════════════════════════════════════════

REM Set ALL required environment variables
set NODE_ENV=development
set DATABASE_URL=sqlite:terrafusion.db
set JWT_SECRET=terrafusion-dev-jwt-secret
set SESSION_SECRET=terrafusion-dev-session-secret
set PORT=5000
set APP_NAME=TerraFusion
set DEFAULT_COUNTY=benton
set ENABLE_AI_AGENTS=true
set ENABLE_WEBSOCKETS=true
set ENABLE_MONITORING=true
set DEBUG_MODE=true
set LOG_LEVEL=info

echo.
echo 🔧 Environment: %NODE_ENV%
echo 💾 Database: SQLite (Local Development)
echo 🌐 Port: %PORT%
echo 🏛️ County: %DEFAULT_COUNTY%
echo 🤖 AI Agents: %ENABLE_AI_AGENTS%
echo.

echo ⏳ Initializing dashboard components...
echo.

REM Create the database file if it doesn't exist
if not exist "terrafusion.db" (
    echo 🗄️ Creating local SQLite database...
    echo. > terrafusion.db
)

REM Start the dashboard
echo 🚀 Launching TerraFusion Executive Command Center Dashboard...
start "Dashboard Browser" http://localhost:5000
npx tsx server/index.ts

pause 