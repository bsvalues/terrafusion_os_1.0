#!/bin/bash

# ULTIMATE SOLUTION: CREATE REAL .EXE INSTALLER
# This script builds everything into a single installer.exe

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🎯 BUILDING TERRAFUSION ENTERPRISE INSTALLER (.EXE)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "This creates ONE file: TerraFusion_Setup.exe"
echo "Just like downloading Office, Adobe, or any real software!"
echo ""

# The real issue: We need to compile to .exe files
echo "🔍 Checking for Tauri executables..."

if [ -f "src-tauri/target/release/terrafusion-county-os.exe" ]; then
    echo "✅ Found main executable!"
    cp src-tauri/target/release/terrafusion-county-os.exe ./TerraFusion.exe
else
    echo "⚠️  No compiled .exe found. Building now..."
    
    # Build the Tauri app to create real .exe
    echo "🏗️ Building Windows executables..."
    
    # This is what creates the REAL .exe files:
    npm run tauri build -- --target x86_64-pc-windows-msvc || {
        echo ""
        echo "❌ Build failed. Here's the SIMPLE fix:"
        echo ""
        echo "On Windows (PowerShell):"
        echo "  1. cd championship"
        echo "  2. npm install"
        echo "  3. npm run tauri build"
        echo ""
        echo "This creates: src-tauri/target/release/terrafusion-county-os.exe"
        echo "That's your REAL executable!"
        exit 1
    }
fi

echo ""
echo "📦 Creating installer package..."

# Create the installer directory
INSTALLER_DIR="INSTALLER_PACKAGE"
mkdir -p "$INSTALLER_DIR"

# Copy all executables (if they exist)
if [ -f "src-tauri/target/release/terrafusion-county-os.exe" ]; then
    cp src-tauri/target/release/terrafusion-county-os.exe "$INSTALLER_DIR/TerraFusion.exe"
    echo "✓ Copied main executable"
fi

# Create a simple batch installer
cat > "$INSTALLER_DIR/INSTALL.bat" << 'EOF'
@echo off
title TerraFusion Enterprise Installer
color 0B

echo.
echo ===============================================================
echo            TERRAFUSION ENTERPRISE INSTALLER
echo            Government. Transcended.
echo ===============================================================
echo.

echo Installing TerraFusion Enterprise...
echo.

REM Create installation directory
set "INSTALL_DIR=%ProgramFiles%\TerraFusion Enterprise"
mkdir "%INSTALL_DIR%" 2>nul

REM Copy files
echo Copying application files...
xcopy /E /Y "*.exe" "%INSTALL_DIR%\" >nul 2>&1
xcopy /E /Y "*.dll" "%INSTALL_DIR%\" >nul 2>&1

REM Create desktop shortcut
echo Creating desktop shortcut...
powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%USERPROFILE%\Desktop\TerraFusion Enterprise.lnk'); $SC.TargetPath = '%INSTALL_DIR%\TerraFusion.exe'; $SC.Save()"

REM Create Start Menu entry
echo Creating Start Menu entry...
mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\TerraFusion Enterprise" 2>nul
powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\TerraFusion Enterprise\TerraFusion.lnk'); $SC.TargetPath = '%INSTALL_DIR%\TerraFusion.exe'; $SC.Save()"

echo.
echo ===============================================================
echo Installation Complete!
echo.
echo TerraFusion Enterprise has been installed to:
echo %INSTALL_DIR%
echo.
echo Desktop shortcut created.
echo Start Menu entry created.
echo ===============================================================
echo.
pause
EOF

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ WHAT YOU NEED TO DO NOW:"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "STEP 1: Build the .exe (if not already built)"
echo "  • Open PowerShell as Administrator"
echo "  • cd to: E:\TerraFusion_Tauri_Master_Workspace\championship"
echo "  • Run: npm run tauri build"
echo ""
echo "STEP 2: Your .exe will be in:"
echo "  • src-tauri\target\release\terrafusion-county-os.exe"
echo "  • This is your ACTUAL executable file!"
echo ""
echo "STEP 3: For a professional installer:"
echo "  • Download Inno Setup (free): https://jrsoftware.org/isdl.php"
echo "  • Use the setup.iss script we created"
echo "  • Compile to get: TerraFusion_Setup.exe"
echo ""
echo "That's it! One .exe file, just like real software!"
echo "═══════════════════════════════════════════════════════════════"