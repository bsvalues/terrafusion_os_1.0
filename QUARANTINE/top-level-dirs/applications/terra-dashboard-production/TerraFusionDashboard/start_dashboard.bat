@echo off
title TerraFusion Executive Command Center Dashboard
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
echo                          Your Ported Terminal Dashboard
echo.
echo ═══════════════════════════════════════════════════════════════════════════════════════════
echo 🚀 Starting TerraFusion Executive Command Center Dashboard...
echo 📊 Application Cards ^& Launch Controls
echo 📈 Auto-Refreshing Status Displays  
echo 🎮 Interactive Command Hub
echo ═══════════════════════════════════════════════════════════════════════════════════════════

REM Set environment variables
set NODE_ENV=development
set DATABASE_URL=sqlite:terrafusion.db
set JWT_SECRET=dev-secret
set SESSION_SECRET=session-secret
set PORT=5000

echo.
echo 🔧 Environment: %NODE_ENV%
echo 💾 Database: SQLite (Local)
echo 🌐 Port: %PORT%
echo.

echo ⏳ Initializing dashboard components...
echo.

REM Start the dashboard
echo 🚀 Launching TerraFusion Executive Command Center Dashboard...
start "Dashboard Browser" http://localhost:5000
npx tsx server/index.ts

pause 