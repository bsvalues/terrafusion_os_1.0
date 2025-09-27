@echo off
echo.
echo ========================================
echo  TERRAFUSION ULTIMATE IDE PACKAGING
echo ========================================
echo.
echo Creating standalone package for TerraFusion Ultimate IDE...
echo.

set PACKAGE_DIR=TERRAFUSION_ULTIMATE_STANDALONE
set TIMESTAMP=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

if exist %PACKAGE_DIR% rmdir /s /q %PACKAGE_DIR%
mkdir %PACKAGE_DIR%
mkdir %PACKAGE_DIR%\IDE
mkdir %PACKAGE_DIR%\Backend
mkdir %PACKAGE_DIR%\Database
mkdir %PACKAGE_DIR%\Documentation
mkdir %PACKAGE_DIR%\Scripts
mkdir %PACKAGE_DIR%\Config
mkdir %PACKAGE_DIR%\Assets

echo [1/8] Copying IDE files...
xcopy /E /I /Y "src" "%PACKAGE_DIR%\IDE\src"
copy "package.json" "%PACKAGE_DIR%\IDE\"
copy "tsconfig.json" "%PACKAGE_DIR%\IDE\"
copy "vite.config.ts" "%PACKAGE_DIR%\IDE\"
copy "index.html" "%PACKAGE_DIR%\IDE\"
copy "tailwind.config.js" "%PACKAGE_DIR%\IDE\"
copy "postcss.config.js" "%PACKAGE_DIR%\IDE\"

echo [2/8] Copying backend files...
xcopy /E /I /Y "..\..\..\backend" "%PACKAGE_DIR%\Backend\"

echo [3/8] Copying documentation...
xcopy /E /I /Y "docs" "%PACKAGE_DIR%\Documentation\"
copy "README.md" "%PACKAGE_DIR%\Documentation\"

echo [4/8] Copying scripts and tools...
xcopy /E /I /Y "installer" "%PACKAGE_DIR%\Scripts\"
xcopy /E /I /Y "launcher" "%PACKAGE_DIR%\Scripts\"
xcopy /E /I /Y "uninstaller" "%PACKAGE_DIR%\Scripts\"
xcopy /E /I /Y "system" "%PACKAGE_DIR%\Scripts\"

echo [5/8] Creating configuration files...
echo # TerraFusion Ultimate IDE Configuration > "%PACKAGE_DIR%\Config\terrafusion.config"
echo IDE_PORT=\${{TF_PORT_5173:-5173}} >> "%PACKAGE_DIR%\Config\terrafusion.config"
echo BACKEND_PORT=\${{TF_PORT_5173:-5173}} >> "%PACKAGE_DIR%\Config\terrafusion.config"
echo DATABASE_TYPE=sqlite >> "%PACKAGE_DIR%\Config\terrafusion.config"
echo ENVIRONMENT=production >> "%PACKAGE_DIR%\Config\terrafusion.config"

echo [6/8] Creating startup scripts...
echo @echo off > "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo echo Starting TerraFusion Ultimate IDE... >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo cd /d "%%~dp0" >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo echo. >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo echo [1/3] Starting Backend API... >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo start "TerraFusion Backend" cmd /k "cd Backend && dotnet run --project TerraFusion.API --urls http://localhost:\${{TF_API_PORT:-5000}}" >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo timeout /t 5 /nobreak ^>nul >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo echo [2/3] Starting Frontend IDE... >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo start "TerraFusion IDE" cmd /k "cd IDE && npm run dev" >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo timeout /t 3 /nobreak ^>nul >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo echo [3/3] Opening IDE in browser... >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo start http://localhost:\${{TF_API_PORT:-5000}} >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo echo. >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo echo TerraFusion Ultimate IDE is starting up! >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo echo Frontend: http://localhost:\${{TF_API_PORT:-5000}} >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo echo Backend: http://localhost:\${{TF_API_PORT:-5000}} >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo echo. >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"
echo pause >> "%PACKAGE_DIR%\START_TERRAFUSION_ULTIMATE.bat"

echo @echo off > "%PACKAGE_DIR%\STOP_TERRAFUSION_ULTIMATE.bat"
echo echo Stopping TerraFusion Ultimate IDE... >> "%PACKAGE_DIR%\STOP_TERRAFUSION_ULTIMATE.bat"
echo taskkill /f /im "dotnet.exe" 2^>nul >> "%PACKAGE_DIR%\STOP_TERRAFUSION_ULTIMATE.bat"
echo taskkill /f /im "node.exe" 2^>nul >> "%PACKAGE_DIR%\STOP_TERRAFUSION_ULTIMATE.bat"
echo echo TerraFusion Ultimate IDE stopped. >> "%PACKAGE_DIR%\STOP_TERRAFUSION_ULTIMATE.bat"
echo pause >> "%PACKAGE_DIR%\STOP_TERRAFUSION_ULTIMATE.bat"

echo [7/8] Creating package information...
echo TerraFusion Ultimate IDE - Standalone Package > "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo ================================================ >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo. >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo Package Created: %date% %time% >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo Version: 1.0.0 Ultimate >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo. >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo CONTENTS: >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo - Complete IDE with Monaco Editor >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo - AI Chat Integration >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo - Hybrid Agent System >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo - ML Optimization Dashboard >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo - Government Agents Dashboard >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo - Full .NET 8 Backend >> "%PACKAGE_INFO.txt"
echo - Entity Framework Core >> "%PACKAGE_INFO.txt"
echo - PostgreSQL/SQLite Support >> "%PACKAGE_INFO.txt"
echo - Complete Documentation >> "%PACKAGE_INFO.txt"
echo. >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo QUICK START: >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo 1. Run START_TERRAFUSION_ULTIMATE.bat >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo 2. Wait for services to start >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo 3. Access IDE at http://localhost:\${{TF_API_PORT:-5000}} >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo. >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo REQUIREMENTS: >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo - .NET 8.0 SDK >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo - Node.js 18+ >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo - 8GB RAM minimum >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo - Windows 10/11 >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"

echo [8/8] Creating deployment package...
set FINAL_PACKAGE=TERRAFUSION_ULTIMATE_STANDALONE_%TIMESTAMP%.zip
powershell -command "Compress-Archive -Path '%PACKAGE_DIR%' -DestinationPath '%FINAL_PACKAGE%' -Force"

echo.
echo ========================================
echo  PACKAGING COMPLETE!
echo ========================================
echo.
echo Package created: %FINAL_PACKAGE%
echo Package size: 
for %%A in (%FINAL_PACKAGE%) do echo %%~zA bytes
echo.
echo Package contents:
echo - Complete TerraFusion Ultimate IDE
echo - Full .NET 8 Backend
echo - AI Integration & Agent Systems
echo - Complete Documentation
echo - Startup & Management Scripts
echo.
echo To deploy:
echo 1. Extract %FINAL_PACKAGE%
echo 2. Run START_TERRAFUSION_ULTIMATE.bat
echo 3. Access IDE at http://localhost:\${{TF_API_PORT:-5000}}
echo.
echo Press any key to continue...
pause >nul
