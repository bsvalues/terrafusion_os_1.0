@echo off
echo 🚀 TerraFusion OS - Cache Clear and Restart Script
echo ================================================
echo.
echo This script will:
echo 1. Clear browser cache instructions
echo 2. Stop any running development servers
echo 3. Clear node modules cache
echo 4. Restart the frontend with fresh modules
echo.

cd /d "%~dp0..\frontend"

echo 📍 Working in: %CD%
echo.

echo 🛑 Stopping any running development servers...
echo    Attempting to stop processes on port \${{TF_FRONTEND_PORT:-3000}}...
netstat -ano | findstr :3000 > nul
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /pid %%a /f > nul 2>&1
    echo    ✅ Stopped processes on port \${{TF_FRONTEND_PORT:-3000}}
) else (
    echo    ℹ️  No process running on port \${{TF_FRONTEND_PORT:-3000}}
)

echo    Attempting to stop processes on port \${{TF_FRONTEND_PORT:-3000}} (Vite)...
netstat -ano | findstr :5173 > nul
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /pid %%a /f > nul 2>&1
    echo    ✅ Stopped processes on port \${{TF_FRONTEND_PORT:-3000}}
) else (
    echo    ℹ️  No process running on port \${{TF_FRONTEND_PORT:-3000}}
)

echo.

echo 🧹 Clearing npm cache...
npm cache clean --force > nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ NPM cache cleared
) else (
    echo    ⚠️  Could not clear npm cache
)

echo 🧹 Clearing Vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite" > nul 2>&1
    echo    ✅ Vite cache cleared
) else (
    echo    ℹ️  No Vite cache found
)

echo.
echo 🌐 BROWSER CACHE CLEARING INSTRUCTIONS:
echo =======================================
echo.
echo To see the updated modules, you MUST clear your browser cache:
echo.
echo 🔥 HARD REFRESH (Recommended):
echo    • Chrome/Firefox/Edge: Ctrl+Shift+R
echo    • Safari: Cmd+Option+R
echo.
echo 🔥 MANUAL CACHE CLEAR:
echo    • Chrome: F12 → Network tab → Right-click reload → 'Empty Cache and Hard Reload'
echo    • Firefox: Ctrl+Shift+Delete → Clear cache
echo    • Edge: Ctrl+Shift+Delete → Clear browsing data
echo.
echo 🔥 INCOGNITO/PRIVATE MODE:
echo    • Open localhost:\${{TF_FRONTEND_PORT:-3000}} in incognito/private browsing mode
echo.

echo 🚀 Starting TerraFusion OS frontend with fresh modules...
echo    Registry Version: 2.1.20250825
echo    Active Modules: 15 production-ready government modules
echo.
echo 📡 Starting development server...
echo    URL will be: http://localhost:\${{TF_FRONTEND_PORT:-3000}}
echo    Click 'Enter TerraFusion OS' to see the updated modules
echo.
echo ⚠️  IMPORTANT: After the server starts, you MUST do a hard refresh in your browser!
echo.

npm run dev

echo.
echo ✅ If you still see old/fake modules after hard refresh:
echo    1. Close browser completely
echo    2. Open new browser window
echo    3. Go to localhost:\${{TF_FRONTEND_PORT:-3000}} in private/incognito mode
echo    4. Click 'Enter TerraFusion OS'
echo    5. You should now see the 15 ACTIVE_MODULES.md registry modules

pause