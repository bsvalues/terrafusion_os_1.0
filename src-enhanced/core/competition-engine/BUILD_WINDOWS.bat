@echo off
REM TerraFusion Championship Build Script for Windows
REM No OpenSSL issues, no webkit issues - just works!

echo ========================================
echo   TerraFusion County OS - Windows Build
echo ========================================
echo.

cd /d "%~dp0"

REM Check for Rust
where rustc >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Rust is not installed!
    echo Please install from: https://rustup.rs/
    pause
    exit /b 1
)

REM Check for Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Installing Node dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)

echo.
echo [3/4] Building Tauri app...
cd src-tauri
cargo build --release
if %errorlevel% neq 0 (
    echo ERROR: Rust build failed!
    pause
    exit /b 1
)

echo.
echo [4/4] Build complete!
echo.
echo ========================================
echo   SUCCESS! Your executable is ready:
echo   src-tauri\target\release\terrafusion-county-os.exe
echo ========================================
echo.
echo Run it with: src-tauri\target\release\terrafusion-county-os.exe
echo.
pause