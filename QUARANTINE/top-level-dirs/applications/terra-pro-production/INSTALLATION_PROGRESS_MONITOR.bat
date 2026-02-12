@echo off
title TerraFusion Installation Progress Monitor
color 0E

:MONITOR_LOOP
cls
echo.
echo ===============================================
echo    📊 TERRAFUSION INSTALLATION MONITOR 📊
echo ===============================================
echo.
echo 🔄 REAL-TIME STATUS: Installation is ACTIVE
echo ⏰ Current Time: %TIME%
echo 📅 Date: %DATE%
echo.
echo 🎯 WHAT'S HAPPENING RIGHT NOW:
echo.

REM Check what processes are running
tasklist /FI "IMAGENAME eq choco.exe" 2>nul | find /i "choco.exe" >nul
if %errorLevel% == 0 (
    echo 📦 ✅ Package Manager: Installing software packages...
    echo    Status: ACTIVE - Chocolatey is downloading and installing
    echo    This is normal and may take 5-15 minutes per package
) else (
    echo 📦 ⏸️  Package Manager: Not currently active
)

tasklist /FI "IMAGENAME eq cargo.exe" 2>nul | find /i "cargo.exe" >nul
if %errorLevel% == 0 (
    echo 🤖 ✅ AI Engine: Compiling high-performance components...
    echo    Status: ACTIVE - Rust is building TerraFusion AI
    echo    This is the longest step (10-20 minutes) - PLEASE WAIT!
    echo    ☕ Perfect time for a coffee break!
) else (
    echo 🤖 ⏸️  AI Engine: Not currently compiling
)

tasklist /FI "IMAGENAME eq npm.exe" 2>nul | find /i "npm.exe" >nul
if %errorLevel% == 0 (
    echo 📁 ✅ Dependencies: Installing TerraFusion components...
    echo    Status: ACTIVE - Downloading JavaScript packages
    echo    This may take 5-10 minutes depending on internet speed
) else (
    echo 📁 ⏸️  Dependencies: Not currently installing
)

tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /i "node.exe" >nul
if %errorLevel% == 0 (
    echo 🌐 ✅ Platform: Node.js processes running
    echo    Status: ACTIVE - JavaScript runtime is working
) else (
    echo 🌐 ⏸️  Platform: Node.js not currently active
)

REM Check if main installer is still running
tasklist /FI "IMAGENAME eq cmd.exe" /FI "WINDOWTITLE eq TerraFusion One-Click Installer" 2>nul | find /i "cmd.exe" >nul
if %errorLevel% == 0 (
    echo 🚀 ✅ Main Installer: RUNNING
    echo    Status: ACTIVE - Installation is progressing normally
    echo    Keep both windows open until installation completes
) else (
    echo 🚀 ❓ Main Installer: May have completed or encountered an issue
    echo    Check the main installer window for final status
)

echo.
echo 💡 HELPFUL INFORMATION:
echo.
echo ⏳ Total Expected Time: 15-45 minutes
echo 🔄 Current Phase: Automatic software installation
echo 📊 Progress: Installation is working in the background
echo 🖥️  System Impact: Normal - your computer may run slightly slower
echo.
echo 🎯 SIGNS EVERYTHING IS WORKING:
echo ✅ You see "ACTIVE" status above
echo ✅ Your hard drive light is blinking (if visible)
echo ✅ Internet activity (downloading packages)
echo ✅ CPU usage is elevated (normal during compilation)
echo.
echo 🚨 WHEN TO BE CONCERNED:
echo ❌ No activity for more than 10 minutes
echo ❌ Error messages in the main installer window
echo ❌ Your computer becomes completely unresponsive
echo.
echo 📞 NEED HELP?
echo - Email: support@terrafusion.com
echo - Keep both installer windows open
echo - Take a screenshot if you see errors
echo.
echo ⏰ This monitor updates every 30 seconds...
echo 🔄 Next update in: 30 seconds
echo.
echo Press Ctrl+C to close this monitor (installer will continue)
echo.

timeout /t 30 /nobreak >nul
goto MONITOR_LOOP 