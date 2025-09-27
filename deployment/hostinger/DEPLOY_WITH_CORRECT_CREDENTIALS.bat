@echo off
title Deploy to TerraFusionMarket.io - CORRECT CREDENTIALS
color 0A

echo.
echo ========================================================================
echo         DEPLOYING TO TERRAFUSIONMARKET.IO
echo ========================================================================
echo.
echo   CORRECT FTP CREDENTIALS:
echo   ------------------------
echo   Host: ftp.terrafusionmarket.io
echo   Username: u240968583.admin
echo   Path: /home/u240968583/domains/terrafusionmarket.io/public_html
echo.
echo ========================================================================
echo.

echo [*] Testing connection with correct credentials...
echo.

powershell -ExecutionPolicy Bypass -Command "$ftpUrl = 'ftp://ftp.terrafusionmarket.io/'; try { $client = New-Object System.Net.WebClient; $client.Credentials = New-Object System.Net.NetworkCredential('u240968583.admin', ''); Write-Host '[+] FTP server reachable' -ForegroundColor Green } catch { Write-Host '[-] Connection test failed' -ForegroundColor Red }"

echo.
echo [*] Starting deployment with CORRECT credentials...
echo.

powershell -ExecutionPolicy Bypass -File "hostinger\deploy-correct-ftp.ps1"

echo.
echo ========================================================================
echo.
pause
