@echo off
title Upload to TerraFusionMarket.io - MANUAL METHOD
color 0E

echo.
echo ========================================================================
echo         UPLOAD YOUR FILES TO TERRAFUSIONMARKET.IO
echo ========================================================================
echo.
echo Your files are ready in: shock-and-awe\build\
echo.
echo ========================================================================
echo         METHOD 1: HOSTINGER FILE MANAGER (EASIEST)
echo ========================================================================
echo.
echo 1. Go to: https://hpanel.hostinger.com
echo 2. Login to your Hostinger account
echo 3. Click: Files -^> File Manager
echo 4. Navigate to: public_html
echo 5. Click: Upload Files (top menu)
echo 6. Select ALL files from: shock-and-awe\build\
echo    - Select all 12 files including .htaccess
echo 7. Click Upload
echo.
echo Your site will be live immediately!
echo.
pause

echo.
echo ========================================================================
echo         METHOD 2: FILEZILLA (PROFESSIONAL)
echo ========================================================================
echo.
echo 1. Download FileZilla: https://filezilla-project.org/
echo 2. Install and open FileZilla
echo 3. Enter these connection details:
echo.
echo    Host: ftp.terrafusionmarket.io
echo    Username: u240968583.admin
echo    Password: [your password]
echo    Port: 21
echo.
echo 4. Click "Quickconnect"
echo 5. Navigate to: /home/u240968583/domains/terrafusionmarket.io/public_html
echo 6. On left side, navigate to: shock-and-awe\build\
echo 7. Select all files and drag to right side
echo.
pause

echo.
echo ========================================================================
echo         METHOD 3: WINDOWS EXPLORER FTP
echo ========================================================================
echo.
echo 1. Open Windows Explorer (Win+E)
echo 2. In address bar, type:
echo    ftp://u240968583.admin@ftp.terrafusionmarket.io
echo 3. Enter your password when prompted
echo 4. Navigate to: /home/u240968583/domains/terrafusionmarket.io/public_html
echo 5. Open another Explorer window to: shock-and-awe\build\
echo 6. Drag and drop all files
echo.
pause

echo.
echo ========================================================================
echo         FILES TO UPLOAD (12 total):
echo ========================================================================
echo.
dir /b shock-and-awe\build\
echo.
echo ========================================================================
echo.
echo After uploading, visit: https://terrafusionmarket.io
echo.
echo Opening the build folder for you...
explorer shock-and-awe\build\
echo.
pause
