@echo off
cd /d "c:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.API"
set ASPNETCORE_ENVIRONMENT=Development
set ASPNETCORE_URLS=http://localhost:\${{TF_ADMIN_PORT:-8080}}
echo Starting TerraFusion Backend API...
dotnet run
pause
