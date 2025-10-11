@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    TerraFusion OS 1.0 - Starting Up    
echo ========================================
echo.

echo [BACKEND] Starting API server on port 5000...
start /B dotnet run --project backend\TerraFusion.API --urls "http://localhost:5000"

timeout /t 5 /nobreak > nul

echo [BACKEND] Checking API health...
powershell -Command "try { $response = Invoke-RestMethod -Uri 'http://localhost:5000/health' -Method Get -TimeoutSec 2; Write-Host '[BACKEND] API Status:' $response.status -ForegroundColor Green } catch { Write-Host '[BACKEND] API starting...' -ForegroundColor Yellow }"

echo.
echo [FRONTEND] Starting React application on port 3000...
cd frontend
if not exist node_modules (
    echo [FRONTEND] Installing dependencies...
    call npm install
)
start /B npm start
cd ..

timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo    TerraFusion OS 1.0 - Running!       
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo Health Check: http://localhost:5000/health
echo API Test: http://localhost:5000/api/test
echo.
echo Starting browser...
timeout /t 3 /nobreak > nul
start http://localhost:3000

echo.
echo Press any key to stop all services...
pause > nul

echo.
echo Stopping services...
taskkill /F /IM dotnet.exe 2>nul
taskkill /F /IM node.exe 2>nul
echo Services stopped.
endlocal

