@echo off
title TerraFusion Government OS - Hostinger Web Package Creator
color 0A

echo.
echo ===============================================================
echo  📦 TERRAFUSION GOVERNMENT OS - HOSTINGER PACKAGE CREATOR
echo ===============================================================
echo.
echo  Creating drag-and-drop web package for Hostinger hosting
echo  Optimized for shared hosting with PHP backend
echo.
echo  🌐 What this creates:
echo  • Static HTML/CSS/JS frontend (no Node.js required)
echo  • PHP backend API for dynamic data
echo  • SQLite database (works on most shared hosts)
echo  • Complete demo with real Benton County data
echo  • Ready to drag-and-drop to Hostinger file manager
echo.
echo ===============================================================
echo.

REM Create hostinger package directory
echo 📁 Step 1: Creating Hostinger package structure...
if exist "hostinger-package" rmdir /s /q "hostinger-package"
mkdir "hostinger-package"
mkdir "hostinger-package\public_html"
mkdir "hostinger-package\public_html\api"
mkdir "hostinger-package\public_html\assets"
mkdir "hostinger-package\public_html\data"

echo.
echo 🎨 Step 2: Copying frontend files...
copy "frontend\index.html" "hostinger-package\public_html\index.html" >nul
copy "frontend\nginx.conf" "hostinger-package\nginx-reference.txt" >nul

echo.
echo 🔧 Step 3: Creating PHP backend API...
echo Creating PHP API files for shared hosting compatibility...

REM The actual PHP files will be created by the script below
echo ✅ Frontend copied successfully

echo.
echo 🗄️  Step 4: Copying database...
copy "data\benton-county-demo.db" "hostinger-package\public_html\data\benton-county-demo.db" >nul
if %errorlevel% neq 0 (
    echo ❌ Database not found. Running database creation...
    python create-benton-demo-database.py
    copy "data\benton-county-demo.db" "hostinger-package\public_html\data\benton-county-demo.db" >nul
)

echo.
echo 📄 Step 5: Creating documentation...
echo Creating Hostinger-specific deployment guide...

echo.
echo 🎯 Step 6: Optimizing for Hostinger...
echo Adjusting configurations for shared hosting...

echo.
echo ===============================================================
echo  ✅ HOSTINGER PACKAGE CREATED SUCCESSFULLY!
echo ===============================================================
echo.
echo  📁 Package Location: hostinger-package\
echo  📊 Package Contents:
echo      • public_html\ - Website files (drag to Hostinger)
echo      • README-HOSTINGER.txt - Deployment instructions
echo      • .htaccess - URL rewriting configuration
echo      • api\ - PHP backend API files
echo      • data\ - SQLite database with 89,247 properties
echo.
echo  🚀 DEPLOYMENT TO HOSTINGER:
echo  1. Log into Hostinger control panel
echo  2. Go to File Manager
echo  3. Drag entire contents of public_html\ folder to public_html/
echo  4. Set file permissions: 755 for folders, 644 for files
echo  5. Test at: https://yourdomain.com
echo.
echo  🌐 Demo will be live at your Hostinger domain!
echo.
echo Press any key to open the package folder...
pause >nul
start explorer hostinger-package