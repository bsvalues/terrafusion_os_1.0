@echo off 
echo Starting TerraFusion Ultimate IDE... 
cd /d "%~dp0" 
echo. 
echo [1/3] Starting Backend API... 
start "TerraFusion Backend" cmd /k "cd Backend && dotnet run --project TerraFusion.API --urls http://localhost:5000" 
timeout /t 5 /nobreak >nul 
echo [2/3] Starting Frontend IDE... 
start "TerraFusion IDE" cmd /k "cd IDE && npm run dev" 
timeout /t 3 /nobreak >nul 
echo [3/3] Opening IDE in browser... 
start http://localhost:5173 
echo. 
echo TerraFusion Ultimate IDE is starting up! 
echo Frontend: http://localhost:5173 
echo Backend: http://localhost:5000 
echo. 
pause 
