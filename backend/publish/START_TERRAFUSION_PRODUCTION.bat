@echo off
echo ========================================
echo    TERRAFUSION OS 1.0 - PRODUCTION
echo ========================================
echo.
echo Starting TerraFusion Production API...
echo.

REM Set production environment variables
set ASPNETCORE_ENVIRONMENT=Production
set ASPNETCORE_PORT=\${{TF_API_PORT:-5000}}
set ASPNETCORE_URLS=http://localhost:\${{TF_API_PORT:-5000}}

REM Start the production API
echo Starting API on port %ASPNETCORE_PORT%...
echo Environment: %ASPNETCORE_ENVIRONMENT%
echo.
echo API will be available at: http://localhost:%ASPNETCORE_PORT%
echo Health check: http://localhost:%ASPNETCORE_PORT%/health
echo.
echo Press Ctrl+C to stop the server
echo.

TerraFusion.API.exe

pause
