@echo off
setlocal
title TerraFusion Kernel Launcher (CMD)
color 0B

echo ===================================================
echo   TERRAFUSION KERNEL - DIRECT LAUNCH PROTOCOL
echo ===================================================
echo.

:: 1. Cleanup
taskkill /F /IM deno.exe /T >nul 2>&1

:: 2. Environment Setup
set POSTGRES_HOST=localhost
set POSTGRES_PORT=5433
set POSTGRES_DB=postgres
set POSTGRES_USER=postgres
set POSTGRES_PASSWORD=postgres

:: 3. Key Injection
echo.
echo [SECURITY] API Key Injection Required for Neural Link
echo (Leave empty to run in HEURISTIC MODE)
echo.
set /p "OPENAI_API_KEY=Enter OpenAI API Key > "

:: 4. Launch
echo.
echo ---------------------------------------------------
if defined OPENAI_API_KEY (
    echo [INFO] API Key Injected. Launching in AI Mode...
) else (
    echo [WARN] No API Key. Launching in Fallback Mode...
)
echo ---------------------------------------------------
echo.

cd "C:\Users\bsval\terrafusion_os_1.0\os-kernel\api"
deno run --allow-net --allow-env --allow-read main.ts

pause