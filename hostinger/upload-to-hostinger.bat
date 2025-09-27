@echo off
echo TerraFusionMarket.io FTP Upload
echo ================================
echo.
echo FTP Configuration:
echo Host: 82.198.236.1
echo Username: u240968583.terrafusionmarket.io
echo Port: 21
echo Remote Path: /public_html
echo.
echo Files to upload from: .\shock-and-awe\build
echo.
pause

echo Creating FTP script...
(
echo open 82.198.236.1 21
echo user u240968583.terrafusionmarket.io
echo binary
echo cd /public_html
echo put "C:\Users\bsval\terrafusion_os_1.0\shock-and-awe\build\.htaccess" ".htaccess"
echo put "C:\Users\bsval\terrafusion_os_1.0\shock-and-awe\build\automated-sales-funnel.mjs" "automated-sales-funnel.mjs"
echo put "C:\Users\bsval\terrafusion_os_1.0\shock-and-awe\build\competitive-destroyer.mjs" "competitive-destroyer.mjs"
echo put "C:\Users\bsval\terrafusion_os_1.0\shock-and-awe\build\county-data-engine.mjs" "county-data-engine.mjs"
echo put "C:\Users\bsval\terrafusion_os_1.0\shock-and-awe\build\empire-dashboard.html" "empire-dashboard.html"
echo put "C:\Users\bsval\terrafusion_os_1.0\shock-and-awe\build\gis-3d-visualization.html" "gis-3d-visualization.html"
echo put "C:\Users\bsval\terrafusion_os_1.0\shock-and-awe\build\index.html" "index.html"
echo put "C:\Users\bsval\terrafusion_os_1.0\shock-and-awe\build\instant-demo-generator.mjs" "instant-demo-generator.mjs"
echo put "C:\Users\bsval\terrafusion_os_1.0\shock-and-awe\build\revenue-maximizer-engine.mjs" "revenue-maximizer-engine.mjs"
echo put "C:\Users\bsval\terrafusion_os_1.0\shock-and-awe\build\terrafusion-marketplace-landing.html" "terrafusion-marketplace-landing.html"
echo put "C:\Users\bsval\terrafusion_os_1.0\shock-and-awe\build\terrafusion-sync-conversion-theater.mjs" "terrafusion-sync-conversion-theater.mjs"
echo put "C:\Users\bsval\terrafusion_os_1.0\shock-and-awe\build\viral-growth-engine.mjs" "viral-growth-engine.mjs"
echo bye
) > ftp_commands.txt

echo.
echo Running FTP...
ftp -n -s:ftp_commands.txt
del ftp_commands.txt

echo.
echo Upload complete!
pause
