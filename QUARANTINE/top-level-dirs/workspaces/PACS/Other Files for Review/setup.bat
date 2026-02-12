@echo off
echo Setting up Property Analysis & Valuation System...

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js from https://nodejs.org/
    echo After installing Node.js, run this script again.
    pause
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo npm is not installed. Please install Node.js from https://nodejs.org/
    echo After installing Node.js, run this script again.
    pause
    exit /b 1
)

:: Install dependencies
echo Installing dependencies...
call npm install

:: Create necessary directories if they don't exist
if not exist "components" mkdir components
if not exist "components\common" mkdir components\common
if not exist "components\charts" mkdir components\charts
if not exist "components\metrics" mkdir components\metrics
if not exist "components\maps" mkdir components\maps
if not exist "components\views" mkdir components\views
if not exist "pages" mkdir pages
if not exist "styles" mkdir styles
if not exist "public" mkdir public

echo Setup complete! You can now start the development server with:
echo npm run dev

pause
