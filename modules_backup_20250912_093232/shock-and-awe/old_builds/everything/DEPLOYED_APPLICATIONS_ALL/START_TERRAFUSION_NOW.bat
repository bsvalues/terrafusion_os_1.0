@echo off
echo ==========================================
echo  🚀 Starting TerraFusion Applications...
echo ==========================================

REM Change to the correct directory
cd /d "C:\Users\bs\Desktop\TerraFusion_Final_Build_20250615_051930\DEPLOYED_APPLICATIONS"
echo Current directory: %CD%

echo.
echo ✅ Starting TerraFusion Build Enterprise...
start "TerraFusion Build" cmd /c "python terrafusion_build_ENTERPRISE_COMPLETE.py & pause"

timeout /t 3 /nobreak >nul

echo ✅ Starting TerraFusion Playground...
cd TerraFusionPlayground_PRODUCTION
start "TerraFusion Playground" cmd /c "python start_playground.py & pause"

timeout /t 5 /nobreak >nul

echo.
echo ✅ Opening applications in browser...
start http://localhost:\${{TF_API_PORT:-5000}}
timeout /t 2 /nobreak >nul
start http://localhost:\${{TF_API_PORT:-5000}}

echo.
echo ==========================================
echo  🎉 TerraFusion Applications Starting!
echo ==========================================
echo  - TerraFusion Build: http://localhost:\${{TF_API_PORT:-5000}}
echo  - TerraFusion Playground: http://localhost:\${{TF_API_PORT:-5000}}
echo ==========================================
pause 