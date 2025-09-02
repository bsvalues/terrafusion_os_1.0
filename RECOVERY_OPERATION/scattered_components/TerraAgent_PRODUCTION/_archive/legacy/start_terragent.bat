@echo off
echo ==========================================
echo TerraAgent Production - Startup Script
echo ==========================================
echo.

echo Setting environment variables...
set DATABASE_URL=postgresql://postgres:terrafusion2024@localhost:5432/terrafusion_dev
set FLASK_ENV=production
set FLASK_APP=app.py
set SESSION_SECRET=terrafusion-enterprise-secret-key

echo Environment variables set:
echo DATABASE_URL=%DATABASE_URL%
echo FLASK_ENV=%FLASK_ENV%
echo FLASK_APP=%FLASK_APP%
echo.

echo Starting TerraAgent Production Server...
echo Server will be available at: http://localhost:5003
echo.

py app.py

pause 