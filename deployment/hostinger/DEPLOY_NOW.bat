@echo off
title Quick Deploy to TerraFusionMarket.io
color 0A

echo.
echo ========================================================================
echo         DEPLOYING TO TERRAFUSIONMARKET.IO
echo ========================================================================
echo.
echo   FTP Server: 82.198.236.1
echo   Username: u240968583.terrafusionmarket.io
echo.
echo ========================================================================
echo.

echo [1] Testing FTP Connection...
powershell -ExecutionPolicy Bypass -File "hostinger\deploy-ftp.ps1" test

echo.
echo [2] Starting Deployment...
echo.
echo NOTE: You will need to enter your FTP password
echo.

powershell -ExecutionPolicy Bypass -File "hostinger\deploy-ftp.ps1" deploy

echo.
echo ========================================================================
echo.
echo If deployment was successful, visit:
echo https://terrafusionmarket.io
echo.
pause
